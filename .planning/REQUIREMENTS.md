# Requirements: Mobel Unique — v9.0 Configurateur Tissu

**Defined:** 2026-03-29
**Core Value:** Le client peut visualiser un canape dans le tissu de son choix et le simuler dans son salon avant d'acheter.

## v9.0 Requirements

Requirements pour le configurateur tissu. Chaque requirement mappe a une phase du roadmap.

### Selection Tissu

- [x] **CONF-01**: Le client voit les swatches des tissus disponibles (ayant au moins un rendu publie pour ce modele)
- [x] **CONF-02**: Le client peut cliquer un swatch pour selectionner un tissu — le swatch actif est visuellement distinct
- [x] **CONF-03**: Les tissus premium affichent un badge "Premium" sur leur swatch

### Rendu IA

- [x] **CONF-04**: Le modal affiche le rendu IA publie du canape dans le tissu selectionne
- [x] **CONF-05**: Si aucun rendu n'existe pour le tissu/angle, la photo originale du modele s'affiche en fallback
- [x] **CONF-06**: Le client peut naviguer entre les angles disponibles via des thumbnails

### Prix

- [x] **CONF-07**: Le prix affiche se met a jour dynamiquement (base + 80 EUR si tissu premium)
- [x] **CONF-08**: Le detail du prix indique le surcout tissu quand applicable

### Achat

- [x] **CONF-09**: Un CTA "Acheter sur Shopify" redirige vers le produit (nouvel onglet)
- [x] **CONF-10**: Le CTA est masque si le produit n'a pas de shopify_url

## Future Requirements

### Simulation (v10.0)

- **SIM-01**: Upload photo salon (drag & drop)
- **SIM-02**: Generation IA via POST /api/simulate
- **SIM-03**: Resultat avec telecharger, WhatsApp, CTA Shopify

### Polish (v11.0)

- **POL-01**: Produits similaires (anti dead-end)
- **POL-02**: Footer avec credits et retour Shopify
- **POL-03**: Sticky bar mobile
- **POL-04**: Parcours ?produit=slug depuis Shopify

### Deferred from v8.0

- **SORT-01**: Tri produits par prix croissant/decroissant
- **SORT-02**: Tri produits par nouveautes
- **SWATCH-01**: Swatches miniatures de tissus sur les cards catalogue

## Out of Scope

| Feature | Reason |
|---------|--------|
| Generation IA temps-reel cote client | Architecture backend impose pre-generation admin — anti-feature |
| Zoom interactif pan/pinch sur le rendu | react-zoom-pan-pinch incompatible React 19, encart statique suffit per wireframe |
| Zustand pour state configurateur | useState suffit — Zustand reserve pour v10.0 quand simulation consomme selectedFabric |
| Filtres tissu (couleur, matiere) | Complexite disproportionnee pour le volume actuel de tissus |
| Panier / checkout integre | Shopify gere le checkout — CTA redirige |
| Tailwind / shadcn/ui | Convention projet — CSS Modules uniquement |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONF-01 | Phase 7 + Phase 8 | Complete |
| CONF-02 | Phase 8 | Complete |
| CONF-03 | Phase 8 | Complete |
| CONF-04 | Phase 9 | Complete |
| CONF-05 | Phase 8 | Complete |
| CONF-06 | Phase 9 | Complete |
| CONF-07 | Phase 8 | Complete |
| CONF-08 | Phase 8 | Complete |
| CONF-09 | Phase 8 | Complete |
| CONF-10 | Phase 8 | Complete |

**Coverage:**
- v9.0 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-03-29*
*Last updated: 2026-03-29 after roadmap creation*
