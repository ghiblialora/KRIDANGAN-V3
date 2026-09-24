# KRIDANGAN Esports — PRD

## Problem Statement (verbatim)
Continuation / reconstruction of an existing near-complete KRIDANGAN esports website.
Event: **KRIDANGAN** under **JamRang**, organized by **NxtGen Esports Club** at **Vijaybhoomi University**.
Games: **Free Fire, Chess, E-Football**. Prize pool placeholder **₹XX,XXX**.
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
- Manual UPI verification only. Server derives the fee; frontend cannot forge it.
- Admin dashboard with stats, filters, search, detail modal, screenshot viewer, approve/reject/note, CSV export.
- Public `/registration-status` lookup by registration ID (email optional). No PII leakage.
- Security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy), rate limiters on login/submit/status, JWT httpOnly cookies, file magic-byte sniffing, 5 MB limit, jpg/png/webp only.

## What's Implemented (2026-02, iteration 1)
- Full Vite+TS project migrated from zip; supervisor `yarn start` now runs Vite on port 3000.
- Backend: `/api/`, `/api/registration/{config,submit,status}`, `/api/admin/{login,logout,me,stats,registrations,registrations/{id},registrations/{id}/screenshot,registrations/{id}/approve,registrations/{id}/reject,registrations/{id}/note,registrations/export.csv}`.
- Fixed root-cause bug of previous session: `from __future__ import annotations` combined with a callable-class `RateLimiter` broke FastAPI's dependency resolver (422 on every POST). Wrapped limiters in plain functions and dropped the future-annotations import from routers + security.
- Admin seed on startup with credentials from `backend/.env`.
- UPI ID set to `kavyamhatre20viiid@okaxis`; organizer-supplied QR installed at `/assets/payment-qr.png`.
- Fees intentionally `None` → UI displays `₹XXX` and stores `registration_fee: null` until organizer sets them.
- E2E verified: submit (valid), duplicate UTR 409, invalid mobile 422, admin login/logout, stats, list, detail, approve, re-approve 409, CSV export, public status lookup.

## Payment Configuration Update (2026-09-24)
- Replaced the placeholder payment QR with the organizer-supplied QR image at `frontend/public/assets/payment-qr.png`.
- Updated the backend-owned UPI ID to `kavyamhatre20viiid@okaxis`.
- Verified the live config API, public QR response, and browser payment step; the QR renders at its full 857 × 726 source resolution and the displayed UPI ID matches exactly.

## Backlog (prioritized)
- **P0**: Organizer finalises fees in `backend/lib/event_config.py`.
- **P1**: Wire up an email provider inside `backend/lib/notifications._deliver` (currently logs only).
- **P1**: Persistent object storage for screenshots (currently local disk).
- **P2**: Rejection reason dropdown (Invalid UTR / Amount mismatch / Screenshot unclear / Not found / Duplicate / Other) — backend accepts free-form reason today.
- **P2**: WhatsApp/Telegram broadcast on VERIFIED.
- **P2**: Rate-limit tuning per campus-network reality.

## Test Credentials
See `/app/memory/test_credentials.md`.
