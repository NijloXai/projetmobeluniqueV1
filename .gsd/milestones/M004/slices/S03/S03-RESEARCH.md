# S03 — Research

**Date:** 2026-03-24
**Depth:** Light — established CRUD form pattern, mirrors FabricForm exactly

## Requirements Targeted

- **R007** (active, owner M004/S01) — CRUD Produits: this slice delivers the form UI (create + edit pages)
- **R014** (active, partial) — Slugs auto-générés + éditables: form must auto-generate slug from name, allow manual edit
- **R015** (active, partial) — Upload images avec preview + validation: multi-angle photo upload section with preview and 5MB limit

## Summary

S03 builds the product form at `/admin/produits/new` and `/admin/produits/[id]/edit`. The work divides naturally into two parts: (1) a model info form mirroring `FabricForm.tsx` with more fields (description textarea, price, dimensions, shopify_url), and (2) a multi-angle photo management section that uploads via the existing `POST /api/admin/models/:id/images` API.

The FabricForm pattern is the direct template — same react-hook-form + zod + slugify + ImageUpload + CSS modules approach. The only novel aspect is the photo section which manages a list of images with view_type labels, sort_order reorder (up/down arrows), and individual delete. No drag-and-drop library needed — arrow buttons swapping `sort_order` via `PUT /api/admin/models/:id/images/:imageId` are simpler and match the project's no-extra-dependencies approach.

The creation flow must be two-step: create the model first (POST returns the model ID), then redirect to the edit page where photos can be added (image upload requires a model ID). This matches how the `ModelList` already links to `/admin/produits/${model.id}/edit`.

## Recommendation

Follow the FabricForm pattern exactly. Split into 3 tasks: (T01) route pages + ModelForm with info section, (T02) photo management section as a sub-component within ModelForm, (T03) form.module.css + verification. Alternatively, T01 can bundle the CSS since the form won't render without it — but the planner can decide.

Use up/down arrow buttons for reorder (no DnD library). Each arrow click swaps `sort_order` between adjacent images via two PUT calls. Photo upload reuses the existing `ImageUpload` component with a wrapper that adds view_type input.

## Implementation Landscape

### Key Files

- `src/app/admin/(protected)/tissus/FabricForm.tsx` — **reference pattern** to mirror. Uses react-hook-form + zodResolver, auto-slug from name, ImageUpload for files, CSS modules. Model form adds: description (textarea), price (number input), dimensions (text), shopify_url (url input), and a photo management section.
- `src/app/admin/(protected)/tissus/form.module.css` — **reference CSS** to copy/adapt. Model form needs extra styles for: textarea, number input, photo list grid, photo card with controls.
- `src/app/admin/(protected)/tissus/new/page.tsx` — **reference pattern** for server-side new page (minimal — just renders the form).
- `src/app/admin/(protected)/tissus/[id]/edit/page.tsx` — **reference pattern** for server-side edit page (fetches model by id, 404 if missing, renders form with data).
- `src/components/admin/ImageUpload.tsx` — **reuse as-is** for photo upload. Single-file upload with preview, size validation, remove. The photo section wraps this in a loop with view_type input per image.
- `src/lib/schemas.ts` — `createModelSchema` and `updateModelSchema` already defined. Form uses `createModelSchema` shape for validation.
- `src/types/database.ts` — `Model`, `ModelImage`, `ModelWithImages` types already defined.
- `src/lib/utils.ts` — `slugify()` already exported, used for auto-slug.
- `src/app/api/admin/models/[id]/route.ts` — GET returns model with nested `model_images` sorted by `sort_order`. PUT accepts JSON body for model updates.
- `src/app/api/admin/models/[id]/images/route.ts` — POST accepts FormData (image, view_type, sort_order). GET returns image list.
- `src/app/api/admin/models/[id]/images/[imageId]/route.ts` — PUT updates view_type/sort_order. DELETE removes image + storage.

### Files to Create

1. `src/app/admin/(protected)/produits/new/page.tsx` — server component, renders `<ModelForm />`
2. `src/app/admin/(protected)/produits/[id]/edit/page.tsx` — server component, fetches model via Supabase `models.select('*, model_images(*)')`, 404 if missing, renders `<ModelForm model={...} />`
3. `src/app/admin/(protected)/produits/ModelForm.tsx` — client component with two sections:
   - **Section Infos:** name, slug (auto-gen), description (textarea), price (number), dimensions, shopify_url, is_active checkbox
   - **Section Photos:** (only in edit mode) list existing images as cards (thumbnail + view_type + sort_order), upload new photo (ImageUpload + view_type input), reorder via up/down arrows, delete with confirmation
4. `src/app/admin/(protected)/produits/form.module.css` — styles for model form (base from tissus/form.module.css + photo section styles)

### Build Order

1. **T01: ModelForm info section + route pages + CSS** — Create the ModelForm component with the info fields section, the new/edit route pages, and form.module.css. After this: `/admin/produits/new` creates a model, redirects to edit page. `/admin/produits/[id]/edit` loads and saves model info. No photo section yet.

2. **T02: Photo management section** — Add the photos section to ModelForm (edit mode only). Upload new photo with view_type, display existing photos as cards with thumbnails, reorder via up/down arrows (swap sort_order via PUT), delete individual photos. After this: full form with both sections working.

3. **T03: Verification** — `tsc --noEmit`, check all files exist, verify creation flow (new → redirect → edit with photos section visible).

### Verification Approach

- `npx tsc --noEmit` — zero type errors
- All 4 files exist: ModelForm.tsx, form.module.css, new/page.tsx, [id]/edit/page.tsx
- ModelForm uses react-hook-form + zodResolver (same pattern as FabricForm)
- Auto-slug from name (slugify import + useEffect pattern)
- Photo section only renders when `model` prop is provided (edit mode)
- Photo upload calls `POST /api/admin/models/:id/images` with FormData
- Reorder uses `PUT /api/admin/models/:id/images/:imageId` to swap sort_order
- Delete calls `DELETE /api/admin/models/:id/images/:imageId`
- Create flow: POST to `/api/admin/models`, on success redirect to `/admin/produits/${id}/edit`

## Constraints

- Image upload requires a model ID → creation flow must be two-step (create model, then add photos in edit mode)
- `upsert: true` on image upload API — uploading same view_type + sort_order combo overwrites silently (S01 Forward Intelligence). Form should auto-increment sort_order for new uploads.
- No drag-and-drop library installed — Radix has no DnD component, and adding one is out of scope. Up/down arrow buttons are sufficient.
- `view_type` is free-text (K001 pattern applied to images) — the form should use a plain text input, not a select.
- Max file size 5MB enforced server-side (API) — the `ImageUpload` component should also enforce client-side via `maxSizeMB={5}`.

## Common Pitfalls

- **Photo section in create mode** — The photo upload API requires a model ID. The form must NOT show the photo section on `/admin/produits/new`. Only show it after the model is created and the user is on the edit page.
- **sort_order auto-assignment** — When adding a new photo, compute `sort_order = existingImages.length` to append at end. Don't let the user manually set sort_order on upload.
- **Reorder swap correctness** — When swapping two adjacent images' sort_order, both PUT calls must complete before refreshing the list. Use Promise.all for the two PUTs, then re-fetch or locally swap.
