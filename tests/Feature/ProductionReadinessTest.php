<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ProductionReadinessTest extends TestCase
{
    public function test_operational_commands_are_registered_in_scheduler(): void
    {
        $schedule = app(Schedule::class);
        $events = collect($schedule->events());

        $remindersEvent = $events->first(fn ($event) => str_contains($event->command ?? '', 'equiply:send-loan-reminders'));
        $expiryEvent = $events->first(fn ($event) => str_contains($event->command ?? '', 'equiply:expire-unclaimed-reservations'));

        $this->assertNotNull($remindersEvent, 'equiply:send-loan-reminders must be scheduled.');
        $this->assertNotNull($expiryEvent, 'equiply:expire-unclaimed-reservations must be scheduled.');

        $this->assertSame('*/5 * * * *', $remindersEvent->expression);
        $this->assertSame('*/5 * * * *', $expiryEvent->expression);
    }

    public function test_resend_and_smtp_mailers_are_configured_and_resolvable(): void
    {
        $mailers = config('mail.mailers');

        $this->assertArrayHasKey('resend', $mailers);
        $this->assertSame('resend', $mailers['resend']['transport']);

        $this->assertArrayHasKey('smtp', $mailers);
        $this->assertSame('smtp', $mailers['smtp']['transport']);

        $this->assertNotNull(Mail::mailer('smtp'));
        $this->assertNotNull(Mail::mailer('log'));
    }
}
