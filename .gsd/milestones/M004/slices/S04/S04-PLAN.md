# S04: Mode Classique (upload rendus sans IA)

**Goal:** Admin can upload a final rendered photo by choosing a model angle (model_image) and a fabric → inserts into `generated_visuals` with `is_validated=true` and `is_published=true`, targeting the `generated-visuals` bucket.
**Demo:** On the edit product page `/admin/produits/[id]/edit`, a "Mode Classique" section appears below the photos section (gated by having ≥1 photo). Admin picks a fabric, an angle, uploads a photo → the visual appears in the grid below with a delete button. The visual is immediately available via the public `GET /api/models/[slug]/visuals` endpoint.

## Must-Haves

- API route `POST /api/admin/models/[id]/visuals` accepts FormData (image, fabric_id, model_image_id), uploads to `generated-visuals` bucket, inserts row with `is_validated=true` and `is_published=true`
- API route `GET /api/admin/models/[id]/visuals` returns visuals with joined fabric data
- API route `DELETE /api/admin/models/[id]/visuals/[visualId]` removes storage file + DB row
- ModelForm "Mode Classique" section with fabric select, angle select, image upload (5MB limit), and publish button
- Visuals grid displaying existing generated visuals with fabric name, angle, thumbnail, and delete button
- Section gated by edit mode AND `images.length > 0` (model_image_id is required)
- Message shown when no fabrics exist in the system

## Verification

- `cd /Users/salah/Desktop/projetmobelunique/.gsd/worktrees/M004 && npx tsc --noEmit` — zero type errors
- `test -f src/app/api/admin/models/\[id\]/visuals/route.ts` — visuals list+create route exists
- `test -f src/app/api/admin/models/\[id\]/visuals/\[visualId\]/route.ts` — visuals delete route exists
- `grep -q 'is_validated: true' src/app/api/admin/models/\[id\]/visuals/route.ts` — hardcoded validated
- `grep -q 'is_published: true' src/app/api/admin/models/\[id\]/visuals/route.ts` — hardcoded published
- `grep -q 'generated-visuals' src/app/api/admin/models/\[id\]/visuals/route.ts` — correct bucket
- `grep -q 'classiqueSection' src/app/admin/\(protected\)/produits/form.module.css` — CSS defined
- `grep -q 'maxSizeMB={5}' src/app/admin/\(protected\)/produits/ModelForm.tsx` — 5MB limit on classique upload
- `grep -q '/api/admin/fabrics' src/app/admin/\(protected\)/produits/ModelForm.tsx` — fabrics fetched client-side

## Integration Closure

- Upstream surfaces consumed: S01 images API pattern (`src/app/api/admin/models/[id]/images/route.ts`, `[imageId]/route.ts`), S03 ModelForm (`src/app/admin/(protected)/produits/ModelForm.tsx`), `ImageUpload` component, `extractStoragePath` utility, `GeneratedVisualInsert`/`Fabric` types
- New wiring introduced in this slice: admin visuals API routes, ModelForm classique section fetches fabrics + visuals client-side on mount
- What remains before the milestone is truly usable end-to-end: nothing for M004 — all 4 slices complete after S04

## Observability / Diagnostics

- **Runtime signals:** All error paths in the visuals API routes emit `console.error` with route-prefixed tags (`[GET /api/admin/models/:id/visuals]`, `[POST ...]`, `[DELETE ...]`). Storage upload errors include the upstream error message.
- **Inspection surfaces:** `GET /api/admin/models/[id]/visuals` returns the full visual list with fabric join — useful for verifying state. The `generated-visuals` Supabase bucket can be inspected directly for uploaded files.
- **Failure visibility:** POST returns structured 400 errors for missing fields, oversized files, or invalid cross-model `model_image_id` references. DELETE returns 404 for non-existent visuals. All 500s log the underlying error to server console.
- **Redaction constraints:** No secrets are logged. Storage paths include model slugs and IDs but no user PII.

## Tasks

- [x] **T01: Create admin visuals API routes (GET+POST, DELETE)** `est:20m`
  - Why: Provides the server-side CRUD surface that the Mode Classique UI will call. Without these routes, no visual can be created or deleted.
  - Files: `src/app/api/admin/models/[id]/visuals/route.ts`, `src/app/api/admin/models/[id]/visuals/[visualId]/route.ts`
  - Do: Mirror the images route pattern. GET returns visuals with fabric join (`*, fabric:fabrics(*)`), ordered by created_at desc. POST accepts FormData (image file, fabric_id, model_image_id), validates 5MB limit, uploads to `generated-visuals` bucket at `{slug}/{fabric_id}-{model_image_id}.{ext}`, inserts into generated_visuals with is_validated=true and is_published=true, returns 201. DELETE fetches the visual (filtered by model_id), extracts storage path via extractStoragePath, removes from `generated-visuals` bucket, deletes DB row. All routes gated by requireAdmin(), verify parent model exists, use console.error with route-prefixed tags.
  - Verify: `npx tsc --noEmit && test -f src/app/api/admin/models/\[id\]/visuals/route.ts && test -f src/app/api/admin/models/\[id\]/visuals/\[visualId\]/route.ts && grep -q 'is_validated: true' src/app/api/admin/models/\[id\]/visuals/route.ts`
  - Done when: Both route files exist, compile without errors, POST hardcodes is_validated=true and is_published=true, uploads target `generated-visuals` bucket

- [x] **T02: Extend ModelForm with Mode Classique section and CSS** `est:30m`
  - Why: Delivers the admin UI for uploading rendered visuals — the core feature of this slice. Without this, the API routes are usable only via curl.
  - Files: `src/app/admin/(protected)/produits/ModelForm.tsx`, `src/app/admin/(protected)/produits/form.module.css`
  - Do: Add client-side state for visuals array, fabrics array, classique upload fields (selectedFabricId, selectedModelImageId, classiqueFile). On mount in edit mode, fetch fabrics from `/api/admin/fabrics` and visuals from `/api/admin/models/${model.id}/visuals`. Add refreshVisuals callback (separate from refreshImages). Render "Mode Classique" section below photos section, gated by `isEdit && images.length > 0`. Section contains: fabric `<select>` dropdown, angle `<select>` dropdown (populated from images array with view_type labels), ImageUpload with maxSizeMB={5}, "Publier le rendu" button. On publish: build FormData with image, fabric_id, model_image_id → POST to visuals endpoint → refreshVisuals. Show message if no fabrics exist. Render visuals grid with cards showing thumbnail, fabric name, view_type from the joined model_image, and delete button. Delete uses window.confirm then DELETEs via API. Add all CSS classes for the classique section to form.module.css.
  - Verify: `npx tsc --noEmit && grep -q 'classiqueSection' src/app/admin/\(protected\)/produits/form.module.css && grep -q '/api/admin/fabrics' src/app/admin/\(protected\)/produits/ModelForm.tsx`
  - Done when: Mode Classique section renders in edit mode when photos exist, fabric/angle selects populated, upload works via API, visuals grid displays with delete, all CSS defined, zero type errors

## Files Likely Touched

- `src/app/api/admin/models/[id]/visuals/route.ts` (new)
- `src/app/api/admin/models/[id]/visuals/[visualId]/route.ts` (new)
- `src/app/admin/(protected)/produits/ModelForm.tsx` (modified)
- `src/app/admin/(protected)/produits/form.module.css` (modified)
