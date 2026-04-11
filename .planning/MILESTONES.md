# Milestones

## v11.0 Intégration IA Réelle + Audit Qualité (Shipped: 2026-04-11)

**Phases completed:** 5 phases, 13 plans, 15 tasks

**Key accomplishments:**

- NanoBananaService complet via @google/genai : generate() Gemini avec retry exponentiel (1s/2s/4s + jitter), timeout 30s, IMAGE_SAFETY, deux chemins image, conversion PNG→JPEG, et watermark Sharp
- Routes IA adaptees : maxDuration Vercel 300s, rate-limit IP 5/min sur simulate, resize Sharp 1024px, gestion errors batch generate-all
- Audit code complet : 74 findings documentes (11 securite, 13 performance, 20 dead code, 16 TypeScript) via ESLint + knip + script custom
- Tests unitaires Vitest : 183 tests couvrant NanoBanana, utils, requireAdmin, routes admin
- Tests integration Supabase : 71 tests contre instance locale avec auth reelle JWT, RLS, Storage 4 buckets, 20 routes API
- Corrections audit : security headers CSP, validation MIME + UUID, schemas Zod admin POST, suppression 10 deps inutilisees
- Tests E2E Playwright : 18 tests couvrant parcours public (catalogue, configurateur, simulation IA, WCAG) et admin (workflow generate/validate/publish)

---

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

| v11.0 | Intégration IA Réelle + Audit Qualité | 2026-04-11 | Service IA Gemini, audit 74 findings, 183 tests unitaires, 71 integration, 18 E2E |

## Current

_(aucun milestone actif — utiliser `/gsd:new-milestone` pour demarrer v12.0)_
