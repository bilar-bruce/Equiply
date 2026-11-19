<?php

namespace Tests\Unit;

use App\Events\CatalogUpdated;
use App\Events\CustodianOperationsUpdated;
use App\Events\UserNotificationBroadcast;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Tests\TestCase;

class RealtimeEventsTest extends TestCase
{
    public function test_catalog_updated_event_broadcasts_now_on_public_catalog_channel(): void
    {
        $event = new CatalogUpdated(
            action: 'reserved',
            itemId: 'item-123',
            itemCode: 'EQ-001',
            itemName: 'Oscilloscope',
            availabilityStat: 'reserved',
        );

        $this->assertInstanceOf(ShouldBroadcastNow::class, $event);
        $this->assertSame('catalog.updated', $event->broadcastAs());

        $channels = $event->broadcastOn();
        $this->assertCount(1, $channels);
        $this->assertInstanceOf(Channel::class, $channels[0]);
        $this->assertSame('catalog', $channels[0]->name);

        $this->assertSame([
            'action' => 'reserved',
            'item_id' => 'item-123',
            'item_code' => 'EQ-001',
            'item_name' => 'Oscilloscope',
            'availability_stat' => 'reserved',
        ], $event->broadcastWith());
    }

    public function test_custodian_operations_event_broadcasts_now_on_private_custodian_channel(): void
    {
        $event = new CustodianOperationsUpdated(
            action: 'reservation_created',
            title: 'New Reservation Request',
            message: 'Student reserved Oscilloscope.',
            entityId: 'rent-456',
            actorId: 'user-789',
        );

        $this->assertInstanceOf(ShouldBroadcastNow::class, $event);
        $this->assertSame('custodian.updated', $event->broadcastAs());

        $channels = $event->broadcastOn();
        $this->assertCount(1, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertSame('private-custodian.ops', $channels[0]->name);

        $this->assertSame([
            'action' => 'reservation_created',
            'title' => 'New Reservation Request',
            'message' => 'Student reserved Oscilloscope.',
            'entity_id' => 'rent-456',
            'actor_id' => 'user-789',
        ], $event->broadcastWith());
    }

    public function test_user_notification_event_broadcasts_now_on_private_user_channel(): void
    {
        $event = new UserNotificationBroadcast(
            userId: '507f1f77bcf86cd799439011',
            action: 'rental_checked_out',
            scope: 'rentals',
            title: 'Equipment Dispatched',
            message: 'Your rental is now active.',
            tone: 'success',
            entityId: 'rent-456',
        );

        $this->assertInstanceOf(ShouldBroadcastNow::class, $event);
        $this->assertSame('user.updated', $event->broadcastAs());

        $channels = $event->broadcastOn();
        $this->assertCount(1, $channels);
        $this->assertInstanceOf(PrivateChannel::class, $channels[0]);
        $this->assertSame('private-users.507f1f77bcf86cd799439011', $channels[0]->name);

        $this->assertSame([
            'action' => 'rental_checked_out',
            'scope' => 'rentals',
            'title' => 'Equipment Dispatched',
            'message' => 'Your rental is now active.',
            'tone' => 'success',
            'entity_id' => 'rent-456',
        ], $event->broadcastWith());
    }
}
