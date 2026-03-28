---
phase: 4
slug: prerequis-catalogue-core
status: draft
shadcn_initialized: false
preset: none
created: 2026-03-28
---

# Phase 4 — UI Design Contract

> Contrat visuel et d'interaction pour la section Catalogue Produits.
> Produit par gsd-ui-researcher, verifie par gsd-ui-checker.

---

## Design System

| Propriete | Valeur | Source |
|-----------|--------|--------|
| Tool | none | CLAUDE.md — CSS Modules uniquement, pas de shadcn |
| Preset | non applicable | CLAUDE.md — pas de shadcn |
| Bibliotheque composants | Radix UI (headless, admin uniquement) | CLAUDE.md |
| Bibliotheque icones | lucide-react@1.7.0 | STATE.md decisions heritees v7.0 |
| Police | Montserrat (400, 500, 600, 700) | globals.css |
| Tokens | src/app/globals.css (variables CSS custom) | Detecte en codebase |

Shadcn gate : non applicable. Convention projet interdit shadcn (CLAUDE.md ligne 1 conventions strictes).

---

## Spacing Scale

Tokens existants dans globals.css (source de verite). Multiples de 4 uniquement.

| Token CSS | Valeur rem | Valeur px | Usage dans cette phase |
|-----------|-----------|-----------|------------------------|
| --spacing-xs | 0.25rem | 4px | Gaps inline (label uppercase au-dessus du prix) |
| --spacing-sm | 0.5rem | 8px | Gap entre elements internes de la card |
| --spacing-md | 1rem | 16px | Padding interne card (entre image et corps) |
| --spacing-lg | 1.5rem | 24px | Container padding mobile (--container-padding-mobile) |
| --spacing-xl | 2rem | 32px | Gap entre les cards dans la grille |
| --spacing-2xl | 3rem | 48px | Margin-bottom apres titre H2 de section |
| --spacing-section | 7rem | 112px | Padding vertical de la section (coherent HowItWorks) |

Exceptions :
- Card padding interne : 16px tous cotes (--spacing-md), pas de padding supplementaire — image bord-a-bord en haut
- CTA card : padding vertical 12px (entre --spacing-sm et --spacing-md), pleine largeur
- Touch target minimum sur bouton CTA : 44px de hauteur (accessibilite iOS)

Source : CONTEXT.md D-04 + HowItWorks.module.css patterns etablis.

---

## Typography

Tokens existants dans globals.css. Exactement 4 roles pour cette phase.

| Role | Token CSS | Taille px | Poids | Line-height | Usage dans cette phase |
|------|-----------|-----------|-------|-------------|------------------------|
| Body | --font-size-base | 16px (1rem) | 400 | 1.6 | Description courte sous le nom de la card |
| Label | --font-size-sm | 14px (0.875rem) | 400 | 1.5 | Texte muted description courte (style produit) |
| Heading card | --font-size-xl | 20px (1.25rem) | 700 | 1.2 | Nom produit uppercase sur la card |
| Heading section | --font-size-3xl | 32px (2rem) | 700 | 1.2 | H2 "Nos Canapés" |

Details supplementaires :
- Nom produit : `text-transform: uppercase`, `letter-spacing: -0.01em` (tracking-tight), Montserrat 700
- Prix : --font-size-xl (20px), Montserrat 700, couleur var(--color-primary) — aligne a droite
- Sous-titre section : --font-size-base (16px), poids 400, couleur var(--color-muted)
- Label CTA : --font-size-sm (14px), poids 700, `text-transform: uppercase`, `letter-spacing: 0.15em`
- Skeleton : aucun texte — blocs opaques uniquement

Source : CONTEXT.md D-02 + maquette Stitch (stitch-desktop-hero.html lignes 206-210).

---

## Color

Tokens existants dans globals.css — palette complete deja definie.

| Role | Token CSS / Hex | Usage dans cette phase |
|------|-----------------|------------------------|
| Dominant (60%) | --color-background #FFFFFF | Fond de la section catalogue (D-07), fond placeholder image |
| Secondary (30%) | --surface-container-low #F6F3EF | Fond des cards au repos (D-04) |
| Secondary hover | --surface-container-high #EBE8E4 | Fond des cards au survol (D-04) |
| Accent (10%) | --color-primary #E49400 | Prix + bordure CTA au repos + fond CTA au hover |
| Muted | --color-muted #888888 | Description courte sous le nom (style produit), sous-titre section |
| Text | --color-text #1D1D1B | Nom produit, titre H2 |
| Placeholder | --surface-container #F0EDEA | Fond placeholder image quand aucune image disponible |

Accent reserve pour : prix affiche en primary bold, bordure CTA au repos (opacity 20%), fond CTA au survol (solid primary + texte blanc). PAS utilise pour : fond de section, texte courant, titres.

Pas de couleur destructive dans cette phase (aucune action de suppression).

Tonal layering (D-04) : pas de bordures sur les cards, contraste par couches de fond.

Source : CONTEXT.md D-04, D-07 + globals.css.

---

## Composant Inventory

Nouveaux composants a creer dans `src/components/public/Catalogue/` :

| Composant | Type | Fichiers |
|-----------|------|---------|
| CatalogueSection | Server Component | CatalogueSection.tsx + CatalogueSection.module.css |
| CatalogueClient | Client Component | CatalogueClient.tsx + CatalogueClient.module.css |
| ProductCard | Presentationnel | ProductCard.tsx + ProductCard.module.css |
| ProductCardSkeleton | Presentationnel | ProductCardSkeleton.tsx + ProductCardSkeleton.module.css |

---

## Specifications Composants

### Section Catalogue

- `id="catalogue"` obligatoire pour que le CTA Hero (#catalogue) fonctionne
- Fond : var(--color-background) #FFFFFF — alternance visuelle avec HowItWorks beige
- Padding : var(--spacing-section) vertical (112px) + var(--container-padding-mobile) lateral (24px) sur mobile
- Container max-width : var(--container-max) 1280px, centre
- Titre H2 : "Nos Canapés" — Montserrat 700, 32px, #1D1D1B
- Sous-titre (discretion Claude) : "Selectionnez une base pour commencer la configuration." — Montserrat 400, 16px, --color-muted, max-width 480px
- Margin-bottom apres H2+sous-titre : var(--spacing-2xl) 48px

Source : CONTEXT.md D-06, D-07, D-08 + wireframe Section 4.

### Grille responsive

- Mobile (< 640px) : 1 colonne, gap 24px
- Tablette (640px - 1023px) : 2 colonnes, gap 24px
- Desktop (>= 1024px) : 3 colonnes, gap var(--spacing-xl) 32px

Source : ROADMAP.md Phase 4 critere 3 + REQUIREMENTS.md CAT-02 + wireframe Section 4.

### ProductCard

Comportement de la card (tonal layering, pas de bordures) :

```
[IMAGE bord-a-bord aspect 4/5, overflow hidden]
  └ zoom scale(1.05) a 700ms au hover sur l'image
[CORPS — padding 16px]
  [NOM + DESCRIPTION sur gauche] [PRIX sur droite]
  [CTA pleine largeur]
```

Details implementation :
- Fond repos : var(--surface-container-low) #F6F3EF
- Fond hover : var(--surface-container-high) #EBE8E4 — transition var(--transition-fast) 300ms
- Border-radius : 0px — design editorial bord-a-bord (D-02)
- Overflow : hidden (pour clip de l'image en aspect ratio)
- Cursor : pointer

Image produit :
- Aspect ratio : 4/5 (portrait)
- Object-fit : cover
- Zoom au hover : transform scale(1.05), transition 700ms ease (D-05)
- Priorite : view_type === '3/4', fallback sort_order le plus bas (D-09)
- Placeholder si aucune image : fond --surface-container #F0EDEA, icone Lucide `Sofa` centree, taille 48px, couleur --color-muted (D-10, discretion Claude : 48px pour visibilite sans dominer)

Nom produit :
- Montserrat 700, 20px, uppercase, letter-spacing -0.01em
- Couleur : var(--color-text) #1D1D1B

Description courte :
- Montserrat 400, 14px, couleur var(--color-muted) #888888
- Texte maxi 1 ligne, text-overflow ellipsis si debordement

Prix :
- Format : "à partir de 1 290 €" (discretion Claude — "a partir de" car prix de base sans tissu premium)
- Formatage JS : `new Intl.NumberFormat('fr-FR').format(price) + ' €'` avec prefixe "a partir de "
- Montserrat 700, 20px, couleur var(--color-primary) #E49400
- Aligne a droite (flex row justify-between avec nom/description)

CTA card :
- Label : "Configurer ce modele" (D-03)
- Pleine largeur, margin-top var(--spacing-md) 16px
- Fond : transparent, bordure 1px solid rgba(228, 148, 0, 0.2) au repos
- Hover : fond var(--color-primary), texte #FFFFFF, transition var(--transition-fast) 300ms
- Hauteur minimum : 44px (touch target)
- Typographie : Montserrat 700, 14px, uppercase, letter-spacing 0.15em
- Clic : declenche ouverture modal Phase 6 (prop callback, non implémenté en Phase 4 — bouton presente mais no-op)

Source : CONTEXT.md D-02, D-03, D-04, D-05, D-09, D-10 + maquette Stitch lignes 204-212.

### ProductCardSkeleton

Memes dimensions que ProductCard. Shimmer CSS uniquement, aucun texte.

Structure :
- Zone image aspect 4/5 : fond --surface-container-high, animation shimmer
- Bande nom : 60% de largeur, hauteur 20px, fond --surface-container-high, radius 4px
- Bande description : 80% de largeur, hauteur 14px, fond --surface-container-high, radius 4px
- Bande prix : 40% de largeur, hauteur 20px, fond --surface-container-high, radius 4px, aligne a droite
- Bande CTA : pleine largeur, hauteur 44px, fond --surface-container-high, radius 0

Animation shimmer :
- Background gradient : linear-gradient(90deg, #F0EDEA 0%, #E5E2DE 50%, #F0EDEA 100%)
- Background-size : 200% 100%
- Animation : shimmer 1.5s ease-in-out infinite
- Keyframes : translateX de -100% a +100% via background-position

Nombre de skeletons : 3 (desktop), 2 (tablette), 1 (mobile) — correspond aux colonnes de la grille.

Source : REQUIREMENTS.md CAT-03 + CONTEXT.md D-13 + discretion Claude (dimensions).

---

## Copywriting Contract

| Element | Copie | Source |
|---------|-------|--------|
| Titre section | "Nos Canapés" | CONTEXT.md D-06 |
| Sous-titre section | "Selectionnez une base pour commencer la configuration." | Maquette Stitch ligne 194 + discretion Claude |
| CTA card (repos) | "Configurer ce modele" | CONTEXT.md D-03 |
| Format prix | "a partir de 1 290 €" | Discretion Claude — prefixe contextuel sans tissu |
| Etat vide (aucun produit actif) | "Nos canapés arrivent bientôt." | CONTEXT.md D-11 |
| Etat vide detail | Texte seul, centre, couleur muted, aucune icone | CONTEXT.md D-11 |
| Erreur chargement API | "Impossible de charger les produits. Veuillez rafraichir la page." | Discretion Claude (standard pattern projet) |
| Placeholder image | (aucun texte — icone seule) | CONTEXT.md D-10 |

Pas d'actions destructives dans cette phase.

---

## Etats a Implementer

| Etat | Composant | Comportement |
|------|-----------|-------------|
| Chargement | CatalogueSection | Affiche N skeletons pendant le fetch Server Component (Suspense) |
| Succes avec produits | CatalogueClient | Affiche la grille de ProductCards |
| Succes vide | CatalogueClient | Affiche "Nos canapés arrivent bientôt." centre, aucune card |
| Erreur fetch | CatalogueSection | Affiche message erreur dans un paragraphe centre muted |
| Hover card | ProductCard | Fond surface-container-high + zoom image 1.05 |
| Placeholder image | ProductCard | Fond --surface-container + icone Sofa 48px muted |

Source : ROADMAP.md Phase 4 criteres 1-4 + REQUIREMENTS.md CAT-01 a CAT-03.

---

## Accessibilite

- Image produit : `alt` = nom du modele (ex: "Canapé Milano")
- Image placeholder : `aria-hidden="true"` sur l'icone Sofa (decoratif)
- CTA card : `type="button"`, `aria-label` = "Configurer le modele {nom}"
- Skeleton : `aria-busy="true"` sur le container grille pendant chargement, `aria-label="Chargement du catalogue"`
- Section : `id="catalogue"` + `aria-labelledby` pointant vers le H2

---

## Configuration Technique (Phase 4 prerequis)

`next.config.ts` — remotePatterns a ajouter :

```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
  ],
},
```

C'est le prerequis bloquant D-01 a traiter en premier.

Source : CONTEXT.md D-01, STATE.md blockers.

---

## Responsive Breakpoints

Coherent avec les breakpoints etablis en Phase 1 (FOND-03) :

| Breakpoint | Largeur | Grille catalogue | Padding lateral section |
|------------|---------|------------------|------------------------|
| Mobile | < 640px | 1 colonne | 24px (--container-padding-mobile) |
| Tablet | 640px - 1023px | 2 colonnes | 24px |
| Desktop | 1024px - 1279px | 3 colonnes | 48px (--container-padding-desktop) |
| Large | >= 1280px | 3 colonnes | 64px (--container-padding-large) |

---

## Registry Safety

| Registre | Blocs utilises | Safety Gate |
|----------|----------------|-------------|
| shadcn officiel | aucun | non applicable — pas de shadcn dans ce projet |
| Tiers | aucun | non applicable |

Aucun registre tiers. CSS Modules uniquement. Convention projet.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting : PASS
- [ ] Dimension 2 Visuals : PASS
- [ ] Dimension 3 Color : PASS
- [ ] Dimension 4 Typography : PASS
- [ ] Dimension 5 Spacing : PASS
- [ ] Dimension 6 Registry Safety : PASS

**Approbation :** en attente

---

*Phase : 04-prerequis-catalogue-core*
*UI-SPEC cree : 2026-03-28*
*Checker : non execute*
