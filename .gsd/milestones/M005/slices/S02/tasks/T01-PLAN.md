---
estimated_steps: 10
estimated_files: 4
skills_used: []
---

# T01: Verify POST /api/simulate route meets all R011 acceptance criteria

The simulate route (`src/app/api/simulate/route.ts`) was pre-built during M005 setup (confirmed by S01 summary: "All 5 tasks were verification-only — the code was already present"). This task structurally verifies the existing 124-line route meets every R011 acceptance criterion.

R011 requires: "POST /api/simulate — upload photo salon, l'IA place le canapé configuré dans la scène. Résultat éphémère (pas stocké), watermark texte. Route publique."

The route must:
1. Accept FormData with `image` (File), `model_id` (string), `fabric_id` (string)
2. Return binary image/jpeg (not JSON) with watermark text
3. Create no row in generated_visuals table (ephemeral)
4. Require no authentication (public route — no requireAdmin)
5. Validate all inputs with appropriate 400/404 errors
6. Use the IA service abstraction from S01 (getIAService → generate → addWatermark)
7. Pass tsc --noEmit with zero errors

## Inputs

- `src/app/api/simulate/route.ts`
- `src/lib/ai/index.ts`
- `src/lib/ai/types.ts`
- `src/lib/ai/mock.ts`
- `src/lib/ai/prompts.ts`

## Expected Output

- `src/app/api/simulate/route.ts`

## Verification

Run all structural checks as a single verification pass:

1. `test -f src/app/api/simulate/route.ts` — file exists
2. `grep -q "addWatermark" src/app/api/simulate/route.ts` — watermark is applied
3. `grep -q "MÖBEL UNIQUE" src/app/api/simulate/route.ts` — correct watermark text
4. `grep -q "image/jpeg" src/app/api/simulate/route.ts` — returns JPEG content type
5. `grep -q "no-store" src/app/api/simulate/route.ts` — Cache-Control prevents caching
6. `! grep -q "requireAdmin" src/app/api/simulate/route.ts` — no auth guard (public)
7. `! grep -q "generated_visuals" src/app/api/simulate/route.ts` — no DB persistence
8. `grep -q "request.formData" src/app/api/simulate/route.ts` — accepts FormData
9. `grep -q "formData.get('image')" src/app/api/simulate/route.ts` — reads image field
10. `grep -q "formData.get('model_id')" src/app/api/simulate/route.ts` — reads model_id
11. `grep -q "formData.get('fabric_id')" src/app/api/simulate/route.ts` — reads fabric_id
12. Verify validation: `grep -c "status: 400" src/app/api/simulate/route.ts` returns >= 3 (image, model_id, fabric_id, file size)
13. Verify 404 handling: `grep -c "status: 404" src/app/api/simulate/route.ts` returns >= 2 (model, fabric)
14. Verify IA service usage: `grep -q "getIAService" src/app/api/simulate/route.ts` — uses factory
15. Verify generate call: `grep -q "iaService.generate" src/app/api/simulate/route.ts` — calls generate
16. `npx tsc --noEmit` exits 0 — zero type errors

All 16 checks must pass.
