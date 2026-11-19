<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CustodianOperationsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $action,
        public string $title,
        public string $message,
        public ?string $entityId = null,
        public ?string $actorId = null,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('custodian.ops'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'custodian.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'title' => $this->title,
            'message' => $this->message,
            'entity_id' => $this->entityId,
            'actor_id' => $this->actorId,
        ];
    }
}
