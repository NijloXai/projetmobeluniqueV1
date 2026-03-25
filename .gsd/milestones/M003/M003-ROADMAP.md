# M003: CRUD Tissus

**Vision:** CRUD complet des tissus côté admin. L'admin gère ses tissus en autonomie. Premier CRUD admin — établit les patterns réutilisables pour M004 (produits).

## Success Criteria

- L'admin peut créer un tissu (nom, slug, catégorie, standard/premium, swatch, photo ref)
- Le tableau /admin/tissus affiche tous les tissus avec toggle actif/inactif
- Modifier un tissu met à jour la BDD et les images
- Supprimer un tissu avec confirmation
- Les catégories sont un combobox (existantes + nouvelle)
- Le slug est auto-généré mais éditable
- Upload swatch (max 2MB) et photo ref (max 5MB) avec preview

## Key Risks / Unknowns

- Aucun risque majeur — CRUD standard avec upload

## Proof Strategy

- CRUD fonctionne → vérifié en navigateur avec un tissu complet
- Toggle → vérifié en navigateur + contrôle via API publique
- Upload → vérifié que les images sont dans les bons buckets Supabase

## Verification Classes

- Contract: CRUD complet (create, read, update, delete, toggle)
- Integration: Supabase DB + Storage
- UAT: flow complet dans le navigateur

## Milestone Definition of Done

- S01, S02, S03 terminés
- Un tissu peut être créé, vu dans le tableau, modifié, désactivé et supprimé
- Les images sont dans les bons buckets
- Le combobox catégorie fonctionne
- Le slug auto-généré est éditable

## Requirement Coverage

- Covers: R006, R013, R014, R015
- Leaves for later: R007, R008, R009, R010, R011, R016

## Slices

- [x] **S01: API Admin Tissus** `risk:low` `depends:[]`
  > After this: les routes POST/PUT/DELETE /api/admin/fabrics fonctionnent avec validation Zod, upload images, et auth vérifiée. Testable via curl.

- [x] **S02: Page Liste + Toggle** `risk:low` `depends:[S01]`
  > After this: /admin/tissus affiche un tableau avec tous les tissus, toggle actif/inactif, bouton supprimer avec confirmation, lien vers création/édition.

- [x] **S03: Formulaire Création/Édition** `risk:medium` `depends:[S01]`
  > After this: /admin/tissus/new et /admin/tissus/[id]/edit — formulaire complet avec combobox catégorie, slug auto-généré, upload swatch + photo ref avec preview.

## Boundary Map

### S01 → S02, S03

Produces:
- `src/app/api/admin/fabrics/route.ts` — GET (liste admin) + POST (création)
- `src/app/api/admin/fabrics/[id]/route.ts` — GET (détail) + PUT (update) + DELETE (suppression)
- `src/app/api/admin/fabrics/categories/route.ts` — GET (catégories distinctes)

### S02

Produces:
- `src/app/admin/(protected)/tissus/page.tsx` — page tableau
- Composants réutilisables : AdminTable, ToggleSwitch, ConfirmDialog

### S03

Produces:
- `src/app/admin/(protected)/tissus/new/page.tsx` — création
- `src/app/admin/(protected)/tissus/[id]/edit/page.tsx` — édition
- Composants réutilisables : FormField, ImageUpload, ComboboxCategory
