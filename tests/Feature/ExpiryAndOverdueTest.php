<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExpiryAndOverdueTest extends TestCase
{
    protected User $student;
    protected User $custodian;
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

        $this->testItem = Item::updateOrCreate(
            ['item_code' => 'TEST-EXPIRY-001'],
            [
                'name' => 'Digital Oscilloscope Tektronix TBS1052B',
                'category' => 'Electronics',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_flat' => 30.00,
                'rental_rate_hr' => 30.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['oscilloscope', 'electronics'],
                'specs' => ['bandwidth' => '50 MHz'],
            ]
        );

        Rental::where('item_id', $this->testItem->_id)->delete();
        $this->testItem->availability_stat = 'available';
        $this->testItem->save();
    }

    protected function tearDown(): void
    {
        if (isset($this->testItem)) {
            Rental::where('item_id', $this->testItem->_id)->delete();
            $this->testItem->availability_stat = 'available';
            $this->testItem->save();
        }

        parent::tearDown();
    }

    public function test_reservation_sets_30_minute_expires_at_and_artisan_command_releases_expired_reservations(): void
    {
        Mail::fake();

        $this->assertSame(15.00, Rental::OVERDUE_RATE_PER_HOUR);

        Sanctum::actingAs($this->student);

        $reserveRes = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->testItem->_id,
            'due_time' => now()->addHours(4)->toIso8601String(),
            'collateral_held' => 'Academic Clearance Hold: ' . $this->student->id_number,
            'condition_out' => 'Probes calibrated and verified',
        ]);

        $reserveRes->assertStatus(201);
        $rentalId = $reserveRes->json('data.id');
        $schedule = $reserveRes->json('data.schedule');

        $this->assertNotEmpty($schedule['requested_at'] ?? null);
        $this->assertNotEmpty($schedule['expires_at'] ?? null);

        $requestedAt = Carbon::parse($schedule['requested_at']);
        $expiresAt = Carbon::parse($schedule['expires_at']);
        $this->assertEquals(30, (int) round($requestedAt->diffInMinutes($expiresAt)));

        // Non-expired reservation remains pending when command runs
        $this->artisan('equiply:expire-unclaimed-reservations')
            ->expectsOutput('Expired 0 unclaimed reservation(s).')
            ->assertExitCode(0);

        $rental = Rental::find($rentalId);
        $this->assertEquals('pending', $rental->status);
        $this->assertEquals('reserved', $this->testItem->fresh()->availability_stat);

        // Move expires_at into the past and run the command
        $pastSchedule = $rental->schedule;
        $pastSchedule['expires_at'] = now()->subMinutes(5)->toIso8601String();
        $rental->schedule = $pastSchedule;
        $rental->save();

        $this->artisan('equiply:expire-unclaimed-reservations')
            ->expectsOutput('Expired 1 unclaimed reservation(s).')
            ->assertExitCode(0);

        $expiredRental = $rental->fresh();
        $this->assertEquals('expired', $expiredRental->status);
        $this->assertNotEmpty($expiredRental->schedule['expired_at'] ?? null);
        $this->assertEquals('available', $this->testItem->fresh()->availability_stat);
    }

    public function test_lazy_expiry_on_catalog_and_reservation_reads_releases_expired_pending_rentals(): void
    {
        Mail::fake();

        // 1. Create an expired pending rental and mark item reserved
        $this->testItem->availability_stat = 'reserved';
        $this->testItem->save();

        $expiredCatalogRental = Rental::create([
            'rental_code' => 'RNT-EXP-CAT01',
            'item_id' => $this->testItem->_id,
            'borrower_id' => $this->student->_id,
            'custodian_id' => null,
            'status' => 'pending',
            'schedule' => [
                'requested_at' => now()->subMinutes(35)->toIso8601String(),
                'expires_at' => now()->subMinutes(5)->toIso8601String(),
                'due_time' => now()->addHours(3)->toIso8601String(),
                'returned_time' => null,
            ],
            'item_snapshot' => [
                'name' => $this->testItem->name,
                'owner_type' => $this->testItem->owner_type,
                'owner_id' => null,
            ],
            'condition_logs' => [
                'condition_out' => 'Good condition upon release',
                'condition_in' => null,
            ],
            'financials' => [
                'total_fee' => 30.00,
                'collateral_held' => 'Academic Clearance Hold',
            ],
        ]);

        // Catalog show endpoint triggers lazy expiry
        $itemRes = $this->getJson("/api/items/{$this->testItem->_id}");
        $itemRes->assertStatus(200)
            ->assertJsonPath('data.availability_stat', 'available');

        $this->assertEquals('expired', $expiredCatalogRental->fresh()->status);
        $this->assertNotEmpty($expiredCatalogRental->fresh()->schedule['expired_at'] ?? null);

        // 2. Create another expired pending rental and verify reservation list endpoint triggers lazy expiry
        $this->testItem->availability_stat = 'reserved';
        $this->testItem->save();

        $expiredReservationRental = Rental::create([
            'rental_code' => 'RNT-EXP-RES01',
            'item_id' => $this->testItem->_id,
            'borrower_id' => $this->student->_id,
            'custodian_id' => null,
            'status' => 'pending',
            'schedule' => [
                'requested_at' => now()->subMinutes(40)->toIso8601String(),
                'expires_at' => now()->subMinutes(10)->toIso8601String(),
                'due_time' => now()->addHours(3)->toIso8601String(),
                'returned_time' => null,
            ],
            'item_snapshot' => [
                'name' => $this->testItem->name,
                'owner_type' => $this->testItem->owner_type,
                'owner_id' => null,
            ],
            'condition_logs' => [
                'condition_out' => 'Good condition upon release',
                'condition_in' => null,
            ],
            'financials' => [
                'total_fee' => 30.00,
                'collateral_held' => 'Academic Clearance Hold',
            ],
        ]);

        Sanctum::actingAs($this->student);

        $listRes = $this->getJson('/api/reservations?search=RNT-EXP-RES01');
        $listRes->assertStatus(200)
            ->assertJsonPath('data.0.status', 'expired');

        $this->assertEquals('available', $this->testItem->fresh()->availability_stat);
    }

    public function test_late_checkin_computes_overdue_fee_rounded_up_and_final_total(): void
    {
        Mail::fake();

        $this->testItem->availability_stat = 'rented';
        $this->testItem->save();

        // 2 hours and 15 minutes overdue -> rounds up to 3 hours @ ₱15.00/hr = ₱45.00
        $overdueRental = Rental::create([
            'rental_code' => 'RNT-OVD-LATE01',
            'item_id' => $this->testItem->_id,
            'borrower_id' => $this->student->_id,
            'custodian_id' => $this->custodian->_id,
            'status' => 'active',
            'schedule' => [
                'requested_at' => now()->subHours(5)->toIso8601String(),
                'expires_at' => now()->subHours(4)->subMinutes(30)->toIso8601String(),
                'due_time' => now()->subMinutes(135)->toIso8601String(),
                'returned_time' => null,
            ],
            'item_snapshot' => [
                'name' => $this->testItem->name,
                'owner_type' => $this->testItem->owner_type,
                'owner_id' => null,
            ],
            'condition_logs' => [
                'condition_out' => 'Probes calibrated and verified',
                'condition_in' => null,
            ],
            'financials' => [
                'total_fee' => 30.00,
                'collateral_held' => 'Academic Clearance Hold: ' . $this->student->id_number,
            ],
        ]);

        Sanctum::actingAs($this->custodian);

        $res = $this->postJson("/api/reservations/{$overdueRental->_id}/checkin", [
            'condition_in' => 'Returned late, inspected and functional',
            'mark_maintenance' => false,
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('rental.status', 'returned')
            ->assertJsonPath('rental.financials.overdue_hours', 3)
            ->assertJsonPath('rental.financials.is_overdue', true)
            ->assertJsonPath('rental.schedule.is_overdue', true)
            ->assertJsonPath('rental.schedule.overdue_hours', 3);

        $fresh = $overdueRental->fresh();
        $this->assertEquals('returned', $fresh->status);
        $this->assertSame(3, $fresh->financials['overdue_hours']);
        $this->assertEquals(15.00, $fresh->financials['overdue_rate_per_hour']);
        $this->assertEquals(45.00, $fresh->financials['overdue_fee']);
        $this->assertTrue($fresh->financials['is_overdue']);
        $this->assertEquals(75.00, $fresh->financials['final_total']);
        $this->assertTrue($fresh->schedule['is_overdue']);
        $this->assertSame(3, $fresh->schedule['overdue_hours']);
        $this->assertNotEmpty($fresh->schedule['returned_time']);
        $this->assertEquals('available', $this->testItem->fresh()->availability_stat);
    }

    public function test_on_time_checkin_records_zero_overdue_fee(): void
    {
        Mail::fake();

        $this->testItem->availability_stat = 'rented';
        $this->testItem->save();

        $onTimeRental = Rental::create([
            'rental_code' => 'RNT-OVD-ONTIME01',
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
                'condition_out' => 'Probes calibrated and verified',
                'condition_in' => null,
            ],
            'financials' => [
                'total_fee' => 30.00,
                'collateral_held' => 'Academic Clearance Hold: ' . $this->student->id_number,
            ],
        ]);

        Sanctum::actingAs($this->custodian);

        $res = $this->postJson("/api/reservations/{$onTimeRental->_id}/checkin", [
            'condition_in' => 'Returned on time in pristine condition',
            'mark_maintenance' => false,
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('rental.status', 'returned')
            ->assertJsonPath('rental.financials.overdue_hours', 0)
            ->assertJsonPath('rental.financials.is_overdue', false)
            ->assertJsonPath('rental.schedule.is_overdue', false)
            ->assertJsonPath('rental.schedule.overdue_hours', 0);

        $fresh = $onTimeRental->fresh();
        $this->assertEquals('returned', $fresh->status);
        $this->assertSame(0, $fresh->financials['overdue_hours']);
        $this->assertEquals(15.00, $fresh->financials['overdue_rate_per_hour']);
        $this->assertEquals(0.00, $fresh->financials['overdue_fee']);
        $this->assertFalse($fresh->financials['is_overdue']);
        $this->assertEquals(30.00, $fresh->financials['final_total']);
        $this->assertFalse($fresh->schedule['is_overdue']);
        $this->assertSame(0, $fresh->schedule['overdue_hours']);
        $this->assertEquals('available', $this->testItem->fresh()->availability_stat);
    }
}
