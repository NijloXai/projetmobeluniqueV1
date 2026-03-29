---
phase: 07-fetch-donn-es-c-blage-props
plan: 01
subsystem: ui
tags: [react, typescript, supabase, next.js, server-components, props-drilling]

# Dependency graph
requires:
  - phase: 06-modal-configurateur
    provides: CatalogueSection (server), CatalogueClient (client), ConfiguratorModal — architecture server/client boundary etablie

provides:
  - Type VisualWithFabricAndImage dans database.ts (GeneratedVisual + fabric + model_image)
  - CatalogueSection charge 3 sources en parallele via Promise.all (models, fabrics, visuals)
  - Filtrage JS visuels avec tissu inactif avant passage aux composants enfants
  - Props fabrics + visuals descendent jusqu'a ConfiguratorModal sans fetch client
  - Suite tests etendue : 79 tests verts (5 nouveaux)

affects:
  - 08-swatches-rendu-ia-prix (consomme fabrics et visuals dans ConfiguratorModal)
  - 09-navigation-angles (consomme visuals filtes par angle)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Promise.all server-side pour fetches paralleles sans waterfall
    - Filtrage JS obligatoire sur jointures imbriquees PostgREST (is_active)
    - Props drilling obligatoire (pas de Zustand en Phase 7, reserve v10.0)
    - Prefixe underscore (_fabrics, _visuals) pour props declarees non encore utilisees

key-files:
  created: []
  modified:
    - src/types/database.ts
    - src/components/public/Catalogue/CatalogueSection.tsx
    - src/components/public/Catalogue/CatalogueClient.tsx
    - src/components/public/Catalogue/ConfiguratorModal.tsx
    - src/__tests__/CatalogueClient.test.tsx
    - src/__tests__/ConfiguratorModal.test.tsx

key-decisions:
  - "Promise.all dans CatalogueSection (server) — zero waterfall reseau, 3 fetches en parallele"
  - "Filtrage is_active cote JS (pas via PostgREST) — PostgREST ne filtre pas les colonnes de jointures imbriquees"
  - "Props fabrics et visuals obligatoires (sans ?) dans ConfiguratorModal — force le passage des donnees des la Phase 7"
  - "Prefixe _fabrics/_visuals dans ConfiguratorModal — props declarees mais utilisees en Phase 8, linter satisfait"

patterns-established:
  - "Promise.all pattern: [modelsResult, fabricsResult, visualsResult] = await Promise.all([...]) dans Server Component"
  - "Filtre type guard: (v): v is VisualWithFabricAndImage => v.fabric !== null && (v.fabric as Fabric).is_active === true"
  - "Props drilling: CatalogueSection → CatalogueClient → ConfiguratorModal (pas de Zustand avant Phase 10)"

requirements-completed: [CONF-01, CONF-02, CONF-04, CONF-05, CONF-07, CONF-08, CONF-09, CONF-10]

# Metrics
duration: 3min
completed: 2026-03-29
---

# Phase 7 Plan 01: Fetch Donnees Cablage Props Summary

**Pipeline server-side enrichi avec Promise.all (models + fabrics + visuals publies) et props drilling jusqu'a ConfiguratorModal sans fetch client**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-29T14:49:32Z
- **Completed:** 2026-03-29T14:52:24Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Type `VisualWithFabricAndImage` exporte depuis `database.ts` (GeneratedVisual + fabric jointure + model_image jointure)
- `CatalogueSection` fait 3 fetches en parallele via `Promise.all` — zero waterfall reseau
- Filtrage JS obligatoire : visuels avec tissu inactif exclus cote serveur avant passage aux composants enfants
- Props `fabrics` et `visuals` descendent de CatalogueSection → CatalogueClient → ConfiguratorModal sans aucun fetch client
- Suite tests etendue de 74 a 79 tests verts (5 nouveaux tests)

## Task Commits

1. **Task 1: Type VisualWithFabricAndImage + Promise.all fetch + props drilling** - `962d135` (feat)
2. **Task 2: Etendre les tests existants pour les nouvelles props et le filtrage is_active** - `4d8f7a1` (test)

**Plan metadata:** (docs commit ci-dessous)

## Files Created/Modified

- `src/types/database.ts` — Ajout export type VisualWithFabricAndImage (ligne 216)
- `src/components/public/Catalogue/CatalogueSection.tsx` — Promise.all 3 sources, filtrage JS is_active, props forwarding
- `src/components/public/Catalogue/CatalogueClient.tsx` — Interface etendue (fabrics, visuals), forwarding vers ConfiguratorModal
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — Interface etendue (fabrics, visuals obligatoires, prefixes _)
- `src/__tests__/CatalogueClient.test.tsx` — mockFabrics + mockVisuals, tous les render mis a jour, 2 nouveaux tests
- `src/__tests__/ConfiguratorModal.test.tsx` — mockFabrics + mockVisuals, tous les render mis a jour, 3 nouveaux tests

## Decisions Made

- **Promise.all dans CatalogueSection** : 3 fetches en parallele (models, fabrics, visuals) pour eliminer le waterfall reseau qui surgirait si ConfiguratorModal fetchait les donnees a l'ouverture.
- **Filtrage JS obligatoire** : PostgREST ne filtre pas les colonnes de jointures imbriquees via `.eq()` standard. Le filtre `v.fabric.is_active === true` doit etre applique cote JS apres reception des donnees.
- **Props obligatoires sans ?** : `fabrics: Fabric[]` et `visuals: VisualWithFabricAndImage[]` sont declares non-optionnels dans ConfiguratorModal pour forcer le passage des donnees et garantir la disponibilite en Phase 8.
- **Prefixe underscore** : `_fabrics`/`_visuals` dans la destructuration ConfiguratorModal pour satisfaire le linter TypeScript (variables declarees mais non utilisees en Phase 7, consommees en Phase 8).

## Deviations from Plan

None - plan execute exactement tel qu'ecrit.

## Issues Encountered

None. TypeScript a detecte les props manquantes dans les fichiers test lors de la verification Task 1 — comportement attendu, resolu par Task 2 comme prevu dans le plan.

## Known Stubs

- `ConfiguratorModal.tsx` ligne 113-118 : placeholder "Configurateur a venir" reste en place. Props `fabrics` et `visuals` sont recues mais pas encore consommees dans le JSX. Resolution prevue en Phase 8 (swatches + rendu IA + prix).

## User Setup Required

None - aucune configuration externe requise.

## Next Phase Readiness

- Phase 8 peut consommer directement `fabrics` et `visuals` depuis les props de ConfiguratorModal
- Les swatches cliquables (CONF-01), le rendu IA par tissu (CONF-02), et le prix dynamique (CONF-03) ont toutes leurs donnees disponibles
- Aucun fetch supplementaire necessaire a l'ouverture du modal

---
*Phase: 07-fetch-donn-es-c-blage-props*
*Completed: 2026-03-29*
