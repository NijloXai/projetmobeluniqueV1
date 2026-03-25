---
estimated_steps: 28
estimated_files: 3
skills_used: []
---

# T02: Live E2E API verification against running dev server

The core deliverable of S03. Proves R008, R010, and R011 at runtime against a live dev server.

**Write `scripts/verify-e2e-m005.ts`** — a standalone verification script that:

1. Starts the Next.js dev server (`npm run dev`) as a child process, waits for it to be ready on port 3000
2. Runs the following live checks:

**R011 — Simulate API (public, no auth needed):**
- Create a tiny test JPEG in-memory using sharp (or use a 1x1 pixel JPEG literal)
- POST to `http://localhost:3000/api/simulate` with FormData: image (test file), model_id (valid UUID from DB), fabric_id (valid UUID from DB)
- Assert: HTTP 200, Content-Type starts with `image/jpeg`, body length > 0
- POST with missing model_id → assert HTTP 400, response body contains French error text
- POST with missing image → assert HTTP 400
- Query `generated_visuals` table count before and after simulate → assert count unchanged (no DB row created)

**R010 — Public visuals API:**
- GET `http://localhost:3000/api/models/[slug]/visuals` using a known model slug from DB
- Assert: HTTP 200, returns JSON array
- If any published+validated visuals exist, assert each has `is_validated: true`, `is_published: true`, and `fabric.is_active: true`

**R008 — Admin pipeline proof (structural + factory):**
- Verify factory: confirm getIAService() without NANO_BANANA_API_KEY returns MockIAService (already proven in T01, re-confirm here)
- Verify admin routes structurally: all 6 routes reject unauthenticated requests with HTTP 401 by calling them without auth cookies
- This confirms the auth guard works at runtime (not just structurally)

3. Kills the dev server child process
4. Prints structured results: total checks, passed, failed, with PASS/FAIL per check
5. Exits 0 if all pass, exits 1 if any fail

**Important constraints:**
- Use `@supabase/supabase-js` with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from `.env.local` for DB queries (count checks)
- Use native `fetch` for API calls (Node 24 has built-in fetch)
- Load env vars via dotenv from `.env.local`
- The script must clean up the dev server process on exit (SIGTERM)
- If a model or fabric doesn't exist in the DB, log it clearly and skip the dependent checks (don't fail silently)

## Inputs

- `scripts/verify-ia-mock.ts`
- `src/app/api/simulate/route.ts`
- `src/app/api/models/[slug]/visuals/route.ts`
- `src/app/api/admin/generate/route.ts`
- `src/app/api/admin/visuals/[id]/validate/route.ts`
- `src/app/api/admin/visuals/[id]/publish/route.ts`
- `src/lib/ai/index.ts`

## Expected Output

- `scripts/verify-e2e-m005.ts`

## Verification

npx tsx scripts/verify-e2e-m005.ts exits 0 with all checks passing
