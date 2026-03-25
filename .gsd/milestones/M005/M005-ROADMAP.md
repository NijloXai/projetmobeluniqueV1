# M005: Génération IA - Roadmap

**Planned:** 2026-03-24
**Slices:** 3
**Risk profile:** Medium — all infrastructure (DB, storage, types) exists; the technical challenge is the IA service abstraction with sharp-based mock and the workflow UI in an already-large component.

## Decomposition Reasoning

The milestone delivers three distinct user-visible capabilities: (1) generate/validate/publish AI visuals in the admin form, (2) a public simulation endpoint, and (3) configurable prompt templates underpinning both. The research correctly identifies a backend-first approach — the IA service abstraction + API routes must exist before the UI can call them, and the simulate API reuses the same service.

However, planning doctrine forbids foundation-only slices. Every slice must be demoable through a real UI surface. So the decomposition is:

**Slice 1 — Admin IA Generation: full vertical** — merges M004 code, builds the IA service (types + mock + prompts + factory), creates generate/validate/publish API routes, AND ships Section 3 of ModelForm as a real, interactive UI. This is the highest-risk, highest-value slice. When done, an admin can select a fabric, generate mock visuals for all angles, validate them, publish them, and see them appear in the public visuals API. This single slice covers R008, R016, and extends R010.

**Slice 2 — Public simulate API** — builds `POST /api/simulate` (public, ephemeral, watermarked). Reuses the IA service from S01. Demoable via curl (this is an API endpoint, not an admin UI feature — the client-side UI is explicitly out of scope per R030). Covers R011.

**Slice 3 — Integration verification** — an explicit end-to-end verification pass proving the full pipeline works: generate → validate → publish → appears in public API, simulate returns watermarked image, mock/real switch works via env var, regeneration upserts correctly.

**Why not 4 slices?** The research suggested 4 (service abstraction, API routes, UI, simulate). But the service abstraction is not demoable alone, and the API routes without UI are just curl-testable. Collapsing service + routes + UI into one vertical slice is correct — the research even notes these are sequential dependencies within a single workflow. The simulate API is genuinely independent and serves a different user (public client), justifying its own slice.

**Why does S01 merge M004?** The M005 worktree branches from main at M003. M004's code (ModelForm.tsx, produits pages, admin visuals API) is on branch `milestone/M004` and hasn't been merged yet. S01's first task must merge M004 into M005 to get the ModelForm and API routes that S01 extends. This is a mechanical prerequisite, not a separate slice.

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| sharp mock image generation | Medium — untested path | S01 proves sharp generates real PNG buffers with text overlay; if sharp SVG compositing fails, fall back to simple solid-color PNG |
| ModelForm complexity (721 lines + Section 3) | Medium — re-render issues | Extract Section 3 to `IAGenerationSection.tsx` as a dedicated component with its own state |
| UNIQUE constraint on regeneration | Low — well-understood | Use delete-then-insert pattern (not Supabase upsert which has limitations with storage cleanup) |
| M004 merge into M005 worktree | Low — mechanical | First task of S01, conflict-free (M005 hasn't touched produits code) |

## Slices

### S01 — Admin IA Generation (generate → validate → publish)
- **Risk:** High (IA service abstraction + sharp mock + workflow UI)
- **Depends:** none
- **Requirements:** R008 (primary), R016 (primary), R010 (supporting)
- **Demo:** Admin navigates to `/admin/produits/[id]/edit`, sees Section 3 "Génération IA". Selects a fabric from the dropdown. Clicks "Générer tout" → mock placeholders appear for each angle (colored rectangle with model name + fabric name + angle label). Clicks "Valider" on one → badge turns green. Clicks "Publier" → badge turns blue. The published visual now appears in `GET /api/models/[slug]/visuals`. Clicks "Régénérer" on a published visual → resets to unvalidated. Bulk "Valider tout" and "Publier tout" work.
- **Proof strategy:**
  - `tsc --noEmit` — zero errors
  - `GET /api/admin/models/[id]/visuals` returns generated visuals with correct is_validated/is_published states
  - `GET /api/models/[slug]/visuals` only returns published+validated visuals
  - Storage bucket `generated-visuals` contains uploaded mock images
  - Regeneration for same (model_image_id, fabric_id) replaces the existing visual
- **Tasks:**
  - T01: Merge M004 into M005 worktree, install sharp, verify clean tsc
  - T02: Create IA service abstraction (`src/lib/ai/`) — types, mock implementation with sharp, prompt templates, factory with env var switch
  - T03: Create admin API routes — POST generate (one), POST generate-all, PUT validate, PUT publish, PUT bulk-validate, PUT bulk-publish
  - T04: Create `IAGenerationSection` component + wire into ModelForm, add CSS styles
  - T05: Verify full flow + tsc clean

### S02 — Public Simulate API
- **Risk:** Low (reuses IA service, single route)
- **Depends:** S01
- **Requirements:** R011 (primary), R008 (supporting)
- **Demo:** `curl -X POST http://localhost:3000/api/simulate -F "image=@salon.jpg" -F "model_id=..." -F "fabric_id=..." --output result.jpg` returns a JPEG image with "MOBEL UNIQUE — Aperçu" watermark text overlay.
- **Proof strategy:**
  - Route accepts FormData with image file + model_id + fabric_id
  - Returns binary image/jpeg (not JSON)
  - No row created in generated_visuals table
  - No auth required (public route)
  - Response has watermark text visible in the image
  - `tsc --noEmit` — zero errors
- **Tasks:**
  - T01: Create POST /api/simulate route with watermark via sharp
  - T02: Verify route returns watermarked image, no DB row created

### S03 — End-to-End Integration Verification
- **Risk:** Low (verification only)
- **Depends:** S01, S02
- **Requirements:** R008 (verification), R010 (verification), R011 (verification), R016 (verification)
- **Demo:** Complete walkthrough proving all acceptance criteria from M005-CONTEXT.md are met.
- **Proof strategy:**
  - Admin selects fabric, clicks "Générer tout", sees mock renders appear
  - Admin validates then publishes a render
  - Published render appears in GET /api/models/[slug]/visuals
  - Regeneration replaces previous render (UNIQUE constraint respected)
  - POST /api/simulate returns watermarked image
  - IA service is switchable mock/real via NANO_BANANA_API_KEY env var
  - `tsc --noEmit` — zero errors across entire codebase
- **Tasks:**
  - T01: Run full acceptance criteria verification, fix any issues found

## Definition of Done

All of the following must be true:

- [ ] Admin can select a fabric in `/admin/produits/[id]/edit` Section 3 and see a matrix of angles
- [ ] "Générer" on one angle creates a mock placeholder image stored in generated-visuals bucket
- [ ] "Générer tout" generates all angles for the selected fabric
- [ ] "Valider" sets is_validated=true, "Publier" sets is_published=true (publish requires validation)
- [ ] "Valider tout" and "Publier tout" bulk actions work
- [ ] Regeneration of an existing (model_image_id, fabric_id) pair replaces the old visual (delete + re-insert)
- [ ] Published visuals appear in GET /api/models/[slug]/visuals (public API, no changes needed)
- [ ] POST /api/simulate accepts FormData (image + model_id + fabric_id), returns watermarked JPEG
- [ ] POST /api/simulate is public (no auth), ephemeral (no DB row)
- [ ] IA service factory returns mock when NANO_BANANA_API_KEY is absent, stub for real when present
- [ ] Prompt templates are in `src/lib/ai/prompts.ts`, not hardcoded in routes
- [ ] `tsc --noEmit` passes with zero errors

## Requirement Coverage

| Req | Status | Primary Slice | Supporting Slices | Notes |
|-----|--------|---------------|-------------------|-------|
| R008 | active → M005 | S01 | S02, S03 | Full back-office generate/validate/publish + simulate (both contexts) |
| R010 | active (partial) | — | S01 | Published visuals appear in public API (extends existing behavior) |
| R011 | active → M005 | S02 | S03 | Public simulate endpoint with watermark |
| R016 | active → M005 | S01 | — | Prompt templates in src/lib/ai/prompts.ts |

**All active requirements relevant to M005 are mapped.** R009 (ZIP export) and R010 (full validation) are for M006+. R020 (demo data) and R021 (deployment) are deferred. All other active requirements are already validated.

## Boundary Map

| Boundary | Surfaces | Proven By |
|----------|----------|-----------|
| Next.js API routes ↔ Supabase DB | POST generate, PUT validate, PUT publish, GET visuals | S01 API routes inserting/updating generated_visuals table |
| Next.js API routes ↔ Supabase Storage | Upload mock images to generated-visuals bucket | S01 generate route uploading sharp-created buffers |
| IA service abstraction ↔ sharp | Mock generates real PNG/JPEG buffers | S01 T02 proving sharp creates images with text overlay |
| Admin UI (React) ↔ API routes | Section 3 calls generate/validate/publish routes | S01 T04 UI wired to all endpoints |
| Public API ↔ IA service | POST /api/simulate uses iaService.generate + addWatermark | S02 T01 |
| Env var switch | NANO_BANANA_API_KEY controls mock vs real | S01 T02 factory + S03 verification |

## Verification Classes

| Class | Method | Used In |
|-------|--------|---------|
| Type safety | `tsc --noEmit` | S01, S02, S03 |
| Structural | grep/find for expected files, exports, patterns | S01 T02, T03 |
| API contract | curl or fetch against local dev server | S01 T03, S02 T01, S03 |
| UI integration | Browser navigation to /admin/produits/[id]/edit | S01 T04, S03 |
| Data integrity | Supabase query for generated_visuals rows | S01, S03 |
