# Möbel Unique

## What This Is

Backend complet + back-office admin pour Möbel Unique, vendeur de canapés personnalisables à Paris. L'app permet aux clients de visualiser un canapé dans le tissu de leur choix via génération IA (Nano Banana 2 / Gemini), et de simuler le placement dans leur propre salon.

Ce n'est pas un site e-commerce. Shopify reste le site principal. Notre app est un outil de visualisation lié à Shopify par URLs bidirectionnelles (`?produit=slug` ↔ `shopify_url`).

Le frontend public (hero, catalogue, configurateur, simulation salon) est fait séparément par le client avec Google Stitch, puis fusionné dans ce même projet Next.js.

## Core Value

L'admin peut gérer son catalogue de canapés et tissus de manière autonome, générer des rendus IA ou uploader des photos manuellement, et les publier pour que les clients les voient via les API publiques.

## Current State

**M005 Génération IA terminé ✅ :**
- M001 Foundation : Next.js 16.2.1, Supabase (4 tables, RLS, storage, API publiques), types TS, schemas Zod
- M002 Auth Admin : Login, proxy middleware, layout admin protégé
- M003 CRUD Tissus : API complète + tableau admin + formulaire création/édition + toggle actif/inactif
- M004 CRUD Produits : API CRUD admin models + images + visuals, tableau /admin/produits, formulaire création/édition (infos + photos multi-angles + mode classique upload rendus sans IA)
- M005 Génération IA : IA service (mock sharp + provider pattern), 6 API routes admin (generate/validate/publish + bulk), IAGenerationSection UI, POST /api/simulate (public, watermark), prompt templates configurables. 8/8 mock + 15/15 E2E checks — R008, R011, R016 validated.

## Architecture / Key Patterns

- **Stack :** Next.js 16 App Router + Supabase (Postgres, Auth, Storage) + Radix UI + CSS Modules + Zustand + Immer + react-hook-form + zod
- **Pas de Tailwind, pas de shadcn/ui** — Radix UI headless + CSS Modules uniquement
- **Supabase client directement** — pas de Prisma
- **Deux clients Supabase :** `src/lib/supabase/client.ts` (navigateur) et `src/lib/supabase/server.ts` (serveur, cookies)
- **Design tokens :** CSS variables dans `globals.css` (#E49400 primary, Montserrat)
- **Français uniquement** — messages d'erreur, UI, contenu
- **Mobile first**

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Foundation — Init Next.js 16 + Supabase (tables, RLS, storage, API publiques)
- [x] M002: Auth Admin — Login, middleware, layout admin
- [x] M003: CRUD Tissus — API + pages admin tissus complet
- [x] M004: CRUD Produits — API + pages admin produits, photos multi-angles, mode classique
- [x] M005: Génération IA — Nano Banana 2 (mock), generate/validate/publish, API simulation F3
- [ ] M006: Export ZIP — Export ZIP rendus validés
