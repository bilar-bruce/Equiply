<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\View;
use Resend\Laravel\Facades\Resend;
use Tests\TestCase;

class EmailAuthLifecycleTest extends TestCase
{
    public function test_resend_mailer_and_ustp_email_layout_are_configured(): void
    {
        $this->assertTrue(class_exists(Resend::class), 'Resend Laravel package must be installed.');
        $this->assertSame(['resend', 'log'], config('mail.mailers.failover.mailers'));

        $envExample = file_get_contents(base_path('.env.example'));
        $this->assertStringContainsString('MAIL_MAILER=resend', $envExample);
        $this->assertStringContainsString('RESEND_KEY=', $envExample);
        $this->assertStringContainsString('MAIL_FROM_ADDRESS="noreply@equiply.ustp.edu.ph"', $envExample);
        $this->assertStringContainsString('MAIL_FROM_NAME="Equiply • USTP Facility Operations"', $envExample);

        $this->assertTrue(View::exists('emails.layout'), 'Base USTP email layout view must exist.');
        $rendered = View::file(resource_path('views/emails/layout.blade.php'))->render();
        $this->assertStringContainsString('#1B1642', $rendered);
        $this->assertStringContainsString('#F5A623', $rendered);
    }
}
