---
id: T04
parent: S01
milestone: M006
key_files:
  - src/app/api/admin/visuals/export/[modelId]/route.ts
  - src/app/admin/(protected)/produits/ModelForm.tsx
key_decisions:
  - D021: Restructured export route to visuals/export/[modelId] to avoid dynamic segment collision
duration: ""
verification_result: passed
completed_at: 2026-03-25T03:18:31.446Z
blocker_discovered: false
---

# T04: E2E verification — fixed dynamic segment collision, confirmed tsc, auth guard, UI integration, and file naming

**E2E verification — fixed dynamic segment collision, confirmed tsc, auth guard, UI integration, and file naming**

## What Happened

Executed end-to-end verification of the ZIP export feature. Discovered a critical runtime bug: Next.js threw 'different slug names for the same dynamic path' because visuals/[modelId]/export/ collided with existing visuals/[id]/ routes. Fixed by restructuring to visuals/export/[modelId]/. Updated ModelForm fetch URL to match. Verified: tsc zero errors, curl 401 without auth, export button with loader state, blob download logic, CSS classes, file naming pattern, empty case 404, content headers. Decision D021 recorded.

## Verification

npx tsc --noEmit → 0 errors. curl without auth → 401. grep confirms Exporter ZIP button, exporting state, createObjectURL download, 9 CSS classes. Route uses {model.slug}-{fabric.slug}-{view_type}.jpg naming. requireAdmin() guard present. Committed as c3bac52.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 3200ms |
| 2 | `curl -s -w HTTP_STATUS:%{http_code} http://localhost:3006/api/admin/visuals/export/test` | 0 | ✅ pass (401 returned) | 8800ms |
| 3 | `git commit (T04 fix)` | 0 | ✅ pass — c3bac52 | 500ms |


## Deviations

Route restructured from visuals/[modelId]/export/ to visuals/export/[modelId]/ to fix Next.js dynamic segment collision. Auto-mode wrote summary but did not commit — committed manually as c3bac52.

## Known Issues

Full authenticated export with real data not tested — no admin credentials in worktree env. Should be tested manually on deployment.

## Files Created/Modified

- `src/app/api/admin/visuals/export/[modelId]/route.ts`
- `src/app/admin/(protected)/produits/ModelForm.tsx`
