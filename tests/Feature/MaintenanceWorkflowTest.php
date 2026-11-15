<?php

namespace Tests\Feature;

use App\Mail\EquipmentReturnedReceiptMail;
use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaintenanceWorkflowTest extends TestCase
{
    protected User $student;
    protected User $custodian;
    protected User $admin;
    protected Item $testItem;

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

        $this->testItem = Item::updateOrCreate(
            ['item_code' => 'TEST-MAINT-001'],
            [
                'name' => 'Fluke 117 True-RMS Digital Multimeter',
                'category' => 'Electronics',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_flat' => 35.00,
                'rental_rate_hr' => 35.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['multimeter', 'electronics'],
                'specs' => ['model' => 'Fluke 117'],
            ]
        );

        Rental::where('item_id', $this->testItem->_id)->delete();
    }

    protected function tearDown(): void
    {
        if (isset($this->testItem)) {
            Rental::where('item_id', $this->testItem->_id)->delete();
            $this->testItem->delete();
        }

        parent::tearDown();
    }

    public function test_custodian_can_resolve_maintenance_and_restore_item_to_available_and_invalidate_cache(): void
    {
        $this->testItem->availability_stat = 'maintenance';
        $this->testItem->save();

        Cache::put('equiply_category_counts', ['stale' => true], 60);
        $this->assertTrue(Cache::has('equiply_category_counts'));

        Sanctum::actingAs($this->custodian);

        $res = $this->postJson("/api/custodian/items/{$this->testItem->_id}/resolve-maintenance", [
            'repair_notes' => 'Replaced blown 10A fuse and recalibrated probes',
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('item.availability_stat', 'available')
            ->assertJsonPath('item.specs.last_repair_notes', 'Replaced blown 10A fuse and recalibrated probes')
            ->assertJsonPath('item.specs.last_repaired_by', $this->custodian->name);

        $this->assertFalse(Cache::has('equiply_category_counts'));

        $fresh = $this->testItem->fresh();
        $this->assertSame('available', $fresh->availability_stat);
        $this->assertSame('Replaced blown 10A fuse and recalibrated probes', $fresh->specs['last_repair_notes']);
        $this->assertSame($this->custodian->name, $fresh->specs['last_repaired_by']);
        $this->assertNotEmpty($fresh->specs['last_repaired_at']);
    }

    public function test_students_and_admins_receive_403_on_resolve_maintenance(): void
    {
        $this->testItem->availability_stat = 'maintenance';
        $this->testItem->save();

        Sanctum::actingAs($this->student);
        $studentRes = $this->postJson("/api/custodian/items/{$this->testItem->_id}/resolve-maintenance", [
            'repair_notes' => 'Attempt by student',
        ]);
        $studentRes->assertStatus(403);

        Sanctum::actingAs($this->admin);
        $adminRes = $this->postJson("/api/custodian/items/{$this->testItem->_id}/resolve-maintenance", [
            'repair_notes' => 'Attempt by admin',
        ]);
        $adminRes->assertStatus(403);

        $this->assertSame('maintenance', $this->testItem->fresh()->availability_stat);
    }

    public function test_resolve_maintenance_rejects_non_maintenance_item_with_422(): void
    {
        $this->testItem->availability_stat = 'available';
        $this->testItem->save();

        Sanctum::actingAs($this->custodian);

        $res = $this->postJson("/api/custodian/items/{$this->testItem->_id}/resolve-maintenance", [
            'repair_notes' => 'Should fail since item is available',
        ]);

        $res->assertStatus(422);
        $this->assertStringContainsString('not in maintenance', $res->json('message'));
    }

    public function test_checkin_records_collateral_status_damage_fee_and_final_total(): void
    {
        Mail::fake();

        $this->testItem->availability_stat = 'rented';
        $this->testItem->save();

        $damagedRental = Rental::create([
            'rental_code' => 'RNT-DMG-TEST01',
            'item_id' => $this->testItem->_id,
            'borrower_id' => $this->student->_id,
            'custodian_id' => $this->custodian->_id,
            'status' => 'active',
            'schedule' => [
                'requested_at' => now()->subHours(2)->toIso8601String(),
                'expires_at' => now()->subMinutes(90)->toIso8601String(),
                'due_time' => now()->addHours(2)->toIso8601String(),
                'returned_time' => null,
            ],
            'item_snapshot' => [
                'name' => $this->testItem->name,
                'owner_type' => $this->testItem->owner_type,
                'owner_id' => null,
            ],
            'condition_logs' => [
                'condition_out' => 'Clean and calibrated',
                'condition_in' => null,
            ],
            'financials' => [
                'total_fee' => 35.00,
                'collateral_held' => 'Academic Clearance Hold: ' . $this->student->id_number,
            ],
        ]);

        Sanctum::actingAs($this->custodian);

        $res = $this->postJson("/api/reservations/{$damagedRental->_id}/checkin", [
            'condition_in' => 'Cracked LCD housing',
            'mark_maintenance' => true,
            'collateral_status' => 'withheld_damage',
            'damage_fee' => 150.00,
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('rental.status', 'returned')
            ->assertJsonPath('rental.financials.collateral_status', 'withheld_damage');

        $freshDamaged = $damagedRental->fresh();
        $this->assertSame('withheld_damage', $freshDamaged->financials['collateral_status']);
        $this->assertEquals(150.00, $freshDamaged->financials['damage_fee']);
        $this->assertEquals(185.00, $freshDamaged->financials['final_total']);
        $this->assertSame('maintenance', $this->testItem->fresh()->availability_stat);

        Mail::assertSent(EquipmentReturnedReceiptMail::class, function (EquipmentReturnedReceiptMail $mail) {
            if ($mail->rental->rental_code !== 'RNT-DMG-TEST01') {
                return false;
            }
            $html = $mail->render();

            return str_contains($html, 'Withheld / Deducted for Damage')
                && str_contains($html, '₱150.00')
                && str_contains($html, '₱185.00');
        });

        // Clean check-in without collateral_status or damage_fee defaults properly
        $this->testItem->availability_stat = 'rented';
        $this->testItem->save();

        $cleanRental = Rental::create([
            'rental_code' => 'RNT-CLN-TEST01',
            'item_id' => $this->testItem->_id,
            'borrower_id' => $this->student->_id,
            'custodian_id' => $this->custodian->_id,
            'status' => 'active',
            'schedule' => [
                'requested_at' => now()->subHours(2)->toIso8601String(),
                'expires_at' => now()->subMinutes(90)->toIso8601String(),
                'due_time' => now()->addHours(2)->toIso8601String(),
                'returned_time' => null,
            ],
            'item_snapshot' => [
                'name' => $this->testItem->name,
                'owner_type' => $this->testItem->owner_type,
                'owner_id' => null,
            ],
            'condition_logs' => [
                'condition_out' => 'Clean and calibrated',
                'condition_in' => null,
            ],
            'financials' => [
                'total_fee' => 35.00,
                'collateral_held' => 'Academic Clearance Hold: ' . $this->student->id_number,
            ],
        ]);

        $cleanRes = $this->postJson("/api/reservations/{$cleanRental->_id}/checkin", [
            'condition_in' => 'Returned in pristine condition',
        ]);

        $cleanRes->assertStatus(200)
            ->assertJsonPath('rental.financials.collateral_status', 'released');

        $freshClean = $cleanRental->fresh();
        $this->assertSame('released', $freshClean->financials['collateral_status']);
        $this->assertEquals(0.00, $freshClean->financials['damage_fee']);
        $this->assertEquals(35.00, $freshClean->financials['final_total']);
        $this->assertSame('available', $this->testItem->fresh()->availability_stat);
    }
}
