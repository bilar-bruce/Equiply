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
