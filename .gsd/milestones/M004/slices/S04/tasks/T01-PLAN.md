---
estimated_steps: 4
estimated_files: 2
skills_used:
  - best-practices
---

# T01: Create admin visuals API routes (GET+POST, DELETE)

**Slice:** S04 — Mode Classique (upload rendus sans IA)
**Milestone:** M004

## Description

Create two API route files mirroring the existing `images` route pattern for managing generated visuals. The GET+POST route at `/api/admin/models/[id]/visuals` lists visuals with fabric joins and creates new ones via FormData upload. The DELETE route at `/api/admin/models/[id]/visuals/[visualId]` removes the storage file and DB row. All routes are gated by `requireAdmin()` and verify the parent model exists. The POST route hardcodes `is_validated: true` and `is_published: true` per K002 (mode classique).

## Steps

1. **Create `src/app/api/admin/models/[id]/visuals/route.ts`** with GET and POST handlers:
   - Import `requireAdmin` from `@/lib/supabase/admin`, `NextRequest`/`NextResponse` from `next/server`, and `GeneratedVisualInsert` from `@/types/database`.
   - Define `MAX_FILE_SIZE = 5 * 1024 * 1024` (5MB).
   - **GET handler:** Call `requireAdmin()`. Extract `id` from params. Verify model exists via `supabase.from('models').select('id, slug').eq('id', id).single()` — 404 if not found. Query `generated_visuals` with `select('*, fabric:fabrics(*)')` filtered by `model_id = id`, ordered by `created_at desc`. Return the data as JSON.
   - **POST handler:** Call `requireAdmin()`. Extract `id` from params. Verify model exists (need slug for storage path) — 404 if not found. Parse FormData. Extract `image` (File), `fabric_id` (string), `model_image_id` (string). Validate: file required and ≤ 5MB, `fabric_id` required, `model_image_id` required. Verify `model_image_id` belongs to this model via `supabase.from('model_images').select('id').eq('id', model_image_id).eq('model_id', id).single()` — 400 if not found. Upload to `generated-visuals` bucket at path `{slug}/{fabric_id}-{model_image_id}.{ext}` with `upsert: true`. Get public URL via `getPublicUrl`. Insert into `generated_visuals` table: `{ model_id: id, fabric_id, model_image_id, generated_image_url: publicUrl, is_validated: true, is_published: true }`. Return 201 with the inserted row.

2. **Create `src/app/api/admin/models/[id]/visuals/[visualId]/route.ts`** with DELETE handler:
   - Import `requireAdmin`, `extractStoragePath` from `@/lib/utils`, `NextRequest`/`NextResponse`.
   - **DELETE handler:** Call `requireAdmin()`. Extract `id` and `visualId` from params. Fetch the visual via `supabase.from('generated_visuals').select('*').eq('id', visualId).eq('model_id', id).single()` — 404 if not found. Extract storage path from `generated_image_url` using `extractStoragePath`. Best-effort remove from `generated-visuals` bucket. Delete the DB row. Return `{ success: true }`.

3. **Add console.error logging** with route-prefixed tags on all error paths: `[GET /api/admin/models/:id/visuals]`, `[POST /api/admin/models/:id/visuals]`, `[DELETE /api/admin/models/:id/visuals/:visualId]`. All user-facing error messages in French.

4. **Run `npx tsc --noEmit`** to verify zero type errors.

## Must-Haves

- [ ] GET returns visuals with `fabric:fabrics(*)` join, ordered by created_at desc
- [ ] POST validates 5MB file limit, required fabric_id and model_image_id
- [ ] POST verifies model_image_id belongs to the model (prevents cross-model references)
- [ ] POST uploads to `generated-visuals` bucket (not `model-photos`)
- [ ] POST inserts with `is_validated: true` and `is_published: true` hardcoded
- [ ] DELETE removes storage file via extractStoragePath + DB row
- [ ] All routes gated by requireAdmin()
- [ ] All routes verify parent model exists
- [ ] French error messages, console.error with route-prefixed tags

## Verification

- `npx tsc --noEmit` — zero type errors
- `test -f src/app/api/admin/models/\[id\]/visuals/route.ts` — file exists
- `test -f src/app/api/admin/models/\[id\]/visuals/\[visualId\]/route.ts` — file exists
- `grep -q 'is_validated: true' src/app/api/admin/models/\[id\]/visuals/route.ts` — validated flag hardcoded
- `grep -q 'is_published: true' src/app/api/admin/models/\[id\]/visuals/route.ts` — published flag hardcoded
- `grep -q 'generated-visuals' src/app/api/admin/models/\[id\]/visuals/route.ts` — correct bucket name
- `grep -q 'requireAdmin' src/app/api/admin/models/\[id\]/visuals/route.ts` — admin gate present
- `grep -q 'extractStoragePath' src/app/api/admin/models/\[id\]/visuals/\[visualId\]/route.ts` — storage cleanup uses shared util

## Inputs

- `src/app/api/admin/models/[id]/images/route.ts` — pattern to mirror for GET+POST structure, FormData handling, requireAdmin gate, model verification, storage upload, 5MB limit
- `src/app/api/admin/models/[id]/images/[imageId]/route.ts` — pattern to mirror for DELETE with extractStoragePath cleanup
- `src/types/database.ts` — `GeneratedVisualInsert` type for the insert payload
- `src/lib/utils.ts` — `extractStoragePath` utility for storage path extraction in DELETE
- `src/lib/supabase/admin.ts` — `requireAdmin` function for authentication

## Expected Output

- `src/app/api/admin/models/[id]/visuals/route.ts` — GET (list visuals with fabric join) + POST (upload to generated-visuals bucket, insert with is_validated=true, is_published=true)
- `src/app/api/admin/models/[id]/visuals/[visualId]/route.ts` — DELETE (storage cleanup + DB row deletion)
