# S03: End-to-End Integration Verification — Research

**Date:** 2026-03-25
**Status:** Complete
**Depth:** Light — verification-only slice over fully-built code from S01+S02.

## Summary

S03 is a pure verification slice — no code to write. S01 delivered the full IA service abstraction (5 files in `src/lib/ai/`), 6 admin API routes, and the IAGenerationSection UI component. S02 delivered the public simulate route. Both slices verified their work **structurally only** (grep, find, tsc) and explicitly deferred live runtime verification to S03.

The existing `S03/T01-SUMMARY.md` from an earlier pass also only ran structural checks (file existence, grep for patterns, tsc). **No live API calls have been made against a running dev server.** S03 must prove the full pipeline works at runtime: generate → validate → publish → appears in public API, simulate returns watermarked JPEG, and regeneration upserts correctly.

## Requirements Targeted

| Req | Role | What S03 Must Prove |
|-----|------|---------------------|
| R008 | verification | Back-office generate/validate/publish works end-to-end via API calls against running server |
| R010 | verification | Published+validated visuals appear in GET /api/models/[slug]/visuals |
| R011 | verification | POST /api/simulate returns binary watermarked JPEG, no DB row created |
| R016 | verification | Already validated — prompt templates confirmed in `src/lib/ai/prompts.ts` by S01 |

R016 is already status `validated` in REQUIREMENTS.md. The remaining three (R008, R010, R011) need live runtime proof.

## Recommendation

**Single task, two phases:** (1) structural re-confirmation (fast — tsc + file checks, takes 30s), then (2) live runtime verification against the dev server (`npm run dev`). The runtime phase is the real value of this slice — everything else was done by S01/S02.

**No code changes expected.** If any check fails, the task should fix the issue inline rather than replanning. The codebase is tsc-clean and structurally complete.

## Implementation Landscape

### What's Already Proven (Structural — by S01, S02, and earlier S03/T01)

These do NOT need re-proving unless tsc regresses:

- ✅ `tsc --noEmit` — zero errors (proven 3 times across S01/T05, S02/T02, S03/T01)
- ✅ All 5 IA service files exist: `types.ts`, `mock.ts`, `nano-banana.ts`, `prompts.ts`, `index.ts`
- ✅ All 6 admin routes exist with `requireAdmin()` auth guard
- ✅ Simulate route exists without `requireAdmin()` (public)
- ✅ IAGenerationSection.tsx (398 lines) imported in ModelForm.tsx at line 10, rendered at line 701
- ✅ Mock generates real JPEG buffers (~8KB) via sharp
- ✅ Watermark produces distinct output (~11KB)
- ✅ Factory returns MockIAService when NANO_BANANA_API_KEY absent, NanoBananaService when present
- ✅ Publish route returns 403 if `is_validated=false`
- ✅ Bulk-publish filters by `is_validated=true` before updating
- ✅ Prompts in `src/lib/ai/prompts.ts` — two functions, no hardcoded strings in routes

### What Needs Live Runtime Proof (NOT yet done)

These are the acceptance criteria from the roadmap's "Final Integrated Acceptance" and Definition of Done that require a running dev server:

**Admin generate flow (R008):**
1. POST `/api/admin/generate` with valid model_id, model_image_id, fabric_id → 201, returns visual with `is_validated=false, is_published=false`
2. POST `/api/admin/generate-all` with valid model_id, fabric_id → 200, returns `{ generated: [...], total: N, success: N }`
3. Verify image file exists in `generated-visuals` storage bucket after generate
4. Verify `generated_visuals` DB row created with correct foreign keys

**Admin validate/publish flow (R008):**
5. PUT `/api/admin/visuals/[id]/validate` → returns visual with `is_validated=true`
6. PUT `/api/admin/visuals/[id]/publish` on validated visual → returns visual with `is_published=true`
7. PUT `/api/admin/visuals/[id]/publish` on unvalidated visual → 403

**Bulk actions (R008):**
8. PUT `/api/admin/visuals/bulk-validate` with array of IDs → validates all
9. PUT `/api/admin/visuals/bulk-publish` with array of validated IDs → publishes all (skips unvalidated)

**Published visuals in public API (R010):**
10. GET `/api/models/[slug]/visuals` returns the published+validated visual
11. Unpublished or unvalidated visuals do NOT appear in public API

**Regeneration upsert (R008):**
12. POST `/api/admin/generate` for same (model_image_id, fabric_id) → replaces old row (no UNIQUE violation)
13. After regeneration, visual resets to `is_validated=false, is_published=false`

**Simulate API (R011):**
14. POST `/api/simulate` with FormData (image file + model_id + fabric_id) → 200, returns binary image/jpeg
15. Response has `Content-Type: image/jpeg` and `Cache-Control: no-store`
16. No new row in `generated_visuals` table after simulate call
17. Missing fields return 400 with French error message

**Factory switch (R008):**
18. Without NANO_BANANA_API_KEY env var → mock provider (confirmed via server log `[IA] Using mock provider`)

### Key Files (for reference — planner/executor context)

| File | Lines | Role |
|------|-------|------|
| `src/lib/ai/index.ts` | 24 | Factory — env var switch |
| `src/lib/ai/mock.ts` | 98 | Mock — sharp-based image generation |
| `src/lib/ai/types.ts` | 26 | IAService interface |
| `src/lib/ai/prompts.ts` | 39 | Prompt templates |
| `src/lib/ai/nano-banana.ts` | 18 | Stub — throws descriptive error |
| `src/app/api/admin/generate/route.ts` | 172 | POST — generate single visual |
| `src/app/api/admin/generate-all/route.ts` | 178 | POST — generate all angles |
| `src/app/api/admin/visuals/[id]/validate/route.ts` | 33 | PUT — validate |
| `src/app/api/admin/visuals/[id]/publish/route.ts` | 57 | PUT — publish (with 403 guard) |
| `src/app/api/admin/visuals/bulk-validate/route.ts` | 51 | PUT — bulk validate |
| `src/app/api/admin/visuals/bulk-publish/route.ts` | 54 | PUT — bulk publish |
| `src/app/api/simulate/route.ts` | 124 | POST — public simulate |
| `src/app/api/models/[slug]/visuals/route.ts` | ~60 | GET — public visuals (filters validated+published+active fabric) |
| `src/app/admin/(protected)/produits/IAGenerationSection.tsx` | 398 | UI component |
| `src/app/admin/(protected)/produits/ModelForm.tsx` | 733 | Parent form (renders IAGenerationSection at line 701) |

### Runtime Test Prerequisites

The dev server (`npm run dev`) requires:
- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (confirmed present)
- NO `NANO_BANANA_API_KEY` in `.env.local` (confirmed absent — factory uses mock)
- Supabase DB with existing models, model_images, and fabrics data
- `generated-visuals` storage bucket (public)

To call admin routes, the test needs an auth cookie from a logged-in admin session. Options:
- Use the Supabase service role key directly (bypass RLS) — but admin routes use `requireAdmin()` which checks session cookies
- Login via browser first, capture the cookie, then use it in curl
- Use `SUPABASE_ACCESS_TOKEN` as a service-level workaround if the routes support it

**The simplest approach:** Use browser-based verification via `npm run dev` + browser navigation for admin routes (the UI calls the APIs internally), and curl for the public simulate route.

### Verification Commands

**Phase 1 — Structural re-confirmation (30s):**
```bash
npx tsc --noEmit
ls src/lib/ai/{types,mock,nano-banana,prompts,index}.ts
ls src/app/api/admin/generate/route.ts src/app/api/admin/generate-all/route.ts
ls src/app/api/admin/visuals/[id]/validate/route.ts src/app/api/admin/visuals/[id]/publish/route.ts
ls src/app/api/admin/visuals/bulk-validate/route.ts src/app/api/admin/visuals/bulk-publish/route.ts
ls src/app/api/simulate/route.ts
grep -q 'requireAdmin' src/app/api/admin/generate/route.ts && echo "auth OK"
grep -qv 'requireAdmin' src/app/api/simulate/route.ts && echo "public OK"
```

**Phase 2 — Live runtime (requires `npm run dev`):**
```bash
# Simulate API (public — no auth needed):
curl -s -o /tmp/simulate-result.jpg -w "%{http_code} %{content_type}" \
  -X POST http://localhost:3000/api/simulate \
  -F "image=@/path/to/test-image.jpg" \
  -F "model_id=<actual-uuid>" \
  -F "fabric_id=<actual-uuid>"
# Expect: 200 image/jpeg, file > 0 bytes

# Validate simulate has no DB side-effect:
# Query generated_visuals count before and after — should be equal

# Admin routes — browser flow:
# Navigate to /admin/produits/[id]/edit → Section 3 visible
# Select fabric → angle matrix appears
# Click Générer → mock image appears
# Click Valider → badge turns green
# Click Publier → badge turns blue
# Check /api/models/[slug]/visuals returns the published visual
```

**Phase 2 alternative — structural runtime checks without auth:**
If auth makes live curl testing complex, the executor can verify runtime behavior through:
- `npx tsx` scripts that call `getIAService().generate()` and `addWatermark()` directly (already proven)
- Structural verification of the API route logic (already proven)
- Browser-based UI testing for the full admin flow

### Natural Seams

This is a single-task slice. The one task has two phases:
1. **Structural re-check** — fast, deterministic, no server needed. Confirms nothing regressed since S01/S02.
2. **Runtime proof** — needs dev server. Two sub-flows: (a) admin generate→validate→publish via browser or curl, (b) public simulate via curl.

There's no benefit in splitting these into separate tasks — they're sequential and the structural check takes <30 seconds.

### What to Build/Prove First

1. **tsc --noEmit** — if this fails, nothing else matters. It's the gatekeeper.
2. **IA service mock** — verify `getIAService().generate()` produces a valid image buffer (quick tsx script).
3. **Simulate API** — easiest live test (public, no auth, single curl command).
4. **Admin generate flow** — most complex (needs auth), but highest value proof.
5. **Public API visibility** — depends on admin flow producing a published visual.

### Risks

**Low risk overall.** The code is complete, tsc-clean, and structurally verified 3 times. The main risk is:

- **Auth complexity for live admin API testing:** The `requireAdmin()` function uses Supabase session cookies. Calling admin routes via curl requires capturing an auth cookie from a browser login. If the executor can't authenticate, it should fall back to structural verification of the API logic (which is already comprehensive from S01) + browser-based UI testing.

- **Test data availability:** Live testing needs at least one model with model_images and one active fabric in the Supabase DB. If the DB is empty, the executor should note this and verify what it can.

No code changes are expected. If something breaks, it's a regression from S01/S02 and should be fixed inline.
