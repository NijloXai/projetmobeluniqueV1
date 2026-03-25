---
id: S02
parent: M004
milestone: M004
provides:
  - /admin/produits page with model table, toggle active/inactive, delete with confirmation, empty state
requires:
  - slice: S01
    provides: CRUD API routes /api/admin/models and /api/admin/models/[id]/images
affects:
  - S03
  - S04
key_files:
  - src/app/admin/(protected)/produits/page.tsx
  - src/app/admin/(protected)/produits/ModelList.tsx
  - src/app/admin/(protected)/produits/page.module.css
key_decisions:
  - Preserve image_count in local state during toggle since PUT /api/admin/models/:id returns flat Model without computed counts
  - Hoist Intl.NumberFormat to module-level constant to avoid re-creation on every render
patterns_established:
  - Admin list page pattern confirmed: server component fetches with relation data, client component handles table + toggle + delete — identical structure to tissus list
observability_surfaces:
  - Network requests to /api/admin/models/:id for toggle (PUT) and delete (DELETE) visible in browser devtools
  - Subtitle count ("N produit(s) dans le catalogue") reflects current model count in real-time after mutations
drill_down_paths:
  - .gsd/milestones/M004/slices/S02/tasks/T01-SUMMARY.md
duration: 15m
verification_result: passed
completed_at: 2026-03-24
---

# S02: Page Liste Produits

**Admin table at `/admin/produits` listing all models with Nom, Prix (€), Photos count, Actif toggle, and Actions (Modifier/Supprimer) — mirrors the tissus list pattern with model-specific columns.**

## What Happened

Single task (T01) created three files following the established tissus list page pattern:

**`page.tsx`** — Server component that queries `models` with `model_images(id)` via Supabase server client, computes `image_count` from array length, strips the nested relation, and passes enriched models to the client component.

**`ModelList.tsx`** — Client component rendering a 5-column table (Nom with name+slug, Prix with `Intl.NumberFormat('fr-FR', currency: 'EUR')`, Photos count, Actif toggle via `ToggleSwitch`, Actions with Modifier link + Supprimer button). Toggle calls `PUT /api/admin/models/:id` and merges the response while preserving local `image_count`. Delete calls `DELETE /api/admin/models/:id` with French-language `ConfirmDialog`. Empty state shows "Aucun produit dans le catalogue." with a link to create the first product. Header includes "+ Nouveau produit" link to `/admin/produits/new`.

**`page.module.css`** — Adapted from the tissus CSS: removed swatch-specific styles, added `.price` with `font-variant-numeric: tabular-nums` for aligned number columns and `.photoCount` for the image count display.

## Verification

All 6 slice verification checks passed:

| # | Check | Result |
|---|-------|--------|
| 1 | `npx tsc --noEmit` — zero type errors | ✅ pass |
| 2 | All 3 files exist (page.tsx, ModelList.tsx, page.module.css) | ✅ pass |
| 3 | ToggleSwitch + ConfirmDialog imports present | ✅ pass |
| 4 | `/api/admin/models/` API calls present | ✅ pass |
| 5 | `/admin/produits/new` link present | ✅ pass |
| 6 | `€` symbol present | ✅ pass |

## New Requirements Surfaced

- none

## Deviations

- none

## Known Limitations

- Toggle and delete failures are silent — the UI simply doesn't update. No toast or error message is shown to the admin. Consistent with the tissus list behavior.
- No pagination — all models are fetched at once. Acceptable for the expected catalog size (<100 models).

## Follow-ups

- none — S03 (form) and S04 (mode classique) are already planned and will build on this page.

## Files Created/Modified

- `src/app/admin/(protected)/produits/page.tsx` — Server component fetching models with image_count from Supabase
- `src/app/admin/(protected)/produits/ModelList.tsx` — Client component with table, toggle, delete, empty state
- `src/app/admin/(protected)/produits/page.module.css` — Adapted styles from tissus page, swatch styles removed, price/photoCount added

## Forward Intelligence

### What the next slice should know
- The "Modifier" link points to `/admin/produits/${model.id}/edit` — S03 must create a page at that exact route with a `[id]` dynamic segment.
- The "+ Nouveau produit" link points to `/admin/produits/new` — S03 must create a page at that route.
- The server page queries `model_images(id)` only for count purposes — S03's edit page will need the full image data with `view_type`, `image_url`, `sort_order`.

### What's fragile
- `image_count` preservation during toggle — the PUT response returns a flat `Model` without image counts, so the client must manually carry over the local count. If the API shape changes to include counts, this merge logic should be simplified.

### Authoritative diagnostics
- Network tab on `/admin/produits` — PUT and DELETE requests to `/api/admin/models/:id` confirm toggle and delete work. Response status codes (200/204 vs 4xx/5xx) are the ground truth.
- The subtitle text count — "N produit(s)" reflects the client-side array length after mutations, confirming state management works.

### What assumptions changed
- No assumptions changed — the slice was straightforward and followed the tissus pattern exactly.
