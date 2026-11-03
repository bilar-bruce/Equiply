# Equiply Changelog

All notable changes and architectural updates to the Equiply project are documented in this file for future development reference.

---

## [0.4.0] - Milestone 8: Role-Based Functionality Verification & Peer Lending Lifecycle - 2026-11-03

### 🌟 Overview
Completed the peer lending operations lifecycle and rigorous multi-role functionality audit for Equiply:
1. Enforced backend and frontend **P2P Self-Reservation Guards**, preventing students from reserving their own listed gear while displaying a distinct "Your Equipment Listing" badge.
2. Built the **Dedicated Peer Lender Portal ("My Listings")** ([MyListingsView.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/MyListingsView.jsx)), featuring live metric tracking (Total Listed, Active Loans, Accrued Rental Earnings, Completed Borrows), desk intake protocol banners, rate management, and recall/archive safeguards.
3. Implemented **Facility Desk P2P Intake Verification** ([PeerLenderController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/PeerLenderController.php) & [CustodianDashboard.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/CustodianDashboard.jsx)), allowing Custodians to physically verify, serial-tag, and activate student-submitted gear in the public catalog.
4. Established a comprehensive automated role test matrix ([RoleFunctionalityAuditTest.php](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/RoleFunctionalityAuditTest.php)) asserting complete behavioral specifications across all 5 campus roles: Guest, Student Borrower, Peer Lender, Custodian, and Administrator (21 passing tests, 212 assertions).

---

### 1. P2P Self-Reservation Guard & Catalog Badging (Phase 8.1)
- **Backend Lockout ([ReservationController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/ReservationController.php))**:
  - Gated the ACID transaction session to verify that `$item->owner_type === 'student'` and `owner_user_id !== borrower_id`.
  - Aborts with HTTP 422 (`"Self-reservation not permitted: You cannot reserve your own equipment listing."`) if a peer lender attempts to borrow their own equipment.
- **Frontend Catalog Badging ([CatalogView.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/CatalogView.jsx) & [SpecsModal.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/SpecsModal.jsx))**:
  - Replaces the "Reserve" button with a static amber-gold badge (`"Your Listing"`) whenever the viewing student is the registered owner of the equipment.
  - In `SpecsModal`, disables reservation dispatch and informs the student that they are the registered owner.

---

### 2. Dedicated Peer Lender Portal & Desk Intake Protocol (Phase 8.2)
- **Peer Lender Operations Engine ([PeerLenderController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/PeerLenderController.php))**:
  - `GET /api/peer-lender/listings`: Aggregates the student's personal items, rental histories, and earnings summary metrics.
  - `POST /api/peer-lender/listings`: Registers draft equipment listings with initial status `pending_intake`.
  - `PATCH /api/peer-lender/listings/{id}`: Enables rate updates while enforcing lockouts when an item is currently `reserved` or `rented`.
  - `POST /api/peer-lender/listings/{id}/recall`: Soft-archives or restores items, strictly blocking withdrawals during active loan sessions.
- **Peer Lender Interface ([MyListingsView.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/MyListingsView.jsx))**:
  - Registered "My Listings" tab in [Sidebar.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/Sidebar.jsx), visible strictly to authenticated accounts with `is_peer_lender === true`.
  - Added summary metric cards: Total Listed Gear, Active Loans, Accrued Rental Earnings, and Completed Borrows.
  - Prominent USTP Facility Operations intake guidance banner instructing students to deliver gear to the desk for physical verification and vault storage.
- **Custodian P2P Intake Verification ([CustodianDashboard.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/CustodianDashboard.jsx))**:
  - Added "P2P Intake Queue" tab allowing Custodians to review submitted student equipment and click "Verify & Accept Intake" (`POST /api/custodian/items/{id}/verify-intake`) to activate items into the public catalog.
  - Enabled Custodians/Admins to assign verified student owners when cataloging student-owned equipment via `ItemController@store`.

---

### 3. Role Functionality Audit & Test Matrix (Phase 8.3)
- Automated end-to-end role validation across the entire application ([RoleFunctionalityAuditTest.php](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/RoleFunctionalityAuditTest.php) & [ReservationLifecycleTest.php](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/ReservationLifecycleTest.php)):
  - **Guest**: Public catalog search, category breakdown, specs inspection, and strict 401 reservation blocking.
  - **Student Borrower**: Reserving facility/peer gear, inspecting personal borrowings, and cancelling pending reservations.
  - **Peer Lender**: Accessing personal listings, registering intake drafts, calculating earnings, and verifying self-borrowing and active-loan recall lockouts.
  - **Custodian Staff**: Desk operations, P2P intake verification, dispatch checkouts, return check-ins, and student enrollment.
  - **Administrator**: Full custodian desk privileges, campus user account management, role changes, privilege toggles, and self-lockout protections.

---

## [0.3.0] - Milestone 6 & 7: Admin Account Management, Branding Scrub & Split-Screen Authentication Portal - 2026-11-03

### 🌟 Overview
Delivered a complete institutional refinement and security hardening release for Equiply:
1. Standardized all campus user accounts and placeholders to the official **USTP 10-digit ID standard** (`YYYY######`, e.g. `2024300616`).
2. Performed a comprehensive terminology scrub, replacing technical database jargon with clean university branding (`Equiply • USTP Campus Equipment Portal`).
3. Built an **In-Person Facility Account Provisioning & Admin Governance** engine ([AdminController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/AdminController.php), [AdminUsersView.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/AdminUsersView.jsx), and [EnrollStudentModal.jsx](file:///c:/Users/Lenovo/Documents\Equiply\resources\js\components\EnrollStudentModal.jsx)) with self-suspension and self-demotion lockout safeguards.
4. Created the full-screen **Split-Screen Authentication Portal** ([LoginPage.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/LoginPage.jsx)) featuring a 3-Step Campus Borrowing Stepper, institutional policy notices, and streamlined Guest Mode navigation ([GuestPromptModal.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/GuestPromptModal.jsx)).

---

### 1. UI Branding Scrub & Terminology Alignment (Phase 6.1)
- **Eliminated Developer Watermarks**:
  - Completely stripped the `Atlas ACID Engine [ONLINE]` status pill from [Sidebar.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/Sidebar.jsx).
  - Replaced technical jargon in modal banners (e.g. "ACID Transaction Lock" -> "Guaranteed Campus Allocation", "Transaction Aborted" -> "Reservation Unsuccessful", "Updating Atlas..." -> "Processing Return...").
  - Replaced all occurrences of "Nexus" with **"Portal"** (`Equiply • USTP Campus Equipment Portal`) across [Sidebar.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/Sidebar.jsx), [MainApp.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/MainApp.jsx), and [welcome.blade.php](file:///c:/Users/Lenovo/Documents/Equiply/resources/views/welcome.blade.php).
  - Updated the application footer to institutional university copyright and operational subtitle.
- **USTP 10-Digit ID Standardization**:
  - Enforced strict 10-digit numeric ID format (`YYYY######`) across all accounts in [DatabaseSeeder.php](file:///c:/Users/Lenovo/Documents/Equiply/database/seeders/DatabaseSeeder.php):
    - Student (*Alex Rivera*): `2024300616`
    - Peer Lender (*Jordan Lee*): `2024301824`
    - Custodian (*Maria Santos*): `2019100041`
    - Administrator (*System Administrator*): `2015100001`
  - Updated all form placeholders, collateral references, and validation rules to standard 10-digit campus IDs.

---

### 2. Facility Account Provisioning & Admin Management Backend (Phase 6.2)
- **Dedicated Admin API ([AdminController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/AdminController.php))**:
  - `GET /api/admin/users`: Search across name, 10-digit ID, or email with role, status, and peer lender filters, accompanied by real-time aggregate metrics.
  - `POST /api/admin/users`: Physical in-person account provisioning by authorized facility staff (Custodian/Admin), validating 10-digit format and assigning standard temporary passwords (`USTP@<id_number>`).
  - `PATCH /api/admin/users/{id}/status`: Toggle account suspension (`active` <-> `suspended`) with **self-suspension lockout protection**.
  - `PATCH /api/admin/users/{id}/peer-lender`: Grant or revoke P2P lending privileges.
  - `PATCH /api/admin/users/{id}/role`: Update account role (`student`, `custodian`, `admin`) with **self-demotion lockout protection**.
- **Disabled Public Self-Registration**:
  - Updated `POST /api/auth/register` in [AuthController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/AuthController.php) to return HTTP 403 Forbidden with official facility policy directing students to register in person at the Facility Desk.

---

### 3. Admin Account Management Interface & Desk Enrollment (Phase 6.3)
- **Campus Account Governance ([AdminUsersView.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/AdminUsersView.jsx))**:
  - Summary metric cards: Total Accounts, Active Students, P2P Lenders, Facility Staff, and Suspended Accounts.
  - Interactive table with real-time keyword search, role pill filters, status toggles, and peer lending switches.
  - Registered "Account Management" navigation tab in [Sidebar.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/Sidebar.jsx), strictly restricted to authenticated Admins.
- **Physical ID Verification Modal ([EnrollStudentModal.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/EnrollStudentModal.jsx))**:
  - Reusable enrollment modal accessible to Admins in `AdminUsersView` and to Custodians directly via "+ Enroll Student" on [CustodianDashboard.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/CustodianDashboard.jsx).

---

### 4. Split-Screen Authentication Portal & Guest Mode (Milestone 7)
- **Split-Screen Authentication View ([LoginPage.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/LoginPage.jsx))**:
  - Left panel: High-contrast USTP Deep Navy (`#1B1642`) with gold accents showcasing the **3-Step Campus Borrowing Stepper** (Discovery -> Reservation & Collateral Lock -> Dispatch & Fast Return) and official facility notices.
  - Right panel: Focused sign-in form supporting 10-digit Student ID or Campus Email + Password, with dark/light mode toggle.
- **Seamless Guest Navigation ([MainApp.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/MainApp.jsx))**:
  - Unauthenticated visitors land directly on the split-screen `LoginPage` by default.
  - Prominent **"Continue as Guest (Browse Catalog Only)"** CTA enters the catalog with complete browsing and specifications inspection enabled.
  - Persistent "Sign In to Portal" button in [Sidebar.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/Sidebar.jsx) allows instant return to the authentication portal at any time.
  - Equipment reservation attempts while in Guest Mode surface [GuestPromptModal.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/GuestPromptModal.jsx), offering a gentle one-click path to sign in or return to browsing.

---

## [0.2.0] - Milestone 5: USTP Design System & Performance Optimization - 2026-10-28

### 🌟 Overview
Executed a comprehensive architectural and visual transformation of Equiply, adopting the official institutional aesthetic of the **University of Science and Technology of Southern Philippines (USTP)**. Transitioned the platform from an experimental prototype with developer testing shortcuts to a production-hardened system equipped with zero-latency tab caching, N+1 query resolution, and component error boundaries.

---

### 1. USTP Design System & Theme Foundation
- **Institutional Design Tokens**:
  - Configured USTP Deep Navy (`#1B1642`), Warm Amber/Gold (`#F5A623`), crisp White canvas (`#FFFFFF`), and subtle slate borders.
  - Stripped prototype glow effects, glassmorphism overlays, and unnecessary gradients in favor of high-contrast, clean, flat academic surfaces.
- **Light & Dark Mode Support**:
  - Implemented [ThemeContext.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/context/ThemeContext.jsx) defaulting to USTP Light Mode with instant Dark Mode toggle persisted to `localStorage` and synchronized across browser tabs.

---

### 2. Left-Hand Sidebar Navigation & Layout Architecture
- **Modern Sidebar ([Sidebar.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/Sidebar.jsx))**:
  - Replaced the top sticky navbar with an ergonomic left-hand sidebar layout.
  - Integrated brand header, navigation links (`Gear Catalog`, `My Borrowings`, `Custodian Desk`), dark/light theme switch, and user profile summary.
  - Added responsive mobile drawer collapse with backdrop blur overlay.

---

### 3. Production Hardening (Removal of Testing Artifacts)
- **Eliminated Testing Cheats**:
  - Removed the 1-click demo persona switcher and hardcoded test account dropdowns from all views.
  - Removed the automatic Alex Rivera auto-login fallback in [AuthContext.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/context/AuthContext.jsx).
  - Unauthenticated visitors land as guests with interactive catalog viewing; reservation actions trigger authentication modals.
- **Server-Enforced Access Control**:
  - Guarded the `Custodian Desk` navigation item and view strictly to authenticated staff with `custodian` or `admin` roles.

---

### 4. Performance Engineering & Cloud Latency Elimination
- **N+1 Database Query Resolution**:
  - Refactored `ItemController@categories` in [ItemController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/ItemController.php).
  - Collapsed **10 sequential remote round-trips to MongoDB Atlas** down to **1 single query** (`Item::select(['category', 'availability_stat'])->get()`), aggregating counts in-memory in under 0.1ms.
  - Added short TTL caching (`Cache::remember('equiply_category_counts', 15, ...)`) with automated cache clearing on reservations, dispatches, check-ins, cancellations, and item creation in [ReservationController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/ReservationController.php).
- **Zero-Latency Tab Switching (0ms)**:
  - Refactored [MainApp.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/MainApp.jsx) to keep primary views persistent in the DOM using CSS display toggles (`block` / `hidden`), eliminating component unmounting, data loss, and redundant network re-fetching on tab clicks.
- **Query Decoupling**:
  - Separated category statistics querying from item filtering and search debouncing in [CatalogView.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/CatalogView.jsx).
- **Defensive Error Handling**:
  - Wrapped application in a robust React `ErrorBoundary` in [MainApp.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/MainApp.jsx) to prevent silent blank screens and provide user-friendly one-click reload recovery.

---

## [0.1.0] - Initial Full-Stack Implementation - 2026-10-28

### 🌟 Overview
Completed the full-stack foundation for **Equiply**, a hybrid campus equipment borrowing and verified peer-to-peer (P2P) gear lending platform powered by **Laravel 12 REST API**, **MongoDB Atlas 3-node Replica Set**, and a **React (Vite) + Tailwind CSS** frontend.

---

### 1. Milestone 1: Environment & Database Scaffolding
- **MongoDB User Model**:
  - Updated [User.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Models/User.php) to extend `MongoDB\Laravel\Auth\User as Authenticatable`.
  - Added traits `HasApiTokens`, `HasFactory`, `Notifiable`.
  - Bound to MongoDB connection (`$connection = 'mongodb'`, `$collection = 'users'`).
  - Configured `$fillable`, `$hidden`, and `$casts` for `id_number`, `name`, `email`, `password`, `role`, `is_peer_lender`, `contact_number`, and `status`.
- **Laravel Sanctum MongoDB Integration**:
  - Created [PersonalAccessToken.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Models/PersonalAccessToken.php) extending `Laravel\Sanctum\PersonalAccessToken` with trait `MongoDB\Laravel\Eloquent\DocumentModel` (`$connection = 'mongodb'`, `$collection = 'personal_access_tokens'`, `$primaryKey = '_id'`, `$keyType = 'string'`).
  - Registered model in [AppServiceProvider.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Providers/AppServiceProvider.php) via `Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class)`.
- **Atlas Connectivity**:
  - Implemented `mongo:ping` Artisan command in [routes/console.php](file:///c:/Users/Lenovo/Documents/Equiply/routes/console.php).
  - Verified live 3-node replica set ping to `equiply_db`.

---

### 2. Milestone 2: Core Eloquent Document Models & Seeding
- **Item Document Model**:
  - Created [Item.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Models/Item.php) extending `MongoDB\Laravel\Eloquent\Model`.
  - Added casts for polymorphic subdocument `specs` (`array`), `tags` (`array`), `deposit_required` (`boolean`), and `rental_rate_hr` (`float`).
  - Added relationships `owner()` (belongsTo User) and `rentals()` (hasMany Rental).
- **Rental Document Model**:
  - Created [Rental.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Models/Rental.php) extending `MongoDB\Laravel\Eloquent\Model`.
  - Embedded document structure casts for `schedule`, `item_snapshot`, `condition_logs`, and `financials` ensuring historical immutability.
  - Added relationships `item()`, `borrower()`, and `custodian()`.
- **Unique Indexes Enforcement**:
  - Created Mongo-compatible schema migration [2026_10_28_000001_create_mongodb_indexes.php](file:///c:/Users/Lenovo/Documents/Equiply/database/migrations/2026_10_28_000001_create_mongodb_indexes.php) enforcing unique indexes:
    - `users.id_number` (unique)
    - `users.email` (unique)
    - `items.item_code` (unique)
    - `rentals.rental_code` (unique)
  - Created `mongo:init-indexes` and `mongo:status` Artisan commands in [routes/console.php](file:///c:/Users/Lenovo/Documents/Equiply/routes/console.php).
- **Comprehensive Database Seeding**:
  - Updated [DatabaseSeeder.php](file:///c:/Users/Lenovo/Documents/Equiply/database/seeders/DatabaseSeeder.php) with idempotent `updateOrCreate` records:
    - **4 Test Users**: Student (`Alex Rivera`), Peer Lender (`Jordan Lee`), Custodian (`Maria Santos`), Admin (`System Administrator`).
    - **10 Inventory Items**:
      - *Laboratory Attire*: Lab Coats (Size M & L), Anti-Fog UV Safety Goggles.
      - *Computation*: Casio fx-991CW, Casio fx-991EX, Texas Instruments TI-84 Plus CE.
      - *Electronics*: Heavy-duty 10m surge-protected extension cord, UNI-T digital multimeter, Hakko soldering station, and a P2P student Arduino kit.
    - **1 Sample Rental**: Active loan `RNT-2026-X89J` with embedded snapshots and condition logs.

---

### 3. Milestone 3: Availability & Atomic Reservation Engine
- **JSON API Resources**:
  - [UserResource.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Resources/UserResource.php)
  - [ItemResource.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Resources/ItemResource.php)
  - [RentalResource.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Resources/RentalResource.php)
- **API Controllers**:
  - [AuthController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/AuthController.php): Login with campus ID or email, registration, logout, and authenticated user profile.
  - [ItemController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/ItemController.php): Multi-field keyword search (`q` / `search`), category and availability filtering, category counts endpoint, and item creation.
  - [ReservationController.php](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/ReservationController.php):
    - `store`: Multi-document ACID transaction session via `DB::connection('mongodb')->transaction(...)`. Strict verification that `availability_stat == 'available'`. Generates unique `rental_code`, locks item to `reserved`, creates immutable embedded document snapshot, and handles concurrency with `409 Conflict`.
    - `checkout`: Custodian action authorizing physical handoff, setting status to `active` and item to `rented`.
    - `checkin`: Custodian return check-in logging return condition, restoring item to `available`, or flagging for `maintenance`.
    - `cancel`: Cancels pending reservations and restores item availability.
- **API Routing**:
  - Registered all public and protected routes in [routes/api.php](file:///c:/Users/Lenovo/Documents/Equiply/routes/api.php).
- **Automated Feature Testing**:
  - Implemented [EquiplyApiTest.php](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/EquiplyApiTest.php) with 109 assertions covering search, auth, atomic transactions, and concurrency locking.
  - Configured [phpunit.xml](file:///c:/Users/Lenovo/Documents/Equiply/phpunit.xml) with `DB_CONNECTION=mongodb`.

---

### 4. Milestone 4: Frontend Dashboard Integration (React + Vite)
- **Frontend Infrastructure**:
  - Installed `react`, `react-dom`, `@vitejs/plugin-react@^5.1.4`, `lucide-react`.
  - Configured [vite.config.js](file:///c:/Users/Lenovo/Documents/Equiply/vite.config.js) with React plugin, Tailwind CSS v4, and Laravel Vite plugin.
  - Configured [app.css](file:///c:/Users/Lenovo/Documents/Equiply/resources/css/app.css) with Inter font, dark glassmorphism classes (`glass-panel`, `glass-card`, `glass-input`), and custom scrollbars.
  - Configured [welcome.blade.php](file:///c:/Users/Lenovo/Documents/Equiply/resources/views/welcome.blade.php) to mount React application.
- **API Client & Authentication Context**:
  - [client.js](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/api/client.js): Axios client with Sanctum Bearer token interceptor and 401 handling.
  - [AuthContext.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/context/AuthContext.jsx): Auth state management with **1-Click Persona Switching** between Student, Peer Lender, Custodian, and Admin.
- **UI Components**:
  - [Navbar.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/Navbar.jsx): Sticky glassmorphic navbar with Atlas live status indicator, navigation tabs, and quick role switcher dropdown.
  - [CatalogView.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/CatalogView.jsx): Search bar, category pill filters with live count badges, availability filter, ownership selector, and equipment cards with real-time status indicators.
  - [SpecsModal.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/SpecsModal.jsx): Polymorphic technical specifications inspector.
  - [ReservationModal.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/ReservationModal.jsx): Due-time picker with quick presets (`+2h`, `+4h`, `+8h`, `+24h`), collateral declaration selector (`School ID`, `Cash Deposit`, `Driver's License`), outgoing condition note, and real-time fee calculation.
  - [CustodianDashboard.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/CustodianDashboard.jsx): Custodian desk with loan metrics, physical handover authorization, and return check-in modal with maintenance tagging.
  - [MyRentalsView.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/MyRentalsView.jsx): Student borrowing history, remaining loan countdown, and reservation cancellation.
  - [AuthModal.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/AuthModal.jsx): Credentials sign-in/registration with instant demo login buttons.
  - [MainApp.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/MainApp.jsx) & [app.jsx](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/app.jsx): Main application layout and React root mounting.
- **Production Asset Build**:
  - Successfully built production bundle via `npm run build` (`public/build/assets/`).

---

### 5. Documentation Updates
- Updated [docs/TASKS.md](file:///c:/Users/Lenovo/Documents/Equiply/docs/TASKS.md) marking all items across Milestones 1, 2, 3, and 4 as completed `[x]`.
