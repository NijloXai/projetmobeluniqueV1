# M004/S01 — Research: API Admin Produits + Images

**Date:** 2026-03-24
**Depth:** Light — replicates established fabrics CRUD pattern from M003

## Summary

This slice builds the admin CRUD API for models (canapés) and their multi-angle images. The codebase already has a complete reference implementation in `/api/admin/fabrics/` that handles auth, Zod validation, FormData upload, storage operations, and slug management. The models API follows the same pattern but splits into two route groups: model CRUD (JSON body, no files) and model images (FormData with file upload to `model-photos` bucket).

All foundation pieces exist: `createModelSchema`/`updateModelSchema` in `schemas.ts`, all DB types (`ModelInsert`, `ModelUpdate`, `ModelImageInsert`, etc.) in `types/database.ts`, `requireAdmin()` auth guard, `slugify()` utility, and the `model-photos` storage bucket (created in M001). No new dependencies or technology are required.

## Recommendation

Mirror the fabrics route structure exactly. Create two route groups:

1. **`/api/admin/models`** — CRUD on the `models` table (GET list, POST create, GET/PUT/DELETE by ID). JSON body only, no file handling. Uses `createModelSchema`/`updateModelSchema`.
2. **`/api/admin/models/[id]/images`** — CRUD on `model_images` (GET list, POST upload, PUT update metadata, DELETE). FormData for POST (file + view_type + sort_order), JSON for PUT (view_type, sort_order). Files go to bucket `model-photos`.

Extract `extractStoragePath()` from the fabrics route into `src/lib/utils.ts` so both models and fabrics routes can reuse it.

## Implementation Landscape

### Key Files

- **`src/app/api/admin/fabrics/route.ts`** — Reference pattern for GET list + POST create with auth, Zod validation, FormData handling. Copy structure for models.
- **`src/app/api/admin/fabrics/[id]/route.ts`** — Reference pattern for GET/PUT/DELETE by ID with file upload, storage cleanup on delete, slug conflict (409). Copy structure for models.
- **`src/lib/schemas.ts`** — `createModelSchema` and `updateModelSchema` already defined. No schema needed for model images (simple: view_type string + sort_order int + file).
- **`src/types/database.ts`** — All types ready: `Model`, `ModelInsert`, `ModelUpdate`, `ModelImage`, `ModelImageInsert`, `ModelImageUpdate`, `GeneratedVisual`, `GeneratedVisualInsert`.
- **`src/lib/supabase/admin.ts`** — `requireAdmin()` — reuse as-is.
- **`src/lib/utils.ts`** — `slugify()` — reuse as-is. Add `extractStoragePath()` here (currently duplicated in fabrics route).
- **`src/app/api/models/route.ts`** — Existing public route (GET only, filtered by is_active). Admin routes are separate — no conflict.

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/api/admin/models/route.ts` | GET (list all models + image count) + POST (create model) |
| `src/app/api/admin/models/[id]/route.ts` | GET (single model with images) + PUT (update) + DELETE (delete + cascade) |
| `src/app/api/admin/models/[id]/images/route.ts` | GET (list images for model) + POST (upload image to model-photos) |
| `src/app/api/admin/models/[id]/images/[imageId]/route.ts` | PUT (update view_type/sort_order) + DELETE (delete image + storage file) |

### Build Order

1. **Extract `extractStoragePath` to utils** — small refactor, unblocks both models and keeps fabrics route working.
2. **Models CRUD route** (`/api/admin/models` + `/api/admin/models/[id]`) — JSON-only, no file handling. Straightforward Zod + Supabase. Verifiable with curl immediately.
3. **Model images routes** (`/api/admin/models/[id]/images` + `[imageId]`) — FormData upload to `model-photos` bucket. Depends on a model existing (from step 2).

### Verification Approach

All routes testable via curl against the running dev server:

```bash
# Create model
curl -X POST http://localhost:3000/api/admin/models \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin_cookie>" \
  -d '{"name":"Canapé Oslo","slug":"canape-oslo","price":1200}'

# List models
curl http://localhost:3000/api/admin/models -H "Cookie: <admin_cookie>"

# Upload image
curl -X POST http://localhost:3000/api/admin/models/<id>/images \
  -H "Cookie: <admin_cookie>" \
  -F "image=@photo.jpg" -F "view_type=face" -F "sort_order=0"

# Verify public API reflects new model
curl http://localhost:3000/api/models
```

Auth required on every route — 401 without cookie. Slug conflicts return 409. Missing model returns 404.

## Constraints

- Auth via `requireAdmin()` on every route — no exceptions.
- `view_type` is free-text (D011 pattern — admin types what they want).
- `sort_order` is an integer ≥ 0, maintained client-side (S03 concern), API just stores it.
- Model images max 5 MB (R015 — `photos produits max 5MB`).
- Storage bucket is `model-photos` (public, already created in M001).
- Storage path convention: `{model-slug}/{view_type}-{sort_order}.{ext}` — unique per model+view.
- On model DELETE: cascade-delete `model_images` rows + storage files. DB FK cascading may handle rows, but storage cleanup is manual (same as fabrics pattern).
- `shopify_url` accepts empty string or valid URL (schema already handles this with `.or(z.literal(''))`).

## Common Pitfalls

- **Forgetting to add model_image Zod schema for validation** — The images POST route needs a lightweight schema for view_type (required, non-empty string) and sort_order (int ≥ 0). Not in schemas.ts yet — add it or validate inline.
- **DELETE cascade for model_images + generated_visuals** — Deleting a model must also clean up `generated_visuals` rows and files from both `model-photos` and `generated-visuals` buckets. If FK has ON DELETE CASCADE in DB, rows auto-delete, but storage files remain orphaned. Handle storage cleanup explicitly.
