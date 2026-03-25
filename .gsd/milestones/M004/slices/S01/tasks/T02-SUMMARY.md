---
id: T02
parent: S01
milestone: M004
provides:
  - Model images CRUD API routes (GET list, POST upload, PUT metadata, DELETE with storage cleanup)
key_files:
  - src/app/api/admin/models/[id]/images/route.ts
  - src/app/api/admin/models/[id]/images/[imageId]/route.ts
key_decisions:
  - No Zod schema for image metadata — inline validation is sufficient for FormData with only view_type (string) and sort_order (integer)
patterns_established:
  - Image upload pattern: requireAdmin → verify parent model exists (need slug) → parse FormData → validate file size → upload to storage at {slug}/{view_type}-{sort_order}.{ext} → get public URL → insert DB row → return 201
  - Nested resource deletion: fetch child row with both id AND parent_id filter → extractStoragePath → best-effort storage removal → delete DB row
observability_surfaces:
  - console.error with route-prefixed tags on all Supabase/storage errors
  - HTTP status codes 401/400/404/500 with French error messages
duration: 8m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T02: Implement model images CRUD routes with upload to model-photos bucket

**Created model images CRUD API with FormData upload to model-photos bucket, metadata update, and storage-aware deletion**

## What Happened

1. Created `src/app/api/admin/models/[id]/images/route.ts` with GET (list images for a model, sorted by `sort_order` asc, 404 if model missing) and POST (FormData: validate `image` file ≤ 5MB, `view_type` required non-empty, `sort_order` integer ≥ 0 defaulting to 0, upload to `model-photos` bucket at `{model-slug}/{view_type}-{sort_order}.{ext}` with upsert, get public URL, insert row in `model_images`, return 201).

2. Created `src/app/api/admin/models/[id]/images/[imageId]/route.ts` with PUT (JSON body: update optional `view_type` and/or `sort_order`, 400 if no fields provided, 404 if no matching row for `imageId` + `model_id`) and DELETE (fetch image row filtered by both `imageId` and `model_id`, extract storage path via `extractStoragePath`, best-effort removal from `model-photos` bucket, delete DB row, return `{ success: true }`).

3. All four handler functions are gated by `requireAdmin()`. All error paths log with route-prefixed tags. All user-facing error messages are in French. Both files use Next.js 16 async params pattern (`params: Promise<...>`).

4. Added Observability Impact section to T02-PLAN.md as flagged by pre-flight check.

## Verification

- TypeScript compilation (`npx tsc --noEmit`) passes with zero errors
- Both image route files exist at expected paths
- 5MB limit enforced via `5 * 1024 * 1024` constant
- `model-photos` bucket name used in upload path
- All 4 slice route files exist (models CRUD + images CRUD)
- `extractStoragePath` shared from `src/lib/utils.ts`
- Fabrics route still imports `extractStoragePath` from shared utils

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | ~3s |
| 2 | `test -f src/app/api/admin/models/[id]/images/route.ts && test -f src/app/api/admin/models/[id]/images/[imageId]/route.ts` | 0 | ✅ pass | <1s |
| 3 | `grep -q "5 \* 1024 \* 1024\|5242880" src/app/api/admin/models/[id]/images/route.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q "model-photos" src/app/api/admin/models/[id]/images/route.ts` | 0 | ✅ pass | <1s |
| 5 | `test -f ...models/route.ts && test -f .../[id]/route.ts && test -f .../images/route.ts && test -f .../[imageId]/route.ts` | 0 | ✅ pass | <1s |
| 6 | `grep -q "extractStoragePath" src/lib/utils.ts` | 0 | ✅ pass | <1s |
| 7 | `grep -q "extractStoragePath" src/app/api/admin/fabrics/[id]/route.ts` | 0 | ✅ pass | <1s |

## Diagnostics

- **Runtime errors:** All Supabase errors logged with `console.error('[METHOD /api/admin/models/:id/images]', ...)` and `[DELETE /api/admin/models/:id/images/:imageId] model-photos cleanup:` for storage cleanup failures.
- **Inspection:** Query `model_images` table filtered by `model_id`. Browse `model-photos` storage bucket for files at `{slug}/{view_type}-{sort_order}.{ext}`.
- **Response shape:** POST returns created image row with 201. PUT returns updated image row. DELETE returns `{ success: true }`. Errors return `{ error: "French message" }`.

## Deviations

None. Implementation follows the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/admin/models/[id]/images/route.ts` — created: GET (list images sorted by sort_order, 404 if model missing) + POST (FormData upload to model-photos bucket with 5MB limit, insert model_images row, return 201)
- `src/app/api/admin/models/[id]/images/[imageId]/route.ts` — created: PUT (update view_type/sort_order metadata via JSON) + DELETE (extract storage path, remove from model-photos bucket, delete DB row)
- `.gsd/milestones/M004/slices/S01/tasks/T02-PLAN.md` — added Observability Impact section (pre-flight fix)
