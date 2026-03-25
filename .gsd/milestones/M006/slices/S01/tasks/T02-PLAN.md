---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T02: API route GET /api/admin/visuals/[modelId]/export

1. Create src/app/api/admin/visuals/[modelId]/export/route.ts\n2. Auth guard via requireAdmin()\n3. Add export const runtime = 'nodejs' (archiver needs CJS)\n4. Query generated_visuals where model_id = modelId AND is_validated = true, join fabric (name, slug) and model_image (view_type)\n5. Also fetch model (slug) for file naming\n6. If no validated visuals: return JSON { error: 'Aucun rendu validé pour ce produit.' } with 404\n7. Create archiver('zip', { store: true }) — no compression for JPEGs\n8. For each visual: fetch(generated_image_url), pipe buffer into archive as {model.slug}-{slugify(fabric.name)}-{model_image.view_type}.jpg\n9. Finalize archive, return new Response(Readable.toWeb(archive), headers: Content-Type application/zip, Content-Disposition attachment)\n10. Handle fetch errors gracefully (skip unfetchable images, log warning)

## Inputs

- `src/lib/supabase/admin.ts (requireAdmin)`
- `src/lib/utils.ts (slugify)`
- `src/types/database.ts (types)`

## Expected Output

- `src/app/api/admin/visuals/[modelId]/export/route.ts`

## Verification

npx tsc --noEmit passes; curl with auth cookie returns ZIP; unzip -t shows correct file names; curl without auth returns 401; curl with modelId having no validated visuals returns JSON error
