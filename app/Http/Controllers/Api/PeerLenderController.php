<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ItemResource;
use App\Mail\PeerIntakeVerifiedMail;
use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PeerLenderController extends Controller
{
    /**
     * Retrieve peer lender's personal equipment inventory and performance metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->is_peer_lender) {
            return response()->json([
                'message' => 'Access restricted: Peer lending privileges required.',
            ], 403);
        }

        $items = Item::where('owner_user_id', $user->_id)
            ->orderBy('created_at', 'desc')
            ->get();

        $itemIds = $items->pluck('_id')->toArray();

        // Retrieve historical and active rentals for these items
        $rentals = Rental::whereIn('item_id', $itemIds)->get();

        $activeLoans = $items->whereIn('availability_stat', ['reserved', 'rented'])->count();
        $completedLoans = $rentals->where('status', 'returned')->count();

        // Calculate total earnings from returned or active rentals
        $totalEarnings = $rentals->whereIn('status', ['returned', 'active'])
            ->sum(function ($r) {
                return (float) ($r->financials['total_fee'] ?? 0.0);
            });

        $returnedRentals = $rentals->where('status', 'returned');

        $unclaimedEarnings = $returnedRentals
            ->filter(fn ($r) => ($r->financials['payout_status'] ?? 'unclaimed') !== 'settled')
            ->sum(fn ($r) => (float) ($r->financials['total_fee'] ?? 0.0));

        $settledEarnings = $returnedRentals
            ->filter(fn ($r) => ($r->financials['payout_status'] ?? 'unclaimed') === 'settled')
            ->sum(fn ($r) => (float) ($r->financials['total_fee'] ?? 0.0));

        $metrics = [
            'total_listed' => $items->count(),
            'active_loans' => $activeLoans,
            'completed_loans' => $completedLoans,
            'total_earnings' => round($totalEarnings, 2),
            'unclaimed_earnings' => round($unclaimedEarnings, 2),
            'settled_earnings' => round($settledEarnings, 2),
            'pending_intake' => $items->where('availability_stat', 'pending_intake')->count(),
        ];

        $payoutLedger = $returnedRentals
            ->sortByDesc(fn ($r) => $r->schedule['returned_time'] ?? $r->updated_at?->toIso8601String() ?? '')
            ->values()
            ->map(fn ($r) => [
                'id' => (string) $r->_id,
                'rental_code' => $r->rental_code,
                'item_name' => $r->item_snapshot['name'] ?? ($items->firstWhere('_id', $r->item_id)?->name ?? 'Peer Equipment'),
                'item_code' => $r->item_snapshot['item_code'] ?? ($items->firstWhere('_id', $r->item_id)?->item_code ?? '—'),
                'returned_time' => $r->schedule['returned_time'] ?? null,
                'total_fee' => round((float) ($r->financials['total_fee'] ?? 0.0), 2),
                'payout_status' => $r->financials['payout_status'] ?? 'unclaimed',
                'payout_settled_at' => $r->financials['payout_settled_at'] ?? null,
                'payout_settled_by_name' => $r->financials['payout_settled_by_name'] ?? null,
            ]);

        return response()->json([
            'metrics' => $metrics,
            'items' => ItemResource::collection($items),
            'rentals' => $payoutLedger,
        ]);
    }

    /**
     * Register a new equipment listing draft for Facility Desk physical intake.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->is_peer_lender) {
            return response()->json([
                'message' => 'Access restricted: Peer lending privileges required.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:Laboratory Attire,Computation,Electronics,General',
            'rental_rate_flat' => 'nullable|numeric|min:0',
            'rental_rate_hr' => 'nullable|numeric|min:0',
            'deposit_required' => 'nullable|boolean',
            'specs' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        // Generate unique P2P item code e.g. EQ-P2P-1042
        do {
            $code = 'EQ-P2P-' . strtoupper(Str::random(4));
        } while (Item::where('item_code', $code)->exists());

        $rate = round((float) ($validated['rental_rate_flat'] ?? $validated['rental_rate_hr'] ?? 0.0), 2);

        // Status initialized to 'pending_intake' until student physically brings gear to facility desk
        $item = Item::create([
            'item_code' => $code,
            'name' => $validated['name'],
            'category' => $validated['category'],
            'owner_type' => 'student',
            'owner_user_id' => $user->_id,
            'rental_rate_flat' => $rate,
            'rental_rate_hr' => $rate,
            'deposit_required' => (bool) ($validated['deposit_required'] ?? false),
            'availability_stat' => 'pending_intake',
            'tags' => $validated['tags'] ?? ['p2p', 'student-owned'],
            'specs' => $validated['specs'] ?? [],
        ]);

        Cache::forget('equiply_category_counts');

        return response()->json([
            'message' => "Equipment listing [{$item->item_code}] registered. Please bring the item to the Facility Operations Desk for intake inspection.",
            'item' => new ItemResource($item),
        ], 201);
    }

    /**
     * Update rental rate or specifications for owned equipment.
     * Blocked if currently 'reserved' or 'rented'.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $item = Item::where('_id', $id)
            ->where('owner_user_id', $user->_id)
            ->firstOrFail();

        // Recall & Mutation Safeguard
        if (in_array($item->availability_stat, ['reserved', 'rented'])) {
            return response()->json([
                'message' => "Modification locked: Cannot edit equipment while it is '{$item->availability_stat}'.",
            ], 422);
        }

        $validated = $request->validate([
            'rental_rate_flat' => 'nullable|numeric|min:0',
            'rental_rate_hr' => 'nullable|numeric|min:0',
            'deposit_required' => 'nullable|boolean',
            'specs' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        if (array_key_exists('rental_rate_flat', $validated) || array_key_exists('rental_rate_hr', $validated)) {
            $rate = round((float) ($validated['rental_rate_flat'] ?? $validated['rental_rate_hr'] ?? 0.0), 2);
            $item->rental_rate_flat = $rate;
            $item->rental_rate_hr = $rate;
        }
        if (array_key_exists('deposit_required', $validated)) {
            $item->deposit_required = (bool) $validated['deposit_required'];
        }
        if (array_key_exists('specs', $validated)) {
            $item->specs = $validated['specs'];
        }
        if (array_key_exists('tags', $validated)) {
            $item->tags = $validated['tags'];
        }

        $item->save();
        Cache::forget('equiply_category_counts');

        return response()->json([
            'message' => "Listing [{$item->item_code}] successfully updated.",
            'item' => new ItemResource($item),
        ]);
    }

    /**
     * Recall or withdraw equipment listing from active circulation.
     * Enforces safeguard: Cannot recall if 'reserved' or 'rented'.
     */
    public function toggleRecall(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $item = Item::where('_id', $id)
            ->where('owner_user_id', $user->_id)
            ->firstOrFail();

        // Recall Safeguard
        if (in_array($item->availability_stat, ['reserved', 'rented'])) {
            return response()->json([
                'message' => "Recall locked: Cannot withdraw equipment while it is '{$item->availability_stat}'.",
            ], 422);
        }

        if ($item->availability_stat === 'withdrawn') {
            // Restore to facility intake queue
            $item->availability_stat = 'pending_intake';
            $action = 're-queued for desk intake';
        } else {
            // Withdraw/archive listing
            $item->availability_stat = 'withdrawn';
            $action = 'withdrawn from catalog';
        }

        $item->save();
        Cache::forget('equiply_category_counts');

        return response()->json([
            'message' => "Equipment [{$item->item_code}] {$action}.",
            'item' => new ItemResource($item),
        ]);
    }

    /**
     * Custodian / Admin desk verification: Confirm physical intake and activate in public catalog.
     */
    public function verifyIntake(Request $request, string $id): JsonResponse
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'custodian') {
            return response()->json([
                'message' => 'Access restricted: Custodian credentials required.',
            ], 403);
        }

        $item = Item::findOrFail($id);

        if ($item->availability_stat !== 'pending_intake') {
            return response()->json([
                'message' => "Item [{$item->item_code}] is currently '{$item->availability_stat}', not awaiting intake.",
            ], 422);
        }

        $item->availability_stat = 'available';
        $item->save();
        $item->load('owner');

        Cache::forget('equiply_category_counts');

        $owner = $item->owner ?? ($item->owner_user_id ? User::find($item->owner_user_id) : null);
        if ($owner?->email) {
            Mail::to($owner->email)->send(new PeerIntakeVerifiedMail($item, $owner));
        }

        return response()->json([
            'message' => "Equipment [{$item->item_code}] verified and active in campus catalog.",
            'item' => new ItemResource($item),
        ]);
    }

    /**
     * Custodian payout settlement: Mark a completed student-owned P2P rental's earnings as settled.
     */
    public function settlePayout(Request $request, string $id): JsonResponse
    {
        $custodian = $request->user();
        if ($custodian->role !== 'custodian') {
            return response()->json([
                'message' => 'Access restricted: Only facility custodians can disburse peer lender payouts.',
            ], 403);
        }

        $rental = Rental::with(['item', 'borrower', 'custodian'])
            ->where('_id', $id)
            ->orWhere('rental_code', $id)
            ->firstOrFail();

        $ownerType = $rental->item?->owner_type ?? ($rental->item_snapshot['owner_type'] ?? null);
        if ($ownerType !== 'student') {
            return response()->json([
                'message' => 'Payout settlement is only applicable to student-owned peer-to-peer rentals.',
            ], 422);
        }

        if ($rental->status !== 'returned') {
            return response()->json([
                'message' => "Cannot settle payout for rental with status '{$rental->status}'. Rental must be returned first.",
            ], 422);
        }

        $financials = $rental->financials ?? [];
        if (($financials['payout_status'] ?? 'unclaimed') === 'settled') {
            return response()->json([
                'message' => 'Payout for this rental has already been settled.',
            ], 422);
        }

        $financials['payout_status'] = 'settled';
        $financials['payout_settled_at'] = now()->toIso8601String();
        $financials['payout_settled_by'] = (string) $custodian->_id;
        $financials['payout_settled_by_name'] = $custodian->name;

        $rental->financials = $financials;
        $rental->save();

        return response()->json([
            'message' => "Peer lender payout settled for rental [{$rental->rental_code}].",
            'rental' => new \App\Http\Resources\RentalResource($rental),
        ]);
    }
}

