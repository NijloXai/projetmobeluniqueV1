---
estimated_steps: 4
estimated_files: 2
skills_used:
  - best-practices
  - supabase-postgres-best-practices
---

# T02: Implement model images CRUD routes with upload to model-photos bucket

**Slice:** S01 — API Admin Produits + Images
**Milestone:** M004

## Description

Create the model images API routes for uploading, listing, updating, and deleting multi-angle photos for each model. Follows the same auth + validation + storage pattern as fabrics. Images are uploaded via FormData to the `model-photos` bucket with a structured path convention. This completes the S01 API surface.

## Steps

1. **Create `src/app/api/admin/models/[id]/images/route.ts`** with:
   - `GET`: Auth via `requireAdmin()`. Verify model exists (`supabase.from('models').select('id, slug').eq('id', id).single()` — 404 if not found). Query `model_images` for this model_id, ordered by `sort_order` asc. Return array.
   - `POST`: Auth. Verify model exists (need slug for storage path). Parse FormData: extract `image` (File), `view_type` (string, required, non-empty), `sort_order` (integer ≥ 0, default 0). Validate file: must exist, max 5MB (`5 * 1024 * 1024`). Upload to `model-photos` bucket at path `{model-slug}/{view_type}-{sort_order}.{ext}` with `upsert: true`. Get public URL. Insert row in `model_images` table (`model_id`, `image_url`, `view_type`, `sort_order`). Return 201 with the created row.
   - Note: Next.js 16 params are `{ params }: { params: Promise<{ id: string }> }` — await params.

2. **Create `src/app/api/admin/models/[id]/images/[imageId]/route.ts`** with:
   - `PUT`: Auth. Parse JSON body. Accept optional `view_type` (string) and `sort_order` (integer ≥ 0). Validate at least one field is present (400 if empty). Update the `model_images` row where `id = imageId` AND `model_id = id`. Return 404 if not found (no matching row).
   - `DELETE`: Auth. Fetch the image row (`model_images` where `id = imageId` AND `model_id = id`). Return 404 if not found. Extract storage path from `image_url` using `extractStoragePath` from `@/lib/utils`. Remove file from `model-photos` bucket (best effort). Delete the DB row. Return `{ success: true }`.
   - Note: Next.js 16 nested params: `{ params }: { params: Promise<{ id: string; imageId: string }> }`.

3. **Add consistent error logging.** All error paths log with route-prefixed tags (e.g. `[POST /api/admin/models/:id/images]`). User-facing errors in French.

4. **Verify compilation.** Run `npx tsc --noEmit` to confirm zero type errors.

## Must-Haves

- [ ] GET `/api/admin/models/:id/images` returns images sorted by sort_order, 404 if model missing
- [ ] POST `/api/admin/models/:id/images` accepts FormData (image file + view_type + sort_order), enforces 5MB limit, uploads to `model-photos` bucket at `{slug}/{view_type}-{sort_order}.{ext}`, returns 201
- [ ] PUT `/api/admin/models/:id/images/:imageId` updates view_type and/or sort_order via JSON
- [ ] DELETE `/api/admin/models/:id/images/:imageId` removes storage file + DB row
- [ ] All routes gated by `requireAdmin()`
- [ ] Model existence verified before image operations (404 if model not found)
- [ ] `npx tsc --noEmit` passes with zero errors

## Verification

- `npx tsc --noEmit` exits 0
- `test -f src/app/api/admin/models/\[id\]/images/route.ts && test -f src/app/api/admin/models/\[id\]/images/\[imageId\]/route.ts && echo "OK"` — both files exist
- `grep -q "5 \* 1024 \* 1024\|5242880" src/app/api/admin/models/\[id\]/images/route.ts` — 5MB limit enforced
- `grep -q "model-photos" src/app/api/admin/models/\[id\]/images/route.ts` — correct bucket name used

## Observability Impact

- **New runtime signals:** `console.error` with route-prefixed tags (`[GET /api/admin/models/:id/images]`, `[POST /api/admin/models/:id/images]`, `[PUT /api/admin/models/:id/images/:imageId]`, `[DELETE /api/admin/models/:id/images/:imageId]`) on all Supabase errors.
- **Inspection surfaces:** `model_images` table rows (keyed by `model_id`), `model-photos` storage bucket (files at `{slug}/{view_type}-{sort_order}.{ext}`).
- **Failure visibility:** 401 (unauthenticated), 400 (missing/invalid file or metadata), 404 (model or image not found), 500 (Supabase/storage error) — all with French JSON error messages.
- **Storage cleanup logging:** `[DELETE /api/admin/models/:id/images/:imageId] model-photos cleanup:` logged on best-effort storage removal failures.

## Inputs

- `src/app/api/admin/models/route.ts` — T01 output, confirms model CRUD route pattern
- `src/app/api/admin/models/[id]/route.ts` — T01 output, confirms params pattern and auth usage
- `src/app/api/admin/fabrics/route.ts` — reference pattern for FormData handling and file upload
- `src/lib/utils.ts` — `extractStoragePath` (added in T01), `slugify`
- `src/lib/supabase/admin.ts` — `requireAdmin()` auth guard
- `src/types/database.ts` — `ModelImageInsert`, `ModelImageUpdate`, `ModelImage` types

## Expected Output

- `src/app/api/admin/models/[id]/images/route.ts` — created: GET list + POST upload
- `src/app/api/admin/models/[id]/images/[imageId]/route.ts` — created: PUT update metadata + DELETE with storage cleanup
