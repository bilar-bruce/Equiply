<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EquiplyApiTest extends TestCase
{
    protected User $student;
    protected User $custodian;
    protected Item $availableItem;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::firstOrCreate(
            ['email' => 'alex.rivera@campus.edu'],
            [
                'id_number' => '2023-10042',
                'name' => 'Alex Rivera',
                'password' => Hash::make('password123'),
                'role' => 'student',
                'is_peer_lender' => false,
                'contact_number' => '+639171234567',
                'status' => 'active',
            ]
        );

        $this->custodian = User::firstOrCreate(
            ['email' => 'custodian@campus.edu'],
            [
                'id_number' => 'EMP-2019-041',
                'name' => 'Maria Santos',
                'password' => Hash::make('custodian123'),
                'role' => 'custodian',
                'is_peer_lender' => false,
                'contact_number' => '+639195551234',
                'status' => 'active',
            ]
        );

        $this->availableItem = Item::firstOrCreate(
            ['item_code' => 'TEST-LAB-099'],
            [
                'name' => 'Automated Test Lab Coat',
                'category' => 'Laboratory Attire',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['testing', 'chemistry', 'safety'],
                'specs' => ['size' => 'M', 'material' => 'Cotton'],
            ]
        );

        // Ensure available status
        $this->availableItem->availability_stat = 'available';
        $this->availableItem->save();
    }

    public function test_can_list_items_and_categories(): void
    {
        $response = $this->getJson('/api/items');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'item_code',
                        'name',
                        'category',
                        'availability_stat',
                        'specs',
                        'tags',
                    ],
                ],
            ]);

        $catResponse = $this->getJson('/api/items/categories');
        $catResponse->assertStatus(200)
            ->assertJsonStructure([
                'categories',
                'total_all',
                'total_available',
            ]);
    }

    public function test_can_filter_items_by_category_and_search(): void
    {
        $response = $this->getJson('/api/items?category=' . urlencode('Laboratory Attire'));
        $response->assertStatus(200);

        foreach ($response->json('data') as $item) {
            $this->assertEquals('Laboratory Attire', $item['category']);
        }

        $searchResponse = $this->getJson('/api/items?q=Coat');
        $searchResponse->assertStatus(200);
        $this->assertNotEmpty($searchResponse->json('data'));
    }

    public function test_user_authentication(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'login' => 'alex.rivera@campus.edu',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'token_type',
                'user' => ['id', 'id_number', 'name', 'email', 'role'],
            ]);
    }

    public function test_atomic_reservation_and_concurrency_lock(): void
    {
        Sanctum::actingAs($this->student);

        // 1. Initial reservation
        $res = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->availableItem->_id,
            'due_time' => now()->addHours(3)->toIso8601String(),
            'collateral_held' => 'School ID: 2023-10042',
            'condition_out' => 'Brand new test coat',
        ]);

        $res->assertStatus(201);
        $rentalId = $res->json('data.id');
        $rentalCode = $res->json('data.rental_code');

        $this->assertNotEmpty($rentalCode);
        $this->assertEquals('pending', $res->json('data.status'));

        // Refresh item state: must be 'reserved'
        $this->availableItem->refresh();
        $this->assertEquals('reserved', $this->availableItem->availability_stat);

        // 2. Concurrency Conflict Test: Trying to reserve the already-reserved item must return 409 Conflict
        $conflictRes = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->availableItem->_id,
            'due_time' => now()->addHours(5)->toIso8601String(),
            'collateral_held' => 'Cash Deposit: 500',
        ]);

        $conflictRes->assertStatus(409);

        // 3. Custodian Checkout
        Sanctum::actingAs($this->custodian);
        $checkoutRes = $this->postJson("/api/reservations/{$rentalId}/checkout");
        $checkoutRes->assertStatus(200);

        $this->availableItem->refresh();
        $this->assertEquals('rented', $this->availableItem->availability_stat);

        // 4. Custodian Return Check-in
        $checkinRes = $this->postJson("/api/reservations/{$rentalId}/checkin", [
            'condition_in' => 'Returned clean with no stains or tears',
            'mark_maintenance' => false,
        ]);

        $checkinRes->assertStatus(200);

        // Item must be returned to 'available'
        $this->availableItem->refresh();
        $this->assertEquals('available', $this->availableItem->availability_stat);

        // Clean up test rental and item
        Rental::where('_id', $rentalId)->delete();
        $this->availableItem->delete();
    }
}
