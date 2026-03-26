---
phase: 03-howitworks-assemblage
plan: 01
subsystem: ui
tags: [lucide-react, motion/react, useInView, CSS Modules, animation, responsive]

# Dependency graph
requires:
  - phase: 02-hero-plein-cran
    provides: Hero component with motion/react pattern (motion.div, useReducedMotion)
  - phase: 01-header-sticky
    provides: Header component, page.tsx integration pattern, globals.css tokens
provides:
  - HowItWorks component — 3 step cards with scroll animation and stagger
  - HowItWorks.module.css — CSS Grid responsive 1col/3col layout
  - HowItWorks tests — 9 unit tests covering STEP-01, STEP-02, STEP-03
  - page.tsx — template Next.js placeholder fully replaced
affects: [04-catalogue, page-publique, frontend-public]

# Tech tracking
tech-stack:
  added: [lucide-react@1.7.0]
  patterns:
    - useInView with once:true and margin:-100px for scroll-triggered animation
    - stagger animation via index * 0.1 delay on motion.div children
    - useReducedMotion guard on duration, delay, and y offset
    - lucide-react icons with size + strokeWidth props and aria-hidden="true"

key-files:
  created:
    - src/components/public/HowItWorks/HowItWorks.tsx
    - src/components/public/HowItWorks/HowItWorks.module.css
    - src/components/public/HowItWorks/__tests__/HowItWorks.test.tsx
  modified:
    - src/app/page.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "lucide-react@1.7.0 installed as production dependency — Sofa, Palette, Home icons"
  - "useInView ref placed on .grid div (not section) to trigger when cards enter viewport"
  - "useReducedMotion fully respected: y:0, duration:0, delay:0 when prefers-reduced-motion active"
  - "aria-hidden=true on all Lucide icons — decorative, titles carry semantic meaning"

patterns-established:
  - "Pattern lucide-react: <Icon size={32} strokeWidth={1.5} aria-hidden='true' /> — taille et epaisseur normalisees"
  - "Pattern mock lucide: vi.mock avec data-testid par icone — testabilite sans rendu SVG reel"
  - "Pattern steps array: id, number, icon, title, description — extensible pour futurs composants similaires"

requirements-completed: [STEP-01, STEP-02, STEP-03]

# Metrics
duration: 8min
completed: 2026-03-26
---

# Phase 3 Plan 01: HowItWorks Assemblage Summary

**Section "Comment ca marche" avec 3 cartes etapes (Sofa/Palette/Home), animation useInView stagger 100ms, grid CSS 1col mobile / 3col desktop, integree dans page.tsx — template Next.js entierement remplace**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-26T23:18:12Z
- **Completed:** 2026-03-26T23:20:29Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Composant HowItWorks.tsx avec 3 cartes etapes animees (Sofa, Palette, Home de lucide-react)
- Animation scroll-triggered via useInView (once:true, margin:-100px) avec stagger 100ms par carte
- CSS Grid responsive : 1 colonne mobile, 3 colonnes >= 640px, fond beige #F8F4EE, cards blanches
- 9 tests unitaires GREEN couvrant contenu (STEP-01), structure (STEP-02), animation mock (STEP-03)
- page.tsx mis a jour — commentaire Phase 3 remplace par <HowItWorks />, build 0 erreur, 23/23 tests verts

## Task Commits

Chaque task commitee atomiquement :

1. **Task 1: Installer lucide-react et creer le scaffold de tests** - `3b16a90` (test)
2. **Task 2: Creer le composant HowItWorks.tsx et HowItWorks.module.css** - `0827e36` (feat)
3. **Task 3: Integrer HowItWorks dans page.tsx et verifier le build** - `8a316eb` (feat)

## Files Created/Modified

- `src/components/public/HowItWorks/HowItWorks.tsx` - Composant client avec useInView + stagger + useReducedMotion
- `src/components/public/HowItWorks/HowItWorks.module.css` - CSS Modules responsive, tokens CSS custom
- `src/components/public/HowItWorks/__tests__/HowItWorks.test.tsx` - 9 tests unitaires (mocks lucide + motion)
- `src/app/page.tsx` - Import HowItWorks + remplacement commentaire placeholder
- `package.json` / `package-lock.json` - Ajout lucide-react@1.7.0

## Decisions Made

- lucide-react@1.7.0 comme dependance de production (icons Sofa, Palette, Home)
- useInView ref sur la div `.grid` (pas la section entiere) pour declencher au bon moment
- useReducedMotion entierement respecte : y:0, duration:0, delay:0 quand prefers-reduced-motion actif
- aria-hidden="true" sur toutes les icones Lucide — titres H3 portent le sens semantique

## Deviations from Plan

None — plan execute exactement comme specife.

## Issues Encountered

None.

## User Setup Required

None — aucune configuration de service externe requise.

## Next Phase Readiness

- Section HowItWorks complete et integree dans page.tsx
- Page publique : Header + Hero + HowItWorks en place
- Prochaine section : catalogue produits (Phase 04)
- Build production sans erreur, suite de tests complète verte (23/23)

---
*Phase: 03-howitworks-assemblage*
*Completed: 2026-03-26*
