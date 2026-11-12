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

    public function test_first_login_password_change_clears_must_change_password_and_sets_verified(): void
    {
        $studentId = '2024777002';
        \App\Models\User::where('id_number', $studentId)->delete();

        $student = \App\Models\User::create([
            'id_number' => $studentId,
            'name' => 'Carlos Mendoza',
            'email' => 'carlos.mendoza@ustp.edu.ph',
            'password' => \Illuminate\Support\Facades\Hash::make('USTP@2024777002'),
            'role' => 'student',
            'contact_number' => '+639172223344',
            'status' => 'active',
            'must_change_password' => true,
            'email_verified_at' => null,
            'verification_code' => \Illuminate\Support\Facades\Hash::make('123456'),
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($student);

        $response = $this->postJson('/api/auth/change-password', [
            'current_password' => 'USTP@2024777002',
            'password' => 'NewSecurePass#2026',
            'password_confirmation' => 'NewSecurePass#2026',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.must_change_password', false);

        $this->assertNotNull($response->json('user.email_verified_at'));

        $freshStudent = \App\Models\User::find($student->_id);
        $this->assertFalse((bool) $freshStudent->must_change_password);
        $this->assertNotNull($freshStudent->email_verified_at);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('NewSecurePass#2026', $freshStudent->password));
    }

    public function test_first_login_password_change_rejects_wrong_current_password(): void
    {
        $studentId = '2024777003';
        \App\Models\User::where('id_number', $studentId)->delete();

        $student = \App\Models\User::create([
            'id_number' => $studentId,
            'name' => 'Diana Reyes',
            'email' => 'diana.reyes@ustp.edu.ph',
            'password' => \Illuminate\Support\Facades\Hash::make('USTP@2024777003'),
            'role' => 'student',
            'contact_number' => '+639173334455',
            'status' => 'active',
            'must_change_password' => true,
            'email_verified_at' => null,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($student);

        $response = $this->postJson('/api/auth/change-password', [
            'current_password' => 'WrongPassword123',
            'password' => 'NewSecurePass#2026',
            'password_confirmation' => 'NewSecurePass#2026',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);

        $this->assertTrue((bool) \App\Models\User::find($student->_id)->must_change_password);
    }

    public function test_forgot_password_sends_otp_email_and_resets_password_on_valid_otp(): void
    {
        \Illuminate\Support\Facades\Mail::fake();

        $studentId = '2024777004';
        \App\Models\User::where('id_number', $studentId)->delete();

        $student = \App\Models\User::create([
            'id_number' => $studentId,
            'name' => 'Elena Villanueva',
            'email' => 'elena.villanueva@ustp.edu.ph',
            'password' => \Illuminate\Support\Facades\Hash::make('OldPassword123'),
            'role' => 'student',
            'contact_number' => '+639174445566',
            'status' => 'active',
        ]);

        $forgotResponse = $this->postJson('/api/auth/forgot-password', [
            'login' => $studentId,
        ]);

        $forgotResponse->assertStatus(200);

        $capturedOtp = null;
        \Illuminate\Support\Facades\Mail::assertSent(\App\Mail\PasswordResetOtpMail::class, function ($mail) use (&$capturedOtp) {
            $capturedOtp = $mail->otpCode;
            $html = $mail->render();
            return $mail->hasTo('elena.villanueva@ustp.edu.ph')
                && preg_match('/^\d{6}$/', $mail->otpCode) === 1
                && str_contains($html, $mail->otpCode);
        });

        $this->assertNotNull($capturedOtp);

        $resetResponse = $this->postJson('/api/auth/reset-password', [
            'login' => $studentId,
            'otp' => $capturedOtp,
            'password' => 'ResetSecure#2026',
            'password_confirmation' => 'ResetSecure#2026',
        ]);

        $resetResponse->assertStatus(200);

        $freshStudent = \App\Models\User::find($student->_id);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('ResetSecure#2026', $freshStudent->password));
        $this->assertNull($freshStudent->password_reset_otp);
        $this->assertNull($freshStudent->password_reset_expires_at);
    }

    public function test_forgot_password_rejects_unknown_account_and_sends_no_email(): void
    {
        \Illuminate\Support\Facades\Mail::fake();

        $response = $this->postJson('/api/auth/forgot-password', [
            'login' => '2099999999',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['login']);

        \Illuminate\Support\Facades\Mail::assertNothingSent();
    }

    public function test_reset_password_rejects_invalid_and_expired_otp(): void
    {
        $studentId = '2024777005';
        \App\Models\User::where('id_number', $studentId)->delete();

        $student = \App\Models\User::create([
            'id_number' => $studentId,
            'name' => 'Francis Lim',
            'email' => 'francis.lim@ustp.edu.ph',
            'password' => \Illuminate\Support\Facades\Hash::make('OriginalPass123'),
            'role' => 'student',
            'contact_number' => '+639175556677',
            'status' => 'active',
            'password_reset_otp' => \Illuminate\Support\Facades\Hash::make('654321'),
            'password_reset_expires_at' => now()->addMinutes(15),
        ]);

        // 1. Invalid OTP code
        $invalidResponse = $this->postJson('/api/auth/reset-password', [
            'login' => $studentId,
            'otp' => '000000',
            'password' => 'AttemptedPass#1',
            'password_confirmation' => 'AttemptedPass#1',
        ]);

        $invalidResponse->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        // 2. Expired OTP code
        $student->password_reset_expires_at = now()->subMinute();
        $student->save();

        $expiredResponse = $this->postJson('/api/auth/reset-password', [
            'login' => $studentId,
            'otp' => '654321',
            'password' => 'AttemptedPass#2',
            'password_confirmation' => 'AttemptedPass#2',
        ]);

        $expiredResponse->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('OriginalPass123', \App\Models\User::find($student->_id)->password));
    }

    public function test_reset_password_clears_otp_preventing_replay_and_revokes_tokens(): void
    {
        $studentId = '2024777006';
        \App\Models\User::where('id_number', $studentId)->delete();

        $student = \App\Models\User::create([
            'id_number' => $studentId,
            'name' => 'Grace Tan',
            'email' => 'grace.tan@ustp.edu.ph',
            'password' => \Illuminate\Support\Facades\Hash::make('OriginalPass123'),
            'role' => 'student',
            'contact_number' => '+639176667788',
            'status' => 'active',
            'password_reset_otp' => \Illuminate\Support\Facades\Hash::make('112233'),
            'password_reset_expires_at' => now()->addMinutes(15),
        ]);

        $student->createToken('test-device');
        $this->assertCount(1, $student->tokens()->get());

        $firstReset = $this->postJson('/api/auth/reset-password', [
            'login' => $studentId,
            'otp' => '112233',
            'password' => 'FreshPassword#2026',
            'password_confirmation' => 'FreshPassword#2026',
        ]);
        $firstReset->assertStatus(200);

        $this->assertCount(0, $student->tokens()->get());

        // Replay attempt with same OTP must fail with 422
        $replayReset = $this->postJson('/api/auth/reset-password', [
            'login' => $studentId,
            'otp' => '112233',
            'password' => 'AnotherPassword#2026',
            'password_confirmation' => 'AnotherPassword#2026',
        ]);
        $replayReset->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);
    }
}
