---
id: T01
parent: S02
milestone: M005
key_files:
  - src/app/api/simulate/route.ts
key_decisions:
  - Route verified as-is — no code changes needed; all R011 criteria were already met by the pre-built implementation
duration: ""
verification_result: passed
completed_at: 2026-03-25T01:33:15.485Z
blocker_discovered: false
---

# T01: Verify POST /api/simulate route meets all 16 R011 acceptance criteria — all pass

**Verify POST /api/simulate route meets all 16 R011 acceptance criteria — all pass**

## What Happened

This task structurally verified the existing `src/app/api/simulate/route.ts` (124 lines, pre-built during M005 setup) against every R011 acceptance criterion. No code changes were needed — the route was already fully compliant.

The route correctly:
- Accepts FormData with `image` (File), `model_id` (string), `fabric_id` (string) fields
- Returns binary `image/jpeg` with `Cache-Control: no-store` headers
- Applies watermark text "MÖBEL UNIQUE — Aperçu" via `iaService.addWatermark`
- Has no `requireAdmin` guard (public route)
- Has no `generated_visuals` table reference (ephemeral, no DB persistence)
- Validates all inputs with 5 distinct `status: 400` responses (invalid FormData, missing image, oversized image, missing model_id, missing fabric_id)
- Returns 2 distinct `status: 404` responses (model not found, fabric not found)
- Uses the IA service abstraction (`getIAService` → `iaService.generate` → `iaService.addWatermark`)
- Has proper French error messages and console.error logging on failure
- Passes `tsc --noEmit` with zero type errors

## Verification

Ran all 16 structural checks from the task plan:
1. File exists — PASS
2. addWatermark present — PASS
3. "MÖBEL UNIQUE" watermark text — PASS
4. image/jpeg content type — PASS
5. no-store cache control — PASS
6. No requireAdmin (public) — PASS
7. No generated_visuals (ephemeral) — PASS
8. request.formData parsing — PASS
9. formData.get('image') — PASS
10. formData.get('model_id') — PASS
11. formData.get('fabric_id') — PASS
12. status: 400 count = 5 (>= 3 required) — PASS
13. status: 404 count = 2 (>= 2 required) — PASS
14. getIAService factory usage — PASS
15. iaService.generate call — PASS
16. tsc --noEmit exits 0 — PASS

All 16/16 checks pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 2 | `grep -q 'addWatermark' src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 3 | `grep -q 'MÖBEL UNIQUE' src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 4 | `grep -q 'image/jpeg' src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 5 | `grep -q 'no-store' src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 6 | `! grep -q 'requireAdmin' src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 7 | `! grep -q 'generated_visuals' src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 8 | `grep -q 'request.formData' src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 9 | `grep -q "formData.get('image')" src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 10 | `grep -q "formData.get('model_id')" src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 11 | `grep -q "formData.get('fabric_id')" src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 12 | `grep -c 'status: 400' src/app/api/simulate/route.ts (found 5, need >= 3)` | 0 | ✅ pass | 10ms |
| 13 | `grep -c 'status: 404' src/app/api/simulate/route.ts (found 2, need >= 2)` | 0 | ✅ pass | 10ms |
| 14 | `grep -q 'getIAService' src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 15 | `grep -q 'iaService.generate' src/app/api/simulate/route.ts` | 0 | ✅ pass | 10ms |
| 16 | `npx tsc --noEmit` | 0 | ✅ pass | 3100ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/simulate/route.ts`
