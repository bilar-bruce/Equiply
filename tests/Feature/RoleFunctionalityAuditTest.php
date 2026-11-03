<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleFunctionalityAuditTest extends TestCase
{
    protected User $guest;
    protected User $student;
    protected User $peerLender;
    protected User $custodian;
    protected User $admin;

    protected Item $facilityItem;
    protected Item $peerItem;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Setup Student Borrower
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

        // 2. Setup Peer Lender
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

        // 3. Setup Custodian
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

        // 4. Setup Administrator
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

        // 5. Setup Facility Item
        $this->facilityItem = Item::updateOrCreate(
            ['item_code' => 'TEST-FAC-001'],
            [
                'name' => 'Laboratory Centrifuge Unit',
                'category' => 'Laboratory Attire',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['lab', 'centrifuge'],
                'specs' => ['rpm' => 4000],
            ]
        );

        // 6. Setup Student Peer Item
        $this->peerItem = Item::updateOrCreate(
            ['item_code' => 'TEST-P2P-001'],
            [
                'name' => 'Digital Logic Multimeter Kit',
                'category' => 'Electronics',
                'owner_type' => 'student',
                'owner_user_id' => $this->peerLender->_id,
                'rental_rate_hr' => 12.50,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['p2p', 'multimeter'],
                'specs' => ['brand' => 'Fluke'],
            ]
        );
    }

    /**
     * 1. GUEST ROLE AUDIT
     */
    public function test_guest_can_browse_catalog_and_view_specs_without_token(): void
    {
        // Public Catalog List
        $catalogRes = $this->getJson('/api/items');
        $catalogRes->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'item_code', 'name', 'category', 'availability_stat']]]);

        // Category breakdown
        $catRes = $this->getJson('/api/items/categories');
        $catRes->assertStatus(200)
            ->assertJsonStructure(['categories', 'total_all', 'total_available']);

        // Item Specs Inspection
        $itemRes = $this->getJson("/api/items/{$this->facilityItem->_id}");
        $itemRes->assertStatus(200)
            ->assertJsonPath('data.item_code', 'TEST-FAC-001');

        // Unauthenticated reservation attempt is strictly blocked (HTTP 401)
        $reserveRes = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->facilityItem->_id,
            'due_time' => now()->addHours(3)->toIso8601String(),
            'collateral_held' => 'School ID: 2024300616',
        ]);
        $reserveRes->assertStatus(401);
    }

    /**
     * 2. STUDENT BORROWER ROLE AUDIT
     */
    public function test_student_borrower_can_reserve_and_cancel_borrowing(): void
    {
        Sanctum::actingAs($this->student);

        // Student can reserve available facility gear
        $reserveRes = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->facilityItem->_id,
            'due_time' => now()->addHours(4)->toIso8601String(),
            'collateral_held' => 'School ID: ' . $this->student->id_number,
        ]);

        $reserveRes->assertStatus(201);
        $rentalId = $reserveRes->json('data.id');

        // Student can view their own borrowings
        $myRentals = $this->getJson('/api/reservations');
        $myRentals->assertStatus(200)
            ->assertJsonFragment(['id' => $rentalId]);

        // Student can cancel their pending reservation
        $cancelRes = $this->postJson("/api/reservations/{$rentalId}/cancel");
        $cancelRes->assertStatus(200);

        // Facility item returns to 'available'
        $this->facilityItem->refresh();
        $this->assertEquals('available', $this->facilityItem->availability_stat);

        Rental::where('_id', $rentalId)->delete();
    }

    /**
     * 3. PEER LENDER ROLE AUDIT
     */
    public function test_peer_lender_portal_metrics_lockouts_and_lifecycle(): void
    {
        Sanctum::actingAs($this->peerLender);

        // Access peer lender inventory and performance metrics
        $listRes = $this->getJson('/api/peer-lender/listings');
        $listRes->assertStatus(200)
            ->assertJsonStructure(['metrics' => ['total_listed', 'active_loans', 'total_earnings'], 'items']);

        // Self-Borrowing Lockout: Attempting to reserve own equipment fails with HTTP 422
        $selfRes = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->peerItem->_id,
            'due_time' => now()->addHours(2)->toIso8601String(),
            'collateral_held' => 'School ID: ' . $this->peerLender->id_number,
        ]);
        $selfRes->assertStatus(422)
            ->assertJsonFragment(['message' => 'Self-reservation not permitted: You cannot reserve your own equipment listing.']);

        // Register new equipment listing for desk intake
        $registerRes = $this->postJson('/api/peer-lender/listings', [
            'name' => 'FPGA Development Board (Xilinx Spartan-7)',
            'category' => 'Electronics',
            'rental_rate_hr' => 20.00,
            'deposit_required' => true,
        ]);
        $registerRes->assertStatus(201);
        $newId = $registerRes->json('item.id');
        $newCode = $registerRes->json('item.item_code');

        $newItem = Item::find($newId);
        $this->assertEquals('pending_intake', $newItem->availability_stat);

        // Edit listing rate
        $editRes = $this->patchJson("/api/peer-lender/listings/{$newId}", [
            'rental_rate_hr' => 25.00,
        ]);
        $editRes->assertStatus(200);
        $this->assertEquals(25.0, (float) Item::find($newId)->rental_rate_hr);

        // Recall listing
        $recallRes = $this->postJson("/api/peer-lender/listings/{$newId}/recall");
        $recallRes->assertStatus(200);
        $this->assertEquals('withdrawn', Item::find($newId)->availability_stat);

        // Clean up test item
        Item::where('_id', $newId)->delete();
    }

    /**
     * 4. CUSTODIAN STAFF ROLE AUDIT
     */
    public function test_custodian_can_verify_p2p_intake_dispatch_and_return(): void
    {
        // 1. Create item in pending_intake
        $intakeItem = Item::create([
            'item_code' => 'TEST-INTAKE-99',
            'name' => 'Oscilloscope 100MHz 2-Channel',
            'category' => 'Electronics',
            'owner_type' => 'student',
            'owner_user_id' => $this->peerLender->_id,
            'rental_rate_hr' => 15.00,
            'deposit_required' => true,
            'availability_stat' => 'pending_intake',
        ]);

        Sanctum::actingAs($this->custodian);

        // Custodian verifies physical intake
        $intakeRes = $this->postJson("/api/custodian/items/{$intakeItem->_id}/verify-intake");
        $intakeRes->assertStatus(200);
        $intakeItem->refresh();
        $this->assertEquals('available', $intakeItem->availability_stat);

        // Borrower reserves it
        Sanctum::actingAs($this->student);
        $resRes = $this->postJson('/api/reservations', [
            'item_id' => (string) $intakeItem->_id,
            'due_time' => now()->addHours(3)->toIso8601String(),
            'collateral_held' => 'School ID: ' . $this->student->id_number,
        ]);
        $rentalId = $resRes->json('data.id');

        // Custodian authorizes physical dispatch checkout
        Sanctum::actingAs($this->custodian);
        $checkoutRes = $this->postJson("/api/reservations/{$rentalId}/checkout");
        $checkoutRes->assertStatus(200);

        $intakeItem->refresh();
        $this->assertEquals('rented', $intakeItem->availability_stat);

        // Custodian cannot be locked out of recall check: peer lender cannot recall during active loan
        Sanctum::actingAs($this->peerLender);
        $recallBlocked = $this->postJson("/api/peer-lender/listings/{$intakeItem->_id}/recall");
        $recallBlocked->assertStatus(422)
            ->assertJsonFragment(['message' => "Recall locked: Cannot withdraw equipment while it is 'rented'."]);

        // Custodian processes check-in return
        Sanctum::actingAs($this->custodian);
        $checkinRes = $this->postJson("/api/reservations/{$rentalId}/checkin", [
            'condition_in' => 'Returned complete, undamaged',
            'mark_maintenance' => false,
        ]);
        $checkinRes->assertStatus(200);

        $intakeItem->refresh();
        $this->assertEquals('available', $intakeItem->availability_stat);

        // Clean up
        Rental::where('_id', $rentalId)->delete();
        $intakeItem->delete();
    }

    /**
     * 5. ADMINISTRATOR ROLE AUDIT
     */
    public function test_admin_has_full_custodian_and_account_governance_rights(): void
    {
        Sanctum::actingAs($this->admin);

        // Admin can inspect all user accounts and metrics
        $usersRes = $this->getJson('/api/admin/users');
        $usersRes->assertStatus(200)
            ->assertJsonStructure(['metrics' => ['total_accounts', 'active_students', 'peer_lenders'], 'users']);

        // Admin can toggle student peer lending privilege
        $toggleP2p = $this->patchJson("/api/admin/users/{$this->student->_id}/peer-lender", [
            'is_peer_lender' => true,
        ]);
        $toggleP2p->assertStatus(200);
        $this->student->refresh();
        $this->assertTrue($this->student->is_peer_lender);

        // Revert peer lending privilege
        $this->patchJson("/api/admin/users/{$this->student->_id}/peer-lender", [
            'is_peer_lender' => false,
        ]);

        // Admin Self-Demotion Lockout
        $demoteRes = $this->patchJson("/api/admin/users/{$this->admin->_id}/role", [
            'role' => 'student',
        ]);
        $demoteRes->assertStatus(422)
            ->assertJsonFragment(['message' => 'Self-demotion lockout: You cannot revoke your own administrator privileges.']);

        // Admin Self-Suspension Lockout
        $suspendRes = $this->patchJson("/api/admin/users/{$this->admin->_id}/status", [
            'status' => 'suspended',
        ]);
        $suspendRes->assertStatus(422)
            ->assertJsonFragment(['message' => 'Self-suspension lockout: You cannot suspend your own administrative account.']);
    }
}

