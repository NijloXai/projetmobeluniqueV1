# T03: Admin API routes for generate/validate/publish

**Slice:** S01 — Admin IA Generation
**Type:** Backend implementation
**Risk:** Low (follows established patterns from M003/M004)

## What

Create 6 admin API routes for the IA generation workflow. All follow the established `requireAdmin()` → validate → Supabase → error mapping pattern.

## Routes to Create

### `POST /api/admin/generate/route.ts`
Generate one visual for a specific (model_id, model_image_id, fabric_id) combination.
- requireAdmin
- Validate body: `{ model_id, model_image_id, fabric_id }`
- Fetch model (need slug for storage path), model_image (need view_type for prompt), fabric (need name for prompt)
- Call `iaService.generate({ modelName, fabricName, viewType, sourceImageUrl })`
- Handle upsert: check if visual exists for (model_image_id, fabric_id) → if yes, delete old row + old storage file
- Upload buffer to `generated-visuals` bucket at `{slug}/{fabric_id}-{model_image_id}.jpg` with upsert:true
- Get public URL
- Insert into generated_visuals with is_validated=false, is_published=false
- Return 201 with the new visual row

### `POST /api/admin/generate-all/route.ts`
Generate all angles for a model + fabric combination.
- requireAdmin
- Validate body: `{ model_id, fabric_id }`
- Fetch all model_images for model_id
- Loop: for each model_image, call the same generate logic as above
- Return 200 with array of created visuals

### `PUT /api/admin/visuals/[id]/validate/route.ts`
- requireAdmin
- Update generated_visuals set is_validated=true where id=param
- Return 200 with updated row

### `PUT /api/admin/visuals/[id]/publish/route.ts`
- requireAdmin
- Fetch visual, check is_validated=true (if not → 403 "Le rendu doit être validé avant publication")
- Update set is_published=true
- Return 200 with updated row

### `PUT /api/admin/visuals/bulk-validate/route.ts`
- requireAdmin
- Validate body: `{ visual_ids: string[] }`
- Update all matching visuals: set is_validated=true
- Return 200 with count

### `PUT /api/admin/visuals/bulk-publish/route.ts`
- requireAdmin
- Validate body: `{ visual_ids: string[] }`
- Only publish visuals that are already validated
- Update matching validated visuals: set is_published=true
- Return 200 with count (how many actually published)

## Patterns to Follow

From existing routes:
```typescript
import { requireAdmin } from '@/lib/supabase/admin'
// ...
const { supabase, error: authError } = await requireAdmin()
if (authError) return authError
```

Storage path convention (D018):
```typescript
const storagePath = `${model.slug}/${fabricId}-${modelImageId}.jpg`
```

Always .jpg extension for generated visuals (avoid extension mismatch on regeneration).

## Verification

```bash
# All route files exist
ls src/app/api/admin/generate/route.ts
ls src/app/api/admin/generate-all/route.ts
ls src/app/api/admin/visuals/*/validate/route.ts
ls src/app/api/admin/visuals/*/publish/route.ts
ls src/app/api/admin/visuals/bulk-validate/route.ts
ls src/app/api/admin/visuals/bulk-publish/route.ts

# Type check
npx tsc --noEmit
```

## Exit Criteria

- 6 new route files created
- All use requireAdmin + standard error handling
- Generate handles upsert (delete old + insert new)
- Publish enforces validation prerequisite
- Bulk routes accept visual_ids array
- `tsc --noEmit` passes
