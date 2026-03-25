# S02: Page Liste Produits

**Goal:** `/admin/produits` affiche un tableau admin avec tous les canapés, toggle actif/inactif, prix, nombre de photos, et liens Modifier/Supprimer.
**Demo:** Naviguer vers `/admin/produits` → un tableau liste les canapés avec colonnes Nom (name+slug), Prix (€), Photos (count), Actif (toggle), Actions (Modifier link + Supprimer button). Le toggle appelle `PUT /api/admin/models/:id`, Supprimer appelle `DELETE /api/admin/models/:id` avec dialogue de confirmation. L'état vide affiche un message et un lien vers `/admin/produits/new`.

## Must-Haves

- Tableau avec colonnes : Nom (name + slug), Prix (€), Photos (count), Actif (ToggleSwitch), Actions (Modifier + Supprimer)
- Toggle actif/inactif via `PUT /api/admin/models/:id` met à jour l'état local
- Suppression via `DELETE /api/admin/models/:id` avec `ConfirmDialog`
- État vide avec message et lien vers `/admin/produits/new`
- Lien "Nouveau produit" vers `/admin/produits/new`
- Liens Modifier vers `/admin/produits/${id}/edit`
- Prix formaté en euros (€)
- Server component fetch les données via Supabase server client (pattern tissus)

## Verification

- `cd /Users/salah/Desktop/projetmobelunique && npx tsc --noEmit` — zero type errors
- `test -f src/app/admin/\(protected\)/produits/page.tsx && test -f src/app/admin/\(protected\)/produits/ModelList.tsx && test -f src/app/admin/\(protected\)/produits/page.module.css` — all 3 files exist
- `grep -q "ToggleSwitch" src/app/admin/\(protected\)/produits/ModelList.tsx && grep -q "ConfirmDialog" src/app/admin/\(protected\)/produits/ModelList.tsx` — correct imports
- `grep -q "/api/admin/models/" src/app/admin/\(protected\)/produits/ModelList.tsx` — API calls present
- `grep -q "/admin/produits/new" src/app/admin/\(protected\)/produits/ModelList.tsx` — new product link
- `grep -q '€' src/app/admin/\(protected\)/produits/ModelList.tsx` — prix formatted with €

## Observability / Diagnostics

- **Runtime signals:** Toggle and delete actions hit `/api/admin/models/:id` — network tab shows PUT (toggle) and DELETE requests with status codes. Console errors surface fetch failures.
- **Inspection surfaces:** The rendered table row count matches `models.length`; the subtitle shows the exact count. Empty state is a clear visual signal of zero data.
- **Failure visibility:** Failed toggle silently does nothing (state doesn't flip); failed delete silently cancels (model stays in list). Network 4xx/5xx in devtools confirm the failure.
- **Redaction:** No secrets are displayed — only model metadata (name, slug, price, image count).

## Tasks

- [x] **T01: Build produits list page with table, toggle, and delete** `est:30m`
  - Why: This is the sole task for S02 — creates the complete `/admin/produits` page mirroring the tissus list pattern with model-specific columns.
  - Files: `src/app/admin/(protected)/produits/page.tsx`, `src/app/admin/(protected)/produits/ModelList.tsx`, `src/app/admin/(protected)/produits/page.module.css`
  - Do: Create server page that queries `models` with `model_images(id)` via Supabase server client, computes `image_count` per model, passes to `ModelList` client component. ModelList renders table with Nom (name+slug), Prix (€), Photos (image_count), Actif (ToggleSwitch), Actions (Modifier link + Supprimer with ConfirmDialog). Copy CSS from `src/app/admin/(protected)/tissus/page.module.css`, remove swatch-specific styles. **Important:** The GET models API returns flat `image_count` but the server page queries Supabase directly — must compute count from `model_images` array length.
  - Verify: `npx tsc --noEmit` passes and all 3 files exist with correct imports
  - Done when: `/admin/produits` renders a complete table with all columns, toggle calls PUT, delete calls DELETE with confirmation, empty state shows message, links point to correct routes

## Files Likely Touched

- `src/app/admin/(protected)/produits/page.tsx`
- `src/app/admin/(protected)/produits/ModelList.tsx`
- `src/app/admin/(protected)/produits/page.module.css`
