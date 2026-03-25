---
estimated_steps: 5
estimated_files: 4
skills_used:
  - best-practices
  - supabase-postgres-best-practices
---

# T01: Implement models CRUD routes with shared extractStoragePath utility

**Slice:** S01 — API Admin Produits + Images
**Milestone:** M004

## Description

Create the core model (canapé) CRUD API routes and extract the `extractStoragePath` utility from the fabrics route into shared utils. This mirrors the established fabrics CRUD pattern: auth via `requireAdmin()`, Zod validation, slug auto-generation, 409 on slug conflict, 404 on missing model, and cascade-delete with storage cleanup.

## Steps

1. **Extract `extractStoragePath` to shared utils.** Move the function from `src/app/api/admin/fabrics/[id]/route.ts` into `src/lib/utils.ts`. Export it. Update the fabrics route to `import { extractStoragePath } from '@/lib/utils'` instead of defining it locally. The function parses Supabase Storage URLs to extract the file path portion (handles both `/public/` and `/sign/` URL patterns).

2. **Create `src/app/api/admin/models/route.ts`** with:
   - `GET`: Auth via `requireAdmin()`. Query `supabase.from('models').select('*, model_images(count)')` ordered by `created_at` desc. Return the full list (no is_active filter — admin sees all).
   - `POST`: Auth. Parse JSON body. Auto-generate slug from name if empty (`slugify(name)`). Validate with `createModelSchema` from `@/lib/schemas`. Insert into `models` table using `ModelInsert` type. Return 201 on success, 409 on duplicate slug (Postgres error code `23505`), 400 on validation error.

3. **Create `src/app/api/admin/models/[id]/route.ts`** with:
   - `GET`: Auth. Query `supabase.from('models').select('*, model_images(*)').eq('id', id).single()`. Sort model_images by sort_order in JS. Return 404 if not found.
   - `PUT`: Auth. Parse JSON body. Auto-generate slug from name if name changes and no explicit slug. Validate with `updateModelSchema`. Update row. Return 409 on slug conflict, 404 if not found.
   - `DELETE`: Auth. Fetch model with id. Fetch all `model_images` for this model to get their `image_url`s. Fetch all `generated_visuals` for this model to get their `generated_image_url`s. Remove storage files from `model-photos` bucket (model images) and `generated-visuals` bucket (generated visuals) — best effort, don't fail on storage errors. Delete the model row (FK cascade handles model_images and generated_visuals DB rows). Return 404 if model not found.
   - Note: Next.js 16 uses `{ params }: { params: Promise<{ id: string }> }` — await params before use (same pattern as fabrics `[id]/route.ts`).

4. **Add consistent error logging.** Every error path logs with a route-prefixed tag: `console.error('[POST /api/admin/models]', error.message)`. All user-facing errors are in French.

5. **Verify compilation.** Run `npx tsc --noEmit` to confirm zero type errors across all new and modified files.

## Must-Haves

- [ ] `extractStoragePath` exported from `src/lib/utils.ts` and imported in fabrics route (no local copy)
- [ ] GET `/api/admin/models` returns all models with image count, no is_active filter
- [ ] POST `/api/admin/models` validates with `createModelSchema`, auto-generates slug, returns 201/400/409
- [ ] GET `/api/admin/models/:id` returns model with nested model_images sorted by sort_order
- [ ] PUT `/api/admin/models/:id` validates with `updateModelSchema`, auto-generates slug if name changes
- [ ] DELETE `/api/admin/models/:id` cleans up storage files from `model-photos` and `generated-visuals` buckets before deleting
- [ ] All routes gated by `requireAdmin()` — return 401 if not authenticated
- [ ] `npx tsc --noEmit` passes with zero errors

## Verification

- `npx tsc --noEmit` exits 0
- `test -f src/app/api/admin/models/route.ts && test -f src/app/api/admin/models/\[id\]/route.ts && echo "OK"` — both files exist
- `grep -q "export function extractStoragePath" src/lib/utils.ts` — utility is exported from shared location
- `grep -q "import.*extractStoragePath.*from.*@/lib/utils" src/app/api/admin/fabrics/\[id\]/route.ts` — fabrics route imports from shared utils

## Inputs

- `src/app/api/admin/fabrics/[id]/route.ts` — reference pattern for GET/PUT/DELETE by ID, source of `extractStoragePath` to extract
- `src/app/api/admin/fabrics/route.ts` — reference pattern for GET list + POST create
- `src/lib/schemas.ts` — `createModelSchema` and `updateModelSchema` already defined
- `src/types/database.ts` — `ModelInsert`, `ModelUpdate`, `Model`, `ModelImage`, `GeneratedVisual` types
- `src/lib/supabase/admin.ts` — `requireAdmin()` auth guard
- `src/lib/utils.ts` — `slugify()` utility, target for `extractStoragePath` extraction

## Expected Output

- `src/lib/utils.ts` — modified: added `extractStoragePath` export
- `src/app/api/admin/fabrics/[id]/route.ts` — modified: imports `extractStoragePath` from `@/lib/utils`, local function removed
- `src/app/api/admin/models/route.ts` — created: GET list + POST create
- `src/app/api/admin/models/[id]/route.ts` — created: GET single + PUT update + DELETE with cascade storage cleanup

## Observability Impact

- **New signals:** `console.error` with route-prefixed tags (`[GET /api/admin/models]`, `[POST /api/admin/models]`, `[PUT /api/admin/models]`, `[DELETE /api/admin/models/:id]`) on all Supabase errors. Best-effort storage cleanup errors logged with sub-tags (e.g. `model-photos cleanup`, `generated-visuals cleanup`).
- **Inspection:** Query `models` table directly in Supabase. Verify cascade-delete behavior by checking `model_images` and `generated_visuals` rows after model deletion.
- **Failure states visible:** 401 (unauthenticated), 400 (validation/empty body), 404 (model not found), 409 (slug conflict), 500 (Supabase error) — all with French error messages in JSON response body.
