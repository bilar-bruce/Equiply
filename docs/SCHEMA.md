# Equiply Data Schema & Collection Specifications

### 1. `users` Collection
- `_id`: ObjectId (Primary Key)
- `id_number`: String (Unique campus student/employee ID)
- `name`: String
- `email`: String (Unique)
- `password`: String (Hashed)
- `role`: String enum (`student`, `custodian`, `admin`)
- `is_peer_lender`: Boolean (Default: false)
- `contact_number`: String
- `status`: String enum (`active`, `suspended`, `pending_verification`)
- `created_at`: DateTime
- `updated_at`: DateTime

### 2. `items` Collection
- `_id`: ObjectId (Primary Key)
- `item_code`: String (Unique serial/barcode, e.g., "EQ-LAB-0012")
- `name`: String
- `category`: String ("Laboratory Attire", "Computation", "Electronics", "General")
- `owner_type`: String enum (`facility`, `student`)
- `owner_user_id`: ObjectId | Null (Nullable reference to `users._id` if owner_type is student)
- `rental_rate_hr`: Double (0.00 for standard facility items, custom for P2P)
- `deposit_required`: Boolean
- `availability_stat`: String enum (`available`, `reserved`, `rented`, `maintenance`, `lost`)
- `tags`: Array of Strings (e.g., `["chemistry", "safety", "size-m"]`)
- `specs`: Embedded Object (Polymorphic schema)
  - For Clothing/Lab Coats: `{ "size": "M", "gender": "Unisex", "material": "Cotton" }`
  - For Electronics/Calculators: `{ "model": "fx-991CW", "power": "Solar/Battery", "approved_exams": true }`
- `updated_at`: DateTime

### 3. `rentals` Collection
- `_id`: ObjectId (Primary Key)
- `rental_code`: String (Unique, e.g., "RNT-2026-X89J")
- `item_id`: ObjectId (Reference to `items._id`)
- `borrower_id`: ObjectId (Reference to `users._id`)
- `custodian_id`: ObjectId | Null (Reference to `users._id` of the staff member facilitating checkout)
- `status`: String enum (`pending`, `active`, `returned`, `overdue`, `cancelled`, `disputed`)
- `schedule`: Embedded Object
  - `requested_at`: DateTime
  - `due_time`: DateTime
  - `returned_time`: DateTime | Null
- `item_snapshot`: Embedded Object (Preserves immutable historical context)
  - `name`: String
  - `owner_type`: String
  - `owner_id`: ObjectId | Null
- `condition_logs`: Embedded Object
  - `condition_out`: String (e.g., "Good condition, clean, no tears")
  - `condition_in`: String | Null (Logged upon return)
- `financials`: Embedded Object
  - `total_fee`: Double
  - `collateral_held`: String (e.g., "School ID: 2023301824", "Cash Deposit: 200.00")
- `created_at`: DateTime
- `updated_at`: DateTime