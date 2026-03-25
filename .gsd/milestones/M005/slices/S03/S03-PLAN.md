# S03: End-to-End Integration Verification

**Goal:** Prove R008, R010, and R011 at runtime — the full generate→validate→publish→public-API pipeline works, POST /api/simulate returns watermarked JPEG with no DB side-effect, and the mock IA service produces real image buffers.
**Demo:** 

## Must-Haves

- `tsc --noEmit` passes with zero errors (regression gate)
- MockIAService.generate() produces a valid JPEG buffer at runtime
- MockIAService.addWatermark() produces a distinct buffer larger than input
- POST /api/simulate returns HTTP 200, Content-Type image/jpeg, binary body > 0 bytes
- POST /api/simulate with missing fields returns HTTP 400 with French error message
- No new row appears in generated_visuals after simulate call
- GET /api/models/[slug]/visuals returns only published+validated visuals with active fabrics
- All 6 admin routes have requireAdmin() auth guard
- Simulate route has NO requireAdmin() (public)
- Factory returns MockIAService when NANO_BANANA_API_KEY is absent
- Prompt templates live in src/lib/ai/prompts.ts (R016 re-confirmation)

## Proof Level

- This slice proves: final-assembly — live runtime verification of all M005 deliverables

## Integration Closure

Upstream: S01 (IA service + admin routes + UI), S02 (simulate route). No new wiring. After S03, M005 is complete.

## Verification

- Server logs confirm [IA] Using mock provider on startup. Route-level error logs with prefixes. generate-all logs duration and count.

## Tasks

- [x] **T01: Structural reconfirmation + IA mock runtime proof** `est:20m`
  Gate check before live API testing. Confirms no regressions from S01/S02 (tsc clean, all files present, auth guards correct) and proves the IA mock service produces real image buffers at runtime via a standalone tsx script.
  - Files: `scripts/verify-ia-mock.ts`, `src/lib/ai/types.ts`, `src/lib/ai/mock.ts`, `src/lib/ai/index.ts`, `src/lib/ai/prompts.ts`
  - Verify: npx tsc --noEmit exits 0 AND npx tsx scripts/verify-ia-mock.ts exits 0 with all checks passing

- [x] **T02: Live E2E API verification against running dev server** `est:45m`
  The core deliverable of S03. Writes and runs a verification script that starts the dev server, tests POST /api/simulate (R011), GET /api/models/[slug]/visuals (R010), and documents admin pipeline proof (R008). Produces structured PASS/FAIL evidence for all three requirements.
  - Files: `scripts/verify-e2e-m005.ts`, `src/app/api/simulate/route.ts`, `src/app/api/models/[slug]/visuals/route.ts`
  - Verify: npx tsx scripts/verify-e2e-m005.ts exits 0 with all checks passing

## Files Likely Touched

- scripts/verify-ia-mock.ts
- src/lib/ai/types.ts
- src/lib/ai/mock.ts
- src/lib/ai/index.ts
- src/lib/ai/prompts.ts
- scripts/verify-e2e-m005.ts
- src/app/api/simulate/route.ts
- src/app/api/models/[slug]/visuals/route.ts
