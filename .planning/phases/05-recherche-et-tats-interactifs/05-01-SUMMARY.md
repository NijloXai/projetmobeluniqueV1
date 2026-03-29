---
phase: 05-recherche-et-tats-interactifs
plan: "01"
subsystem: testing
tags: [vitest, testing-library, user-event, tdd, red-phase, catalogue, search]

# Dependency graph
requires:
  - phase: 04-prerequis-catalogue-core
    provides: CatalogueClient component (CatalogueClient.tsx) with 7 passing tests as base
provides:
  - 6 RED tests covering SRCH-01 (accent normalization, partial match), SRCH-02 (empty state, reset), CAT-04 (counter singular/plural)
  - Contract comportemental executable pour l'implementation Plan 02
affects:
  - 05-02-PLAN (implementation doit faire passer ces 6 tests RED)

# Tech tracking
tech-stack:
  added:
    - "@testing-library/user-event@14.6.1 — interactions clavier/souris dans les tests"
  patterns:
    - "TDD RED phase: tests ecrits avant implementation, echouent intentionnellement"
    - "userEvent.setup() pour interactions asynchrones realistes (type, click)"
    - "getByLabelText pour trouver le champ de recherche via aria-label"
    - "queryByText pour assertions negatives (element absent du DOM)"

key-files:
  created: []
  modified:
    - src/__tests__/CatalogueClient.test.tsx

key-decisions:
  - "Tests RED intentionnellement echouants — ne pas modifier CatalogueClient.tsx dans ce plan"
  - "@testing-library/user-event installe (Rule 3 - dep manquante bloquante)"
  - "mockModels[0].name = 'Milano' suffit pour SRCH-01 cas 1 (mil matche Milano)"
  - "Modele local modelsWithAccent utilise pour SRCH-01 cas 2 (Canape Milano avec accent)"

patterns-established:
  - "TDD RED: describe bloc isole 'recherche et filtrage' apres les tests existants"
  - "SRCH tests: userEvent.setup() + getByLabelText(/rechercher un canapé par nom/i)"

requirements-completed:
  - SRCH-01
  - SRCH-02
  - CAT-04

# Metrics
duration: 1min
completed: 2026-03-29
---

# Phase 05 Plan 01: Tests RED Recherche Catalogue Summary

**6 tests RED TDD ecrits pour recherche catalogue (SRCH-01/SRCH-02/CAT-04) avec @testing-library/user-event, contrat comportemental etabli avant implementation**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-29T08:51:18Z
- **Completed:** 2026-03-29T08:52:08Z
- **Tasks:** 1
- **Files modified:** 3 (test file + package.json + package-lock.json)

## Accomplishments

- Ajout de l'import `userEvent` et d'un nouveau describe bloc "recherche et filtrage" avec 6 tests RED
- Installation de `@testing-library/user-event@14.6.1` (dependance manquante)
- 7 tests existants restent verts (zero regression)
- 6 nouveaux tests echouent comme attendu (RED confirme) : suite 7 passed + 6 failed

## Task Commits

1. **Task 1: Ecrire les tests RED (SRCH-01, SRCH-02, CAT-04)** - `f92a8f7` (test)

**Plan metadata:** a venir (docs commit)

## Files Created/Modified

- `src/__tests__/CatalogueClient.test.tsx` - Ajout import userEvent + 6 nouveaux tests RED dans describe "recherche et filtrage"
- `package.json` - Ajout @testing-library/user-event@14.6.1 en devDependencies
- `package-lock.json` - Lock file mis a jour

## Decisions Made

- Installation de @testing-library/user-event necessaire car absent du package.json (bloquant pour les tests interactifs)
- Tests ecrits sans modifier CatalogueClient.tsx — contrat comportemental pur
- getByLabelText utilise pour acceder au champ de recherche via aria-label (accessibilite)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installation de @testing-library/user-event**
- **Found during:** Task 1 (ecriture des tests RED)
- **Issue:** Le package @testing-library/user-event n'etait pas dans package.json — import impossible
- **Fix:** `npm install --save-dev @testing-library/user-event`
- **Files modified:** package.json, package-lock.json
- **Verification:** Import userEvent fonctionne dans le fichier de test, tests s'executent sans erreur d'import
- **Committed in:** f92a8f7 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 dep bloquante)
**Impact on plan:** Installation necessaire et prevue dans la VALIDATION.md ("Verify @testing-library/user-event is available"). Aucun scope creep.

## Issues Encountered

Aucun probleme. L'installation de user-event etait anticipee dans 05-VALIDATION.md Wave 0 requirements.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 6 tests RED prêts, contrat comportemental etabli
- Plan 02 doit implementer dans CatalogueClient.tsx :
  - Champ de recherche avec aria-label "Rechercher un canapé par nom"
  - Filtrage par nom avec normalisation NFD (accents insensibles)
  - Etat vide avec message "Aucun canapé ne correspond" + terme de recherche
  - Bouton "Effacer la recherche" qui remet toutes les cards
  - Compteur "X canapé(s)" avec singulier/pluriel
- Aucun bloqueur

## Self-Check: PASSED

- FOUND: src/__tests__/CatalogueClient.test.tsx
- FOUND: .planning/phases/05-recherche-et-tats-interactifs/05-01-SUMMARY.md
- FOUND: commit f92a8f7

---
*Phase: 05-recherche-et-tats-interactifs*
*Completed: 2026-03-29*
