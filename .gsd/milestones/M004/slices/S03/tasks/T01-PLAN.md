---
estimated_steps: 5
estimated_files: 4
skills_used:
  - react-best-practices
  - nextjs-supabase-auth
---

# T01: Create ModelForm info section, route pages, and CSS

**Slice:** S03 — Formulaire Produit + Photos Multi-Angles
**Milestone:** M004

## Description

Create the `ModelForm` client component with the info fields section, both Next.js route pages (`/admin/produits/new` and `/admin/produits/[id]/edit`), and the CSS module. This mirrors the existing `FabricForm.tsx` pattern exactly but with model-specific fields: name, slug (auto-generated + editable), description (textarea), price (number), dimensions, shopify_url, and is_active checkbox.

The create flow POSTs JSON to `/api/admin/models`, and on success redirects to `/admin/produits/${id}/edit`. The edit flow GETs model data (with nested images), renders the form pre-filled, and PUTs JSON updates.

The form accepts an optional `model` prop (with nested `model_images`) for edit mode. T02 will add the photo management section — for now, the component structure must support this future extension by using `ModelWithImages` as the model prop type.

## Steps

1. **Create `form.module.css`** — Copy `src/app/admin/(protected)/tissus/form.module.css` as the base. Add styles for: `.textarea` (same as `.input` but with `min-height: 120px`, `resize: vertical`), `.urlInput` (full-width), `.priceRow` (inline flex for price + dimensions), and placeholder `.photoSection` / `.photoGrid` / `.photoCard` / `.photoCardControls` classes (empty stubs for T02). Keep all existing classes — the model form reuses them.

2. **Create `ModelForm.tsx`** — Client component mirroring `FabricForm.tsx`. Key differences from FabricForm:
   - Props: `{ model?: ModelWithImages | null }` (no `categories` — models have no category combobox)
   - Zod schema: Use `createModelSchema` from `@/lib/schemas` directly (it already has all fields: name, slug, description, price, dimensions, shopify_url, is_active). For the form, define a local `modelFormSchema` that mirrors it but makes `price` accept string input (since HTML number inputs produce strings) and coerces to number: `price: z.coerce.number().positive('Le prix doit être positif')`.
   - Fields: name (text), slug (text, mono, auto-gen from name), description (textarea), price (number input, step="0.01"), dimensions (text), shopify_url (url input), is_active (checkbox)
   - Auto-slug: Same `useEffect` + `slugify()` + `slugManuallyEdited` pattern from FabricForm
   - Submit handler: Build a plain JSON body (not FormData — model info has no files). POST to `/api/admin/models` for create, PUT to `/api/admin/models/${model.id}` for edit. On create success, parse response JSON to get the new model ID, then `router.push('/admin/produits/${id}/edit')`. On edit success, `router.push('/admin/produits')` + `router.refresh()`.
   - The component should include a `{/* Section Photos — ajoutée par T02 */}` comment placeholder where the photo section will go, gated by `{isEdit && model && ( ... )}`.

3. **Create `new/page.tsx`** — Minimal server component that renders `<ModelForm />` with no props. No data fetching needed (simpler than FabricForm's new page which fetches categories).

4. **Create `[id]/edit/page.tsx`** — Server component that:
   - Extracts `id` from `params` (async: `const { id } = await params`)
   - Creates Supabase server client
   - Fetches `models.select('*, model_images(*)').eq('id', id).single()`
   - Calls `notFound()` if error or no data
   - Sorts `model_images` by `sort_order` in JS (same pattern as the API route)
   - Renders `<ModelForm model={data as ModelWithImages} />`

5. **Verify** — Run `npx tsc --noEmit` to confirm zero type errors. Verify all 4 files exist. Check that ModelForm imports `zodResolver`, `slugify`, and uses `useForm`.

## Must-Haves

- [ ] ModelForm uses `react-hook-form` + `zodResolver` for validation (same pattern as FabricForm)
- [ ] Slug auto-generated from name via `slugify()` with manual override capability (R014)
- [ ] Create flow: POST JSON to `/api/admin/models`, redirect to `/admin/produits/${id}/edit` on success
- [ ] Edit flow: PUT JSON to `/api/admin/models/${model.id}`, redirect to `/admin/produits` on success
- [ ] Edit page fetches model with `model_images(*)` and passes as `ModelWithImages` prop
- [ ] All 7 info fields present: name, slug, description, price, dimensions, shopify_url, is_active
- [ ] `npx tsc --noEmit` passes with zero errors

## Verification

- `npx tsc --noEmit` — zero type errors
- `test -f src/app/admin/\(protected\)/produits/ModelForm.tsx && test -f src/app/admin/\(protected\)/produits/form.module.css && test -f src/app/admin/\(protected\)/produits/new/page.tsx && test -f src/app/admin/\(protected\)/produits/\[id\]/edit/page.tsx` — all 4 files exist
- `grep -q "zodResolver" src/app/admin/\(protected\)/produits/ModelForm.tsx` — zod validation wired
- `grep -q "slugify" src/app/admin/\(protected\)/produits/ModelForm.tsx` — auto-slug wired
- `grep -q "useForm" src/app/admin/\(protected\)/produits/ModelForm.tsx` — react-hook-form used
- `grep -q "/api/admin/models" src/app/admin/\(protected\)/produits/ModelForm.tsx` — API endpoint called

## Inputs

- `src/app/admin/(protected)/tissus/FabricForm.tsx` — reference pattern to mirror for react-hook-form + zod + slug + CSS modules structure
- `src/app/admin/(protected)/tissus/form.module.css` — base CSS to copy and extend
- `src/app/admin/(protected)/tissus/new/page.tsx` — reference pattern for server-side new page
- `src/app/admin/(protected)/tissus/[id]/edit/page.tsx` — reference pattern for server-side edit page with data fetching
- `src/lib/schemas.ts` — `createModelSchema` for form validation shape
- `src/lib/utils.ts` — `slugify()` function for auto-slug
- `src/types/database.ts` — `Model`, `ModelWithImages` types

## Observability Impact

- **Signals added:** `serverError` state renders as a visible error banner; submit button text changes to "Enregistrement..." during flight. Field-level zod validation errors appear inline.
- **Inspection:** Network tab shows JSON requests to `/api/admin/models` (POST for create, PUT for edit). Form state inspectable via React DevTools (`useForm` hook state).
- **Failure visibility:** API errors (non-2xx) are surfaced to the admin via the `serverError` banner. Network failures show "Erreur de connexion." catch-all. Invalid form data prevented by zod validation before submit.

## Expected Output

- `src/app/admin/(protected)/produits/ModelForm.tsx` — client form component with info section, react-hook-form + zod, auto-slug, create/edit submit handlers
- `src/app/admin/(protected)/produits/form.module.css` — CSS module with all info form styles + placeholder photo section classes
- `src/app/admin/(protected)/produits/new/page.tsx` — server component rendering ModelForm for creation
- `src/app/admin/(protected)/produits/[id]/edit/page.tsx` — server component fetching model with images and rendering ModelForm for editing
