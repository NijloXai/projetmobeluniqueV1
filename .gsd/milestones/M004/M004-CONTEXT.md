---
depends_on: [M001, M002, M003]
---

# M004: CRUD Produits

**Gathered:** 2026-03-23
**Status:** Ready for planning

## Project Description

CRUD complet des canapés côté admin — API routes + pages admin. Formulaire en 3 sections : infos produit, photos multi-angles avec drag&drop et réordonnement, et mode classique (upload photos finales sans IA). La section 3 (génération IA) est dans M005.

## Why This Milestone

Les produits sont le cœur du catalogue. M004 construit la gestion des canapés avec leurs photos multi-angles. Le mode classique permet à l'admin d'uploader des rendus sans attendre l'intégration IA. Ce milestone réutilise les patterns de composants établis dans M003 (tableaux, formulaires, upload).

## User-Visible Outcome

### When this milestone is complete, the user can:

- Voir la liste de tous les canapés dans un tableau admin (/admin/produits)
- Créer un canapé avec nom, slug, description, prix, dimensions, lien Shopify
- Uploader plusieurs photos multi-angles avec choix de vue (face, profil, 3/4, etc.) et réordonnement
- Supprimer des photos individuelles
- Mode classique : uploader une photo finale en choisissant l'angle et le tissu → publié direct
- Activer/désactiver un canapé
- Supprimer un canapé avec confirmation

### Entry point / environment

- Entry point: http://localhost:3000/admin/produits
- Environment: local dev (navigateur), authentifié via M002
- Live dependencies involved: Supabase (DB + Storage)

## Completion Class

- Contract complete means: CRUD complet, upload multi-angles, mode classique
- Integration complete means: photos dans bucket model-photos, generated_visuals peuplé en mode classique
- Operational complete means: none

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- L'admin crée un canapé, uploade 3 photos (face, profil, 3/4), les réordonne
- L'admin utilise le mode classique pour uploader une photo finale avec tissu X → le rendu apparaît dans generated_visuals avec is_validated=true et is_published=true
- Le canapé apparaît dans GET /api/models avec ses images
- Un canapé désactivé n'apparaît plus via l'API publique

## Risks and Unknowns

- Drag & drop upload — peut être complexe côté UX avec Radix UI (pas de composant natif)
- Réordonnement des photos — sort_order à maintenir côté BDD

## Existing Codebase / Prior Art

- `src/lib/schemas.ts` — createModelSchema et updateModelSchema déjà définis
- `src/types/database.ts` — types Model, ModelImage, GeneratedVisual déjà générés
- `src/lib/utils.ts` — slugify() déjà implémenté
- Composants admin de M003 (AdminTable, FormField, ImageUpload, ToggleSwitch) — réutilisables
- Bucket `model-photos` (public) et `generated-visuals` (public) déjà créés
- Table `model_images` avec view_type (champ libre) et sort_order

> See `.gsd/DECISIONS.md` for all decisions — notamment D010 (slugs), D012 (mode classique sans IA).

## Relevant Requirements

- R007 — CRUD Produits
- R014 — Slugs auto-générés + éditables
- R015 — Upload images avec preview + validation

## Scope

### In Scope

- API routes POST/PUT/DELETE /api/admin/models
- API routes POST/PUT/DELETE /api/admin/model-images
- Page /admin/produits (tableau)
- Page /admin/produits/new et /admin/produits/[id] (formulaire)
- Section 1 : infos canapé
- Section 2 : photos multi-angles (upload, preview, vue, ordre, suppression)
- Mode classique : upload photo finale → generated_visuals validé+publié
- Réordonnement drag & drop ou flèches haut/bas

### Out of Scope / Non-Goals

- Section 3 : génération IA (M005)
- Boutons Générer tout / Valider tout / Publier tout (M005)
- Export ZIP (M006)

## Technical Constraints

- Auth vérifiée sur chaque route API admin
- view_type = champ libre (l'admin tape ce qu'il veut)
- Mode classique → insert generated_visuals avec is_validated=true et is_published=true
- Réutiliser les composants admin de M003

## Integration Points

- Supabase DB — tables models, model_images, generated_visuals
- Supabase Storage — buckets model-photos et generated-visuals

## Open Questions

- None
