# KRIDANGAN Esports — PRD

## Problem Statement (verbatim)
Continuation / reconstruction of an existing near-complete KRIDANGAN esports website.
Event: **KRIDANGAN** under **JamRang**, organized by **NxtGen Esports Club** at **Vijaybhoomi University**.
Games: **Free Fire, Chess, E-Football**. Total prize pool **₹40,000**.
Previous account's preview crashed on `src/main.tsx` before credits ran out.

## Architecture (as reconstructed)
- **Frontend**: Vite 8 + React 19 + TypeScript + Tailwind CSS v4 + shadcn v4. Supervisor runs `yarn start` -> `vite --host 0.0.0.0 --port 3000`. API calls are relative (`/api/...`) — ingress routes them to the FastAPI backend.
- **Backend**: FastAPI + Motor (MongoDB). All routes prefixed with `/api`. Admin auth = bcrypt password hash + JWT in an httpOnly cookie. Rate limiters (login/submit/status). Registration/UTR/participant duplicate guards enforced server-side.
- **Storage**: MongoDB `registrations` and `admins` collections. Payment screenshots on disk under `backend/uploads/` served through authenticated admin route with `Cache-Control: private, no-store`.
- **Auth seed**: `lib.security.seed_admin_from_env()` upserts admin from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env` at FastAPI startup.

## User Personas
- **Participant** — Vijaybhoomi student registering for one or more games; needs a quick, clear registration + manual UPI + status lookup.
- **KRIDANGAN admin** — NxtGen Esports Club member verifying payments, exporting the CSV, approving/rejecting registrations.

## Core Requirements (stable)
- Public landing page with hero, games, prize pool, about, registration CTA, contact.
- Registration flow: GAME → DETAILS → PAYMENT → VERIFICATION (screenshot preview, UTR input).
- Manual UPI verification only. Server derives the game fee; frontend cannot forge it.
- Game-specific registration fields and mandatory acceptance of each supplied official Rule Book.
- Admin dashboard with stats, filters, search, detail modal, screenshot viewer, approve/reject/note, CSV export.
- Public `/registration-status` lookup by registration ID (email optional). No PII leakage.
- Security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy), rate limiters on login/submit/status, JWT httpOnly cookies, file magic-byte sniffing, 5 MB limit, jpg/png/webp only.

## What's Implemented (2026-02, iteration 1)
- Full Vite+TS project migrated from zip; supervisor `yarn start` now runs Vite on port 3000.
- Backend: `/api/`, `/api/registration/{config,submit,status}`, `/api/admin/{login,logout,me,stats,registrations,registrations/{id},registrations/{id}/screenshot,registrations/{id}/approve,registrations/{id}/reject,registrations/{id}/note,registrations/export.csv}`.
- Fixed root-cause bug of previous session: `from __future__ import annotations` combined with a callable-class `RateLimiter` broke FastAPI's dependency resolver (422 on every POST). Wrapped limiters in plain functions and dropped the future-annotations import from routers + security.
- Admin seed on startup with credentials from `backend/.env`.
- Organizer-supplied payment QR installed at `/assets/payment-qr.png`; current UPI ID is `9321222950@kotakbank`.
- Original release used placeholder fees; these were replaced with organizer-confirmed game fees on 2026-09-24.
- E2E verified: submit (valid), duplicate UTR 409, invalid mobile 422, admin login/logout, stats, list, detail, approve, re-approve 409, CSV export, public status lookup.

## Payment Configuration Updates (2026-09-24)
- Replaced the original placeholder and subsequent Google Pay QR with the latest organizer-supplied Kotak QR at `frontend/public/assets/payment-qr.png`.
- Current backend-owned UPI ID: `9321222950@kotakbank`.
- Verified the live config API, public QR response, and browser payment step; the latest QR renders at its full 616 × 700 source resolution and the displayed UPI ID matches exactly.

## Game Registration Expansion (2026-09-24, iteration 2)
- Preserved the existing design, registration steps, MongoDB collection, manual UPI flow, admin dashboard, approve/reject actions, registration IDs, and public status lookup.
- Backend-owned fees: Free Fire **₹199**, Chess **₹99**, E-Football **₹99**.
- Free Fire now collects a team leader (name, UID, IGN, phone, email), Players 1–4, and Player 5 marked as Substitute (UID, IGN, phone, email for each).
- Chess now collects player name, Chess.com username/ID, phone, and email. Mode: **Rapid Fire**.
- E-Football now collects player name, E-Football ID/name, phone, and email. Mode: **1v1 Competitive Battle**.
- Every game displays its latest official PDF Rule Book and blocks both frontend progression and backend submission until the mandatory acceptance is checked.
- Rulebook URLs, modes, registration types, fees, UPI details, and game titles are centrally configurable in `backend/lib/event_config.py` and delivered through `/api/registration/config`.
- MongoDB records now include `game_details`, `participant_emails`, `participant_mobiles`, `registration_type`, `mode`, `rulebook_url`, and `rulebook_accepted`, while retaining legacy top-level contact fields for existing admin/list/status compatibility.
- Duplicate participant checks now cover every Free Fire roster email/mobile, not only the team leader.
- Admin details display every submitted game/player field, rulebook acceptance/link, payment fields, and screenshot. CSV export includes all game-specific roster/ID columns.
- Homepage prize pool updated to **₹40,000** with announced game awards: Free Fire **₹20,000**, Chess **₹10,000**, E-Football **₹8,000**; remaining allocation is organizer-announced later.
- No registration data is stored in `localStorage`; state remains in-memory until the existing backend submission.
- QA: frontend production build and backend compilation passed. Testing agent iteration 2 passed **6/6 backend tests** and all desktop/mobile UI flows at **100%**, including three full submissions, rulebook gates, exact fees, UPI/payment review, admin detail visibility, approve/reject, CSV export, legacy records, and responsive layouts. Test-created registrations and screenshots were removed after verification.

## Backlog (prioritized)
- **P1**: Wire up an email provider inside `backend/lib/notifications._deliver` (currently logs only).
- **P1**: Persistent object storage for screenshots (currently local disk).
- **P2**: Rejection reason dropdown (Invalid UTR / Amount mismatch / Screenshot unclear / Not found / Duplicate / Other) — backend accepts free-form reason today.
- **P2**: WhatsApp/Telegram broadcast on VERIFIED.
- **P2**: Rate-limit tuning per campus-network reality.

## Test Credentials
See `/app/memory/test_credentials.md`.
