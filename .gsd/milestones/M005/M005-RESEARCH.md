# M005: Génération IA — Research

**Date:** 2026-03-24
**Status:** Complete

## Summary

M005 builds the AI generation layer on top of the well-established admin CRUD patterns from M003/M004. The work decomposes into three natural slices: (1) a backend IA service abstraction with mock + prompt config + admin API routes for generate/validate/publish, (2) a Section 3 UI in the existing ModelForm for generation/validation/publication workflow, and (3) a public `/api/simulate` endpoint.

The codebase is mature and consistent — four milestones have established clear patterns for API routes (`requireAdmin` → Zod → Supabase → error mapping), admin UI (react-hook-form + CSS Modules), and storage management (bucket upload → public URL → DB insert). The `generated_visuals` table, types, schemas, and bucket already exist. The `ModelForm.tsx` already has a "Mode Classique" section that inserts into `generated_visuals` with `is_validated=true, is_published=true` — the IA section operates the same table with `is_validated=false, is_published=false` initial state and explicit admin validation/publish flow.

The primary technical challenge is the IA service abstraction — designing a clean interface that mocks realistically now and switches to Nano Banana 2 later via env var. The mock must generate placeholder images (not just return a URL) to test the full storage pipeline. `sharp` is already installed and provides the image manipulation needed for mock placeholders and watermarking.

## Recommendation

**Build the IA service abstraction first** (slice 1) — it unblocks both the admin UI and the simulate API. Start with the mock implementation, then layer the admin routes and UI on top.

**Reuse existing patterns extensively.** The visuals POST route from M004/S04 already handles FormData upload to `generated-visuals` bucket. The generate routes will follow the same `requireAdmin` → validate → Supabase pattern. The UI section 3 slots into ModelForm.tsx alongside the existing sections.

**Keep the prompt system simple but configurable.** A `src/lib/ai/prompts.ts` file with template functions that accept model/fabric/angle params, returnable as strings. No database-backed prompt management — that's overbuilt for mock phase.

**Use sharp for mock image generation and watermarking.** It's already a dependency (via Next.js image optimization). It can composite text overlays on solid color backgrounds for mock rendus, and add watermark text for the simulate endpoint.

## Implementation Landscape

### Key Files

**Existing (to read/extend):**
- `src/types/database.ts` — `GeneratedVisual`, `GeneratedVisualInsert`, `GeneratedVisualUpdate` types already defined
- `src/lib/schemas.ts` — `generatedVisualSchema` already defined, needs input schemas for generate/validate/publish
- `src/app/api/admin/models/[id]/visuals/route.ts` — existing GET (list visuals) + POST (mode classique). IA generation uses new separate routes, not this POST.
- `src/app/api/admin/models/[id]/visuals/[visualId]/route.ts` — existing DELETE. Needs PUT for validate/publish.
- `src/app/admin/(protected)/produits/ModelForm.tsx` — 721 lines. Section 3 (IA generation) needs to be added after the Mode Classique section.
- `src/app/api/models/[slug]/visuals/route.ts` — public GET, filters `is_validated=true AND is_published=true AND fabric.is_active=true`. Already works for published visuals.
- `src/lib/supabase/admin.ts` — `requireAdmin()` auth helper
- `src/lib/utils.ts` — `slugify()`, `extractStoragePath()`, `calculatePrice()`, `formatPrice()`
- `src/components/admin/ImageUpload.tsx` — reusable but not needed for IA flow (IA generates, admin doesn't upload)
- `src/components/admin/ConfirmDialog.tsx` — reusable for confirm actions

**New files to create:**
- `src/lib/ai/types.ts` — IA service interface (`IAService`, `GenerateRequest`, `GenerateResult`)
- `src/lib/ai/mock.ts` — Mock implementation using sharp for placeholder generation
- `src/lib/ai/nano-banana.ts` — Stub for future real implementation (export but throw "not configured")
- `src/lib/ai/index.ts` — Factory: returns mock or real based on `NANO_BANANA_API_KEY` env var
- `src/lib/ai/prompts.ts` — Configurable prompt templates for generate (back-office) and simulate (salon)
- `src/app/api/admin/generate/route.ts` — POST: generate one visual (model_image_id + fabric_id)
- `src/app/api/admin/generate-all/route.ts` — POST: generate all angles for a model + fabric
- `src/app/api/admin/visuals/[id]/validate/route.ts` — PUT: set is_validated=true
- `src/app/api/admin/visuals/[id]/publish/route.ts` — PUT: set is_published=true
- `src/app/api/simulate/route.ts` — POST: public, accepts image + model/fabric, returns watermarked result
- Section 3 component (either inline in ModelForm or extracted to a separate component)

### Build Order

1. **IA service abstraction** (types + mock + factory + prompts) — Pure TypeScript, no API dependencies. Proves the interface works and the mock generates actual images via sharp. This is the foundation everything else builds on.

2. **Admin generate/validate/publish API routes** — Depends on (1). Follows existing API patterns. Four new routes: generate, generate-all, validate, publish. Also extends existing `[visualId]/route.ts` with PUT. Tests the full pipeline: generate → store in bucket → insert in DB → validate → publish → visible in public API.

3. **Section 3 UI in ModelForm** — Depends on (2). The UI calls the generate/validate/publish routes. Fabric selector (already loaded in Mode Classique), matrix view (angles × status), action buttons. Follows existing CSS Module patterns.

4. **Public simulate API** — Independent of (3) but depends on (1). Single POST route, uses the IA service mock, adds watermark text, returns binary image (not stored).

### Verification Approach

**Slice 1 (IA service):**
- `tsc --noEmit` passes — types are correct
- Unit test or manual: calling `iaService.generate(...)` returns a Buffer/Blob of a valid image
- `iaService.addWatermark(...)` returns an image with visible text overlay

**Slice 2 (Admin API routes):**
- POST `/api/admin/generate` with `model_id`, `model_image_id`, `fabric_id` → 201, row in `generated_visuals` with `is_validated=false, is_published=false`, image in `generated-visuals` bucket
- POST `/api/admin/generate-all` with `model_id`, `fabric_id` → 200, one row per model_image
- PUT `/api/admin/visuals/[id]/validate` → `is_validated=true`
- PUT `/api/admin/visuals/[id]/publish` → `is_published=true` (must be validated first)
- GET `/api/models/[slug]/visuals` only returns published+validated entries
- Regeneration: calling generate again for same `model_image_id + fabric_id` does upsert (UNIQUE constraint)

**Slice 3 (Section 3 UI):**
- Navigate to `/admin/produits/[id]/edit` → Section 3 visible when photos exist
- Select fabric → see matrix of angles with generate/status
- Click "Générer" on one angle → loading state → image appears (mock placeholder)
- Click "Générer tout" → all angles generate
- Click "Valider" → status changes to validated
- Click "Publier" → status changes to published
- Bulk actions: "Valider tout", "Publier tout"
- Regeneration replaces existing image

**Slice 4 (Simulate API):**
- POST `/api/simulate` with FormData (image file + model_id + fabric_id) → 200, returns image/jpeg with watermark text
- No auth required
- No row created in DB
- Response is binary image, not JSON

## Constraints

- **No Tailwind, no shadcn/ui** — Radix UI headless + CSS Modules only (D003)
- **French only** — all UI labels, error messages, button text in French (D008)
- **sharp already available** via Next.js but needs explicit import — it's bundled with `next` but may need `npm install sharp` if not resolvable directly. Verified: `node_modules/sharp` exists.
- **UNIQUE(model_image_id, fabric_id)** on `generated_visuals` — regeneration MUST handle conflict via upsert (delete old + insert new, or Supabase `.upsert()` with `onConflict`)
- **generated_visuals table has no prompt or AI metadata columns** — prompt/settings are ephemeral, not stored. If we need to track which prompt version generated which visual, that's a future migration.
- **ModelForm.tsx is already 721 lines** — Section 3 should ideally be extracted to a separate component (`IAGenerationSection.tsx`) to keep the form manageable.
- **Mode classique visuals coexist** — Section 3 shows IA-generated visuals alongside mode classique. Filter by source or show all with status badges.
- **The `generated_visuals` table has no `source` column** — mode classique inserts `is_validated=true, is_published=true`, IA inserts `is_validated=false, is_published=false`. The initial state IS the discriminator. No schema migration needed.

## Common Pitfalls

- **UNIQUE constraint on regeneration** — Calling generate for an existing (model_image_id, fabric_id) pair MUST upsert, not fail with 409. Strategy: delete existing row first, then insert new, OR use Supabase `.upsert()` with `onConflict: 'model_image_id,fabric_id'`. The upsert approach also needs to clean up the old file in storage before uploading the new one.

- **Storage path collision on regenerate** — The existing convention `{slug}/{fabric_id}-{model_image_id}.{ext}` means regeneration hits the same path. Using `upsert: true` on storage upload handles this. But if the extension changes (e.g., .png → .jpg), the old file remains. Best practice: always use .jpg for generated visuals.

- **Publish requires validation** — Business rule: `is_published` can only be set to `true` if `is_validated` is already `true`. The API must enforce this. Bulk "Publier tout" should only affect validated visuals.

- **ModelForm re-render scope** — Adding Section 3 with complex state (generation status per angle per fabric) to an already 721-line component risks re-render issues. Extract to `<IAGenerationSection modelId={...} images={images} />` with its own state.

- **Mock must produce actual images** — A mock that returns a hardcoded URL or empty buffer won't test the real pipeline. The mock must generate a real PNG/JPEG buffer (via sharp: solid color background + text overlay with model name, fabric name, angle) so the storage upload and DB insert work end-to-end.

- **simulate route must handle large uploads** — Client uploads a salon photo (could be 5-10MB). The route must set appropriate size limits and use streaming where possible. Next.js App Router routes handle FormData natively.

## Open Risks

- **ModelForm complexity** — At 721 lines + Section 3, the component may become hard to maintain. Mitigation: extract Section 3 to a dedicated component.
- **Nano Banana 2 API contract unknown** — We're designing a mock interface without knowing the real API. Mitigation: keep the interface minimal (input image + prompt → output image) and adapt when the real API is documented.
- **simulate latency with real IA** — Mock is instant, but real generation may take 5-30 seconds. The UI and API should be designed for async (loading states, timeouts) even if mock is sync.
- **No `source` column in generated_visuals** — Cannot distinguish mode classique from IA-generated visuals in queries. Mitigation: not needed for M005 (the UI shows all visuals with status badges). Can add later if needed.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Image placeholder generation | `sharp` (already installed) | Generates real images with text overlays, compositing, resize — no Canvas dependency needed |
| Watermark text overlay | `sharp` composite with SVG text | Simple, fast, no external dependency |
| Form state management | `react-hook-form` (already used) | Consistent with M003/M004 patterns |
| Auth check on admin routes | `requireAdmin()` from `src/lib/supabase/admin.ts` | Established pattern |
| Confirmation dialogs | `ConfirmDialog` component | Already built, HTML `<dialog>` based |
| Toggle switches | `ToggleSwitch` component | Already built for active/inactive |

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Supabase (general) | `daffy0208/ai-dev-standards@supabase-developer` (103 installs) | available — not needed (patterns well-established in codebase) |
| Supabase Storage | `adaptationio/skrillz@supabase-storage` (15 installs) | available — low install count, skip |
| Image generation | `supercent-io/skills-template@pollinations-ai` (10.2K installs) | available — for Pollinations, not our service |
| Next.js + Supabase Auth | `nextjs-supabase-auth` | **installed** ✓ |
| Supabase Postgres | `supabase-postgres-best-practices` | **installed** ✓ |
| React best practices | `vercel-react-best-practices` | **installed** ✓ |

No additional skill installs recommended — the codebase patterns are mature and the installed skills cover the relevant technologies.

## Candidate Observations (Advisory)

These are not scope expansions but observations for the planner:

1. **No bulk validate/publish API routes mentioned in existing code** — The context mentions "Valider tout, Publier tout" buttons. These need API support: either batch endpoint or client-side sequential calls. Recommendation: server-side batch to avoid N+1 requests.

2. **generate-all should be model_id + fabric_id** — Generate all angles for one fabric at a time, not all fabrics × all angles (which could be huge). The UI should have per-fabric "Générer tout" button.

3. **Regeneration UX** — When an admin regenerates a validated/published visual, the new result should reset to `is_validated=false, is_published=false` (require re-validation). This is implicit in the delete+insert upsert approach.

4. **Error handling for IA service failures** — Even in mock, the generate routes should handle service errors gracefully (500 with clear message). Critical for when the real service is plugged in.

5. **The existing public API `GET /api/models/[slug]/visuals` already correctly filters by `is_validated=true AND is_published=true`** — No changes needed to the public API. Published IA visuals will automatically appear.
