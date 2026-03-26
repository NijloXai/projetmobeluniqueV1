---
phase: 02-hero-plein-cran
plan: 01
subsystem: ui
tags: [react, motion, framer-motion, css-modules, hero, animation]

# Dependency graph
requires:
  - phase: 01-fondation-header
    provides: Header.tsx, globals.css tokens, page.tsx structure initiale
provides:
  - Composant Hero 100svh avec fond warm + overlay (Hero.tsx + Hero.module.css)
  - Animation d'entrée Framer Motion 400ms fade-in (opacity 0→1, y 20→0)
  - Badge pill "Visualisation par IA", H1, sous-titre, CTA gradient
  - Indicateur scroll chevron animé avec fade-out au scroll
  - Intégration Hero dans page.tsx (Server Component → Client Component)
affects: 03-comment-ca-marche, pages futures utilisant le même layout

# Tech tracking
tech-stack:
  added: [motion@12 (motion/react API — Framer Motion v12)]
  patterns:
    - "useState(false) pour état scroll — jamais window dans initialisation (SSR-safe)"
    - "useReducedMotion() pour désactiver animations si prefers-reduced-motion"
    - "motion.div avec initial/animate/transition pour fade-in au montage"
    - "Indicateur scroll decoratif (pas de onClick) — opacity 0 dès scrollY > 0"
    - "100vh + 100svh double déclaration pour compatibilité mobile (barre d'adresse)"

key-files:
  created:
    - src/components/public/Hero/Hero.tsx
    - src/components/public/Hero/Hero.module.css
  modified:
    - src/app/page.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "motion@12 (motion/react) plutôt que framer-motion directement — même API, import plus court"
  - "Fond #2C2418 couleur unie CSS comme placeholder (pas d'image réelle) — intégration future via background-image"
  - "Indicateur scroll décoratif uniquement, pas de onClick — conformément à D-16 de la UI-SPEC"
  - "Seuil scrollY > 0 (pas 80 comme le Header) — l'indicateur disparaît dès le premier pixel de scroll"

patterns-established:
  - "Hero composant 'use client' importé depuis un Server Component page.tsx — pattern Next.js App Router standard"

requirements-completed: [HERO-01, HERO-02, HERO-03, HERO-04]

# Metrics
duration: 2min
completed: 2026-03-26
---

# Phase 2 Plan 01: Hero plein écran Summary

**Composant Hero 100svh avec fond warm #2C2418, overlay rgba(0,0,0,0.55), badge IA pill dorée, fade-in Framer Motion 400ms via motion@12, et indicateur scroll chevron animé**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-26T07:40:40Z
- **Completed:** 2026-03-26T07:42:39Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Installer motion@12 et créer Hero.tsx (63 lignes) avec fade-in, scroll listener SSR-safe, badge, H1, CTA et indicateur scroll
- Créer Hero.module.css (160 lignes) avec 100svh, overlay, badge pill, gradient CTA, animation bounce, prefers-reduced-motion, responsive 3 breakpoints
- Intégrer Hero dans page.tsx (Server Component), build production sans erreur, zéro erreur TypeScript

## Task Commits

Chaque tâche committée atomiquement :

1. **Task 1: Installer motion + créer Hero.tsx et Hero.module.css** - `dba16a9` (feat)
2. **Task 2: Intégrer Hero dans page.tsx et vérifier le build** - `0dd21c3` (feat)

**Plan metadata:** à venir (docs commit final)

## Files Created/Modified

- `src/components/public/Hero/Hero.tsx` - Composant client Hero avec motion.div fade-in, scroll state, badge, H1, sous-titre, CTA, indicateur scroll
- `src/components/public/Hero/Hero.module.css` - Styles CSS Modules hero 100svh, overlay ::before, badge pill, gradient CTA, keyframes bounce, responsive
- `src/app/page.tsx` - Import Hero ajouté, placeholder Phase 2 remplacé par `<Hero />`
- `package.json` - Dépendance motion@^12.38.0 ajoutée
- `package-lock.json` - Lock file mis à jour

## Decisions Made

- motion@12 utilise l'API `motion/react` (pas `framer-motion`) — même API, package unifié plus léger
- Seuil `scrollY > 0` pour l'indicateur de scroll (vs seuil 80 du Header) — l'indicateur disparaît immédiatement au scroll
- Fond couleur unie CSS `#2C2418` comme placeholder — background-image sera ajouté en phase future sans modifier l'architecture CSS
- L'indicateur scroll est décoratif (aria-hidden sur le SVG, pas de onClick) — conforme à la décision D-16 de UI-SPEC

## Deviations from Plan

Aucune — plan exécuté exactement tel qu'écrit.

## Issues Encountered

Aucun.

## User Setup Required

Aucun — aucune configuration externe requise. La page est visible sur `localhost:3000` après `npm run dev`.

## Known Stubs

- Fond hero : couleur unie `#2C2418` — image réelle non disponible dans `public/`. L'utilisateur peut ajouter `background-image: url('/hero.jpg')` dans `.hero` quand l'image sera disponible. Cela ne bloque pas le rendu (plan objectif : structure et animations).
- CTA `href="#catalogue"` — lien mort temporaire, la section catalogue sera ajoutée en Phase 4 (M008).

## Next Phase Readiness

- Hero intégré dans page.tsx, prêt pour l'ajout de la section "Comment ça marche" (Phase 03)
- Aucun bloqueur. Le build production passe.
- Le token `--spacing-section` (112px) est disponible dans globals.css pour la compensation header des sections suivantes.

## Self-Check: PASSED

Tous les fichiers existent et tous les commits sont présents.

---
*Phase: 02-hero-plein-cran*
*Completed: 2026-03-26*
