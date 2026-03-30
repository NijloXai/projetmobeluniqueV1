---
phase: 09-navigation-angles
plan: 01
subsystem: ui
tags: [react, css-modules, next-image, vitest, tdd, accessibility, aria]

# Dependency graph
requires:
  - phase: 08-configurateur-core
    provides: ConfiguratorModal avec swatches tissus, selectedFabricId, currentVisual, layout 2 colonnes
provides:
  - Navigation angles avec thumbnails cliquables sous l'image principale (CONF-06)
  - Filtrage angles par tissu selectionne (seuls les angles avec rendu publie)
  - Crossfade 200ms sur changement d'image via key remount + @keyframes imageFadeIn
  - getPrimaryImageId utility pour selection angle par defaut (3/4 ou premier)
  - handleFabricSelect avec preservation angle (D-12)
  - Alt text dynamique avec nom d'angle (D-07)
affects: [simulation-ia, v9-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Crossfade React via key prop sur Image — remount = re-fade sans state supplementaire"
    - "radiogroup/radio ARIA pattern pour thumbnails angles (coherent avec swatches Phase 8)"
    - "availableAngles computed depuis selectedFabricId + visuals — derive pure sans memo"
    - "leftColumn wrapper pour grouper imageWrapper + thumbnailRow dans colonne gauche desktop"

key-files:
  created: []
  modified:
    - src/components/public/Catalogue/ConfiguratorModal.tsx
    - src/components/public/Catalogue/ConfiguratorModal.module.css
    - src/__tests__/ConfiguratorModal.test.tsx

key-decisions:
  - "key={displayImageUrl} sur Image principale — crossfade gratuit via remount React (pas de state opacity)"
  - "leftColumn div wrapper — isole imageWrapper + thumbnailRow pour layout 2 colonnes desktop sans casser le responsive"
  - "availableAngles calcule inline — derive pure depuis selectedFabricId et visuals, pas besoin de useMemo"
  - "handleFabricSelect remplace setSelectedFabricId direct — encapsule la logique preservation angle D-12"

patterns-established:
  - "Crossfade image: key={url} sur next/Image + @keyframes imageFadeIn 200ms ease"
  - "Thumbnail actif: border-color + outline var(--color-primary) — identique a .swatchSelected Phase 8"
  - "Filtrage angles: model_images.filter(img => visuals.some(v => v.model_image_id === img.id && v.fabric_id === selectedFabricId && v.is_published))"

requirements-completed: [CONF-04, CONF-06]

# Metrics
duration: 4min
completed: 2026-03-30
---

# Phase 09 Plan 01: Navigation Angles Summary

**Thumbnails angles cliquables sous l'image principale avec crossfade 200ms, filtrage par tissu selectionne et preservation de l'angle au changement de tissu**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-30T01:02:24Z
- **Completed:** 2026-03-30T01:05:57Z
- **Tasks:** 2 (RED + GREEN)
- **Files modified:** 3

## Accomplishments

- Rangee de thumbnails `role="radiogroup"` sous l'image principale, visible quand >= 2 angles disponibles (D-11)
- Crossfade 200ms via `key={displayImageUrl}` sur `<Image>` + `@keyframes imageFadeIn` (D-06)
- Filtrage angles par tissu : seuls les angles ayant un rendu IA publie apparaissent quand un tissu est selectionne (D-10)
- Preservation de l'angle au changement de tissu si le nouveau tissu a un rendu pour cet angle, sinon reset au 3/4 (D-12)
- Alt text dynamique incluant le nom de l'angle (D-07)
- Reset de l'angle au changement de modele (D-16)
- 45 tests verts (Phase 6 + Phase 8 + Phase 9), zero regression, build propre

## Task Commits

1. **Task 1: Tests Phase 9 — navigation angles (RED)** - `c9dc3b3` (test)
2. **Task 2: Implementation navigation angles (GREEN)** - `d42b5f2` (feat)

## Files Created/Modified

- `src/components/public/Catalogue/ConfiguratorModal.tsx` - Ajout getPrimaryImageId, selectedAngle useState, availableAngles, handleFabricSelect avec preservation, thumbnailRow JSX, imageAlt dynamique, leftColumn wrapper
- `src/components/public/Catalogue/ConfiguratorModal.module.css` - Ajout .leftColumn, .thumbnailRow, .thumbnail, .thumbnailActive, .imageMain, @keyframes imageFadeIn, responsive desktop leftColumn 50%
- `src/__tests__/ConfiguratorModal.test.tsx` - Fixtures Phase 9 (mockModelMultiAngle, mockVisualsMultiAngle, mockVisualsPartialAngles, mockVisualsSingleAngle) + 10 tests Phase 9

## Decisions Made

- `key={displayImageUrl}` sur Image principale pour le crossfade : remount React provoque re-fade sans state supplementaire — solution simple et robuste
- `leftColumn` div wrapper : groupe imageWrapper + thumbnailRow pour que la colonne gauche desktop (50%) contienne les deux elements ensemble sans modifier le layout .inner existant
- `handleFabricSelect` fonction separee : encapsule `setSelectedFabricId` + logique preservation angle au meme endroit — coherence avec le contrat D-12

## Deviations from Plan

None - plan execute exactement comme specifie.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Navigation angles complete : CONF-04 + CONF-06 satisfaits
- ConfiguratorModal pret pour integration v9.0 complete (verification manuelle navigateur)
- iOS Safari scroll lock a tester sur appareil physique (concern Phase 8 toujours actif)

---
*Phase: 09-navigation-angles*
*Completed: 2026-03-30*

## Self-Check: PASSED

- SUMMARY.md : FOUND
- ConfiguratorModal.tsx : FOUND
- ConfiguratorModal.module.css : FOUND
- Test file : FOUND
- Commit c9dc3b3 (RED) : FOUND
- Commit d42b5f2 (GREEN) : FOUND
