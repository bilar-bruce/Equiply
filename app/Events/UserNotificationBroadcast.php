<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserNotificationBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $userId,
        public string $action,
        public string $scope,
        public string $title,
        public string $message,
        public string $tone = 'info',
        public ?string $entityId = null,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("users.{$this->userId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'user.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'scope' => $this->scope,
            'title' => $this->title,
            'message' => $this->message,
            'tone' => $this->tone,
            'entity_id' => $this->entityId,
        ];
    }
}
