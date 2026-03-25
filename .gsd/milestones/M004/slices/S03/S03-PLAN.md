# S03: Formulaire Produit + Photos Multi-Angles

**Goal:** Admin can create and edit products (canapés) via a complete form at `/admin/produits/new` and `/admin/produits/[id]/edit`, with info fields and multi-angle photo management.
**Demo:** Navigate to `/admin/produits/new`, fill in model info (name auto-generates slug), submit → redirects to edit page. On edit page, upload photos with view_type labels, reorder via up/down arrows, delete individual photos.

## Must-Haves

- ModelForm with info section: name, slug (auto-gen + editable), description (textarea), price (number), dimensions, shopify_url, is_active checkbox
- Slug auto-generated from name via `slugify()`, manually editable (R014)
- `/admin/produits/new` creates model via POST, redirects to `/admin/produits/[id]/edit`
- `/admin/produits/[id]/edit` loads model with images, saves via PUT
- Photo section (edit mode only): upload new photo with `view_type` text input, 5MB client-side limit (R015)
- Photo list: thumbnails with view_type label, sort_order display, up/down reorder arrows, delete button
- Reorder swaps `sort_order` via two PUT calls to `/api/admin/models/:id/images/:imageId`
- Delete calls `DELETE /api/admin/models/:id/images/:imageId`
- `form.module.css` with styles for both info and photo sections
- `npx tsc --noEmit` passes with zero errors

## Proof Level

- This slice proves: integration
- Real runtime required: yes (form submits to S01 API routes)
- Human/UAT required: no (structural + type-check verification sufficient)

## Verification

- `npx tsc --noEmit` — zero type errors across all 4 new files and existing imports
- `test -f src/app/admin/\(protected\)/produits/new/page.tsx` — new page exists
- `test -f src/app/admin/\(protected\)/produits/\[id\]/edit/page.tsx` — edit page exists
- `test -f src/app/admin/\(protected\)/produits/ModelForm.tsx` — form component exists
- `test -f src/app/admin/\(protected\)/produits/form.module.css` — CSS module exists
- `grep -q "slugify" src/app/admin/\(protected\)/produits/ModelForm.tsx` — auto-slug wired
- `grep -q "zodResolver" src/app/admin/\(protected\)/produits/ModelForm.tsx` — zod validation wired
- `grep -q "maxSizeMB={5}" src/app/admin/\(protected\)/produits/ModelForm.tsx` — 5MB limit enforced client-side
- `grep -q "photoSection\|photoGrid\|photoCard" src/app/admin/\(protected\)/produits/form.module.css` — photo styles exist

## Integration Closure

- Upstream surfaces consumed: S01 API routes (`/api/admin/models` POST/PUT, `/api/admin/models/[id]` GET, `/api/admin/models/[id]/images` GET/POST, `/api/admin/models/[id]/images/[imageId]` PUT/DELETE), `ImageUpload` component, `slugify` util, `createModelSchema` zod schema, `Model`/`ModelImage`/`ModelWithImages` types
- New wiring introduced in this slice: route pages at `/admin/produits/new` and `/admin/produits/[id]/edit` rendering `ModelForm` client component
- What remains before the milestone is truly usable end-to-end: S04 (mode classique — upload rendered visuals without AI)

## Observability / Diagnostics

- **Runtime signals:** ModelForm displays `serverError` state as a visible error banner when API calls fail. Submit button shows "Enregistrement..." during request flight.
- **Inspection surfaces:** Browser Network tab shows JSON POST/PUT to `/api/admin/models` with request/response bodies. Supabase dashboard `models` table shows row inserts/updates. React DevTools can inspect `useForm` state and validation errors.
- **Failure visibility:** Zod validation errors surface inline per-field. API errors (4xx/5xx) surface as a red banner at form top. Network failures show "Erreur de connexion." banner.
- **Redaction:** No secrets in this slice — all data is admin-facing product metadata.

## Tasks

- [x] **T01: Create ModelForm info section, route pages, and CSS** `est:45m`
  - Why: Establishes the core form component with all model info fields, both Next.js route pages (new + edit), and CSS styles. After this, creating and editing model metadata works end-to-end.
  - Files: `src/app/admin/(protected)/produits/ModelForm.tsx`, `src/app/admin/(protected)/produits/new/page.tsx`, `src/app/admin/(protected)/produits/[id]/edit/page.tsx`, `src/app/admin/(protected)/produits/form.module.css`
  - Do: Mirror FabricForm.tsx pattern exactly — react-hook-form + zodResolver with `createModelSchema`, auto-slug via useEffect + slugify, name/slug/description(textarea)/price(number)/dimensions/shopify_url/is_active fields. Create flow: POST to `/api/admin/models` with JSON body, on success redirect to `/admin/produits/${id}/edit`. Edit flow: PUT to `/api/admin/models/${model.id}` with JSON body. Edit page server component fetches model via `models.select('*, model_images(*)')` with 404 handling. CSS extends tissus/form.module.css with textarea and additional field styles.
  - Verify: `npx tsc --noEmit` passes && all 4 files exist && `grep -q "zodResolver" src/app/admin/\(protected\)/produits/ModelForm.tsx`
  - Done when: `/admin/produits/new` renders the info form, and `/admin/produits/[id]/edit` loads existing model data into the form. Type-check passes.

- [x] **T02: Add photo management section to ModelForm** `est:45m`
  - Why: Completes the form with the multi-angle photo section — upload, display, reorder, delete. This delivers the photo management UX that is the core differentiator of this form vs. the simpler FabricForm.
  - Files: `src/app/admin/(protected)/produits/ModelForm.tsx`, `src/app/admin/(protected)/produits/form.module.css`
  - Do: Add photos section below info section, conditional on `model` prop (edit mode only). Display existing `model.model_images` as a grid of photo cards (thumbnail, view_type, sort_order). Add upload area: ImageUpload with maxSizeMB={5} + view_type text input + "Ajouter" button. Upload handler: POST FormData to `/api/admin/models/${model.id}/images` with auto-computed sort_order (images.length). Reorder: up/down arrow buttons swap sort_order between adjacent images via Promise.all of two PUTs, then re-fetch image list. Delete: button with inline confirmation, calls DELETE endpoint, then re-fetch. Use state for `images` array initialized from `model.model_images`, re-fetched after mutations.
  - Verify: `npx tsc --noEmit` passes && `grep -q "maxSizeMB={5}" src/app/admin/\(protected\)/produits/ModelForm.tsx` && `grep -q "photoSection\|photoGrid\|photoCard" src/app/admin/\(protected\)/produits/form.module.css`
  - Done when: ModelForm in edit mode shows photo section with upload, reorder, and delete functionality. Type-check passes. Photo section hidden in create mode.

## Files Likely Touched

- `src/app/admin/(protected)/produits/ModelForm.tsx`
- `src/app/admin/(protected)/produits/form.module.css`
- `src/app/admin/(protected)/produits/new/page.tsx`
- `src/app/admin/(protected)/produits/[id]/edit/page.tsx`
