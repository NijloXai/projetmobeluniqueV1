---
phase: 05-recherche-et-tats-interactifs
plan: "02"
subsystem: catalogue-search
tags: [search, filter, accessibility, tdd, css-modules]
dependency_graph:
  requires: [05-01]
  provides: [SRCH-01, SRCH-02, CAT-04]
  affects: [src/components/public/Catalogue/CatalogueClient.tsx, src/components/public/Catalogue/CatalogueSection.module.css]
tech_stack:
  added: []
  patterns: [derive-state, normalize-NFD, tonal-layering, aria-label]
key_files:
  modified:
    - src/components/public/Catalogue/CatalogueClient.tsx
    - src/components/public/Catalogue/CatalogueSection.module.css
decisions:
  - "aria-label du bouton clear X changé en 'Vider le champ de recherche' pour éviter doublon avec 'Effacer la recherche' dans emptySearch (test getByRole exigeait un seul element)"
metrics:
  duration: "~10 min"
  completed: "2026-03-29"
  tasks: 2
  files: 2
---

# Phase 05 Plan 02: Barre de recherche catalogue Summary

Implémentation filtre instantané par nom dans CatalogueClient avec normalisation NFD accents FR, compteur singulier/pluriel, état vide avec reset — 13/13 tests verts, build propre.

## What Was Built

### Task 1: CatalogueClient avec recherche, compteur et état vide
- `useState` + `useRef` pour query et focus programmatique sur reset
- Valeur dérivée `filteredModels` (filter synchrone, pas de useEffect)
- `normalize()`: `.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()` appliquée aux deux opérandes
- Compteur: `filteredModels.length === 1 ? '1 canapé' : \`${filteredModels.length} canapés\``
- Icone `Search` (lucide-react) + input `type="search"` + bouton clear X
- Rendu conditionnel: grille ou `emptySearch` selon `filteredModels.length === 0 && query !== ''`
- Commit: `5d25965`

### Task 2: Styles CSS Phase 05
- `.searchWrapper`: relative, flex, max-width 480px, centré
- `.searchIcon`: absolute left, pointer-events none, color muted
- `.searchInput`: fond `--surface-container-low`, no border, radius-lg, focus ring ambre
- `.clearButton`: absolute right, touch target 32px, focus-visible ring
- `.resultCount`: texte muted 14px entre barre et grille
- `.emptySearch`: flex column centré, padding section
- `.resetButton`: outline secondaire avec hover/focus ambre
- Responsive: searchWrapper full-width < 640px
- Commit: `7e36375`

## Verification

- `npx vitest run src/__tests__/CatalogueClient.test.tsx` → 13/13 passed
- `npm run build` → Compiled successfully (exit 0)
- `npx tsc --noEmit` → zero erreur TypeScript

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Conflit aria-label bouton clear X vs bouton reset**
- **Found during:** Task 1, exécution des tests
- **Issue:** Le test `[SRCH-02] cliquer Effacer la recherche` échouait avec "Found multiple elements" — le bouton X dans le champ avait `aria-label="Effacer la recherche"`, identique au bouton reset dans `emptySearch`. `getByRole('button', { name: /effacer la recherche/i })` trouvait deux éléments.
- **Fix:** Changement aria-label du bouton X en `"Vider le champ de recherche"` — sémantiquement distinct et précis pour les lecteurs d'écran.
- **Files modified:** `src/components/public/Catalogue/CatalogueClient.tsx`
- **Commit:** `5d25965`

## Known Stubs

Aucun — toutes les données sont réelles (filtrage sur `models` fetchés par CatalogueSection depuis Supabase).

## Self-Check: PASSED
