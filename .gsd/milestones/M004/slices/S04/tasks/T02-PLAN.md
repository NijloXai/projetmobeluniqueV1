---
estimated_steps: 5
estimated_files: 2
skills_used:
  - react-best-practices
  - best-practices
---

# T02: Extend ModelForm with Mode Classique section and CSS

**Slice:** S04 — Mode Classique (upload rendus sans IA)
**Milestone:** M004

## Description

Extend the existing `ModelForm` component with a third section — "Mode Classique" — that lets the admin upload a final rendered photo by choosing a fabric, an angle (model_image), and an image file. The section fetches fabrics and existing visuals client-side on mount, renders selection controls and an upload button, displays existing visuals in a grid with delete capability, and adds all necessary CSS. This is the main user-facing deliverable of S04.

## Steps

1. **Add new imports and state to `ModelForm.tsx`:**
   - Import `Fabric` and `GeneratedVisual` types from `@/types/database`.
   - Add state variables: `fabrics: Fabric[]` (initially `[]`), `visuals: (GeneratedVisual & { fabric: Fabric })[]` (initially `[]`), `classiqueFile: File | null`, `selectedFabricId: string` (initially `''`), `selectedModelImageId: string` (initially `''`), `uploadingClassique: boolean`, `classiqueError: string | null`.

2. **Add client-side data fetching on mount (edit mode only):**
   - Add a `useEffect` that runs when `model` is truthy. Fetch `GET /api/admin/fabrics` and parse as `Fabric[]` → set `fabrics`. Fetch `GET /api/admin/models/${model.id}/visuals` and parse → set `visuals`. Both fetches are fire-and-forget with try/catch (errors silently leave empty arrays — the UI handles empty states).
   - Add a `refreshVisuals` callback (memoized with `useCallback` on `model`): fetches `GET /api/admin/models/${model.id}/visuals`, sets `visuals` state. Separate from the existing `refreshImages` callback.

3. **Add classique upload handler:**
   - `handleClassiqueUpload` function: validate that `classiqueFile`, `selectedFabricId`, and `selectedModelImageId` are all set (show classiqueError if not). Set `uploadingClassique = true`. Build FormData with `image` (classiqueFile), `fabric_id` (selectedFabricId), `model_image_id` (selectedModelImageId). POST to `/api/admin/models/${model.id}/visuals`. On success: clear file/selections, call `refreshVisuals`. On failure: set classiqueError from response. Finally: `uploadingClassique = false`.
   - `handleDeleteVisual(visualId: string)` function: `window.confirm('Supprimer ce rendu ?')` → DELETE to `/api/admin/models/${model.id}/visuals/${visualId}` → `refreshVisuals()`. Alert on error.

4. **Add Mode Classique JSX section** below the existing photo section, gated by `{isEdit && model && images.length > 0 && (...)}`:
   - Section container with `classiqueSection` CSS class.
   - Header: "Mode Classique — Rendus" with visual count badge.
   - **If `fabrics.length === 0`:** render a message "Aucun tissu disponible. Ajoutez des tissus dans la section Tissus pour utiliser le mode classique."
   - **Otherwise:** render the upload area with:
     - `<select>` for fabric (label "Tissu") populated from `fabrics` array with `fabric.name` as label and `fabric.id` as value. Default empty option "— Choisir un tissu —".
     - `<select>` for angle (label "Angle") populated from `images` array with `image.view_type` as label and `image.id` as value. Default empty option "— Choisir un angle —".
     - `ImageUpload` component with `label="Rendu"`, `name="classique"`, `maxSizeMB={5}`, `onChange={(file) => setClassiqueFile(file)}`.
     - "Publier le rendu" button calling `handleClassiqueUpload`, disabled when `uploadingClassique`.
     - `classiqueError` shown below if present.
   - **Visuals grid:** If `visuals.length > 0`, render a grid of visual cards. Each card shows: thumbnail from `visual.generated_image_url`, fabric name from `visual.fabric.name`, and a delete button. If `visuals.length === 0` and fabrics exist, show "Aucun rendu classique pour ce produit."

5. **Add CSS classes to `form.module.css`:**
   - `.classiqueSection` — mirrors `.photoSection` styling (margin-top, padding-top, border-top separator).
   - `.classiqueHeader` — flex row with title and count badge.
   - `.classiqueTitle` — same size as `.photoTitle`.
   - `.classiqueCount` — same as `.photoCount`.
   - `.classiqueUploadArea` — flex layout with gap, background, border-radius, dashed border (similar to `.photoUploadRow`).
   - `.classiqueSelects` — flex row for the two selects.
   - `.classiqueSelect` — styled `<select>` matching `.input` styling.
   - `.classiqueGrid` — mirrors `.photoGrid` responsive grid.
   - `.classiqueCard` — mirrors `.photoCard` with image, info, controls.
   - `.classiqueCardImageWrap`, `.classiqueCardImage` — same as photo card image styles.
   - `.classiqueCardInfo` — fabric name label.
   - `.publishBtn` — styled like `.addPhotoBtn`.
   - `.classiqueEmpty` — same as `.photoEmpty`.
   - `.classiqueNoFabrics` — info message style.
   - `.classiqueError` — same as `.photoError`.

## Must-Haves

- [ ] Fabrics fetched from `/api/admin/fabrics` on mount in edit mode
- [ ] Visuals fetched from `/api/admin/models/${model.id}/visuals` on mount in edit mode
- [ ] Separate `refreshVisuals` callback (does not interfere with `refreshImages`)
- [ ] Section gated by `isEdit && images.length > 0`
- [ ] Fabric `<select>` populated from fetched fabrics
- [ ] Angle `<select>` populated from existing `images` array (model_images)
- [ ] `ImageUpload` with `maxSizeMB={5}` for the classique upload
- [ ] Upload builds FormData and POSTs to `/api/admin/models/${model.id}/visuals`
- [ ] Visuals grid with thumbnail, fabric name, delete button
- [ ] Delete calls API then refreshes visuals
- [ ] Message shown when no fabrics exist
- [ ] All CSS classes defined in form.module.css

## Verification

- `npx tsc --noEmit` — zero type errors
- `grep -q 'classiqueSection' src/app/admin/\(protected\)/produits/form.module.css` — CSS class defined
- `grep -q 'classiqueGrid' src/app/admin/\(protected\)/produits/form.module.css` — grid CSS defined
- `grep -q '/api/admin/fabrics' src/app/admin/\(protected\)/produits/ModelForm.tsx` — fabrics fetch present
- `grep -q 'refreshVisuals' src/app/admin/\(protected\)/produits/ModelForm.tsx` — separate refresh callback
- `grep -q "maxSizeMB={5}" src/app/admin/\(protected\)/produits/ModelForm.tsx` — 5MB limit on classique (note: also matches existing photo upload, which is correct — both enforce 5MB)
- `grep -q 'selectedFabricId' src/app/admin/\(protected\)/produits/ModelForm.tsx` — fabric selection state
- `grep -q 'selectedModelImageId' src/app/admin/\(protected\)/produits/ModelForm.tsx` — angle selection state

## Inputs

- `src/app/admin/(protected)/produits/ModelForm.tsx` — existing form component to extend with Mode Classique section (has photo section pattern to mirror, images state, refreshImages pattern)
- `src/app/admin/(protected)/produits/form.module.css` — existing CSS module to extend with classique section styles (has photoSection/photoGrid/photoCard patterns to mirror)
- `src/components/admin/ImageUpload.tsx` — reusable upload component (accepts label, name, maxSizeMB, onChange props)
- `src/types/database.ts` — `Fabric`, `GeneratedVisual` types needed for state typing
- `src/app/api/admin/models/[id]/visuals/route.ts` — T01 output: GET+POST endpoints this task calls from the UI
- `src/app/api/admin/models/[id]/visuals/[visualId]/route.ts` — T01 output: DELETE endpoint this task calls for visual removal

## Observability Impact

- **Client-side fetch errors:** Both the fabrics and visuals fetch in the `useEffect` are silent (try/catch with empty arrays as fallback). The UI handles empty states gracefully — "Aucun tissu disponible" for missing fabrics, "Aucun rendu classique" for empty visuals. A future agent can inspect by checking the browser network tab for failed GET requests to `/api/admin/fabrics` or `/api/admin/models/:id/visuals`.
- **Upload error visibility:** The `classiqueError` state surfaces structured 400 errors from the POST endpoint (missing fields, oversized files, invalid model_image_id). 500 errors show a generic "Erreur lors de l'upload" message while the server-side `console.error` captures the underlying error with `[POST /api/admin/models/:id/visuals]` prefix.
- **Delete error visibility:** Delete failures surface via `window.alert` with the error message from the API response. Underlying errors are logged server-side with `[DELETE /api/admin/models/:id/visuals/:visualId]` prefix.
- **Inspection surfaces:** The Mode Classique section is gated by `isEdit && images.length > 0` — if it doesn't render, check that the model has at least one photo uploaded. Fabric and visual data can be verified by inspecting the state via React DevTools or by hitting the API endpoints directly.

## Expected Output

- `src/app/admin/(protected)/produits/ModelForm.tsx` — extended with Mode Classique section (fabric/angle selects, upload, visuals grid, delete, client-side data fetching)
- `src/app/admin/(protected)/produits/form.module.css` — extended with classiqueSection, classiqueGrid, classiqueCard, and related CSS classes
