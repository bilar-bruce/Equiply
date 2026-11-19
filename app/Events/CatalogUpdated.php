<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CatalogUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $action,
        public ?string $itemId = null,
        public ?string $itemCode = null,
        public ?string $itemName = null,
        public ?string $availabilityStat = null,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('catalog'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'catalog.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'item_id' => $this->itemId,
            'item_code' => $this->itemCode,
            'item_name' => $this->itemName,
            'availability_stat' => $this->availabilityStat,
        ];
    }
}
