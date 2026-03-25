# S01: Admin IA Generation (generate → validate → publish) — UAT

**Milestone:** M005
**Written:** 2026-03-25T02:11:40.434Z

## Preconditions

- Admin is logged in at `/admin`
- At least one model exists with multiple photos (angles) uploaded
- At least one active fabric exists in the system
- Dev server running at localhost:3000
- No `NANO_BANANA_API_KEY` env var set (mock mode)

## Test Cases

### TC01 — IAGenerationSection renders in edit mode
1. Navigate to `/admin/produits`
2. Click "Modifier" on a model that has uploaded photos
3. **Expected:** Section 3 "Génération IA" appears below the photos section
4. **Expected:** A fabric selector dropdown is visible with all active fabrics listed
5. Navigate to `/admin/produits/new`
6. **Expected:** Section 3 does NOT appear (no photos uploaded yet)

### TC02 — Generate single visual
1. In the edit form, select a fabric from the dropdown
2. **Expected:** Angle matrix grid appears showing all uploaded model images (angles)
3. Click "Générer" on one angle card
4. **Expected:** A mock visual appears — colored rectangle with model name, fabric name, and angle label
5. **Expected:** Status badge shows "Généré" (not validated, not published)
6. Check Supabase `generated_visuals` table: new row with `is_validated=false`, `is_published=false`
7. Check Supabase Storage `generated-visuals` bucket: file exists at `{slug}/{fabric_id}-{model_image_id}.ext`

### TC03 — Generate all angles
1. Select a fabric, click "Générer tout"
2. **Expected:** Mock visuals appear for ALL angles of the selected fabric
3. **Expected:** All show "Généré" status badge
4. Check `generated_visuals` table: one row per angle, all `is_validated=false`, `is_published=false`

### TC04 — Validate single visual
1. Click "Valider" on one generated visual
2. **Expected:** Badge changes to "Validé" (green)
3. Check DB: `is_validated=true`, `is_published=false`

### TC05 — Publish single visual
1. Click "Publier" on the validated visual from TC04
2. **Expected:** Badge changes to "Publié" (blue)
3. Check DB: `is_validated=true`, `is_published=true`
4. Call `GET /api/models/{slug}/visuals` — published visual appears in response

### TC06 — Publish before validate (403 guard)
1. Generate a new visual (not validated)
2. Attempt to publish directly via `PUT /api/admin/visuals/{id}/publish`
3. **Expected:** 403 response with error message
4. **Expected:** Visual remains unpublished in DB

### TC07 — Regenerate existing visual
1. Take a published visual from TC05
2. Click "Régénérer"
3. **Expected:** Old visual is deleted (DB row + storage file)
4. **Expected:** New visual appears with "Généré" status (reset to unvalidated)
5. Check DB: old row gone, new row with `is_validated=false`, `is_published=false`
6. Check storage: old file replaced with new file

### TC08 — Bulk validate
1. Generate multiple visuals (via "Générer tout")
2. Click "Valider tout"
3. **Expected:** All generated visuals change to "Validé" status
4. Check DB: all `is_validated=true`

### TC09 — Bulk publish
1. After TC08, click "Publier tout"
2. **Expected:** All validated visuals change to "Publié" status
3. Check DB: all `is_validated=true`, `is_published=true`
4. Call `GET /api/models/{slug}/visuals` — all published visuals appear

### TC10 — Bulk publish skips unvalidated
1. Generate new visuals (not validated) alongside validated ones
2. Click "Publier tout"
3. **Expected:** Only validated visuals get published
4. **Expected:** Unvalidated visuals remain unchanged

### TC11 — IA service factory provider switch
1. With no `NANO_BANANA_API_KEY` set, check server logs on startup
2. **Expected:** `[IA] Using mock provider` appears in logs
3. Set `NANO_BANANA_API_KEY=test` in env
4. Restart server, check logs
5. **Expected:** `[IA] Using NanoBanana provider` appears
6. Attempt to generate a visual
7. **Expected:** Error from NanoBanana stub: "Service Nano Banana 2 non configuré"

### TC12 — All API routes require admin auth
1. Log out of admin session
2. Call each of the 6 API routes without auth:
   - POST /api/admin/generate
   - POST /api/admin/generate-all
   - PUT /api/admin/visuals/{id}/validate
   - PUT /api/admin/visuals/{id}/publish
   - PUT /api/admin/visuals/bulk-validate
   - PUT /api/admin/visuals/bulk-publish
3. **Expected:** All return 401 Unauthorized

## Edge Cases

- **No fabrics exist:** Section 3 should show empty fabric selector with appropriate message
- **Model with no photos:** Section 3 should not render (photos are required for angle matrix)
- **Generate same fabric+angle twice:** Should upsert — delete old row+file, create new
- **Rapid successive generates:** Should handle gracefully (no duplicate rows)
