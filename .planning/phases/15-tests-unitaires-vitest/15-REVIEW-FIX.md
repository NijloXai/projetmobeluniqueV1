---
phase: 15-tests-unitaires-vitest
fixed_at: 2026-04-09T12:01:00Z
review_path: .planning/phases/15-tests-unitaires-vitest/15-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 15 : Code Review Fix Report

**Fixed at:** 2026-04-09T12:01:00Z
**Source review:** .planning/phases/15-tests-unitaires-vitest/15-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01 : fetch global stubbe sans restauration systematique

**Files modified:** `src/__tests__/nano-banana.test.ts`
**Commit:** be86a0f
**Applied fix:** Ajout de `vi.unstubAllGlobals()` dans le `afterEach` du describe `NanoBananaService`. Les tests qui appellent `vi.stubGlobal('fetch', ...)` dans les `it()` individuels sont maintenant nettoyes systematiquement apres chaque test, eliminant tout risque de contamination entre tests.

### WR-02 : Chaine de mocks sequentielle fragile dans generate-all-route.test.ts

**Files modified:** `src/__tests__/generate-all-route.test.ts`
**Commit:** 891d5f6
**Applied fix:** Refactoring complet du mock Supabase. Le `mockSingle` partage a ete remplace par des mocks specifiques par table : `mockModelSingle`, `mockFabricSingle`, `mockImageOrder`, `mockVisualMaybeSingle`, `mockVisualInsertSingle`, `mockVisualDelete`. La fonction `from()` est maintenant sensible au nom de table et retourne le mock adapte. Les tests utilisent les mocks specifiques, eliminant la dependance a l'ordre sequentiel des appels Supabase.

### WR-03 : Cast `as never` sur les parametres Request des handlers

**Files modified:** `src/__tests__/generate-route.test.ts`, `src/__tests__/generate-all-route.test.ts`
**Commit:** 697228e
**Applied fix:** Import de `NextRequest` depuis `next/server` dans les deux fichiers de test. La fonction helper `makeRequest()` retourne desormais un `NextRequest` au lieu d'un `Request` standard. Tous les casts `as never` (5 dans generate-all, 4 dans generate) ont ete supprimes. Les tests passent maintenant des `NextRequest` natifs aux handlers, ce qui permettra de detecter a la compilation toute utilisation de proprietes specifiques a `NextRequest` (`.nextUrl`, `.cookies`, etc.).

---

_Fixed: 2026-04-09T12:01:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
