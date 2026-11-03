# Equiply Documentation Changelog

This changelog records key milestones, architectural decisions, and testing implementations completed for the Equiply campus equipment rental portal.

---

## [0.4.0] — Milestone 8, Testing Guide & System Hardening (2026-11-03)

### 🌟 Summary of Today's Completed Work
Today's development session finalized the core application lifecycle, security auditing, institutional financial compliance, and comprehensive verification suite across Milestones 6, 7, and 8, followed by the rigorous execution of [`SYSTEM_TESTING_GUIDE.md`](file:///c:/Users/Lenovo/Documents/Equiply/docs/SYSTEM_TESTING_GUIDE.md).

| Area | Scope & Deliverables | Verification Status |
| :--- | :--- | :--- |
| **Milestone 6** | **UI Branding Scrub & Admin Governance**: Standardized USTP 10-digit IDs (`YYYY######`), purged developer watermarks/emojis, added in-person desk enrollment modal ([`EnrollStudentModal.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/EnrollStudentModal.jsx)), and admin user governance ([`AdminController.php`](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/AdminController.php), [`AdminUsersView.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/AdminUsersView.jsx)) with self-lockout guards. | Complete ✅ |
| **Milestone 7** | **Split-Screen Auth Portal & Guest Navigation**: Built full-screen portal ([`LoginPage.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/LoginPage.jsx)) with 3-Step Campus Borrowing Stepper, institutional policy notices, and [`GuestPromptModal.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/GuestPromptModal.jsx) for non-authenticated catalog exploration. | Complete ✅ |
| **Milestone 8** | **Peer Lending Lifecycle & Role Verification**: P2P self-reservation guard in [`ReservationController.php`](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/ReservationController.php) (HTTP 422 block), gold "Your Listing" catalog badge, peer lender dashboard ([`MyListingsView.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/MyListingsView.jsx)), custodian P2P physical intake queue ([`PeerLenderController.php`](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/PeerLenderController.php), [`CustodianDashboard.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/CustodianDashboard.jsx)), and active loan recall/edit lockouts. | Complete ✅ |
| **System Hardening** | **Currency Standard & Compliant Collateral**: Standardized flat rental rate model (`rental_rate_flat`) in Philippine Pesos (`formatPHP` / `₱XX.XX`), purged physical ID pawning in favor of `Academic Clearance Hold` and `Refundable Cash Deposit`, and added digital liability undertaking. | Complete ✅ |
| **Automated Testing** | **Full Verification Suite (`php artisan test`)**: Added [`AdversarialStressTest.php`](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/AdversarialStressTest.php), [`ReservationLifecycleTest.php`](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/ReservationLifecycleTest.php), and [`RoleFunctionalityAuditTest.php`](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/RoleFunctionalityAuditTest.php). All 29 tests passed (262 assertions, 0 errors, 0 failures). | Complete ✅ |

---

### Detailed Changes Made Today (2026-11-03)

#### 1. Peer Lending Operations & Custodian Desk Intake (Milestone 8)
* **Backend Controller ([`app/Http/Controllers/Api/PeerLenderController.php`](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/PeerLenderController.php))**:
  * `index`: Returns peer-owned items with live loan status and active borrower identities.
  * `store`: Registers new peer listings into `pending_intake` state pending physical custodian inspection.
  * `update`: Rate and specification adjustments; enforces strict HTTP 422 lockout if the item is currently on loan (`reserved` or `rented`).
  * `toggleRecall`: Toggles unlisting/archiving; blocks recalls with HTTP 422 if an active loan is underway.
  * `verifyIntake`: Custodian action confirming serial-tagging and physical vault intake, transitioning item status to `available`.
* **API Routes ([`routes/api.php`](file:///c:/Users/Lenovo/Documents/Equiply/routes/api.php))**:
  * Added peer endpoints under `auth:sanctum` middleware with role checks.
* **Self-Reservation Guard ([`app/Http/Controllers/Api/ReservationController.php`](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Controllers/Api/ReservationController.php#L39-L44))**:
  * Intercepts reservation attempts where `$item->owner_user_id === $borrower->id` and terminates with HTTP 422: `"You cannot reserve or borrow your own peer-listed equipment."`
* **Peer Lender Frontend ([`resources/js/components/MyListingsView.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/MyListingsView.jsx))**:
  * Added metric cards: Total Listed, Active Loans, Accrued Rental Earnings (`₱`), and Completed Borrows.
  * Incorporated physical intake protocol alert banner guiding students to the facility desk.
  * Equipment registration modal with flat rates (`₱`), serial number, and condition notes.
  * Active loan guards disabling Edit and Recall actions with lock badges during active student checkouts.
* **Custodian Desk Queue ([`resources/js/components/CustodianDashboard.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/CustodianDashboard.jsx))**:
  * Added "P2P Intake Queue" tab with a 1-click `"Verify & Accept Intake"` action allowing custodians to approve submitted student equipment into the active catalog.
* **Catalog Badge ([`resources/js/components/CatalogView.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/CatalogView.jsx) & [`resources/js/components/SpecsModal.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/SpecsModal.jsx))**:
  * Replaces the "Reserve" button with a non-clickable gold `"Your Listing"` badge for the authenticated owner.

#### 2. Institutional Collateral & Currency Standardization
* **Currency Formatting ([`resources/js/utils/currency.js`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/utils/currency.js))**:
  * Added `formatPHP(amount)` helper standardizing output across all views to `₱XX.XX`.
* **Model & Resource Attributes ([`app/Models/Item.php`](file:///c:/Users/Lenovo/Documents/Equiply/app/Models/Item.php) & [`app/Http/Resources/ItemResource.php`](file:///c:/Users/Lenovo/Documents/Equiply/app/Http/Resources/ItemResource.php))**:
  * Added `rental_rate_flat` (flat session fee) to `$fillable`, default `$attributes` (`30.0`), and float casting.
* **Collateral Selection Modernization ([`resources/js/components/ReservationModal.jsx`](file:///c:/Users/Lenovo/Documents/Equiply/resources/js/components/ReservationModal.jsx))**:
  * Removed physical ID withholding (`"School ID"` and `"Driver's License"` pawning).
  * Implemented compliant university collateral options:
    * `Academic Clearance Hold`: Digital Institutional Guarantee linked to 10-digit USTP ID.
    * `Refundable Cash Deposit`: Physical cash bond in Philippine Pesos deposited into facility vault custody.
  * Added digital liability undertaking checkbox acknowledging USTP campus equipment responsibility.

#### 3. Database Seeding & Testing Assets
* **Standardized Seeding ([`database/seeders/DatabaseSeeder.php`](file:///c:/Users/Lenovo/Documents/Equiply/database/seeders/DatabaseSeeder.php))**:
  * Seeded 10-digit IDs for test accounts (`2024300616`, `2024300789`, `2019100041`, `2015100001`).
  * Seeded flat rates (`₱20.00` to `₱50.00`) and assigned peer equipment to student `2024300789`.
* **Automated Test Matrix**:
  * Added [`tests/Feature/AdversarialStressTest.php`](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/AdversarialStressTest.php) (8 stress tests: race conditions, negative pricing, XSS, BOLA).
  * Added [`tests/Feature/ReservationLifecycleTest.php`](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/ReservationLifecycleTest.php) (2 lifecycle tests: P2P self-reservation lockout vs valid borrow).
  * Added [`tests/Feature/RoleFunctionalityAuditTest.php`](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/RoleFunctionalityAuditTest.php) (5 multi-role audits: Guest, Borrower, Lender, Custodian, Administrator).
  * Updated [`tests/Feature/EquiplyApiTest.php`](file:///c:/Users/Lenovo/Documents/Equiply/tests/Feature/EquiplyApiTest.php) to assert `rental_rate_flat` and new collateral labels.

---

## Historical Milestone Summary

| Milestone | Scope | Key Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **Milestone 1** | Auth, Sanctum & Atlas Scaffolding | `User.php` (`Authenticatable`), `PersonalAccessToken.php`, `AppServiceProvider.php`, `php artisan mongo:ping` | Completed ✅ |
| **Milestone 2** | Core Eloquent Models & Seeding | `Item.php` (`specs`/`tags` casts), `Rental.php` (embedded logs), unique indexes migration, `DatabaseSeeder.php` | Completed ✅ |
| **Milestone 3** | Availability & Atomic Reservation Engine | `ItemController.php`, `ReservationController.php` (multi-doc ACID locks), `AuthController.php`, `EquiplyApiTest.php` | Completed ✅ |
| **Milestone 4** | Frontend Dashboard (React + Vite) | `CatalogView.jsx`, `SpecsModal.jsx`, `ReservationModal.jsx`, `CustodianDashboard.jsx`, `MyRentalsView.jsx`, `client.js` | Completed ✅ |
| **Milestone 5** | USTP Design System & Performance Optimization | `ThemeContext.jsx`, `Sidebar.jsx`, vector visuals, 0ms tab switching, query optimization | Completed ✅ |
| **Milestone 6** | Branding Scrub & Admin Account Management | `AdminController.php`, `AdminUsersView.jsx`, `EnrollStudentModal.jsx`, 10-digit ID standard, watermark scrub | Completed ✅ |
| **Milestone 7** | Split-Screen Auth Portal & Guest Navigation | `LoginPage.jsx` (3-Step Borrowing Stepper), `GuestPromptModal.jsx`, full-view auth navigation | Completed ✅ |
| **Milestone 8** | Peer Lending Lifecycle & Role Audit | `PeerLenderController.php`, `MyListingsView.jsx`, self-reservation guard, P2P intake verification, 5-role audit test suite | Completed ✅ |
