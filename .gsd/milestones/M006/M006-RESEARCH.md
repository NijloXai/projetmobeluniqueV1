# M006: Export ZIP — Research

**Date:** 2026-03-25
**Status:** Complete

## Summary

M006 is a focused, low-risk milestone: add a single API route `GET /api/admin/visuals/[modelId]/export` that assembles validated visuals into a ZIP and add an "Exporter ZIP" button to the product edit page. The codebase already has all the data plumbing — `generated_visuals` with `is_validated` filter, joined `fabric` and `model_image` relations, and the `generated-visuals` Supabase Storage bucket with public URLs.

**Critical prerequisite:** The M006 worktree is based on `main` (M003 code only). All M004/M005 code must be merged first.

## Recommendation

Use `archiver` for streaming ZIP generation (26M+ weekly npm downloads, true streaming). Fetch images via public URL with `fetch()`. Single slice is sufficient for this tight scope.

## Implementation Landscape

### Key Files
- `src/types/database.ts` — Types for GeneratedVisual, Fabric, ModelImage, Model
- `src/lib/supabase/admin.ts` — `requireAdmin()` auth guard
- `src/app/admin/(protected)/produits/ModelForm.tsx` — Product edit form (export button location)
- `src/app/api/admin/models/[id]/visuals/route.ts` — Existing visuals query pattern
- `src/app/api/admin/visuals/[modelId]/export/route.ts` — NEW: ZIP export endpoint

### Build Order
1. Merge M005 code into M006 worktree
2. Install `archiver` + `@types/archiver`
3. API route with streaming ZIP
4. UI button in ModelForm
5. E2E verification

### Verification Approach
- `npx tsc --noEmit` — zero type errors
- Auth guard test (401 without auth)
- Empty visuals returns appropriate message
- ZIP contains correctly named files matching `{slug}-{fabric}-{angle}.jpg`

## Constraints
- No Tailwind/shadcn — CSS Modules only
- French UI only
- Auth required via `requireAdmin()`
- Node.js runtime (not Edge) for archiver CJS compatibility
- Images are JPEG — use `store: true` in archiver

## Common Pitfalls
- Streaming in Next.js App Router requires `new Response(Readable.toWeb(archive))` adapter
- Empty results should return JSON error, not empty ZIP
- Large responses handled by archiver's incremental piping

## Open Risks
- Worktree merge conflicts (low risk — M005 mostly added new files)
- Supabase Storage URL availability (low risk — bucket is public)