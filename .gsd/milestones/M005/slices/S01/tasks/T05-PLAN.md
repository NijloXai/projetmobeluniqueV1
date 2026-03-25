# T05: Verification — full flow + tsc clean

**Slice:** S01 — Admin IA Generation
**Type:** Verification
**Risk:** Low

## What

Run complete structural verification that all S01 deliverables are in place, type-safe, and correctly wired.

## Verification Commands

```bash
# 1. Type safety
npx tsc --noEmit

# 2. IA service files exist with correct exports
node -e "
const { getIAService } = require('./src/lib/ai');
console.log('factory:', typeof getIAService);
const svc = getIAService();
console.log('generate:', typeof svc.generate);
console.log('addWatermark:', typeof svc.addWatermark);
"

# 3. All API route files exist
for route in \
  src/app/api/admin/generate/route.ts \
  src/app/api/admin/generate-all/route.ts \
  src/app/api/admin/visuals/\[id\]/validate/route.ts \
  src/app/api/admin/visuals/\[id\]/publish/route.ts \
  src/app/api/admin/visuals/bulk-validate/route.ts \
  src/app/api/admin/visuals/bulk-publish/route.ts; do
  test -f "$route" && echo "✓ $route" || echo "✗ MISSING: $route"
done

# 4. IAGenerationSection component exists and is imported
test -f src/app/admin/\(protected\)/produits/IAGenerationSection.tsx && echo "✓ IAGenerationSection.tsx" || echo "✗ MISSING"
grep -q "IAGenerationSection" src/app/admin/\(protected\)/produits/ModelForm.tsx && echo "✓ imported in ModelForm" || echo "✗ NOT imported"

# 5. Prompt templates exist
grep -q "buildBackOfficePrompt\|buildSimulatePrompt" src/lib/ai/prompts.ts && echo "✓ prompts configurable" || echo "✗ prompts missing"

# 6. All routes use requireAdmin
for route in src/app/api/admin/generate/route.ts src/app/api/admin/generate-all/route.ts; do
  grep -q "requireAdmin" "$route" && echo "✓ auth: $route" || echo "✗ NO AUTH: $route"
done
```

## Exit Criteria

- All checks pass
- `tsc --noEmit` — zero errors
- No regressions in existing M004 functionality
