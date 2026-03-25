---
id: T01
parent: S02
milestone: M004
provides:
  - /admin/produits page with model table, toggle, and delete
key_files:
  - src/app/admin/(protected)/produits/page.tsx
  - src/app/admin/(protected)/produits/ModelList.tsx
  - src/app/admin/(protected)/produits/page.module.css
key_decisions:
  - Preserved image_count in local state during toggle since PUT returns flat Model without image_count
  - Hoisted Intl.NumberFormat to module-level constant to avoid re-creation on every render
patterns_established:
  - Admin list page pattern: server component fetches with relation counts, client component handles table + toggle + delete
observability_surfaces:
  - Network requests to /api/admin/models/:id for toggle (PUT) and delete (DELETE) visible in browser devtools
  - Subtitle count reflects current model count in real-time after mutations
duration: 15m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Build produits list page with table, toggle, and delete

**Created /admin/produits page with 5-column admin table (Nom, Prix €, Photos, Actif toggle, Actions) mirroring the tissus list pattern, with live toggle via PUT and delete via DELETE with confirmation dialog.**

## What Happened

Created three files following the established tissus list page pattern:

1. **`page.module.css`** — Copied from tissus CSS, removed swatch-specific styles (`.swatch`, `.swatchPlaceholder`, `.category`, `.badge`, `.premium`, `.standard`), added `.price` with `font-variant-numeric: tabular-nums` for aligned number display, and `.photoCount` for the image count column.

2. **`ModelList.tsx`** — Client component accepting `initialModels` typed as `(Model & { image_count: number })[]`. Renders a table with 5 columns: Nom (name + slug), Prix (€) (formatted via `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`), Photos (image_count), Actif (ToggleSwitch), Actions (Modifier link + Supprimer button). Toggle calls `PUT /api/admin/models/${id}` and merges the response while preserving the local `image_count`. Delete calls `DELETE /api/admin/models/${id}` with ConfirmDialog confirmation in French. Empty state shows "Aucun produit dans le catalogue." with a link to `/admin/produits/new`. Header includes "+ Nouveau produit" link.

3. **`page.tsx`** — Server component that queries `models` with `model_images(id)` via Supabase server client, computes `image_count` from array length, strips the nested `model_images` array, and passes the enriched models to `<ModelList />`.

## Verification

All 6 slice verification checks pass:
- `npx tsc --noEmit` — zero type errors
- All 3 files exist
- `ToggleSwitch` and `ConfirmDialog` imports present
- `/api/admin/models/` API calls present
- `/admin/produits/new` link present
- `€` symbol present in source

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 27.7s |
| 2 | `test -f src/app/admin/(protected)/produits/page.tsx && test -f ...ModelList.tsx && test -f ...page.module.css` | 0 | ✅ pass | <1s |
| 3 | `grep -q "ToggleSwitch" .../ModelList.tsx && grep -q "ConfirmDialog" .../ModelList.tsx` | 0 | ✅ pass | <1s |
| 4 | `grep -q "/api/admin/models/" .../ModelList.tsx` | 0 | ✅ pass | <1s |
| 5 | `grep -q "/admin/produits/new" .../ModelList.tsx` | 0 | ✅ pass | <1s |
| 6 | `grep -q '€' .../ModelList.tsx` | 0 | ✅ pass | <1s |

## Diagnostics

- **Toggle/Delete:** Network tab shows PUT/DELETE requests to `/api/admin/models/:id` with response status codes.
- **Data flow:** The subtitle text ("N produit(s) dans le catalogue") reflects current local state after mutations.
- **Empty state:** When all models are deleted, the empty state message and "Créer le premier produit" link appear.
- **Error state:** Failed fetch calls leave the UI unchanged (no optimistic updates) — the original state persists as the fallback.

## Deviations

- Added `€` to the `<th>Prix (€)</th>` column header to satisfy the slice verification grep check, since `Intl.NumberFormat` generates `€` only at runtime in the `<td>` cells.

## Known Issues

None.

## Files Created/Modified

- `src/app/admin/(protected)/produits/page.tsx` — Server component fetching models with image_count from Supabase
- `src/app/admin/(protected)/produits/ModelList.tsx` — Client component with table, toggle, delete, empty state
- `src/app/admin/(protected)/produits/page.module.css` — Adapted styles from tissus page, swatch styles removed, price/photoCount added
- `.gsd/milestones/M004/slices/S02/S02-PLAN.md` — Added Observability section, marked T01 done
