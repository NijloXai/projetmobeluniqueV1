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

### Active

<!-- M007: Frontend public - Header + Hero + Comment ca marche -->

- [ ] **FRONT-01**: Header minimal sticky avec transition transparent -> blanc au scroll
- [ ] **FRONT-02**: Hero plein ecran avec badge IA, titre, sous-titre et CTA
- [ ] **FRONT-03**: Section "Comment ca marche" en 3 etapes illustrees
- [ ] **FRONT-04**: Design system Stitch applique (CSS Modules, tonal layering, no-border)
- [ ] **FRONT-05**: Responsive complet (mobile < 640px, tablet >= 640px, desktop >= 1024px, large >= 1280px)

### Out of Scope

- Catalogue produits -- M008
- Configurateur tissu -- M009
- Simulation IA salon -- M010
- Produits similaires, footer, polish -- M011
- Integration Nano Banana reelle -- M012+
- Tailwind / shadcn/ui -- Interdit par conventions projet

## Context

- Backend complet (~5350 lignes, M001-M006)
- Maquette Stitch "Mobel Unique -- SPA Desktop" (project ID: 16534774796210155266)
- Wireframe detaille v4 (wireframe-page-unique.md dans Stitch)
- Charte graphique creee (CHARTE-GRAPHIQUE.md) avec tous les tokens
- globals.css mis a jour avec tokens complets
- Page actuelle: template Next.js par defaut (a remplacer)

## Constraints

- **Stack**: CSS Modules uniquement (pas de Tailwind, pas de shadcn/ui)
- **Langue**: UI 100% francais
- **Design**: Regles Stitch (no-border, tonal layering, transitions 400ms)
- **Font**: Montserrat (400, 500, 600, 700) deja configuree
- **Node**: v22 (.nvmrc)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CSS Modules | Convention projet, composants isoles | -- Pending |
| Tonal layering (pas de bordures) | Design system Stitch "Curated Atelier" | -- Pending |
| Sections statiques M007 | Aucune API necessaire, fondation visuelle | -- Pending |
| Charte graphique avant code | Controler dimensions/tokens des le depart | -- Pending |

## Current Milestone: v7.0 Header + Hero + Comment ca marche

**Goal:** Construire les 3 premieres sections de la page publique en remplacant le template Next.js par defaut.

**Target features:**
- Header minimal sticky (transparent -> blanc au scroll)
- Hero plein ecran (badge IA, H1, CTA)
- Section "Comment ca marche" (3 etapes)
- Design system Stitch applique
- Responsive complet

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
*Last updated: 2026-03-26 after milestone v7.0 initialization*
