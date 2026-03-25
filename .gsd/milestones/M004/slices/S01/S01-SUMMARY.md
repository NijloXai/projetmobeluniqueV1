---
id: S01
parent: M004
milestone: M004
provides:
  - Models CRUD API (GET list, POST create, GET/:id with images, PUT/:id, DELETE/:id with cascade storage cleanup)
  - Model images CRUD API (GET list, POST upload to model-photos bucket, PUT metadata, DELETE with storage cleanup)
  - Shared extractStoragePath utility in src/lib/utils.ts (used by both fabrics and models routes)
requires: []
affects:
  - S02
  - S03
  - S04
key_files:
  - src/lib/utils.ts
  - src/app/api/admin/models/route.ts
  - src/app/api/admin/models/[id]/route.ts
  - src/app/api/admin/models/[id]/images/route.ts
  - src/app/api/admin/models/[id]/images/[imageId]/route.ts
  - src/app/api/admin/fabrics/[id]/route.ts
key_decisions:
  - Extracted extractStoragePath to shared src/lib/utils.ts — both fabrics and models routes import from there, eliminating duplication
  - No Zod schema for image metadata — inline validation sufficient for FormData with only view_type (string) and sort_order (integer)
patterns_established:
  - Models CRUD mirrors fabrics CRUD pattern exactly: requireAdmin → parse body → Zod validation → slug auto-gen → Supabase operation → error mapping (409/404/500)
  - Cascade-delete pattern: fetch related storage URLs from model_images + generated_visuals → best-effort storage cleanup from model-photos and generated-visuals buckets → delete model row (FK cascade handles DB child rows)
  - Image upload pattern: requireAdmin → verify parent model exists (need slug for path) → parse FormData → validate file ≤ 5MB → upload to model-photos at {slug}/{view_type}-{sort_order}.{ext} → get public URL → insert DB row → return 201
  - Nested resource routes: image routes verify both imageId AND model_id to prevent cross-model access
observability_surfaces:
  - console.error with route-prefixed tags on all Supabase/storage errors (e.g. [POST /api/admin/models], [DELETE /api/admin/models/:id] model-photos cleanup:)
  - HTTP status codes 401/400/404/409/500 with French error messages in JSON response body
  - Supabase dashboard: models table, model_images table, model-photos storage bucket
drill_down_paths:
  - .gsd/milestones/M004/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T02-SUMMARY.md
duration: 18m
verification_result: passed
completed_at: 2026-03-24
---

# S01: API Admin Produits + Images

**Full admin CRUD API for models (canapés) and their multi-angle images, with shared extractStoragePath utility and cascade storage cleanup on deletion**

## What Happened

The slice delivered two tasks that together provide the complete API surface for managing product models and their photos.

**T01** extracted the `extractStoragePath` utility from the fabrics `[id]/route.ts` into `src/lib/utils.ts` as a shared export, then updated the fabrics route to import from the shared location. It then created the models CRUD: `GET /api/admin/models` (list all with image count via `model_images(count)`, ordered by created_at desc), `POST /api/admin/models` (create with Zod validation, auto-slug, 409 on conflict), `GET /api/admin/models/:id` (single model with nested images sorted by sort_order), `PUT /api/admin/models/:id` (update with slug re-gen if name changes), and `DELETE /api/admin/models/:id` (cascade cleanup — fetches model_images and generated_visuals URLs, best-effort removes from both storage buckets, then deletes the model row with FK cascade for DB rows).

**T02** created the image management routes: `GET /api/admin/models/:id/images` (list sorted by sort_order, 404 if model missing), `POST /api/admin/models/:id/images` (FormData with 5MB limit, uploads to `model-photos` bucket at `{slug}/{view_type}-{sort_order}.{ext}`, inserts model_images row, returns 201), `PUT /api/admin/models/:id/images/:imageId` (update view_type/sort_order metadata), and `DELETE /api/admin/models/:id/images/:imageId` (extract storage path, remove from bucket, delete DB row). All image routes verify the parent model exists and filter by both imageId and model_id for security.

Every route is gated by `requireAdmin()`. All error messages are in French. All Supabase errors are logged with route-prefixed tags. The implementation follows the exact same patterns established by the M003 fabrics CRUD.

## Verification

All slice-level verification checks passed:

| # | Check | Result |
|---|-------|--------|
| 1 | `tsc --noEmit` — zero type errors | ✅ pass |
| 2 | All 4 route files exist (models, models/[id], images, images/[imageId]) | ✅ pass |
| 3 | `extractStoragePath` exported from `src/lib/utils.ts` | ✅ pass |
| 4 | Fabrics route imports `extractStoragePath` from `@/lib/utils` | ✅ pass |
| 5 | Observability: console.error with route-prefixed tags on all error paths (12 error log points) | ✅ pass |
| 6 | 5MB file size limit enforced in image upload route | ✅ pass |
| 7 | `model-photos` bucket name used in upload path | ✅ pass |

## New Requirements Surfaced

- none

## Deviations

None. Both tasks implemented exactly per plan.

## Known Limitations

- API-only — no admin UI yet (S02 builds the list page, S03 builds forms)
- No runtime integration test — verification is TypeScript compilation + file structure. Full CRUD flow requires a running Supabase instance.
- Image upload uses `upsert: true` — uploading to the same path overwrites without warning. This is intentional for re-uploads but means the UI (S03) should handle this gracefully.

## Follow-ups

- none — all planned work completed, no new work discovered

## Files Created/Modified

- `src/lib/utils.ts` — added `extractStoragePath` export (extracts file path from Supabase Storage URL, shared by fabrics and models routes)
- `src/app/api/admin/fabrics/[id]/route.ts` — updated import to use `extractStoragePath` from `@/lib/utils`, removed local function definition
- `src/app/api/admin/models/route.ts` — created: GET list (models with image count) + POST create (Zod validation, slug auto-gen, 409 conflict)
- `src/app/api/admin/models/[id]/route.ts` — created: GET single (with nested images) + PUT update (slug re-gen) + DELETE (cascade storage cleanup from model-photos and generated-visuals buckets)
- `src/app/api/admin/models/[id]/images/route.ts` — created: GET list (sorted by sort_order) + POST upload (FormData, 5MB limit, model-photos bucket)
- `src/app/api/admin/models/[id]/images/[imageId]/route.ts` — created: PUT metadata (view_type/sort_order) + DELETE (storage + DB cleanup)

## Forward Intelligence

### What the next slice should know
- The models CRUD API is a 1:1 mirror of the fabrics CRUD pattern. S02 (list page) can reuse the same table/toggle pattern from M003's fabrics list page — just swap the data shape and API endpoint.
- `GET /api/admin/models` returns `model_images(count)` as a nested aggregate. The response shape for the image count is `model_images: [{ count: number }]` — extract with `model.model_images[0]?.count ?? 0`.
- `GET /api/admin/models/:id` returns images nested as `model_images: ModelImage[]` sorted by `sort_order` asc. S03 can render these directly for the photo management section.

### What's fragile
- Storage path convention `{slug}/{view_type}-{sort_order}.{ext}` — if the slug changes via PUT, existing storage files keep the old slug path. The URL in the DB still works (it's absolute), but the bucket has orphaned paths under the old slug. This only matters for bucket browsing, not functionality.
- `upsert: true` on image upload — re-uploading the same view_type + sort_order combo silently overwrites the file. S03 should either warn or handle this.

### Authoritative diagnostics
- `models` and `model_images` tables in Supabase dashboard — check row counts and relationships after any CRUD operation
- `model-photos` storage bucket — browse to verify uploaded files follow `{slug}/{view_type}-{sort_order}.{ext}` naming
- Browser network tab on any `/api/admin/models` call — response includes French error messages with appropriate HTTP status codes

### What assumptions changed
- No assumptions changed — implementation matched the plan exactly. The existing fabrics pattern translated cleanly to models.
