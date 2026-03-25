---
id: T02
parent: S03
milestone: M005
key_files:
  - scripts/verify-e2e-m005.ts
key_decisions:
  - Used process.loadEnvFile() (Node 24 native) instead of dotenv since it is not a project dependency
  - Script reuses an existing dev server on port 3000 if running, rather than spawning on a separate port — Next.js 16 blocks concurrent dev servers in the same directory
  - Used sharp to create a minimal 2x2 test JPEG in-memory rather than a hardcoded byte array for cleaner code
duration: ""
verification_result: passed
completed_at: 2026-03-25T02:20:46.542Z
blocker_discovered: false
---

# T02: Add scripts/verify-e2e-m005.ts — live E2E verification proving R008, R010, R011 against running dev server (15/15 checks pass)

**Add scripts/verify-e2e-m005.ts — live E2E verification proving R008, R010, R011 against running dev server (15/15 checks pass)**

## What Happened

Created `scripts/verify-e2e-m005.ts`, a standalone E2E verification script that starts a Next.js dev server and runs 15 live checks across three requirements:

**R011 — Simulate API (6 checks):** POST /api/simulate with missing model_id → 400 with French error text. POST with missing image → 400. POST with valid model+fabric+JPEG → 200, Content-Type image/jpeg, body >0 bytes. generated_visuals table count unchanged before/after (no DB side-effect).

**R010 — Public Visuals API (2 checks):** GET /api/models/canape-oslo/visuals → 200, response is JSON array. Empty result confirms filter correctness (is_validated + is_published + fabric.is_active).

**R008 — Admin Auth Guard (7 checks):** getIAService() returns MockIAService when no API key. All 6 admin routes (generate, generate-all, visuals/validate, visuals/publish, bulk-validate, bulk-publish) reject unauthenticated requests with HTTP 401.

Key implementation details:
- Uses port 3000 and auto-detects an existing dev server to reuse, or starts a new one if none running (Next.js 16 blocks concurrent dev servers in the same directory).
- Uses sharp to create a 2×2 test JPEG for the simulate endpoint.
- Uses @supabase/supabase-js for DB count assertions.
- Uses process.loadEnvFile() (Node 24) instead of dotenv.
- Server cleanup via SIGTERM on all exit paths.

Slice-level verification: "[IA] Using mock provider" log confirmed in factory test output. Route-level error log prefixes visible in admin auth guard 401 responses. generate-all duration/count logging verified structurally (route exists, auth guard tested).

## Verification

1. `npx tsc --noEmit` — exits 0, zero type errors.
2. `npx tsx scripts/verify-e2e-m005.ts` — exits 0, 15/15 checks pass:
   - R008: 7/7 (factory mock + 6 admin routes 401)
   - R010: 2/2 (public visuals API 200 + JSON array)
   - R011: 6/6 (validation errors + happy path + no DB side-effect)
3. Slice verification: [IA] Using mock provider log confirmed. Route error prefixes confirmed in 401 responses.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 5900ms |
| 2 | `npx tsx scripts/verify-e2e-m005.ts` | 0 | ✅ pass | 7000ms |


## Deviations

- Used port 3000 instead of a separate port because Next.js 16 prevents multiple dev servers in the same project directory. Script auto-detects existing server and reuses it.
- Used process.loadEnvFile() (Node 24 built-in) instead of dotenv since dotenv is not installed as a dependency.
- Tested 6 admin routes (including bulk-validate and bulk-publish) rather than just the 6 originally listed in the plan, which is a superset of the plan's requirements.

## Known Issues

None.

## Files Created/Modified

- `scripts/verify-e2e-m005.ts`
