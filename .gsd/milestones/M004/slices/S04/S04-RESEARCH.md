# S04 — Research

**Date:** 2026-03-24

## Summary

S04 "Mode Classique" adds the ability for the admin to upload a final rendered photo by choosing an angle (model_image) and a fabric → inserts into `generated_visuals` with `is_validated=true` and `is_published=true`. The photo goes to the `generated-visuals` bucket (already exists, public).

This is straightforward work. All patterns are established: the API route mirrors the image upload pattern from S01, the UI section mirrors the photo management section from S03, and the fabric selection mirrors the category combobox from FabricForm. The `generated_visuals` table, types (`GeneratedVisualInsert`, `ModelWithImagesAndVisuals`), and the public visuals API already exist. The only net-new work is: one API route pair (GET+POST, DELETE), extending ModelForm with a third section, and updating the edit page to pass fabrics and visuals data.

## Recommendation

Build in three tasks: (1) API routes for generated_visuals CRUD under `/api/admin/models/[id]/visuals`, (2) extend ModelForm with the "Mode Classique" section + CSS, (3) update the edit page to fetch and pass fabrics + visuals. Tasks 1 and 3 are small; task 2 is the main work.

## Implementation Landscape

### Key Files

- `src/types/database.ts` — Already has `GeneratedVisual`, `GeneratedVisualInsert`, `ModelWithImagesAndVisuals`. No changes needed.
- `src/app/api/admin/models/[id]/images/route.ts` — Pattern to copy for the visuals API route.
- `src/app/api/admin/models/[id]/images/[imageId]/route.ts` — Pattern to copy for DELETE visual.
- `src/app/admin/(protected)/produits/ModelForm.tsx` — Main file to extend with Mode Classique section.
- `src/app/admin/(protected)/produits/form.module.css` — Add styles for classique section.
- `src/lib/utils.ts` — `extractStoragePath` already shared.
- `src/components/admin/ImageUpload.tsx` — Reused as-is.

### Build Order

1. API routes first — `visuals/route.ts` (GET+POST) and `visuals/[visualId]/route.ts` (DELETE)
2. ModelForm "Mode Classique" section — extend with fabric/angle selects, upload, visuals grid
3. No edit page changes needed — ModelForm handles data fetching client-side

### Verification Approach

1. `npx tsc --noEmit` — zero type errors
2. Route files exist
3. `is_validated: true` and `is_published: true` hardcoded in POST
4. Upload targets `generated-visuals` bucket
5. Classique section gated by edit mode

## Constraints

- `model_image_id` required — gate section on `images.length > 0`
- `fabric_id` required — show message if no fabrics exist
- `generated-visuals` bucket is public — use `getPublicUrl`
- K002: is_validated=true and is_published=true for mode classique

## Common Pitfalls

- **refreshImages vs refreshVisuals** — Need separate refresh callback
- **Fabric list stale** — Fetched once on mount, acceptable for MVP