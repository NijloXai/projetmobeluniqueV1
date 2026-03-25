---
id: S02
parent: M005
milestone: M005
provides:
  - POST /api/simulate — public endpoint for client-side furniture simulation (ephemeral, watermarked)
requires:
  - slice: S01
    provides: IA service abstraction (getIAService, IAService interface, MockIAService with generate + addWatermark)
affects:
  - S03
key_files:
  - src/app/api/simulate/route.ts
  - src/lib/ai/index.ts
  - src/lib/ai/types.ts
  - src/lib/ai/mock.ts
key_decisions:
  - Route verified as-is — no code changes needed; all R011 criteria were already met by the pre-built implementation from M005 setup
patterns_established:
  - Public API routes skip requireAdmin and return binary responses (image/jpeg) instead of JSON — distinct pattern from admin routes
observability_surfaces:
  - console.error('[POST /api/simulate] Erreur:', message) on server-side failures
  - HTTP 400/404/500 JSON error responses with French messages for client-side debugging
drill_down_paths:
  - .gsd/milestones/M005/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T01:35:45.456Z
blocker_discovered: false
---

# S02: Public Simulate API

**Public POST /api/simulate endpoint verified: accepts FormData, returns watermarked JPEG, no auth required, no DB persistence — all R011 criteria proven structurally.**

## What Happened

This slice verified the public simulate API endpoint that was pre-built during M005 setup. The route at `src/app/api/simulate/route.ts` (124 lines) already existed and consumed the IA service abstraction built in S01.

T01 ran 16 structural checks against R011 acceptance criteria — FormData parsing (image/model_id/fabric_id), binary JPEG response with no-store caching, watermark via `iaService.addWatermark("MÖBEL UNIQUE — Aperçu")`, no requireAdmin guard (public), no generated_visuals reference (ephemeral), 5 distinct 400 validation errors, 2 distinct 404 errors, and tsc clean. All 16/16 passed without any code changes.

T02 re-ran all 9 slice-level verification checks from the S02 plan as a final gate. All 9/9 passed, confirming the slice contract: POST /api/simulate is a verified public endpoint accepting FormData, returning watermarked JPEG, creating no DB rows, with no authentication required.

No code was written or modified in this slice — it was purely verification of the existing implementation against the R011 specification.

## Verification

All 9 slice-level verification checks passed:
1. Route file exists at src/app/api/simulate/route.ts
2. addWatermark present — watermark applied
3. image/jpeg content type — returns JPEG binary
4. no-store cache header — no caching
5. No requireAdmin import — public route (no auth)
6. No generated_visuals reference — ephemeral (no DB)
7. formData parsing — accepts FormData
8. status: 400 count = 5 (≥ 3 required) — proper validation
9. tsc --noEmit exits 0 — type-safe

Additionally, T01 verified 7 more granular criteria (individual FormData field parsing, 404 count, getIAService factory, iaService.generate call, watermark text). All passed.

## Requirements Advanced

- R011 — All structural acceptance criteria for POST /api/simulate verified: FormData input, watermarked JPEG output, public access, ephemeral (no DB row), proper validation errors. Live runtime test deferred to S03.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None. The route was pre-built and met all criteria as-is — no code changes needed.

## Known Limitations

Live runtime verification (actual curl against running dev server) is deferred to S03 integration verification. This slice proved the contract structurally only.

## Follow-ups

S03 will perform the live end-to-end test: curl POST with a real image file to confirm the watermarked JPEG is actually returned at runtime.

## Files Created/Modified

- `src/app/api/simulate/route.ts` — Verified (not modified) — public simulate endpoint accepting FormData, returning watermarked JPEG via IA service
