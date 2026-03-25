---
id: T01
parent: S01
milestone: M004
provides:
  - Models CRUD API routes (GET list, POST create, GET/:id, PUT/:id, DELETE/:id with cascade storage cleanup)
  - Shared extractStoragePath utility in src/lib/utils.ts
key_files:
  - src/lib/utils.ts
  - src/app/api/admin/fabrics/[id]/route.ts
  - src/app/api/admin/models/route.ts
  - src/app/api/admin/models/[id]/route.ts
key_decisions:
  - Extracted extractStoragePath to shared utils rather than duplicating between fabrics and models routes
patterns_established:
  - Models CRUD mirrors fabrics CRUD pattern: requireAdmin → parse body → Zod validation → slug auto-gen → Supabase operation → error mapping (409/404/500)
  - Cascade-delete pattern: fetch related storage URLs → best-effort storage cleanup → delete DB row (FK cascade handles child rows)
observability_surfaces:
  - console.error with route-prefixed tags on all Supabase errors
  - HTTP status codes 401/400/404/409/500 with French error messages
duration: 10m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Implement models CRUD routes with shared extractStoragePath utility

**Extracted extractStoragePath to shared utils and created full models CRUD API (list, create, get, update, delete with cascade storage cleanup)**

## What Happened

1. Extracted the `extractStoragePath` function from `src/app/api/admin/fabrics/[id]/route.ts` into `src/lib/utils.ts` as a named export. Updated the fabrics route to import from the shared location, removing the local definition.

2. Created `src/app/api/admin/models/route.ts` with GET (list all models with `model_images(count)`, ordered by created_at desc) and POST (JSON body, auto-generate slug from name, validate with `createModelSchema`, insert with `ModelInsert` type, 201/400/409 error handling).

3. Created `src/app/api/admin/models/[id]/route.ts` with GET (single model with nested `model_images(*)` sorted by sort_order), PUT (JSON body, auto-generate slug if name changes, validate with `updateModelSchema`, 409 on slug conflict), and DELETE (fetch model_images and generated_visuals URLs, best-effort cleanup of `model-photos` and `generated-visuals` storage buckets, delete model row with FK cascade for DB cleanup).

4. All routes are gated by `requireAdmin()` and log errors with route-prefixed tags. All user-facing error messages are in French.

## Verification

- `tsc --noEmit` passes with zero errors across all new and modified files
- Both new route files exist at expected paths
- `extractStoragePath` is exported from `src/lib/utils.ts`
- Fabrics route imports `extractStoragePath` from `@/lib/utils` (no local copy remains)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `./node_modules/.bin/tsc --noEmit` | 0 | ✅ pass | ~3s |
| 2 | `test -f src/app/api/admin/models/route.ts && test -f src/app/api/admin/models/[id]/route.ts` | 0 | ✅ pass | <1s |
| 3 | `grep -q "export function extractStoragePath" src/lib/utils.ts` | 0 | ✅ pass | <1s |
| 4 | `grep -q "import.*extractStoragePath.*from.*@/lib/utils" src/app/api/admin/fabrics/[id]/route.ts` | 0 | ✅ pass | <1s |

## Diagnostics

- **Runtime errors:** All Supabase errors logged with `console.error('[METHOD /api/admin/models]', ...)` and `[DELETE /api/admin/models/:id] model-photos cleanup:` / `generated-visuals cleanup:` for storage cleanup failures.
- **Inspection:** Query `models` table in Supabase dashboard. Check `model_images` and `generated_visuals` tables for cascade behavior after model deletion.
- **Response shape:** Success returns model JSON (or `{ success: true }` for DELETE). Errors return `{ error: "French message" }` with optional `details` for validation failures.

## Deviations

None. Implementation follows the task plan exactly.

## Known Issues

None.

## Files Created/Modified

- `src/lib/utils.ts` — added `extractStoragePath` export (shared utility for extracting file paths from Supabase Storage URLs)
- `src/app/api/admin/fabrics/[id]/route.ts` — updated import to use `extractStoragePath` from `@/lib/utils`, removed local function definition
- `src/app/api/admin/models/route.ts` — created: GET list (all models with image count) + POST create (with Zod validation, slug auto-gen, 409 conflict handling)
- `src/app/api/admin/models/[id]/route.ts` — created: GET single (with nested images sorted by sort_order) + PUT update (with Zod validation, slug auto-gen) + DELETE (cascade storage cleanup from model-photos and generated-visuals buckets)
