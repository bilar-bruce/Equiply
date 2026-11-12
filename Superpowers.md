# Equiply — Superpowers Development Roadmap & Checklist

This document outlines the next-generation feature roadmap for **Equiply (USTP Campus Equipment Portal)**, specifically structured to be executed using the **Superpowers** agentic workflow plugin (`brainstorming` → `writing-plans` → `subagent-driven-development` → `test-driven-development` → `verification-before-completion`).

---

## 🚀 How to Use This File with the Superpowers Plugin

1. **Open Equiply as Your Active Workspace:**
   Open `C:\Users\Lenovo\Documents\Equiply` as the active workspace in Antigravity so terminal commands (`php artisan test`, `npm run build`) and sub-agents run inside the sandbox automatically.
2. **Create a Testing Branch (or let Superpowers create a Git Worktree):**
   ```powershell
   git checkout -b feat/superpowers-phase-2
   ```
   *(Note: Superpowers also includes the `using-git-worktrees` skill, which can automatically isolate feature branches for you if requested.)*
3. **Enable the Superpowers Plugin:**
   Toggle **Superpowers** ON in the Antigravity **Customizations / Plugins** panel before starting your session.
4. **Prompting Workflow per Milestone:**
   Instead of asking the agent to build everything at once, run **one Milestone at a time** using a prompt like:
   > *"Read `Superpowers.md`. Let's use `brainstorming` and `writing-plans` to design and implement **Milestone 11** using `subagent-driven-development` and `test-driven-development`."*

---

## 📧 Why Resend (`MAIL_MAILER=resend`) is Selected for Equiply

Equiply runs on **Laravel 12**, which already has **Resend** pre-configured as a first-party transport in `config/mail.php` (`'resend' => ['transport' => 'resend']`).
- **Native Laravel Integration:** Requires only `composer require resend/resend-laravel` and `RESEND_KEY=re_...` in `.env`.
- **Failover & Local Testing Friendly:** Can be configured with Laravel's `failover` mailer (`resend` → `log`) so local development works seamlessly without hitting rate limits, and PHPUnit tests can assert every email deterministically using `Mail::fake()`.
- **High Deliverability & Clean HTML Templates:** Works natively with Laravel `Mailable` classes and Blade email templates styled in USTP Navy (`#1B1642`) and Gold (`#F5A623`).

---

## Milestone 11: Transactional Email Engine, Account Verification & Password Security

**Goal:** Connect Equiply's in-person Facility Desk account provisioning (`AdminController@store`) to a real transactional email pipeline, enforce first-login password updates, and provide self-service OTP password recovery.

- [ ] **Phase 11.1: Resend Mailer & Failover Configuration**
    - [ ] Install Resend SDK (`composer require resend/resend-laravel`) and configure `services.php` (`'resend' => ['key' => env('RESEND_KEY')]`).
    - [ ] Update `.env.example` with `MAIL_MAILER=resend`, `RESEND_KEY=`, and `MAIL_FROM_ADDRESS="noreply@equiply.ustp.edu.ph"`, `MAIL_FROM_NAME="Equiply • USTP Facility Operations"`.
    - [ ] Create base USTP-branded HTML email layout (`resources/views/emails/layout.blade.php`) using USTP Deep Navy (`#1B1642`) and Gold (`#F5A623`).
- [ ] **Phase 11.2: Desk Provisioning Welcome Email & Verification (`AdminController@store`)**
    - [ ] Add `must_change_password` (`boolean`, default `true` on desk enrollment) and `email_verified_at` (`datetime|null`) to `App\Models\User` (`$fillable` and `$casts`) and `UserResource.php`.
    - [ ] Create `App\Mail\StudentEnrolledWelcomeMail` containing the student's 10-digit USTP ID (`id_number`), temporary password (`USTP@<id_number>`), and a 6-digit verification code.
    - [ ] Dispatch `StudentEnrolledWelcomeMail` in `AdminController@store` whenever a Custodian or Admin enrolls a new account at the Facility Desk.
- [ ] **Phase 11.3: Forced First-Login Password Change Flow**
    - [ ] Create `POST /api/auth/change-password` in `AuthController.php` validating `current_password`, `password` (`min:8|confirmed`), clearing `must_change_password = false`, and setting `email_verified_at = now()`.
    - [ ] Build `ForcePasswordChangeModal.jsx` (or screen gate in `MainApp.jsx`) that intercepts newly enrolled students with `user.must_change_password === true` immediately after login before they can reserve gear.
- [ ] **Phase 11.4: Self-Service Password Reset via 6-Digit Email OTP**
    - [ ] Create MongoDB-backed password reset token/OTP handling in `AuthController.php`:
        - `POST /api/auth/forgot-password`: Accepts 10-digit USTP ID or campus email, generates a 15-minute 6-digit OTP, stores hashed OTP with expiry, and sends `App\Mail\PasswordResetOtpMail`.
        - `POST /api/auth/reset-password`: Validates 6-digit OTP + new password (`min:8|confirmed`), updates password, and revokes stale tokens.
    - [ ] Update `LoginPage.jsx` with a *"Forgot Password?"* interactive stepper (Request OTP → Enter 6-Digit Code & New Password → Return to Sign In).
- [ ] **Phase 11.5: Automated TDD Verification (`tests/Feature/EmailAuthLifecycleTest.php`)**
    - [ ] Using `Mail::fake()`, assert `StudentEnrolledWelcomeMail` is sent when a Custodian or Admin enrolls a student.
    - [ ] Assert first-login password change clears `must_change_password`.
    - [ ] Assert forgot-password sends `PasswordResetOtpMail`, rejects expired/invalid OTPs (HTTP 422), and resets password on valid OTP.

---

## Milestone 12: Automated Lifecycle Email Receipts & Due/Overdue Notifications

**Goal:** Deliver real-time email receipts and alerts across the borrowing and peer-lending lifecycle so students, peer lenders, and custodians have an immutable email audit trail.

- [ ] **Phase 12.1: Borrower Reservation, Checkout & Check-In Receipts**
    - [ ] `App\Mail\ReservationConfirmedMail`: Dispatched on `ReservationController@store` with `rental_code`, item details, flat fee (`₱`), collateral type, and pickup deadline.
    - [ ] `App\Mail\EquipmentDispatchedMail`: Dispatched on `ReservationController@checkout` confirming physical handover, authorizing custodian, outgoing condition (`condition_out`), and `due_time`.
    - [ ] `App\Mail\EquipmentReturnedReceiptMail`: Dispatched on `ReservationController@checkin` confirming return timestamp, `condition_in`, and collateral release/clearance status.
- [ ] **Phase 12.2: Peer Lender Operational Alerts**
    - [ ] `App\Mail\PeerIntakeVerifiedMail`: Dispatched on `PeerLenderController@verifyIntake` when a Custodian physically verifies and activates a student's `pending_intake` listing into the public catalog.
    - [ ] `App\Mail\PeerItemBorrowedMail` & `App\Mail\PeerItemReturnedMail`: Notify the student owner (`owner_user_id`) when their equipment is checked out and when it is returned with accrued Peso (`₱`) earnings.
- [ ] **Phase 12.3: Due-Soon & Overdue Email Reminders**
    - [ ] Create Artisan command `equiply:send-loan-reminders` in `routes/console.php`:
        - Sends `App\Mail\LoanDueSoonMail` for active loans within 30 minutes of `schedule.due_time` (marking `reminder_sent_at` on `Rental` to prevent duplicate emails).
        - Sends `App\Mail\LoanOverdueAlertMail` when an active loan passes `schedule.due_time`.
- [ ] **Phase 12.4: Automated TDD Verification (`tests/Feature/LifecycleNotificationTest.php`)**
    - [ ] Assert all borrower and peer lender `Mailable` classes are queued/sent at each transition (`store`, `checkout`, `checkin`, `verifyIntake`).
    - [ ] Assert `artisan equiply:send-loan-reminders` dispatches due-soon and overdue emails exactly once per rental.

---

## Milestone 13: Unclaimed Reservation Auto-Expiry & Overdue Penalty Engine

**Goal:** Prevent ghost reservations from locking up campus inventory indefinitely and enforce transparent Philippine Peso (`₱`) late-return surcharges.

- [ ] **Phase 13.1: Unclaimed Reservation Auto-Expiry (30-Minute Pickup Window)**
    - [ ] Add `expires_at` (`requested_at + 30 minutes`) to `Rental.schedule` in `ReservationController@store`.
    - [ ] Implement Artisan command `equiply:expire-unclaimed-reservations` (and lazy expiry check on catalog/reservation reads) that transitions `pending` rentals past `expires_at` to `status = 'expired'` and restores `Item.availability_stat = 'available'`.
    - [ ] Display countdown timer for pickup window (`"Pickup at Desk within XX mins"`) in `MyRentalsView.jsx`.
- [ ] **Phase 13.2: Overdue Penalty Calculation Engine (`₱`)**
    - [ ] Update `ReservationController@checkin` to detect when `now() > Carbon::parse($rental->schedule['due_time'])`.
    - [ ] Compute overdue hours (rounded up) and calculate `overdue_fee` (e.g., `₱15.00/hr` facility standard or configurable flat late surcharge), storing `financials.overdue_fee` and `financials.final_total` on the `Rental` document.
    - [ ] Surface calculated overdue fee and overdue badge in `CustodianDashboard.jsx` (Check-in Modal), `CustodianHistoryView.jsx`, and `MyRentalsView.jsx` using `formatPHP()`.
- [ ] **Phase 13.3: Automated TDD Verification (`tests/Feature/ExpiryAndOverdueTest.php`)**
    - [ ] Assert unclaimed `pending` reservations past `expires_at` automatically release the item back to `available`.
    - [ ] Assert late check-ins accurately compute `financials.overdue_fee` and record overdue status.

---

## Milestone 14: Facility Maintenance Queue & Collateral Resolution Workflow

**Goal:** Close the loop on damaged/maintenance items so Custodians can restore repaired equipment to active circulation and log collateral deductions (`Refundable Cash Deposit` or `Academic Clearance Hold`).

- [ ] **Phase 14.1: Maintenance Resolution Backend**
    - [ ] Create `POST /api/custodian/items/{id}/resolve-maintenance` (restricted strictly to `role === 'custodian'`) allowing Custodians to log repair notes and transition `Item.availability_stat` from `'maintenance'` back to `'available'`.
    - [ ] Enhance `ReservationController@checkin` with `collateral_status` (`'released'`, `'withheld_damage'`, `'clearance_hold_flagged'`) and `damage_fee` (`numeric|min:0`) inside `Rental.financials`.
- [ ] **Phase 14.2: Custodian Maintenance Queue UI (`CustodianDashboard.jsx`)**
    - [ ] Add a **"Maintenance & Repair"** tab/section in `CustodianDashboard.jsx` listing all items with `availability_stat === 'maintenance'`.
    - [ ] Provide a **"Mark Repaired & Restore to Catalog"** action button with repair note input.
    - [ ] Update the Custodian Check-In Modal to let Custodians select collateral disposition (`Release Collateral in Full` vs. `Flag Damage / Deduct from Deposit`) when checking in damaged gear.
- [ ] **Phase 14.3: Automated TDD Verification (`tests/Feature/MaintenanceWorkflowTest.php`)**
    - [ ] Assert Custodians can transition an item from `maintenance` to `available` and invalidate category cache.
    - [ ] Assert Students and Admins receive HTTP 403 on `POST /api/custodian/items/{id}/resolve-maintenance`.

---

## Milestone 15: Peer Lender Earnings Settlement Ledger & Flat-Rate Unification

**Goal:** Fix legacy `rental_rate_hr` references in `PeerLenderController` to align 100% with Milestone 9's flat-rate (`₱`) standard, and track disbursed vs. unclaimed P2P earnings.

- [ ] **Phase 15.1: `rental_rate_flat` Unification in `PeerLenderController.php`**
    - [ ] Update `PeerLenderController@store` and `@update` to accept and persist `rental_rate_flat` (while remaining backward-compatible with `rental_rate_hr`), ensuring `ItemResource` and `MyListingsView.jsx` edits save flat Peso rates cleanly.
- [ ] **Phase 15.2: Peer Lender Payout Settlement Workflow**
    - [ ] Add `payout_status` (`'unclaimed'` | `'settled'`, default `'unclaimed'`) and `payout_settled_at` to `Rental.financials` for student-owned (`owner_type === 'student'`) rentals.
    - [ ] Update `PeerLenderController@index` metrics to break down `total_earnings` into `unclaimed_earnings` (ready to collect at desk) and `settled_earnings` (already paid out).
    - [ ] Create `POST /api/custodian/rentals/{id}/settle-payout` (Custodian-only) to record physical cash disbursement of P2P rental earnings to the student lender at the Facility Desk.
    - [ ] Update `MyListingsView.jsx` and `CustodianDashboard.jsx` to display `Unclaimed Balance (₱)` vs. `Settled Payouts (₱)`.
- [ ] **Phase 15.3: Automated TDD Verification (`tests/Feature/PeerLenderPayoutTest.php`)**
    - [ ] Assert P2P rate updates persist `rental_rate_flat` accurately.
    - [ ] Assert completed P2P loans increment `unclaimed_earnings` and transition to `settled_earnings` upon Custodian payout confirmation.

---

## Milestone 16: Digital QR Pickup Pass & Fast Desk Scanner Lookup

**Goal:** Speed up physical lines at the USTP Facility Operations Desk by giving student borrowers a scannable QR Pickup Pass for their `RNT-2026-XXXXXX` reservation code.

- [ ] **Phase 16.1: Student Digital Pickup Pass (`MyRentalsView.jsx`)**
    - [ ] Render a clean, zero-dependency SVG QR Code (encoding `rental.rental_code`, e.g., `RNT-2026-X89J`) inside a **"Show Desk Pickup Pass"** modal on `pending` and `active` cards in `MyRentalsView.jsx`.
    - [ ] Display student 10-digit USTP ID, item code, collateral mode, and pickup expiry countdown alongside the QR code.
- [ ] **Phase 16.2: Custodian Quick-Code Lookup Bar (`CustodianDashboard.jsx`)**
    - [ ] Add a focused **"Quick Scan / Code Lookup"** input bar at the top of `CustodianDashboard.jsx` that immediately filters and opens the matching `RNT-2026-XXXXXX` checkout or check-in modal when typed or scanned via USB/camera barcode scanner.
- [ ] **Phase 16.3: Build & Regression Verification**
    - [ ] Run `php artisan test` and `npm run build` to verify zero regressions across all 5 campus roles.
