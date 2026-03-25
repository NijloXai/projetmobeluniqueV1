# S02: Public Simulate API — UAT

**Milestone:** M005
**Written:** 2026-03-25T01:35:45.456Z

# S02: Public Simulate API — UAT

**Milestone:** M005
**Written:** 2026-03-25

## UAT Type

- UAT mode: mixed (artifact-driven structural checks + live runtime in S03)
- Why this mode is sufficient: The simulate endpoint is a single API route. Structural verification proves the contract (input/output types, auth, persistence). Live runtime testing is explicitly delegated to S03 integration verification.

## Preconditions

- M005 worktree has M004 merged and S01 complete (IA service available)
- `src/app/api/simulate/route.ts` exists
- `tsc --noEmit` passes

## Smoke Test

Run `grep -q 'addWatermark' src/app/api/simulate/route.ts && grep -q 'image/jpeg' src/app/api/simulate/route.ts && echo OK` — confirms the route applies watermark and returns JPEG.

## Test Cases

### 1. Route accepts FormData with required fields

1. Inspect `src/app/api/simulate/route.ts` for `request.formData()` call
2. Verify `formData.get('image')`, `formData.get('model_id')`, `formData.get('fabric_id')` are parsed
3. **Expected:** All three fields extracted from FormData

### 2. Route returns binary JPEG with no-cache

1. Grep for `image/jpeg` in route file
2. Grep for `no-store` in route file
3. **Expected:** Response Content-Type is image/jpeg, Cache-Control is no-store

### 3. Watermark applied via IA service

1. Grep for `addWatermark` in route file
2. Grep for `MÖBEL UNIQUE` in route file
3. **Expected:** Route calls iaService.addWatermark with \"MÖBEL UNIQUE — Aperçu\" text

### 4. No authentication required (public route)

1. Run `! grep -q 'requireAdmin' src/app/api/simulate/route.ts`
2. **Expected:** No requireAdmin import or call — route is public

### 5. No database persistence (ephemeral)

1. Run `! grep -q 'generated_visuals' src/app/api/simulate/route.ts`
2. **Expected:** No reference to generated_visuals table — result is not stored

### 6. Input validation returns proper errors

1. Count `status: 400` occurrences in route file
2. Count `status: 404` occurrences in route file
3. **Expected:** At least 5 distinct 400 errors (invalid form, missing image, oversized image, missing model_id, missing fabric_id) and 2 distinct 404 errors (model not found, fabric not found)

### 7. Type safety

1. Run `npx tsc --noEmit`
2. **Expected:** Exit code 0, zero type errors

## Edge Cases

### Oversized image upload

1. Route checks image size and returns 400 if too large
2. **Expected:** `status: 400` with descriptive French error message

### Unknown model_id or fabric_id

1. Route queries Supabase for model and fabric existence
2. **Expected:** `status: 404` with French error message when either is not found

## Failure Signals

- `tsc --noEmit` exits non-zero — type regression
- `grep -q 'requireAdmin'` succeeds — route is no longer public
- `grep -q 'generated_visuals'` succeeds — route is persisting to DB
- Missing `addWatermark` call — watermark not applied

## Requirements Proved By This UAT

- R011 — Structural contract of POST /api/simulate proven: FormData input, watermarked JPEG output, public access, ephemeral, proper validation errors

## Not Proven By This UAT

- Live runtime behavior (actual HTTP POST with image file returning valid JPEG) — delegated to S03
- Watermark visual quality (text positioning, readability) — requires visual inspection
- Performance under load — not tested

## Notes for Tester

This is a verification-only slice. The route was pre-built during M005 setup. S03 will perform the live curl test against a running dev server to confirm actual runtime behavior.
