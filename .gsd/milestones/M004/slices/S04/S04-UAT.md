# S04: Mode Classique (upload rendus sans IA) — UAT

**Milestone:** M004
**Written:** 2026-03-24

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: All API routes and UI components are verified via TypeScript compilation and structural grep checks. The feature involves standard CRUD operations (FormData upload, Supabase Storage insert, DB row creation/deletion) following established patterns from S01/S03. No novel runtime behavior requires live testing beyond what the artifact checks prove.

## Preconditions

- Dev server running (`npm run dev`) with Supabase connected
- At least one admin user authenticated at `/admin`
- At least one fabric exists in the system (created via `/admin/tissus/new`)
- At least one model (canapé) exists with at least one uploaded photo (created via `/admin/produits/new` → add info → save → edit → upload photo)

## Smoke Test

Navigate to `/admin/produits/[id]/edit` for a model that has at least one photo. Below the "Photos" section, a "Mode Classique — Rendus" section should appear with fabric and angle dropdowns.

## Test Cases

### 1. Mode Classique section visibility gating

1. Create a new model via `/admin/produits/new` — fill info fields and save
2. Click "Modifier" to go to the edit page
3. **Expected:** The "Mode Classique — Rendus" section does NOT appear (no photos uploaded yet)
4. Upload at least one photo in the "Photos" section
5. **Expected:** The "Mode Classique — Rendus" section now appears with fabric dropdown, angle dropdown, upload area, and "Publier le rendu" button

### 2. Upload a rendered visual (mode classique)

1. On the edit page with photos, go to the "Mode Classique — Rendus" section
2. Select a fabric from the dropdown
3. Select an angle (view type) from the dropdown — options should match the model's uploaded photos
4. Upload an image file (< 5MB) via the upload area
5. Click "Publier le rendu"
6. **Expected:** The visual appears in the grid below with the fabric name, angle label, and a thumbnail. The upload fields reset. The visual count badge updates.
7. Verify in Supabase: `generated_visuals` table has a new row with `is_validated=true` and `is_published=true`. The `generated-visuals` bucket has the file at `{slug}/{fabric_id}-{model_image_id}.{ext}`.

### 3. Delete a rendered visual

1. In the visuals grid, click the delete button on a visual card
2. A `window.confirm` dialog appears asking for confirmation
3. Click "OK"
4. **Expected:** The visual disappears from the grid. The count badge updates. The file is removed from the `generated-visuals` bucket. The DB row is deleted.

### 4. Visual appears in public API

1. After uploading a visual in test case 2, call `GET /api/models/{slug}/visuals`
2. **Expected:** The uploaded visual appears in the response (because `is_validated=true` and `is_published=true` and the parent model `is_active=true` and the fabric `is_active=true`)

### 5. Re-upload overwrites existing visual for same fabric+angle combo

1. Upload a visual with fabric A and angle B
2. Upload a different image with the same fabric A and angle B
3. **Expected:** The storage file is overwritten (upsert). The DB row is updated or a new row is created (depending on unique constraint). No error is thrown.

### 6. Fabric and angle dropdowns populated correctly

1. On the edit page, check the fabric dropdown
2. **Expected:** All active fabrics from the system appear (fetched from `/api/admin/fabrics`)
3. Check the angle dropdown
4. **Expected:** Options match the model's uploaded photos — each option shows the view_type label (e.g., "Face", "Profil gauche")

## Edge Cases

### No fabrics in the system

1. Delete all fabrics from the system (or start with a fresh DB)
2. Navigate to a model edit page with photos
3. **Expected:** The Mode Classique section shows "Aucun tissu disponible" message instead of the upload form

### No visuals uploaded yet

1. Navigate to a model edit page with photos but no visuals
2. **Expected:** The visuals grid shows "Aucun rendu classique" placeholder

### File exceeds 5MB limit

1. Try to upload a file larger than 5MB in the classique upload
2. **Expected:** The `ImageUpload` component rejects the file before it reaches the server (client-side validation via `maxSizeMB={5}`)

### Missing required fields

1. Try to click "Publier le rendu" without selecting a fabric, or without selecting an angle, or without uploading a file
2. **Expected:** An error message appears. No API call is made.

### Cross-model image reference (API-level)

1. Via curl/fetch, POST to `/api/admin/models/{id}/visuals` with a `model_image_id` that belongs to a different model
2. **Expected:** 400 error — the API validates that the `model_image_id` belongs to the target model

## Failure Signals

- Mode Classique section doesn't appear on edit page → check that `images.length > 0` (model needs at least one photo)
- Fabric dropdown is empty → check browser network tab for failed `GET /api/admin/fabrics`; verify fabrics exist in DB
- Upload succeeds but visual doesn't appear in grid → check `refreshVisuals` is called after upload; inspect `GET /api/admin/models/:id/visuals` response
- Upload fails with 500 → check server console for `[POST /api/admin/models/:id/visuals]` error log; inspect Supabase Storage bucket permissions
- Delete fails → check server console for `[DELETE /api/admin/models/:id/visuals/:visualId]` error log
- Visual not in public API → verify `is_validated=true`, `is_published=true`, parent model `is_active=true`, fabric `is_active=true`

## Not Proven By This UAT

- IA generation flow (M005) — this UAT only covers manual upload (mode classique)
- Concurrent admin sessions editing the same model's visuals
- Storage cleanup when a model is deleted entirely (orphan visuals in bucket)
- Performance with a large number of visuals per model (hundreds+)

## Notes for Tester

- The Mode Classique section only appears when editing an existing model that has at least one photo. You cannot see it on the "new" form or on a model with no photos.
- The `generated-visuals` bucket must exist in Supabase Storage with public read access (created in M001/S04).
- If testing with a fresh environment, create a fabric first (`/admin/tissus/new`) before testing the Mode Classique upload.
