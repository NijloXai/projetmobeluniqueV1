# T01: Merge M004 + install sharp

**Slice:** S01 — Admin IA Generation
**Type:** Setup / prerequisite
**Risk:** Low

## What

Merge the `milestone/M004` branch into the M005 worktree to bring in all M004 code (ModelForm.tsx, produits admin pages, admin visuals API routes, extractStoragePath utility). Then install `sharp` as an explicit dependency for mock image generation.

## Steps

1. `git merge milestone/M004 --no-edit` — should be conflict-free since M005 hasn't touched any produits code
2. Verify the merge brought in expected files:
   - `src/app/admin/(protected)/produits/ModelForm.tsx` (721 lines)
   - `src/app/admin/(protected)/produits/[id]/edit/page.tsx`
   - `src/app/admin/(protected)/produits/new/page.tsx`
   - `src/app/admin/(protected)/produits/page.tsx`
   - `src/app/api/admin/models/[id]/visuals/route.ts`
   - `src/app/api/admin/models/[id]/visuals/[visualId]/route.ts`
   - `src/lib/utils.ts` includes `extractStoragePath`
3. `npm install sharp` — explicit dependency (not relying on Next.js bundling)
4. `npx tsc --noEmit` — zero errors

## Verification

```bash
# Merge successful
git log --oneline -3

# Key files exist
ls src/app/admin/\(protected\)/produits/ModelForm.tsx
ls src/app/api/admin/models/*/visuals/route.ts

# sharp installed
node -e "const sharp = require('sharp'); console.log('sharp', sharp.versions.sharp)"

# Type check
npx tsc --noEmit
```

## Exit Criteria

- M004 code is available in the M005 worktree
- `sharp` is in package.json dependencies
- `tsc --noEmit` passes

## Expected Output

- `src/app/admin/(protected)/produits/ModelForm.tsx` — M004 main form component (721 lines)
- `src/app/admin/(protected)/produits/ModelList.tsx` — M004 list component
- `src/app/admin/(protected)/produits/[id]/edit/page.tsx` — M004 edit page
- `src/app/admin/(protected)/produits/new/page.tsx` — M004 new page
- `src/app/admin/(protected)/produits/page.tsx` — M004 list page
- `src/app/api/admin/models/[id]/visuals/route.ts` — M004 visuals API
- `src/app/api/admin/models/[id]/visuals/[visualId]/route.ts` — M004 visual delete
- `src/lib/utils.ts` — shared `extractStoragePath` utility
- `package.json` — updated with `sharp` dependency

## Observability Impact

- **New signal:** `sharp` library available at runtime — verifiable with `node -e "require('sharp').versions.sharp"`
- **Inspection:** All M004 admin pages and API routes now present — verifiable via `find src/app/admin -name "*.tsx" | grep produits` and `find src/app/api/admin/models -name "route.ts"`
- **Failure state:** If merge had conflicts, `git status` would show unmerged paths. If `tsc` fails, error output identifies broken imports/types from M004 code.
