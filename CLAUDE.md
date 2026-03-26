# Möbel Unique — Instructions Projet

## Projet

Application de visualisation IA pour Möbel Unique (vendeur de canapés personnalisables, Paris).
SPA séparée de Shopify : hero + catalogue + configurateur tissu + simulation IA.
Langue : **français uniquement** (UI, messages d'erreur, données).

## Stack technique

| Couche | Techno |
|--------|--------|
| Framework | Next.js 16.2.1 (App Router, Turbopack) |
| Langage | TypeScript strict (aucun `any`) |
| BDD | Supabase PostgreSQL (4 tables, RLS) |
| Auth | Supabase Auth (email/password, JWT cookies) |
| Storage | Supabase Storage (4 buckets) |
| UI | Radix UI (headless) + CSS Modules |
| Validation | Zod 4 + react-hook-form |
| State | Zustand + Immer |
| IA | Mock (Sharp) / Nano Banana 2 (Gemini) via env var |
| Export | Archiver (ZIP) |
| Node | v22 (.nvmrc) |

## Conventions STRICTES

- **PAS de Tailwind, PAS de shadcn/ui** — CSS Modules uniquement
- Un fichier `.module.css` par composant
- Design tokens dans `src/app/globals.css` (variables CSS custom)
- Composants en PascalCase, un fichier par composant
- Zod schemas partagés front/back (`src/lib/schemas.ts`)
- Messages d'erreur en français
- Supabase client direct (pas de Prisma)
- Slug auto-généré depuis le nom (diacritiques normalisées)
- Prix premium = prix de base + 80€ fixe

## Architecture

```
src/
  app/
    admin/login/          → Page login (publique)
    admin/(protected)/    → Layout admin avec sidebar (auth requise)
      produits/           → CRUD canapés + photos multi-angles + IA
      tissus/             → CRUD tissus + swatch + référence
    api/
      models/             → API publiques (GET canapés actifs)
      admin/models/       → API admin modèles
      admin/fabrics/      → API admin tissus
      admin/generate/     → Génération IA single
      admin/generate-all/ → Génération IA tous angles
      admin/visuals/      → Validate, publish, bulk, export ZIP
      simulate/           → Simulation publique (watermark)
    layout.tsx            → Root layout (Montserrat, lang=fr)
    page.tsx              → Page d'accueil (à construire)
  components/admin/       → Composants admin réutilisables
  lib/
    supabase/             → Clients (browser, server, middleware, admin)
    ai/                   → Service IA (types, mock, nano-banana, prompts)
    schemas.ts            → Schémas Zod
    utils.ts              → Utilitaires (slugify, calculatePrice, extractStoragePath)
  types/database.ts       → Types auto-générés Supabase
  proxy.ts                → Middleware Next.js 16 (token refresh)
```

## Base de données

4 tables : `models`, `model_images`, `fabrics`, `generated_visuals`
4 buckets : `model-photos`, `fabric-swatches`, `fabric-references` (privé), `generated-visuals`
Contrainte UNIQUE : `generated_visuals(model_image_id, fabric_id)`
Cascade DELETE sur toutes les FK.

## Patterns établis

- **Auth** : `requireAdmin()` dans chaque route admin (retourne 401 si non auth)
- **Middleware** : `proxy.ts` (pas middleware.ts) pour Next.js 16 token refresh
- **Route groups** : `/admin/login` (sans layout) vs `/admin/(protected)/*` (avec layout)
- **Storage cleanup** : suppression fichiers Storage avant cascade DELETE en BDD
- **IA Provider** : factory pattern — `NANO_BANANA_API_KEY` set → Nano Banana, sinon Mock Sharp
- **Upsert visuals** : régénération écrase le rendu précédent (UNIQUE constraint)
- **Workflow visuals** : generate → validate → publish (publish requiert validated, sinon 403)
- **Export ZIP** : streaming via Archiver, nommage `{slug}-{fabric}-{view_type}.jpg`

## Design tokens

- Primary: `#E49400` (ambre)
- Secondary: `#EFC806` (jaune vif)
- Text: `#1D1D1B`
- Background: `#FFFFFF` / Alt: `#F8F4EE`
- Font: Montserrat (400, 500, 600, 700)
- Radius: sm 4px, md 8px, lg 12px, xl 16px

## Scripts

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Build production
npx tsc --noEmit     # Vérification types
npx tsx scripts/audit-full.ts      # Audit complet (44 checks)
npx tsx scripts/verify-ia-mock.ts  # Test service IA (8 checks)
npx tsx scripts/verify-e2e-m005.ts # Test E2E (15 checks)
```

## État actuel

Backend complet (M001–M006 terminés, ~5350 lignes).
Frontend public à construire — une seule page avec la maquette.
Prochaine étape : intégrer la maquette front et relier aux API existantes, milestone par milestone.

## Environnement

```
NEXT_PUBLIC_SUPABASE_URL        → URL publique Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY   → Clé anon publique
SUPABASE_PROJECT_REF            → Ref projet (MCP)
SUPABASE_ACCESS_TOKEN           → Token accès (MCP)
NANO_BANANA_API_KEY             → (optionnel) Active le vrai service IA
```

## GSD

Ce projet utilise GSD (Get Shit Done) pour le workflow de développement.
Documentation milestones dans `.gsd/milestones/`.
Utiliser `/gsd` pour les commandes GSD.
