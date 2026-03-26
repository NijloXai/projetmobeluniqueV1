---
phase: 01-fondation-header
plan: 01
subsystem: ui
tags: [nextjs, css-modules, header, sticky, glassmorphism, accessibility, scroll]

# Dependency graph
requires: []
provides:
  - Header sticky fixe avec transition scroll transparent→glassmorphism (300ms)
  - Skip link accessibilité (HEAD-04)
  - Metadata globale title.template '%s | Möbel Unique'
  - globals.css scroll-behavior smooth + scroll-padding-top 64px
  - page.tsx squelette propre (Server Component, main#main-content)
  - page.module.css sans artifacts Next.js
affects:
  - 02-hero (dépend de --header-height pour padding-top hero)
  - 03-how-it-works (dépend du scroll-padding-top pour ancres)
  - toutes phases suivantes (layout.tsx metadata pattern établi)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "'use client' seulement sur composants avec hooks navigateur (Header)"
    - "useState(false) jamais useState(window.scrollY) pour éviter crash SSR"
    - "passive: true sur addEventListener scroll pour performance mobile"
    - "Export nommé pour composants publics (pas export default)"
    - "Skip link avant le header dans le DOM (standard accessibilité WCAG)"

key-files:
  created:
    - src/components/public/Header/Header.tsx
    - src/components/public/Header/Header.module.css
  modified:
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/page.module.css

key-decisions:
  - "useState(false) pour scroll state — jamais d'accès à window dans l'initialisation useState (SSR)"
  - "title.template '%s | Möbel Unique' dans layout.tsx — pattern appliqué à toutes les pages"
  - "scroll-padding-top: var(--header-height) — 64px réservé pour toutes les ancres du site"
  - "backdrop-filter blur(20px) avec préfixe -webkit- pour compatibilité Safari iOS"

patterns-established:
  - "Composant public: 'use client' + useState(false) + useEffect scroll passif + cleanup"
  - "Skip link pattern: position absolute top:-100% -> top:spacing-md au focus, z-index 200"
  - "Header scroll: seuil 80px, classe CSS .scrolled ajoutée dynamiquement"

requirements-completed: [FOND-01, FOND-02, FOND-03, FOND-04, HEAD-01, HEAD-02, HEAD-03, HEAD-04]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 1 Plan 01: Fondation CSS et Header Sticky Summary

**Header fixe Möbel Unique avec transition transparent → glassmorphism au scroll (80px, 300ms), skip link WCAG, et métadonnées title.template Next.js**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T05:39:34Z
- **Completed:** 2026-03-26T05:42:27Z
- **Tasks:** 3 (tâches auto) + 1 (checkpoint human-verify en attente)
- **Files modified:** 6

## Accomplishments

- globals.css mis à jour avec scroll-behavior smooth et scroll-padding-top 64px dans le bloc html{} existant (un seul bloc)
- layout.tsx metadata convertie en title.template pattern — chaque page peut définir son propre titre
- page.tsx entièrement remplacé (suppression template Next.js, Server Component avec Header + main#main-content)
- page.module.css réécrit proprement (suppression des variables CSS locales, dark mode, font-geist-sans)
- Header.tsx créé avec scroll listener passif, état scrolled SSR-safe, skip link accessibilité
- Header.module.css avec effets fixed, transition 300ms, glassmorphism (backdrop-filter blur 20px)

## Task Commits

Chaque tâche commitée atomiquement :

1. **Tâche 1 : globals.css + layout.tsx + page.module.css** - `56952c0` (feat)
2. **Tâche 2 : Header.tsx + Header.module.css** - `3e303d0` (feat)
3. **Tâche 3 : page.tsx** - `dc25267` (feat)

## Files Created/Modified

- `src/components/public/Header/Header.tsx` — Composant client avec scroll listener, skip link, export nommé
- `src/components/public/Header/Header.module.css` — Styles fixed, glassmorphism, skipLink, responsive 3 breakpoints
- `src/app/globals.css` — scroll-behavior smooth + scroll-padding-top ajoutés dans le bloc html existant
- `src/app/layout.tsx` — Metadata title.template pour titre SEO dynamique par page
- `src/app/page.tsx` — Squelette Server Component : Header + main#main-content
- `src/app/page.module.css` — Styles propres : .page (min-height 100vh) + .main (flex 1)

## Decisions Made

- `useState(false)` pour l'état scroll — jamais d'accès à `window` dans l'initialisation (crash SSR si `useState(window.scrollY > 80)`)
- `title.template '%s | Möbel Unique'` établi dans layout.tsx — pattern uniforme pour toutes les pages publiques
- `scroll-padding-top: var(--header-height)` — 64px réservé globalement pour toutes les ancres du site (sections Phase 2/3)
- `-webkit-backdrop-filter` préfixé avec `backdrop-filter` — compatibilité Safari iOS assurée pour glassmorphism

## Deviations from Plan

None — plan exécuté exactement tel qu'écrit.

## Issues Encountered

None.

## User Setup Required

None — aucune configuration externe requise.

## Next Phase Readiness

- Header fixe opérationnel avec `--header-height: 64px` — Phase 2 (Hero) peut utiliser `padding-top: var(--header-height)` directement
- `scroll-padding-top` actif — les ancres des sections Phase 3 (Comment ça marche) fonctionneront correctement
- `main#main-content` en place — skip link fonctionnel dès que du contenu sera présent dans le main
- Build Next.js `npm run build` passe sans erreur

## Self-Check: PASSED

- FOUND: src/components/public/Header/Header.tsx
- FOUND: src/components/public/Header/Header.module.css
- FOUND: src/app/page.tsx
- FOUND: .planning/phases/01-fondation-header/01-01-SUMMARY.md
- FOUND commit: 56952c0
- FOUND commit: 3e303d0
- FOUND commit: dc25267

---
*Phase: 01-fondation-header*
*Completed: 2026-03-26*
