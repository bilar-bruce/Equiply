# Equiply System & Database Testing Guide

An exhaustive, interactive evaluation guide for validating system capacity, security boundaries, NoSQL injection resistance, and multi-document ACID transactions across all Equiply user roles.

---

## 1. Quick Automated Test Execution (CLI / IDE Terminal)

Execute the full suite of **29 automated tests (262 assertions)** covering every security and transactional boundary:

```bash
# Run all automated feature and unit tests
php artisan test

# Run specifically the adversarial & edge-case test suite
php artisan test --filter=AdversarialStressTest

# Run the role-based functionality audit suite
php artisan test --filter=RoleFunctionalityAuditTest

# Run atomic reservation & concurrency lifecycle tests
php artisan test --filter=ReservationLifecycleTest
```

---

## 2. Test Personas & Credentials Matrix

| Role | Persona Name | Campus ID (10-Digit) | Email | Password | Special Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student (Borrower)** | Alex Rivera | `2024300616` | `alex.rivera@campus.edu` | `password123` | General borrowing, active loans |
| **Student (Peer Lender)** | Jordan Lee | `2024301824` | `jordan.lee@campus.edu` | `password123` | Owns `EQ-P2P-001`, "My Listings" Portal |
| **Staff (Custodian)** | Maria Santos | `2019100041` | `custodian@campus.edu` | `custodian123` | Custodian Desk, Dispatch/Return, In-person enrollment |
| **Staff (Administrator)** | System Admin | `2015100001` | `admin@campus.edu` | `admin123` | Custodian Desk + Account Management |
| **Unauthenticated** | Guest Visitor | *N/A* | *N/A* | *N/A* | Catalog browsing & specs inspection only |

---

## 3. Interactive Scenario Walkthrough (Manual & IDE Testing)

### Scenario A: Authentication & Registration Adversarial Probes
*Instructors often attempt to register unauthorized accounts or input malformed identifiers.*

1. **Test Public Self-Registration Lockout:**
   - **Action:** Open Postman/cURL or browser console and POST to `/api/auth/register`:
     ```bash
     curl -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" -d "{\"id_number\":\"2024999999\",\"name\":\"Test\",\"email\":\"test@campus.edu\",\"password\":\"secret123\"}"
     ```
   - **Expected Outcome:** `HTTP 403 Forbidden` with official notice: *"Public self-registration is disabled. Student accounts are issued in person at the Campus Facility Desk upon presenting a valid USTP School ID."*

2. **Test 10-Digit Campus ID Regex Boundaries:**
   - **Action:** On the Login page, attempt signing in with:
     - `12345` (5 digits - underflow)
     - `20241234567890` (14 digits - overflow)
     - `2024-300-616` (hyphens)
     - `{"$gt": ""}` (NoSQL operator array)
   - **Expected Outcome:** Immediate frontend/backend validation error: `The login field must be 10 digits or a valid email address.`

3. **Test Account Suspension Lockout:**
   - **Action:** As Admin, navigate to **Account Management** and suspend Alex Rivera.
   - **Action:** Attempt logging in as Alex Rivera (`2024300616` / `password123`).
   - **Expected Outcome:** Login rejected with `HTTP 403: Account suspended. Please visit the Campus Facility Desk.`

---

### Scenario B: Input Sanitization, XSS & Extreme Strings
*Instructors love injecting raw scripts and excessively long text to test buffer overflow and UI layout resilience.*

1. **Test Super Long String & Stored XSS in Equipment Specs:**
   - **Action:** Log in as Maria Santos (Custodian) or Jordan Lee (Peer Lender).
   - **Payload Injection:**
     - Item Name: `<script>alert('XSS')</script> Heavy Duty Soldering Iron`
     - Condition Note: `<img src=x onerror=alert(document.cookie)>` + 500 characters of lorem ipsum.
   - **Expected Outcome:**
     - MongoDB Atlas persists the payload safely as literal BSON string primitives.
     - React JSX automatically escapes the string; no script executes in the browser console.
     - The equipment card layout preserves structural integrity using Tailwind text truncation (`truncate`, `line-clamp`).

2. **Test Negative & Non-Numeric Rental Fee Injection:**
   - **Action:** Attempt listing an item with `rental_rate_flat: -25.00` or `rental_rate_flat: "FREE"`.
   - **Expected Outcome:** Rejected with `HTTP 422: The rental rate flat must be at least 0.`

---

### Scenario C: Multi-Document ACID Concurrency (Double-Booking Lockout)
*Instructors check if two students can simultaneously reserve the exact same item.*

1. **Simultaneous Reservation Collision:**
   - **Action:** Open two distinct browser sessions (e.g., Chrome incognito and regular window).
   - Window 1: Log in as **Alex Rivera** (`2024300616`).
   - Window 2: Log in as **Jordan Lee** (`2024301824`).
   - Navigate both windows to the same single Casio Scientific Calculator (`EQ-CMP-001`).
   - Open the reservation modal in both windows.
   - Click **"Confirm Equipment Reservation"** in Window 1, then immediately in Window 2.
   - **Expected Outcome:**
     - Window 1: Receives `HTTP 201 Created` with unique rental code (e.g., `RNT-2026-X89J`).
     - Window 2: Receives `HTTP 409 Conflict: Item [EQ-CMP-001] is currently 'reserved' and cannot be reserved.`
     - Database state: The item's `availability_stat` transitions cleanly to `reserved`; exactly 1 rental record is created in the `rentals` collection.

---

### Scenario D: Peer-to-Peer Ownership & Self-Borrowing Safeguards
*Instructors test if peer lenders can exploit the system to borrow their own equipment.*

1. **Self-Reservation Prevention:**
   - **Action:** Log in as **Jordan Lee** (`2024301824`), owner of `EQ-P2P-001` (Arduino Starter Kit).
   - **Observation:** On the Gear Catalog, the Arduino Starter Kit card does NOT have a "Reserve" button. Instead, it renders a static amber badge: `[Your Equipment Listing]`.
   - **API Bypass Attempt:** Dispatched directly via console or Postman:
     ```bash
     curl -X POST http://localhost:8000/api/reservations -H "Authorization: Bearer <JORDAN_TOKEN>" -H "Content-Type: application/json" -d "{\"item_id\":\"<ARDUINO_ID>\",\"due_time\":\"2026-11-04T12:00:00Z\",\"collateral_held\":\"Academic Clearance Hold: 2024301824\"}"
     ```
   - **Expected Outcome:** Backend rejects with `HTTP 422: Conflict of interest: You cannot borrow or reserve your own equipment listing.`

2. **Active Loan Mutation Lockout:**
   - **Action:** Have Alex Rivera reserve Jordan's Arduino Kit.
   - **Action:** In Jordan's **"My Listings"** portal, observe the Arduino Kit row.
   - **Observation:** The `[Recall Gear]` and `[Edit Rate]` buttons are disabled, locked with a padlock icon and tooltip: *"Loan Active: Cannot edit or recall while item is reserved or on active loan."*

---

### Scenario E: Authorized Collateral & Institutional Clearance Guarantee
*Instructors verify whether unauthorized ID retention has been replaced with legal university mechanisms.*

1. **Test Authorized Collateral Modes in Reservation Modal:**
   - Open reservation modal for any available equipment.
   - Verify the collateral selector presents only:
     1. **`Academic Clearance Hold`** *(Digital Institutional Guarantee linked to 10-digit ID)*.
     2. **`Refundable Cash Deposit`** *(Physical cash bond held in desk custody)*.
   - Verify that **"School ID"** and **"Driver's License"** are completely absent.
   - Confirm that selecting Academic Clearance Hold displays the formal liability undertaking note.

2. **Test Flat Rental Rate in Philippine Peso (₱):**
   - Verify pricing breakdown shows a flat fee (e.g., `₱30.00 flat fee` for calculators, `₱20.00 flat fee` for lab coats) with total due in **₱**.

---

### Scenario F: Administrative Safety & Anti-Lockout Traps
*Instructors test if an administrator can accidentally or maliciously break their own system.*

1. **Self-Suspension Lockout:**
   - **Action:** Log in as **System Administrator** (`admin@campus.edu`).
   - Navigate to **Account Management**.
   - Attempt to click the status toggle on your own account row.
   - **Expected Outcome:** Blocked by frontend and backend with `HTTP 422: Self-suspension lockout: You cannot suspend your own administrative account.`

2. **Self-Demotion Lockout:**
   - **Action:** Attempt to revoke your own admin role via API:
     ```bash
     curl -X PATCH http://localhost:8000/api/admin/users/<ADMIN_ID>/role -H "Authorization: Bearer <ADMIN_TOKEN>" -d "{\"role\":\"student\"}"
     ```
   - **Expected Outcome:** Blocked with `HTTP 422: Self-demotion lockout: You cannot revoke your own administrator privileges.`

---

## 4. Verification Checkpoint Summary

- [x] **29/29 Automated Tests Passing** (`tests/Feature/AdversarialStressTest.php`, `EquiplyApiTest.php`, `ReservationLifecycleTest.php`, `RoleFunctionalityAuditTest.php`, `AdminAccountManagementTest.php`).
- [x] **Zero Emojis**: Clean SVG vector icons across all cards, modals, and tables.
- [x] **Philippine Peso (₱)**: 100% standardized base currency.
- [x] **Flat Rate Model**: Fixed checkout rental fees per item.
- [x] **Digital Clearance Guarantee**: ID pawning discontinued.
- [x] **Multi-Document ACID Transactions**: Concurrency-locked via MongoDB Replica Set session.
