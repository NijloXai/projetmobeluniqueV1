# M004: CRUD Produits

**Vision:** CRUD complet des canapés côté admin. Formulaire avec infos produit, photos multi-angles, et mode classique (upload rendus sans IA). Réutilise les patterns de M003.

## Success Criteria

- L'admin peut créer un canapé (nom, slug, description, prix, dimensions, lien Shopify)
- Upload multi-angles avec choix de vue et réordonnement
- Mode classique : upload photo finale + choix angle + choix tissu → rendu publié
- Tableau /admin/produits avec toggle actif/inactif
- Un canapé désactivé n'apparaît plus via API publique (déjà couvert par RLS)
- Le canapé créé apparaît dans GET /api/models avec ses images

## Slices

- [x] **S01: API Admin Produits + Images** `risk:low` `depends:[]`
  > After this: routes CRUD /api/admin/models et /api/admin/models/[id]/images fonctionnent. Testable via curl/fetch.

- [x] **S02: Page Liste Produits** `risk:low` `depends:[S01]`
  > After this: /admin/produits affiche un tableau avec tous les canapés, toggle actif/inactif, prix, nb photos, liens Modifier/Supprimer.

- [x] **S03: Formulaire Produit + Photos Multi-Angles** `risk:medium` `depends:[S01]`
  > After this: /admin/produits/new et /admin/produits/[id]/edit — formulaire complet section infos + section photos (upload, vue, réordonnement, suppression).

- [x] **S04: Mode Classique (upload rendus sans IA)** `risk:medium` `depends:[S01,S03]`
  > After this: dans la fiche produit, l'admin peut uploader une photo finale en choisissant l'angle et le tissu → insert dans generated_visuals avec is_validated=true et is_published=true.

## Requirement Coverage

- Covers: R007, R014 (partiel — déjà validé pour tissus), R015 (partiel)
- Leaves for later: R008, R009, R010, R011, R016
