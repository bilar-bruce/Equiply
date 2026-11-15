<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PeerLenderPayoutTest extends TestCase
{
    protected User $peerLender;
    protected User $borrower;
    protected User $custodian;
    protected User $admin;

    /** @var array<string> */
    protected array $createdItemIds = [];

    /** @var array<string> */
    protected array $createdRentalIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->peerLender = User::updateOrCreate(
            ['email' => 'test.lender.payout@campus.edu'],
            [
                'id_number' => '2024999101',
                'name' => 'Test Peer Lender',
                'password' => Hash::make('password123'),
                'role' => 'student',
                'is_peer_lender' => true,
                'contact_number' => '+639179991101',
                'status' => 'active',
            ]
        );

        $this->borrower = User::updateOrCreate(
            ['email' => 'test.borrower.payout@campus.edu'],
            [
                'id_number' => '2024999102',
                'name' => 'Test Student Borrower',
                'password' => Hash::make('password123'),
                'role' => 'student',
                'is_peer_lender' => false,
                'contact_number' => '+639179991102',
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

        // Clean any leftover items/rentals owned by the dedicated test peer lender
        $existingItems = Item::where('owner_user_id', $this->peerLender->_id)->pluck('_id')->toArray();
        if (! empty($existingItems)) {
            Rental::whereIn('item_id', $existingItems)->delete();
            Item::whereIn('_id', $existingItems)->delete();
        }
    }

    protected function tearDown(): void
    {
        if (! empty($this->createdRentalIds)) {
            Rental::whereIn('_id', $this->createdRentalIds)->delete();
        }

        if (! empty($this->createdItemIds)) {
            Rental::whereIn('item_id', $this->createdItemIds)->delete();
            Item::whereIn('_id', $this->createdItemIds)->delete();
        }

        if (isset($this->peerLender)) {
            $lenderItems = Item::where('owner_user_id', $this->peerLender->_id)->pluck('_id')->toArray();
            if (! empty($lenderItems)) {
                Rental::whereIn('item_id', $lenderItems)->delete();
                Item::whereIn('_id', $lenderItems)->delete();
            }
            $this->peerLender->delete();
        }

        if (isset($this->borrower)) {
            Rental::where('borrower_id', $this->borrower->_id)->delete();
            $this->borrower->delete();
        }

        parent::tearDown();
    }

    public function test_peer_lender_store_and_update_persist_rental_rate_flat_and_remain_backward_compatible_with_rental_rate_hr(): void
    {
        Sanctum::actingAs($this->peerLender);

        // 1. Store using rental_rate_flat without rental_rate_hr
        $storeRes = $this->postJson('/api/peer-lender/listings', [
            'name' => 'Casio fx-991CW Scientific Calculator',
            'category' => 'Computation',
            'rental_rate_flat' => 65.00,
            'deposit_required' => true,
            'specs' => ['condition' => 'Mint condition'],
            'tags' => ['calculator', 'p2p'],
        ]);

        $storeRes->assertStatus(201);
        $itemId = $storeRes->json('item.id');
        $this->assertNotEmpty($itemId);
        $this->createdItemIds[] = $itemId;

        $this->assertEquals(65.00, $storeRes->json('item.rental_rate_flat'));
        $this->assertEquals(65.00, $storeRes->json('item.rental_rate_hr'));

        $itemInDb = Item::find($itemId);
        $this->assertNotNull($itemInDb);
        $this->assertEquals(65.00, $itemInDb->rental_rate_flat);
        $this->assertEquals(65.00, $itemInDb->rental_rate_hr);

        // 2. Update using rental_rate_flat = 80.00
        $updateFlatRes = $this->patchJson("/api/peer-lender/listings/{$itemId}", [
            'rental_rate_flat' => 80.00,
        ]);

        $updateFlatRes->assertStatus(200);
        $this->assertEquals(80.00, $updateFlatRes->json('item.rental_rate_flat'));
        $this->assertEquals(80.00, $updateFlatRes->json('item.rental_rate_hr'));

        $itemInDb = $itemInDb->fresh();
        $this->assertEquals(80.00, $itemInDb->rental_rate_flat);
        $this->assertEquals(80.00, $itemInDb->rental_rate_hr);

        // 3. Update using legacy rental_rate_hr = 55.00
        $updateHrRes = $this->patchJson("/api/peer-lender/listings/{$itemId}", [
            'rental_rate_hr' => 55.00,
        ]);

        $updateHrRes->assertStatus(200);
        $this->assertEquals(55.00, $updateHrRes->json('item.rental_rate_flat'));
        $this->assertEquals(55.00, $updateHrRes->json('item.rental_rate_hr'));

        $itemInDb = $itemInDb->fresh();
        $this->assertEquals(55.00, $itemInDb->rental_rate_flat);
        $this->assertEquals(55.00, $itemInDb->rental_rate_hr);
    }

    public function test_completed_p2p_loan_tracks_unclaimed_earnings_and_transitions_to_settled_earnings_on_custodian_payout(): void
    {
        Mail::fake();

        $p2pItem = Item::create([
            'item_code' => 'TEST-P2P-PAYOUT-01',
            'name' => 'Saleae Logic 8 Analyzer',
            'category' => 'Electronics',
            'owner_type' => 'student',
            'owner_user_id' => $this->peerLender->_id,
            'rental_rate_flat' => 45.00,
            'rental_rate_hr' => 45.00,
            'deposit_required' => true,
            'availability_stat' => 'available',
            'tags' => ['logic-analyzer', 'p2p'],
            'specs' => ['channels' => '8'],
        ]);
        $this->createdItemIds[] = (string) $p2pItem->_id;

        // 1. Student borrower reserves the P2P item
        Sanctum::actingAs($this->borrower);
        $reserveRes = $this->postJson('/api/reservations', [
            'item_id' => (string) $p2pItem->_id,
            'due_time' => now()->addHours(4)->toIso8601String(),
            'collateral_held' => 'Validated Campus Student ID Card',
        ]);

        $reserveRes->assertStatus(201);
        $rentalId = $reserveRes->json('data.id') ?? $reserveRes->json('id');
        $this->assertNotEmpty($rentalId);
        $this->createdRentalIds[] = $rentalId;

        $rentalAfterReserve = Rental::find($rentalId);
        $this->assertSame('unclaimed', $rentalAfterReserve->financials['payout_status'] ?? null);
        $this->assertNull($rentalAfterReserve->financials['payout_settled_at'] ?? null);

        // 2. Custodian checks out and checks in the item
        Sanctum::actingAs($this->custodian);
        $checkoutRes = $this->postJson("/api/reservations/{$rentalId}/checkout");
        $checkoutRes->assertStatus(200);

        $checkinRes = $this->postJson("/api/reservations/{$rentalId}/checkin", [
            'condition_in' => 'Returned in complete working order',
        ]);
        $checkinRes->assertStatus(200)
            ->assertJsonPath('rental.financials.payout_status', 'unclaimed')
            ->assertJsonPath('rental.financials.payout_settled_at', null);

        // 3. Peer Lender checks GET /api/peer-lender/listings -> unclaimed_earnings = 45.00, settled_earnings = 0.00
        Sanctum::actingAs($this->peerLender);
        $listingsBefore = $this->getJson('/api/peer-lender/listings');
        $listingsBefore->assertStatus(200);
        $this->assertEquals(45.00, $listingsBefore->json('metrics.unclaimed_earnings'));
        $this->assertEquals(0.00, $listingsBefore->json('metrics.settled_earnings'));
        $this->assertEquals(45.00, $listingsBefore->json('metrics.total_earnings'));

        // 4. Custodian settles payout via POST /api/custodian/rentals/{id}/settle-payout
        Sanctum::actingAs($this->custodian);
        $settleRes = $this->postJson("/api/custodian/rentals/{$rentalId}/settle-payout");
        $settleRes->assertStatus(200)
            ->assertJsonPath('rental.financials.payout_status', 'settled');
        $this->assertNotEmpty($settleRes->json('rental.financials.payout_settled_at'));

        // 5. Peer Lender checks GET /api/peer-lender/listings again -> unclaimed_earnings = 0.00, settled_earnings = 45.00
        Sanctum::actingAs($this->peerLender);
        $listingsAfter = $this->getJson('/api/peer-lender/listings');
        $listingsAfter->assertStatus(200);
        $this->assertEquals(0.00, $listingsAfter->json('metrics.unclaimed_earnings'));
        $this->assertEquals(45.00, $listingsAfter->json('metrics.settled_earnings'));
        $this->assertEquals(45.00, $listingsAfter->json('metrics.total_earnings'));
    }

    public function test_settle_payout_enforces_custodian_role_and_rejects_invalid_rentals(): void
    {
        $p2pItem = Item::create([
            'item_code' => 'TEST-P2P-PAYOUT-02',
            'name' => 'Rigol Probe Set',
            'category' => 'Electronics',
            'owner_type' => 'student',
            'owner_user_id' => $this->peerLender->_id,
            'rental_rate_flat' => 40.00,
            'rental_rate_hr' => 40.00,
            'deposit_required' => false,
            'availability_stat' => 'available',
        ]);
        $this->createdItemIds[] = (string) $p2pItem->_id;

        $facilityItem = Item::create([
            'item_code' => 'TEST-FAC-PAYOUT-01',
            'name' => 'Facility Soldering Station',
            'category' => 'Electronics',
            'owner_type' => 'facility',
            'owner_user_id' => null,
            'rental_rate_flat' => 30.00,
            'rental_rate_hr' => 30.00,
            'deposit_required' => false,
            'availability_stat' => 'available',
        ]);
        $this->createdItemIds[] = (string) $facilityItem->_id;

        $returnedP2pRental = Rental::create([
            'rental_code' => 'RNT-P2P-RET01',
            'item_id' => $p2pItem->_id,
            'borrower_id' => $this->borrower->_id,
            'custodian_id' => $this->custodian->_id,
            'status' => 'returned',
            'schedule' => [
                'requested_at' => now()->subHours(4)->toIso8601String(),
                'due_time' => now()->subHour()->toIso8601String(),
                'returned_time' => now()->toIso8601String(),
            ],
            'item_snapshot' => [
                'name' => $p2pItem->name,
                'owner_type' => 'student',
                'owner_id' => $this->peerLender->_id,
            ],
            'condition_logs' => [
                'condition_out' => 'Good',
                'condition_in' => 'Good',
            ],
            'financials' => [
                'total_fee' => 40.00,
                'collateral_held' => 'Student ID',
                'payout_status' => 'unclaimed',
                'payout_settled_at' => null,
            ],
        ]);
        $this->createdRentalIds[] = (string) $returnedP2pRental->_id;

        // 1. Student (Peer Lender) and Admin receive 403
        Sanctum::actingAs($this->peerLender);
        $this->postJson("/api/custodian/rentals/{$returnedP2pRental->_id}/settle-payout")
            ->assertStatus(403);

        Sanctum::actingAs($this->admin);
        $this->postJson("/api/custodian/rentals/{$returnedP2pRental->_id}/settle-payout")
            ->assertStatus(403);

        // 2. Custodian settles it once (200), then second attempt receives 422
        Sanctum::actingAs($this->custodian);
        $this->postJson("/api/custodian/rentals/{$returnedP2pRental->_id}/settle-payout")
            ->assertStatus(200);

        $this->postJson("/api/custodian/rentals/{$returnedP2pRental->_id}/settle-payout")
            ->assertStatus(422);

        // 3. Custodian calling settle-payout on an active (unreturned) P2P rental receives 422
        $activeP2pRental = Rental::create([
            'rental_code' => 'RNT-P2P-ACT01',
            'item_id' => $p2pItem->_id,
            'borrower_id' => $this->borrower->_id,
            'custodian_id' => $this->custodian->_id,
            'status' => 'active',
            'schedule' => [
                'requested_at' => now()->subHour()->toIso8601String(),
                'due_time' => now()->addHours(3)->toIso8601String(),
                'returned_time' => null,
            ],
            'item_snapshot' => [
                'name' => $p2pItem->name,
                'owner_type' => 'student',
                'owner_id' => $this->peerLender->_id,
            ],
            'condition_logs' => [
                'condition_out' => 'Good',
                'condition_in' => null,
            ],
            'financials' => [
                'total_fee' => 40.00,
                'collateral_held' => 'Student ID',
                'payout_status' => 'unclaimed',
                'payout_settled_at' => null,
            ],
        ]);
        $this->createdRentalIds[] = (string) $activeP2pRental->_id;

        $this->postJson("/api/custodian/rentals/{$activeP2pRental->_id}/settle-payout")
            ->assertStatus(422);

        // 4. Custodian calling settle-payout on a returned facility-owned rental receives 422
        $facilityRental = Rental::create([
            'rental_code' => 'RNT-FAC-RET01',
            'item_id' => $facilityItem->_id,
            'borrower_id' => $this->borrower->_id,
            'custodian_id' => $this->custodian->_id,
            'status' => 'returned',
            'schedule' => [
                'requested_at' => now()->subHours(4)->toIso8601String(),
                'due_time' => now()->subHour()->toIso8601String(),
                'returned_time' => now()->toIso8601String(),
            ],
            'item_snapshot' => [
                'name' => $facilityItem->name,
                'owner_type' => 'facility',
                'owner_id' => null,
            ],
            'condition_logs' => [
                'condition_out' => 'Good',
                'condition_in' => 'Good',
            ],
            'financials' => [
                'total_fee' => 30.00,
                'collateral_held' => 'Student ID',
            ],
        ]);
        $this->createdRentalIds[] = (string) $facilityRental->_id;

        $this->postJson("/api/custodian/rentals/{$facilityRental->_id}/settle-payout")
            ->assertStatus(422);
    }
}
