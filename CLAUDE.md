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
| UI | CSS Modules (pas de Tailwind, pas de shadcn/ui) |
| Validation | Zod 4 + react-hook-form |
| Animation | Motion (Framer Motion) |
| Icônes | Lucide React |
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
    page.tsx              → Page d'accueil
  components/
    admin/                → Composants admin (Header, Sidebar, ConfirmDialog, ImageUpload, ToggleSwitch)
    public/
      Header/             → Header site public
      Hero/               → Section hero plein écran
      HowItWorks/         → Section "Comment ça marche"
      Catalogue/          → Catalogue produits + ProductCard + ConfiguratorModal + Skeleton
  lib/
    supabase/             → Clients (browser, server, middleware, admin)
    ai/                   → Service IA (types, mock, nano-banana, prompts)
    schemas.ts            → Schémas Zod
    utils.ts              → Utilitaires (slugify, calculatePrice, extractStoragePath)
  types/database.ts       → Types auto-générés Supabase
  proxy.ts                → Middleware Next.js 16 (token refresh)
public/
  brand/                  → Logos et icônes PWA
supabase/
  config.toml             → Config Supabase locale
  migrations/             → Schema SQL
  seed.sql                → Données de test
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
- Primary dark: `#845400`
- Secondary: `#EFC806` (jaune vif)
- Text: `#1D1D1B`
- Muted: `#888888`
- Background: `#FFFFFF` / Alt: `#F8F4EE`
- Error: `#BA1A1A`
- Font: Montserrat (400, 500, 600, 700)
- Radius: sm 4px, md 8px, lg 12px, xl 16px

Référence complète : `CHARTE-GRAPHIQUE.md`

## Scripts

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Build production
npm run lint         # ESLint
npx tsc --noEmit     # Vérification types
```

## Environnement

```
NEXT_PUBLIC_SUPABASE_URL        → URL publique Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY   → Clé anon publique
SUPABASE_PROJECT_REF            → Ref projet (MCP)
SUPABASE_ACCESS_TOKEN           → Token accès (MCP)
NANO_BANANA_API_KEY             → (optionnel) Active le vrai service IA
```
