# Equiply System & Database Testing Guide

An exhaustive, interactive evaluation guide for validating system capacity, security boundaries, role segregation (RBAC), NoSQL injection resistance, and multi-document ACID transactions across all Equiply user roles.

---

## 1. Quick Automated Test Execution (CLI / IDE Terminal)

Execute the full suite of **32 automated feature tests (280+ assertions)** covering every security, RBAC segregation, and transactional boundary:

```bash
# Run all automated feature and unit tests
php artisan test

# Run specifically the adversarial & edge-case test suite (includes input validation constraints)
php artisan test --filter=AdversarialStressTest

# Run the role-based functionality audit suite (staff reservation lockout, route access)
php artisan test --filter=RoleFunctionalityAuditTest

# Run admin account management & governance suite (student role immutability, staff P2P lockout)
php artisan test --filter=AdminAccountManagementTest

# Run atomic reservation & concurrency lifecycle tests
php artisan test --filter=ReservationLifecycleTest
```

---

## 2. Test Personas & Credentials Matrix

| Role | Persona Name | Campus ID (10-Digit) | Email | Password | Special Permissions & Access Boundaries |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student (Borrower)** | Alex Rivera | `2024300616` | `alex.rivera@campus.edu` | `password123` | Equipment reservations, active loans ("My Borrowings") |
| **Student (Peer Lender)** | Jordan Lee | `2024301824` | `jordan.lee@campus.edu` | `password123` | Owns `EQ-P2P-001`, "My Listings" Portal, general borrowing |
| **Staff (Custodian)** | Maria Santos | `2019100041` | `custodian@campus.edu` | `custodian123` | Custodian Desk, Loan History & Audit, Dispatch/Return, In-person student enrollment only *(Strictly excluded from Account Management & gear borrowing)* |
| **Staff (Administrator)** | System Admin | `2015100001` | `admin@campus.edu` | `admin123` | Account Management & User Governance only *(Strictly excluded from Custodian Desk, Loan History, & gear borrowing)* |
| **Unauthenticated** | Guest Visitor | *N/A* | *N/A* | *N/A* | Catalog browsing & technical specifications inspection only |

---

## 3. Interactive Scenario Walkthrough (Manual & IDE Testing)

### Scenario A: Authentication & Registration Adversarial Probes
*Evaluators test unauthorized registrations, malformed credentials, and credential boundary validation.*

1. **Test Public Self-Registration Lockout:**
   - **Action:** Open Postman/cURL or browser console and POST to `/api/auth/register`:
     ```bash
     curl -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" -d "{\"id_number\":\"2024999999\",\"name\":\"Test\",\"email\":\"test@campus.edu\",\"password\":\"secret123\"}"
     ```
   - **Expected Outcome:** `HTTP 403 Forbidden` with official notice: *"Public self-registration is disabled. Student accounts are issued in person at the Campus Facility Desk upon presenting a valid USTP School ID."*

2. **Test 10-Digit Campus ID Regex Boundaries & Format Validation:**
   - **Action:** On the Login page (`/login`), attempt signing in with:
     - `123` or `12345` (underflow / malformed identifier)
     - `20241234567890` (14 digits - overflow)
     - `2024-300-616` (hyphens)
     - `{"$gt": ""}` (NoSQL operator array)
   - **Expected Outcome:** Immediate frontend pre-flight validation and backend rejection: `HTTP 422 Unprocessable Content: The login field must be 10 digits or a valid email address.`

3. **Test Password Length Minimum Constraint (>= 8 Characters):**
   - **Action:** On the Login page, attempt signing in with a valid 10-digit ID and a short password (e.g., `123` or `admin`).
   - **Expected Outcome:**
     - Client-side: Blocked by HTML5 `minLength={8}` and pre-flight state validation with error: *"Password must be at least 8 characters long."*
     - Server-side: Direct API requests rejected with `HTTP 422: The password field must be at least 8 characters.`

4. **Test Account Suspension Lockout:**
   - **Action:** As Admin, navigate to **Account Management** and toggle suspension for Alex Rivera.
   - **Action:** Attempt logging in as Alex Rivera (`2024300616` / `password123`).
   - **Expected Outcome:** Login rejected with `HTTP 403 Forbidden: Account suspended. Please visit the Campus Facility Desk.`

5. **Test In-Person Staff Privilege Escalation Lockout:**
   - **Action:** Log in as Maria Santos (Custodian) and open the **Enroll Student** modal at Custodian Desk.
   - **Observation:** Role selection is completely omitted; the modal is locked strictly to student provisioning.
   - **API Bypass Attempt:**
     ```bash
     curl -X POST http://localhost:8000/api/admin/users -H "Authorization: Bearer <CUSTODIAN_TOKEN>" -H "Content-Type: application/json" -d "{\"id_number\":\"2026111222\",\"name\":\"Priv Esc\",\"email\":\"esc@campus.edu\",\"role\":\"admin\",\"password\":\"password123\"}"
     ```
   - **Expected Outcome:** `HTTP 403 Forbidden: Custodians may only enroll student accounts.`

---

### Scenario B: Input Sanitization, XSS & Extreme Strings
*Evaluators test buffer resilience, script injection, and numerical validation.*

1. **Test Stored XSS & Layout Integrity in Equipment Specs:**
   - **Action:** Log in as Maria Santos (Custodian) or Jordan Lee (Peer Lender).
   - **Payload Injection:**
     - Item Name: `<script>alert('XSS')</script> Heavy Duty Soldering Iron`
     - Condition Note: `<img src=x onerror=alert(document.cookie)>` + 500 characters of test text.
   - **Expected Outcome:**
     - MongoDB Atlas persists the payload safely as literal BSON string primitives.
     - React JSX automatically escapes the string; no script executes in the browser console.
     - The equipment card layout preserves structural integrity using Tailwind text truncation (`truncate`, `line-clamp`).

2. **Test Negative & Non-Numeric Rental Fee Injection:**
   - **Action:** Attempt listing an item with `rental_rate_flat: -25.00` or `rental_rate_flat: "FREE"`.
   - **Expected Outcome:** Rejected with `HTTP 422: The rental rate flat must be at least 0.`

---

### Scenario C: Multi-Document ACID Concurrency (Double-Booking Lockout)
*Evaluators check if two students can simultaneously reserve the exact same item.*

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
     - Database state: The item's `availability_stat` transitions cleanly to `reserved`; exactly 1 rental record is created in the `rentals` collection within a replica set transaction.

---

### Scenario D: Peer-to-Peer Ownership & Self-Borrowing Safeguards
*Evaluators test if peer lenders can exploit the system to borrow their own equipment.*

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
*Evaluators verify whether physical ID retention has been replaced with institutional digital clearance holds.*

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
*Evaluators test if an administrator can accidentally or maliciously break system governance.*

1. **Self-Suspension Lockout:**
   - **Action:** Log in as **System Administrator** (`admin@campus.edu`).
   - Navigate to **Account Management**.
   - Attempt to click the status toggle on your own account row.
   - **Expected Outcome:** Blocked by frontend and backend with `HTTP 422: Self-suspension lockout: You cannot suspend your own administrative account.`

2. **Self-Demotion Lockout:**
   - **Action:** Attempt to revoke your own admin role via API:
     ```bash
     curl -X PATCH http://localhost:8000/api/admin/users/<ADMIN_ID>/role -H "Authorization: Bearer <ADMIN_TOKEN>" -d "{\"role\":\"custodian\"}"
     ```
   - **Expected Outcome:** Blocked with `HTTP 422: Self-demotion lockout: You cannot revoke your own administrator privileges.`

---

### Scenario G: Strict Role Segregation & Institutional Privilege Hardening
*Evaluators test strict segregation of duties (SoD), workspace mutual exclusivity, and privilege boundary enforcement.*

1. **Staff Equipment Reservation Lockout (Segregation of Duties):**
   - **Concept:** Custodians and Administrators manage operations and institutional oversight; they must never reserve or check out equipment under staff accounts.
   - **Action:** Log in as Maria Santos (Custodian) or System Admin (Admin).
   - **UI Observation:**
     - On the **Gear Catalog**, the "Reserve" button is completely absent on all item cards. The "Specs" button expands to fill 100% of the card action area.
     - Opening the **Technical Specs** modal reveals full item specifications, but the footer "Proceed to Reservation" button is completely hidden.
     - In the **Sidebar**, the "My Borrowings" navigation tab is omitted entirely. Direct URL navigation to `/my-rentals` immediately redirects staff back to `/catalog`.
   - **API Bypass Attempt:**
     ```bash
     curl -X POST http://localhost:8000/api/reservations -H "Authorization: Bearer <STAFF_TOKEN>" -H "Content-Type: application/json" -d "{\"item_id\":\"<ITEM_ID>\",\"due_time\":\"2026-11-04T12:00:00Z\",\"collateral_held\":\"Academic Clearance Hold: 2019100041\"}"
     ```
   - **Expected Outcome:** `HTTP 403 Forbidden: Staff members (custodians and administrators) cannot reserve equipment.`

2. **Workspace Mutual Exclusivity (Custodian vs. Administrator):**
   - **Custodian Workspace Isolation:**
     - Log in as Maria Santos (Custodian).
     - Verify the sidebar displays **Custodian Desk** and **Loan History**, but **Account Management** is completely absent.
     - Calling `GET /api/admin/users` returns `HTTP 403 Forbidden: Unauthorized. Administrator role required.`
   - **Administrator Workspace Isolation:**
     - Log in as System Admin (Admin).
     - Verify the sidebar displays **Account Management**, but **Custodian Desk** and **Loan History** are completely absent.
     - Calling `POST /api/reservations/{id}/checkout` or `POST /api/reservations/{id}/checkin` returns `HTTP 403 Forbidden: Unauthorized. Only facility custodians can perform equipment dispatch and return.`

3. **Student Role Immutability:**
   - **Concept:** Campus student accounts cannot be elevated to privileged staff roles (Custodian/Admin).
   - **UI Observation:** In Account Management (`/admin-users`), student rows render a static `STUDENT` badge with no role dropdown. Staff rows retain a restricted toggle between `CUSTODIAN` $\leftrightarrow$ `ADMIN`.
   - **API Bypass Attempt:**
     ```bash
     curl -X PATCH http://localhost:8000/api/admin/users/<ALEX_RIVERA_ID>/role -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json" -d "{\"role\":\"custodian\"}"
     ```
   - **Expected Outcome:** `HTTP 422 Unprocessable Content: Role locked: Student campus accounts cannot be transitioned to staff roles.`
   - **Staff Demotion Lockout:** Attempting to demote staff to student (`"role": "student"`) returns `HTTP 422 Unprocessable Content: Invalid role assignment.`

4. **Staff Peer-to-Peer (P2P) Lending Lockout:**
   - **Concept:** Institutional staff cannot list personal assets or hold peer lender privileges.
   - **UI Observation:** In Account Management, staff rows display a static `—` indicator in the P2P column with no toggle button. In the enrollment modal, selecting Custodian or Admin hides the P2P option and forces it to `false`.
   - **API Bypass Attempt:**
     ```bash
     curl -X PATCH http://localhost:8000/api/admin/users/<CUSTODIAN_ID>/peer-lender -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json" -d "{\"is_peer_lender\":true}"
     ```
   - **Expected Outcome:** `HTTP 422 Unprocessable Content: Only students can be designated as peer lenders.`

5. **Direct Inventory Creation Lockout (Student Injection Guard):**
   - **Concept:** Only authorized facility custodians and administrators can inject direct inventory records into the catalog.
   - **Action:** Dispatched via student account (Alex Rivera):
     ```bash
     curl -X POST http://localhost:8000/api/items -H "Authorization: Bearer <STUDENT_TOKEN>" -H "Content-Type: application/json" -d "{\"item_name\":\"Malicious Injected Drone\",\"category\":\"Electronics\",\"serial_no\":\"MAL-001\",\"rental_rate_flat\":0}"
     ```
   - **Expected Outcome:** `HTTP 403 Forbidden: Unauthorized. Only custodians and administrators may directly register inventory.`

6. **Dedicated Custodian Loan History & Audit Archive:**
   - **Action:** Log in as Maria Santos (Custodian) and click **Loan History** (`RECORDS` badge) in the sidebar.
   - **Features to Verify:**
     - Search filter operating by rental code, borrower name, or item name.
     - Status filters: `All Concluded`, `Returned`, `Cancelled`.
     - KPI Summary Metrics: Total Concluded, Completed Returns, Cancelled Orders.
     - Condition Tracking: Side-by-side comparison of "Condition Out" vs "Condition In" for damage liability assessment.
     - Accurate timestamp badges: Dispatched At and Returned/Cancelled At.

---

## 4. Verification Checkpoint Summary

- [x] **32/32 Automated Tests Passing** (`tests/Feature/AdversarialStressTest.php`, `EquiplyApiTest.php`, `ReservationLifecycleTest.php`, `RoleFunctionalityAuditTest.php`, `AdminAccountManagementTest.php`).
- [x] **Strict Workspace Segregation**: Custodian Desk strictly isolated to Custodians; Account Management strictly isolated to Admins.
- [x] **Staff Reservation Prohibition**: Custodians and Admins cannot reserve campus gear or access student borrowing tabs (Segregation of Duties).
- [x] **Student Role Immutability**: Student accounts cannot be promoted to staff roles.
- [x] **Staff P2P Exclusivity Lockout**: Staff accounts cannot possess peer lender privileges.
- [x] **Direct Inventory Creation Guard**: Students cannot inject arbitrary items via direct catalog endpoints.
- [x] **Dedicated Loan History Archive**: Custodians have an isolated, searchable audit tab for all concluded equipment rentals.
- [x] **Hardened Authentication Validation**: 10-digit regex / valid email validation + 8-character minimum password constraint enforced client & server side.
- [x] **Zero Emojis**: Clean SVG vector icons across all cards, modals, and tables.
- [x] **Philippine Peso (₱)**: 100% standardized base currency.
- [x] **Flat Rate Model**: Fixed checkout rental fees per item.
- [x] **Digital Clearance Guarantee**: ID pawning discontinued.
- [x] **Multi-Document ACID Transactions**: Concurrency-locked via MongoDB Replica Set session.
