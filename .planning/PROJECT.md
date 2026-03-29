# Mobel Unique

## What This Is

Application SPA de visualisation IA pour Mobel Unique (vendeur de canapes personnalisables, Paris). Page unique separee de Shopify : hero + catalogue + configurateur tissu + simulation IA. Le client choisit un canape, un tissu, et voit le rendu IA sous tous les angles, puis simule le meuble dans son propre salon.

## Core Value

Le client peut visualiser un canape dans le tissu de son choix et le simuler dans son salon avant d'acheter.

## Requirements

### Validated

<!-- Backend complet M001-M006 -->

- [x] **FOUND-01**: Foundation Next.js 16 + Supabase (4 tables, RLS, 4 buckets) -- M001
- [x] **AUTH-01**: Authentification admin (email/password, JWT, middleware proxy) -- M002
- [x] **CRUD-01**: CRUD tissus complet (API + UI admin, upload swatch/ref, toggle actif) -- M003
- [x] **CRUD-02**: CRUD produits complet (API + UI admin, photos multi-angles) -- M004
- [x] **IA-01**: Generation IA rendus (mock Sharp + stub Nano Banana, single/all angles) -- M005
- [x] **IA-02**: Workflow visuals (generate -> validate -> publish, bulk ops) -- M005
- [x] **EXPORT-01**: Export ZIP des visuels publies par modele -- M006
- [x] **FRONT-01**: Header minimal sticky avec transition transparent -> blanc au scroll -- Validated in Phase 01
- [x] **FRONT-02**: Hero plein ecran avec badge IA, titre, sous-titre et CTA -- Validated in Phase 02
- [x] **FRONT-03**: Section "Comment ca marche" en 3 etapes illustrees -- Validated in Phase 03
- [x] **TECH-01**: Config next/image remotePatterns Supabase Storage -- Validated in Phase 04
- [x] **CAT-01**: Cards produits presentationnelles (image, nom, prix, CTA) -- Validated in Phase 04
- [x] **CAT-02**: Grille catalogue responsive 1/2/3 colonnes avec Suspense skeleton -- Validated in Phase 04
- [x] **CAT-03**: Skeleton loading avec animation shimmer et aria-busy -- Validated in Phase 04
- [x] **CAT-04**: Barre de recherche catalogue (filtre par nom, normalisation accents) -- Validated in Phase 05
- [x] **SRCH-01**: Recherche canape par nom via barre de recherche -- Validated in Phase 05
- [x] **SRCH-02**: Message etat vide quand aucun resultat de recherche -- Validated in Phase 05

### Active

- [ ] **CAT-04**: Modal large configurateur (placeholder v8.0, contenu v9.0)
- [ ] **CONF-01**: Selection tissu avec swatches et zoom texture
- [ ] **SIM-01**: Upload photo salon et simulation IA

### Out of Scope

- Catalogue produits -- M008
- Configurateur tissu -- M009
- Simulation IA salon -- M010
- Produits similaires, footer, polish -- M011
- Integration Nano Banana reelle -- M012+
- Tailwind / shadcn/ui -- Interdit par conventions projet

## Context

- Backend complet (~5350 lignes, M001-M006)
- Frontend v8.0 en cours : Header + Hero + HowItWorks + Catalogue avec recherche (Phase 05 complete — barre de recherche, filtrage nom, compteur, etat vide)
- Brand assets client integres depuis `fichier-mobelunique/` (logos, favicon, app icons)
- URL Shopify reelle : https://www.mobelunique.fr/
- Maquette Stitch "Mobel Unique -- SPA Desktop" (project ID: 16534774796210155266)
- Wireframe detaille v4 : `.planning/maquette/wireframe-page-unique.md`
- Charte graphique : `CHARTE-GRAPHIQUE.md`
- globals.css tokens complets, Montserrat configuree

## Constraints

- **Stack**: CSS Modules uniquement (pas de Tailwind, pas de shadcn/ui)
- **Langue**: UI 100% francais
- **Design**: Regles Stitch (no-border, tonal layering, transitions 400ms)
- **Font**: Montserrat (400, 500, 600, 700) deja configuree
- **Node**: v22 (.nvmrc)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CSS Modules | Convention projet, composants isoles | ✓ Good |
| Tonal layering (pas de bordures) | Design system Stitch "Curated Atelier" | ✓ Good |
| Sections statiques M007 | Aucune API necessaire, fondation visuelle | ✓ Good |
| Charte graphique avant code | Controler dimensions/tokens des le depart | ✓ Good |
| Logo swap blanc/noir | Lisibilite sur hero sombre et sections claires | ✓ Good |
| Header transparent + fond subtil | Pas de glassmorphism lourd, seuil 60% viewport | ✓ Good |
| Brand assets dans public/brand/ | Organisation propre, separee des assets Next.js | ✓ Good |
| Favicon convention App Router | favicon.ico + icon.png + apple-icon.png dans src/app/ | ✓ Good |
| Modal large configurateur | Pas de section separee, modal 90vw desktop / plein ecran mobile | -- Pending |
| Catalogue scalable | Recherche + tri pour absorber 20+ produits au fil du temps | -- Pending |

## Current Milestone: v8.0 Catalogue Produits

**Goal:** Afficher les canapes depuis l'API avec un catalogue scalable, recherche, tri et modal configurateur

**Target features:**
- Section Catalogue "Collection Signature" avec layout large et aere
- Cards produits alimentees par GET /api/models (images, noms, prix)
- Swatches miniatures en apercu sur chaque card
- Barre de recherche dans le catalogue (filtre par nom)
- Tri : prix croissant, prix decroissant, nouveautes
- Grid responsive (1 col mobile / 2 col tablet / 3 col desktop)
- Scalable : prevu pour absorber 20+ produits
- CTA "Configurer ce modele" ouvre un modal large (90vw desktop, plein ecran mobile)
- Modal placeholder "Configurateur a venir" (contenu reel en v9.0)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after Phase 05 completion*
