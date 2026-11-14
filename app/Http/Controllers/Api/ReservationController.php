<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RentalResource;
use App\Mail\EquipmentDispatchedMail;
use App\Mail\EquipmentReturnedReceiptMail;
use App\Mail\PeerItemBorrowedMail;
use App\Mail\PeerItemReturnedMail;
use App\Mail\ReservationConfirmedMail;
use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ReservationController extends Controller
{
    /**
     * Display a listing of reservations/rentals.
     * Students view their own borrowings; custodians/admins can inspect all.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $query = Rental::query()->with(['item', 'borrower', 'custodian']);

        // Role-based visibility
        if ($user->role === 'student') {
            $query->where('borrower_id', $user->_id);
        } elseif ($request->filled('borrower_id')) {
            $query->where('borrower_id', $request->input('borrower_id'));
        }

        // Filter by status
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // Filter by item_id
        if ($request->filled('item_id')) {
            $query->where('item_id', $request->input('item_id'));
        }

        // Search by rental code
        if ($request->filled('search') || $request->filled('q')) {
            $term = trim($request->input('search') ?? $request->input('q'));
            if ($term !== '') {
                $query->where('rental_code', 'like', "%{$term}%");
            }
        }

        $rentals = $query->orderBy('created_at', 'desc')
            ->paginate((int) $request->input('per_page', 20));

        return RentalResource::collection($rentals);
    }

    /**
     * Display the specified rental details.
     */
    public function show(Request $request, string $id): RentalResource
    {
        $rental = Rental::with(['item', 'borrower', 'custodian'])
            ->where('_id', $id)
            ->orWhere('rental_code', $id)
            ->firstOrFail();

        // Enforce student ownership check
        if ($request->user()->role === 'student' && (string) $rental->borrower_id !== (string) $request->user()->_id) {
            abort(403, 'Unauthorized access to this rental record.');
        }

        return new RentalResource($rental);
    }

    /**
     * Atomic reservation creation utilizing a multi-document ACID transaction lock.
     * Enforces that item must be 'available' within the transaction session.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => 'required|string',
            'due_time' => 'required|date|after:now',
            'collateral_held' => 'required|string|max:255',
            'condition_out' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $borrower = $request->user();

        // Strict role segregation: Only student borrowers can reserve equipment
        if ($borrower->role !== 'student') {
            return response()->json([
                'message' => 'Access restricted: Only verified student borrowers can reserve equipment. Facility staff and administrators cannot borrow inventory.',
            ], 403);
        }

        // Multi-document ACID transaction session
        $rental = DB::connection('mongodb')->transaction(function () use ($validated, $borrower) {
            /** @var Item|null $item */
            $item = Item::where('_id', $validated['item_id'])->first();

            if (! $item) {
                abort(404, 'Item not found.');
            }

            // Prevent P2P lenders from reserving their own equipment
            if ($item->owner_type === 'student' && (string) $item->owner_user_id === (string) $borrower->_id) {
                abort(422, 'Self-reservation not permitted: You cannot reserve your own equipment listing.');
            }

            // Strict availability constraint: Must be available
            if ($item->availability_stat !== 'available') {
                abort(409, "Item [{$item->item_code}] is currently '{$item->availability_stat}' and cannot be reserved.");
            }

            // Update item availability state inside the transaction
            $item->availability_stat = 'reserved';
            $item->save();

            // Generate unique rental code e.g. RNT-2026-X89J
            $year = date('Y');
            $rentalCode = 'RNT-' . $year . '-' . strtoupper(Str::random(6));
            while (Rental::where('rental_code', $rentalCode)->exists()) {
                $rentalCode = 'RNT-' . $year . '-' . strtoupper(Str::random(6));
            }

            $dueTime = Carbon::parse($validated['due_time'])->toIso8601String();
            $requestedAt = now()->toIso8601String();

            // Calculate flat rental fee for borrowing checkout session
            $flatRate = (float) ($item->rental_rate_flat ?? $item->rental_rate_hr ?? 30.00);
            $totalFee = round($flatRate, 2);

            // Create immutable embedded document structure
            $rental = Rental::create([
                'rental_code' => $rentalCode,
                'item_id' => $item->_id,
                'borrower_id' => $borrower->_id,
                'custodian_id' => null,
                'status' => 'pending',
                'schedule' => [
                    'requested_at' => $requestedAt,
                    'due_time' => $dueTime,
                    'returned_time' => null,
                ],
                'item_snapshot' => [
                    'name' => $item->name,
                    'owner_type' => $item->owner_type,
                    'owner_id' => $item->owner_user_id,
                ],
                'condition_logs' => [
                    'condition_out' => $validated['condition_out'] ?? 'Good condition upon release',
                    'condition_in' => null,
                ],
                'financials' => [
                    'total_fee' => $totalFee,
                    'collateral_held' => $validated['collateral_held'],
                ],
            ]);

            return $rental;
        });

        $rental->load(['item', 'borrower']);
        Cache::forget('equiply_category_counts');

        if ($rental->borrower?->email) {
            Mail::to($rental->borrower->email)->send(new ReservationConfirmedMail($rental));
        }

        return (new RentalResource($rental))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Custodian checkout facilitation: Dispatches item to borrower, activates rental.
     */
    public function checkout(Request $request, string $id): JsonResponse
    {
        $custodian = $request->user();
        if ($custodian->role !== 'custodian') {
            abort(403, 'Only facility custodians can authorize item checkout dispatch.');
        }

        $rental = DB::connection('mongodb')->transaction(function () use ($id, $custodian) {
            /** @var Rental|null $rental */
            $rental = Rental::where('_id', $id)->orWhere('rental_code', $id)->firstOrFail();

            if (! in_array($rental->status, ['pending', 'reserved'])) {
                abort(422, "Cannot checkout rental with status '{$rental->status}'.");
            }

            $item = Item::where('_id', $rental->item_id)->first();
            if ($item) {
                $item->availability_stat = 'rented';
                $item->save();
            }

            $rental->status = 'active';
            $rental->custodian_id = $custodian->_id;
            $rental->save();

            return $rental;
        });

        $rental->load(['item', 'borrower', 'custodian']);
        Cache::forget('equiply_category_counts');

        if ($rental->borrower?->email) {
            Mail::to($rental->borrower->email)->send(new EquipmentDispatchedMail($rental));
        }

        if (($rental->item?->owner_type ?? $rental->item_snapshot['owner_type'] ?? null) === 'student') {
            $ownerId = $rental->item?->owner_user_id ?? $rental->item_snapshot['owner_id'] ?? null;
            $owner = $ownerId ? User::find($ownerId) : null;
            if ($owner?->email) {
                Mail::to($owner->email)->send(new PeerItemBorrowedMail($rental, $owner));
            }
        }

        return response()->json([
            'message' => "Item successfully checked out to borrower.",
            'rental' => new RentalResource($rental),
        ]);
    }

    /**
     * Custodian check-in / return endpoint: Logs return condition, restores item availability.
     */
    public function checkin(Request $request, string $id): JsonResponse
    {
        $custodian = $request->user();
        if ($custodian->role !== 'custodian') {
            abort(403, 'Only facility custodians can process return check-ins.');
        }

        $validated = $request->validate([
            'condition_in' => 'required|string|max:500',
            'mark_maintenance' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $rental = DB::connection('mongodb')->transaction(function () use ($id, $validated) {
            /** @var Rental|null $rental */
            $rental = Rental::where('_id', $id)->orWhere('rental_code', $id)->firstOrFail();

            if ($rental->status === 'returned') {
                abort(422, 'This rental has already been returned.');
            }

            $markMaintenance = (bool) ($validated['mark_maintenance'] ?? false);

            // Restore item state
            $item = Item::where('_id', $rental->item_id)->first();
            if ($item) {
                $item->availability_stat = $markMaintenance ? 'maintenance' : 'available';
                $item->save();
            }

            // Update rental schedule and condition log
            $schedule = $rental->schedule ?? [];
            $schedule['returned_time'] = now()->toIso8601String();

            $conditionLogs = $rental->condition_logs ?? [];
            $conditionLogs['condition_in'] = $validated['condition_in'];

            $rental->status = 'returned';
            $rental->schedule = $schedule;
            $rental->condition_logs = $conditionLogs;
            $rental->save();

            return $rental;
        });

        $rental->load(['item', 'borrower', 'custodian']);
        Cache::forget('equiply_category_counts');

        if ($rental->borrower?->email) {
            Mail::to($rental->borrower->email)->send(new EquipmentReturnedReceiptMail($rental));
        }

        if (($rental->item?->owner_type ?? $rental->item_snapshot['owner_type'] ?? null) === 'student') {
            $ownerId = $rental->item?->owner_user_id ?? $rental->item_snapshot['owner_id'] ?? null;
            $owner = $ownerId ? User::find($ownerId) : null;
            if ($owner?->email) {
                Mail::to($owner->email)->send(new PeerItemReturnedMail($rental, $owner));
            }
        }

        return response()->json([
            'message' => 'Item successfully returned and checked in.',
            'rental' => new RentalResource($rental),
        ]);
    }

    /**
     * Cancel a pending or reserved reservation.
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $rental = DB::connection('mongodb')->transaction(function () use ($id, $user) {
            /** @var Rental|null $rental */
            $rental = Rental::where('_id', $id)->orWhere('rental_code', $id)->firstOrFail();

            // Strict authorization: Only the borrower student or a facility custodian can cancel reservations
            if ($user->role !== 'custodian' && (string) $rental->borrower_id !== (string) $user->_id) {
                abort(403, 'Unauthorized: Only the borrower or a facility custodian can cancel reservations.');
            }

            if (! in_array($rental->status, ['pending', 'reserved'])) {
                abort(422, "Cannot cancel a rental that is already '{$rental->status}'.");
            }

            $item = Item::where('_id', $rental->item_id)->first();
            if ($item && $item->availability_stat === 'reserved') {
                $item->availability_stat = 'available';
                $item->save();
            }

            $rental->status = 'cancelled';
            $rental->save();

            return $rental;
        });

        Cache::forget('equiply_category_counts');

        return response()->json([
            'message' => 'Reservation successfully cancelled.',
            'rental' => new RentalResource($rental),
        ]);
    }
}
