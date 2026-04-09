---
phase: 15-tests-unitaires-vitest
plan: "02"
subsystem: tests
tags: [vitest, unit-tests, requireAdmin, auth, 401]
dependency_graph:
  requires: []
  provides: [TEST-03]
  affects: [src/__tests__/require-admin.test.ts, src/__tests__/generate-route.test.ts, src/__tests__/generate-all-route.test.ts]
tech_stack:
  added: []
  patterns: [vi.mock supabase/server, vi.mocked().mockResolvedValueOnce, import dynamique post-mock]
key_files:
  created:
    - src/__tests__/require-admin.test.ts
  modified:
    - src/__tests__/generate-route.test.ts
    - src/__tests__/generate-all-route.test.ts
decisions:
  - "Mock @/lib/supabase/server (pas @/lib/supabase/admin) pour tester requireAdmin() sans court-circuiter la fonction"
  - "vi.mocked(requireAdmin).mockResolvedValueOnce pour surcharge ponctuelle du mock global dans les tests 401 routes"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-04-09"
  tasks_completed: 2
  files_changed: 3
---

# Phase 15 Plan 02: Tests unitaires requireAdmin + tests 401 routes admin Summary

**One-liner:** Tests unitaires requireAdmin() (3 cas : token absent, expiré, valide) + tests 401 ajoutés aux routes generate et generate-all via surcharge ponctuelle du mock.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Créer require-admin.test.ts — 3 tests unitaires requireAdmin (D-01) | 6b81cc9 | src/__tests__/require-admin.test.ts (créé, 64 lignes) |
| 2 | Ajouter tests 401 dans generate-route et generate-all-route (D-02) | c90873a | src/__tests__/generate-route.test.ts, src/__tests__/generate-all-route.test.ts |

## Verification Results

```
src/__tests__/require-admin.test.ts   3 tests — 3 passed
src/__tests__/generate-route.test.ts  6 tests → 7 tests — 7 passed (+1 test 401)
src/__tests__/generate-all-route.test.ts 5 tests → 6 tests — 6 passed (+1 test 401)

Total plan 02 : 15 tests, 0 échecs
Suite complète : 183 tests, 15 fichiers, 0 échecs
```

## Deviations from Plan

None — plan exécuté exactement tel qu'écrit.

## Known Stubs

None — fichiers de test uniquement, aucun stub de données ou UI.

## Threat Flags

None — phase test-only, aucune surface d'attaque créée (conforme au threat model T-15-03/T-15-04).

## Self-Check: PASSED
