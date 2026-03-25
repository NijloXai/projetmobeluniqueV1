---
estimated_steps: 4
estimated_files: 3
skills_used: []
---

# T01: Build produits list page with table, toggle, and delete

**Slice:** S02 — Page Liste Produits
**Milestone:** M004

## Description

Create the complete `/admin/produits` page that lists all canapés in a table with toggle actif/inactif, price display, photo count, and Modifier/Supprimer actions. This mirrors the existing `src/app/admin/(protected)/tissus/` pattern exactly — a server component that fetches data and passes to a client component that handles interactions.

The sidebar already links to `/admin/produits`. The S01 API routes (`PUT /api/admin/models/:id` for toggle, `DELETE /api/admin/models/:id` for delete) are already in place.

## Steps

1. **Create `page.module.css`** — Copy from `src/app/admin/(protected)/tissus/page.module.css`. Remove swatch-specific styles (`.swatch`, `.swatchPlaceholder`). Keep all table, header, empty state, actions, name cell, badge, and button styles. Add a `.price` class for formatted price display.

2. **Create `ModelList.tsx`** (client component) — Mirror `src/app/admin/(protected)/tissus/FabricList.tsx` structure:
   - Accept `initialModels` prop typed as `(Model & { image_count: number })[]`
   - Table columns: Nom (name + slug in nameCell), Prix (formatted with `€`), Photos (image_count number), Actif (ToggleSwitch component), Actions (Modifier link + Supprimer button)
   - `handleToggle` calls `PUT /api/admin/models/${model.id}` with `{ is_active: !model.is_active }`, updates local state on success
   - `handleDelete` calls `DELETE /api/admin/models/${model.id}`, removes from local state and calls `router.refresh()` on success
   - `ConfirmDialog` for delete confirmation with French text: title "Supprimer ce produit ?", message "Le produit « {name} » sera définitivement supprimé…"
   - Empty state with message "Aucun produit dans le catalogue." and link to `/admin/produits/new`
   - Header with title "Produits", subtitle showing count, and "+ Nouveau produit" link to `/admin/produits/new`
   - Modifier link points to `/admin/produits/${model.id}/edit`
   - Format price: `new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(model.price)`

3. **Create `page.tsx`** (server component) — Mirror `src/app/admin/(protected)/tissus/page.tsx`:
   - Import `createClient` from `@/lib/supabase/server`
   - Query `supabase.from('models').select('*, model_images(id)').order('created_at', { ascending: false })`
   - Map results to add `image_count` (from `model_images` array length) and remove the `model_images` nested array
   - Pass to `<ModelList initialModels={models} />`

4. **Verify** — Run `npx tsc --noEmit` to confirm zero type errors. Verify all 3 files exist and contain the expected imports and API endpoints.

## Must-Haves

- [ ] Server page queries models with `model_images(id)` and computes `image_count` from array length
- [ ] Client component renders table with 5 columns: Nom (name+slug), Prix (€), Photos, Actif (ToggleSwitch), Actions
- [ ] Toggle calls `PUT /api/admin/models/${id}` with `{ is_active: !is_active }`
- [ ] Delete calls `DELETE /api/admin/models/${id}` with ConfirmDialog confirmation
- [ ] Empty state displays message and link to `/admin/produits/new`
- [ ] "+ Nouveau produit" button links to `/admin/produits/new`
- [ ] Modifier links to `/admin/produits/${id}/edit`
- [ ] Prix formatted with € using Intl.NumberFormat

## Verification

- `cd /Users/salah/Desktop/projetmobelunique && npx tsc --noEmit` — zero errors
- `test -f src/app/admin/\(protected\)/produits/page.tsx && test -f src/app/admin/\(protected\)/produits/ModelList.tsx && test -f src/app/admin/\(protected\)/produits/page.module.css`
- `grep -q "ToggleSwitch" src/app/admin/\(protected\)/produits/ModelList.tsx`
- `grep -q "ConfirmDialog" src/app/admin/\(protected\)/produits/ModelList.tsx`
- `grep -q "/api/admin/models/" src/app/admin/\(protected\)/produits/ModelList.tsx`
- `grep -q "/admin/produits/new" src/app/admin/\(protected\)/produits/ModelList.tsx`

## Inputs

- `src/app/admin/(protected)/tissus/page.tsx` — pattern to mirror for server component structure
- `src/app/admin/(protected)/tissus/FabricList.tsx` — pattern to mirror for client component with table, toggle, delete
- `src/app/admin/(protected)/tissus/page.module.css` — CSS base to copy and adapt
- `src/components/admin/ToggleSwitch.tsx` — reusable toggle component (import, do not modify)
- `src/components/admin/ConfirmDialog.tsx` — reusable confirm dialog (import, do not modify)
- `src/types/database.ts` — `Model` type definition
- `src/app/api/admin/models/route.ts` — reference for GET data shape (models with image_count)
- `src/app/api/admin/models/[id]/route.ts` — PUT (toggle) and DELETE endpoints

## Expected Output

- `src/app/admin/(protected)/produits/page.tsx` — server component that fetches models with image count
- `src/app/admin/(protected)/produits/ModelList.tsx` — client component with table, toggle, delete, empty state
- `src/app/admin/(protected)/produits/page.module.css` — adapted styles from tissus page
