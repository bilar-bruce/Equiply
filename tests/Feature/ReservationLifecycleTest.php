<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReservationLifecycleTest extends TestCase
{
    protected User $student;
    protected User $peerLender;
    protected Item $p2pItem;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::updateOrCreate(
            ['email' => 'alex.rivera@campus.edu'],
            [
                'id_number' => '2024300616',
                'name' => 'Alex Rivera',
                'password' => Hash::make('password123'),
                'role' => 'student',
                'is_peer_lender' => false,
                'contact_number' => '+639171234567',
                'status' => 'active',
            ]
        );

        $this->peerLender = User::updateOrCreate(
            ['email' => 'jordan.lee@campus.edu'],
            [
                'id_number' => '2024301824',
                'name' => 'Jordan Lee',
                'password' => Hash::make('password123'),
                'role' => 'student',
                'is_peer_lender' => true,
                'contact_number' => '+639189876543',
                'status' => 'active',
            ]
        );

        $this->p2pItem = Item::updateOrCreate(
            ['item_code' => 'EQ-P2P-001'],
            [
                'name' => 'Arduino Starter Kit with Uno R3 & 30+ Sensors',
                'category' => 'Electronics',
                'owner_type' => 'student',
                'owner_user_id' => $this->peerLender->_id,
                'rental_rate_flat' => 45.00,
                'rental_rate_hr' => 45.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['arduino', 'p2p'],
                'specs' => ['board' => 'Uno R3'],
            ]
        );

        // Ensure item is available
        $this->p2pItem->availability_stat = 'available';
        $this->p2pItem->save();
    }

    /**
     * Test peer lender cannot reserve their own listed equipment (HTTP 422).
     */
    public function test_peer_lender_cannot_self_reserve_own_item(): void
    {
        Sanctum::actingAs($this->peerLender);

        $response = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->p2pItem->_id,
            'due_time' => now()->addHours(3)->toIso8601String(),
            'collateral_held' => 'Academic Clearance Hold: ' . $this->peerLender->id_number,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Self-reservation not permitted', $response->json('message'));

        // Verify item is still available
        $this->p2pItem->refresh();
        $this->assertEquals('available', $this->p2pItem->availability_stat);
    }

    /**
     * Test another student can reserve the peer-to-peer item successfully.
     */
    public function test_other_student_can_reserve_p2p_item(): void
    {
        Sanctum::actingAs($this->student);

        $response = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->p2pItem->_id,
            'due_time' => now()->addHours(3)->toIso8601String(),
            'collateral_held' => 'Academic Clearance Hold: ' . $this->student->id_number,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['rental_code', 'status']]);

        $rentalId = $response->json('data.id');

        // Verify item is now reserved
        $this->p2pItem->refresh();
        $this->assertEquals('reserved', $this->p2pItem->availability_stat);

        // Clean up
        Rental::where('_id', $rentalId)->delete();
        $this->p2pItem->availability_stat = 'available';
        $this->p2pItem->save();
    }
}

