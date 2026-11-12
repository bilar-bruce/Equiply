# Milestone 11 Design Spec: Transactional Email Engine, Account Verification & Password Security

**Date:** 2026-11-12
**Milestone:** Milestone 11 (`Superpowers.md`)
**Branch:** `test` (local commits only; do not push to `origin`)

---

## 1. Intent & Why

Equiply enforces an in-person Facility Desk account provisioning policy (`AdminController@store`): students present their physical USTP School ID at the desk, and a Custodian or Administrator enrolls their account with a temporary password (`USTP@<id_number>`).

Currently:
1. No transactional email is sent when an account is provisioned at the desk.
2. Newly enrolled users are not required to change their default `USTP@<id_number>` temporary password upon first login.
3. Users who forget their password have no self-service way to reset it via their verified campus email.

Milestone 11 closes all three gaps by connecting Equiply to **Resend** (with local `log` failover), sending a USTP-branded welcome & verification email on desk enrollment, gating first-login access behind a mandatory password change modal, and providing a 3-step 6-digit email OTP password recovery flow on `LoginPage.jsx`.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- Install `resend/resend-laravel` and configure Laravel mail failover (`resend` → `log`) and `config/services.php` (`RESEND_KEY` with fallback to `RESEND_API_KEY`).
- Create a reusable USTP-branded HTML email layout (`resources/views/emails/layout.blade.php`) using USTP Deep Navy (`#1B1642`) and USTP Gold (`#F5A623`).
- Track `must_change_password` (`bool`) and `email_verified_at` (`datetime|null`) on `App\Models\User` and expose them in `App\Http\Resources\UserResource`.
- Send `App\Mail\StudentEnrolledWelcomeMail` in `AdminController@store` containing the user's 10-digit `id_number`, temporary password, and a 6-digit verification code.
- Provide `POST /api/auth/change-password` (`auth:sanctum`) to update the user's password, set `must_change_password = false`, and set `email_verified_at = now()`.
- Intercept authenticated users whose `user.must_change_password === true` in `MainApp.jsx` using `ForcePasswordChangeModal.jsx` before they can reserve gear or navigate the portal.
- Provide `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` backed by a hashed 6-digit OTP and 15-minute expiration stored on the MongoDB `User` document, sending `App\Mail\PasswordResetOtpMail` and revoking stale Sanctum tokens on reset.
- Add an interactive *"Forgot Password?"* stepper to `LoginPage.jsx` (Step 1: Request OTP by 10-digit ID or email → Step 2: Enter 6-digit OTP + new password & confirmation → Step 3: Success confirmation & return to Sign In).
- Verify the full lifecycle deterministically in `tests/Feature/EmailAuthLifecycleTest.php` using `Mail::fake()`.

### Non-Goals
- Public self-registration remains disabled (`403 Forbidden` on `POST /api/auth/register`).
- SMS OTP delivery is out of scope; all transactional messages use email via Laravel Mailables.
- Borrowing/checkout/overdue receipt emails belong to Milestone 12.

### Anti-Goals
- Breaking existing seeded users or existing feature tests (`AdminAccountManagementTest`, `ReservationLifecycleTest`, `RoleFunctionalityAuditTest`, `AdversarialStressTest`, `EquiplyApiTest`) by defaulting `must_change_password` to `true` on `User::create()` outside `AdminController@store`.
- Storing plain-text password reset OTPs in MongoDB.
- Pushing any commits to `origin`.

---

## 3. Constraints

- **Database:** MongoDB (`mongodb/laravel-mongodb` `^5.12`), collection `users`.
- **Framework:** Laravel 12 (`php ^8.2`), React 19 + Tailwind CSS v4 via Vite.
- **Brand Palette:** USTP Deep Navy (`#1B1642`) and USTP Gold (`#F5A623`).
- **Git Policy:** Commit locally on branch `test`; **never** run `git push`.

---

## 4. Approaches Considered & Decisions Made

### Decision 1: First-Login Verification & Password Change Gate
- **Option A (Selected — Password-only gate with optional verification code):** `AdminController@store` generates a 6-digit verification code, stores its hash on the user (`verification_code`), sets `must_change_password = true` (when a temporary password is used, or on all desk-enrolled student accounts), and dispatches `StudentEnrolledWelcomeMail(user, plainPassword, verificationCode)`. `POST /api/auth/change-password` requires `current_password` and `password` (`min:8|confirmed`, plus must differ from `current_password` or temporary password if desired, though standard `min:8|confirmed` is required by spec), clears `must_change_password = false`, sets `email_verified_at = now()`, and clears `verification_code = null`.
  - *Why chosen:* Directly satisfies both Phase 11.2, Phase 11.3, and Phase 11.5 (`EmailAuthLifecycleTest.php`) specifications without blocking students when campus email delivery lags behind physical desk enrollment.
- **Option B (Strict OTP required inside `change-password`):** Requires `verification_code` in `POST /api/auth/change-password`.
  - *Why rejected:* Conflicts with Phase 11.3's explicit validation contract (`current_password`, `password` `min:8|confirmed`) and would break offline/desk-first onboarding when email is delayed.

### Decision 2: `must_change_password` Default Value Strategy
- **Option A (Selected — Model attribute default `false`, explicit `true` in `AdminController@store`):** `User::$attributes['must_change_password'] = false`. When `AdminController@store` provisions an account at the desk, it explicitly sets `'must_change_password' => true` and `'email_verified_at' => null`.
  - *Why chosen:* Preserves 100% backward compatibility with `DatabaseSeeder.php` and all 5 existing feature test files while enforcing the first-login password change on every desk-provisioned account.
- **Option B (Model attribute default `true`):** Every `User::create()` call defaults to `must_change_password = true`.
  - *Why rejected:* Immediately pollutes seeded accounts unless every seeder/test overrides it.

### Decision 3: MongoDB Storage for 6-Digit Password Reset OTP
- **Option A (Selected — Embedded fields on `User` document):** Store `password_reset_otp` (hashed via `Hash::make()`) and `password_reset_expires_at` (`datetime` cast, `now()->addMinutes(15)`) directly on the `User` document in `users`.
  - *Why chosen:* Idiomatic MongoDB document design—atomic single-document updates, zero extra collection joins, and simple expiration checks via Carbon.
- **Option B (Separate `password_reset_tokens` collection):** Use a separate collection keyed by email.
  - *Why rejected:* Adds unnecessary multi-collection queries for a 1:1 user OTP lifecycle in MongoDB.

---

## 5. Architecture & Component Specifications

### 5.1 Resend & Mail Configuration (Phase 11.1)
- `composer.json`: Require `resend/resend-laravel`.
- `config/services.php`:
  ```php
  'resend' => [
      'key' => env('RESEND_KEY', env('RESEND_API_KEY')),
  ],
  ```
- `config/mail.php`:
  Update `'failover'` mailers array to `['resend', 'log']`.
- `.env.example`:
  ```dotenv
  MAIL_MAILER=resend
  RESEND_KEY=
  MAIL_FROM_ADDRESS="noreply@equiply.ustp.edu.ph"
  MAIL_FROM_NAME="Equiply • USTP Facility Operations"
  ```
- `resources/views/emails/layout.blade.php`:
  Responsive HTML email layout with USTP Deep Navy (`#1B1642`) header, USTP Gold (`#F5A623`) accent bar/badges, clean content slot (`@yield('content')`), and USTP Facility Operations footer.

### 5.2 Desk Provisioning Welcome Email (Phase 11.2)
- `App\Models\User`:
  - Add `'must_change_password'`, `'email_verified_at'`, `'verification_code'`, `'password_reset_otp'`, `'password_reset_expires_at'` to `$fillable`.
  - Add `'verification_code'` and `'password_reset_otp'` to `$hidden`.
  - Add `'must_change_password' => false` to `$attributes`.
  - Add `'must_change_password' => 'boolean'` and `'password_reset_expires_at' => 'datetime'` to `casts()`.
- `App\Http\Resources\UserResource`:
  - Expose `'must_change_password' => (bool) $this->must_change_password` and `'email_verified_at' => $this->email_verified_at?->toIso8601String()`.
- `App\Mail\StudentEnrolledWelcomeMail`:
  - Public properties: `public User $user`, `public string $temporaryPassword`, `public string $verificationCode`.
  - Subject: `'Welcome to Equiply • Your USTP Campus Equipment Portal Account'`.
  - Markdown/Blade view: `resources/views/emails/student-enrolled-welcome.blade.php` extending `emails.layout`, displaying `id_number`, `temporaryPassword`, and `verificationCode`.
- `AdminController@store`:
  - Generate 6-digit `$verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT)`.
  - Create user with `'must_change_password' => true`, `'email_verified_at' => null`, `'verification_code' => Hash::make($verificationCode)`.
  - Dispatch `Mail::to($user->email)->send(new StudentEnrolledWelcomeMail($user, $plainPassword, $verificationCode))`.

### 5.3 Forced First-Login Password Change (Phase 11.3)
- Route: `POST /api/auth/change-password` inside `auth:sanctum` middleware group (`AuthController@changePassword`).
- Request validation:
  - `'current_password' => 'required|string'`
  - `'password' => 'required|string|min:8|confirmed'`
- Behavior:
  - Verify `Hash::check($validated['current_password'], $user->password)`. If invalid, throw `ValidationException::withMessages(['current_password' => ['The current password you entered is incorrect.']])` (HTTP 422).
  - Update `$user->password = Hash::make($validated['password'])`, `$user->must_change_password = false`, `$user->email_verified_at = $user->email_verified_at ?? now()`, `$user->verification_code = null`, and `$user->save()`.
  - Return HTTP 200 JSON with `'message' => 'Password updated and account verified successfully.'` and `'user' => new UserResource($user)`.
- Frontend:
  - `resources/js/api/client.js`: Add `changePassword: async (payload) => (await api.post('/auth/change-password', payload)).data`, `forgotPassword: async (login) => (await api.post('/auth/forgot-password', { login })).data`, and `resetPassword: async (payload) => (await api.post('/auth/reset-password', payload)).data` to `authApi`.
  - `resources/js/context/AuthContext.jsx`: Expose `updateUser(updatedUser)` helper (which updates `user` state and `localStorage.setItem('equiply_user', JSON.stringify(updatedUser))`).
  - `resources/js/components/ForcePasswordChangeModal.jsx`: Non-dismissible modal gate rendered in `MainApp.jsx` whenever `isAuthenticated && user?.must_change_password === true`. Displays USTP security notice, inputs for `current_password`, `password`, `password_confirmation`, calls `authApi.changePassword`, updates `AuthContext` via `updateUser(res.user)`, and allows Sign Out if the user wants to switch accounts.

### 5.4 Self-Service Password Reset via 6-Digit Email OTP (Phase 11.4)
- Public Routes in `routes/api.php` under `Route::prefix('auth')`:
  - `POST /api/auth/forgot-password` → `AuthController@forgotPassword`
  - `POST /api/auth/reset-password` → `AuthController@resetPassword`
- `App\Mail\PasswordResetOtpMail`:
  - Public properties: `public User $user`, `public string $otpCode`, `public int $expiresInMinutes = 15`.
  - Subject: `'Equiply Password Reset Code • USTP Facility Operations'`.
  - View: `resources/views/emails/password-reset-otp.blade.php` extending `emails.layout`.
- `AuthController@forgotPassword`:
  - Validates `'login' => 'required|string'` (accepting 10-digit USTP ID or valid email, matching `AuthController@login` validation; returns 422 if user not found with `['login' => ['We could not find a campus account matching that ID or email.']]`).
  - Generates 6-digit `$otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT)`.
  - Stores `$user->password_reset_otp = Hash::make($otp)` and `$user->password_reset_expires_at = now()->addMinutes(15)`, saves `$user`.
  - Sends `Mail::to($user->email)->send(new PasswordResetOtpMail($user, $otp))`.
  - Returns HTTP 200 JSON `['message' => 'A 6-digit password reset code has been sent to your registered campus email.']`.
- `AuthController@resetPassword`:
  - Validates:
    - `'login' => 'required|string'`
    - `'otp' => 'required|string|digits:6'`
    - `'password' => 'required|string|min:8|confirmed'`
  - Finds user by `email` or `id_number`.
  - Checks that `$user`, `$user->password_reset_otp`, and `$user->password_reset_expires_at` exist, that `now()->lessThanOrEqualTo($user->password_reset_expires_at)`, and `Hash::check($validated['otp'], $user->password_reset_otp)`.
  - If missing, expired, or invalid, throws `ValidationException::withMessages(['otp' => ['The password reset code is invalid or has expired.']])` (HTTP 422).
  - Updates `$user->password = Hash::make($validated['password'])`, clears `$user->password_reset_otp = null`, `$user->password_reset_expires_at = null`, clears `$user->must_change_password = false`, sets `$user->email_verified_at = $user->email_verified_at ?? now()`, saves `$user`, and revokes existing tokens (`$user->tokens()->delete()`).
  - Returns HTTP 200 JSON `['message' => 'Your password has been reset successfully. You may now sign in.']`.
- `LoginPage.jsx`:
  - Adds a *"Forgot Password?"* button next to the Password label.
  - Clicking it switches the right panel into a clean 3-step recovery stepper:
    - **Step 1 (`request`):** Input 10-digit USTP ID or campus email → calls `authApi.forgotPassword(login)` → advances to Step 2.
    - **Step 2 (`verify`):** Input 6-digit OTP code, New Password (`min:8`), Confirm New Password → calls `authApi.resetPassword({ login, otp, password, password_confirmation })` → advances to Step 3.
    - **Step 3 (`done`):** Displays confirmation banner and *"Return to Sign In"* button which resets back to the sign-in form with the login pre-filled.
