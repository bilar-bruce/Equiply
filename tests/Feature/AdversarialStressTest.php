<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdversarialStressTest extends TestCase
{
    protected User $student;
    protected User $peerLender;
    protected User $custodian;
    protected User $admin;
    protected Item $testItem;
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

        $this->custodian = User::updateOrCreate(
            ['email' => 'custodian@campus.edu'],
            [
                'id_number' => '2019100041',
                'name' => 'Maria Santos',
                'password' => Hash::make('custodian123'),
                'role' => 'custodian',
                'is_peer_lender' => false,
                'contact_number' => '+639195551234',
                'status' => 'active',
            ]
        );

        $this->admin = User::updateOrCreate(
            ['email' => 'admin@campus.edu'],
            [
                'id_number' => '2015100001',
                'name' => 'System Administrator',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'is_peer_lender' => false,
                'contact_number' => '+639201112233',
                'status' => 'active',
            ]
        );

        $this->testItem = Item::updateOrCreate(
            ['item_code' => 'EQ-TEST-001'],
            [
                'name' => 'Stress Test Laboratory Coat',
                'category' => 'Laboratory Attire',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_flat' => 20.00,
                'rental_rate_hr' => 20.00,
                'deposit_required' => false,
                'availability_stat' => 'available',
                'tags' => ['stress-test'],
                'specs' => ['material' => 'Cotton Drill'],
            ]
        );
        $this->testItem->availability_stat = 'available';
        $this->testItem->save();

        $this->p2pItem = Item::updateOrCreate(
            ['item_code' => 'EQ-P2P-TEST'],
            [
                'name' => 'Adversarial Test Arduino Kit',
                'category' => 'Electronics',
                'owner_type' => 'student',
                'owner_user_id' => $this->peerLender->_id,
                'rental_rate_flat' => 45.00,
                'rental_rate_hr' => 45.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['p2p', 'arduino'],
                'specs' => ['board' => 'Uno R3'],
            ]
        );
        $this->p2pItem->availability_stat = 'available';
        $this->p2pItem->save();
    }

    /**
     * 1. Public self-registration is strictly disabled per university facility policy.
     */
    public function test_public_self_registration_is_strictly_blocked(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'id_number' => '2024999999',
            'name' => 'Unauthorized Registrant',
            'email' => 'intruder@campus.edu',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'contact_number' => '+639112223344',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Public self-registration is disabled. Student accounts are issued in person at the Campus Facility Desk upon presenting a valid USTP School ID.',
            ]);
    }

    /**
     * 2. Authentication fuzzing: Malformed 10-digit IDs, SQL/NoSQL operator payloads fail validation.
     */
    public function test_login_rejects_malformed_ids_and_nosql_payloads(): void
    {
        // 9 digits (underflow)
        $this->postJson('/api/auth/login', [
            'login' => '202430061',
            'password' => 'password123',
        ])->assertStatus(422)->assertJsonValidationErrors(['login']);

        // 11 digits (overflow)
        $this->postJson('/api/auth/login', [
            'login' => '20243006169',
            'password' => 'password123',
        ])->assertStatus(422)->assertJsonValidationErrors(['login']);

        // Alphanumeric injection
        $this->postJson('/api/auth/login', [
            'login' => '2024ADMIN1',
            'password' => 'password123',
        ])->assertStatus(422)->assertJsonValidationErrors(['login']);

        // Non-string NoSQL operator injection array
        $this->postJson('/api/auth/login', [
            'login' => ['$ne' => null],
            'password' => 'password123',
        ])->assertStatus(422)->assertJsonValidationErrors(['login']);
    }

    /**
     * 3. XSS and super long names are safely stored as literal strings without layout/database corruption.
     */
    public function test_xss_and_extreme_strings_handled_safely(): void
    {
        Sanctum::actingAs($this->custodian);

        $xssName = "<script>alert('XSS')</script> Heavy Duty Soldering Station";
        $longCondition = str_repeat("Condition verified clean. ", 15);

        $response = $this->postJson('/api/items', [
            'item_code' => 'EQ-XSS-TEST',
            'name' => $xssName,
            'category' => 'Electronics',
            'owner_type' => 'facility',
            'rental_rate_hr' => 35.00,
            'deposit_required' => true,
            'specs' => [
                'xss_vector' => '<img src=x onerror=alert(1)>',
                'description' => $longCondition,
            ],
            'tags' => ['safety', 'xss-test'],
        ]);

        $response->assertStatus(201);
        $createdId = $response->json('data.id');

        // Verify stored in MongoDB as literal unexecuted string
        $item = Item::find($createdId);
        $this->assertEquals($xssName, $item->name);
        $this->assertEquals('<img src=x onerror=alert(1)>', $item->specs['xss_vector']);

        // Clean up
        $item->delete();
    }

    /**
     * 4. Negative and invalid rental rates are strictly rejected with HTTP 422.
     */
    public function test_negative_and_invalid_rental_rates_are_rejected(): void
    {
        Sanctum::actingAs($this->custodian);

        // Negative rate
        $this->postJson('/api/items', [
            'name' => 'Faulty Rate Multimeter',
            'category' => 'Electronics',
            'rental_rate_hr' => -25.00,
        ])->assertStatus(422)->assertJsonValidationErrors(['rental_rate_hr']);

        // Non-numeric rate
        $this->postJson('/api/items', [
            'name' => 'Invalid Rate Multimeter',
            'category' => 'Electronics',
            'rental_rate_hr' => 'NOT_A_NUMBER',
        ])->assertStatus(422)->assertJsonValidationErrors(['rental_rate_hr']);
    }

    /**
     * 5. Conflict of Interest: Peer lenders are strictly blocked from reserving their own items.
     */
    public function test_peer_lender_cannot_reserve_own_item(): void
    {
        Sanctum::actingAs($this->peerLender);

        $response = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->p2pItem->_id,
            'due_time' => now()->addHours(3)->toIso8601String(),
            'collateral_held' => 'Academic Clearance Hold: ' . $this->peerLender->id_number,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Self-reservation not permitted', $response->json('message'));
    }

    /**
     * 6. Broken Object Level Authorization (BOLA): Students cannot access admin or dispatch custodian endpoints.
     */
    public function test_unauthorized_student_cannot_access_admin_or_dispatch_custodian(): void
    {
        Sanctum::actingAs($this->student);

        // Student hits Admin User Management
        $this->getJson('/api/admin/users')->assertStatus(403);

        // Student attempts to checkout/dispatch
        $this->postJson("/api/reservations/some-fake-id/checkout")->assertStatus(403);

        // Student attempts to checkin
        $this->postJson("/api/reservations/some-fake-id/checkin")->assertStatus(403);
    }

    /**
     * 7. Administrative self-harm protection: Admins cannot suspend or demote their own accounts.
     */
    public function test_admin_cannot_self_suspend_or_self_demote(): void
    {
        Sanctum::actingAs($this->admin);

        // Self-suspension lockout
        $this->patchJson("/api/admin/users/{$this->admin->_id}/status", [
            'status' => 'suspended',
        ])->assertStatus(422)
          ->assertJsonFragment([
              'message' => 'Self-suspension lockout: You cannot suspend your own administrative account.',
          ]);

        // Self-demotion lockout
        $this->patchJson("/api/admin/users/{$this->admin->_id}/role", [
            'role' => 'student',
        ])->assertStatus(422)
          ->assertJsonFragment([
              'message' => 'Self-demotion lockout: You cannot revoke your own administrator privileges.',
          ]);
    }

    /**
     * 8. ACID Concurrency: Double reservation attempts on an active item return 409 Conflict.
     */
    public function test_concurrency_race_condition_locks_single_item(): void
    {
        Sanctum::actingAs($this->student);

        // First reservation: must succeed
        $res1 = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->testItem->_id,
            'due_time' => now()->addHours(3)->toIso8601String(),
            'collateral_held' => 'Academic Clearance Hold: ' . $this->student->id_number,
        ]);

        $res1->assertStatus(201);
        $rentalId = $res1->json('data.id');

        // Immediate duplicate reservation on now-reserved item: MUST return 409 Conflict
        $res2 = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->testItem->_id,
            'due_time' => now()->addHours(3)->toIso8601String(),
            'collateral_held' => 'Refundable Cash Deposit: ₱100.00',
        ]);

        $res2->assertStatus(409);
        $this->assertStringContainsString('cannot be reserved', $res2->json('message'));

        // Clean up
        Rental::where('_id', $rentalId)->delete();
        $this->testItem->availability_stat = 'available';
        $this->testItem->save();
    }
}
