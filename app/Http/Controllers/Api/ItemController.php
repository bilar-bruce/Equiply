<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ItemResource;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ItemController extends Controller
{
    /**
     * Display a listing of items with category, availability filtering, and keyword search.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
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
        $item = Item::with('owner')
            ->where('_id', $id)
            ->orWhere('item_code', $id)
            ->firstOrFail();

        return new ItemResource($item);
    }

    /**
     * Retrieve available categories with their item counts.
     */
    public function categories(): JsonResponse
    {
        $categories = [
            'Laboratory Attire',
            'Computation',
            'Electronics',
            'General',
        ];

        $counts = [];
        foreach ($categories as $cat) {
            $counts[] = [
                'name' => $cat,
                'total_items' => Item::where('category', $cat)->count(),
                'available_items' => Item::where('category', $cat)->where('availability_stat', 'available')->count(),
            ];
        }

        return response()->json([
            'categories' => $counts,
            'total_all' => Item::count(),
            'total_available' => Item::where('availability_stat', 'available')->count(),
        ]);
    }

    /**
     * Store a newly created item in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'item_code' => 'required|string|unique:items,item_code',
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'owner_type' => 'required|in:facility,student',
            'rental_rate_hr' => 'nullable|numeric|min:0',
            'deposit_required' => 'nullable|boolean',
            'availability_stat' => 'nullable|in:available,reserved,rented,maintenance,lost',
            'tags' => 'nullable|array',
            'specs' => 'nullable|array',
        ]);

        if ($validated['owner_type'] === 'student') {
            $validated['owner_user_id'] = $user->_id;
        } else {
            $validated['owner_user_id'] = null;
        }

        $item = Item::create([
            'item_code' => $validated['item_code'],
            'name' => $validated['name'],
            'category' => $validated['category'],
            'owner_type' => $validated['owner_type'],
            'owner_user_id' => $validated['owner_user_id'],
            'rental_rate_hr' => (float) ($validated['rental_rate_hr'] ?? 0.0),
            'deposit_required' => (bool) ($validated['deposit_required'] ?? false),
            'availability_stat' => $validated['availability_stat'] ?? 'available',
            'tags' => $validated['tags'] ?? [],
            'specs' => $validated['specs'] ?? [],
        ]);

        return (new ItemResource($item))
            ->response()
            ->setStatusCode(201);
    }
}
