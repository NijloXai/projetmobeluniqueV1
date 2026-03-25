# S02 — Research

**Date:** 2026-03-24
**Depth:** Light — direct mirror of M003 fabrics list page with known patterns and existing components.

## Summary

S02 is a straightforward admin list page at `/admin/produits` that displays all canapés in a table with toggle actif/inactif, prix, photo count, and Modifier/Supprimer actions. The sidebar already links to `/admin/produits`. The implementation mirrors `src/app/admin/(protected)/tissus/` exactly — server component fetches data, passes to client component that handles toggle and delete via the S01 API.

All building blocks exist: `ToggleSwitch`, `ConfirmDialog` components from M003, the `GET /api/admin/models` endpoint (returns models with `model_images(count)`), and the `PUT /api/admin/models/:id` + `DELETE /api/admin/models/:id` routes for toggle/delete. No new technology, no ambiguity.

## Recommendation

Copy the fabrics list pattern verbatim: server page (`page.tsx`) fetches models via Supabase server client, passes to `ModelList.tsx` client component. Adapt the table columns for models (Nom+slug, Prix, Nb photos, Actif, Actions). Reuse CSS module from tissus with minimal adaptations. One task is sufficient.

## Implementation Landscape

### Key Files

**To create:**
- `src/app/admin/(protected)/produits/page.tsx` — Server component. Fetches `models` with `model_images(count)` via `createClient()`, ordered by `created_at` desc. Passes to `ModelList`.
- `src/app/admin/(protected)/produits/ModelList.tsx` — Client component. Table with columns: Nom (name + slug), Prix, Photos (count from `model_images[0]?.count ?? 0`), Actif (ToggleSwitch), Actions (Modifier link + Supprimer button). Handles toggle via `PUT /api/admin/models/:id` and delete via `DELETE /api/admin/models/:id` with `ConfirmDialog`.
- `src/app/admin/(protected)/produits/page.module.css` — Copy from `tissus/page.module.css`, remove swatch-specific styles, add price formatting styles if needed.

**Existing to reuse (do NOT modify):**
- `src/components/admin/ToggleSwitch.tsx`
- `src/components/admin/ConfirmDialog.tsx`
- `src/components/admin/AdminSidebar.tsx` — already has `/admin/produits` nav item
- `src/app/api/admin/models/route.ts` — GET list endpoint
- `src/app/api/admin/models/[id]/route.ts` — PUT (toggle) + DELETE endpoints
- `src/types/database.ts` — `Model` type

### Data Shape

`GET /api/admin/models` returns: `Array<Model & { model_images: [{ count: number }] }>`
Extract photo count with: `model.model_images[0]?.count ?? 0`

### Table Columns

| Column | Source | Notes |
|--------|--------|-------|
| Nom | `name` + `slug` | Two-line cell |
| Prix | `price` | Format as currency (€) |
| Photos | `model_images[0]?.count ?? 0` | Simple number |
| Actif | `is_active` | ToggleSwitch |
| Actions | — | Modifier + Supprimer |

### Build Order

Single task — create 3 files. Links to `/admin/produits/${id}/edit` and `/admin/produits/new` for forward compatibility with S03.

### Verification Approach

1. `tsc --noEmit` — zero type errors
2. All 3 files exist
3. Correct imports of ToggleSwitch and ConfirmDialog
4. Server page queries `models` with `model_images(count)`
5. Links point to correct routes
6. Delete/toggle call correct API endpoints
7. Prix formatted with €