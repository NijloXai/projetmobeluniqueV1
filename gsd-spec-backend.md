# Möbel Unique — GSD Spec Backend

## Project Overview

Application de visualisation IA pour Möbel Unique (vendeur de canapés personnalisables, Paris).
App séparée de Shopify. Single Page App : hero + catalogue + configurateur tissu + simulation IA.

Ce milestone couvre le **backend complet** : BDD, auth, CRUD, génération IA, export.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript strict
- **UI:** Radix UI (headless) + CSS Modules (PAS Tailwind, PAS shadcn/ui)
- **State:** Zustand + Immer
- **Backend/BDD:** Supabase (PostgreSQL + Auth + Storage)
- **Hosting:** Vercel
- **IA:** Nano Banana 2 (Gemini) — génération images
- **Forms:** react-hook-form + zod
- **Langue:** Français uniquement

## Requirements

### R1: Schéma BDD Supabase (4 tables)

**Table `models` (canapés):**
- id (UUID PK), slug (TEXT UNIQUE NOT NULL), name (TEXT NOT NULL), description (TEXT), price (NUMERIC(10,2) NOT NULL), dimensions (TEXT), shopify_url (TEXT), is_active (BOOLEAN DEFAULT true), created_at (TIMESTAMPTZ DEFAULT now())

**Table `model_images` (photos multi-angles):**
- id (UUID PK), model_id (UUID FK → models ON DELETE CASCADE), image_url (TEXT NOT NULL), view_type (TEXT NOT NULL: face/profil/3-4/arriere/dessus), sort_order (INT DEFAULT 0)

**Table `fabrics` (tissus):**
- id (UUID PK), slug (TEXT UNIQUE NOT NULL), name (TEXT NOT NULL), category (TEXT), is_premium (BOOLEAN DEFAULT false), swatch_url (TEXT), reference_image_url (TEXT), is_active (BOOLEAN DEFAULT true), created_at (TIMESTAMPTZ DEFAULT now())

**Table `generated_visuals` (rendus IA):**
- id (UUID PK), model_id (UUID FK → models ON DELETE CASCADE), model_image_id (UUID FK → model_images ON DELETE CASCADE), fabric_id (UUID FK → fabrics ON DELETE CASCADE), generated_image_url (TEXT NOT NULL), is_validated (BOOLEAN DEFAULT false), is_published (BOOLEAN DEFAULT false), created_at (TIMESTAMPTZ DEFAULT now())
- UNIQUE(model_image_id, fabric_id)

**Relations:**
- models 1:N model_images
- models 1:N generated_visuals
- fabrics 1:N generated_visuals
- model_images 1:N generated_visuals

### R2: Row Level Security

**Public (lecture):**
- models: SELECT WHERE is_active = true
- model_images: SELECT WHERE parent model is_active = true
- fabrics: SELECT WHERE is_active = true
- generated_visuals: SELECT WHERE is_validated = true AND is_published = true

**Admin (écriture):**
- Toutes tables: ALL WHERE auth.role() = 'authenticated'

### R3: Supabase Storage Buckets

| Bucket | Usage | Public |
|--------|-------|--------|
| model-photos | Photos uploadées canapés | Oui (lecture) |
| fabric-swatches | Miniatures tissus | Oui (lecture) |
| fabric-references | Photos ref pour Nano Banana | Non |
| generated-visuals | Rendus IA | Oui (lecture) |

### R4: API Routes publiques

- GET /api/models → Liste canapés actifs + images + tissus disponibles
- GET /api/models/[slug] → Un canapé par slug (pour lien Shopify ?produit=slug)
- GET /api/models/[slug]/visuals → Rendus validés+publiés

### R5: Auth admin

- Login email/password via Supabase Auth
- Pas de création de compte UI → admin créé manuellement dans Supabase
- Middleware Next.js protège /admin/*
- Page /admin/login → formulaire simple
- Déconnexion dans header admin
- Non authentifié → redirect /admin/login

### R6: CRUD Tissus (admin)

- POST/PUT/DELETE /api/admin/fabrics
- Page /admin/tissus → tableau (swatch, nom, catégorie, type standard/premium, nb canapés, toggle actif, actions)
- Page /admin/tissus/[id] → formulaire (nom, slug auto, catégorie select, type radio standard/premium, upload swatch max 2MB, upload photo ref max 5MB, toggle actif)
- Validation zod
- Désactivation → tissu disparaît de TOUS les canapés côté client

### R7: CRUD Produits (admin)

- POST/PUT/DELETE /api/admin/models + /api/admin/model-images
- Page /admin/produits → tableau (image, nom, prix, nb angles, nb tissus publiés, toggle actif, actions)
- Page /admin/produits/[id] avec 3 sections :
  1. Infos canapé (formulaire : nom, slug, description, prix, dimensions, lien Shopify, toggle actif)
  2. Photos multi-angles (upload drag&drop, grille avec select vue + ordre + supprimer)
  3. Génération IA (voir R8)

### R8: Génération IA rendus

- Sélecteur tissu → tableau rendus par angle
- Par rendu : photo originale, rendu IA (ou "non généré"), statut (validé/en attente/non généré), actions (générer/régénérer/valider/publier)
- Boutons globaux : "Générer tout", "Valider tout", "Publier tout"
- POST /api/admin/generate → input: model_image + fabric reference → output: image générée dans Storage
- POST /api/admin/generate-all → tous les angles pour un tissu
- Régénération écrase le rendu précédent (UNIQUE constraint)
- PUT /api/admin/visuals/[id]/validate
- PUT /api/admin/visuals/[id]/publish

### R9: Export ZIP

- GET /api/admin/visuals/[modelId]/export
- ZIP côté serveur avec tous les rendus validés du canapé
- Nommage : {nom-canape}-{tissu}-{angle}.jpg
- Téléchargement direct

### R10: Règles métier

**Visibilité client:**
- Canapé visible SI models.is_active = true
- Tissu visible sur un canapé SI fabrics.is_active = true ET au moins 1 rendu validé+publié pour cette combinaison

**Pricing:**
- Standard (is_premium=false) → prix = models.price
- Premium (is_premium=true) → prix = models.price + 80€ (fixe)

**Lien Shopify:**
- Shopify → App : ?produit=slug → charge via models.slug
- App → Shopify : bouton "Commander" → models.shopify_url
- Slug inexistant/inactif → fallback catalogue

## Design Tokens

- Primary: #E49400 (ambre)
- Secondary: #EFC806 (jaune vif)
- Text: #1D1D1B (quasi-noir)
- Background: #FFFFFF
- Background alt: #F8F4EE
- Font: Montserrat (Bold titres, Regular corps)

## File Structure

```
app/
  admin/
    login/page.tsx
    layout.tsx
    page.tsx
    produits/page.tsx
    produits/[id]/page.tsx
    tissus/page.tsx
    tissus/[id]/page.tsx
  api/
    models/route.ts
    models/[slug]/route.ts
    models/[slug]/visuals/route.ts
    admin/models/route.ts
    admin/model-images/route.ts
    admin/fabrics/route.ts
    admin/generate/route.ts
    admin/visuals/[id]/route.ts
```

## Build Order (strict dependencies)

1. **Milestone 1: Foundation** — Init Next.js 16 + Supabase config + 4 tables + RLS + Storage buckets + API routes publiques
2. **Milestone 2: Auth** — Supabase Auth + login page + middleware + layout admin
3. **Milestone 3: Tissus** — CRUD complet tissus (API + pages admin)
4. **Milestone 4: Produits** — CRUD produits + upload photos multi-angles
5. **Milestone 5: Génération IA** — Intégration Nano Banana 2 + generate/validate/publish
6. **Milestone 6: Export** — ZIP export des rendus validés

## Code Conventions

- TypeScript strict
- Un fichier par composant, PascalCase
- CSS Modules: [composant].module.css
- Validation: zod schemas partagés front/back
- Messages d'erreur en français
- Supabase client directement (pas Prisma)
- PAS de Tailwind, PAS de shadcn/ui
