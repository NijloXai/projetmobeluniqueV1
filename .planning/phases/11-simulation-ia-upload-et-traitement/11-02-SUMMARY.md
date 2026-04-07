---
phase: 11-simulation-ia-upload-et-traitement
plan: "02"
subsystem: frontend/configurator
tags: [simulation, upload, dnd, state-machine, abortcontroller, css-modules]
dependency_graph:
  requires:
    - "11-01 — /api/simulate adapté (fabric_id optionnel, MAX_FILE_SIZE 15 Mo)"
    - "ConfiguratorModal.tsx — Phase 8 (swatches) + Phase 9 (navigation angles)"
  provides:
    - "Étape simulation complète dans ConfiguratorModal (5 états)"
    - "Zone upload drag & drop avec preview et validation client"
    - "Barre progression simulée 2 phases + 3 étapes texte"
    - "Bouton 'Visualiser chez moi' dans l'étape configurateur"
  affects:
    - "src/components/public/Catalogue/ConfiguratorModal.tsx"
    - "src/components/public/Catalogue/ConfiguratorModal.module.css"
tech_stack:
  added: []
  patterns:
    - "State machine 5 états (idle/preview/generating/done/error) en useState local"
    - "DnD HTML5 natif avec dragCounterRef anti-flicker"
    - "URL.createObjectURL + revokeObjectURL pour preview mémoire"
    - "AbortController pour annulation fetch en cours"
    - "Progress timer 2 phases (rapide 0-30%, lente 30-70%)"
    - "SVG inline icons sans dépendance externe"
key_files:
  modified:
    - src/components/public/Catalogue/ConfiguratorModal.tsx
    - src/components/public/Catalogue/ConfiguratorModal.module.css
decisions:
  - "useCallback sur toutes les fonctions simulation — dependency arrays stricts, pas de re-render inutile"
  - "dragCounterRef (int) plutôt que simple boolean — évite isDragging flicker au passage sur enfants"
  - "previewUrl/resultBlobUrl révoqués dans 3 endroits : handleFileSelected, reset useEffect (model change), cleanup useEffect (unmount) — couverture complète T-11-07"
  - "as { error?: string } sur response.json() — TypeScript strict sans any"
  - "eslint-disable-line react-hooks/exhaustive-deps uniquement sur cleanup useEffect (dépendances intentionnellement stables)"
metrics:
  duration: "7m"
  completed_date: "2026-04-07"
  tasks_completed: 3
  files_modified: 2
---

# Phase 11 Plan 02: Simulation IA — Étape client (upload, DnD, progression) — Summary

**One-liner:** État simulation 5-étapes dans ConfiguratorModal avec DnD HTML5 natif, AbortController fetch, progression simulée 2 phases, et 62 classes CSS Modules sans dépendance externe.

---

## What Was Built

Extension de `ConfiguratorModal` avec une étape simulation complète côté client. L'étape configurateur existante (phases 6-9) est préservée sans régression. Une nouvelle étape "simulation" est accessible via le CTA "Visualiser chez moi" placé sous le bouton Shopify.

### State machine

```
idle → (fichier valide) → preview → (clic Lancer) → generating → done (Phase 12)
                                                               ↘ error → (Reessayer) → generating
idle → (fichier invalide) → idle + errorMessage
generating → (Annuler) → preview
```

### Fichiers modifiés

**`ConfiguratorModal.tsx`** (+501 lignes, -105 lignes refactoring) :
- Type `SimulationState` et state machine `modalStep`
- 7 nouveaux `useRef` (AbortController, 2 timers, dragCounter, fileInput)
- Validation fichier : ACCEPT_TYPES Set + MAX_SIZE_BYTES 15 Mo + fallback extension HEIC
- DnD : `handleDragEnter/Leave/Over/Drop` avec `dragCounterRef` anti-flicker
- Progress timer 2 phases (`startProgressTimer/stopProgressTimer`)
- `handleLancerSimulation` : fetch FormData → AbortController → blob → `createObjectURL`
- `handleAnnuler` : abort signal → retour état preview
- 4 SVG inline (UploadIcon, CheckIcon, SpinnerIcon, PendingIcon)
- JSX conditionnel `modalStep === 'configurator'` / `modalStep === 'simulation'`
- Cleanup useEffect (unmount) : révocation URLs + clearInterval + abort

**`ConfiguratorModal.module.css`** (+433 lignes) :
- 37 nouvelles classes CSS Phase 11
- `@keyframes slideIn` (animation entrée étape)
- `@keyframes spinRotate` (spinner étape active)
- Responsive : `max-height: 240px` mobile, `min-height: 300px` desktop

---

## Decisions Made

| Décision | Raison |
|----------|--------|
| `dragCounterRef` (int, pas boolean) | Évite le flicker isDragging quand la souris passe sur les enfants de la zone drop |
| `useCallback` sur toutes les handlers simulation | Stabilité des références, évite recréation à chaque render |
| `as { error?: string }` sur `response.json()` | TypeScript strict sans `any` — conforme CLAUDE.md |
| Cleanup useEffect avec `[]` deps | Dépendances intentionnellement capturées en closure au montage — anti-pattern lint justifié |
| JSX conditionnel sur `modalStep` | Démontage propre des éléments DOM simulation quand on revient au configurateur |
| `fileInputRef` dupliqué dans idle et preview | Mutuellement exclusifs via `simulationState` — pas de double input dans le DOM simultanément |

---

## Deviations from Plan

None — plan exécuté exactement comme écrit.

---

## Known Stubs

- `simulationState === 'done'` : l'état `done` est atteint (setSimulationState('done') appelé après réception du blob), mais aucun rendu spécifique n'est affiché — le container `generatingContainer` reste visible jusqu'à Phase 12 qui ajoutera l'affichage du résultat. C'est intentionnel selon le plan ("L'état `done` n'affiche rien de special dans cette phase — ce sera géré en Phase 12").
- `resultBlobUrl` est stocké en state mais non utilisé dans le JSX — sera connecté à la phase d'affichage en Phase 12.

---

## Threat Surface Scan

Aucune nouvelle surface réseau créée dans ce plan. Les mitigations du registre STRIDE ont toutes été implémentées :

| Threat ID | Mitigation appliquée |
|-----------|---------------------|
| T-11-05 | `validateFile()` avec ACCEPTED_TYPES + MAX_SIZE_BYTES |
| T-11-06 | Fallback extension `.heic/.heif` regex dans `validateFile` |
| T-11-07 | `revokeObjectURL` dans 3 chemins (handleFileSelected, reset model, unmount) |
| T-11-08 | `clearInterval` dans `stopProgressTimer` appelé sur tous les chemins (success, error, abort, unmount) |
| T-11-10 | `err.name === 'AbortError'` distingue annulation vs erreur réelle |

---

## Self-Check: PASSED

- [x] `src/components/public/Catalogue/ConfiguratorModal.tsx` — modifié (35d9e1d)
- [x] `src/components/public/Catalogue/ConfiguratorModal.module.css` — modifié (f772b76)
- [x] `npx tsc --noEmit` — exit code 0
- [x] `npm run build` — exit code 0, 22 pages générées
- [x] Aucun `any` dans ConfiguratorModal.tsx
- [x] Aucun `console.log` dans ConfiguratorModal.tsx
- [x] 62 classes `styles.XXX` référencées dans TSX — toutes présentes dans le CSS
- [x] Commits f772b76 (CSS) et 35d9e1d (TSX) vérifiés dans git log
