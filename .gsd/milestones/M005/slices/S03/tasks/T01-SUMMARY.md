---
id: T01
parent: S03
milestone: M005
key_files:
  - scripts/verify-ia-mock.ts
key_decisions:
  - Used @/ path aliases in the verification script (resolved via tsx with tsconfig paths) to match project conventions and ensure the same import paths used in production code are exercised
duration: ""
verification_result: passed
completed_at: 2026-03-25T01:55:02.660Z
blocker_discovered: false
---

# T01: Add scripts/verify-ia-mock.ts proving MockIAService generates valid JPEG buffers, watermarks correctly, factory returns mock when no API key, and prompt templates produce non-empty strings (8/8 checks pass)

**Add scripts/verify-ia-mock.ts proving MockIAService generates valid JPEG buffers, watermarks correctly, factory returns mock when no API key, and prompt templates produce non-empty strings (8/8 checks pass)**

## What Happened

Phase 1 — Structural re-confirmation: All 5 IA service files exist (types, mock, nano-banana, prompts, index). All 6 admin routes contain requireAdmin() auth guard. The simulate route has no requireAdmin (public). IAGenerationSection is imported in ModelForm.tsx at line 10. Prompt templates in prompts.ts export buildBackOfficePrompt and buildSimulatePrompt. tsc --noEmit exits 0 with zero errors.

Phase 2 — Mock IA runtime proof: Created scripts/verify-ia-mock.ts that imports directly from the IA service layer and runs 8 checks: (1) generate() produces valid JPEG with FF D8 magic bytes, (2) buffer is 10,400 bytes (well above 1,000 threshold), (3) mimeType is image/jpeg, (4) addWatermark() output differs from input, (5) watermarked buffer is larger (13,076 > 10,400), (6) getIAService() returns MockIAService when NANO_BANANA_API_KEY is absent, (7) buildBackOfficePrompt() returns 244-char string, (8) buildSimulatePrompt() returns 258-char string. All 8 pass. The factory also logs '[IA] Using mock provider' confirming slice-level observability requirement.

## Verification

Two commands run as required by the task plan verification contract:
1. `npx tsc --noEmit` — exits 0, zero type errors
2. `npx tsx scripts/verify-ia-mock.ts` — exits 0, 8/8 checks pass

Slice-level verification (partial): Factory log '[IA] Using mock provider' confirmed in script output. Route-level error log prefixes and generate-all duration/count logging will be verified in T02 against the running dev server.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 1113ms |
| 2 | `npx tsx scripts/verify-ia-mock.ts` | 0 | ✅ pass | 1222ms |


## Deviations

ModelForm.tsx was at src/app/admin/(protected)/produits/ModelForm.tsx rather than src/components/admin/ModelForm.tsx as mentioned in the task plan. No code change was needed — just an adjusted lookup path for the structural check.

## Known Issues

None.

## Files Created/Modified

- `scripts/verify-ia-mock.ts`
