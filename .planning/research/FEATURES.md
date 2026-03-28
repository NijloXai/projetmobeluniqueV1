# Feature Research — M008 Catalogue Produits

**Domain:** Catalogue e-commerce luxe canapés personnalisables — SPA Next.js
**Milestone:** M008 — Section Catalogue avec cards, recherche, tri, swatches, modal configurateur
**Researched:** 2026-03-28
**Confidence:** HIGH (wireframe v4 + charte graphique + API schema déjà définis)

---

## Context

Backend complet (M001–M006). Frontend v7.0 livré : Header, Hero, HowItWorks opérationnels.
L'API publique `GET /api/models` retourne les modèles actifs avec leurs images triés par
`created_at DESC`. Le schéma de données est fixé : `models` (name, price, slug, dimensions,
description, created_at) + `model_images` (image_url, view_type, sort_order).

Les tissus (`fabrics`) sont séparés — ils ne font pas partie de la réponse de `/api/models`.
L'API `GET /api/models` ne jointure pas les tissus disponibles.

Stack contrainte : CSS Modules uniquement, Montserrat, tokens globals.css, breakpoints
640/1024/1280px.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features attendues par tout visiteur d'un catalogue produits luxe. Leur absence rend le
produit incomplet ou peu professionnel.

| Feature | Pourquoi attendu | Complexité | Notes |
|---------|-----------------|------------|-------|
| Cards produit avec image, nom, prix | Base absolue de tout catalogue — sans ça, pas de catalogue | FAIBLE | Image via `model_images[0]` (sort_order 0), prix formaté "à partir de X EUR" |
| Grid responsive 1/2/3 colonnes | Standard universel — mobile 1 col, tablet 2, desktop 3 | FAIBLE | CSS Grid, breakpoints déjà définis (640/1024px) |
| Image placeholder si aucune photo | Un modèle sans image ne doit pas casser le layout | FAIBLE | Zone fond neutre 220px avec icône canapé SVG |
| CTA "Configurer ce modèle" sur chaque card | Action principale du produit — raison d'être du catalogue | FAIBLE | Bouton primary pleine largeur, ouvre le modal |
| État de chargement (skeleton / spinner) | L'API est async — afficher quelque chose pendant le fetch | MOYEN | Skeleton cards préférable au spinner — évite le layout shift |
| État d'erreur si l'API échoue | Robustesse minimale — ne pas afficher une page blanche | FAIBLE | Message français, lien pour réessayer |
| État vide si aucun produit actif | Cas réel possible — pas un 500, juste un catalogue vide | FAIBLE | Message "Aucun modèle disponible pour le moment" |
| Titre de section H2 + sous-titre | Structure hiérarchique, scannabilité | FAIBLE | "Collection Signature", texte muted |
| Fond alterné pour séparer du HowItWorks | Tonal layering — règle "No-Line" de la charte | FAIBLE | `--color-background` (#FFFFFF) après `--color-background-alt` du HowItWorks |

### Differentiators (Competitive Advantage)

Features qui élèvent l'expérience au-dessus d'un catalogue standard.

| Feature | Valeur ajoutée | Complexité | Notes |
|---------|---------------|------------|-------|
| Swatches miniatures en aperçu sur la card | Montre la variété tissu sans ouvrir le configurateur — décision d'achat plus rapide | MOYEN | Cercles 22px issus de `fabrics.swatch_url`. Nécessite un second fetch `/api/fabrics` (public) ou stocker les swatches côté client |
| Badge "+N tissus" sur la card | Communique la personnalisation disponible en un chiffre | FAIBLE | Overflow après 4-5 swatches visibles, ex: "+3" |
| Barre de recherche filtre par nom | Scalabilité — essentiel dès 20+ produits, inutile à 3 | FAIBLE | Filtrage client-side sur le tableau en mémoire — pas de requête API supplémentaire |
| Tri prix croissant / décroissant / nouveautés | Contrôle utilisateur attendu en e-commerce, différenciateur vs catalogue statique | FAIBLE | Tri client-side sur le tableau. "Nouveautés" = tri par `created_at DESC` (déjà le défaut API) |
| Compteur de résultats ("X modèles") | Feedback immédiat lors du filtrage/tri | FAIBLE | "3 modèles disponibles" ou "2 résultats pour 'Milano'" |
| Hover state card avec élévation subtile | Feeling de qualité, réactivité de l'interface | FAIBLE | `box-shadow` ou `transform: translateY(-2px)` en 400ms — conforme à la charte |
| Modal large configurateur (90vw desktop) | Expérience immersive sans navigation — garde le contexte de la page | MOYEN | `position: fixed`, overlay, trap focus, `Escape` pour fermer |
| Animation d'entrée du modal | Sentiment de qualité — luxe = délibéré | FAIBLE | `opacity 0→1` + `translateY(20px→0)` en 400ms ease-in-out |
| Scroll vers la section catalogue au clic CTA hero | Lien entre Hero CTA "Découvrir nos canapés" et la section | FAIBLE | `scrollIntoView` ou `href="#catalogue"` avec `scroll-behavior: smooth` |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Pourquoi demandé | Pourquoi problématique | Alternative |
|---------|-----------------|----------------------|-------------|
| Pagination / infinite scroll | "Scalabilité pour 100+ produits" | Inutile pour 20-30 produits max. Complexité accidentelle, cassé par le filtrage client-side | Grid responsive + search bar — suffisant pour l'échelle prévue |
| Filtres multi-critères (catégorie, places, style) | "Filtrage avancé" | Les données n'exposent pas ces attributs (pas de champ `category` sur `models`). Fausse promesse si données absentes | Recherche par nom + tri prix — couvre 90% des besoins réels |
| Carousel horizontal de cards | "Mode galerie alternatif" | Accessibilité difficile (ARIA live regions, focus management), performances impactées, cache les produits, UX prouvément inférieure au grid | Grid vertical scrollable — plus de découverte |
| Tri "Meilleures ventes" | "Pertinence commerciale" | Pas de données de ventes dans le schéma actuel (pas de champ `sales_count` ou équivalent) | Tri "Nouveautés" qui est sémantiquement honnête |
| Wishlist / favoris | "Engagement utilisateur" | Nécessite auth utilisateur — hors scope total du projet (pas d'auth front prévue) | CTA Shopify direct — l'achat est l'engagement |
| Comparateur produits | "Feature e-commerce avancée" | Complexité élevée, données insuffisantes pour comparer (pas de specs structurées), hors scope | Swatches préview sur card — suffisant pour la décision |
| Lazy loading image avec effet blur-up | "Performance perçue" | Next.js `<Image>` gère déjà le lazy loading natif. Surengineering. | `next/image` avec `placeholder="blur"` si blur dataURL disponible, sinon `loading="lazy"` natif |
| Filtrage côté serveur / API | "Scalabilité backend" | À 20-30 produits, un fetch unique + tri/filtre client-side est plus rapide (pas de round-trip). Complexité inutile. | Fetch unique au montage, filtre/tri en mémoire |
| Swatches animés (rotation tissu, preview texture) | "Expérience premium" | Dépend de données visuelles non encore structurées (pas de génération IA tissu-sur-card prévue). Hors scope M008. | Swatches statiques 22px issus de `swatch_url` — honête et rapide |

---

## Feature Dependencies

```
GET /api/models (existant, opérationnel)
  └──fournit──> Cards produit (name, price, model_images)
      └──requiert──> Image placeholder si model_images vide
      └──requiert──> Formatage prix français ("à partir de X EUR")

Cards produit
  └──requiert──> État chargement (skeleton)
  └──requiert──> État erreur API
  └──requiert──> État vide (0 résultats)

Recherche par nom
  └──requiert──> Données chargées en mémoire (après fetch API)
  └──dépend de──> useState filtre texte

Tri (prix asc/desc, nouveautés)
  └──requiert──> Données chargées en mémoire
  └──dépend de──> useState option tri
  └──conflit avec──> Filtrage serveur (les deux s'excluent — choisir l'un ou l'autre)

Swatches miniatures sur card
  └──requiert──> GET /api/fabrics (API publique — À CRÉER ou vérifier existence)
  └──OU requiert──> Stocker swatches dans données statiques (alternative sans API)
  └──dépend de──> fabric.swatch_url (bucket fabric-swatches)

Compteur résultats
  └──requiert──> Recherche OU Tri (n'a de sens qu'avec un état filtré)

Modal configurateur
  └──requiert──> Cards produit (le CTA déclenche l'ouverture)
  └──requiert──> Focus trap (accessibilité — Escape, Tab cycle)
  └──requiert──> Overlay sombre (position fixed, z-index > header 100)
  └──enhances──> Swatches (le configurateur est la destination des swatches)

CTA Hero "Découvrir nos canapés"
  └──enhances──> Section catalogue (scroll anchor #catalogue)
  └──requiert──> id="catalogue" sur la section (ou ref pour scrollIntoView)
```

### Dependency Notes

- **Swatches miniatures requiert GET /api/fabrics :** Vérifier si cette route publique existe déjà. Les routes admin (`/api/admin/fabrics`) existent, mais une route publique `GET /api/fabrics` n'est pas confirmée dans le PROJECT.md. Si absente, deux options : créer la route publique (scope M008), ou afficher les swatches en v9.0 uniquement.
- **Modal requiert focus trap :** Sans piège de focus, le modal est inaccessible au clavier — WCAG 2.1 AA l'exige. Utiliser une implémentation manuelle légère (pas de librairie externe).
- **Tri "Nouveautés" est le comportement par défaut de l'API :** `created_at DESC` est déjà le tri natif. L'option "Nouveautés" dans le select est donc un no-op réinitialisant le filtre.

---

## MVP Definition

### Launch With — M008

Minimum viable pour valider le catalogue et déclencher le workflow configurateur.

- [x] **Cards produit** reliées à `GET /api/models` — images, noms, prix, CTA "Configurer"
- [x] **Grid responsive** 1 col mobile / 2 col tablet / 3 col desktop
- [x] **États** : chargement skeleton, erreur API, catalogue vide
- [x] **Barre de recherche** filtrage client-side par nom (useState)
- [x] **Tri** prix croissant, prix décroissant, nouveautés (useState)
- [x] **Modal configurateur** placeholder "Configurateur à venir — v9.0" (90vw desktop, plein écran mobile)
- [x] **Focus trap** dans le modal + fermeture Escape + clic overlay

### Add After Validation — v8.x

Features à ajouter une fois le catalogue core validé.

- [ ] **Swatches miniatures** sur cards — attend confirmation de l'existence ou création de `GET /api/fabrics`
- [ ] **Compteur résultats** — "X modèles" / "X résultats pour 'Milano'"
- [ ] **Scroll anchor** du CTA hero vers #catalogue (si pas déjà dans Hero.tsx)

### Future Consideration — v9.0+

Features à différer — dépendent de milestones ultérieurs.

- [ ] **Contenu réel du modal** (sélection tissu, swatches 52px, zoom texture) — M009
- [ ] **Swatches dans le modal** reliées à l'API fabrics — M009
- [ ] **Animation entrée/sortie modal** raffinée — M011 polish
- [ ] **Bandeau sticky mobile** (swatch + prix + CTA) — M009/M010

---

## Feature Prioritization Matrix

| Feature | Valeur Utilisateur | Coût Implémentation | Priorité |
|---------|-------------------|---------------------|----------|
| Cards produit + API | HAUTE | FAIBLE | P1 |
| Grid responsive | HAUTE | FAIBLE | P1 |
| États chargement/erreur/vide | HAUTE | FAIBLE | P1 |
| CTA → modal placeholder | HAUTE | MOYEN | P1 |
| Recherche par nom | MOYENNE | FAIBLE | P1 |
| Tri prix/nouveautés | MOYENNE | FAIBLE | P1 |
| Focus trap modal | HAUTE | FAIBLE | P1 |
| Swatches miniatures card | MOYENNE | MOYEN | P2 |
| Compteur résultats | FAIBLE | FAIBLE | P2 |
| Scroll anchor hero CTA | FAIBLE | FAIBLE | P2 |
| Hover state card élévation | FAIBLE | FAIBLE | P2 |
| Animations modal entrée | FAIBLE | FAIBLE | P3 |

**Clé priorités :**
- P1 : Indispensable pour livrer M008
- P2 : Souhaitable, ajouter quand P1 validé
- P3 : Nice-to-have, M011 polish

---

## Competitor Feature Analysis

| Feature | Roche Bobois | Ligne Roset | Notre Approche |
|---------|--------------|-------------|----------------|
| Grid produits | 3 colonnes desktop, grille uniforme | 3 colonnes, cards avec hover zoom | 3 colonnes desktop, tonal layering, hover élévation (pas zoom) |
| Filtrage | Filtres par type/style/couleur sidebar | Filtres par collection | Search bar simple + tri — adapté à ~20 produits |
| Prix affiché | "À partir de X EUR" | Prix fixe ou "À partir de" | "À partir de X EUR" (prix de base, sans premium tissu) |
| Images cards | Photo lifestyle 3/4 | Photo produit fond blanc | Photo `model_images[0]` — depends du contenu admin |
| CTA card | "Découvrir" → page produit | "Configurer" → configurateur inline | "Configurer ce modèle" → modal 90vw |
| Swatches preview | Non (navigation vers page tissu) | Oui, miniatures sur hover | Oui, swatches statiques 22px visibles directement |
| Recherche | Oui (search global) | Non | Oui, limitée au nom de modèle |

---

## Considérations Techniques Clés

### API: Swatches sur les cards

L'API `GET /api/models` ne retourne pas les tissus disponibles. Deux approches :

**Option A — Fetch GET /api/fabrics (recommandé)** : Créer ou vérifier l'existence d'une route
publique `/api/fabrics` retournant les tissus actifs (`is_active = true`). Fetch parallèle avec
`/api/models` au montage. Afficher les N premiers swatches (max 4) + badge "+X".

**Option B — Swatches statiques** : Si la route n'existe pas et que la créer dépasse le scope
M008, afficher un placeholder "voir les tissus" sans swatches concrets. Peu satisfaisant pour l'UX.

Recommandation : Vérifier d'abord si `/api/fabrics` existe. Si non, la créer en début de M008
(~30min, pattern identique à `/api/models`).

### Modal: z-index et overlay

Le header est à `z-index: 100`. Le modal doit être à `z-index: 200+` pour passer par-dessus.
L'overlay doit couvrir le header également — `position: fixed`, `inset: 0`.

### Skeleton Cards

Utiliser des divs CSS avec animation `@keyframes shimmer` (background gradient animé) plutôt qu'un
spinner global. Évite le layout shift — la grille garde ses dimensions pendant le chargement.

### Prix formaté

Afficher `"À partir de {price} €"` formaté avec `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`.
Le prix de base n'inclut pas le surcoût tissu premium (+80€ fixe) — correct pour l'affichage catalogue.

### Filtre + Tri : composition

```typescript
// Ordre d'application : filtre d'abord, tri ensuite
const filtered = models.filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
const sorted = [...filtered].sort(sortFn)
```

Le tri "Nouveautés" = `created_at DESC` (ordre naturel de l'API). Réinitialiser le tri vers
"Nouveautés" revient à ne pas trier (conserver l'ordre du fetch).

---

## Accessibilité Catalogue

| Élément | Exigence | Mise en œuvre |
|---------|----------|---------------|
| Section | `<section aria-labelledby="catalogue-title">` | H2 `id="catalogue-title"` |
| Cards | `role="article"` ou `<article>` sémantique | Chaque card est une unité de contenu |
| Bouton CTA card | Texte descriptif : "Configurer le modèle Milano" (pas "Configurer") | `aria-label` dynamique avec le nom du modèle |
| Image produit | `alt="Canapé Milano — vue de face"` | Formaté depuis `view_type` et `name` |
| Image placeholder | `alt=""` + `aria-hidden="true"` (décoratif) | Pas de sens pour les AT |
| Barre recherche | `<label>` explicite ou `aria-label` | "Rechercher un modèle" |
| Tri select | `<label for="sort-select">Trier par</label>` | Label visible, pas placeholder |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | Trap focus, Escape ferme |
| Overlay modal | `aria-hidden="true"` (l'overlay lui-même) | Pas de contenu pour AT |
| Skeleton | `aria-busy="true"` sur le container | Indique le chargement aux AT |

---

## Sources

- Wireframe v4 `.planning/maquette/wireframe-page-unique.md` — autorité absolue (HIGH confidence)
- `CHARTE-GRAPHIQUE.md` — autorité absolue pour le design (HIGH confidence)
- Schema database `src/types/database.ts` — source de vérité pour les données disponibles (HIGH confidence)
- API publique `src/app/api/models/route.ts` — contrat API confirmé (HIGH confidence)
- PROJECT.md — requirements M008 validés (HIGH confidence)
- NN/g: E-Commerce UX patterns — product listing pages (MEDIUM confidence)
- Roche Bobois / Ligne Roset — analyse concurrentielle directe (MEDIUM confidence)
- WCAG 2.1 AA — dialog pattern, focus management (HIGH confidence)

---

*Feature research pour : Catalogue produits Möbel Unique — M008*
*Researched: 2026-03-28*
