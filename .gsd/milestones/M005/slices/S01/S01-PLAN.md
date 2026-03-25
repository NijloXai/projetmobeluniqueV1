# S01: Admin IA Generation (generate → validate → publish)

**Slice of:** M005 — Génération IA
**Risk:** High
**Dependencies:** none (merges M004 as first task)
**Requirements:** R008 (primary), R016 (primary), R010 (supporting)

## What This Slice Delivers

A complete admin IA generation workflow: the admin navigates to `/admin/produits/[id]/edit`, sees a new "Génération IA" section below Mode Classique. They select a fabric, see a matrix of model angles, and can generate mock AI visuals (one at a time or all at once). Generated visuals can be validated, published, or regenerated. Bulk actions "Valider tout" and "Publier tout" are available. Published visuals automatically appear in the existing public API.

## Tasks

### T01 — Merge M004 + install sharp
- [x] Merge M004 code into M005 worktree to get ModelForm, produits pages, admin visuals API
- [x] `npm install sharp` (explicit dependency for mock image generation)
- [x] `tsc --noEmit` clean after merge

### T02 — IA service abstraction (src/lib/ai/)
- `src/lib/ai/types.ts` — `IAService` interface with `generate()` and `addWatermark()`
- `src/lib/ai/mock.ts` — Mock using sharp: solid color background + text overlay (model name, fabric name, angle)
- `src/lib/ai/nano-banana.ts` — Stub that throws "NANO_BANANA_API_KEY non configurée"
- `src/lib/ai/index.ts` — Factory: returns mock when env var absent, stub when present
- `src/lib/ai/prompts.ts` — Template functions for generate (back-office) and simulate (salon)

### T03 — Admin API routes
- `POST /api/admin/generate` — generate one visual (model_id, model_image_id, fabric_id)
- `POST /api/admin/generate-all` — generate all angles for model + fabric
- `PUT /api/admin/visuals/[id]/validate` — set is_validated=true
- `PUT /api/admin/visuals/[id]/publish` — set is_published=true (must be validated)
- `PUT /api/admin/visuals/bulk-validate` — validate multiple visuals
- `PUT /api/admin/visuals/bulk-publish` — publish multiple validated visuals
- All routes use `requireAdmin()` + standard error handling pattern

### T04 — IAGenerationSection component + ModelForm integration
- Extract to `src/app/admin/(protected)/produits/IAGenerationSection.tsx`
- Fabric selector dropdown, angle matrix grid, status badges (généré/validé/publié)
- Generate, validate, publish, regenerate buttons per visual
- "Générer tout", "Valider tout", "Publier tout" bulk actions
- Wire into ModelForm.tsx as Section 3 (below Mode Classique)
- CSS Module styles in form.module.css

### T05 — Verification
- `tsc --noEmit` passes
- Structural verification: all expected files exist with correct exports
- API route verification via curl or equivalent

## Success Criteria

1. All 5 new files in `src/lib/ai/` exist and export correctly
2. 6 new API route files created under `/api/admin/`
3. `IAGenerationSection.tsx` renders in ModelForm edit mode when photos exist
4. Fabric selector shows all fabrics, angle matrix shows all model_images
5. Generate creates a row in generated_visuals with is_validated=false, is_published=false
6. Generated image is a real PNG in generated-visuals bucket (not an empty file)
7. Validate sets is_validated=true, publish sets is_published=true
8. Publish fails if not validated (403)
9. Regeneration deletes old row+file, creates new one
10. Bulk validate/publish affect correct rows
11. `tsc --noEmit` — zero errors

## Observability / Diagnostics

### Runtime Signals
- All API routes log errors with route-prefixed tags: `[POST /api/admin/generate]`, `[PUT /api/admin/visuals/:id/validate]`, etc.
- IA service factory logs which provider is active on initialization: `[IA] Using mock provider` or `[IA] Using NanoBanana provider`
- Generate endpoint logs generation duration and output file size for performance tracking

### Inspection Surfaces
- `GET /api/admin/models/[id]/visuals` — returns full visual list with fabric join; inspect `is_validated` / `is_published` state per visual
- `node -e "require('./src/lib/ai').getIAService()"` — verify which IA provider is active
- `npx tsc --noEmit` — catches all type regressions across the full codebase
- Network tab on `/admin/produits/[id]/edit` — all generate/validate/publish API calls visible

### Failure Visibility
- Generate errors surface in the IAGenerationSection UI via error state display
- Publish-before-validate returns 403 with structured JSON `{ error: "..." }` — verifiable via curl
- Mock generation failures (sharp errors) propagate as 500 with descriptive message

### Redaction Constraints
- No secrets in logs; `NANO_BANANA_API_KEY` presence checked but never logged
- Storage URLs are full Supabase public URLs — no redaction needed

## Verification

```bash
# [V01] TypeScript compiles clean
npx tsc --noEmit

# [V02] Key M004 files exist after merge
ls src/app/admin/\(protected\)/produits/ModelForm.tsx

# [V03] IA service files exist
ls src/lib/ai/types.ts src/lib/ai/mock.ts src/lib/ai/index.ts

# [V04] API routes exist
ls src/app/api/admin/generate/route.ts src/app/api/admin/generate-all/route.ts

# [V05] Sharp is installed and functional
node -e "const sharp = require('sharp'); console.log('sharp', sharp.versions.sharp)"

# [V06] Publish-before-validate returns 403 (failure-path check)
# Requires running server — verify via browser or curl during T05

# [V07] Sharp failure path produces descriptive error (diagnostic check)
node -e "require('sharp')('nonexistent.png').toBuffer().catch(e => { console.log('FAIL_PATH_OK:', e.constructor.name); process.exit(0) })"
```
