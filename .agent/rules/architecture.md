# Equiply Agent Directives & Architecture Rules

## 1. System Overview
Equiply is a hybrid campus resource borrowing platform supporting facility-owned inventory and verified peer-to-peer (P2P) student rentals. 
- Backend: Laravel 11/12 REST API (`mongodb/laravel-mongodb`)
- Database: MongoDB Atlas (Document model)
- Frontend: React (Vite) + Tailwind CSS

## 2. Strict Modeling Constraints
- DO NOT use traditional SQL migrations with `blueprint->id()`. Use MongoDB collection schema definitions and Mongo-compatible migrations or direct collection seeding.
- ALL Eloquent models MUST extend `MongoDB\Laravel\Eloquent\Model` instead of `Illuminate\Database\Eloquent\Model`.
- The User authenticatable model MUST extend `MongoDB\Laravel\Auth\User as Authenticatable`.
- Preserve the 3 top-level collections: `users`, `items`, and `rentals`.
- Polymorphic specs inside `items` MUST remain an embedded subdocument (`specs`).
- Rental checkout logs (`schedule`, `item_snapshot`, `condition_logs`, `financials`) MUST be embedded within the `rentals` document to ensure historical immutability.

## 3. Concurrency & Reservations
- Checkouts and status modifications MUST execute inside a MongoDB transaction session (`DB::connection('mongodb')->transaction(...)`).
- Always check `availability_stat == 'available'` within the transaction before creating a rental record and updating item state.

## 4. API Standard
- Use standard Laravel API Resource classes (`JsonResource`) for consistent frontend contract responses.
- Implement Laravel Sanctum with MongoDB token handling for authenticated borrower, peer lender, custodian, and admin routes.