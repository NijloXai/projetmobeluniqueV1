---
phase: 01-fondation-header
plan: 02
subsystem: ui
tags: [next/image, brand-assets, favicon, pwa, manifest, header]

# Dependency graph
requires:
  - phase: 01-fondation-header plan 01
    provides: Header sticky avec structure CSS, transitions scroll, blocs .logo et .brandName en place
provides:
  - Logo brand Mobel Unique PNG blanc/noir via next/image dans Header (swap conditionnel scrolled)
  - Favicon Mobel Unique dans onglet navigateur (convention App Router favicon.ico + icon.png)
  - Apple touch icon 180x180 (src/app/apple-icon.png)
  - Web manifest PWA servi a /manifest.webmanifest (src/app/manifest.ts MetadataRoute.Manifest)
  - Icones PWA 192x192 et 512x512 dans public/brand/
  - Lien Shopify corrige vers https://www.mobelunique.fr/ (meme onglet, rel="noopener")
  - Suppression des 5 SVG Next.js par defaut de public/
affects: [header, favicon, manifest, brand-assets, pwa]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "next/image avec src conditionnel : scrolled ? logo-black.png : logo-white.png"
    - "Convention App Router : favicon.ico + icon.png + apple-icon.png dans src/app/ — pas de metadata.icons dans layout.tsx (conflit balises dupliquees)"
    - "manifest.ts avec MetadataRoute.Manifest — servi automatiquement a /manifest.webmanifest"
    - "sips macOS pour redimensionnement PNG (32x32, 180x180, 192x192, 512x512) et conversion ICO"
    - "width/height next/image egaux au ratio du canvas source (144x144 pour PNG 4168x4167) — rendu controle par CSS height: 36px; width: auto"

key-files:
  created:
    - public/brand/logo-white.png
    - public/brand/logo-black.png
    - public/brand/icon-192.png
    - public/brand/icon-512.png
    - src/app/favicon.ico
    - src/app/icon.png
    - src/app/apple-icon.png
    - src/app/manifest.ts
  modified:
    - src/components/public/Header/Header.tsx
    - src/components/public/Header/Header.module.css

key-decisions:
  - "Logo-04 = logo-white.png (logo blanc sur fond transparent), Logo-01 = logo-black.png (monogramme + texte noir sur fond blanc)"
  - "NE PAS ajouter metadata.icons dans layout.tsx — les fichiers convention suffisent et evitent les balises link dupliquees"
  - "width={144} height={144} pour next/image (ratio 1:1 du canvas PNG) — taille rendue controlee par CSS height: 36px; width: auto"
  - "priority=true sur le logo — above-the-fold, candidat LCP"
  - "rel='noopener' seul (pas noreferrer) — lien dans le meme onglet, pas de target='_blank'"

patterns-established:
  - "Icones convention App Router: favicon.ico + icon.png + apple-icon.png directement dans src/app/ — servis automatiquement par Next.js"
  - "Brand assets dans public/brand/ — logos PNG, icones PWA"
  - "next/image swap conditionnel: src={scrolled ? '/brand/logo-black.png' : '/brand/logo-white.png'}"

requirements-completed: [FOND-01, FOND-02, FOND-03, FOND-04, HEAD-01, HEAD-02, HEAD-03, HEAD-04]

# Metrics
duration: 2min
completed: 2026-03-27
---

# Phase 01 Plan 02: Brand Assets + Header Logo Summary

**Logo PNG Mobel Unique integre dans le header via next/image avec swap conditionnel blanc/noir, favicon et manifest PWA configures via conventions App Router Next.js**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T01:09:57Z
- **Completed:** 2026-03-27T01:12:21Z
- **Tasks:** 2/2
- **Files modified:** 10

## Accomplishments

- Assets brand copies et redimensionnes (2 logos PNG, favicon.ico 32x32, icon.png 32x32, apple-icon.png 180x180, icones PWA 192px/512px)
- Blocs CSS `.logo` (div ambre MU) et `.brandName` (texte HTML) supprimes — remplaces par `.logoImage {height: 36px; width: auto}`
- Header.tsx utilise next/image avec src conditionnel selon l'etat `scrolled` — logo blanc sur hero sombre, logo noir apres scroll 80px
- Lien "Retour a la boutique" corrige vers https://www.mobelunique.fr/ (meme onglet)
- manifest.ts cree avec MetadataRoute.Manifest — servi automatiquement a /manifest.webmanifest
- 5 SVG Next.js par defaut supprimes de public/

## Task Commits

Chaque tache commitee atomiquement :

1. **Task 1: Preparer les assets brand et les icones convention Next.js** - `623feee` (feat)
2. **Task 2: Remplacer le logo placeholder par next/image conditionnel et corriger le lien Shopify** - `6aa8667` (feat)

## Files Created/Modified

- `public/brand/logo-white.png` - Logo blanc Mobel Unique (Logo-04, 133KB) pour header transparent
- `public/brand/logo-black.png` - Logo noir Mobel Unique (Logo-01, 145KB) pour header scrolle
- `public/brand/icon-192.png` - Icone PWA 192x192 pour manifest
- `public/brand/icon-512.png` - Icone PWA 512x512 pour manifest
- `src/app/favicon.ico` - Favicon 32x32 ICO convention App Router
- `src/app/icon.png` - Icon PNG 32x32 convention App Router
- `src/app/apple-icon.png` - Apple touch icon 180x180 convention App Router
- `src/app/manifest.ts` - Web manifest TypeScript (MetadataRoute.Manifest, theme_color #E49400)
- `src/components/public/Header/Header.tsx` - Import Image next/image, src conditionnel blanc/noir, lien Shopify corrige
- `src/components/public/Header/Header.module.css` - Suppression .logo et .brandName, ajout .logoImage

## Decisions Made

- Logo-04 = logo-white.png (logo blanc fond transparent), Logo-01 = logo-black.png (logo noir fond blanc) — identification visuelle confirmee
- NE PAS ajouter `metadata.icons` dans layout.tsx — les fichiers convention (favicon.ico, icon.png, apple-icon.png) dans src/app/ suffisent et evitent les balises `<link>` dupliquees (pitfall confirme dans RESEARCH.md)
- `width={144} height={144}` dans next/image pour respecter le ratio 1:1 du canvas PNG source — rendu visuel controle par CSS `height: 36px; width: auto`
- `priority=true` sur le logo (above-the-fold, candidat LCP)
- `rel="noopener"` seul (pas `noreferrer`) car lien dans le meme onglet sans `target="_blank"`

## Deviations from Plan

None — plan execute exactement comme ecrit.

## Issues Encountered

None — toutes les operations ont reussi du premier coup.

## User Setup Required

None — aucune configuration de service externe requise.

## Next Phase Readiness

- Header avec vrai logo brand en place — pret pour eventuels ajustements visuels
- Favicon et manifest PWA actifs — build confirme via `/apple-icon.png`, `/icon.png`, `/manifest.webmanifest`
- Build Next.js passe sans erreur (`npm run build` valide)
- Aucun bloqueur identifie pour la suite

## Self-Check: PASSED

- public/brand/logo-white.png : FOUND
- public/brand/logo-black.png : FOUND
- public/brand/icon-192.png : FOUND
- public/brand/icon-512.png : FOUND
- src/app/favicon.ico : FOUND
- src/app/icon.png : FOUND
- src/app/apple-icon.png : FOUND
- src/app/manifest.ts : FOUND
- src/components/public/Header/Header.tsx : FOUND
- src/components/public/Header/Header.module.css : FOUND
- Commit 623feee : FOUND
- Commit 6aa8667 : FOUND

---
*Phase: 01-fondation-header*
*Completed: 2026-03-27*
