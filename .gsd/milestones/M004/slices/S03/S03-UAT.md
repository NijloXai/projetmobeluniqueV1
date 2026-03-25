# S03: Formulaire Produit + Photos Multi-Angles — UAT

**Milestone:** M004
**Written:** 2026-03-24

## UAT Type

- UAT mode: mixed (artifact-driven verification + live-runtime required for full form flows)
- Why this mode is sufficient: Structural verification (tsc, file existence, grep) confirms code correctness. Full runtime testing requires the dev server + Supabase to exercise API routes and photo upload flows.

## Preconditions

- `npm run dev` running (Next.js dev server on localhost:3000)
- Supabase project running (local or remote) with `models` and `model_images` tables
- Logged in as admin at `/admin` (valid Supabase auth session)
- At least one model already exists for edit-mode tests (create one first via test case 1)
- `model-photos` storage bucket exists in Supabase

## Smoke Test

Navigate to `/admin/produits/new` — the product creation form renders with fields: Nom, Slug, Description, Prix, Dimensions, URL Shopify, Actif checkbox, and a submit button. No photo section visible.

## Test Cases

### 1. Créer un nouveau produit

1. Navigate to `/admin/produits/new`
2. Enter "Canapé Stockholm" in the Nom field
3. Observe the Slug field auto-populates with `canape-stockholm`
4. Enter a description: "Canapé 3 places scandinave"
5. Enter price: 1299
6. Enter dimensions: "220x90x85 cm"
7. Leave URL Shopify empty, keep Actif checked
8. Click "Enregistrer"
9. **Expected:** Redirect to `/admin/produits/{new-id}/edit`. The form is pre-filled with the saved data. A photo section now appears below the info fields.

### 2. Modifier le slug manuellement

1. On `/admin/produits/new`, enter "Canapé Oslo" in Nom
2. Slug auto-generates to `canape-oslo`
3. Manually edit the Slug field to `oslo-custom`
4. Change the Nom to "Canapé Oslo Deluxe"
5. **Expected:** Slug stays `oslo-custom` — manual edit prevents auto-generation override
6. Click "Enregistrer"
7. **Expected:** Product saved with slug `oslo-custom`

### 3. Éditer les informations d'un produit existant

1. Navigate to `/admin/produits/{id}/edit` for an existing product
2. All fields pre-filled with saved values
3. Change the price from 1299 to 1499
4. Change description text
5. Click "Enregistrer"
6. **Expected:** Redirect to `/admin/produits` (list page). Navigate back to edit — updated values persisted.

### 4. Uploader une photo avec vue

1. Navigate to `/admin/produits/{id}/edit`
2. In the photo section, click on the upload area or "Parcourir" to select an image file (< 5MB)
3. Enter "face" in the Vue (view_type) text input
4. Click "Ajouter"
5. **Expected:** Photo appears in the grid below with thumbnail, "face" label, sort_order 0. Upload area clears.

### 5. Uploader plusieurs photos et vérifier le sort_order

1. Upload a second photo with view_type "profil-gauche"
2. Upload a third photo with view_type "profil-droit"
3. **Expected:** Grid shows 3 photos with sort_order 0, 1, 2 respectively. Each card shows thumbnail, view_type label, and sort_order number.

### 6. Réordonner les photos

1. On the second photo card (sort_order 1, "profil-gauche"), click the up arrow (↑)
2. **Expected:** "profil-gauche" moves to sort_order 0, "face" moves to sort_order 1. Arrow buttons briefly disabled during reorder.
3. On the last photo (sort_order 2, "profil-droit"), click the up arrow
4. **Expected:** "profil-droit" moves to sort_order 1, "face" moves to sort_order 2
5. On the first photo (sort_order 0), verify the up arrow is disabled
6. On the last photo (sort_order 2), verify the down arrow is disabled

### 7. Supprimer une photo

1. On any photo card, click the delete button (🗑)
2. **Expected:** Browser confirm dialog appears: "Supprimer cette photo ?"
3. Click OK
4. **Expected:** Photo removed from grid. Remaining photos still display correctly.
5. Click the delete button on another photo, then click Cancel
6. **Expected:** Photo NOT removed — confirm dialog respected.

### 8. Validation des champs obligatoires

1. Navigate to `/admin/produits/new`
2. Leave Nom empty, click "Enregistrer"
3. **Expected:** Inline validation error on Nom field (zod required)
4. Enter a name but set price to 0 or negative
5. **Expected:** Inline validation error on Prix field (must be positive)
6. Enter a name but leave price empty
7. **Expected:** Inline validation error on Prix field (required)

## Edge Cases

### Upload fichier trop lourd (> 5MB)

1. In photo section, select an image file larger than 5MB
2. **Expected:** ImageUpload component blocks the file — error message shown. No API call made.

### Upload sans view_type

1. Select a valid image file but leave the Vue input empty
2. Click "Ajouter"
3. **Expected:** Error message shown (view_type required). No upload sent.

### Upload sans fichier sélectionné

1. Leave the image upload empty, enter a view_type, click "Ajouter"
2. **Expected:** Error message shown (file required). No upload sent.

### Produit inexistant (edit page 404)

1. Navigate to `/admin/produits/999999/edit` (non-existent ID)
2. **Expected:** 404 page rendered (Next.js notFound)

### Photo section hidden en mode création

1. Navigate to `/admin/produits/new`
2. **Expected:** No photo section visible. Only the info fields and submit button.

### Champ prix avec texte non-numérique

1. In the price field, try entering "abc"
2. **Expected:** Field uses `valueAsNumber` — browser number input prevents non-numeric entry. If bypassed, zod validation catches it.

## Failure Signals

- TypeScript compilation errors: `npx tsc --noEmit` returns non-zero exit code
- Form renders blank or crashes: React error boundary or white screen on `/admin/produits/new` or `/admin/produits/[id]/edit`
- API errors: Red error banner at form top saying "Erreur serveur" or "Erreur de connexion"
- Photos not displaying: Broken image thumbnails in the grid (storage URL issue)
- Reorder not working: sort_order values don't change after clicking arrows, or photos jump to wrong positions
- Slug not auto-generating: Slug field stays empty when typing in Nom field

## Not Proven By This UAT

- Mode classique (upload rendered visuals with fabric selection) — that's S04
- Supabase RLS enforcement for admin-only writes — covered by M001/R002
- Storage bucket permissions and signed URLs — infrastructure concern
- Concurrent editing by multiple admins
- Mobile responsiveness of the form layout (not specified in requirements)

## Notes for Tester

- The photo section only appears after creating the product (edit mode). This is intentional — the model ID is needed to build the API upload path.
- Auto-slug uses `slugify()` which handles French accents: "Canapé Bleu" → `canape-bleu`.
- After uploading photos, check the Supabase `model-photos` bucket to verify files are stored at `{slug}/{view_type}-{sort_order}.{ext}`.
- The form submits JSON (not FormData) for info fields. Photos use FormData separately. Check Network tab to verify correct content types.
- Reorder uses two parallel PUT requests (Promise.all). If one fails, the state may be inconsistent — refresh the page to see the server's truth.
