---
id: S04
parent: M004
milestone: M004
provides:
  - Mode Classique admin UI and API — upload rendered visuals without AI by choosing a fabric + angle
  - Admin visuals CRUD API (GET+POST at /api/admin/models/[id]/visuals, DELETE at /api/admin/models/[id]/visuals/[visualId])
  - ModelForm "Mode Classique — Rendus" section with fabric/angle selects, 5MB upload, visuals grid with delete
requires:
  - slice: S01
    provides: Images API pattern (requireAdmin, model check, FormData, storage upload), extractStoragePath utility, GeneratedVisualInsert type
  - slice: S03
    provides: ModelForm component, ImageUpload component, form.module.css base styles
affects:
  - M005 (IA generation will insert into the same generated_visuals table with different is_validated/is_published states)
key_files:
  - src/app/api/admin/models/[id]/visuals/route.ts
  - src/app/api/admin/models/[id]/visuals/[visualId]/route.ts
  - src/app/admin/(protected)/produits/ModelForm.tsx
  - src/app/admin/(protected)/produits/form.module.css
key_decisions:
  - "D018: Storage path {slug}/{fabric_id}-{model_image_id}.{ext} in generated-visuals bucket with upsert — re-uploading same fabric+angle combo overwrites"
  - Reused photoCardControls/deletePhotoBtn CSS classes for visual card delete buttons to avoid duplication
patterns_established:
  - Visuals API mirrors the images API pattern (requireAdmin, model existence check, FormData parsing, storage upload, DB insert)
  - Mode Classique section mirrors the photo section pattern (gated by edit mode, client-side fetch on mount, refresh callback, upload handler, grid with delete)
  - Separate refreshVisuals callback independent from refreshImages — each section manages its own data lifecycle
observability_surfaces:
  - console.error with route-prefixed tags on all error paths ([GET/POST/DELETE /api/admin/models/:id/visuals])
  - classiqueError state surfaces structured 400 errors from POST endpoint in the UI
  - GET /api/admin/models/[id]/visuals returns full visual list with fabric join — useful for inspecting state
drill_down_paths:
  - .gsd/milestones/M004/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S04/tasks/T02-SUMMARY.md
duration: 14m
verification_result: passed
completed_at: 2026-03-24
---

# S04: Mode Classique (upload rendus sans IA)

**Admin can upload final rendered photos by choosing a fabric + model angle, inserting into generated_visuals with is_validated=true and is_published=true — completing M004's CRUD Produits milestone**

## What Happened

Built the "Mode Classique" feature in two tasks: API routes (T01) then UI integration (T02).

**T01** created two API route files mirroring the existing images API pattern. `GET /api/admin/models/[id]/visuals` lists generated visuals with a fabric join (`*, fabric:fabrics(*)`) ordered by `created_at desc`. `POST` accepts FormData (image, fabric_id, model_image_id), validates the 5MB file limit, verifies the `model_image_id` belongs to the target model (prevents cross-model references), uploads to the `generated-visuals` bucket at `{slug}/{fabric_id}-{model_image_id}.{ext}` with upsert, and inserts a row with `is_validated: true` and `is_published: true` hardcoded. `DELETE /api/admin/models/[id]/visuals/[visualId]` performs best-effort storage cleanup via `extractStoragePath` then deletes the DB row. All routes gated by `requireAdmin()`.

**T02** extended `ModelForm.tsx` with a complete "Mode Classique — Rendus" section below the photo section. The section is gated by `isEdit && images.length > 0` (model_image_id is required). On mount in edit mode, fetches fabrics from `/api/admin/fabrics` and visuals from `/api/admin/models/${model.id}/visuals`. The UI provides fabric and angle `<select>` dropdowns, an `ImageUpload` component with `maxSizeMB={5}`, a "Publier le rendu" button, error display, and a responsive grid of visual cards with thumbnails, fabric names, and delete buttons. Shows "Aucun tissu disponible" when no fabrics exist, and "Aucun rendu classique" when no visuals exist. Added 16 CSS classes to `form.module.css`.

## Verification

All 10 slice-level checks passed:

| # | Check | Result |
|---|-------|--------|
| 1 | `npx tsc --noEmit` — zero type errors | ✅ |
| 2 | visuals route file exists | ✅ |
| 3 | visuals delete route file exists | ✅ |
| 4 | `is_validated: true` hardcoded in POST | ✅ |
| 5 | `is_published: true` hardcoded in POST | ✅ |
| 6 | `generated-visuals` bucket referenced | ✅ |
| 7 | `classiqueSection` CSS class defined | ✅ |
| 8 | `maxSizeMB={5}` on classique upload | ✅ |
| 9 | `/api/admin/fabrics` fetched client-side | ✅ |
| 10 | `requireAdmin` used in visuals routes | ✅ |

## New Requirements Surfaced

- none

## Deviations

- none — both tasks followed their plans exactly. T02 reused existing `photoCardControls`/`deletePhotoBtn` CSS classes instead of creating duplicate identical classes, which is a minor optimization not a deviation.

## Known Limitations

- Storage path orphans: if a model slug changes after visuals are uploaded, existing files in the `generated-visuals` bucket keep the old slug path. The DB URLs remain valid but bucket contains orphans under the old slug (same behavior as model-photos, documented in K009).
- Fabric/visual fetch errors are silent (empty arrays as fallback) — inspect browser network tab for failed GETs.
- No bulk upload — visuals are added one at a time.

## Follow-ups

- none — this is the final slice of M004. All four slices are complete.

## Files Created/Modified

- `src/app/api/admin/models/[id]/visuals/route.ts` — new: GET (list visuals with fabric join) + POST (upload to generated-visuals bucket, insert with is_validated=true, is_published=true)
- `src/app/api/admin/models/[id]/visuals/[visualId]/route.ts` — new: DELETE (storage cleanup via extractStoragePath + DB row deletion)
- `src/app/admin/(protected)/produits/ModelForm.tsx` — extended with Mode Classique section: 7 new state variables, refreshVisuals callback, useEffect for fabric+visual fetch, upload/delete handlers, complete JSX for selects, upload, publish button, error display, and visuals grid
- `src/app/admin/(protected)/produits/form.module.css` — extended with 16 new CSS classes for the classique section

## Forward Intelligence

### What the next slice should know
- M004 is now complete. The `generated_visuals` table and `generated-visuals` bucket are the shared surface between mode classique (S04) and future IA generation (M005). Mode classique inserts with `is_validated=true` and `is_published=true` hardcoded. IA generation should insert with `is_validated=false` and `is_published=false`, then update after admin review.
- The admin visuals API at `/api/admin/models/[id]/visuals` already supports listing and deleting visuals regardless of how they were created (classique or IA). M005 can reuse this for displaying IA-generated visuals pending validation.

### What's fragile
- The `model_image_id` cross-model validation in POST checks that the image belongs to the target model — if model_images table structure changes, this check needs updating.
- The storage path convention `{slug}/{fabric_id}-{model_image_id}.{ext}` with upsert means re-uploading the same fabric+angle combo silently overwrites. This is intentional for classique mode but M005 should use a different path scheme (e.g. including a generation ID) to preserve generation history.

### Authoritative diagnostics
- `GET /api/admin/models/[id]/visuals` — returns the full visual list with fabric join; the single best endpoint to inspect generated_visuals state for a model
- Server console logs with `[POST /api/admin/models/:id/visuals]` and `[DELETE /api/admin/models/:id/visuals/:visualId]` prefixes — structured error context for debugging API failures

### What assumptions changed
- No assumptions changed. The implementation matched the plan exactly.
