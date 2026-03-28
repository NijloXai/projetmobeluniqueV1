# Requirements: Mobel Unique — v8.0 Catalogue Produits

**Defined:** 2026-03-28
**Core Value:** Le client peut visualiser un canape dans le tissu de son choix et le simuler dans son salon avant d'acheter.

## v8.0 Requirements

Requirements pour le catalogue produits. Chaque requirement mappe a une phase du roadmap.

### Prerequis Techniques

- [ ] **TECH-01**: Les images Supabase Storage s'affichent via next/image (remotePatterns configure)

### Catalogue Core

- [ ] **CAT-01**: L'utilisateur voit les canapes disponibles sous forme de cards avec image, nom et prix
- [ ] **CAT-02**: Les cards s'affichent en grille responsive (1 col mobile / 2 col tablet / 3 col desktop)
- [ ] **CAT-03**: Un skeleton loading s'affiche pendant le chargement des produits
- [ ] **CAT-04**: Le nombre de produits affiches est visible (ex: "3 canapes")

### Recherche

- [ ] **SRCH-01**: L'utilisateur peut rechercher un canape par nom via une barre de recherche
- [ ] **SRCH-02**: Un message s'affiche quand aucun produit ne correspond a la recherche

### Modal Configurateur

- [ ] **MODAL-01**: Le CTA "Configurer ce modele" ouvre un modal large (90vw desktop, plein ecran mobile)
- [ ] **MODAL-02**: Le modal est accessible (focus trap, fermeture Escape, aria-modal)
- [ ] **MODAL-03**: Le modal affiche un placeholder "Configurateur a venir" avec le nom du canape selectionne

## v7.0 Requirements (Validated)

### Header

- [x] **HEAD-01**: Header sticky fixed avec logo MU et lien retour Shopify
- [x] **HEAD-02**: Transition transparent -> blanc au scroll (seuil 80px, 300ms)
- [x] **HEAD-03**: Effet glassmorphism sur le header au scroll (backdrop-blur 20px)
- [x] **HEAD-04**: Skip link accessibilite "Aller au contenu" (visible au focus)

### Hero

- [x] **HERO-01**: Section plein ecran (100svh) avec image de fond et overlay
- [x] **HERO-02**: Badge "Visualisation par IA", titre H1, sous-titre et CTA
- [x] **HERO-03**: Indicateur de scroll anime en bas du hero
- [x] **HERO-04**: Animation fade-in des elements au chargement

### Comment ca marche

- [x] **STEP-01**: 3 cartes etapes (choisir, personnaliser, visualiser) avec icones
- [x] **STEP-02**: Layout responsive (1 col mobile -> 3 col desktop, fond alterne)
- [x] **STEP-03**: Animation apparition au scroll via IntersectionObserver

### Fondation

- [x] **FOND-01**: Page publique remplace le template Next.js par defaut
- [x] **FOND-02**: Metadata publique (titre, description pour SEO)
- [x] **FOND-03**: Responsive 4 breakpoints (mobile/tablet/desktop/large)
- [x] **FOND-04**: scroll-padding-top et scroll-behavior smooth dans globals.css

## Future Requirements

### Configurateur (v9.0)

- **CONF-01**: Selection tissu avec swatches et zoom texture
- **CONF-02**: Affichage rendu IA publie par angle
- **CONF-03**: Prix dynamique avec supplement premium

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
| Tailwind / shadcn/ui | Convention projet — CSS Modules uniquement |
| Video background hero | Complexite + performance, anti-feature identifiee |
| Carousel hero | Anti-feature UX identifiee par la recherche |
| Parallax scroll | Anti-feature — complexite sans valeur ajoutee |
| Dark mode | Hors scope — marque a palette fixe |
| Integration Nano Banana reelle | M012+ — mock suffit pour le dev |
| Pages multiples | SPA single page — convention projet |
| Pagination / scroll infini | Pas necessaire pour 20-30 produits |
| Filtres avances (style, places, prix) | Complexite disproportionnee pour le volume actuel |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TECH-01 | Phase ? | Pending |
| CAT-01 | Phase ? | Pending |
| CAT-02 | Phase ? | Pending |
| CAT-03 | Phase ? | Pending |
| CAT-04 | Phase ? | Pending |
| SRCH-01 | Phase ? | Pending |
| SRCH-02 | Phase ? | Pending |
| MODAL-01 | Phase ? | Pending |
| MODAL-02 | Phase ? | Pending |
| MODAL-03 | Phase ? | Pending |

**Coverage:**
- v8.0 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10 (a mapper par le roadmapper)

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after initial definition*
