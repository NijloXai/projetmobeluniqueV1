---
estimated_steps: 17
estimated_files: 5
skills_used: []
---

# T01: Structural reconfirmation + IA mock runtime proof

Gate check before live API testing. Two phases:

**Phase 1 — Structural re-confirmation (no server needed):**
1. Run `npx tsc --noEmit` — must exit 0 with zero errors
2. Verify all 5 IA service files exist: `src/lib/ai/{types,mock,nano-banana,prompts,index}.ts`
3. Verify all 6 admin routes exist with `requireAdmin()` auth guard
4. Verify simulate route exists WITHOUT `requireAdmin()` (public)
5. Verify `IAGenerationSection.tsx` imported in `ModelForm.tsx`
6. Verify prompt templates in `src/lib/ai/prompts.ts` (R016 re-confirmation)

**Phase 2 — Mock IA runtime proof (standalone script, no server needed):**
Write `scripts/verify-ia-mock.ts` that:
1. Imports `MockIAService` directly from `src/lib/ai/mock`
2. Calls `generate()` with test params → asserts buffer is valid JPEG (starts with FF D8), size > 1000 bytes
3. Calls `addWatermark()` on the result → asserts output buffer differs from input, output size > input size
4. Imports `getIAService` from `src/lib/ai/index` (without NANO_BANANA_API_KEY) → asserts returns MockIAService instance
5. Imports both prompt functions from `src/lib/ai/prompts` → asserts they return non-empty strings
6. Prints structured PASS/FAIL for each check, exits 0 only if all pass

The script uses `npx tsx` (available — v4.21.0) with tsconfig paths resolution.

## Inputs

- `src/lib/ai/types.ts`
- `src/lib/ai/mock.ts`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/index.ts`
- `src/lib/ai/nano-banana.ts`
- `src/app/api/admin/generate/route.ts`
- `src/app/api/admin/generate-all/route.ts`
- `src/app/api/admin/visuals/[id]/validate/route.ts`
- `src/app/api/admin/visuals/[id]/publish/route.ts`
- `src/app/api/admin/visuals/bulk-validate/route.ts`
- `src/app/api/admin/visuals/bulk-publish/route.ts`
- `src/app/api/simulate/route.ts`

## Expected Output

- `scripts/verify-ia-mock.ts`

## Verification

npx tsc --noEmit exits 0 AND npx tsx scripts/verify-ia-mock.ts exits 0 with all checks passing
