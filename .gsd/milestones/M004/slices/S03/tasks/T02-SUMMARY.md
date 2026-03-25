---
id: T02
parent: S03
milestone: M004
provides:
  - Photo management section in ModelForm: upload with 5MB limit, grid display, reorder via sort_order swap, delete with confirmation
  - Full CSS styles for photo section: upload row, responsive grid, photo cards with controls
key_files:
  - src/app/admin/(protected)/produits/ModelForm.tsx
  - src/app/admin/(protected)/produits/form.module.css
key_decisions:
  - Used inline photoError state for upload validation instead of a separate toast/notification system — consistent with serverError pattern in the info section
patterns_established:
  - Photo mutations (upload/reorder/delete) always re-fetch the full image list via GET after success to ensure state consistency with server
  - ImageUpload onChange sets a File state variable; actual upload is triggered by a separate button click (two-step pattern allows view_type input before submit)
observability_surfaces:
  - photoError state renders inline error below upload area when upload/reorder fails
  - uploadingPhoto boolean shows "Upload en cours..." on add button during request flight
  - reorderingId disables move buttons on the image being reordered to prevent double-clicks
  - Network tab shows FormData POST for uploads, JSON PUT for reorder, DELETE for removal
duration: 10m
verification_result: passed
completed_at: 2026-03-24T02:30:00+01:00
blocker_discovered: false
---

# T02: Add photo management section to ModelForm

**Added multi-angle photo management to ModelForm with upload (5MB limit via ImageUpload), responsive grid display, sort_order swap reordering, and delete with confirmation**

## What Happened

Extended ModelForm.tsx with the complete photo management section, gated by `isEdit && model` so it only renders in edit mode:

1. **State management:** Added `images` (initialized from `model.model_images`), `uploadingPhoto`, `newViewType`, `newPhotoFile`, `reorderingId`, and `photoError` state variables. Added `refreshImages` callback that re-fetches via GET `/api/admin/models/:id/images` after every mutation.

2. **Upload handler:** `handlePhotoUpload` validates file and view_type presence, builds FormData with `image`, `view_type`, and `sort_order` (computed as `images.length` to append at end), POSTs to the image API, clears inputs on success, and shows inline error on failure.

3. **Reorder handlers:** `handleMoveUp` and `handleMoveDown` swap `sort_order` between adjacent images using `Promise.all` of two PUTs, then re-fetch. Up disabled on first item, down disabled on last, both disabled while reordering is in flight.

4. **Delete handler:** `handleDeletePhoto` uses `window.confirm` for confirmation, DELETEs the image, and re-fetches the list on success.

5. **JSX section:** Photo header with image count, upload area (ImageUpload with `maxSizeMB={5}` + view_type text input + add button), empty state message, and responsive CSS grid of photo cards (thumbnail, view_type label, sort_order number, up/down/delete buttons).

6. **CSS module:** Replaced empty stubs with full styles: `.photoSection` (border-top separator), `.photoHeader`, `.photoUploadRow` (flex layout with dashed border), `.photoGrid` (auto-fill minmax grid), `.photoCard` (border, border-radius, hover shadow), `.photoCardImage` (4:3 aspect-ratio, object-fit cover), `.photoCardInfo`, `.photoCardControls`, `.moveBtn` / `.deletePhotoBtn` (small icon buttons with hover states).

## Verification

All task-level and slice-level verification checks pass:

- `npx tsc --noEmit` — zero type errors (exit 0)
- `maxSizeMB={5}` present in ModelForm
- `ImageUpload` component imported and used
- `/images` API endpoints called in all handlers
- `sort_order` used in upload and reorder logic
- `photoSection`, `photoGrid`, `photoCard` CSS classes defined with real styles
- All 4 slice files exist, slugify and zodResolver still wired

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 4.8s |
| 2 | `grep -q "maxSizeMB={5}" ModelForm.tsx` | 0 | ✅ pass | <1s |
| 3 | `grep -q "ImageUpload" ModelForm.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "/images" ModelForm.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "sort_order" ModelForm.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q "photoSection\|photoGrid\|photoCard" form.module.css` | 0 | ✅ pass | <1s |
| 7 | `grep -q "slugify" ModelForm.tsx` | 0 | ✅ pass | <1s |
| 8 | `grep -q "zodResolver" ModelForm.tsx` | 0 | ✅ pass | <1s |
| 9 | `test -f .../produits/new/page.tsx` | 0 | ✅ pass | <1s |
| 10 | `test -f .../produits/[id]/edit/page.tsx` | 0 | ✅ pass | <1s |
| 11 | `test -f .../produits/ModelForm.tsx` | 0 | ✅ pass | <1s |

## Diagnostics

- **Photo error banner:** When upload fails, inspect the `.photoError` element below the upload row for the error message.
- **Upload state:** React DevTools → ModelForm → inspect `uploadingPhoto`, `newPhotoFile`, `newViewType`, `photoError` state.
- **Image list:** React DevTools → ModelForm → inspect `images` state array to see current photo list with sort_order values.
- **Network tab:** FormData POST to `/api/admin/models/:id/images` for uploads, JSON PUT to `/api/admin/models/:id/images/:imageId` for reorder, DELETE for removal. GET to same path for re-fetches after mutations.
- **Reorder in flight:** The `reorderingId` state shows which image is currently being reordered — its arrow buttons will be disabled.

## Deviations

None — implementation follows the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/app/admin/(protected)/produits/ModelForm.tsx` — Extended with photo state management, upload/reorder/delete handlers, and full photo section JSX with ImageUpload, grid display, and action buttons
- `src/app/admin/(protected)/produits/form.module.css` — Replaced empty photo stubs with full styles for photoSection, photoUploadRow, photoGrid, photoCard, photoCardControls, moveBtn, deletePhotoBtn
- `.gsd/milestones/M004/slices/S03/tasks/T02-PLAN.md` — Added Observability Impact section
