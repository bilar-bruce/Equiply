<?php

namespace App\Support;

use App\Jobs\SendTransactionalMailJob;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AsyncMailer
{
    /**
     * Dispatch transactional mail onto the local background queue so remote
     * Resend/SMTP latency never blocks HTTP API responses.
     */
    public static function send(?string $email, Mailable $mailable): void
    {
        if (! $email) {
            return;
        }

        if (app()->runningUnitTests() || config('queue.default') === 'sync') {
            try {
                Mail::to($email)->send($mailable);
            } catch (\Throwable $e) {
                Log::warning('Transactional mail delivery failed: ' . $e->getMessage(), [
                    'recipient' => $email,
                    'mailable' => get_class($mailable),
                ]);
            }

            return;
        }

        try {
            SendTransactionalMailJob::dispatch($email, $mailable);
        } catch (\Throwable $e) {
            Log::warning('Failed to enqueue transactional mail: ' . $e->getMessage(), [
                'recipient' => $email,
                'mailable' => get_class($mailable),
            ]);
        }
    }
}
