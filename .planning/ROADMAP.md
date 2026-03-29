# Roadmap: Möbel Unique

## Milestones

- ✅ **v7.0 Header + Hero + Comment ca marche** - Phases 1-3 (shipped 2026-03-27)
- 🚧 **v8.0 Catalogue Produits** - Phases 4-6 (in progress)

## Phases

<details>
<summary>✅ v7.0 Header + Hero + Comment ca marche (Phases 1-3) - SHIPPED 2026-03-27</summary>

### Phase 1: Fondation + Header
**Goal**: La fondation CSS est en place et le header sticky est visible et fonctionnel sur toute la page
**Depends on**: Nothing (first phase)
**Requirements**: FOND-01, FOND-02, FOND-03, FOND-04, HEAD-01, HEAD-02, HEAD-03, HEAD-04
**Success Criteria** (what must be TRUE):
  1. La page publique s'affiche sans le template Next.js par défaut, avec le bon titre SEO dans l'onglet
  2. Le header est sticky en haut de la page, affiche le logo MU et un lien retour Shopify
  3. Au scroll de 80px, le header passe de transparent à blanc avec une ombre visible (300ms)
  4. Le skip link "Aller au contenu" est invisible au repos et visible au focus clavier
  5. Les breakpoints responsive (640/1024/1280px) et scroll-padding-top sont actifs dans globals.css
**Plans**: 1 plan
Plans:
- [x] 01-01-PLAN.md — Fondation CSS (globals.css + layout.tsx + page.module.css) + Header sticky avec scroll et glassmorphism
**UI hint**: yes

### Phase 2: Hero plein écran
**Goal**: Le hero occupe tout l'écran et communique la proposition de valeur avec une animation d'entrée
**Depends on**: Phase 1
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04
**Success Criteria** (what must be TRUE):
  1. Le hero occupe exactement 100% de la hauteur de la fenêtre (100svh) avec l'image de fond et son overlay sombre
  2. Le badge "Visualisation par IA", le H1, le sous-titre et le bouton CTA sont visibles et centrés dans le hero
  3. Les éléments du hero apparaissent avec un fade-in au chargement de la page
  4. Un indicateur de scroll animé est visible en bas du hero et invite à continuer
**Plans**: 1 plan
Plans:
- [x] 02-01-PLAN.md — Hero complet (Hero.tsx + Hero.module.css + integration page.tsx) avec fade-in Framer Motion et indicateur scroll
**UI hint**: yes

### Phase 3: HowItWorks + assemblage
**Goal**: La page publique est complète avec la section HowItWorks et le template Next.js entièrement remplacé
**Depends on**: Phase 2
**Requirements**: STEP-01, STEP-02, STEP-03
**Success Criteria** (what must be TRUE):
  1. 3 cartes étapes (choisir, personnaliser, visualiser) avec icônes sont visibles sur fond #F8F4EE
  2. Sur mobile les cartes s'affichent en colonne unique, sur desktop en grille 3 colonnes
  3. Les cartes apparaissent avec une animation au scroll via IntersectionObserver (stagger 100ms)
**Plans**: 1 plan
Plans:
- [x] 03-01-PLAN.md — Composant HowItWorks (3 cartes, CSS Grid responsive, animation useInView stagger 100ms) + integration page.tsx
**UI hint**: yes

</details>

### 🚧 v8.0 Catalogue Produits (In Progress)

**Milestone Goal:** Afficher les canapés depuis l'API avec un catalogue scalable, recherche par nom et modal configurateur placeholder.

#### Phase 4: Prerequis + Catalogue core
**Goal**: Les canapés réels depuis Supabase sont visibles en grille responsive sur la page publique
**Depends on**: Phase 3
**Requirements**: TECH-01, CAT-01, CAT-02, CAT-03
**Success Criteria** (what must be TRUE):
  1. Les images Supabase Storage s'affichent sans erreur via next/image (remotePatterns configuré dans next.config.ts)
  2. L'utilisateur voit les canapés disponibles sous forme de cards avec image, nom et prix formaté en euros
  3. Les cards s'affichent en 1 colonne sur mobile, 2 colonnes sur tablette, 3 colonnes sur desktop
  4. Un skeleton loading s'affiche pendant le chargement initial, puis laisse place aux vraies cards
**Plans**: 2 plans
Plans:
- [x] 04-01-PLAN.md — Config remotePatterns Supabase + composants ProductCard et ProductCardSkeleton
- [x] 04-02-PLAN.md — CatalogueSection (Server) + CatalogueClient + integration page.tsx avec Suspense
**UI hint**: yes

#### Phase 5: Recherche et états interactifs
**Goal**: L'utilisateur peut filtrer le catalogue par nom et voit un retour immédiat sur les résultats
**Depends on**: Phase 4
**Requirements**: SRCH-01, SRCH-02, CAT-04
**Success Criteria** (what must be TRUE):
  1. L'utilisateur peut saisir un nom dans la barre de recherche et les cards se filtrent instantanément
  2. La recherche fonctionne avec ou sans accents (ex: "canapé" et "canape" donnent le même résultat)
  3. Un message "Aucun résultat pour..." s'affiche quand la recherche ne correspond à aucun produit
  4. Le nombre de canapés affichés est visible (ex: "3 canapés") et se met à jour avec le filtre actif
**Plans**: 2 plans
Plans:
- [x] 05-01-PLAN.md — Tests RED (SRCH-01, SRCH-02, CAT-04) : 6 nouveaux cas dans CatalogueClient.test.tsx
- [x] 05-02-PLAN.md — Implementation barre de recherche (CatalogueClient.tsx + CatalogueSection.module.css)
**UI hint**: yes

#### Phase 6: Modal configurateur placeholder
**Goal**: Le CTA de chaque card ouvre un modal large accessible qui annonce le configurateur à venir
**Depends on**: Phase 5
**Requirements**: MODAL-01, MODAL-02, MODAL-03
**Success Criteria** (what must be TRUE):
  1. Cliquer "Configurer ce modèle" ouvre un modal en 90vw sur desktop et plein écran sur mobile
  2. Le modal affiche le nom du canapé sélectionné et un message "Configurateur à venir"
  3. Le modal se ferme avec la touche Escape, un clic sur l'overlay ou le bouton de fermeture
  4. Le focus est piégé dans le modal tant qu'il est ouvert et revient sur le CTA déclencheur à la fermeture
**Plans**: 1 plan
Plans:
- [x] 06-01-PLAN.md — ConfiguratorModal (dialog natif, teaser produit, placeholder) + cablage CatalogueClient
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 4 → 5 → 6

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Fondation + Header | v7.0 | 1/1 | Complete | 2026-03-26 |
| 2. Hero plein écran | v7.0 | 1/1 | Complete | 2026-03-26 |
| 3. HowItWorks + assemblage | v7.0 | 1/1 | Complete | 2026-03-26 |
| 4. Prerequis + Catalogue core | v8.0 | 2/2 | Complete   | 2026-03-28 |
| 5. Recherche et états interactifs | v8.0 | 2/2 | Complete   | 2026-03-29 |
| 6. Modal configurateur placeholder | v8.0 | 1/1 | Complete   | 2026-03-29 |

---
*Roadmap created: 2026-03-26*
*v8.0 phases added: 2026-03-28*
*Milestone: v8.0 — Catalogue Produits*
