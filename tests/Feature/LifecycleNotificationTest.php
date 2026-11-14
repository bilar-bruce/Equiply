<?php

namespace Tests\Feature;

use App\Mail\EquipmentDispatchedMail;
use App\Mail\EquipmentReturnedReceiptMail;
use App\Mail\PeerIntakeVerifiedMail;
use App\Mail\PeerItemBorrowedMail;
use App\Mail\PeerItemReturnedMail;
use App\Mail\ReservationConfirmedMail;
use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LifecycleNotificationTest extends TestCase
{
    protected User $student;
    protected User $custodian;
    protected User $peerLender;
    protected Item $facilityItem;
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

        $this->facilityItem = Item::updateOrCreate(
            ['item_code' => 'TEST-NOTIFY-001'],
            [
                'name' => 'Scientific Graphing Calculator TI-84 Plus',
                'category' => 'Calculators & Math',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_flat' => 30.00,
                'rental_rate_hr' => 30.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['calculator', 'ustp'],
                'specs' => ['model' => 'TI-84 Plus'],
            ]
        );
        $this->facilityItem->availability_stat = 'available';
        $this->facilityItem->save();

        $this->p2pItem = Item::updateOrCreate(
            ['item_code' => 'TEST-P2P-NOTIFY-001'],
            [
                'name' => 'Arduino Starter Kit with Uno R3',
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
        $this->p2pItem->availability_stat = 'available';
        $this->p2pItem->save();
    }

    public function test_borrower_receives_reservation_checkout_and_checkin_receipt_emails(): void
    {
        Mail::fake();

        Sanctum::actingAs($this->student);

        // 1. Reserve Equipment
        $collateral = 'Academic Clearance Hold: ' . $this->student->id_number;
        $conditionOut = 'Verified clean screen and fresh batteries';

        $reserveRes = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->facilityItem->_id,
            'due_time' => now()->addHours(4)->toIso8601String(),
            'collateral_held' => $collateral,
            'condition_out' => $conditionOut,
        ]);

        $reserveRes->assertStatus(201);
        $rentalId = $reserveRes->json('data.id');
        $rentalCode = $reserveRes->json('data.rental_code');

        Mail::assertSent(ReservationConfirmedMail::class, function (ReservationConfirmedMail $mail) use ($rentalCode, $collateral) {
            $html = $mail->render();

            return $mail->hasTo($this->student->email)
                && str_contains($html, $rentalCode)
                && str_contains($html, $this->facilityItem->name)
                && str_contains($html, $this->facilityItem->item_code)
                && str_contains($html, '30.00')
                && str_contains($html, $collateral)
                && str_contains($html, '#1B1642')
                && str_contains($html, '#F5A623');
        });

        // 2. Custodian Checkout Dispatch
        Sanctum::actingAs($this->custodian);

        $checkoutRes = $this->postJson("/api/reservations/{$rentalId}/checkout");
        $checkoutRes->assertStatus(200);

        Mail::assertSent(EquipmentDispatchedMail::class, function (EquipmentDispatchedMail $mail) use ($rentalCode, $conditionOut) {
            $html = $mail->render();

            return $mail->hasTo($this->student->email)
                && str_contains($html, $rentalCode)
                && str_contains($html, $this->facilityItem->name)
                && str_contains($html, 'Maria Santos')
                && str_contains($html, $conditionOut)
                && str_contains($html, '#1B1642')
                && str_contains($html, '#F5A623');
        });

        // 3. Custodian Check-In Return Receipt
        $conditionIn = 'Returned in pristine working order';

        $checkinRes = $this->postJson("/api/reservations/{$rentalId}/checkin", [
            'condition_in' => $conditionIn,
            'mark_maintenance' => false,
        ]);
        $checkinRes->assertStatus(200);

        Mail::assertSent(EquipmentReturnedReceiptMail::class, function (EquipmentReturnedReceiptMail $mail) use ($rentalCode, $conditionIn, $collateral) {
            $html = $mail->render();

            return $mail->hasTo($this->student->email)
                && str_contains($html, $rentalCode)
                && str_contains($html, $this->facilityItem->name)
                && str_contains($html, $conditionIn)
                && str_contains($html, $collateral)
                && str_contains($html, '30.00')
                && str_contains($html, '#1B1642')
                && str_contains($html, '#F5A623');
        });

        Mail::assertNotSent(PeerItemBorrowedMail::class);
        Mail::assertNotSent(PeerItemReturnedMail::class);

        // Clean up
        Rental::where('_id', $rentalId)->delete();
        $this->facilityItem->availability_stat = 'available';
        $this->facilityItem->save();
    }

    public function test_peer_lender_receives_intake_borrowed_and_returned_alerts_and_facility_items_do_not_trigger_peer_emails(): void
    {
        Mail::fake();

        // 1. Custodian verifies physical desk intake for P2P listing
        $this->p2pItem->availability_stat = 'pending_intake';
        $this->p2pItem->save();

        Sanctum::actingAs($this->custodian);

        $intakeRes = $this->postJson("/api/custodian/items/{$this->p2pItem->_id}/verify-intake");
        $intakeRes->assertStatus(200);

        Mail::assertSent(PeerIntakeVerifiedMail::class, function (PeerIntakeVerifiedMail $mail) {
            $html = $mail->render();

            return $mail->hasTo($this->peerLender->email)
                && str_contains($html, $this->peerLender->name)
                && str_contains($html, $this->p2pItem->item_code)
                && str_contains($html, $this->p2pItem->name)
                && str_contains($html, $this->p2pItem->category)
                && str_contains($html, '45.00')
                && str_contains($html, 'available')
                && str_contains($html, '#1B1642')
                && str_contains($html, '#F5A623');
        });

        // 2. Student borrower reserves the verified P2P item
        Sanctum::actingAs($this->student);

        $collateral = 'Academic Clearance Hold: ' . $this->student->id_number;
        $conditionOut = 'Complete Uno R3 kit with breadboard and jumper wires';

        $reserveRes = $this->postJson('/api/reservations', [
            'item_id' => (string) $this->p2pItem->_id,
            'due_time' => now()->addHours(4)->toIso8601String(),
            'collateral_held' => $collateral,
            'condition_out' => $conditionOut,
        ]);

        $reserveRes->assertStatus(201);
        $rentalId = $reserveRes->json('data.id');
        $rentalCode = $reserveRes->json('data.rental_code');

        // 3. Custodian checks out the P2P item -> Peer Lender receives PeerItemBorrowedMail
        Sanctum::actingAs($this->custodian);

        $checkoutRes = $this->postJson("/api/reservations/{$rentalId}/checkout");
        $checkoutRes->assertStatus(200);

        Mail::assertSent(PeerItemBorrowedMail::class, function (PeerItemBorrowedMail $mail) use ($rentalCode, $conditionOut) {
            $html = $mail->render();

            return $mail->hasTo($this->peerLender->email)
                && str_contains($html, $this->peerLender->name)
                && str_contains($html, $rentalCode)
                && str_contains($html, $this->p2pItem->name)
                && str_contains($html, $this->student->name)
                && str_contains($html, $conditionOut)
                && str_contains($html, '45.00')
                && str_contains($html, '#1B1642')
                && str_contains($html, '#F5A623');
        });

        // 4. Custodian checks in the P2P item -> Peer Lender receives PeerItemReturnedMail
        $conditionIn = 'All Arduino components verified intact on return';

        $checkinRes = $this->postJson("/api/reservations/{$rentalId}/checkin", [
            'condition_in' => $conditionIn,
            'mark_maintenance' => false,
        ]);
        $checkinRes->assertStatus(200);

        Mail::assertSent(PeerItemReturnedMail::class, function (PeerItemReturnedMail $mail) use ($rentalCode, $conditionIn) {
            $html = $mail->render();

            return $mail->hasTo($this->peerLender->email)
                && str_contains($html, $this->peerLender->name)
                && str_contains($html, $rentalCode)
                && str_contains($html, $this->p2pItem->name)
                && str_contains($html, $conditionIn)
                && str_contains($html, '45.00')
                && str_contains($html, '#1B1642')
                && str_contains($html, '#F5A623');
        });

        // Clean up
        Rental::where('_id', $rentalId)->delete();
        $this->p2pItem->availability_stat = 'available';
        $this->p2pItem->save();
    }
}
