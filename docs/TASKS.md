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
    - Step 1: *Real-Time Equipment Discovery* (Live status of laboratory attire, calculators, and electronics)
    - Step 2: *Instant Reservation & Collateral Lock* (Secure gear with verified Student ID collateral)
    - Step 3: *Facility Dispatch & Fast Return* (Pick up at operations desk and return after lab/exam)
  - [x] Implement Right Panel: Clean sign-in form supporting Campus ID (`2024300616`) or University Email + Password.
  - [x] Display official facility notice: *"Student accounts are issued in person at the Campus Facility Desk upon presenting a valid USTP School ID."*
- [x] **Phase 7.2: Guest Mode & Navigation Flow Integration**
  - [x] Add prominent **"Continue as Guest (Browse Catalog Only)"** button on the login screen.
  - [x] Replace the popup modal (`AuthModal.jsx`) with full view navigation between `LoginPage` and `MainLayout`.
  - [x] Wire guest prompts: guests can browse the catalog and inspect specs, with a gentle redirect to login when attempting to reserve.
  - [x] Persistent "Sign In" button in the sidebar when in Guest Mode for instant authentication at any point.
