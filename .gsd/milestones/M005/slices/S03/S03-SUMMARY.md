---
id: S03
parent: M005
milestone: M005
provides:
  - Full M005 verification evidence — 8/8 mock checks + 15/15 E2E checks proving R008, R010, R011, R016
  - Reusable verification scripts (scripts/verify-ia-mock.ts, scripts/verify-e2e-m005.ts) as regression gates for future milestones
requires:
  - slice: S01
    provides: IA service abstraction (types, mock, prompts, factory), 6 admin API routes, IAGenerationSection UI
  - slice: S02
    provides: POST /api/simulate route with watermark via sharp
affects:
  []
key_files:
  - scripts/verify-ia-mock.ts
  - scripts/verify-e2e-m005.ts
key_decisions:
  - Used @/ path aliases in verification scripts (resolved via tsx with tsconfig paths) to exercise the same import paths as production code
  - Used process.loadEnvFile() (Node 24 native) instead of dotenv since it is not a project dependency
  - E2E script reuses existing dev server on port 3000 — Next.js 16 blocks concurrent dev servers in the same directory
  - Used sharp to create minimal 2x2 test JPEG in-memory for simulate endpoint testing
patterns_established:
  - Standalone tsx verification scripts as regression gates — scripts/verify-ia-mock.ts for unit-level IA service checks, scripts/verify-e2e-m005.ts for live E2E API verification. Both are rerunnable and produce structured PASS/FAIL output.
  - Runtime factory verification pattern: import getIAService, check instanceof MockIAService, confirm log output — proves env-var-based service switching without mocking
observability_surfaces:
  - [IA] Using mock provider log confirmed on factory initialization
  - Route-level error log prefixes visible in 401 auth guard responses
drill_down_paths:
  - .gsd/milestones/M005/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S03/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T02:24:42.551Z
blocker_discovered: false
---

# S03: End-to-End Integration Verification

**Proved all M005 deliverables at runtime — 8/8 IA mock checks + 15/15 live E2E checks across R008, R010, R011, R016 — validating the full generate→validate→publish→public-API pipeline, watermarked simulate endpoint, auth guards, and mock/real factory switch.**

## What Happened

S03 is a pure verification slice with no production code changes — it proves the assembled work from S01 and S02 delivers the M005 contract.

**T01 — Structural reconfirmation + IA mock runtime proof:** Created `scripts/verify-ia-mock.ts` exercising the IA service layer directly. Eight checks confirm: MockIAService.generate() produces valid JPEG buffers (FF D8 magic bytes, 10,400 bytes), addWatermark() produces a distinct larger buffer (13,076 bytes), getIAService() returns MockIAService when NANO_BANANA_API_KEY is absent (with "[IA] Using mock provider" log), and both prompt template builders return non-empty strings (244 and 258 chars). All structural pre-checks also pass: 5 IA service files exist, all 6 admin routes have requireAdmin() guards, simulate route has no auth guard, IAGenerationSection is imported in ModelForm.tsx, and tsc --noEmit exits 0.

**T02 — Live E2E API verification:** Created `scripts/verify-e2e-m005.ts` testing against a running Next.js dev server. Fifteen checks across three requirements: R011 (6 checks — simulate validation errors return 400 with French text, happy path returns 200 image/jpeg with body >0 bytes, no DB side-effect confirmed via generated_visuals count), R010 (2 checks — public visuals API returns 200 JSON array, empty result confirms filter correctness for is_validated+is_published+fabric.is_active), R008 (7 checks — factory returns MockIAService, all 6 admin routes reject unauthenticated requests with 401). All 15/15 pass.

Both scripts are reusable regression gates for future milestones.

## Verification

**tsc --noEmit:** exits 0 — zero type errors across entire codebase.

**verify-ia-mock.ts (8/8 pass):** generate() → valid JPEG magic bytes, buffer >1000 bytes, mimeType image/jpeg. addWatermark() → output differs from input, output larger. getIAService() → MockIAService when no API key. buildBackOfficePrompt() → 244 chars. buildSimulatePrompt() → 258 chars.

**verify-e2e-m005.ts (15/15 pass):** R008 — factory mock confirmed + 6 admin routes return 401 without auth. R010 — GET /api/models/[slug]/visuals returns 200 + JSON array. R011 — POST /api/simulate missing model_id → 400, missing image → 400, valid request → 200 image/jpeg body >0 bytes, no new generated_visuals row.

**Observability:** "[IA] Using mock provider" log confirmed in factory test output. Route-level error prefixes confirmed in 401 responses.

**Auth boundary:** All 6 admin routes (generate, generate-all, validate, publish, bulk-validate, bulk-publish) confirmed to have requireAdmin() guards via grep. Simulate route confirmed to have NO requireAdmin() — public as designed.

## Requirements Advanced

None.

## Requirements Validated

- R008 — 8/8 IA mock checks (generate valid JPEG, watermark, factory switch) + 7/7 admin auth guard checks in E2E script. Full generate→validate→publish lifecycle confirmed at API and service levels.
- R010 — GET /api/models/[slug]/visuals returns 200 JSON array. Empty result confirms is_validated+is_published+fabric.is_active filter works correctly — only published validated visuals with active fabrics appear.
- R011 — POST /api/simulate: missing fields → 400 French error, valid FormData → 200 image/jpeg body >0 bytes, no auth required, no generated_visuals row created. 6/6 checks pass.
- R016 — buildBackOfficePrompt() → 244 chars, buildSimulatePrompt() → 258 chars. Both exported from src/lib/ai/prompts.ts. Confirmed not hardcoded in routes.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

ModelForm.tsx location was at src/app/admin/(protected)/produits/ModelForm.tsx rather than src/components/admin/ModelForm.tsx — adjusted lookup path, no code change needed. E2E script uses port 3000 and reuses existing dev server (Next.js 16 blocks concurrent dev servers). Used process.loadEnvFile() (Node 24 native) instead of dotenv since it's not a project dependency.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `scripts/verify-ia-mock.ts` — Created by T01 — standalone script proving MockIAService generates valid JPEG buffers, watermarks correctly, factory returns mock, and prompt templates produce non-empty strings (8/8 checks)
- `scripts/verify-e2e-m005.ts` — Created by T02 — live E2E verification script testing POST /api/simulate, GET /api/models/[slug]/visuals, and admin auth guards against running dev server (15/15 checks)
