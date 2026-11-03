<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAccountManagementTest extends TestCase
{
    protected User $student;
    protected User $custodian;
    protected User $admin;

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
    }

    /**
     * Test authentication with 10-digit campus ID.
     */
    public function test_user_can_login_with_10_digit_id(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'login' => '2024300616',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    /**
     * Test public self-registration is disabled per facility provisioning policy.
     */
    public function test_public_self_registration_is_disabled(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'id_number' => '2024999999',
            'name' => 'Random Visitor',
            'email' => 'visitor@campus.edu',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'contact_number' => '+639123456789',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Public self-registration is disabled. Student accounts are issued in person at the Campus Facility Desk upon presenting a valid USTP School ID.',
            ]);
    }

    /**
     * Test admin user listing requires admin credentials.
     */
    public function test_admin_user_listing_requires_admin_role(): void
    {
        // Unauthenticated
        $this->getJson('/api/admin/users')->assertStatus(401);

        // Student
        Sanctum::actingAs($this->student);
        $this->getJson('/api/admin/users')->assertStatus(403);

        // Admin
        Sanctum::actingAs($this->admin);
        $response = $this->getJson('/api/admin/users');
        $response->assertStatus(200)
            ->assertJsonStructure(['metrics', 'users']);
    }

    /**
     * Test facility account provisioning with 10-digit ID.
     */
    public function test_facility_can_provision_new_student_account(): void
    {
        Sanctum::actingAs($this->custodian);

        $testId = '2024555001';
        // Clean up if exists from previous run
        User::where('id_number', $testId)->delete();

        $response = $this->postJson('/api/admin/users', [
            'id_number' => $testId,
            'name' => 'Enrolled Student',
            'email' => 'enrolled.student@campus.edu',
            'contact_number' => '+639170001122',
            'is_peer_lender' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'user', 'temporary_password']);

        $this->assertDatabaseHas('users', [
            'id_number' => $testId,
            'role' => 'student',
            'is_peer_lender' => true,
        ]);
    }

    /**
     * Test validation failure on invalid ID format.
     */
    public function test_provisioning_fails_on_non_10_digit_id(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/admin/users', [
            'id_number' => '12345', // Not 10 digits
            'name' => 'Invalid ID User',
            'email' => 'invalid.id@campus.edu',
            'contact_number' => '+639170001122',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['id_number']);
    }

    /**
     * Test admin self-suspension lockout.
     */
    public function test_admin_cannot_suspend_themselves(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/users/{$this->admin->_id}/status", [
            'status' => 'suspended',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Self-suspension lockout: You cannot suspend your own administrative account.',
            ]);
    }

    /**
     * Test admin self-demotion lockout.
     */
    public function test_admin_cannot_demote_themselves(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/users/{$this->admin->_id}/role", [
            'role' => 'custodian',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Self-demotion lockout: You cannot revoke your own administrator privileges.',
            ]);
    }

    /**
     * Test admin can toggle peer lender privilege for students.
     */
    public function test_admin_can_toggle_peer_lender(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/users/{$this->student->_id}/peer-lender", [
            'is_peer_lender' => true,
        ]);

        $response->assertStatus(200);
        $this->assertEquals(true, User::find($this->student->_id)->is_peer_lender);
    }

    /**
     * Test student role cannot be mutated to staff.
     */
    public function test_admin_cannot_mutate_student_role(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/users/{$this->student->_id}/role", [
            'role' => 'custodian',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Role locked: Student campus accounts cannot be transitioned to staff roles.',
            ]);
    }

    /**
     * Test peer lending privileges cannot be granted to staff.
     */
    public function test_admin_cannot_grant_peer_lender_to_staff(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->patchJson("/api/admin/users/{$this->custodian->_id}/peer-lender", [
            'is_peer_lender' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Invalid privilege assignment: Peer lending privileges can only be granted to student accounts.',
            ]);
    }

    /**
     * Test facility staff and admins cannot reserve equipment.
     */
    public function test_staff_cannot_reserve_equipment(): void
    {
        Sanctum::actingAs($this->custodian);

        $response = $this->postJson('/api/reservations', [
            'item_id' => 'fake-id',
            'due_time' => now()->addHours(3)->toIso8601String(),
            'collateral_held' => 'Cash Deposit: ₱100.00',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Access restricted: Only verified student borrowers can reserve equipment. Facility staff and administrators cannot borrow inventory.',
            ]);
    }

    /**
     * Test students cannot directly inject items into the inventory catalog.
     */
    public function test_students_cannot_directly_create_items(): void
    {
        Sanctum::actingAs($this->student);

        $response = $this->postJson('/api/items', [
            'item_code' => 'EQ-STUDENT-HACK',
            'name' => 'Unauthorized Item',
            'category' => 'General',
            'owner_type' => 'facility',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Access restricted: Only facility custodians or administrators can register inventory directly.',
            ]);
    }
}

