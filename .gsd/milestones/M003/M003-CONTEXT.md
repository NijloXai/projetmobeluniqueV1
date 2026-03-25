---
depends_on: [M001, M002]
---

# M003: CRUD Tissus

**Gathered:** 2026-03-23
**Status:** Ready for planning

## Project Description

CRUD complet des tissus côté admin — API routes + pages admin (tableau + formulaire). L'admin gère ses tissus en autonomie : création, modification, upload images, catégorisation libre, toggle actif/inactif global.

## Why This Milestone

Les tissus doivent exister avant la génération IA (M005). Le CRUD tissus est aussi le premier CRUD admin qu'on construit — il établit les patterns de composants réutilisables (tableau admin, formulaire, upload, toggle) qui seront repris dans M004 (produits).

## User-Visible Outcome

### When this milestone is complete, the user can:

- Voir la liste de tous les tissus dans un tableau admin (/admin/tissus)
- Créer un nouveau tissu avec nom, catégorie, type standard/premium, images
- Modifier un tissu existant
- Activer/désactiver un tissu globalement (toggle dans le tableau)
- Supprimer un tissu avec confirmation
- Uploader un swatch (max 2MB) et une photo de référence (max 5MB)
- Le slug est auto-généré depuis le nom mais modifiable

### Entry point / environment

- Entry point: http://localhost:3000/admin/tissus
- Environment: local dev (navigateur), authentifié via M002
- Live dependencies involved: Supabase (DB + Storage)

## Completion Class

- Contract complete means: CRUD complet fonctionne, upload images OK, validation zod
- Integration complete means: données persistées dans Supabase, images dans les bons buckets
- Operational complete means: none

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- L'admin peut créer un tissu avec swatch + photo ref, le voir dans le tableau, le modifier, et le supprimer
- Le toggle actif/inactif met à jour la BDD immédiatement
- Un tissu désactivé n'apparaît plus via GET /api/models (RLS)
- Les catégories existantes sont proposées dans le select + on peut en taper une nouvelle

## Risks and Unknowns

- Aucun risque majeur — CRUD standard avec upload

## Existing Codebase / Prior Art

- `src/lib/schemas.ts` — createFabricSchema et updateFabricSchema déjà définis
- `src/types/database.ts` — types Fabric, FabricInsert, FabricUpdate déjà générés
- `src/lib/utils.ts` — slugify() déjà implémenté
- `src/lib/supabase/server.ts` — client serveur prêt
- Bucket `fabric-swatches` (public) et `fabric-references` (privé) déjà créés

> See `.gsd/DECISIONS.md` for all decisions — notamment D010 (slugs), D011 (catégories libres), D013 (contrôle global tissus).

## Relevant Requirements

- R006 — CRUD Tissus
- R013 — Catégories tissus libres
- R014 — Slugs auto-générés + éditables
- R015 — Upload images avec preview + validation

## Scope

### In Scope

- API routes POST/PUT/DELETE /api/admin/fabrics
- Page /admin/tissus (tableau)
- Page /admin/tissus/new et /admin/tissus/[id] (formulaire création/édition)
- Upload swatch vers bucket fabric-swatches
- Upload photo référence vers bucket fabric-references
- Combobox catégorie (existantes + nouvelle)
- Slug auto-généré + éditable
- Toggle actif/inactif dans le tableau
- Suppression avec confirmation
- Composants réutilisables : AdminTable, FormField, ImageUpload, ToggleSwitch

### Out of Scope / Non-Goals

- Pagination avancée (pas assez de tissus pour en avoir besoin au lancement)
- Recherche / filtres dans le tableau
- Drag & drop réordonnement des tissus

## Technical Constraints

- Auth vérifiée sur chaque route API admin (middleware M002)
- Radix UI + CSS Modules
- react-hook-form + zod pour les formulaires
- Messages d'erreur en français
- Upload via Supabase Storage SDK

## Integration Points

- Supabase DB — table fabrics
- Supabase Storage — buckets fabric-swatches et fabric-references

## Open Questions

- None
