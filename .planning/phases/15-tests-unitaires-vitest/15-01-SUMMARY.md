---
phase: 15-tests-unitaires-vitest
plan: 01
subsystem: testing
tags: [vitest, unit-tests, utils, nano-banana, fake-timers, abort-error]

# Dependency graph
requires:
  - phase: 13-integration-nano-banana
    provides: NanoBananaService avec retry loop (isRetryableError, sleep, MAX_RETRIES=3)
  - phase: 01-fondation-header
    provides: fonctions pures utils.ts (slugify, calculatePrice, extractStoragePath)
provides:
  - Tests unitaires slugify, calculatePrice, extractStoragePath (16 tests, fonctions pures)
  - Test timeout D-07 AbortError dans NanoBananaService (fake timers, 3 retries verifies)
affects: [15-02-tests-require-admin-routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.useFakeTimers() + vi.runAllTimersAsync() pour court-circuiter sleep() dans retry loop"
    - ".catch(() => undefined) immediat sur une promesse pour eviter unhandled rejection pendant avance des timers"
    - "Import direct sans vi.mock() pour fonctions pures (slugify, calculatePrice, extractStoragePath)"

key-files:
  created:
    - src/__tests__/utils.test.ts
  modified:
    - src/__tests__/nano-banana.test.ts

key-decisions:
  - "Mocker generateContent pour rejeter AbortError directement plutot que d'attendre le vrai AbortSignal.timeout() — contourne la dependance au comportement WebAPI de happy-dom"
  - "Attacher .catch(() => undefined) immediatement apres generation de la promesse pour eviter PromiseRejectionHandledWarning pendant vi.runAllTimersAsync()"
  - "Fallback non necessaire : vi.runAllTimersAsync() suffit pour bypasser sleep() dans le retry loop"

patterns-established:
  - "Fonctions pures : import direct, aucun vi.mock()"
  - "Timeout test : mockRejectedValue(abortErr) + vi.useFakeTimers() + .catch vide immediat"

requirements-completed: [TEST-01, TEST-02, TEST-04]

# Metrics
duration: 5min
completed: 2026-04-09
---

# Phase 15 Plan 01: Tests Unitaires Utils + NanoBanana Timeout Summary

**Tests unitaires pures utils (16 cas : slugify accents FR/DE, calculatePrice premium, extractStoragePath URLs) et test timeout AbortError D-07 dans NanoBanana avec vi.useFakeTimers() verifiant 3 retries en 3ms**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-09T09:04:00Z
- **Completed:** 2026-04-09T09:06:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- utils.test.ts cree avec 16 tests couvrant 3 fonctions pures sans aucun mock
- Test timeout D-07 ajoute dans nano-banana.test.ts : AbortError retryable, 3 appels mockGenerateContent verifies, execution en 3ms grace aux fake timers
- Suite nano-banana.test.ts passe desormais 15 tests (14 existants + 1 nouveau), 0 erreurs

## Task Commits

Chaque tache commitee atomiquement :

1. **Task 1: Creer utils.test.ts — tests fonctions pures (D-03, D-04)** - `38331ac` (test)
2. **Task 2: Ajouter test timeout dedie dans nano-banana.test.ts (D-07)** - `c0632cd` (test)

## Files Created/Modified
- `src/__tests__/utils.test.ts` — 16 tests unitaires : slugify (6 cas), calculatePrice (5 cas), extractStoragePath (5 cas)
- `src/__tests__/nano-banana.test.ts` — ajout describe('timeout (D-07)') avec 1 test AbortError + fake timers

## Decisions Made
- Mocker `generateContent` pour rejeter AbortError directement (pas de vrai AbortSignal.timeout) : contourne la dependance au runtime happy-dom
- Attacher `.catch(() => undefined)` immediatement apres la promesse pour eviter `PromiseRejectionHandledWarning` pendant `vi.runAllTimersAsync()`
- Aucun fallback slow-timer necessaire : vi.runAllTimersAsync() fonctionne correctement avec le sleep() de nano-banana

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Correction unhandled rejection pendant vi.runAllTimersAsync()**
- **Found during:** Task 2 (test timeout D-07)
- **Issue:** La promesse `generatePromise` etait detectee comme unhandled rejection pendant l'avance des fake timers, avant d'etre consommee par `await expect(...).rejects.toThrow()`. Vitest signalait 1 unhandled error meme si les 15 tests passaient.
- **Fix:** Ajout de `generatePromise.catch(() => undefined)` immediatement apres la creation de la promesse pour attacher un handler vide, eliminant l'avertissement sans changer le comportement observable.
- **Files modified:** src/__tests__/nano-banana.test.ts
- **Verification:** `npx vitest run src/__tests__/nano-banana.test.ts` — 15 tests passes, 0 erreurs, 0 unhandled rejections
- **Committed in:** c0632cd (Task 2 commit)

---

**Total deviations:** 1 auto-fixe (Rule 1 — bug correctness)
**Impact on plan:** Fix mineur, aucune modification des assertions ni de la logique du test. Correction de l'avertissement Vitest uniquement.

## Issues Encountered

L'interaction entre `vi.useFakeTimers()` et `mockRejectedValue()` crée une fenetre ou la promesse est en etat "pending + rejected" avant qu'un handler soit attache. Le `.catch(() => undefined)` immediat resout proprement ce cas edge sans modifier les assertions.

## User Setup Required
None - aucune configuration externe requise.

## Next Phase Readiness
- Plan 01 complete : utils.test.ts (16 tests) + timeout D-07 (nano-banana.test.ts, 15 tests)
- Plan 02 (require-admin.test.ts + tests 401 routes) est independant et peut s'executer en parallele
- Aucun bloqueur

---
*Phase: 15-tests-unitaires-vitest*
*Completed: 2026-04-09*
