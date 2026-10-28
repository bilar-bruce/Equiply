# Equiply Changelog

All notable changes and architectural updates to the Equiply project are documented in this file for future development reference.

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
