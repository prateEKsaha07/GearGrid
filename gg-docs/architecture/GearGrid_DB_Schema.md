# GearGrid — Database Schema (POC Draft)

*11 tables. Postgres via Supabase. Field types are indicative — refine during actual migration writing.*

---

## 1. `users`
Unified profile — no fixed owner/renter role; role is determined per-listing/per-request. Extra fields below are defined now but not all required at MVP — placeholders for future use.

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | Supabase auth user id |
| name | text | |
| phone | text | unique |
| email | text | nullable, unique |
| pincode | text | primary location, for matching |
| secondary_pincode | text | nullable — e.g. second farm location |
| address_line | text | nullable |
| profile_photo_url | text | nullable — Cloudinary URL |
| language_pref | text | e.g. "hi", "en" |
| id_verified | boolean | Aadhaar/phone verification status |
| farm_size_acres | numeric | nullable, not used at MVP |
| primary_crop_type | text | nullable, not used at MVP |
| years_farming | int | nullable, not used at MVP |
| is_fpo_member | boolean | nullable, not used at MVP |
| preferred_payment_method | text | cash / upi / bank — nullable, not used at MVP |
| upi_id | text | nullable, not used at MVP |
| bank_account_holder_name | text | nullable, not used at MVP |
| bank_account_number_masked | text | nullable, last 4 digits only — never store full account number |
| referral_code | text | nullable, not used at MVP |
| bio | text | nullable, short free-text |
| created_at | timestamptz | |

---

## 2. `equipment_categories`
Reference table — defines the type of machinery and which extra fields apply.

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | e.g. "Tractor", "Sprayer", "Thresher" |
| group | text | "handheld" / "vehicle" / "stationary" — determines which extra fields on `equipment_listings` are relevant |

**Suggested starting categories, grouped by type:**

*Handheld / hand tools* (light, no registration, condition-by-age matters most)
- Hand sprayer, sickle/manual tools, knapsack sprayer, chainsaw, hand tiller attachment

*Vehicles / powered machinery* (registration, brand, model, fuel type matter)
- Tractor, harvester, power tiller, trailer, rotavator

*Stationary / powered equipment* (not driven, but has capacity/power specs)
- Water pump set, thresher, chaff cutter, generator, sprinkler set

---

## 3. `equipment_listings`
Equipment an owner has listed for rent. Extra fields vary by category group — nullable and only shown/filled based on `equipment_categories.group`.

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| owner_id | uuid (FK → users.id) | |
| category_id | uuid (FK → equipment_categories.id) | |
| title | text | |
| description | text | |
| price_per_day | numeric | |
| photos | text[] | Cloudinary URLs |
| pincode | text | denormalized from owner for fast filtering |
| status | text | available / booked / under_maintenance / unlisted |
| is_success | boolean | synthetic status flag (same pattern as MarketFlip) |
| brand | text | nullable — applies to vehicle & stationary groups |
| model_name | text | nullable — applies to vehicle & stationary groups |
| manufacture_year | int | nullable — used to compute age; applies to all groups |
| condition_grade | text | nullable — e.g. "new" / "good" / "worn" — applies to all groups, especially handheld |
| registration_number | text | nullable — vehicle group only (tractor, harvester, trailer, power tiller) |
| fuel_type | text | nullable — vehicle group only, e.g. "diesel" / "electric" / "manual" |
| horsepower | numeric | nullable — vehicle group only |
| power_source | text | nullable — stationary group only, e.g. "electric" / "diesel" / "manual" |
| capacity_spec | text | nullable — stationary group only, e.g. "1000L tank", "5HP pump" |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 4. `rental_requests`
A renter's posted need (when browsing an existing listing isn't enough).

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| renter_id | uuid (FK → users.id) | |
| category | text | equipment type needed |
| task_description | text | |
| needed_from | date | |
| needed_to | date | |
| pincode | text | |
| status | text | open / matched / expired |
| voice_input_used | boolean | flag if submitted via Web Speech API |
| created_at | timestamptz | |

---

## 5. `bids`
A bid/offer against a listing or a request — supports multiple simultaneous bids per listing.

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| listing_id | uuid (FK → equipment_listings.id) | nullable if bid is against a request instead |
| request_id | uuid (FK → rental_requests.id) | nullable if bid is against a listing instead |
| bidder_id | uuid (FK → users.id) | the renter (or owner, if responding to a request) |
| proposed_price | numeric | |
| proposed_start | date | |
| proposed_end | date | |
| status | text | pending / accepted / rejected / auto_rejected_overlap |
| created_at | timestamptz | |

---

## 6. `bookings`
Created once a bid is accepted. Central record tying a listing, owner, and renter to a confirmed slot.

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| listing_id | uuid (FK → equipment_listings.id) | |
| bid_id | uuid (FK → bids.id) | the accepted bid |
| owner_id | uuid (FK → users.id) | |
| renter_id | uuid (FK → users.id) | |
| start_date | date | |
| end_date | date | mutable on approved extension |
| deposit_amount | numeric | |
| status | text | confirmed / active / return_pending / completed / non_returned / cancelled |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## 7. `agreements`
Digital handover records — one row per pickup, one per return, linked to the same booking.

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| booking_id | uuid (FK → bookings.id) | |
| stage | text | "pickup" or "return" |
| condition_photo_url | text | Cloudinary URL |
| owner_signed | boolean | |
| renter_signed | boolean | |
| otp_verified | boolean | |
| otp_verified_at | timestamptz | |
| notes | text | condition notes, damage flags |
| created_at | timestamptz | |

---

## 8. `ratings`
Two-part ratings — one at pickup, one at return, submitted by both parties.

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| booking_id | uuid (FK → bookings.id) | |
| stage | text | "pickup" or "return" |
| rater_id | uuid (FK → users.id) | who is rating |
| ratee_id | uuid (FK → users.id) | who is being rated |
| on_time | boolean | |
| condition_as_described | boolean | pickup stage |
| condition_on_return_ok | boolean | return stage |
| communication_score | int | 1–5 |
| comments | text | nullable |
| created_at | timestamptz | |

---

## 9. `reliability_scores`
Aggregated, auto-updated — not directly user-editable. Split by role.

| Field | Type | Notes |
|---|---|---|
| user_id | uuid (PK, FK → users.id) | |
| owner_score | numeric | derived from ratings received as owner |
| renter_score | numeric | derived from ratings received as renter |
| non_return_flags | int | count of confirmed non-return incidents |
| updated_at | timestamptz | |

---

## 10. `extension_requests`
Renter-initiated requests for additional days on an active booking.

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| booking_id | uuid (FK → bookings.id) | |
| requested_days | int | |
| status | text | pending / approved / declined / auto_blocked_conflict |
| extra_fee | numeric | calculated on approval |
| created_at | timestamptz | |
| resolved_at | timestamptz | |

---

## 11. `notifications`
Feeds the Notification Centre — bids, extension requests, return reminders, rating prompts.

| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users.id) | recipient |
| type | text | new_bid / extension_request / return_reminder / rating_prompt / non_return_flag |
| reference_id | uuid | id of the related booking/bid/etc. |
| message | text | |
| is_read | boolean | |
| created_at | timestamptz | |

---

## Relationships Summary
- `users` 1—N `equipment_listings` (as owner)
- `users` 1—N `rental_requests` (as renter)
- `equipment_categories` 1—N `equipment_listings`
- `equipment_listings` / `rental_requests` 1—N `bids`
- `bids` 1—1 `bookings` (on acceptance)
- `bookings` 1—N `agreements` (pickup + return)
- `bookings` 1—N `ratings` (pickup + return, both parties)
- `bookings` 1—N `extension_requests`
- `users` 1—1 `reliability_scores`
- `users` 1—N `notifications`

## Notes
- Reused directly from MarketFlip: `users`-style role handling (adapted to unified profile), request/bid pattern, pincode filtering, reliability scoring, `is_success` status-flag pattern.
- Photo storage uses Cloudinary (not Supabase Storage) for all image fields — `equipment_listings.photos`, `users.profile_photo_url`, `agreements.condition_photo_url` — chosen for multi-image handling and transformation support.
- New for GearGrid: `equipment_categories` (handheld / vehicle / stationary grouping), `bookings` as a distinct slot/calendar entity, `agreements`, two-stage `ratings`, `extension_requests`.
- Category-specific fields on `equipment_listings` (registration_number, fuel_type, horsepower, power_source, capacity_spec) are nullable and only relevant per category group — UI should show/hide fields based on the selected category rather than every listing filling every field.
- Several `users` fields (farm_size_acres, primary_crop_type, years_farming, is_fpo_member, payment/bank fields, referral_code, bio) are defined now but not required at MVP — created ahead of time so the schema doesn't need migration later when these features are built.
- Dispute handling table intentionally omitted for POC — `agreements` and `ratings` already capture enough evidence to build a disputes table on top later without re-architecting.
