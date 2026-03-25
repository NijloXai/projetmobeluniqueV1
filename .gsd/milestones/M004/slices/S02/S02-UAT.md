# S02: Page Liste Produits — UAT

**Milestone:** M004
**Written:** 2026-03-24

## UAT Type

- UAT mode: mixed (artifact-driven verification + live-runtime test cases)
- Why this mode is sufficient: Static checks confirm file structure, imports, and type safety. Live-runtime checks confirm the page renders correctly and interactions (toggle, delete) hit the correct API endpoints.

## Preconditions

- Dev server running (`npm run dev` or `npx next dev --turbopack`)
- Admin logged in at `/admin` (Supabase Auth session active)
- At least 2 models exist in the `models` table (one active, one inactive) with varying image counts
- S01 API routes deployed (`/api/admin/models` CRUD functional)

## Smoke Test

Navigate to `/admin/produits` → a table with at least one row appears, showing model name, price in euros, photo count, active toggle, and Modifier/Supprimer buttons.

## Test Cases

### 1. Table renders with correct columns

1. Navigate to `/admin/produits`
2. Verify the page title is "Produits"
3. Verify the subtitle shows the correct count (e.g. "2 produits dans le catalogue")
4. Verify the table has 5 column headers: Nom, Prix (€), Photos, Actif, Actions
5. **Expected:** Each row shows: model name with slug below (monospace), price formatted in euros (e.g. "1 200,00 €"), image count number, a toggle switch, and Modifier + Supprimer buttons

### 2. Prix formatting

1. Navigate to `/admin/produits`
2. Find a model with price 1500.00
3. **Expected:** The price column shows "1 500,00 €" (French locale formatting with space thousands separator)

### 3. Toggle active/inactive

1. Navigate to `/admin/produits`
2. Open browser devtools Network tab
3. Find a model that is currently active (toggle is ON)
4. Click the toggle switch
5. **Expected:** 
   - A PUT request is sent to `/api/admin/models/{id}` with body `{"is_active": false}`
   - The toggle visually flips to OFF
   - The photo count remains unchanged (not reset to 0)
   - The subtitle count remains the same (model is still in the list)

### 4. Toggle back to active

1. Continue from test 3 (model is now inactive)
2. Click the toggle switch again
3. **Expected:**
   - A PUT request is sent to `/api/admin/models/{id}` with body `{"is_active": true}`
   - The toggle visually flips back to ON

### 5. Delete model with confirmation

1. Navigate to `/admin/produits`
2. Note the current model count in the subtitle
3. Click "Supprimer" on any model
4. **Expected:** A confirmation dialog appears with title "Supprimer ce produit ?" and a message mentioning the model name with the text "irréversible"
5. Click "Supprimer" in the dialog
6. **Expected:**
   - A DELETE request is sent to `/api/admin/models/{id}`
   - The model row disappears from the table
   - The subtitle count decreases by 1

### 6. Cancel delete

1. Navigate to `/admin/produits`
2. Click "Supprimer" on any model
3. **Expected:** Confirmation dialog appears
4. Click cancel (close the dialog without confirming)
5. **Expected:** The model remains in the table, no DELETE request is sent

### 7. Modifier link navigation

1. Navigate to `/admin/produits`
2. Click "Modifier" on any model
3. **Expected:** Browser navigates to `/admin/produits/{model-id}/edit` (this page may not exist yet until S03 is complete — verify the URL is correct in the browser address bar)

### 8. Nouveau produit link

1. Navigate to `/admin/produits`
2. Click "+ Nouveau produit" in the header
3. **Expected:** Browser navigates to `/admin/produits/new` (this page may not exist yet until S03 is complete — verify the URL is correct)

## Edge Cases

### Empty state (no models)

1. Delete all models from the database (or test with an empty `models` table)
2. Navigate to `/admin/produits`
3. **Expected:** 
   - The subtitle shows "0 produit dans le catalogue" (singular)
   - Instead of a table, a centered message says "Aucun produit dans le catalogue."
   - A "Créer le premier produit" button/link appears, pointing to `/admin/produits/new`

### Single model (singular subtitle)

1. Ensure exactly 1 model exists in the database
2. Navigate to `/admin/produits`
3. **Expected:** The subtitle shows "1 produit dans le catalogue" (singular, no 's')

### Toggle during pending request

1. Navigate to `/admin/produits`
2. Click a toggle switch
3. Immediately click the same toggle again before the first request completes
4. **Expected:** The second click is ignored (toggle is disabled during the pending request)

### Model with zero images

1. Create a model with no images in `model_images`
2. Navigate to `/admin/produits`
3. **Expected:** The Photos column shows "0" for that model

## Failure Signals

- Table doesn't render → check browser console for React errors, check Network tab for failed Supabase query
- Toggle doesn't flip → check Network tab for PUT response status (should be 200), check console for fetch errors
- Delete doesn't remove row → check Network tab for DELETE response status (should be 204), check console for errors
- Price shows "NaN" or raw number → `Intl.NumberFormat` not applied correctly
- Photo count shows "[object Object]" → `image_count` computation failed in server component
- Page shows 404 → route group `(protected)` not matching, check file location

## Not Proven By This UAT

- That disabled models are actually hidden from public API (covered by RLS policies, validated in M001)
- That the Modifier link leads to a working edit form (S03 scope)
- That the "+ Nouveau produit" link leads to a working creation form (S03 scope)
- Error handling UX (no toast/error messages for failed toggle/delete — silent failure by design)
- Responsive/mobile layout behavior
- Performance with large model counts (>100)

## Notes for Tester

- The Modifier and Nouveau produit links will return 404 until S03 is implemented — this is expected. Only verify the URL is correct.
- Price formatting depends on the browser locale for `Intl.NumberFormat('fr-FR')` — it should always show French formatting regardless of browser locale since the locale is hardcoded.
- The toggle preserves `image_count` locally because the PUT API response doesn't include it. If you see the photo count change to 0 after toggling, that's a bug.
