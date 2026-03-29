# Roadmap: Möbel Unique

## Milestones

- ✅ **v7.0 Header + Hero + Comment ca marche** - Phases 1-3 (shipped 2026-03-27)
- ✅ **v8.0 Catalogue Produits** - Phases 4-6 (shipped 2026-03-29)
- 🚧 **v9.0 Configurateur Tissu** - Phases 7-9 (in progress)

## Phases

<details>
<summary>✅ v7.0 Header + Hero + Comment ca marche (Phases 1-3) - SHIPPED 2026-03-27</summary>

- [x] Phase 1: Fondation + Header (1/1 plans) — completed 2026-03-26
- [x] Phase 2: Hero plein écran (1/1 plans) — completed 2026-03-26
- [x] Phase 3: HowItWorks + assemblage (1/1 plans) — completed 2026-03-26

</details>

<details>
<summary>✅ v8.0 Catalogue Produits (Phases 4-6) - SHIPPED 2026-03-29</summary>

- [x] Phase 4: Prerequis + Catalogue core (2/2 plans) — completed 2026-03-28
- [x] Phase 5: Recherche et états interactifs (2/2 plans) — completed 2026-03-29
- [x] Phase 6: Modal configurateur placeholder (1/1 plans) — completed 2026-03-29

</details>

### 🚧 v9.0 Configurateur Tissu (In Progress)

**Milestone Goal:** Le client peut choisir un tissu et voir le rendu IA du canapé dans ce tissu, avec prix mis à jour et lien achat Shopify.

- [ ] **Phase 7: Fetch données + câblage props** - Co-fetch server-side fabrics/visuals et forwarding props jusqu'à ConfiguratorModal
- [ ] **Phase 8: Configurateur core** - Swatches tissu, rendu IA avec fallback, prix dynamique, CTA Shopify
- [ ] **Phase 9: Navigation angles** - Thumbnails angles disponibles et sélection angle actif

## Phase Details

### Phase 7: Fetch données + câblage props
**Goal**: Les données tissus et visuels publiés sont disponibles dans ConfiguratorModal sans waterfall réseau
**Depends on**: Phase 6
**Requirements**: CONF-01, CONF-02, CONF-04, CONF-05, CONF-07, CONF-08, CONF-09, CONF-10
**Success Criteria** (what must be TRUE):
  1. CatalogueSection charge en parallèle les modèles, les tissus actifs et les visuels publiés via Promise.all
  2. ConfiguratorModal reçoit les props fabrics et visuals sans aucun fetch côté client au moment de l'ouverture
  3. Les types TypeScript reflètent le contrat de données complet (VisualWithFabricAndImage, props étendues)
  4. Les tissus désactivés (is_active = false) sont filtrés côté JS avant forwarding — aucun tissu inactif n'atteint le modal
**Plans**: TBD
**UI hint**: yes

### Phase 8: Configurateur core
**Goal**: Le client peut sélectionner un tissu, voir le rendu IA correspondant, lire le prix mis à jour et cliquer pour acheter
**Depends on**: Phase 7
**Requirements**: CONF-01, CONF-02, CONF-03, CONF-05, CONF-07, CONF-08, CONF-09, CONF-10
**Success Criteria** (what must be TRUE):
  1. Le client voit une grille de swatches cliquables (miniatures swatch_url) pour les tissus ayant au moins un rendu publié pour ce modèle — le swatch sélectionné est visuellement distinct (bordure primary)
  2. Les tissus premium affichent un badge "Premium" sur leur swatch
  3. Le rendu IA publié s'affiche quand un tissu est sélectionné ; si aucun rendu n'existe, la photo originale du modèle s'affiche avec un badge "Photo originale"
  4. Le prix affiché se met à jour immédiatement lors de la sélection d'un tissu (base + 80 EUR si premium) et le détail du surcoût est visible quand applicable
  5. Le CTA "Acheter sur Shopify" est présent et redirige vers le produit en nouvel onglet ; il est masqué si le modèle n'a pas de shopify_url
**Plans**: TBD
**UI hint**: yes

### Phase 9: Navigation angles
**Goal**: Le client peut naviguer entre les angles de vue disponibles pour le tissu sélectionné
**Depends on**: Phase 8
**Requirements**: CONF-04, CONF-06
**Success Criteria** (what must be TRUE):
  1. Le client voit les thumbnails des angles disponibles pour le tissu actuellement sélectionné (uniquement les angles ayant un rendu publié)
  2. Cliquer un thumbnail change l'image principale sans saut de layout (aspect-ratio fixe 4/3 maintenu)
  3. L'angle actif est visuellement distinct parmi les thumbnails
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Fondation + Header | v7.0 | 1/1 | Complete | 2026-03-26 |
| 2. Hero plein écran | v7.0 | 1/1 | Complete | 2026-03-26 |
| 3. HowItWorks + assemblage | v7.0 | 1/1 | Complete | 2026-03-26 |
| 4. Prerequis + Catalogue core | v8.0 | 2/2 | Complete | 2026-03-28 |
| 5. Recherche et états interactifs | v8.0 | 2/2 | Complete | 2026-03-29 |
| 6. Modal configurateur placeholder | v8.0 | 1/1 | Complete | 2026-03-29 |
| 7. Fetch données + câblage props | v9.0 | 0/? | Not started | - |
| 8. Configurateur core | v9.0 | 0/? | Not started | - |
| 9. Navigation angles | v9.0 | 0/? | Not started | - |

---
*Roadmap created: 2026-03-26*
*v7.0 shipped: 2026-03-27*
*v8.0 shipped: 2026-03-29*
*v9.0 started: 2026-03-29*
