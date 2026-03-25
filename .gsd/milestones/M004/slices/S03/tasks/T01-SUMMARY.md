---
id: T01
parent: S03
milestone: M004
provides:
  - ModelForm client component with 7 info fields, auto-slug, and create/edit submit flows
  - Route pages for /admin/produits/new and /admin/produits/[id]/edit
  - CSS module with info form styles and photo section stubs for T02
key_files:
  - src/app/admin/(protected)/produits/ModelForm.tsx
  - src/app/admin/(protected)/produits/form.module.css
  - src/app/admin/(protected)/produits/new/page.tsx
  - src/app/admin/(protected)/produits/[id]/edit/page.tsx
key_decisions:
  - Used z.number().positive() with valueAsNumber register option instead of z.coerce.number() — Zod v4 coerce infers unknown which breaks react-hook-form resolver type
patterns_established:
  - ModelForm mirrors FabricForm pattern but uses JSON body (not FormData) since model info has no file uploads — photos handled separately by T02
observability_surfaces:
  - serverError state renders visible error banner on API/network failures
  - submit button text changes to "Enregistrement..." during request flight
  - zod field-level validation errors shown inline per field
duration: 15m
verification_result: passed
completed_at: 2026-03-24T02:25:00+01:00
blocker_discovered: false
---

# T01: Create ModelForm info section, route pages, and CSS

**Created ModelForm with react-hook-form + zod validation, auto-slug, JSON create/edit flows, route pages for new and edit, and CSS module with photo stubs**

## What Happened

Created four files mirroring the FabricForm pattern for the model/product admin form:

1. **form.module.css** — Copied all base styles from tissus/form.module.css, added `.textarea` (min-height 120px, resize vertical), `.urlInput` (full-width), `.priceRow` (flex layout for price + dimensions inline), and empty `.photoSection` / `.photoGrid` / `.photoCard` / `.photoCardControls` stubs for T02.

2. **ModelForm.tsx** — Client component with 7 fields (name, slug, description, price, dimensions, shopify_url, is_active). Auto-slug from name via `useEffect` + `slugify()` with `slugManuallyEdited` override flag. Local zod schema validates all fields. Submit handler sends JSON (not FormData) — POST to `/api/admin/models` for create (redirects to edit page with new ID), PUT to `/api/admin/models/${model.id}` for edit (redirects to list). Photo section placeholder gated by `isEdit && model`.

3. **new/page.tsx** — Minimal server component rendering `<ModelForm />` with no props.

4. **[id]/edit/page.tsx** — Server component fetching model with `model_images(*)` via Supabase, sorting images by `sort_order`, calling `notFound()` on error, and passing typed `ModelWithImages` to ModelForm.

Initial type-check failed because `z.coerce.number()` in Zod v4 infers `unknown` input type which is incompatible with react-hook-form's resolver generic. Fixed by using `z.number().positive()` with `{ valueAsNumber: true }` on the register call, which is the standard react-hook-form pattern for numeric inputs.

## Verification

All task-level and applicable slice-level checks pass:

- `npx tsc --noEmit` — zero errors (exit 0)
- All 4 files exist
- `zodResolver`, `slugify`, `useForm`, `/api/admin/models` all present in ModelForm.tsx
- Photo CSS stubs present in form.module.css
- `maxSizeMB={5}` not yet present — expected, that's T02 scope

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 2.8s |
| 2 | `test -f src/app/admin/(protected)/produits/new/page.tsx` | 0 | ✅ pass | <1s |
| 3 | `test -f src/app/admin/(protected)/produits/[id]/edit/page.tsx` | 0 | ✅ pass | <1s |
| 4 | `test -f src/app/admin/(protected)/produits/ModelForm.tsx` | 0 | ✅ pass | <1s |
| 5 | `test -f src/app/admin/(protected)/produits/form.module.css` | 0 | ✅ pass | <1s |
| 6 | `grep -q "slugify" ModelForm.tsx` | 0 | ✅ pass | <1s |
| 7 | `grep -q "zodResolver" ModelForm.tsx` | 0 | ✅ pass | <1s |
| 8 | `grep -q "maxSizeMB={5}" ModelForm.tsx` | 1 | ⏳ T02 | <1s |
| 9 | `grep -q "photoSection\|photoGrid\|photoCard" form.module.css` | 0 | ✅ pass | <1s |

## Diagnostics

- **Error banner:** When the form's API call fails, inspect the `.serverError` div at the top of the form for the error message.
- **Network tab:** JSON requests to `/api/admin/models` (POST for create, PUT for edit) show full request/response bodies.
- **React DevTools:** Inspect the `ModelForm` component's `useForm` hook to see current field values, validation errors, and `isSubmitting` state.
- **Type safety:** Run `npx tsc --noEmit` to verify no regressions after future edits.

## Deviations

- **Zod schema:** Used `z.number().positive()` + `valueAsNumber: true` register option instead of `z.coerce.number()` as the plan suggested. Zod v4's coerce infers `unknown` input type which breaks react-hook-form's zodResolver type narrowing. The `valueAsNumber` approach is the standard react-hook-form pattern.

## Known Issues

None.

## Files Created/Modified

- `src/app/admin/(protected)/produits/form.module.css` — CSS module with all info form styles + placeholder photo section classes for T02
- `src/app/admin/(protected)/produits/ModelForm.tsx` — Client component with 7 info fields, react-hook-form + zod, auto-slug, JSON create/edit handlers
- `src/app/admin/(protected)/produits/new/page.tsx` — Server component rendering ModelForm for creation
- `src/app/admin/(protected)/produits/[id]/edit/page.tsx` — Server component fetching model with images, rendering ModelForm for editing
- `.gsd/milestones/M004/slices/S03/S03-PLAN.md` — Added Observability section, marked T01 done
- `.gsd/milestones/M004/slices/S03/tasks/T01-PLAN.md` — Added Observability Impact section
