# Equiply Implementation Roadmap

## Milestone 1: Environment & Database Scaffolding

- [x] Verify PHP MongoDB driver and install `mongodb/laravel-mongodb`
- [x] Configure `config/database.php` and verify Atlas connection via test artisan command
- [x] Setup User Model extending `MongoDB\Laravel\Auth\User` and configure Sanctum

## Milestone 2: Core Eloquent Document Models

- [x] Implement `App\Models\Item` with `$casts` for `specs` and `tags`
- [x] Implement `App\Models\Rental` with embedded structure castings
- [x] Seed initial database with sample facility gear (Lab coats, calculators, extension cords)

## Milestone 3: Availability & Atomic Reservation Engine

- [x] Create `ItemController` with category/availability filtering and keyword search
- [x] Create `ReservationController@store` utilizing ACID multi-document transaction lock
- [x] Add return/condition check-in endpoints for Custodians

## Milestone 4: Initial Frontend Integration (Prototype)

- [x] Setup Axios client with Sanctum Bearer token interceptors
- [x] Build catalog view with real-time availability badges and specs modal
- [x] Build reservation modal capturing pickup due time and collateral declaration
- [x] Build Custodian Check-in/Check-out dashboard view

---

## Milestone 5: Production UI Refactor (USTP Design System)

- [x] **Phase 5.1: Theme Foundation & Design Tokens**
    - [x] Configure USTP color palette: Primary Navy (`#1B1642`), Warm Gold/Amber (`#F5A623`), Clean White (`#FFFFFF`), Slate canvas (`#F8FAFC`).
    - [x] Implement `ThemeContext.jsx` for default Light Mode with optional Dark Mode toggle (persisted to `localStorage`).
    - [x] Strip glassmorphic glow effects, blur overlays, and unnecessary gradients in favor of crisp, flat surfaces and subtle borders (`border-slate-200`).
- [x] **Phase 5.2: Modern Left-Hand Sidebar Navigation**
    - [x] Build `Sidebar.jsx` component replacing the top navigation bar.
    - [x] Implement clean brand header (`Equiply`), navigation items (`Gear Catalog`, `My Borrowings`, `Custodian Desk`), and mobile drawer toggle.
    - [x] Embed Dark Mode toggle and user account summary / logout at sidebar bottom.
- [x] **Phase 5.3: Minimalist Equipment Cards & Performance Visuals**
    - [x] Redesign equipment cards with clean, lightweight category header banners (minimal geometric accents, zero clutter).
    - [x] Implement high-performance dual visual approach: instantaneous SVG vector icons for default rendering with optional lazy-loaded WebP previews to prevent network waterfall delays.
    - [x] Refactor search bar, category pill filters, and status badges (`Available`, `Reserved`, `In Use`).
- [x] **Phase 5.4: Production Hardening (Remove Testing Artifacts)**
    - [x] Remove 1-click persona switcher from all components.
    - [x] Remove auto-login fallback in `AuthContext.jsx` so unauthenticated visitors see a guest catalog and authentication modal.
    - [x] Restrict `Custodian Desk` navigation strictly to authenticated users with `custodian` or `admin` roles.
- [x] **Phase 5.5: Git Repository & GitHub Readiness**
    - [x] Update `.env.example` to document `DB_CONNECTION=mongodb` and `DB_URI` placeholders without exposing secrets.
    - [x] Initialize local git repository, stage tracked files, and verify `.gitignore` integrity.

---

## Milestone 6: UI Branding Scrub & Admin Account Management (Facility Provisioning)

- [x] **Phase 6.1: Technical Watermark Scrub & Terminology Alignment**
    - [x] Completely remove the `Atlas ACID Engine [ONLINE]` pill from `Sidebar.jsx`.
    - [x] Replace the "Nexus" buzzword with **"Portal"** (`Equiply • USTP Campus Equipment Portal`) across `Sidebar.jsx`, `MainApp.jsx`, and `welcome.blade.php`.
    - [x] Update footer text in `MainApp.jsx` to clean, university-branded copyright and institutional subtitle (removing database/framework mentions).
    - [x] Scrub developer jargon from modals (`ReservationModal.jsx`, `CustodianDashboard.jsx`) to user-friendly campus terminology.
    - [x] Standardize USTP ID format to the 10-digit standard (`2024300616`, `YYYY######`) across seeders, placeholders, and validation.
- [x] **Phase 6.2: Admin Account Management Backend**
    - [x] Create `AdminController.php` with role-checked endpoints strictly restricted to `role === 'admin'`.
    - [x] Implement `GET /api/admin/users` with keyword search (name, student ID `2024######`, email) and filters (role, status, peer lender).
    - [x] Implement `POST /api/admin/users` for in-person Facility Account Provisioning (Custodian/Admin verifies physical ID and creates account).
    - [x] Implement `PATCH /api/admin/users/{id}/status` to toggle between `active` and `suspended`.
    - [x] Implement `PATCH /api/admin/users/{id}/peer-lender` to grant or revoke peer lending privileges (`is_peer_lender`).
    - [x] Implement `PATCH /api/admin/users/{id}/role` with self-demotion lockout protection.
- [x] **Phase 6.3: Admin Account Management Interface**
    - [x] Build `AdminUsersView.jsx` featuring summary metric cards (Total Accounts, Active Students, P2P Lenders, Staff, Suspended).
    - [x] Implement user table with one-click toggles for P2P Lender status and Account Suspension.
    - [x] Add "+ Enroll Campus Account" modal for facility staff to register verified students in person.
    - [x] Register the "Account Management" navigation tab in `Sidebar.jsx` and `MainApp.jsx`, visible strictly to authenticated Admins.

---

## Milestone 7: Dedicated Split-Screen Authentication Portal & Guest Access

- [x] **Phase 7.1: Split-Screen Authentication View (`LoginPage.jsx`)**
    - [x] Build full-screen split-screen layout inspired by the DarkWave design reference with USTP Navy (`#1B1642`) and Gold (`#F5A623`) theme.
    - [x] Implement Left Panel: **Concept 1 — 3-Step Campus Borrowing Stepper**:
        - Step 1: _Real-Time Equipment Discovery_ (Live status of laboratory attire, calculators, and electronics)
        - Step 2: _Instant Reservation & Collateral Lock_ (Secure gear with verified Student ID collateral)
        - Step 3: _Facility Dispatch & Fast Return_ (Pick up at operations desk and return after lab/exam)
    - [x] Implement Right Panel: Clean sign-in form supporting Campus ID (`2024300616`) or University Email + Password.
    - [x] Display official facility notice: _"Student accounts are issued in person at the Campus Facility Desk upon presenting a valid USTP School ID."_
- [x] **Phase 7.2: Guest Mode & Navigation Flow Integration**
    - [x] Add prominent **"Continue as Guest (Browse Catalog Only)"** button on the login screen.
    - [x] Replace the popup modal (`AuthModal.jsx`) with full view navigation between `LoginPage` and `MainLayout`.
    - [x] Wire guest prompts: guests can browse the catalog and inspect specs, with a gentle redirect to login when attempting to reserve.
    - [x] Persistent "Sign In" button in the sidebar when in Guest Mode for instant authentication at any point.

---

## Milestone 8: Role-Based Functionality Verification & Peer Lending Lifecycle

- [x] **Phase 8.1: P2P Self-Reservation Guard & Catalog Badging**
    - [x] Backend: Update `ReservationController@store` to block self-reservations (`owner_user_id === borrower_id`) with HTTP 422.
    - [x] Frontend: Replace "Reserve" button in `CatalogView.jsx` with a static "Your Equipment Listing" badge when `item.owner_user_id === user._id`.
    - [x] Automated Test: Assert HTTP 422 on self-reservation attempt in `tests/Feature/ReservationLifecycleTest.php`.
- [x] **Phase 8.2: Dedicated Peer Lender Portal ("My Listings")**
    - [x] Sidebar Navigation: Register "My Listings" tab in `Sidebar.jsx` (strictly visible when `user.is_peer_lender === true`).
    - [x] Lender Summary Metrics: Implement metric cards (Total Listed Gear, Active Loans, Accrued Rental Earnings).
    - [x] Facility Intake Guidance: Prominent banner detailing physical equipment intake at the Facility Operations Desk.
    - [x] Inventory Management Grid: Display listed items with status badges, rate controls, and borrow history.
    - [x] Recall & Mutation Safeguards: Enforce backend and frontend lockouts preventing edit/delist if item is currently `reserved` or `in_use`.
    - [x] Custodian P2P Tagging: Ensure Custodian Desk / Admin can assign verified student owners when cataloging incoming `owner_type: 'student'` gear.
- [x] **Phase 8.3: Comprehensive Role Functionality Audit & Test Matrix**
    - [x] **Guest Role:** Catalog browsing, category filtering, search, specs modal, and login prompts.
    - [x] **Student Borrower:** Search/reserve facility & peer items, view active loans, cancel pending reservations.
    - [x] **Peer Lender:** View listed items, review active borrowers, check accrued earnings, and verify self-borrowing lockout.
    - [x] **Custodian Staff:** Check-out dispatch, check-in inspections, collateral return receipts, and student enrollment.
    - [x] **Administrator:** Full custodian rights + account management, status toggles, peer privilege granting, and lockout protection.

---

## Milestone 9: Institutional Policy Alignment (Flat Rental Rates, Philippine Peso Currency, ID-Free Collateral & Vector Icons)

- [x] **Phase 9.1: Flat Rate Economic Model & Philippine Peso (₱) Migration**
    - [x] Schema & Models: Refactor item rate fields from hourly (`rental_rate_hr`) to flat borrowing fee (`rental_rate_flat` or flat session standard) across `Item.php` and `Rental.php`.
    - [x] Database Seeders: Re-seed facility gear with realistic flat fees in PHP (Casio Scientific Calculator: ₱30.00, Graphing: ₱50.00, Lab Coat: ₱20.00, Goggles: ₱10.00, Extension Cord: ₱15.00, Multimeter: ₱35.00, Soldering Station: ₱50.00, P2P Arduino: ₱45.00).
    - [x] Reservation Engine: Update `ReservationController@store` to compute flat fee per checkout without dynamic hourly multiplication.
    - [x] Centralized Currency Helper: Create `resources/js/utils/currency.js` providing `formatPHP()` for consistent `₱` formatting.
    - [x] Frontend Updates: Replace all occurrences of `$`, `FREE (Facility)`, and `FREE LOAN` across `CatalogView.jsx`, `SpecsModal.jsx`, `ReservationModal.jsx`, `CustodianDashboard.jsx`, `MyListingsView.jsx`, and `MyRentalsView.jsx`.
- [x] **Phase 9.2: Authorized Collateral Policy (Cash Deposit & Academic Clearance Hold)**
    - [x] Deprecate unauthorized collateral: Completely remove `"School ID"` and `"Driver's License"` from all interfaces and controllers.
    - [x] Implement Dual Authorized Collateral Modes:
        - `Academic Clearance Hold (Digital Guarantee)`: Verified student liability undertaking tied to 10-digit ID record.
        - `Refundable Cash Deposit`: Refundable physical cash bond held in facility custody.
    - [x] Update `ReservationModal.jsx`: Redesign collateral selection with clear descriptive badges, input validations, and digital undertaking disclosure.
    - [x] Update `CustodianDashboard.jsx`: Display and process verified collateral types during checkout and check-in return receipts.
- [x] **Phase 9.3: Vector Graphic Standards (Complete Emoji Purge)**
    - [x] Eliminate all Unicode emojis (`🏫`, `🎒`, `🏛️`, `⚠️`, `✅`, `🟢`, `🟡`, `🔵`, `🔴`) across components.
    - [x] Replace with semantic Lucide React vector icons (`Building2`, `Users`, `ShieldAlert`, `ShieldCheck`, `Banknote`, `FileCheck`) in:
        - `CatalogView.jsx` (ownership badges, dropdown filters).
        - `SpecsModal.jsx` (ownership, rental rates, collateral requirement banner).
        - `ReservationModal.jsx` (collateral selection, fee breakdown).
        - `CustodianDashboard.jsx` (inventory tags, checkout logs).
        - `MyListingsView.jsx` (status badges, lender cards).
- [x] **Phase 9.4: Database Reseed & Test Suite Verification**
    - [x] Update existing database records or reseed with `php artisan db:seed`.
    - [x] Update test assertions in `tests/Feature/ReservationLifecycleTest.php` and `tests/Feature/EquiplyApiTest.php` to reflect flat rates, PHP currency, and new collateral constraints.
    - [x] Run full test suite to guarantee zero regressions.

---

## Milestone 10: Strict Role Segregation & Institutional Privilege Hardening

- [x] **Phase 10.1: Operational Workspace Decoupling (Custodian Desk vs. Account Management)**
    - [x] Decouple `isCustodian` from `isAdmin` in `AuthContext.jsx` (`isCustodian: user?.role === 'custodian'`).
    - [x] Restrict `Custodian Desk` navigation tab strictly to `role === 'custodian'` in `Sidebar.jsx`. Admins will not see or access Custodian Desk.
    - [x] Restrict `Account Management` navigation tab strictly to `role === 'admin'` in `Sidebar.jsx`. Custodians will not see or access Account Management.
    - [x] Enforce tab guard `useEffect` in `MainApp.jsx` to prevent cross-role URL/tab manipulation (Admins trying to view `custodian` redirect to `catalog`, Custodians trying to view `admin-users` redirect to `catalog`).
- [x] **Phase 10.2: Desk vs. Administrative Provisioning Hardening**
    - [x] Custodian Desk Context (`CustodianDashboard.jsx`): Pass `mode="student_only"` prop into `EnrollStudentModal`.
    - [x] Remove role selection buttons completely in student-only mode so Custodians can only enroll `student` accounts.
    - [x] Retain the "Grant Verified Peer Lender Privileges" checkbox for student P2P registration at desk intake.
    - [x] Account Management Context (`AdminUsersView.jsx`): Dynamic role selection (`Student`, `Custodian`, `Admin`) for Admins.
    - [x] Dynamic P2P visibility: If `Student` is selected, display the P2P lender checkbox. If `Custodian` or `Admin` is selected, hide the checkbox and force `is_peer_lender` to `false`.
    - [x] Backend Safeguard (`AdminController@store`): Enforce target role `student` if caller is a Custodian. Enforce `is_peer_lender = false` if target role is `custodian` or `admin`.
- [x] **Phase 10.3: Account Management Table Governance**
    - [x] Role Column UI (`AdminUsersView.jsx`): For `account.role === 'student'`, replace the `<select>` dropdown with a fixed, static badge (`STUDENT`). Students cannot be escalated to staff.
    - [x] Role Column UI (`AdminUsersView.jsx`): For staff (`custodian` and `admin`), provide a restricted dropdown allowing transitions only between staff roles (`CUSTODIAN` ↔ `ADMIN`), with self-demotion lockout for the active administrator.
    - [x] Backend Role Safeguard (`AdminController@updateRole`): Reject role changes for `student` accounts (HTTP 422), and reject conversions of staff into students (HTTP 422).
    - [x] P2P Lending Column UI (`AdminUsersView.jsx`): Render the interactive toggle button (`Granted` / `Disabled`) only for `student` accounts. For `custodian` and `admin` accounts, render a static dash (`—`) or disabled label with no toggle action.
    - [x] Backend P2P Safeguard (`AdminController@updatePeerLender`): Ensure `user->role === 'student'`. Reject attempts to grant P2P privileges to staff with HTTP 422.
- [x] **Phase 10.4: Borrower-Exclusive Reservation Engine & Catalog UI Hardening**
    - [x] Catalog UI Card Action (`CatalogView.jsx`): When logged in as `custodian` or `admin`, completely remove the "Reserve" / "Locked" button from gear cards. Expand the "Specs" button to full width.
    - [x] Specs Modal Footer (`SpecsModal.jsx`): When viewed by Custodians or Admins, remove the "Proceed to Reservation" footer button (retaining the "Close" button). Staff retain full visibility of all item attributes and technical specifications.
    - [x] Backend Reservation Enforcement (`ReservationController@store`): Enforce `$borrower->role === 'student'`. Reject Custodian and Admin reservation attempts with HTTP 403.
    - [x] Backend Desk Dispatch Restriction (`ReservationController@checkout` & `@checkin`): Enforce `role === 'custodian'` for physical checkout dispatch and return check-in.
    - [x] Backend Direct Inventory Creation (`ItemController@store`): Restrict `POST /api/items` strictly to `custodian` and `admin` roles, preventing students from directly injecting inventory or bypassing P2P desk intake.
- [x] **Phase 10.5: Automated Test Suite & Regression Verification**
    - [x] Assert Custodians receive HTTP 403 on `GET /api/admin/users`.
    - [x] Assert Admins cannot reserve items via `POST /api/reservations` (HTTP 403).
    - [x] Assert Custodians cannot reserve items via `POST /api/reservations` (HTTP 403).
    - [x] Assert attempting to grant P2P privileges to a Custodian or Admin returns HTTP 422.
    - [x] Assert attempting to modify a Student's role returns HTTP 422.
    - [x] Assert students cannot invoke `POST /api/items` directly (HTTP 403).
- [x] **Phase 10.6: Dedicated Custodian Loan History Tab & Sidebar Cleanup**
  - [x] **Phase 10.6.1: Sidebar "My Borrowings" Restriction**:
    - [x] Update `Sidebar.jsx` so "My Borrowings" (`my-rentals`) is strictly rendered for unauthenticated guests and verified students (`!isAuthenticated || user?.role === 'student'`).
    - [x] Hide "My Borrowings" completely from `custodian` and `admin` sessions.
    - [x] Add route guard in `MainApp.jsx` redirecting any staff session attempting to access `activeTab === 'my-rentals'` back to `catalog`.
  - [x] **Phase 10.6.2: Dedicated Custodian Loan History Tab (`CustodianHistoryView.jsx`)**:
    - [x] Register new navigation item in `Sidebar.jsx` strictly for Custodians (`user?.role === 'custodian'`): `Loan History` (`custodian-history`, icon: `History`, badge: `RECORDS`, desc: `Archived loans & audit logs`).
    - [x] Build `CustodianHistoryView.jsx` providing a full searchable and filterable archive of all historical campus loans (`returned`, `cancelled`, and historical logs).
    - [x] Include detailed inspection cards with complete timeframe logs (`requested_at` -> `returned_time`), condition comparison (`condition_out` vs. `condition_in`), collateral receipts, and borrower details.
    - [x] Add route guard in `MainApp.jsx` restricting `custodian-history` strictly to `user?.role === 'custodian'`.
- [x] **Phase 10.7: Authentication Input Validation & Standard Security Constraints**
  - [x] **Backend Login Validation (`AuthController@login`)**:
    - [x] Enforce custom validation rule: `login` must strictly be either a 10-digit USTP ID (`/^\d{10}$/`) or a valid email address (`FILTER_VALIDATE_EMAIL`).
    - [x] Enforce `password` minimum length of 8 characters (`min:8`).
    - [x] Update provisioning validation in `AdminController@store` to require `min:8` for custom passwords.
  - [x] **Client-Side Form Guarding (`LoginPage.jsx`)**:
    - [x] Add pre-flight validation in `handleSubmit` preventing dispatch if login format is invalid or password is under 8 characters.
    - [x] Provide clear, actionable validation error banners guiding the user to standard formats.
    - [x] Add `minLength={8}` to the password input field.
  - [x] **Automated Test Coverage (`AdversarialStressTest.php`)**:
    - [x] Assert that logins with malformed non-10-digit IDs or invalid email strings return HTTP 422.
    - [x] Assert that passwords under 8 characters return HTTP 422 with a descriptive error message.
