---
id: T02
parent: S04
milestone: M004
provides:
  - Mode Classique UI section in ModelForm (fabric/angle selects, upload, visuals grid with delete)
key_files:
  - src/app/admin/(protected)/produits/ModelForm.tsx
  - src/app/admin/(protected)/produits/form.module.css
key_decisions:
  - Reused photoCardControls and deletePhotoBtn CSS classes for visual card delete buttons to avoid duplicating identical styles
patterns_established:
  - Mode Classique section mirrors the photo section pattern (gated by edit mode, client-side fetch on mount, refresh callback, upload handler, grid with delete)
observability_surfaces:
  - classiqueError state surfaces structured 400 errors from POST endpoint (missing fields, oversized files, invalid model_image_id)
  - Delete failures surface via window.alert with API error message
  - Fabric/visual fetch errors are silent (empty arrays as fallback) — inspect browser network tab for failed GETs
duration: 6m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T02: Extend ModelForm with Mode Classique section and CSS

**Added Mode Classique section to ModelForm with fabric/angle selects, image upload (5MB), visuals grid with delete, and full CSS — completing the admin UI for uploading rendered visuals without AI**

## What Happened

Extended `ModelForm.tsx` with a complete "Mode Classique — Rendus" section below the existing photo section. The section is gated by `isEdit && images.length > 0` — it only renders in edit mode when the model has at least one photo (since `model_image_id` is required for visuals).

Added seven new state variables for the classique workflow: `fabrics`, `visuals`, `classiqueFile`, `selectedFabricId`, `selectedModelImageId`, `uploadingClassique`, and `classiqueError`. A `useEffect` fetches fabrics from `/api/admin/fabrics` and visuals from `/api/admin/models/${model.id}/visuals` on mount in edit mode. A separate `refreshVisuals` callback (memoized with `useCallback` on `model`) re-fetches visuals after upload or delete — independent from the existing `refreshImages` callback.

The upload handler validates all three fields are set, builds a FormData with `image`, `fabric_id`, and `model_image_id`, POSTs to the visuals API, and on success clears selections and refreshes. The delete handler uses `window.confirm` then DELETE to the visuals API followed by refresh.

The JSX renders: a header with visual count badge, fabric `<select>` populated from fetched fabrics, angle `<select>` populated from existing model images, an `ImageUpload` component with `maxSizeMB={5}`, a "Publier le rendu" button, an error display, and a responsive grid of visual cards with thumbnails, fabric names, and delete buttons. Shows "Aucun tissu disponible" when no fabrics exist, and "Aucun rendu classique" when no visuals exist.

Added 16 CSS classes to `form.module.css` mirroring the photo section styling: `classiqueSection`, `classiqueHeader`, `classiqueTitle`, `classiqueCount`, `classiqueUploadArea`, `classiqueSelects`, `classiqueSelect`, `publishBtn`, `classiqueError`, `classiqueGrid`, `classiqueCard`, `classiqueCardImageWrap`, `classiqueCardImage`, `classiqueCardInfo`, `classiqueEmpty`, and `classiqueNoFabrics`.

## Verification

All 13 checks passed — 8 task-level grep checks, 4 slice-level grep/file checks from T01, and `npx tsc --noEmit` with zero type errors. This is the final task of S04; all 9 slice-level verification checks pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 14.6s |
| 2 | `grep -q 'classiqueSection' src/app/admin/(protected)/produits/form.module.css` | 0 | ✅ pass | <1s |
| 3 | `grep -q 'classiqueGrid' src/app/admin/(protected)/produits/form.module.css` | 0 | ✅ pass | <1s |
| 4 | `grep -q '/api/admin/fabrics' src/app/admin/(protected)/produits/ModelForm.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q 'refreshVisuals' src/app/admin/(protected)/produits/ModelForm.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q 'maxSizeMB={5}' src/app/admin/(protected)/produits/ModelForm.tsx` | 0 | ✅ pass | <1s |
| 7 | `grep -q 'selectedFabricId' src/app/admin/(protected)/produits/ModelForm.tsx` | 0 | ✅ pass | <1s |
| 8 | `grep -q 'selectedModelImageId' src/app/admin/(protected)/produits/ModelForm.tsx` | 0 | ✅ pass | <1s |
| 9 | `test -f src/app/api/admin/models/[id]/visuals/route.ts` | 0 | ✅ pass | <1s |
| 10 | `test -f src/app/api/admin/models/[id]/visuals/[visualId]/route.ts` | 0 | ✅ pass | <1s |
| 11 | `grep -q 'is_validated: true' src/app/api/admin/models/[id]/visuals/route.ts` | 0 | ✅ pass | <1s |
| 12 | `grep -q 'is_published: true' src/app/api/admin/models/[id]/visuals/route.ts` | 0 | ✅ pass | <1s |
| 13 | `grep -q 'generated-visuals' src/app/api/admin/models/[id]/visuals/route.ts` | 0 | ✅ pass | <1s |

## Diagnostics

- **Mode Classique section visibility:** The section is gated by `isEdit && images.length > 0`. If it doesn't render, verify the model has at least one uploaded photo.
- **Fabric fetch:** On mount, fetches from `/api/admin/fabrics`. If no fabrics appear, check the browser network tab for a failed GET or verify fabrics exist in the database.
- **Visuals fetch:** On mount and after upload/delete, fetches from `/api/admin/models/:id/visuals`. Inspect this endpoint directly to verify visual state.
- **Upload errors:** `classiqueError` state shows structured 400 errors from the POST endpoint. Server-side errors logged with `[POST /api/admin/models/:id/visuals]` prefix.
- **Delete errors:** Shown via `window.alert`. Server-side errors logged with `[DELETE /api/admin/models/:id/visuals/:visualId]` prefix.

## Deviations

- Reused existing `photoCardControls` and `deletePhotoBtn` CSS classes for the visual card delete button controls instead of creating duplicate identical classes — the styles are the same and this avoids CSS bloat.

## Known Issues

None.

## Files Created/Modified

- `src/app/admin/(protected)/produits/ModelForm.tsx` — extended with Mode Classique section: imports for Fabric/GeneratedVisual types, 7 new state variables, refreshVisuals callback, useEffect for fabric+visual fetch, handleClassiqueUpload/handleDeleteVisual handlers, complete JSX for fabric/angle selects, ImageUpload, publish button, error display, and visuals grid with delete
- `src/app/admin/(protected)/produits/form.module.css` — extended with 16 new CSS classes: classiqueSection, classiqueHeader, classiqueTitle, classiqueCount, classiqueUploadArea, classiqueSelects, classiqueSelect, publishBtn, classiqueError, classiqueGrid, classiqueCard, classiqueCardImageWrap, classiqueCardImage, classiqueCardInfo, classiqueEmpty, classiqueNoFabrics
- `.gsd/milestones/M004/slices/S04/tasks/T02-PLAN.md` — added Observability Impact section
