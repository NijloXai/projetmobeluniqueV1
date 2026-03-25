---
id: S03
parent: M004
milestone: M004
provides:
  - ModelForm client component with 7 info fields, auto-slug, zod validation, and JSON create/edit flows
  - Multi-angle photo management section: upload (5MB limit), responsive grid display, sort_order swap reorder, delete with confirmation
  - Route pages /admin/produits/new (create) and /admin/produits/[id]/edit (edit with images)
  - CSS module with full info form and photo section styles
requires:
  - slice: S01
    provides: CRUD API routes (/api/admin/models POST/PUT, /api/admin/models/[id] GET, /api/admin/models/[id]/images GET/POST/PUT/DELETE), ImageUpload component, slugify util, createModelSchema zod schema, Model/ModelImage/ModelWithImages types
affects:
  - S04
key_files:
  - src/app/admin/(protected)/produits/ModelForm.tsx
  - src/app/admin/(protected)/produits/form.module.css
  - src/app/admin/(protected)/produits/new/page.tsx
  - src/app/admin/(protected)/produits/[id]/edit/page.tsx
key_decisions:
  - Used z.number().positive() with valueAsNumber register option instead of z.coerce.number() — Zod v4 coerce infers unknown which breaks react-hook-form resolver type (K011)
  - ModelForm info section uses JSON body (not FormData) — photos handled separately in dedicated section
  - Photo mutations always re-fetch full image list via GET to ensure state consistency with server
patterns_established:
  - ModelForm mirrors FabricForm pattern but splits info (JSON) from photo management (FormData) into separate sections
  - Two-step upload pattern: ImageUpload onChange sets File state, separate button triggers actual upload after view_type input
  - Photo reorder via sort_order swap between adjacent items using Promise.all of two PUTs
  - Edit page server component fetches model with model_images(*), sorts by sort_order, passes typed ModelWithImages to client form
observability_surfaces:
  - serverError state renders visible error banner at form top on API/network failures
  - photoError state renders inline error below upload area on upload/reorder failures
  - Submit button shows "Enregistrement..." during request flight
  - uploadingPhoto boolean shows "Upload en cours..." on add button
  - reorderingId disables move buttons on image being reordered to prevent double-clicks
  - Zod field-level validation errors shown inline per field
drill_down_paths:
  - .gsd/milestones/M004/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S03/tasks/T02-SUMMARY.md
duration: 25m
verification_result: passed
completed_at: 2026-03-24T02:35:00+01:00
---

# S03: Formulaire Produit + Photos Multi-Angles

**Complete product form with 7 info fields (auto-slug, zod validation, JSON submit) and multi-angle photo management (upload with 5MB limit, grid display, sort_order reorder, delete with confirmation) at /admin/produits/new and /admin/produits/[id]/edit**

## What Happened

Two tasks delivered the full product form, mirroring the FabricForm pattern from M003 but extended with a photo management section.

**T01 — Info section + route pages + CSS (15m):** Created ModelForm.tsx as a client component with react-hook-form + zodResolver, 7 fields (name, slug, description, price, dimensions, shopify_url, is_active), auto-slug via useEffect + slugify() with manual override flag. Create flow POSTs JSON to `/api/admin/models` and redirects to edit page. Edit flow PUTs JSON and redirects to list. Created new/page.tsx (minimal server component) and [id]/edit/page.tsx (server component fetching model with images, sorting by sort_order, 404 handling). CSS module copied from tissus/form.module.css with additions for textarea, URL input, price row layout, and photo section stubs. Hit the Zod v4 coerce type issue (K011) — resolved with valueAsNumber pattern.

**T02 — Photo management section (10m):** Extended ModelForm with the photo section, gated by edit mode. Added state for images array, upload/reorder/delete handlers. Upload builds FormData with image, view_type, and auto-computed sort_order, POSTs to the images API endpoint. Reorder swaps sort_order between adjacent images via Promise.all of two PUTs. Delete uses window.confirm then DELETEs the image. All mutations re-fetch the full image list via GET for state consistency. JSX renders upload area (ImageUpload with maxSizeMB={5} + view_type text input + add button), empty state message, and responsive CSS grid of photo cards with thumbnail, view_type label, sort_order, up/down/delete buttons. Replaced CSS stubs with full photo styles.

## Verification

All 9 slice-level checks pass:

| # | Check | Result |
|---|-------|--------|
| 1 | `npx tsc --noEmit` — zero type errors | ✅ pass |
| 2 | `new/page.tsx` exists | ✅ pass |
| 3 | `[id]/edit/page.tsx` exists | ✅ pass |
| 4 | `ModelForm.tsx` exists | ✅ pass |
| 5 | `form.module.css` exists | ✅ pass |
| 6 | `slugify` wired in ModelForm | ✅ pass |
| 7 | `zodResolver` wired in ModelForm | ✅ pass |
| 8 | `maxSizeMB={5}` enforced client-side | ✅ pass |
| 9 | `photoSection/photoGrid/photoCard` CSS defined | ✅ pass |

## Requirements Advanced

- **R007** — Admin can now create and edit products via form UI (was API-only after S01). Info section delivers name, slug, description, price, dimensions, shopify_url, is_active. Photo section delivers multi-angle upload, view labeling, reorder, and delete. Two of three M004 success criteria now met (create product + upload multi-angles with reorder).
- **R015** — Upload with 5MB client-side limit enforced via ImageUpload maxSizeMB={5} for product photos. Preview handled by ImageUpload component from M003.

## New Requirements Surfaced

- none

## Deviations

- **Zod schema:** Used `z.number().positive()` + `valueAsNumber: true` register option instead of `z.coerce.number()` as the plan implied. Already documented as K011. No functional impact — the standard react-hook-form pattern for numeric inputs.

## Known Limitations

- Photo section only appears in edit mode — admin must create the product first, then add photos on the edit page. This is by design (needs the model ID to upload to the correct API path).
- Reorder uses up/down arrows, not drag-and-drop. The plan specified arrows; drag-and-drop deferred to a future UX enhancement if needed.
- No bulk photo upload — photos are added one at a time with a view_type label per image.
- Storage path uses `{slug}/{view_type}-{sort_order}.{ext}` — slug renames leave orphan files (documented in K009).

## Follow-ups

- S04 (Mode Classique) builds on this form to add rendered visual uploads with fabric selection — the ModelForm's photo section provides the pattern.

## Files Created/Modified

- `src/app/admin/(protected)/produits/ModelForm.tsx` — Client component with 7 info fields, react-hook-form + zod, auto-slug, JSON create/edit handlers, photo management section (upload/reorder/delete)
- `src/app/admin/(protected)/produits/form.module.css` — CSS module with info form styles and full photo section styles (grid, cards, controls, upload row)
- `src/app/admin/(protected)/produits/new/page.tsx` — Server component rendering ModelForm for product creation
- `src/app/admin/(protected)/produits/[id]/edit/page.tsx` — Server component fetching model with images, rendering ModelForm for editing

## Forward Intelligence

### What the next slice should know
- ModelForm accepts an optional `model: ModelWithImages` prop. In edit mode (`model` is present), the photo section renders. S04's "mode classique" section should follow the same gating pattern — only render when editing an existing model.
- Photo mutations use a `refreshImages` callback that GETs `/api/admin/models/${model.id}/images` and sorts by `sort_order`. S04 can reuse this pattern or trigger it after inserting into `generated_visuals`.
- The form uses JSON body for info fields (no file uploads in the info section). S04's fabric + angle + photo upload will need FormData, similar to the photo upload handler pattern already in ModelForm.

### What's fragile
- `refreshImages` fetches and replaces the entire `images` state array — if S04 adds generated_visuals display alongside model_images, it needs its own refresh or a combined fetch approach.
- The edit page's server-side fetch uses `models.select('*, model_images(*)')` — if S04 needs generated_visuals too, the select must be extended and the type updated.

### Authoritative diagnostics
- `npx tsc --noEmit` — catches all type regressions across the form, route pages, and shared types. Run after any edit.
- Browser Network tab → filter `/api/admin/models` — shows all JSON and FormData requests with full request/response bodies.
- React DevTools → ModelForm component → inspect `useForm` hook state for current field values and validation errors, and `images` state for current photo list.

### What assumptions changed
- No assumptions changed — implementation followed the plan closely. The only deviation (Zod v4 coerce) was already documented as K011 before this slice started.
