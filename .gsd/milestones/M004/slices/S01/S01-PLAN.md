# S01: API Admin Produits + Images

**Goal:** Fully functional admin CRUD API for models (canapés) and their multi-angle images, mirroring the established fabrics CRUD pattern.
**Demo:** `POST /api/admin/models` creates a model, `POST /api/admin/models/:id/images` uploads an image to `model-photos` bucket, `GET /api/admin/models/:id` returns the model with its images, `DELETE /api/admin/models/:id` cascade-deletes images from DB and storage.

## Must-Haves

- Auth via `requireAdmin()` on every route — 401 without session
- Models CRUD: GET (list with image count), POST (create with slug auto-gen), GET/:id (with images), PUT/:id (update), DELETE/:id (cascade cleanup of model_images + generated_visuals storage files)
- Model images CRUD: GET (list for model), POST (upload to `model-photos`, max 5MB), PUT/:imageId (update view_type/sort_order), DELETE/:imageId (remove from DB + storage)
- Slug conflict returns 409, missing model returns 404
- Zod validation on all inputs (existing `createModelSchema`/`updateModelSchema` + new inline schema for image metadata)
- `extractStoragePath()` extracted to shared `src/lib/utils.ts` so both fabrics and models routes reuse it

## Proof Level

- This slice proves: contract (API routes respond correctly to all CRUD operations)
- Real runtime required: yes (Supabase connection for full integration, but TypeScript compilation verifies contract shape)
- Human/UAT required: no

## Verification

- `cd /Users/salah/Desktop/projetmobelunique && npx tsc --noEmit` — zero type errors across all new and modified route files
- `test -f src/app/api/admin/models/route.ts && test -f src/app/api/admin/models/\[id\]/route.ts && test -f src/app/api/admin/models/\[id\]/images/route.ts && test -f src/app/api/admin/models/\[id\]/images/\[imageId\]/route.ts && echo "All route files exist"` — all 4 route files created
- `grep -q "extractStoragePath" src/lib/utils.ts` — shared utility extracted
- `grep -q "extractStoragePath" src/app/api/admin/fabrics/\[id\]/route.ts | grep -q "import"` — fabrics route imports from shared utils (not local function)

## Observability / Diagnostics

- Runtime signals: `console.error` with route-prefixed tags (e.g. `[POST /api/admin/models]`, `[DELETE /api/admin/models/:id]`) on all Supabase errors
- Inspection surfaces: Direct Supabase `models` and `model_images` tables, `model-photos` storage bucket
- Failure visibility: HTTP status codes (401/400/404/409/500) with French error messages in JSON response body
- Redaction constraints: none (no PII in model data)

## Integration Closure

- Upstream surfaces consumed: `src/lib/supabase/admin.ts` (`requireAdmin`), `src/lib/schemas.ts` (`createModelSchema`, `updateModelSchema`), `src/types/database.ts` (all Model/ModelImage types), `src/lib/utils.ts` (`slugify`)
- New wiring introduced in this slice: 4 new Next.js route files under `/api/admin/models/`, `extractStoragePath` shared utility
- What remains before the milestone is truly usable end-to-end: S02 (admin list page), S03 (forms + photo management UI), S04 (mode classique upload)

## Tasks

- [x] **T01: Implement models CRUD routes with shared extractStoragePath utility** `est:45m`
  - Why: Delivers the core model CRUD API (create, read, update, delete canapés) and extracts the `extractStoragePath` utility from the fabrics route into shared utils for reuse by both models and fabrics routes.
  - Files: `src/lib/utils.ts`, `src/app/api/admin/fabrics/[id]/route.ts`, `src/app/api/admin/models/route.ts`, `src/app/api/admin/models/[id]/route.ts`
  - Do: (1) Extract `extractStoragePath()` from fabrics `[id]/route.ts` to `src/lib/utils.ts`, update fabrics route to import from utils. (2) Create `src/app/api/admin/models/route.ts` with GET (list all models with image count via `model_images(count)`) and POST (create model with Zod validation, slug auto-gen, 409 on conflict). (3) Create `src/app/api/admin/models/[id]/route.ts` with GET (single model + images), PUT (update with Zod validation, slug auto-gen if name changes), DELETE (cascade: fetch model_images and generated_visuals, remove storage files from `model-photos` and `generated-visuals` buckets, then delete model row — FK cascade handles DB rows).
  - Verify: `npx tsc --noEmit` passes and all 2 new route files exist
  - Done when: GET/POST `/api/admin/models` and GET/PUT/DELETE `/api/admin/models/:id` compile without errors, fabrics route still works with imported `extractStoragePath`

- [x] **T02: Implement model images CRUD routes with upload to model-photos bucket** `est:40m`
  - Why: Delivers the image management API — uploading multi-angle photos for each model, updating metadata (view_type, sort_order), and deleting with storage cleanup.
  - Files: `src/app/api/admin/models/[id]/images/route.ts`, `src/app/api/admin/models/[id]/images/[imageId]/route.ts`
  - Do: (1) Create `src/app/api/admin/models/[id]/images/route.ts` with GET (list images for model, sorted by sort_order) and POST (FormData: validate file ≤ 5MB, extract view_type + sort_order, upload to `model-photos` bucket at path `{model-slug}/{view_type}-{sort_order}.{ext}`, insert row in model_images, return 201). Verify model exists first (404 if not). (2) Create `src/app/api/admin/models/[id]/images/[imageId]/route.ts` with PUT (JSON: update view_type and/or sort_order) and DELETE (fetch image row, extract storage path via `extractStoragePath`, remove from `model-photos` bucket, delete DB row).
  - Verify: `npx tsc --noEmit` passes and both image route files exist
  - Done when: GET/POST `/api/admin/models/:id/images` and PUT/DELETE `/api/admin/models/:id/images/:imageId` compile without errors, 5MB limit enforced, storage path follows `{slug}/{view_type}-{sort_order}.{ext}` convention

## Files Likely Touched

- `src/lib/utils.ts`
- `src/app/api/admin/fabrics/[id]/route.ts`
- `src/app/api/admin/models/route.ts`
- `src/app/api/admin/models/[id]/route.ts`
- `src/app/api/admin/models/[id]/images/route.ts`
- `src/app/api/admin/models/[id]/images/[imageId]/route.ts`
