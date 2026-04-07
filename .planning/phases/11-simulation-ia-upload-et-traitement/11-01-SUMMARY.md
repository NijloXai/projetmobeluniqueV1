---
phase: 11-simulation-ia-upload-et-traitement
plan: 01
subsystem: api
tags: [nextjs, sharp, heic, simulate, formdata, supabase]

# Dependency graph
requires:
  - phase: M005-ia-generation
    provides: route /api/simulate avec service IA mock Sharp + watermark
provides:
  - Route POST /api/simulate avec MAX_FILE_SIZE=15Mo, fabric_id optionnel, gestion HEIC 422
  - buildSimulatePrompt compatible avec "tissu original" comme fabricName
affects:
  - 11-02-simulation-modal (Plan 02 qui consomme cette API cote client)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - try/catch interne sur iaService.generate() — intercepte HEIC avant re-throw catch externe
    - fabricName conditionnel avec valeur par defaut 'tissu original' (D-16 pattern)

key-files:
  created: []
  modified:
    - src/app/api/simulate/route.ts

key-decisions:
  - "fabric_id optionnel dans /api/simulate — valeur par defaut 'tissu original' si absent (D-16)"
  - "MAX_FILE_SIZE releve de 10 Mo a 15 Mo (D-10)"
  - "HEIC gere par try/catch interne — 422 avec message francais specifique, pas de conversion"

patterns-established:
  - "try/catch interne pour erreurs IA — separe des erreurs serveur generiques (500)"

requirements-completed:
  - SIM-01

# Metrics
duration: 8min
completed: 2026-04-07
---

# Phase 11 Plan 01: Simulation IA — Adapter API simulate Summary

**Route /api/simulate mise a jour : fabric_id optionnel avec fallback "tissu original", limite 15 Mo, et gestion HEIC retournant 422 avec message francais**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-07T13:16:00Z
- **Completed:** 2026-04-07T13:24:32Z
- **Tasks:** 2 (1 modification, 1 verification)
- **Files modified:** 1

## Accomplishments

- MAX_FILE_SIZE passe de 10 Mo a 15 Mo (D-10) — message d'erreur mis a jour
- fabric_id rendu optionnel : `let fabricName = 'tissu original'` avec conditionnel DB si present (D-16)
- Gestion HEIC : try/catch interne sur `iaService.generate()` retourne 422 avec message specifique
- buildSimulatePrompt confirme compatible avec "tissu original" — aucune modification requise

## Task Commits

Chaque tache commitee atomiquement :

1. **Task 1: Modifier route /api/simulate** - `e2fe727` (feat)
2. **Task 2: Verifier buildSimulatePrompt** — aucun changement, verification uniquement

**Plan metadata:** (commit docs ci-apres)

## Files Created/Modified

- `src/app/api/simulate/route.ts` — MAX_FILE_SIZE 15 Mo, fabric_id optionnel, HEIC 422, JSDoc mis a jour

## Decisions Made

- fabric_id optionnel avec valeur par defaut "tissu original" — permet simulation sans tissu configure (D-16)
- HEIC gere cote serveur par try/catch (pas de conversion) — message d'erreur explicite en francais pour guider l'utilisateur
- buildSimulatePrompt inchange — la signature `(modelName: string, fabricName: string): string` accepte deja une string libre

## Deviations from Plan

None — plan execute exactement comme ecrit. La reference a `watermarked.length` etait un artefact de la transformation du code (corrige inline, pas une deviation du plan).

## Issues Encountered

- Reference residuelle `watermarked.length` apres remplacement du bloc generate/watermark — corrigee immediatement avant le premier tsc.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: info_disclosure | src/app/api/simulate/route.ts | catch externe (ligne 129-134) expose err.message au client dans la reponse 500 — code pre-existant, hors scope Plan 01 |

## User Setup Required

None — aucune configuration externe requise.

## Next Phase Readiness

- Route /api/simulate prete pour le client Phase 11-02
- fabric_id optionnel : le modal peut appeler l'API sans tissu selectionne
- Limite 15 Mo coherente avec validation client D-11 a implementer en Plan 02
- buildSimulatePrompt inchange : appel direct `buildSimulatePrompt(model.name, fabricName)` fonctionne dans les deux cas

---
*Phase: 11-simulation-ia-upload-et-traitement*
*Completed: 2026-04-07*
