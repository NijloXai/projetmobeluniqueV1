---
phase: 04-prerequis-catalogue-core
plan: 01
subsystem: ui
tags: [next-image, supabase-storage, product-card, skeleton, tdd, css-modules, lucide-react]

# Dependency graph
requires:
  - phase: 03-how-it-works
    provides: pattern CSS Modules composants public, tokens globals.css, lucide-react install
provides:
  - next.config.ts remotePatterns Supabase Storage (TECH-01 debloque)
  - ProductCard composant presentationnel avec image 3/4, nom, prix fr-FR, CTA
  - CatalogueSkeletonGrid avec 3 skeletons shimmer et aria-busy
affects:
  - 04-02 (CatalogueClient importe ProductCard et CatalogueSkeletonGrid)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED-GREEN : tests crees avant composants, composants implementes pour passer les tests"
    - "next/image avec fill + sizes pour images Supabase Storage"
    - "Intl.NumberFormat('fr-FR') pour prix localises"
    - "remotePatterns double wildcard **.supabase.co pour tous sous-domaines Supabase"

key-files:
  created:
    - next.config.ts
    - src/components/public/Catalogue/ProductCard.tsx
    - src/components/public/Catalogue/ProductCard.module.css
    - src/components/public/Catalogue/ProductCardSkeleton.tsx
    - src/components/public/Catalogue/ProductCardSkeleton.module.css
    - src/__tests__/nextconfig.test.ts
    - src/__tests__/ProductCard.test.tsx
    - src/__tests__/ProductCardSkeleton.test.tsx
  modified: []

key-decisions:
  - "remotePatterns hostname **.supabase.co (double wildcard) couvre tous les projets Supabase sans hardcoder le project ref"
  - "pathname /storage/v1/object/public/** restreint aux buckets publics uniquement (securite)"
  - "getPrimaryImage prioritise view_type === '3/4', fallback model_images[0] (deja trie par sort_order)"
  - "formatPrice avec Intl.NumberFormat('fr-FR') + prefixe 'a partir de' — localisation native sans librairie"
  - "ProductCardSkeleton exporte les deux : ProductCardSkeleton (individuel) et CatalogueSkeletonGrid (grille x3)"

patterns-established:
  - "Composant presentationnel pur : aucune logique fetch, props uniquement (ModelWithImages)"
  - "Placeholder Sofa (lucide-react) quand model_images vide — aria-hidden, pas d'img dans le DOM"
  - "CTA button type=button avec aria-label descriptif pour accessibilite"
  - "Skeleton avec aria-busy=true et aria-label sur le container section"

requirements-completed: [TECH-01, CAT-01, CAT-03]

# Metrics
duration: 2min
completed: 2026-03-28
---

# Phase 04 Plan 01: Prerequis Catalogue Core Summary

**next.config.ts remotePatterns Supabase debloque, ProductCard et CatalogueSkeletonGrid implementes en TDD avec 36 tests GREEN**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-28T07:17:38Z
- **Completed:** 2026-03-28T07:19:40Z
- **Tasks:** 2
- **Files modified:** 8 (4 composants + 3 tests + 1 config)

## Accomplishments

- next.config.ts configure avec remotePatterns `**.supabase.co` — images Supabase Storage desormais chargees sans erreur 400
- ProductCard presentationnel : image (priorite 3/4), nom uppercase h3, prix Intl fr-FR, description, CTA avec aria-label
- CatalogueSkeletonGrid : 3 skeletons avec animation shimmer CSS, aria-busy, id=catalogue
- 36 tests vitest passes en tout (6 fichiers de test) — zero regression
- Zero erreur TypeScript

## Task Commits

1. **Task 1: Config next.config.ts + test stubs RED** - `9c95fbe` (feat)
2. **Task 2: Composants ProductCard et ProductCardSkeleton GREEN** - `c6d6418` (feat)

## Files Created/Modified

- `next.config.ts` - remotePatterns Supabase **.supabase.co /storage/v1/object/public/**
- `src/components/public/Catalogue/ProductCard.tsx` - Card produit presentationnelle (ModelWithImages)
- `src/components/public/Catalogue/ProductCard.module.css` - Tonal layering, aspect 4/5, hover scale
- `src/components/public/Catalogue/ProductCardSkeleton.tsx` - Skeleton x3 avec aria-busy
- `src/components/public/Catalogue/ProductCardSkeleton.module.css` - @keyframes shimmer, grid responsive
- `src/__tests__/nextconfig.test.ts` - Test TECH-01 remotePatterns
- `src/__tests__/ProductCard.test.tsx` - 6 tests ProductCard (image, prix, CTA, placeholder)
- `src/__tests__/ProductCardSkeleton.test.tsx` - 3 tests CatalogueSkeletonGrid (skeletons, aria, id)

## Decisions Made

- double wildcard `**.supabase.co` dans remotePatterns plutot que hostname fixe — evite de hardcoder le project ref Supabase
- `pathname: '/storage/v1/object/public/**'` restreint la permission aux buckets publics uniquement
- `getPrimaryImage` cherche `view_type === '3/4'` en priorite, fallback `model_images[0]` — robuste meme si le tri sort_order est absent
- `Intl.NumberFormat('fr-FR')` natif sans librairie externe pour formater le prix en francais

## Deviations from Plan

None - plan execute exactement comme specifie.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ProductCard et CatalogueSkeletonGrid prets a etre importes par CatalogueClient (Plan 04-02)
- TECH-01 debloque : next/image peut desormais charger des URLs Supabase Storage
- CAT-01 et CAT-03 satisfaits : briques de base du catalogue disponibles
- Plan 04-02 peut commencer immediatement (CatalogueSection server + CatalogueClient avec fetch API)

---
*Phase: 04-prerequis-catalogue-core*
*Completed: 2026-03-28*
