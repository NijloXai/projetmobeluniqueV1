# S01: API Admin Produits + Images — UAT

**Milestone:** M004
**Written:** 2026-03-24

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice delivers only API routes (no UI). TypeScript compilation verifies the contract shape. Full runtime integration requires a live Supabase instance — the next slices (S02/S03) with their UI will exercise these APIs end-to-end.

## Preconditions

- Supabase project running with `models` and `model_images` tables, plus `model-photos` and `generated-visuals` storage buckets
- Admin user created in Supabase Auth
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured in `.env.local`
- Dev server running: `npm run dev`
- Authenticated admin session (login via `/admin/login` first, keep session cookie)

## Smoke Test

```bash
curl -b cookies.txt http://localhost:3000/api/admin/models
```
Expected: 200 with JSON array of models (empty `[]` if no models exist yet). Returns 401 without auth cookie.

## Test Cases

### 1. Create a model (POST /api/admin/models)

1. Send `POST /api/admin/models` with JSON body:
   ```json
   {
     "name": "Canapé Oslo",
     "description": "Canapé 3 places scandinave",
     "base_price": 1299,
     "dimensions": "220x90x85",
     "shopify_url": "https://mobelunique.com/products/canape-oslo"
   }
   ```
2. **Expected:** 201 with model JSON including auto-generated `slug: "canape-oslo"`, `is_active: true` by default
3. Send the same request again
4. **Expected:** 409 with `{ "error": "Un modèle avec ce slug existe déjà" }` (or similar French conflict message)

### 2. List models with image count (GET /api/admin/models)

1. After creating at least one model, send `GET /api/admin/models`
2. **Expected:** 200 with array of models, each including `model_images` nested aggregate with `count`
3. Models ordered by `created_at` desc (newest first)

### 3. Get single model with images (GET /api/admin/models/:id)

1. Using the `id` from test 1, send `GET /api/admin/models/:id`
2. **Expected:** 200 with single model object including `model_images: []` (empty array, no images uploaded yet)
3. Send `GET /api/admin/models/00000000-0000-0000-0000-000000000000`
4. **Expected:** 404 with French error message

### 4. Update a model (PUT /api/admin/models/:id)

1. Send `PUT /api/admin/models/:id` with JSON body:
   ```json
   { "name": "Canapé Oslo XL", "base_price": 1499 }
   ```
2. **Expected:** 200 with updated model, slug re-generated to `canape-oslo-xl`
3. Send `PUT /api/admin/models/:id` with invalid data (e.g. `{ "base_price": -100 }`)
4. **Expected:** 400 with Zod validation error details

### 5. Upload model image (POST /api/admin/models/:id/images)

1. Send `POST /api/admin/models/:id/images` with FormData:
   - `image`: a JPEG file under 5MB
   - `view_type`: `front`
   - `sort_order`: `0`
2. **Expected:** 201 with created image row including `image_url` pointing to `model-photos` bucket at `canape-oslo-xl/front-0.jpg`
3. Verify file exists in `model-photos` bucket via Supabase dashboard

### 6. Upload image exceeding 5MB limit

1. Send `POST /api/admin/models/:id/images` with FormData containing a file > 5MB
2. **Expected:** 400 with French error message about file size limit (e.g. "L'image ne doit pas dépasser 5 Mo")

### 7. List model images (GET /api/admin/models/:id/images)

1. After uploading at least one image, send `GET /api/admin/models/:id/images`
2. **Expected:** 200 with array of images sorted by `sort_order` asc

### 8. Update image metadata (PUT /api/admin/models/:id/images/:imageId)

1. Using the `imageId` from test 5, send `PUT /api/admin/models/:id/images/:imageId` with:
   ```json
   { "view_type": "side-left", "sort_order": 1 }
   ```
2. **Expected:** 200 with updated image row
3. Send `PUT` with empty body `{}`
4. **Expected:** 400 with error about missing fields

### 9. Delete image with storage cleanup (DELETE /api/admin/models/:id/images/:imageId)

1. Send `DELETE /api/admin/models/:id/images/:imageId`
2. **Expected:** 200 with `{ "success": true }`
3. Verify image row is gone from `model_images` table
4. Verify file removed from `model-photos` bucket

### 10. Delete model with cascade cleanup (DELETE /api/admin/models/:id)

1. Upload a new image to the model first (to test cascade)
2. Send `DELETE /api/admin/models/:id`
3. **Expected:** 200 with `{ "success": true }`
4. Verify model row gone from `models` table
5. Verify `model_images` rows cascade-deleted
6. Verify files removed from `model-photos` bucket (best-effort)

## Edge Cases

### Auth guard on all routes

1. Send any request to `/api/admin/models` without auth cookie
2. **Expected:** 401 on every route (GET, POST, PUT, DELETE)

### Missing model on image routes

1. Send `GET /api/admin/models/nonexistent-uuid/images`
2. **Expected:** 404 with French error message

### Cross-model image access

1. Create two models A and B, upload an image to A
2. Send `DELETE /api/admin/models/{B.id}/images/{A.imageId}`
3. **Expected:** 404 — the image belongs to model A, not B

### Upload without required fields

1. Send `POST /api/admin/models/:id/images` with FormData missing `view_type`
2. **Expected:** 400 with validation error about missing view_type

### Empty name on create

1. Send `POST /api/admin/models` with `{ "name": "" }`
2. **Expected:** 400 with Zod validation error

## Failure Signals

- 401 on any route when authenticated → auth middleware broken
- 500 on CRUD operations → Supabase connection or query error (check server logs for route-prefixed console.error)
- File not appearing in `model-photos` bucket after upload → storage bucket permission or path issue
- Image count always 0 in list → `model_images(count)` aggregate not working (check Supabase schema has the relationship)
- Slug conflict on first create → stale data or slugify producing empty string

## Not Proven By This UAT

- Admin UI (list page, forms, photo management) — covered by S02 and S03
- Mode classique (upload rendus sans IA) — covered by S04
- RLS enforcement (public API filtering inactive models) — covered by M001 RLS policies
- File upload progress, drag-and-drop reordering — UI concerns for S03

## Notes for Tester

- Use `curl -c cookies.txt -b cookies.txt` to maintain session across requests, or test via the browser's fetch console after logging in at `/admin/login`
- The API uses Next.js 16 async params pattern — this is transparent to the caller but worth noting for debugging
- Storage cleanup on delete is best-effort — if the bucket file is already gone, the delete still succeeds (no error thrown for missing files)
- The `model_images(count)` aggregate on GET list requires the Supabase PostgREST relationship to be defined — if the count is missing, check the Supabase table relationships
