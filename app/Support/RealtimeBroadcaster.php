<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

class RealtimeBroadcaster
{
    /**
     * Dispatch a broadcast event without letting WebSocket / Reverb outages
     * break core REST API responses.
     */
    public static function dispatch(object $event): void
    {
        try {
            event($event);
        } catch (\Throwable $e) {
            Log::warning('Realtime broadcast failed: ' . $e->getMessage(), [
                'event' => get_class($event),
            ]);
        }
    }
}
