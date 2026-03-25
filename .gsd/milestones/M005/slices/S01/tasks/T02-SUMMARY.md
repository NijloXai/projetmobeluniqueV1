---
id: T02
parent: S01
milestone: M005
key_files:
  - src/lib/ai/types.ts
  - src/lib/ai/prompts.ts
  - src/lib/ai/mock.ts
  - src/lib/ai/nano-banana.ts
  - src/lib/ai/index.ts
key_decisions:
  - IA service files from prior S03 work were verified in-place rather than recreated — they match the T02 contract exactly
duration: ""
verification_result: passed
completed_at: 2026-03-25T02:05:18.721Z
blocker_discovered: false
---

# T02: Verify IA service abstraction layer (src/lib/ai/) — all 5 files present with correct exports, mock generates real JPEG buffers, factory switches providers

**Verify IA service abstraction layer (src/lib/ai/) — all 5 files present with correct exports, mock generates real JPEG buffers, factory switches providers**

## What Happened

The 5 IA service abstraction files were already present in the worktree from prior S03 work (confirmed in T01). This task verified they fully satisfy the T02 contract:

1. **types.ts** — Exports `GenerateRequest`, `GenerateResult`, and `IAService` interfaces matching the plan spec exactly.
2. **prompts.ts** — `buildBackOfficePrompt()` and `buildSimulatePrompt()` are template functions with string interpolation, not hardcoded strings. Verified with French-accented inputs.
3. **mock.ts** — `MockIAService.generate()` produces 800×600 JPEG via sharp with fabric-name-derived HSL background color and SVG text overlay. Output is 7893 bytes (well over 1KB minimum). `addWatermark()` composites diagonal "MÖBEL UNIQUE — Aperçu" text, producing a distinct 10621-byte buffer.
4. **nano-banana.ts** — `NanoBananaService` implements `IAService` and throws "Service Nano Banana 2 non configuré. Contactez l'administrateur." on both methods.
5. **index.ts** — `getIAService()` factory returns `MockIAService` by default, logs `[IA] Using mock provider`. Re-exports types and prompt builders for consumers.

All slice verification checks V01–V05, V07 pass. V06 deferred to T05 (requires running server).

## Verification

Ran all T02 exit criteria and slice verification checks:

- **5 files exist**: `ls src/lib/ai/{types,mock,nano-banana,prompts,index}.ts` — all present
- **Mock generates real JPEG >1KB**: 7893 bytes with mimeType image/jpeg
- **Watermark produces different buffer**: 10621 bytes (differs from original 7893)
- **Factory returns mock by default**: `svc.constructor.name === 'MockIAService'`
- **NanoBanana throws**: "Service Nano Banana 2 non configuré. Contactez l'administrateur."
- **Prompts are template functions**: Verified interpolation with "Canapé Oslo" / "Velours Bleu" / "face"
- **tsc --noEmit passes**: Zero errors
- **V01–V05, V07 slice checks**: All pass

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `ls src/lib/ai/{types,mock,nano-banana,prompts,index}.ts` | 0 | ✅ pass | 50ms |
| 2 | `npx tsc --noEmit` | 0 | ✅ pass | 11500ms |
| 3 | `npx tsx _test_generate.ts (mock generate + watermark)` | 0 | ✅ pass | 3000ms |
| 4 | `npx tsx _test_factory.ts (factory + NanoBanana throws)` | 0 | ✅ pass | 2000ms |
| 5 | `npx tsx -e (prompt template interpolation)` | 0 | ✅ pass | 1500ms |
| 6 | `ls src/app/admin/(protected)/produits/ModelForm.tsx` | 0 | ✅ pass | 50ms |
| 7 | `ls src/lib/ai/types.ts src/lib/ai/mock.ts src/lib/ai/index.ts` | 0 | ✅ pass | 50ms |
| 8 | `ls src/app/api/admin/generate/route.ts src/app/api/admin/generate-all/route.ts` | 0 | ✅ pass | 50ms |
| 9 | `node -e "require('sharp').versions.sharp"` | 0 | ✅ pass | 200ms |
| 10 | `node -e sharp failure path test` | 0 | ✅ pass | 300ms |


## Deviations

No code changes were needed — the files from prior S03 work already satisfied all T02 exit criteria. Task focused on verification rather than implementation.

## Known Issues

None.

## Files Created/Modified

- `src/lib/ai/types.ts`
- `src/lib/ai/prompts.ts`
- `src/lib/ai/mock.ts`
- `src/lib/ai/nano-banana.ts`
- `src/lib/ai/index.ts`
