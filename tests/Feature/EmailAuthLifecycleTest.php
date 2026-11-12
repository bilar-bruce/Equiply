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

    public function test_direct_user_creation_defaults_must_change_password_to_false(): void
    {
        \App\Models\User::where('id_number', '2024888001')->delete();

        $user = \App\Models\User::create([
            'id_number' => '2024888001',
            'name' => 'Seeded Student',
            'email' => 'seeded.888001@campus.edu',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'student',
            'contact_number' => '+639170008801',
        ]);

        $this->assertFalse((bool) $user->must_change_password);
    }

    public function test_desk_enrollment_sends_welcome_email_and_flags_must_change_password(): void
    {
        \Illuminate\Support\Facades\Mail::fake();

        $custodian = \App\Models\User::updateOrCreate(
            ['email' => 'custodian@campus.edu'],
            [
                'id_number' => '2019100041',
                'name' => 'Maria Santos',
                'password' => \Illuminate\Support\Facades\Hash::make('custodian123'),
                'role' => 'custodian',
                'is_peer_lender' => false,
                'contact_number' => '+639195551234',
                'status' => 'active',
            ]
        );

        $studentId = '2024777001';
        \App\Models\User::where('id_number', $studentId)->delete();

        \Laravel\Sanctum\Sanctum::actingAs($custodian);

        $response = $this->postJson('/api/admin/users', [
            'id_number' => $studentId,
            'name' => 'Bianca Navarro',
            'email' => 'bianca.navarro@ustp.edu.ph',
            'contact_number' => '+639171112233',
            'is_peer_lender' => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('temporary_password', 'USTP@2024777001')
            ->assertJsonPath('user.must_change_password', true)
            ->assertJsonPath('user.email_verified_at', null);

        \Illuminate\Support\Facades\Mail::assertSent(\App\Mail\StudentEnrolledWelcomeMail::class, function ($mail) use ($studentId) {
            $html = $mail->render();
            return $mail->hasTo('bianca.navarro@ustp.edu.ph')
                && $mail->user->id_number === $studentId
                && $mail->temporaryPassword === 'USTP@2024777001'
                && preg_match('/^\d{6}$/', $mail->verificationCode) === 1
                && str_contains($html, $studentId)
                && str_contains($html, 'USTP@2024777001')
                && str_contains($html, $mail->verificationCode);
        });
    }
}
