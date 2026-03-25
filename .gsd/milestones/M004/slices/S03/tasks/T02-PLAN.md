---
estimated_steps: 5
estimated_files: 2
skills_used:
  - react-best-practices
  - frontend-design
---

# T02: Add photo management section to ModelForm

**Slice:** S03 — Formulaire Produit + Photos Multi-Angles
**Milestone:** M004

## Description

Add the multi-angle photo management section to ModelForm, visible only in edit mode (when `model` prop is provided). This section displays existing photos as cards, allows uploading new photos with a view_type label, reordering via up/down arrow buttons, and deleting individual photos. It uses the existing `ImageUpload` component for file selection with a 5MB client-side limit (R015), and calls the S01 image API routes for all CRUD operations.

## Steps

1. **Add state management for images** — In `ModelForm.tsx`, add state: `const [images, setImages] = useState<ModelImage[]>(model?.model_images ?? [])`. Also add state for: `uploadingPhoto` (boolean), `newViewType` (string), `newPhotoFile` (File | null), `reorderingId` (string | null to track which image is being reordered). Import `ModelImage` from `@/types/database` and `ImageUpload` from `@/components/admin/ImageUpload`.

2. **Build the photo upload handler** — Create `handlePhotoUpload` async function that:
   - Validates `newPhotoFile` and `newViewType` are set (show inline error if not)
   - Builds FormData with `image` (file), `view_type` (trimmed string), `sort_order` (computed as `images.length` — appends at end)
   - POSTs to `/api/admin/models/${model.id}/images`
   - On success: re-fetches image list via GET `/api/admin/models/${model.id}/images`, updates state, clears the upload inputs
   - On error: shows error message
   - Sets `uploadingPhoto` during the operation

3. **Build reorder handlers** — Create `handleMoveUp(index)` and `handleMoveDown(index)` functions that:
   - Get the two adjacent images to swap (current + neighbor)
   - Use `Promise.all` to PUT both images' `sort_order` swapped: `PUT /api/admin/models/${model.id}/images/${imageA.id}` with `{ sort_order: imageB.sort_order }` and vice versa
   - On success: re-fetch the full image list via GET to ensure consistency, update state
   - Disable the move button while the operation is in progress (`reorderingId` state)
   - Up button disabled on first item, Down button disabled on last item

4. **Build delete handler** — Create `handleDeletePhoto(imageId)` that:
   - Uses `window.confirm('Supprimer cette photo ?')` for inline confirmation (simple, matches project style)
   - DELETEs `/api/admin/models/${model.id}/images/${imageId}`
   - On success: re-fetch image list, update state
   - On error: show alert with error message

5. **Render the photo section JSX** — Below the info form section, add a section gated by `{isEdit && model && (...)}`:
   - Section header: `<h2>Photos du produit</h2>` with subtitle showing image count
   - **Upload area:** Use `ImageUpload` component with `maxSizeMB={5}`, `label="Photo"`, `name="photo"`, `onChange` sets `newPhotoFile`. Next to it, a text input for `view_type` (placeholder: "face, profil, dos, 3/4...") bound to `newViewType`. An "Ajouter la photo" button triggers `handlePhotoUpload`. Disable button while uploading.
   - **Photo grid:** Map over `images` to render cards in a CSS grid. Each card has: `<img>` thumbnail (from `image_url`), `view_type` label, `sort_order` number, up arrow button (↑), down arrow button (↓), delete button (🗑). Up disabled on index 0, Down disabled on last index. All buttons disabled while `reorderingId` matches.
   - **Empty state:** If `images.length === 0`, show "Aucune photo. Ajoutez des photos du produit."
   - Update `form.module.css` with full styles for: `.photoSection` (margin-top, border-top separator), `.photoUploadRow` (flex row for ImageUpload + view_type + button), `.photoGrid` (CSS grid, 2-3 columns responsive), `.photoCard` (border, border-radius, overflow hidden), `.photoCardImage` (aspect-ratio, object-fit cover), `.photoCardInfo` (padding, view_type + sort_order display), `.photoCardControls` (flex row with icon buttons), `.moveBtn` / `.deletePhotoBtn` (small icon buttons with hover states).

## Must-Haves

- [ ] Photo section renders only in edit mode (when `model` prop exists)
- [ ] `ImageUpload` used with `maxSizeMB={5}` for client-side 5MB limit (R015)
- [ ] Upload sends FormData to `POST /api/admin/models/:id/images` with auto-computed `sort_order`
- [ ] Reorder uses `PUT /api/admin/models/:id/images/:imageId` to swap `sort_order` between adjacent images
- [ ] Delete calls `DELETE /api/admin/models/:id/images/:imageId` with confirmation
- [ ] Photo grid shows thumbnail, view_type, sort_order, and action buttons per image
- [ ] `view_type` input is free-text (not a select — K001 pattern applied to images)
- [ ] `npx tsc --noEmit` passes with zero errors

## Verification

- `npx tsc --noEmit` — zero type errors
- `grep -q "maxSizeMB={5}" src/app/admin/\(protected\)/produits/ModelForm.tsx` — 5MB limit enforced
- `grep -q "ImageUpload" src/app/admin/\(protected\)/produits/ModelForm.tsx` — ImageUpload component used
- `grep -q "/images" src/app/admin/\(protected\)/produits/ModelForm.tsx` — image API endpoints called
- `grep -q "sort_order" src/app/admin/\(protected\)/produits/ModelForm.tsx` — reorder logic present
- `grep -q "photoSection\|photoGrid\|photoCard" src/app/admin/\(protected\)/produits/form.module.css` — photo CSS classes exist

## Inputs

- `src/app/admin/(protected)/produits/ModelForm.tsx` — T01 output: form component to extend with photo section
- `src/app/admin/(protected)/produits/form.module.css` — T01 output: CSS module to extend with photo styles
- `src/components/admin/ImageUpload.tsx` — existing component to reuse for file upload with preview and size validation
- `src/types/database.ts` — `ModelImage` type for image state management

## Expected Output

- `src/app/admin/(protected)/produits/ModelForm.tsx` — extended with photo management section: upload, grid display, reorder, delete
- `src/app/admin/(protected)/produits/form.module.css` — extended with photo section styles: photoSection, photoUploadRow, photoGrid, photoCard, photoCardControls

## Observability Impact

- **New signals:** `photoError` state renders an inline error message in the photo upload area when upload/reorder/delete API calls fail. `uploadingPhoto` boolean disables the "Ajouter la photo" button and shows loading state during upload. `reorderingId` disables arrow buttons on the image being reordered.
- **Inspection surfaces:** Browser Network tab shows FormData POST to `/api/admin/models/:id/images` for uploads, JSON PUT for reorder, DELETE for removal. Image list re-fetched via GET after each mutation — verify freshness in Network tab. React DevTools: inspect `images`, `uploadingPhoto`, `reorderingId`, `photoError` state values.
- **Failure visibility:** Upload validation errors (missing file, missing view_type) shown inline via `photoError`. API errors (4xx/5xx) from upload/reorder/delete surface as inline error or `window.alert`. Network failures show generic connection error.
- **How to verify this task:** After upload, the photo grid should show the new image card with thumbnail, view_type label, and sort_order. After reorder, images should swap positions (re-fetch confirms). After delete, the image card disappears from the grid.
