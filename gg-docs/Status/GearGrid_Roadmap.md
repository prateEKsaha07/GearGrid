# GearGrid — Development Roadmap

*(POC-stage plan — for solo dev, ~5–6 hrs/day)*

## Phase 0 — Setup
- Fork/adapt MarketFlip repo structure (`gg-core`, `gg-web`, `gg-docs`)
- New Supabase project (auth, DB, storage)
- Env keys ready: Supabase, Whisper (voice input), SMS provider

## Phase 1 — Core Schema & Auth (3–4 hrs)
- Unified user profile (no fixed owner/renter role)
- Tables: `equipment_listings`, `rental_requests`, `bids`, `bookings`
- Auth via Supabase, RLS as secondary safety net

## Phase 2 — Listing & Request Flow (6–8 hrs)
- Owner: Add Listing page (equipment, photos, price, available dates)
- Renter: Post Request page + Browse Nearby (pincode-filtered)
- Multi-bid per listing, overlap-aware acceptance logic

## Phase 3 — Slot Calendar (6–8 hrs)
- Booking calendar core logic (prevents double-booking)
- Conflict checks for overlapping vs non-overlapping bids
- DB-level locking for concurrent booking attempts

## Phase 4 — Pickup/Return Trust Layer (9–11 hrs)
- Digital agreement e-sign (pickup + return)
- OTP exchange at handover
- Condition-photo upload (pickup + return)
- Security deposit hold/release logic

## Phase 5 — Extension & Relist (3–5 hrs)
- Extension request flow (owner approval, conflict check, extra fee)
- Manual relist control (now / later / keep unlisted)

## Phase 6 — Trust & Anti-Fraud (reused + new, 2–3 hrs)
- Reliability scoring (reused from MarketFlip, split owner/renter)
- Non-return flagging + escalation flow
- Auto-expire/auto-release (Edge Function + pg_cron, reused)

## Phase 7 — Accessibility (3–4 hrs)
- Voice-based request input (Whisper API)
- SMS reminders for return deadlines

## Phase 8 — Polish & Deploy (7–9 hrs)
- UI polish across Dashboard, Browse, Active Tools, History
- Testing (booking conflicts, OTP flow, expiry)
- Deploy: Render (backend) + Vercel (frontend)

## Milestones
| Milestone | Target |
|---|---|
| Submission description + optional PPT | Oct 16 |
| Core booking flow working (Phases 1–3) | +1 week after dev start |
| Full trust layer working (Phases 4–6) | +2 weeks |
| Deployed, demoable MVP | Before Semi-finale round (dates TBA) |

## Deferred (post-POC / stretch)
- Group pooling, smart ranked matching, demand prediction
- Predictive maintenance, barter/exchange, FPO integration
- Weather-aware scheduling, skill-linked rentals, badges, carbon tracker
- In-app payments/escrow, insurance/liability coverage
- Multilingual UI beyond Hindi/English
