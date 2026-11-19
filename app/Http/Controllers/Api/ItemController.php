<?php

namespace App\Http\Controllers\Api;

use App\Events\CatalogUpdated;
use App\Events\CustodianOperationsUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\ItemResource;
use App\Models\Item;
use App\Models\Rental;
use App\Support\RealtimeBroadcaster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class ItemController extends Controller
{
    /**
     * Display a listing of items with category, availability filtering, and keyword search.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        Rental::expireUnclaimedReservations();

        $query = Item::query()->with('owner');

        // Filter by category
        if ($request->filled('category') && $request->input('category') !== 'all') {
            $query->where('category', $request->input('category'));
        }

        // Filter by availability status
        if ($request->filled('availability') && $request->input('availability') !== 'all') {
            $query->where('availability_stat', $request->input('availability'));
        } elseif ($request->filled('availability_stat')) {
            $query->where('availability_stat', $request->input('availability_stat'));
        }

        // Filter by owner type (facility vs student peer-to-peer)
        if ($request->filled('owner_type') && $request->input('owner_type') !== 'all') {
            $query->where('owner_type', $request->input('owner_type'));
        }

        // Keyword search across item name, code, tags, and category
        if ($request->filled('search') || $request->filled('q')) {
            $term = trim($request->input('search') ?? $request->input('q'));
            if ($term !== '') {
                $query->where(function ($sub) use ($term) {
                    $sub->where('name', 'like', "%{$term}%")
                        ->orWhere('item_code', 'like', "%{$term}%")
                        ->orWhere('category', 'like', "%{$term}%")
                        ->orWhere('tags', 'like', "%{$term}%");
                });
            }
        }

        // Sort order
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $allowedSorts = ['name', 'category', 'rental_rate_hr', 'created_at', 'item_code'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, strtolower($sortOrder) === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) $request->input('per_page', 24);
        $items = $query->paginate($perPage);

        return ItemResource::collection($items);
    }

    /**
     * Display the specified item by ID or item_code.
     */
    public function show(string $id): ItemResource
    {
        Rental::expireUnclaimedReservations();

        $item = Item::with('owner')
            ->where('_id', $id)
            ->orWhere('item_code', $id)
            ->firstOrFail();

        return new ItemResource($item);
    }

    /**
     * Retrieve available categories with their item counts.
     * Optimized into a single query + short cache to avoid N+1 remote Atlas round-trips.
     */
    public function categories(): JsonResponse
    {
        Rental::expireUnclaimedReservations();

        $data = Cache::remember('equiply_category_counts', 15, function () {
            $categories = [
                'Laboratory Attire',
                'Computation',
                'Electronics',
                'General',
            ];

            // 1 single query retrieving only the necessary fields
            $items = Item::select(['category', 'availability_stat'])->get();

            $counts = [];
            $totalAvailable = $items->where('availability_stat', 'available')->count();
            $otherItems = $items->filter(fn ($i) => ! in_array($i->category, $categories, true));

            foreach ($categories as $cat) {
                $catItems = $items->where('category', $cat);
                if ($cat === 'General' && $otherItems->isNotEmpty()) {
                    $catItems = $catItems->concat($otherItems);
                }
                $availCount = $catItems->where('availability_stat', 'available')->count();

                $counts[] = [
                    'name' => $cat,
                    'total_items' => $catItems->count(),
                    'available_items' => $availCount,
                ];
            }

            return [
                'categories' => $counts,
                'total_all' => $items->count(),
                'total_available' => $totalAvailable,
            ];
        });

        return response()->json($data);
    }

    /**
     * Store a newly created item in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! in_array($user->role, ['custodian', 'admin'])) {
            return response()->json([
                'message' => 'Access restricted: Only facility custodians or administrators can register inventory directly.',
            ], 403);
        }

        $validated = $request->validate([
            'item_code' => 'required|string|unique:items,item_code',
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'owner_type' => 'required|in:facility,student',
            'rental_rate_flat' => 'nullable|numeric|min:0',
            'rental_rate_hr' => 'nullable|numeric|min:0',
            'deposit_required' => 'nullable|boolean',
            'availability_stat' => 'nullable|in:available,reserved,rented,maintenance,lost',
            'tags' => 'nullable|array',
            'specs' => 'nullable|array',
        ]);

        if ($validated['owner_type'] === 'student') {
            if (($user->role === 'custodian' || $user->role === 'admin') && $request->filled('owner_user_id')) {
                $validated['owner_user_id'] = $request->input('owner_user_id');
            } else {
                $validated['owner_user_id'] = $user->_id;
            }
        } else {
            $validated['owner_user_id'] = null;
        }

        $rate = round((float) ($validated['rental_rate_flat'] ?? $validated['rental_rate_hr'] ?? 0.0), 2);

        $item = Item::create([
            'item_code' => $validated['item_code'],
            'name' => $validated['name'],
            'category' => $validated['category'],
            'owner_type' => $validated['owner_type'],
            'owner_user_id' => $validated['owner_user_id'],
            'rental_rate_flat' => $rate,
            'rental_rate_hr' => $rate,
            'deposit_required' => (bool) ($validated['deposit_required'] ?? false),
            'availability_stat' => $validated['availability_stat'] ?? 'available',
            'tags' => $validated['tags'] ?? [],
            'specs' => $validated['specs'] ?? [],
        ]);

        Cache::forget('equiply_category_counts');

        RealtimeBroadcaster::dispatch(new CatalogUpdated(
            action: 'item_created',
            itemId: (string) $item->_id,
            itemCode: $item->item_code,
            itemName: $item->name,
            availabilityStat: $item->availability_stat,
        ));

        return (new ItemResource($item))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Resolve equipment maintenance and restore item to active catalog.
     */
    public function resolveMaintenance(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'custodian') {
            return response()->json([
                'message' => 'Access restricted: Only facility custodians can resolve item maintenance.',
            ], 403);
        }

        $validated = $request->validate([
            'repair_notes' => 'nullable|string|max:500',
        ]);

        $item = Item::where('_id', $id)->orWhere('item_code', $id)->firstOrFail();

        if ($item->availability_stat !== 'maintenance') {
            return response()->json([
                'message' => "Item [{$item->item_code}] is currently '{$item->availability_stat}', not in maintenance.",
            ], 422);
        }

        $specs = $item->specs ?? [];
        $specs['last_repair_notes'] = $validated['repair_notes'] ?? 'Repaired and inspected at Facility Desk';
        $specs['last_repaired_at'] = now()->toIso8601String();
        $specs['last_repaired_by'] = $user->name;

        $item->availability_stat = 'available';
        $item->specs = $specs;
        $item->save();

        Cache::forget('equiply_category_counts');

        RealtimeBroadcaster::dispatch(new CatalogUpdated(
            action: 'maintenance_resolved',
            itemId: (string) $item->_id,
            itemCode: $item->item_code,
            itemName: $item->name,
            availabilityStat: $item->availability_stat,
        ));
        RealtimeBroadcaster::dispatch(new CustodianOperationsUpdated(
            action: 'maintenance_resolved',
            title: 'Maintenance Resolved',
            message: "{$item->name} ({$item->item_code}) was restored to the active catalog.",
            entityId: (string) $item->_id,
            actorId: (string) $user->_id,
        ));

        return response()->json([
            'message' => "Equipment [{$item->item_code}] maintenance resolved and restored to active catalog.",
            'item' => new ItemResource($item),
        ]);
    }
}
