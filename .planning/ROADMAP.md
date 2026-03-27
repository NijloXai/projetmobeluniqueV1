# Roadmap: Möbel Unique — v7.0 Header + Hero + Comment ca marche

## Overview

M007 remplace le template Next.js par défaut par 3 sections fondatrices de la page publique.
La structure suit les dépendances CSS strictes : globals.css + Header (Phase 1) définissent
la hauteur fixe dont dépend le Hero (Phase 2), puis la section HowItWorks et l'assemblage
final de page.tsx complètent la page (Phase 3). Aucune dépendance API — milestone front-only.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Fondation + Header** - REDO : Integration des vrais assets brand (logos, favicon, app icon) + correction lien Shopify
- [x] **Phase 2: Hero plein écran** - Section 100svh avec image de fond, badge IA, H1, sous-titre, CTA et indicateur de scroll animé (completed 2026-03-26)
- [x] **Phase 3: HowItWorks + assemblage** - 3 cartes étapes responsive, fade-in IntersectionObserver, remplacement complet du template page.tsx (completed 2026-03-26)

## Phase Details

### Phase 1: Fondation + Header
**Goal**: Le header affiche les vrais logos brand Möbel Unique (swap blanc/noir au scroll), le favicon et manifest PWA sont en place, et le lien Shopify pointe vers la vraie URL
**Depends on**: Nothing (first phase)
**Requirements**: FOND-01, FOND-02, FOND-03, FOND-04, HEAD-01, HEAD-02, HEAD-03, HEAD-04
**Success Criteria** (what must be TRUE):
  1. La page publique s'affiche sans le template Next.js par défaut, avec le bon titre SEO dans l'onglet
  2. Le header est sticky en haut de la page, affiche le vrai logo Möbel Unique et un lien retour Shopify
  3. Au scroll de 80px, le header passe de transparent à blanc avec une ombre visible (300ms) et le logo passe de blanc à noir
  4. Le skip link "Aller au contenu" est invisible au repos et visible au focus clavier
  5. Les breakpoints responsive (640/1024/1280px) et scroll-padding-top sont actifs dans globals.css
  6. Le favicon Möbel Unique apparaît dans l'onglet du navigateur
  7. Le manifest PWA est servi avec les icônes 192x192 et 512x512
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Fondation CSS (globals.css + layout.tsx + page.module.css) + Header sticky avec scroll et glassmorphism
- [ ] 01-02-PLAN.md — Integration assets brand (logos, favicon, manifest) + Header next/image conditionnel + lien Shopify reel
**UI hint**: yes

### Phase 2: Hero plein écran
**Goal**: Le hero occupe tout l'écran et communique la proposition de valeur avec une animation d'entrée
**Depends on**: Phase 1
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04
**Success Criteria** (what must be TRUE):
  1. Le hero occupe exactement 100% de la hauteur de la fenêtre (100svh) avec l'image de fond et son overlay sombre
  2. Le badge "Visualisation par IA", le H1, le sous-titre et le bouton CTA sont visibles et centrés dans le hero
  3. Les éléments du hero apparaissent avec un fade-in au chargement de la page
  4. Un indicateur de scroll animé est visible en bas du hero et invite à continuer
**Plans**: 1 plan
Plans:
- [x] 02-01-PLAN.md — Hero complet (Hero.tsx + Hero.module.css + integration page.tsx) avec fade-in Framer Motion et indicateur scroll
**UI hint**: yes

### Phase 3: HowItWorks + assemblage
**Goal**: La page publique est complète avec la section HowItWorks et le template Next.js entièrement remplacé
**Depends on**: Phase 2
**Requirements**: STEP-01, STEP-02, STEP-03
**Success Criteria** (what must be TRUE):
  1. 3 cartes étapes (choisir, personnaliser, visualiser) avec icônes sont visibles sur fond #F8F4EE
  2. Sur mobile les cartes s'affichent en colonne unique, sur desktop en grille 3 colonnes
  3. Les cartes apparaissent avec une animation au scroll via IntersectionObserver (stagger 100ms)
**Plans**: 1 plan
Plans:
- [x] 03-01-PLAN.md — Composant HowItWorks (3 cartes, CSS Grid responsive, animation useInView stagger 100ms) + integration page.tsx
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Fondation + Header | 1/2 | In Progress | — |
| 2. Hero plein écran | 1/1 | Complete   | 2026-03-26 |
| 3. HowItWorks + assemblage | 1/1 | Complete   | 2026-03-26 |

---
*Roadmap created: 2026-03-26*
*Milestone: v7.0 — Frontend public (Header + Hero + Comment ca marche)*
