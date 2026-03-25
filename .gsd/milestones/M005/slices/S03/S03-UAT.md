# S03: End-to-End Integration Verification — UAT

**Milestone:** M005
**Written:** 2026-03-25T02:24:42.552Z

# S03 — End-to-End Integration Verification: UAT

## Preconditions

- M005 worktree with S01 and S02 complete
- `npm install` done, sharp installed
- `.env.local` configured with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- NANO_BANANA_API_KEY **not set** (to exercise mock path)
- Dev server available on port 3000 (or script will start one)

---

## Test 1: Type Safety Gate

| Step | Action | Expected |
|------|--------|----------|
| 1 | Run `npx tsc --noEmit` | Exits 0, zero errors |

---

## Test 2: IA Mock Service — Unit-Level Proof

| Step | Action | Expected |
|------|--------|----------|
| 1 | Run `npx tsx scripts/verify-ia-mock.ts` | Exits 0, 8/8 checks pass |
| 2 | Check: generate() produces valid JPEG | FF D8 magic bytes, >1000 bytes, mimeType image/jpeg |
| 3 | Check: addWatermark() produces larger distinct buffer | Output buffer larger than input, bytes differ |
| 4 | Check: getIAService() returns MockIAService | Console logs "[IA] Using mock provider" |
| 5 | Check: prompt templates non-empty | buildBackOfficePrompt >0 chars, buildSimulatePrompt >0 chars |

---

## Test 3: Simulate API — R011

| Step | Action | Expected |
|------|--------|----------|
| 1 | POST /api/simulate with missing model_id | HTTP 400, French error message |
| 2 | POST /api/simulate with missing image file | HTTP 400, French error message |
| 3 | POST /api/simulate with valid model_id + fabric_id + JPEG image | HTTP 200, Content-Type image/jpeg, body >0 bytes |
| 4 | Query generated_visuals count before and after simulate call | Count unchanged — no DB side-effect |
| 5 | Verify no auth required | Request succeeds without Authorization header |

---

## Test 4: Public Visuals API — R010

| Step | Action | Expected |
|------|--------|----------|
| 1 | GET /api/models/canape-oslo/visuals (or any valid slug) | HTTP 200 |
| 2 | Response is JSON array | Array structure, only contains visuals where is_validated=true AND is_published=true AND fabric.is_active=true |

---

## Test 5: Admin Auth Guards — R008

| Step | Action | Expected |
|------|--------|----------|
| 1 | POST /api/admin/models/{id}/visuals/generate (no auth) | HTTP 401 |
| 2 | POST /api/admin/models/{id}/visuals/generate-all (no auth) | HTTP 401 |
| 3 | PUT /api/admin/models/{id}/visuals/validate (no auth) | HTTP 401 |
| 4 | PUT /api/admin/models/{id}/visuals/publish (no auth) | HTTP 401 |
| 5 | PUT /api/admin/models/{id}/visuals/bulk-validate (no auth) | HTTP 401 |
| 6 | PUT /api/admin/models/{id}/visuals/bulk-publish (no auth) | HTTP 401 |

---

## Test 6: Factory Environment Switch

| Step | Action | Expected |
|------|--------|----------|
| 1 | With NANO_BANANA_API_KEY unset, call getIAService() | Returns MockIAService instance, logs "[IA] Using mock provider" |
| 2 | Verify prompt templates in src/lib/ai/prompts.ts | buildBackOfficePrompt and buildSimulatePrompt exported, not hardcoded in routes |

---

## Test 7: Full Pipeline via Automated Script

| Step | Action | Expected |
|------|--------|----------|
| 1 | Run `npx tsx scripts/verify-e2e-m005.ts` | Exits 0, 15/15 checks pass |
| 2 | Summary shows R008: 7/7, R010: 2/2, R011: 6/6 | All requirement groups fully covered |

---

## Edge Cases

| Case | Action | Expected |
|------|--------|----------|
| Simulate with invalid model_id format | POST /api/simulate with model_id="not-a-uuid" | HTTP 400 or 500 (graceful error, not crash) |
| Simulate with empty FormData | POST /api/simulate with no fields | HTTP 400 with French error |
| Public visuals for non-existent slug | GET /api/models/nonexistent-slug/visuals | HTTP 200 with empty array (not 404) |
