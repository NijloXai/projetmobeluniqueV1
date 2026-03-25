---
id: T01
parent: S04
milestone: M004
provides:
  - Admin visuals CRUD API (GET+POST at /api/admin/models/[id]/visuals, DELETE at /api/admin/models/[id]/visuals/[visualId])
key_files:
  - src/app/api/admin/models/[id]/visuals/route.ts
  - src/app/api/admin/models/[id]/visuals/[visualId]/route.ts
key_decisions:
  - Storage path pattern uses {slug}/{fabric_id}-{model_image_id}.{ext} with upsert to allow re-uploads for the same combo
patterns_established:
  - Visuals API mirrors the images API pattern (requireAdmin, model existence check, FormData parsing, storage upload, DB insert)
observability_surfaces:
  - console.error with route-prefixed tags on all error paths ([GET/POST/DELETE /api/admin/models/:id/visuals])
duration: 8m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Create admin visuals API routes (GET+POST, DELETE)

**Added GET+POST+DELETE API routes for admin generated visuals with fabric join, 5MB file limit, cross-model validation, and generated-visuals bucket targeting**

## What Happened

Created two route files mirroring the existing images API pattern. The GET handler at `/api/admin/models/[id]/visuals` lists generated visuals with a fabric join (`*, fabric:fabrics(*)`) ordered by `created_at desc`. The POST handler accepts FormData (image, fabric_id, model_image_id), validates the 5MB file limit and required fields, verifies the `model_image_id` belongs to the target model to prevent cross-model references, uploads to the `generated-visuals` bucket at `{slug}/{fabric_id}-{model_image_id}.{ext}`, and inserts a row with `is_validated: true` and `is_published: true` hardcoded (mode classique). The DELETE handler at `/api/admin/models/[id]/visuals/[visualId]` fetches the visual scoped to the model, extracts the storage path via `extractStoragePath`, performs best-effort storage cleanup from the `generated-visuals` bucket, then deletes the DB row. All routes are gated by `requireAdmin()` and verify parent model existence. Error messages are in French with `console.error` using route-prefixed tags.

## Verification

All 8 verification checks passed: both files exist, `is_validated: true` and `is_published: true` are hardcoded, `generated-visuals` bucket is referenced, `requireAdmin` is used, `extractStoragePath` is used in the delete route, and `npx tsc --noEmit` returned zero type errors.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 11.2s |
| 2 | `test -f src/app/api/admin/models/[id]/visuals/route.ts` | 0 | ✅ pass | <1s |
| 3 | `test -f src/app/api/admin/models/[id]/visuals/[visualId]/route.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q 'is_validated: true' src/app/api/admin/models/[id]/visuals/route.ts` | 0 | ✅ pass | <1s |
| 5 | `grep -q 'is_published: true' src/app/api/admin/models/[id]/visuals/route.ts` | 0 | ✅ pass | <1s |
| 6 | `grep -q 'generated-visuals' src/app/api/admin/models/[id]/visuals/route.ts` | 0 | ✅ pass | <1s |
| 7 | `grep -q 'requireAdmin' src/app/api/admin/models/[id]/visuals/route.ts` | 0 | ✅ pass | <1s |
| 8 | `grep -q 'extractStoragePath' src/app/api/admin/models/[id]/visuals/[visualId]/route.ts` | 0 | ✅ pass | <1s |

## Diagnostics

- **GET /api/admin/models/:id/visuals** — returns full visual list with fabric join; useful for inspecting state
- **Server logs** — all error paths emit `console.error` with route-prefixed tags; search for `[GET /api/admin/models/:id/visuals]`, `[POST /api/admin/models/:id/visuals]`, or `[DELETE /api/admin/models/:id/visuals/:visualId]`
- **Supabase dashboard** — inspect `generated_visuals` table rows and `generated-visuals` bucket files directly

## Deviations

None. Implementation followed the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/admin/models/[id]/visuals/route.ts` — new: GET (list visuals with fabric join) + POST (upload to generated-visuals bucket, insert with is_validated=true, is_published=true)
- `src/app/api/admin/models/[id]/visuals/[visualId]/route.ts` — new: DELETE (storage cleanup via extractStoragePath + DB row deletion)
- `.gsd/milestones/M004/slices/S04/S04-PLAN.md` — added Observability / Diagnostics section, marked T01 as done
