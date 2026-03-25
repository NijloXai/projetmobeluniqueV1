# S02: Public Simulate API

**Goal:** POST /api/simulate is a verified public endpoint that accepts FormData (image + model_id + fabric_id), returns a watermarked JPEG, creates no DB rows, and requires no authentication.
**Demo:** 

## Must-Haves

- ## Must-Haves
- `src/app/api/simulate/route.ts` exists with POST handler accepting FormData (image, model_id, fabric_id)
- Route returns `Content-Type: image/jpeg` binary response (not JSON)
- Route uses `iaService.addWatermark()` with "MÖBEL UNIQUE — Aperçu" text
- No `requireAdmin` import — route is public
- No `generated_visuals` insert — result is ephemeral
- Route validates: missing image (400), missing model_id (400), missing fabric_id (400), oversized image (400), unknown model (404), unknown fabric (404)
- `tsc --noEmit` passes with zero errors
- ## Verification
- `test -f src/app/api/simulate/route.ts` — route file exists
- `grep -q "addWatermark" src/app/api/simulate/route.ts` — watermark applied
- `grep -q "image/jpeg" src/app/api/simulate/route.ts` — returns JPEG
- `grep -q "no-store" src/app/api/simulate/route.ts` — no caching
- `! grep -q "requireAdmin" src/app/api/simulate/route.ts` — no auth guard (public)
- `! grep -q "generated_visuals" src/app/api/simulate/route.ts` — no DB persistence
- `grep -q "formData" src/app/api/simulate/route.ts` — accepts FormData
- `grep -c "status: 400" src/app/api/simulate/route.ts` returns >= 3 — proper validation errors
- `npx tsc --noEmit` exits 0

## Proof Level

- This slice proves: This slice proves: contract (the public simulate API meets R011 acceptance criteria).
Real runtime required: no (structural verification sufficient — S03 does the live end-to-end test).
Human/UAT required: no.

## Integration Closure

Upstream surfaces consumed: `src/lib/ai/index.ts` (getIAService factory), `src/lib/ai/types.ts` (IAService interface), `src/lib/ai/mock.ts` (MockIAService.generate + addWatermark), `src/lib/ai/prompts.ts` (buildSimulatePrompt — available but not yet called by route).
New wiring: `src/app/api/simulate/route.ts` — public Next.js API route consuming the IA service.
What remains: S03 integration verification performs the live curl test against a running server.

## Verification

- Runtime signals: console.error('[POST /api/simulate] Erreur:', message) on failure.
- Inspection surfaces: curl POST to /api/simulate returns binary JPEG or JSON error with HTTP status code.
- Failure visibility: 400/404/500 JSON errors with descriptive French messages.

## Tasks

- [x] **T01: Verify POST /api/simulate route meets all R011 acceptance criteria** `est:20m`
  The simulate route was pre-built during M005 setup (confirmed by S01 summary). This task structurally verifies the existing route meets every R011 criterion: public access, FormData input, watermarked JPEG output, ephemeral (no DB row), proper validation errors, and tsc clean.
  - Files: `src/app/api/simulate/route.ts`, `src/lib/ai/index.ts`, `src/lib/ai/types.ts`, `src/lib/ai/mock.ts`
  - Verify: test -f src/app/api/simulate/route.ts && grep -q 'addWatermark' src/app/api/simulate/route.ts && grep -q 'image/jpeg' src/app/api/simulate/route.ts && grep -q 'no-store' src/app/api/simulate/route.ts && ! grep -q 'requireAdmin' src/app/api/simulate/route.ts && ! grep -q 'generated_visuals' src/app/api/simulate/route.ts && npx tsc --noEmit

- [x] **T02: Verification**

## Files Likely Touched

- src/app/api/simulate/route.ts
- src/lib/ai/index.ts
- src/lib/ai/types.ts
- src/lib/ai/mock.ts
