# Requirements: Mobel Unique

**Defined:** 2026-03-26
**Core Value:** Le client peut visualiser un canape dans le tissu de son choix et le simuler dans son salon avant d'acheter.

## v7.0 Requirements

Requirements pour le milestone v7.0 — Header + Hero + Comment ca marche.

### Header

- [x] **HEAD-01**: Header sticky fixed avec logo MU et lien retour Shopify
- [x] **HEAD-02**: Transition transparent -> blanc au scroll (seuil 80px, 300ms)
- [x] **HEAD-03**: Effet glassmorphism sur le header au scroll (backdrop-blur 20px)
- [x] **HEAD-04**: Skip link accessibilite "Aller au contenu" (visible au focus)

### Hero

- [ ] **HERO-01**: Section plein ecran (100svh) avec image de fond et overlay
- [ ] **HERO-02**: Badge "Visualisation par IA", titre H1, sous-titre et CTA
- [ ] **HERO-03**: Indicateur de scroll anime en bas du hero
- [ ] **HERO-04**: Animation fade-in des elements au chargement

### Comment ca marche

- [ ] **STEP-01**: 3 cartes etapes (choisir, personnaliser, visualiser) avec icones
- [ ] **STEP-02**: Layout responsive (1 col mobile -> 3 col desktop, fond alterne)
- [ ] **STEP-03**: Animation apparition au scroll via IntersectionObserver

### Fondation

- [x] **FOND-01**: Page publique remplace le template Next.js par defaut
- [x] **FOND-02**: Metadata publique (titre, description pour SEO)
- [x] **FOND-03**: Responsive 4 breakpoints (mobile/tablet/desktop/large)
- [x] **FOND-04**: scroll-padding-top et scroll-behavior smooth dans globals.css

## Future Requirements

### Catalogue (M008)

- **CAT-01**: Cards produits reliees a l'API GET /api/models
- **CAT-02**: Route publique GET /api/fabrics pour mini-swatches
- **CAT-03**: Selection produit -> scroll vers configurateur

### Configurateur (M009)

- **CONF-01**: Selection tissu avec swatches et zoom texture
- **CONF-02**: Affichage rendu IA publie par angle
- **CONF-03**: Prix dynamique avec supplement premium

### Simulation (M010)

- **SIM-01**: Upload photo salon (drag & drop)
- **SIM-02**: Generation IA via POST /api/simulate
- **SIM-03**: Resultat avec telecharger, WhatsApp, CTA Shopify

### Polish (M011)

- **POL-01**: Produits similaires (anti dead-end)
- **POL-02**: Footer avec credits et retour Shopify
- **POL-03**: Sticky bar mobile
- **POL-04**: Parcours ?produit=slug depuis Shopify

## Out of Scope

| Feature | Reason |
|---------|--------|
| Tailwind / shadcn/ui | Convention projet — CSS Modules uniquement |
| Video background hero | Complexite + performance, anti-feature identifiee |
| Carousel hero | Anti-feature UX identifiee par la recherche |
| Parallax scroll | Anti-feature — complexite sans valeur ajoutee |
| Dark mode | Hors scope — marque a palette fixe |
| Integration Nano Banana reelle | M012+ — mock suffit pour le dev |
| Pages multiples | SPA single page — convention projet |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOND-01 | Phase 1 | Complete |
| FOND-02 | Phase 1 | Complete |
| FOND-03 | Phase 1 | Complete |
| FOND-04 | Phase 1 | Complete |
| HEAD-01 | Phase 1 | Complete |
| HEAD-02 | Phase 1 | Complete |
| HEAD-03 | Phase 1 | Complete |
| HEAD-04 | Phase 1 | Complete |
| HERO-01 | Phase 2 | Pending |
| HERO-02 | Phase 2 | Pending |
| HERO-03 | Phase 2 | Pending |
| HERO-04 | Phase 2 | Pending |
| STEP-01 | Phase 3 | Pending |
| STEP-02 | Phase 3 | Pending |
| STEP-03 | Phase 3 | Pending |

**Coverage:**
- v7.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after roadmap creation — traceability complete*
