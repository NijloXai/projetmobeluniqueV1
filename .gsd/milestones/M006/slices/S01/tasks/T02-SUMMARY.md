---
id: T02
parent: S01
milestone: M006
key_files:
  - src/app/api/admin/visuals/[modelId]/export/route.ts
key_decisions:
  - Used fabric.slug from DB directly instead of slugify(fabric.name) since fabrics table already has a slug column
  - Used Supabase relation syntax (fabrics:fabric_id, model_images:model_image_id) for joined queries instead of separate queries per table
  - Archive uses store mode (no compression) since JPEGs are already compressed — avoids CPU overhead with no size benefit
duration: ""
verification_result: passed
completed_at: 2026-03-25T02:56:03.887Z
blocker_discovered: false
---

# T02: Implement GET /api/admin/visuals/[modelId]/export API route for streaming ZIP download of validated visuals

**Implement GET /api/admin/visuals/[modelId]/export API route for streaming ZIP download of validated visuals**

## What Happened

Created the export API route at `src/app/api/admin/visuals/[modelId]/export/route.ts`. The route:

1. **Auth guard** — uses `requireAdmin()` pattern consistent with all other admin routes; returns 401 if unauthenticated.
2. **Runtime** — sets `export const runtime = 'nodejs'` since archiver requires Node.js streams.
3. **Model lookup** — fetches model by ID for slug used in file naming.
4. **Validated visuals query** — queries `generated_visuals` with `is_validated = true` and joins `fabrics` (name, slug) and `model_images` (view_type) via Supabase relation syntax.
5. **Empty case** — returns `{ error: 'Aucun rendu validé pour ce produit.' }` with 404 if no validated visuals exist.
6. **ZIP assembly** — uses `archiver('zip', { store: true })` (no compression for JPEG) and fetches each image URL, appending buffers into the archive with names `{model.slug}-{fabric.slug}-{view_type}.jpg`.
7. **Duplicate handling** — tracks used filenames and appends a counter suffix if duplicates occur.
8. **Error resilience** — if an individual image fetch fails, logs a warning and skips that file rather than aborting the entire ZIP.
9. **Streaming response** — converts the Node Readable stream to a Web ReadableStream via `Readable.toWeb()` and returns with `Content-Type: application/zip` and `Content-Disposition: attachment`.

Used `fabric.slug` directly from the database rather than re-computing via `slugify()` since the fabrics table already has a slug column.

## Verification

- `npx tsc --noEmit` passes with zero errors (exit code 0, 0.87s)
- File exists at correct path: `src/app/api/admin/visuals/[modelId]/export/route.ts` (119 lines, 3892 bytes)
- Auth guard present: `requireAdmin()` called at route entry
- Runtime set: `export const runtime = 'nodejs'`
- Empty case returns correct French error message with 404 status
- Content-Disposition header includes model slug in filename
- Archiver imported and used with store mode (no compression)
- Note: curl/unzip verification deferred to T04 (end-to-end verification task) which requires a running dev server and test data

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 876ms |
| 2 | `ls -la src/app/api/admin/visuals/[modelId]/export/route.ts` | 0 | ✅ pass | 10ms |
| 3 | `grep 'requireAdmin' src/app/api/admin/visuals/[modelId]/export/route.ts` | 0 | ✅ pass | 10ms |
| 4 | `grep 'Aucun rendu' src/app/api/admin/visuals/[modelId]/export/route.ts` | 0 | ✅ pass | 10ms |


## Deviations

Used `fabric.slug` directly from the database instead of `slugify(fabric.name)` as the plan suggested — the fabrics table already stores a pre-computed slug column, making re-computation unnecessary and more consistent with the schema.

## Known Issues

None.

## Files Created/Modified

- `src/app/api/admin/visuals/[modelId]/export/route.ts`
