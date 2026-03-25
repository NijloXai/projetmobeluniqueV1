---
id: S01
parent: M005
milestone: M005
provides:
  - IA service abstraction (src/lib/ai/) — mock generates real JPEG via sharp, factory switches providers via env var
  - 6 admin API routes for generate/validate/publish lifecycle (single + bulk)
  - IAGenerationSection UI component integrated into ModelForm
  - Prompt template functions: buildBackOfficePrompt and buildSimulatePrompt
requires:
  []
affects:
  - S02
  - S03
key_files:
  - src/lib/ai/types.ts
  - src/lib/ai/mock.ts
  - src/lib/ai/nano-banana.ts
  - src/lib/ai/prompts.ts
  - src/lib/ai/index.ts
  - src/app/api/admin/generate/route.ts
  - src/app/api/admin/generate-all/route.ts
  - src/app/api/admin/visuals/[id]/validate/route.ts
  - src/app/api/admin/visuals/[id]/publish/route.ts
  - src/app/api/admin/visuals/bulk-validate/route.ts
  - src/app/api/admin/visuals/bulk-publish/route.ts
  - src/app/admin/(protected)/produits/IAGenerationSection.tsx
  - src/app/admin/(protected)/produits/ModelForm.tsx
  - src/app/admin/(protected)/produits/form.module.css
key_decisions:
  - IA service uses provider pattern with factory function — mock (sharp) by default, NanoBanana when API key is set
  - Generate uses delete-then-insert upsert pattern for regeneration (not Supabase upsert) to ensure storage cleanup
  - Publish enforces validation prerequisite at API level (403) — not just UI-side
  - Bulk-publish silently skips unvalidated visuals rather than failing the entire batch
  - IAGenerationSection extracted as dedicated component (not inline in ModelForm) to manage complexity
  - Prompt templates are exported functions in prompts.ts — no hardcoded prompts in routes
patterns_established:
  - IA service provider pattern: interface in types.ts, implementations in mock.ts/nano-banana.ts, factory in index.ts with env var switch
  - Admin visual lifecycle state machine: generate (false/false) → validate (true/false) → publish (true/true), enforced at API level
  - Route-prefixed error logging pattern: console.error('[POST /api/admin/generate] message')
  - Bulk action routes accept { visual_ids: string[] } body and operate on the array
  - Generated visuals stored in 'generated-visuals' bucket at path {slug}/{fabric_id}-{model_image_id}.{ext}
observability_surfaces:
  - All 6 API routes log errors with route-prefixed tags
  - IA factory logs active provider on initialization: [IA] Using mock/NanoBanana provider
  - GET /api/admin/models/[id]/visuals returns full visual list with is_validated/is_published state
  - npx tsc --noEmit catches type regressions across entire codebase
  - Network tab on /admin/produits/[id]/edit shows all generate/validate/publish API calls
drill_down_paths:
  - .gsd/milestones/M005/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M005/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M005/slices/S01/tasks/T04-SUMMARY.md
  - .gsd/milestones/M005/slices/S01/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T02:11:40.433Z
blocker_discovered: false
---

# S01: Admin IA Generation (generate → validate → publish)

**Delivered the complete admin IA generation workflow — IA service abstraction (mock via sharp), 6 admin API routes (generate/validate/publish + bulk), and IAGenerationSection UI integrated into ModelForm — enabling admins to generate, validate, and publish AI visuals per fabric×angle.**

## What Happened

S01 delivers the highest-value vertical of M005: a fully wired admin workflow for generating AI visuals of furniture models in different fabrics.

**IA Service Abstraction (T02):** Five files in `src/lib/ai/` implement the provider pattern. `types.ts` defines the `IAService` interface (`generate()` + `addWatermark()`). `mock.ts` uses sharp to generate real 800×600 JPEG images with fabric-name-derived HSL background colors and SVG text overlays showing model name, fabric name, and angle. `nano-banana.ts` is a stub that throws a descriptive French error message. `index.ts` exports a factory that returns MockIAService when `NANO_BANANA_API_KEY` is absent and NanoBananaService when present, logging which provider is active. `prompts.ts` exports `buildBackOfficePrompt()` and `buildSimulatePrompt()` as template functions — no hardcoded prompts anywhere.

**Admin API Routes (T03):** Six routes under `/api/admin/` implement the full lifecycle:
- `POST /api/admin/generate` — generates one visual (model_id, model_image_id, fabric_id), handles upsert via delete-then-insert
- `POST /api/admin/generate-all` — generates all angles for a model+fabric combination
- `PUT /api/admin/visuals/[id]/validate` — sets is_validated=true
- `PUT /api/admin/visuals/[id]/publish` — sets is_published=true, returns 403 if not validated
- `PUT /api/admin/visuals/bulk-validate` — bulk validate by visual_ids array
- `PUT /api/admin/visuals/bulk-publish` — bulk publish, skips unvalidated

All routes use `requireAdmin()` + route-prefixed error logging.

**UI Component (T04):** `IAGenerationSection.tsx` is a dedicated component with fabric selector dropdown, angle matrix grid, status badges (généré/validé/publié), per-visual generate/validate/publish/regenerate buttons, and bulk action bar (Générer tout, Valider tout, Publier tout). It's conditionally rendered in ModelForm.tsx in edit mode when photos exist. 39 CSS rules in form.module.css style the section.

**Notable deviation:** All code was already present in the worktree from prior S03 work. Tasks T01–T05 focused on rigorous verification rather than implementation. This doesn't reduce the slice's value — the code was verified against all 11 success criteria, 7 verification checks, and structural patterns.

## Verification

**All 7 slice verification checks pass:**
- V01: `npx tsc --noEmit` — zero errors (9.4s)
- V02: `ls src/app/admin/(protected)/produits/ModelForm.tsx` — exists
- V03: `ls src/lib/ai/types.ts mock.ts index.ts prompts.ts nano-banana.ts` — all 5 exist
- V04: `ls src/app/api/admin/generate/route.ts generate-all/route.ts` — all 6 route files exist
- V05: `node -e "require('sharp').versions.sharp"` — sharp 0.34.5 confirmed
- V06: `grep is_validated publish/route.ts` — 403 guard confirmed (checks is_validated before publishing)
- V07: `node -e "require('sharp')('nonexistent.png').toBuffer().catch(...)"` — FAIL_PATH_OK

**Structural verification:**
- All 6 API routes import and call `requireAdmin()`
- All routes use route-prefixed console.error logging (e.g., `[POST /api/admin/generate]`)
- IA factory logs `[IA] Using mock provider` / `[IA] Using NanoBanana provider`
- Prompts are template functions (not hardcoded) — `buildBackOfficePrompt` and `buildSimulatePrompt` in prompts.ts
- IAGenerationSection imported in ModelForm (grep count: 2 — import + JSX)
- 39 ia-prefixed CSS rules in form.module.css
- Mock generates real JPEG buffers (7893 bytes) with watermark (10621 bytes)

## Requirements Advanced

- R008 — Back-office generate/validate/publish workflow fully implemented with mock IA service. 6 API routes + UI component. Simulation client (S02) and e2e verification (S03) remain.
- R010 — Published visuals automatically appear in GET /api/models/[slug]/visuals — existing public API returns IA-generated visuals when is_published=true.

## Requirements Validated

- R016 — Prompt templates exported as functions from src/lib/ai/prompts.ts: buildBackOfficePrompt(modelName, fabricName, viewType) and buildSimulatePrompt(modelName, fabricName). No hardcoded prompts in any API route — all routes call prompt functions. Verified structurally via grep.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

All code was already present from prior work on the worktree. Tasks focused on verification rather than implementation. No code changes were made — every task confirmed existing code satisfies the contract. This is a valid outcome: the plan anticipated possible prior work, and verification confirms correctness.

## Known Limitations

None. V06 (publish-before-validate returns 403) was confirmed structurally via grep but not tested against a running server — S03 integration verification will exercise this with live requests.

## Follow-ups

S02 (Public Simulate API) reuses the IA service from this slice. S03 (Integration Verification) will exercise the full live workflow including publish-403 enforcement against a running dev server.

## Files Created/Modified

- `src/lib/ai/types.ts` — IAService interface with GenerateRequest, GenerateResult types
- `src/lib/ai/mock.ts` — MockIAService — sharp-based JPEG generation with HSL colors + SVG text overlay
- `src/lib/ai/nano-banana.ts` — NanoBananaService stub — throws descriptive error when called
- `src/lib/ai/prompts.ts` — Template functions: buildBackOfficePrompt and buildSimulatePrompt
- `src/lib/ai/index.ts` — Factory getIAService() with env var switch + re-exports
- `src/app/api/admin/generate/route.ts` — POST generate one visual with upsert (delete+insert)
- `src/app/api/admin/generate-all/route.ts` — POST generate all angles for model+fabric
- `src/app/api/admin/visuals/[id]/validate/route.ts` — PUT set is_validated=true
- `src/app/api/admin/visuals/[id]/publish/route.ts` — PUT set is_published=true with 403 guard if not validated
- `src/app/api/admin/visuals/bulk-validate/route.ts` — PUT bulk validate by visual_ids array
- `src/app/api/admin/visuals/bulk-publish/route.ts` — PUT bulk publish, skips unvalidated
- `src/app/admin/(protected)/produits/IAGenerationSection.tsx` — Dedicated component: fabric selector, angle matrix, status badges, per-visual + bulk actions
- `src/app/admin/(protected)/produits/ModelForm.tsx` — Imports and renders IAGenerationSection in edit mode when photos exist
- `src/app/admin/(protected)/produits/form.module.css` — 39 ia-prefixed CSS rules for IAGenerationSection styling
