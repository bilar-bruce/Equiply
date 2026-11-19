<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendTransactionalMailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 30;

    public function __construct(
        public string $recipient,
        public Mailable $mailable,
    ) {}

    public function handle(): void
    {
        try {
            Mail::to($this->recipient)->send($this->mailable);
        } catch (\Throwable $e) {
            Log::warning('Queued transactional mail delivery failed: ' . $e->getMessage(), [
                'recipient' => $this->recipient,
                'mailable' => get_class($this->mailable),
            ]);
        }
    }
}
