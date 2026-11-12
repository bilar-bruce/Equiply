# Milestone 11: Transactional Email Engine, Account Verification & Password Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Equiply's in-person Facility Desk account provisioning (`AdminController@store`) to a Resend transactional email pipeline, enforce first-login password updates via a backend endpoint and React modal gate, and provide self-service 6-digit email OTP password recovery.

**Architecture:** Laravel 12 Mailable classes (`StudentEnrolledWelcomeMail`, `PasswordResetOtpMail`) render a shared USTP Navy/Gold Blade layout (`resources/views/emails/layout.blade.php`) and dispatch through Resend with local `log` failover. `App\Models\User` (MongoDB `users` collection) stores `must_change_password`, `email_verified_at`, `verification_code`, `password_reset_otp`, and `password_reset_expires_at` as embedded document fields. The React 19 SPA enforces first-login password updates via `ForcePasswordChangeModal.jsx` inside `MainApp.jsx` and provides a 3-step OTP recovery flow in `LoginPage.jsx`.

**Tech Stack:** PHP 8.2+, Laravel 12, `mongodb/laravel-mongodb` `^5.12`, `resend/resend-laravel`, React 19, Tailwind CSS v4, Vite, PHPUnit 11.

**Spec:** `docs/superpowers/specs/2026-11-12-milestone-11-email-auth-lifecycle-design.md`

## Global Constraints

- **Database:** MongoDB (`mongodb` connection, `users` collection) via `MongoDB\Laravel\Auth\User`.
- **Brand Colors:** USTP Deep Navy (`#1B1642`) and USTP Gold (`#F5A623`).
- **Environment Defaults (`.env.example`):** `MAIL_MAILER=resend`, `RESEND_KEY=`, `MAIL_FROM_ADDRESS="noreply@equiply.ustp.edu.ph"`, `MAIL_FROM_NAME="Equiply • USTP Facility Operations"`.
- **Backward Compatibility:** `User::$attributes['must_change_password']` MUST default to `false` so seeded users and existing tests (`AdminAccountManagementTest`, `ReservationLifecycleTest`, `RoleFunctionalityAuditTest`, `AdversarialStressTest`, `EquiplyApiTest`) continue to pass without modification; `AdminController@store` explicitly sets `must_change_password => true`.
- **Security:** Verification codes and password reset OTPs must be hashed with `Hash::make()` before saving to MongoDB and listed in `User::$hidden`.
- **Git Policy:** Create local commits on the `test` branch only. **NEVER** run `git push`.

## Review Focus

1. **Direct user creation vs. desk enrollment:** `User::create()` without explicit `must_change_password` must default to `false` so seeded/test users are not locked out, while `AdminController@store` sets `must_change_password = true`.
2. **Incorrect current password during first-login change:** Submitting the wrong `current_password` to `POST /api/auth/change-password` must return HTTP 422 on `current_password` and leave `must_change_password` as `true`.
3. **Unknown login identifier on forgot-password:** Submitting an unregistered 10-digit ID or email to `POST /api/auth/forgot-password` must return HTTP 422 on `login` and send zero emails.
4. **Expired or mismatched 6-digit OTP on reset-password:** Submitting an OTP after its 15-minute expiry (`password_reset_expires_at < now()`) or a wrong 6-digit code must return HTTP 422 on `otp` and keep the existing password intact.
5. **OTP replay prevention & token revocation on reset:** Reusing a 6-digit OTP after a successful `POST /api/auth/reset-password` must return HTTP 422 on `otp`, and any pre-existing Sanctum personal access tokens for that user must be deleted.

---

### Task 1: Resend Mailer, Failover Configuration & USTP Email Layout (Phase 11.1)

**Files:**
- Modify: `composer.json` / `composer.lock` (via `composer require resend/resend-laravel`)
- Modify: `config/services.php`
- Modify: `config/mail.php`
- Modify: `.env.example`
- Create: `resources/views/emails/layout.blade.php`
- Create: `tests/Feature/EmailAuthLifecycleTest.php`

**Interfaces:**
- Consumes: Laravel `config('services.resend.key')`, `config('mail.mailers.failover')`, Blade view engine.
- Produces:
  - `config('services.resend.key')` reading `env('RESEND_KEY', env('RESEND_API_KEY'))`
  - `config('mail.mailers.failover.mailers')` set to `['resend', 'log']`
  - Blade layout `emails.layout` (`resources/views/emails/layout.blade.php`) with `@yield('title', 'Equiply • USTP Facility Operations')` and `@yield('content')`, styled with `#1B1642` and `#F5A623`
  - Initial `tests/Feature/EmailAuthLifecycleTest.php` class

- [ ] **Step 1: Write the failing test in `tests/Feature/EmailAuthLifecycleTest.php`**

Create `tests/Feature/EmailAuthLifecycleTest.php` with `test_resend_mailer_and_ustp_email_layout_are_configured()`:

```php
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=EmailAuthLifecycleTest`
Expected: FAIL (`Resend Laravel package must be installed` or failover config mismatch)

- [ ] **Step 3: Install `resend/resend-laravel`, update mail/service configs & `.env.example`, and create `resources/views/emails/layout.blade.php`**

1. Run `composer require resend/resend-laravel --no-interaction`.
2. In `config/services.php`, update `'resend'` to:
   ```php
   'resend' => [
       'key' => env('RESEND_KEY', env('RESEND_API_KEY')),
   ],
   ```
3. In `config/mail.php`, update `'failover'` mailers to `['resend', 'log']`.
4. In `.env.example`, set:
   ```dotenv
   MAIL_MAILER=resend
   RESEND_KEY=
   MAIL_SCHEME=null
   MAIL_HOST=127.0.0.1
   MAIL_PORT=2525
   MAIL_USERNAME=null
   MAIL_PASSWORD=null
   MAIL_FROM_ADDRESS="noreply@equiply.ustp.edu.ph"
   MAIL_FROM_NAME="Equiply • USTP Facility Operations"
   ```
5. Create `resources/views/emails/layout.blade.php` with USTP Deep Navy (`#1B1642`) header, USTP Gold (`#F5A623`) accent border/badge, `@yield('content')` body container, and USTP Facility Operations footer.

- [ ] **Step 4: Run test to verify it passes**

Run: `php artisan test --filter=EmailAuthLifecycleTest`
Expected: PASS

- [ ] **Step 5: Commit locally**

```bash
git add composer.json composer.lock config/services.php config/mail.php .env.example resources/views/emails/layout.blade.php tests/Feature/EmailAuthLifecycleTest.php
git commit -m "feat(mail): configure Resend mailer failover and USTP email layout"
```

---

### Task 2: Desk Provisioning Welcome Email & Verification Fields (Phase 11.2)

**Files:**
- Modify: `app/Models/User.php`
- Modify: `app/Http/Resources/UserResource.php`
- Create: `app/Mail/StudentEnrolledWelcomeMail.php`
- Create: `resources/views/emails/student-enrolled-welcome.blade.php`
- Modify: `app/Http/Controllers/Api/AdminController.php`
- Modify: `tests/Feature/EmailAuthLifecycleTest.php`

**Interfaces:**
- Consumes: `emails.layout` Blade view from Task 1.
- Produces:
  - `App\Models\User` fillable/casted attributes: `must_change_password` (`boolean`, default `false` on model), `email_verified_at` (`datetime|null`), `verification_code` (`string|null`, hidden), `password_reset_otp` (`string|null`, hidden), `password_reset_expires_at` (`datetime|null`).
  - `App\Http\Resources\UserResource` keys: `'must_change_password' => (bool) $this->must_change_password`, `'email_verified_at' => $this->email_verified_at?->toIso8601String()`.
  - `App\Mail\StudentEnrolledWelcomeMail::__construct(public User $user, public string $temporaryPassword, public string $verificationCode)` rendering `emails.student-enrolled-welcome`.
  - `AdminController@store` sets `'must_change_password' => true`, `'email_verified_at' => null`, `'verification_code' => Hash::make($verificationCode)`, and dispatches `Mail::to($user->email)->send(new StudentEnrolledWelcomeMail($user, $plainPassword, $verificationCode))`.

- [ ] **Step 1: Write the failing tests in `tests/Feature/EmailAuthLifecycleTest.php`**

Add `test_direct_user_creation_defaults_must_change_password_to_false()` and `test_desk_enrollment_sends_welcome_email_and_flags_must_change_password()` to `tests/Feature/EmailAuthLifecycleTest.php`:

```php
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=EmailAuthLifecycleTest`
Expected: FAIL (`user.must_change_password` missing and `StudentEnrolledWelcomeMail` class not found)

- [ ] **Step 3: Implement `User` fields, `UserResource` serialization, `StudentEnrolledWelcomeMail`, Blade view, and `AdminController@store` dispatch**

1. Update `app/Models/User.php`:
   - Add `'must_change_password'`, `'email_verified_at'`, `'verification_code'`, `'password_reset_otp'`, `'password_reset_expires_at'` to `$fillable`.
   - Add `'must_change_password' => false` to `$attributes`.
   - Add `'verification_code'`, `'password_reset_otp'` to `$hidden`.
   - Add `'must_change_password' => 'boolean'` and `'password_reset_expires_at' => 'datetime'` to `casts()`.
2. Update `app/Http/Resources/UserResource.php` to include:
   ```php
   'must_change_password' => (bool) $this->must_change_password,
   'email_verified_at' => $this->email_verified_at?->toIso8601String(),
   ```
3. Create `app/Mail/StudentEnrolledWelcomeMail.php` and `resources/views/emails/student-enrolled-welcome.blade.php` extending `emails.layout`.
4. Update `app/Http/Controllers/Api/AdminController.php` in `store()`:
   - Generate `$verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);`
   - Persist `'must_change_password' => true`, `'email_verified_at' => null`, `'verification_code' => Hash::make($verificationCode)`.
   - Send `Mail::to($user->email)->send(new StudentEnrolledWelcomeMail($user, $plainPassword, $verificationCode));`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `php artisan test --filter=EmailAuthLifecycleTest` and `php artisan test`
Expected: PASS

- [ ] **Step 5: Commit locally**

```bash
git add app/Models/User.php app/Http/Resources/UserResource.php app/Mail/StudentEnrolledWelcomeMail.php resources/views/emails/student-enrolled-welcome.blade.php app/Http/Controllers/Api/AdminController.php tests/Feature/EmailAuthLifecycleTest.php
git commit -m "feat(auth): send welcome email on desk enrollment and track must_change_password"
```

---

### Task 3: Forced First-Login Password Change Flow (Phase 11.3)

**Files:**
- Modify: `routes/api.php`
- Modify: `app/Http/Controllers/Api/AuthController.php`
- Modify: `resources/js/api/client.js`
- Modify: `resources/js/context/AuthContext.jsx`
- Create: `resources/js/components/ForcePasswordChangeModal.jsx`
- Modify: `resources/js/MainApp.jsx`
- Modify: `tests/Feature/EmailAuthLifecycleTest.php`

**Interfaces:**
- Consumes: `User::must_change_password`, `User::email_verified_at`, `UserResource` from Task 2.
- Produces:
  - Protected route `POST /api/auth/change-password` → `AuthController@changePassword(Request $request): JsonResponse`
  - Request payload: `{ current_password: string, password: string, password_confirmation: string }`
  - Response (HTTP 200): `{ message: 'Password updated and account verified successfully.', user: UserResource }`
  - `authApi.changePassword(payload)` in `resources/js/api/client.js`
  - `updateUser(updatedUser)` exposed from `useAuth()` in `resources/js/context/AuthContext.jsx`
  - `ForcePasswordChangeModal.jsx` rendered in `MainApp.jsx` when `isAuthenticated && user?.must_change_password === true`

- [ ] **Step 1: Write the failing tests in `tests/Feature/EmailAuthLifecycleTest.php`**

Add `test_first_login_password_change_clears_must_change_password_and_sets_verified()` and `test_first_login_password_change_rejects_wrong_current_password()` to `tests/Feature/EmailAuthLifecycleTest.php`:

```php
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=EmailAuthLifecycleTest`
Expected: FAIL (404 Not Found on `POST /api/auth/change-password`)

- [ ] **Step 3: Implement `POST /api/auth/change-password`, `authApi.changePassword`, `AuthContext.updateUser`, `ForcePasswordChangeModal.jsx`, and `MainApp.jsx` gate**

1. In `routes/api.php` inside `Route::middleware('auth:sanctum')->group(...)` under `Route::prefix('auth')`:
   - Add `Route::post('/change-password', [AuthController::class, 'changePassword']);`
2. In `app/Http/Controllers/Api/AuthController.php`:
   - Implement `changePassword(Request $request): JsonResponse`:
     - Validate `'current_password' => 'required|string'`, `'password' => 'required|string|min:8|confirmed'`.
     - Check `Hash::check($validated['current_password'], $user->password)` or throw `ValidationException::withMessages(['current_password' => ['The current password you entered is incorrect.']])`.
     - Update `$user->password = Hash::make($validated['password'])`, `$user->must_change_password = false`, `$user->email_verified_at = $user->email_verified_at ?? now()`, `$user->verification_code = null`, `$user->save()`.
     - Return `response()->json(['message' => 'Password updated and account verified successfully.', 'user' => new UserResource($user)])`.
3. In `resources/js/api/client.js`:
   - Add `changePassword: async (payload) => { const res = await api.post('/auth/change-password', payload); return res.data; }` to `authApi`.
4. In `resources/js/context/AuthContext.jsx`:
   - Add `updateUser = (updatedUser) => { setUser(updatedUser); localStorage.setItem('equiply_user', JSON.stringify(updatedUser)); };` and include `updateUser` in the `AuthContext.Provider` value.
5. Create `resources/js/components/ForcePasswordChangeModal.jsx` and render it in `resources/js/MainApp.jsx` when `isAuthenticated && user?.must_change_password === true` so the user must update their temporary password before interacting with the portal (with a toast on completion).

- [ ] **Step 4: Run tests and frontend build to verify they pass**

Run: `php artisan test --filter=EmailAuthLifecycleTest` and `npm run build`
Expected: PASS and Vite build exits 0

- [ ] **Step 5: Commit locally**

```bash
git add routes/api.php app/Http/Controllers/Api/AuthController.php resources/js/api/client.js resources/js/context/AuthContext.jsx resources/js/components/ForcePasswordChangeModal.jsx resources/js/MainApp.jsx tests/Feature/EmailAuthLifecycleTest.php
git commit -m "feat(auth): enforce first-login password change endpoint and modal gate"
```

---

### Task 4: Self-Service Password Reset via 6-Digit Email OTP & `LoginPage.jsx` Stepper (Phase 11.4 & 11.5)

**Files:**
- Create: `app/Mail/PasswordResetOtpMail.php`
- Create: `resources/views/emails/password-reset-otp.blade.php`
- Modify: `routes/api.php`
- Modify: `app/Http/Controllers/Api/AuthController.php`
- Modify: `resources/js/api/client.js`
- Modify: `resources/js/components/LoginPage.jsx`
- Modify: `tests/Feature/EmailAuthLifecycleTest.php`

**Interfaces:**
- Consumes: `emails.layout` (Task 1), `User::password_reset_otp` and `User::password_reset_expires_at` (Task 2).
- Produces:
  - `App\Mail\PasswordResetOtpMail::__construct(public User $user, public string $otpCode, public int $expiresInMinutes = 15)` rendering `emails.password-reset-otp`.
  - Public route `POST /api/auth/forgot-password` → `AuthController@forgotPassword(Request $request): JsonResponse` accepting `{ login: string }` (10-digit ID or email).
  - Public route `POST /api/auth/reset-password` → `AuthController@resetPassword(Request $request): JsonResponse` accepting `{ login: string, otp: string, password: string, password_confirmation: string }`.
  - `authApi.forgotPassword(login)` and `authApi.resetPassword(payload)` in `resources/js/api/client.js`.
  - Interactive *"Forgot Password?"* stepper in `resources/js/components/LoginPage.jsx` (Request OTP → Enter 6-Digit Code & New Password → Return to Sign In).

- [ ] **Step 1: Write the failing tests in `tests/Feature/EmailAuthLifecycleTest.php`**

Add `test_forgot_password_sends_otp_email_and_resets_password_on_valid_otp()`, `test_forgot_password_rejects_unknown_account_and_sends_no_email()`, `test_reset_password_rejects_invalid_and_expired_otp()`, and `test_reset_password_clears_otp_preventing_replay_and_revokes_tokens()` to `tests/Feature/EmailAuthLifecycleTest.php`:

```php
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `php artisan test --filter=EmailAuthLifecycleTest`
Expected: FAIL (404 Not Found on `POST /api/auth/forgot-password` and `PasswordResetOtpMail` missing)

- [ ] **Step 3: Implement `PasswordResetOtpMail`, `forgotPassword`, `resetPassword`, `authApi` methods, and `LoginPage.jsx` stepper**

1. Create `app/Mail/PasswordResetOtpMail.php` and `resources/views/emails/password-reset-otp.blade.php` extending `emails.layout`.
2. In `routes/api.php` inside public `Route::prefix('auth')->group(...)`:
   - Add `Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);`
   - Add `Route::post('/reset-password', [AuthController::class, 'resetPassword']);`
3. In `app/Http/Controllers/Api/AuthController.php`:
   - Implement `forgotPassword(Request $request): JsonResponse` and `resetPassword(Request $request): JsonResponse`.
4. In `resources/js/api/client.js`:
   - Add `forgotPassword: async (login) => (await api.post('/auth/forgot-password', { login })).data` and `resetPassword: async (payload) => (await api.post('/auth/reset-password', payload)).data` to `authApi`.
5. In `resources/js/components/LoginPage.jsx`:
   - Add *"Forgot Password?"* trigger and interactive 3-step recovery stepper (`request` → `verify` → `done`) with client-side validation and error/success states.

- [ ] **Step 4: Run full test suite and frontend build to verify everything passes**

Run: `php artisan test` and `npm run build`
Expected: All PHPUnit test suites PASS and Vite production build exits 0

- [ ] **Step 5: Commit locally**

```bash
git add app/Mail/PasswordResetOtpMail.php resources/views/emails/password-reset-otp.blade.php routes/api.php app/Http/Controllers/Api/AuthController.php resources/js/api/client.js resources/js/components/LoginPage.jsx tests/Feature/EmailAuthLifecycleTest.php
git commit -m "feat(auth): add 6-digit email OTP password reset flow and LoginPage stepper"
```
