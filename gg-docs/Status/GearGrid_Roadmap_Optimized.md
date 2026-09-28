# GearGrid — Optimized Development Roadmap

*Minimal core first, extras layered in after. Solo dev, ~5–6 hrs/day.*

---

## Folder Structure

```
geargrid/
├── gg-core/                     # FastAPI backend
│   ├── app/
│   │   ├── models/              # users, listings, bids, bookings, agreements, ratings...
│   │   ├── routes/              # /listings, /requests, /bids, /bookings, /agreements...
│   │   ├── services/            # calendar_logic, matching, scoring, notifications
│   │   ├── integrations/        # cloudinary.py, sms.py
│   │   ├── auth/
│   │   └── main.py
│   ├── migrations/
│   ├── tests/
│   └── requirements.txt
│
├── gg-web/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # Card, Calendar, StatusBadge, RatingForm
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── listing/         # Listing Dashboard, Add/Edit
│   │   │   ├── request/         # Request Dashboard, Post
│   │   │   ├── booking/         # Pickup, Return, Confirmation
│   │   │   └── profile/
│   │   ├── hooks/
│   │   ├── lib/                 # api client, supabase client, cloudinary upload helper
│   │   └── App.jsx
│   └── package.json
│
├── gg-docs/                     # POC, DB schema, roadmap, PPT outline
└── README.md
```

---

## Phase A — Bare Core (end-to-end loop, ugly is fine)
Goal: one full request → bid → booking loop working before anything else.

- Auth (signup/login), Dashboard shell (tabs can be empty placeholders)
- `equipment_listings`: create + list (title, price, one photo — skip categories for now)
- `rental_requests`: create + browse
- `bids`: place bid, owner accepts → creates a `booking` (plain date fields, no conflict logic yet)

**Reuse from MarketFlip**: auth, request/bid schema and endpoints, pincode filtering, role handling adapted to unified profile.

---

## Phase B — Trust Layer (the core differentiator)
Goal: what actually makes this GearGrid, not a copy of MarketFlip.

- Slot calendar + overlap conflict checks on `bookings`
- Pickup flow: condition photo (Cloudinary) + digital agreement e-sign + OTP
- Return flow: same, plus reliability score calculation (basic)

---

## Phase C — Fill In the Gaps
Goal: complete the flows already designed in the POC doc.

- Extension requests (approve/decline, conflict check, extra fee)
- Manual relist decision (now / later / keep unlisted)
- Two-stage ratings (pickup + return, both parties)
- Notification Centre
- Security deposit recording: renter marks paid, owner confirms received; same again at return (no money moves through the app)
- Payment confirmation flow for rental amount and extension charges (payer marks paid, receiver confirms)
- Itemised invoice generated at return: original price, extension charges, deposit, commission, taxes, total
- Non-return flagging + escalation

---

## Phase D — Polish & Extras (add once core flow is solid)
Goal: everything that improves the product but isn't required for it to function.

- Equipment categories with type-specific fields (brand, registration number, fuel type, etc.)
- Voice input via Web Speech API
- Extra profile fields (farm size, crop type, years farming, payment placeholders)
- Wake-backend button (health check on landing page)
- Custom success/error status pages (`is_success` pattern)
- UI polish across all pages

---

## Phase E — Deploy & Test
- Render (backend) + Vercel (frontend) deploy
- Seed/demo data for judge walkthrough
- Manual testing pass: booking conflicts, OTP flow, expiry, extension edge cases

---

## Milestones
| Milestone | Target |
|---|---|
| Submission description + PPT | Oct 16 |
| Phase A complete | Dev start + ~2 days |
| Phase B complete | Dev start + ~5 days |
| Phase C complete | Dev start + ~10 days |
| Phase D + E complete | Before Semi-finale round (dates TBA) |

---

## How to Move Faster (solo dev)

1. **Copy-paste-adapt from MarketFlip first, write new logic second** — Phase A should be mostly renaming/adapting existing code, not fresh builds.
2. **Build vertically, not horizontally** — finish one full flow (list → bid → book) before touching styling or edge cases.
3. **Stub before you build** — for anything not ready yet (e.g. notifications), hardcode a placeholder so dependent screens aren't blocked.
4. **Use Supabase's auto-generated REST/RLS early**, swap to custom FastAPI endpoints only where real logic is needed (matching, calendar).
5. **Commit after every working phase**, not every file — keep momentum.
6. **Timebox each phase** — if a phase overruns, cut scope for the first pass rather than extending the deadline.
7. **Test with dummy data constantly** — click through the flow as you build, don't wait until "done."

---

## Deferred (post-POC / not in any phase above)
- Group pooling, smart ranked matching, demand prediction
- Predictive maintenance, barter/exchange, FPO integration
- Weather-aware scheduling, skill-linked rentals, badges, carbon tracker
- Payment gateway: in-app payments, escrow-held deposits, automatic commission collection, refunds
- Insurance/liability coverage
- Dispute resolution workflow (evidence already captured via `agreements` + `ratings`)
- Multilingual UI beyond Hindi/English
- Real Terms & Conditions (temporary AI-drafted version used for POC/demo)
