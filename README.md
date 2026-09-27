# GearGrid 🌾

**Grow More, Own Less.**

Peer-to-peer farm equipment rental marketplace — small farmers can rent tractors, tillers, harvesters and sprayers from nearby owners instead of buying them, with slot-based booking, digital handover agreements, and reliability scoring built in.

> Built as a submission for the **Tata Young Social Innovators Challenge (TYSIC)** — Sector: *Agriculture*, Problem Statement: *"How can small farmers share expensive equipment instead of owning it?"*

---

## Problem

Small and marginal farmers often cannot afford tractors, tillers, harvesters or sprayers, forcing them to either forgo mechanization or overpay informal middlemen for rentals. Meanwhile, equipment owned by larger farmers sits idle for most of the season with no reliable way to reach nearby farmers who need it.

## Solution

GearGrid is a reverse-marketplace platform: owners list idle equipment, and farmers who need it browse listings or post a request. Owners choose from incoming bids, and a slot-based calendar lets the same equipment be booked by multiple farmers across different dates without conflict. Digital handover agreements, OTP verification, and condition-photo logging at pickup and return create a real trust layer — not just a listing board.

## Core Features

- Unified profile — role (owner/renter) determined per-listing/per-request, not fixed per account
- Slot-based booking calendar with overlap-aware multi-bid handling
- Digital handover agreements (e-sign) + OTP exchange at pickup and return
- Condition-photo logging (Cloudinary) at pickup and return
- Refundable security deposit + reliability scoring (split by owner/renter role)
- Two-stage ratings (at pickup and at return)
- Extension requests with owner approval and calendar conflict checks
- Manual relist control after return (no forced auto-relisting)
- Voice-based request input (Web Speech API) for low-literacy users
- Non-return flagging and escalation flow

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS |
| Backend | FastAPI (Python) |
| Database / Auth | Supabase (PostgreSQL, Auth) |
| Photo storage | Cloudinary |
| Scheduling / auto-expiry | Supabase Edge Functions + pg_cron |
| Voice input | Web Speech API (browser-native, free) |
| Hosting | Render (backend), Vercel (frontend) |

## Project Structure

```
geargrid/
├── gg-core/     # FastAPI backend
├── gg-web/      # React + Vite frontend
├── gg-docs/     # POC doc, DB schema, roadmap, pitch deck outline
└── README.md
```

## Documentation

Detailed docs live in `gg-docs/`:
- Proof of Concept doc — problem, solution, features, flows, monetization
- Database schema — table definitions and relationships
- Development roadmap — phased build plan
- Pitch deck outline

## Status

🚧 In active development — built solo, in phases (core booking flow → trust layer → extensions/ratings → polish). See the roadmap in `gg-docs/` for current progress.

## Acknowledgment

GearGrid adapts the reverse-marketplace architecture (request/bid lifecycle, pincode-based matching, reliability scoring) originally built for **MarketFlip**, a separate local-goods marketplace project, repurposed here for equipment rental.

---

*Submitted for the Tata Young Social Innovators Challenge 2026.*
