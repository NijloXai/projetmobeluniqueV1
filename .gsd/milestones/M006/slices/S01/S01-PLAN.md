# S01: Export ZIP — API + UI

**Goal:** Livrer la feature export ZIP complète : merge du code M005, API route streaming avec archiver, bouton UI avec loader et gestion du cas vide.
**Demo:** L'admin clique Exporter ZIP dans /admin/produits/[id]/edit, le ZIP se télécharge avec les bons fichiers nommés {slug}-{fabric}-{angle}.jpg. Message si aucun rendu validé.

## Must-Haves

- GET /api/admin/visuals/[modelId]/export retourne un ZIP valide avec Content-Type application/zip\n- Fichiers dans le ZIP nommés {slug}-{fabric-slug}-{view_type}.jpg\n- 401 sans authentification admin\n- JSON message français si aucun rendu validé pour ce modèle\n- Bouton 'Exporter ZIP' visible dans ModelForm.tsx (section en haut ou après la section IA)\n- Loader visible pendant le téléchargement\n- tsc --noEmit passe avec zéro erreurs

## Proof Level

- This slice proves: integration — vérifié par tsc + curl + unzip -t + vérification UI

## Integration Closure

Le bouton UI dans ModelForm appelle GET /api/admin/visuals/[modelId]/export. L'API query les generated_visuals (is_validated=true) avec les relations fabric et model_image, fetch chaque image depuis le bucket public, les assemble dans un ZIP streamé via archiver, et le navigateur télécharge le fichier.

## Verification

- Aucun — pas de logs ou metrics additionnels requis.

## Tasks

- [x] **T01: Merge M005 code + install archiver** `est:5min`
  1. Merge branch milestone/M005 into milestone/M006 worktree\n2. Verify key files exist: ModelForm.tsx, IAGenerationSection.tsx, generated_visuals routes, ai/ service\n3. npm install archiver @types/archiver\n4. Verify tsc --noEmit still passes after merge + install
  - Files: `package.json`, `package-lock.json`
  - Verify: git log --oneline -3 shows M005 commits; ls src/app/admin/\(protected\)/produits/ModelForm.tsx confirms presence; npm ls archiver shows installed; npx tsc --noEmit passes

- [x] **T02: API route GET /api/admin/visuals/[modelId]/export** `est:15min`
  1. Create src/app/api/admin/visuals/[modelId]/export/route.ts\n2. Auth guard via requireAdmin()\n3. Add export const runtime = 'nodejs' (archiver needs CJS)\n4. Query generated_visuals where model_id = modelId AND is_validated = true, join fabric (name, slug) and model_image (view_type)\n5. Also fetch model (slug) for file naming\n6. If no validated visuals: return JSON { error: 'Aucun rendu validé pour ce produit.' } with 404\n7. Create archiver('zip', { store: true }) — no compression for JPEGs\n8. For each visual: fetch(generated_image_url), pipe buffer into archive as {model.slug}-{slugify(fabric.name)}-{model_image.view_type}.jpg\n9. Finalize archive, return new Response(Readable.toWeb(archive), headers: Content-Type application/zip, Content-Disposition attachment)\n10. Handle fetch errors gracefully (skip unfetchable images, log warning)
  - Files: `src/app/api/admin/visuals/[modelId]/export/route.ts`
  - Verify: npx tsc --noEmit passes; curl with auth cookie returns ZIP; unzip -t shows correct file names; curl without auth returns 401; curl with modelId having no validated visuals returns JSON error

- [x] **T03: Export ZIP button in ModelForm UI** `est:10min`
  1. In ModelForm.tsx, add an 'Exporter ZIP' button after the IA generation section (or in a dedicated export section)\n2. Button visible only in edit mode when model exists\n3. On click: set exporting state, fetch GET /api/admin/visuals/{model.id}/export\n4. If response is application/zip: create Blob, trigger download via URL.createObjectURL + anchor click\n5. If response is JSON (error case): show alert/message with the error text\n6. Reset exporting state after completion\n7. Button shows loader/disabled state while exporting\n8. Add CSS styles to form.module.css for the export button and section\n9. tsc --noEmit must pass
  - Files: `src/app/admin/(protected)/produits/ModelForm.tsx`, `src/app/admin/(protected)/produits/form.module.css`
  - Verify: npx tsc --noEmit passes; visual inspection of button in browser (manual); grep confirms exporting state + fetch + blob download logic in ModelForm.tsx

- [x] **T04: End-to-end verification** `est:10min`
  1. Run npx tsc --noEmit — zero errors\n2. Start dev server (or reuse existing on port 3000)\n3. Test API route: curl without auth → 401, curl with nonexistent model → 404 or empty\n4. If test data exists: curl with auth + valid modelId → verify Content-Type application/zip, save to file, unzip -t to verify structure\n5. Verify file naming pattern in ZIP matches {slug}-{fabric-slug}-{view_type}.jpg\n6. Verify ModelForm.tsx has the export button with loader state\n7. Run scripts/verify-e2e-m005.ts to confirm no regression on M005 functionality
  - Verify: npx tsc --noEmit exits 0; curl -I returns 401 without auth; curl with auth returns application/zip or appropriate JSON error; unzip -t shows correctly named files (if test data available); grep ModelForm.tsx confirms Exporter ZIP button exists

## Files Likely Touched

- package.json
- package-lock.json
- src/app/api/admin/visuals/[modelId]/export/route.ts
- src/app/admin/(protected)/produits/ModelForm.tsx
- src/app/admin/(protected)/produits/form.module.css
