# Equiply Changelog

See the primary project changelog at [CHANGELOG.md](file:///c:/Users/Lenovo/Documents/Equiply/CHANGELOG.md) in the project root.

---

## Summary of Completed Work (2026-10-28)

| Milestone | Scope | Key Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **Milestone 1** | Auth, Sanctum & Atlas Scaffolding | `User.php` (`Authenticatable`), `PersonalAccessToken.php`, `AppServiceProvider.php`, `php artisan mongo:ping` | Completed ✅ |
| **Milestone 2** | Core Eloquent Models & Seeding | `Item.php` (`specs`/`tags` casts), `Rental.php` (embedded logs), unique indexes migration, `DatabaseSeeder.php` | Completed ✅ |
| **Milestone 3** | Availability & Atomic Reservation Engine | `ItemController.php`, `ReservationController.php` (multi-doc ACID locks), `AuthController.php`, `EquiplyApiTest.php` | Completed ✅ |
| **Milestone 4** | Frontend Dashboard (React + Vite) | `CatalogView.jsx`, `SpecsModal.jsx`, `ReservationModal.jsx`, `CustodianDashboard.jsx`, `MyRentalsView.jsx`, `client.js` | Completed ✅ |
| **Milestone 5** | USTP Design System & Performance Optimization | `ThemeContext.jsx`, `Sidebar.jsx`, vector visuals, 0ms tab switching, query optimization | Completed ✅ |
| **Milestone 6** | Branding Scrub & Admin Account Management | `AdminController.php`, `AdminUsersView.jsx`, `EnrollStudentModal.jsx`, 10-digit ID standard, watermark scrub | Completed ✅ |
| **Milestone 7** | Split-Screen Auth Portal & Guest Navigation | `LoginPage.jsx` (3-Step Borrowing Stepper), `GuestPromptModal.jsx`, full-view auth navigation | Completed ✅ |
