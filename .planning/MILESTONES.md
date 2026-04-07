# Milestones

## v10.0 Simulation IA Salon (Shipped: 2026-04-07)

**Phases completed:** 3 phases, 3 plans, 4 tasks

**Key accomplishments:**

- Upload photo salon drag & drop avec preview, barre de progression animee, abort controller, et validation client (JPEG/PNG, 15 Mo max)
- API /api/simulate avec fabric_id optionnel, fallback "tissu original", limite 15 Mo, gestion HEIC 422, et watermark automatique
- Affichage resultat IA dans le modal avec fondu 400ms, disclaimer "Apercu genere par IA"
- 4 boutons action post-simulation : telecharger JPEG, partager Web Share API/WhatsApp, commander Shopify (conditionnel), relancer
- Layout responsive mobile/desktop avec boutons dupliques par breakpoint CSS (< 640px / >= 640px)
- Dette technique v9.0 pre-resolue : VERIFICATION Phase 8, useRef D-15, getPrimaryImage/formatPrice extraits dans utils.ts

---

## v9.0 Configurateur Tissu (Shipped: 2026-03-30)

**Phases completed:** 3 phases, 3 plans, 6 tasks

**Key accomplishments:**

- Pipeline server-side enrichi avec Promise.all (models + fabrics + visuals publies) et props drilling jusqu'a ConfiguratorModal sans fetch client
- Configurateur tissu complet dans ConfiguratorModal — swatches cliquables filtrés par visuals publiés, rendu IA avec fallback photo originale, prix dynamique avec détail premium +80 EUR, CTA Shopify conditionnel
- Thumbnails angles cliquables sous l'image principale avec crossfade 200ms, filtrage par tissu selectionne et preservation de l'angle au changement de tissu

---

## v8.0 Catalogue Produits (Shipped: 2026-03-29)

**Phases completed:** 3 phases, 5 plans, 7 tasks

**Key accomplishments:**

- next.config.ts remotePatterns Supabase debloque, ProductCard et CatalogueSkeletonGrid implementes en TDD avec 36 tests GREEN
- CatalogueSection async Server Component connecte a Supabase, CatalogueClient grille responsive 1/2/3 colonnes avec Suspense/skeleton integre dans page.tsx — 41 tests GREEN
- 6 tests RED TDD ecrits pour recherche catalogue (SRCH-01/SRCH-02/CAT-04) avec @testing-library/user-event, contrat comportemental etabli avant implementation
- 1. [Rule 1 - Bug] Conflit aria-label bouton clear X vs bouton reset
- One-liner:

---

## v7.0 Header + Hero + Comment ca marche (Shipped: 2026-03-27)

**Phases completed:** 3 phases, 3 plans, 10 tasks

**Key accomplishments:**

- Header fixe Möbel Unique avec transition transparent → glassmorphism au scroll (80px, 300ms), skip link WCAG, et métadonnées title.template Next.js
- Logo PNG Mobel Unique integre dans le header via next/image avec swap conditionnel blanc/noir, favicon et manifest PWA configures via conventions App Router Next.js
- Composant Hero 100svh avec fond warm #2C2418, overlay rgba(0,0,0,0.55), badge IA pill dorée, fade-in Framer Motion 400ms via motion@12, et indicateur scroll chevron animé
- Section "Comment ca marche" avec 3 cartes etapes (Sofa/Palette/Home), animation useInView stagger 100ms, grid CSS 1col mobile / 3col desktop, integree dans page.tsx — template Next.js entierement remplace

---

## Completed

| Version | Name | Completed | Key Outcome |
|---------|------|-----------|-------------|
| v1.0 | Foundation | 2026-03-23 | Next.js 16 + Supabase (4 tables, RLS, 4 buckets, API publiques) |
| v2.0 | Auth Admin | 2026-03-24 | Login, middleware proxy, layout admin |
| v3.0 | CRUD Tissus | 2026-03-24 | API + UI admin tissus (swatch, ref, toggle) |
| v4.0 | CRUD Produits | 2026-03-24 | API + UI admin produits (photos multi-angles) |
| v5.0 | Generation IA | 2026-03-25 | Service IA mock/Nano Banana, workflow validate/publish |
| v6.0 | Export ZIP | 2026-03-25 | Export ZIP visuels publies par modele |

## Current

| Version | Name | Started | Status |
|---------|------|---------|--------|
| v7.0 | Header + Hero + Comment ca marche | 2026-03-26 | Defining requirements |
