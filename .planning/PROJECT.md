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
- [x] **MODAL-01**: CTA "Configurer ce modele" ouvre modal large 90vw/plein ecran mobile -- Validated in Phase 06
- [x] **MODAL-02**: Modal accessible (focus trap, fermeture Escape/X/backdrop, retour focus) -- Validated in Phase 06
- [x] **MODAL-03**: Modal affiche placeholder "Configurateur a venir" avec nom/prix/image du canape -- Validated in Phase 06
- [x] **CONF-01**: Selection tissu avec swatches cliquables dans le modal configurateur -- Validated in Phase 08
- [x] **CONF-02**: Affichage rendu IA publie par angle quand un tissu est selectionne -- Validated in Phase 09
- [x] **CONF-03**: Prix dynamique avec supplement premium (+80 EUR si applicable) -- Validated in Phase 08
- [x] **CONF-04**: CTA "Acheter sur Shopify" avec lien vers le produit -- Validated in Phase 08

- [x] **SIM-01**: Upload photo salon drag & drop avec preview et progression -- Validated in Phase 11
- [x] **SIM-02**: Generation IA via POST /api/simulate avec watermark -- Validated in Phase 11
- [x] **SIM-03**: Resultat avec telecharger, partager WhatsApp, CTA Shopify -- Validated in Phase 12

### Active

(Next milestone — v11.0 Polish)

### Out of Scope

- Integration Nano Banana reelle -- M012+ (mock Sharp suffit pour le dev)
- Tailwind / shadcn/ui -- Interdit par conventions projet
- Historique/galerie de simulations -- Complexite sans valeur ajoutee pour v10
- Streaming SSE pour la generation -- Pas necessaire avec le mock

## Context

- Backend complet (~5350 lignes, M001-M006)
- Frontend v7.0-v10.0 complets (shipped) : Header + Hero + HowItWorks + Catalogue + Configurateur tissu + Simulation IA (upload, generation, affichage resultat, telecharger/partager) — 12 phases, 12 plans
- Flux E2E complet : page accueil → catalogue → modal configurateur → upload photo → generation IA → resultat → telecharger/partager/commander
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
| Modal large configurateur | Pas de section separee, modal 90vw desktop / plein ecran mobile | ✓ Good |
| Catalogue scalable | Recherche + filtrage pour absorber 20+ produits | ✓ Good |
| Server/Client boundary | CatalogueSection (Server) fetch Supabase, CatalogueClient (Client) gere etat | ✓ Good |
| Dialog natif (pas Radix) | Zero dependance externe, focus trap natif via showModal + inert | ✓ Good |
| TDD RED-GREEN | Tests ecrits avant implementation, contrat comportemental garanti | ✓ Good |
| Co-fetch server-side Promise.all | 3 queries paralleles (models + fabrics + visuals) dans CatalogueSection | ✓ Good |
| Props plates modal | fabrics[] + visuals[] passes separement, filtrage UI = Phase 8 | ✓ Good |
| State machine simulation | idle → preview → generating → done → error, transitions claires | ✓ Good |
| Web Share API + fallback WhatsApp | canShare({files}) sur mobile, wa.me sur desktop | ✓ Good |
| Boutons dupliques mobile/desktop | CSS hide/show par breakpoint, pas de JS resize listener | ✓ Good |
| Mock Sharp pour dev | Service IA interchangeable via factory pattern, pas de dependance Nano Banana | ✓ Good |

## Completed Milestones

- **v7.0** Header + Hero + Comment ca marche (shipped 2026-03-27)
- **v8.0** Catalogue Produits (shipped 2026-03-29)
- **v9.0** Configurateur Tissu (shipped 2026-03-30)
- **v10.0** Simulation IA Salon (shipped 2026-04-07)

## Next Milestone

Candidat : **v11.0 Polish** — produits similaires, footer, sticky bar mobile, deep link ?produit=slug

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
*Last updated: 2026-04-07 after v10.0 Simulation IA Salon milestone*
