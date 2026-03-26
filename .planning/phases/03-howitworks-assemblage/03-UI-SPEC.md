---
phase: 3
slug: howitworks-assemblage
status: draft
shadcn_initialized: false
preset: none
created: 2026-03-26
---

# Phase 3 — UI Design Contract : HowItWorks + assemblage

> Contrat visuel et d'interaction pour la section "Comment ca marche" et l'assemblage final de page.tsx.
> Généré par gsd-ui-researcher, vérifié par gsd-ui-checker.

---

## Design System

| Propriété | Valeur | Source |
|-----------|--------|--------|
| Tool | none — CSS Modules uniquement | CLAUDE.md (convention stricte) |
| Preset | non applicable | Convention projet — pas de shadcn |
| Component library | Radix UI (headless) — non utilisé dans cette phase | CLAUDE.md |
| Icon library | lucide-react@1.7.0 | D-08 (CONTEXT.md) |
| Font | Montserrat (400, 500, 600, 700) — Google Fonts | CHARTE-GRAPHIQUE.md |

> Pas de `components.json` dans ce projet. Pas de shadcn. Pile validée : Next.js 16.2.1 App Router + CSS Modules.

---

## Spacing Scale

Échelle 8-point issue de `src/app/globals.css` (`:root` tokens). Tous les multiples de 4.

| Token CSS | Valeur px | Valeur rem | Usage dans cette phase |
|-----------|-----------|------------|------------------------|
| `--spacing-xs` | 4px | 0.25rem | Espace entre numéro et icône |
| `--spacing-sm` | 8px | 0.5rem | Gap icône → titre dans la card |
| `--spacing-md` | 16px | 1rem | Espacement interne standard, margin titre → description |
| `--spacing-lg` | 24px | 1.5rem | Padding latéral section (mobile) |
| `--spacing-xl` | 32px | 2rem | Gap entre cards (grille) |
| `--spacing-2xl` | 48px | 3rem | Padding interne de chaque card |
| `--spacing-section` | 112px | 7rem | Padding vertical de la section (haut et bas) |

Exceptions : aucune. Touch targets non applicables (section purement informative, pas interactive hormis le hover).

Source : `src/app/globals.css` — tokens confirmés.

---

## Typography

Police unique : Montserrat pour tous les éléments. Définie dans `layout.tsx` et `globals.css`.

| Rôle | Token CSS | Taille px | Poids | Line-height | Usage dans cette phase |
|------|-----------|-----------|-------|-------------|------------------------|
| Numéro étape | `--font-size-xs` / label | 12px | 700 | 1.0 | Numéro "01", "02", "03" au-dessus de l'icône |
| Corps / description card | `--font-size-base` | 16px | 400 | 1.6 | Description de chaque étape |
| Sous-titre section | `--font-size-lg` | 18px | 400 | 1.6 | Texte muted sous le H2 |
| Titre card H3 | `--font-size-2xl` | 24px | 600 | 1.2 | Titre de chaque étape |
| Titre section H2 | `--font-size-3xl` | 32px | 700 | 1.2 | "Comment ça marche" |

> 4 tailles déclarées (12, 16, 18, 24, 32 — 5 niveaux justifiés par la hiérarchie section + card).
> Letter-spacing numéros : `0.1em` (style label ALL-CAPS conforme CHARTE-GRAPHIQUE).
> Jamais `#000000` — toujours `var(--color-text)` (#1D1D1B).

Source : CHARTE-GRAPHIQUE.md + globals.css (tokens vérifiés).

---

## Color

### Répartition 60/30/10

| Rôle | Hex | Token CSS | Usage |
|------|-----|-----------|-------|
| Dominant (60%) | `#F8F4EE` | `--color-background-alt` | Fond de la section HowItWorks |
| Secondaire (30%) | `#FFFFFF` | `--surface-container-lowest` | Cards blanches sur fond beige |
| Accent (10%) | `#E49400` | `--color-primary` | Numéros "01", "02", "03" uniquement |

Accent réservé exclusivement à : les numéros d'étapes (1, 2, 3) en haut de chaque card.
L'accent n'est PAS utilisé sur les icônes, les titres, les descriptions, ni les bordures.

Couleur de texte principal : `--color-text` (#1D1D1B) pour titres H3 et descriptions.
Couleur muted : `--color-muted` (#888888) pour le sous-titre de section.

Couleur destructive : non applicable — cette phase ne contient aucune action destructive.

Source : D-05, D-07 (CONTEXT.md) + CHARTE-GRAPHIQUE.md.

---

## Component Inventory

### Composant principal : `HowItWorks`

| Fichier | Chemin | Type |
|---------|--------|------|
| `HowItWorks.tsx` | `src/components/public/HowItWorks/HowItWorks.tsx` | `'use client'` (hooks motion) |
| `HowItWorks.module.css` | `src/components/public/HowItWorks/HowItWorks.module.css` | CSS Modules |
| Test | `src/components/public/HowItWorks/__tests__/HowItWorks.test.tsx` | Vitest |

Intégration dans `src/app/page.tsx` : remplacer `{/* Phase 3 : <HowItWorks /> */}` par `<HowItWorks />`.

### Structure DOM attendue

```
<section.section> [id="comment-ca-marche"]
  <div.container>
    <div.header>
      <h2.sectionTitle>Comment ça marche</h2>
      <p.sectionSubtitle>En quelques clics, ...</p>
    </div>
    <div.grid>
      <motion.div.card> × 3
        <span.number>0{1|2|3}</span>
        <{Icon} aria-hidden="true" />
        <h3.cardTitle>{titre étape}</h3>
        <p.cardDescription>{description étape}</p>
      </motion.div.card>
    </div>
  </div>
</section>
```

### Icônes Lucide React (D-09 — choix Claude)

| Étape | Icône | Justification |
|-------|-------|---------------|
| Choisissez votre modèle | `Sofa` | Représente directement le canapé — sans ambiguïté |
| Personnalisez avec votre tissu | `Palette` | Personnalisation couleur/matière — cohérent avec le choix tissu |
| Visualisez chez vous | `Home` | Visualisation dans l'espace salon — intention claire |

Taille : `size={32}` — lisible sans écraser le texte.
Trait : `strokeWidth={1.5}` — style outline premium, cohérent avec "Curated Atelier".
Couleur : `var(--color-text)` (#1D1D1B) via CSS `color: var(--color-text)` sur le conteneur icône.
Accessibilité : `aria-hidden="true"` sur chaque icône (décoratives — le titre H3 porte le sens).

Source : D-08, D-09 (CONTEXT.md) + RESEARCH.md (icônes confirmées disponibles dans lucide-react v1.7.0).

---

## Copywriting Contract

### Textes section

| Élément | Copie exacte |
|---------|-------------|
| Titre H2 | `Comment ça marche` |
| Sous-titre section (muted) | `En quelques clics, choisissez votre modèle, personnalisez le tissu et visualisez le résultat dans votre salon avant de commander.` |

Source titre : D-01 (CONTEXT.md — décision verrouillée).
Source sous-titre : D-02 (CONTEXT.md — rédaction Claude).

### Titres et descriptions des étapes

| Numéro | Titre H3 | Description |
|--------|----------|-------------|
| 01 | `Choisissez votre modèle` | `Parcourez notre collection et sélectionnez le modèle qui correspond à votre espace et votre style de vie.` |
| 02 | `Personnalisez avec votre tissu` | `Choisissez parmi nos tissus — couleur, texture, matière — et voyez le résultat instantanément sur votre modèle.` |
| 03 | `Visualisez chez vous` | `Uploadez une photo de votre salon et découvrez votre nouveau canapé exactement là où il sera posé.` |

Source titres : D-03 (CONTEXT.md — décision verrouillée).
Source descriptions : D-04 (CONTEXT.md — rédaction Claude).

### États spéciaux

| Élément | Copie |
|---------|-------|
| État vide | Non applicable — section statique, pas de données dynamiques |
| État d'erreur | Non applicable — aucune API dans cette phase |
| Actions destructives | Aucune — phase purement informative |

---

## Animation Contract

### Paramètres Framer Motion (D-10, D-11, D-12)

| Paramètre | Valeur | Source |
|-----------|--------|--------|
| Hook détection viewport | `useInView(ref, { once: true, margin: '-100px' })` | D-10 (CONTEXT.md) + RESEARCH.md |
| `initial` | `{ opacity: 0, y: 20 }` (ou `y: 0` si `prefersReducedMotion`) | D-12 (CONTEXT.md) |
| `animate` (en vue) | `{ opacity: 1, y: 0 }` | D-12 (CONTEXT.md) |
| `animate` (hors vue) | `{ opacity: 0, y: 20 }` | D-12 (CONTEXT.md) |
| `duration` | `0.4s` (ou `0` si `prefersReducedMotion`) | Cohérent Hero + CHARTE-GRAPHIQUE §9 |
| `delay` par card | `index * 0.1s` (stagger 100ms) | D-11 (CONTEXT.md) |
| `ease` | `'easeInOut'` | CHARTE-GRAPHIQUE §9 |
| Ref attachée à | Conteneur `.grid` (pas aux cards individuelles) | RESEARCH.md anti-pattern |
| `once` | `true` — ne se rejoue pas au re-scroll | D-10 (CONTEXT.md) |

Accessibilité : `useReducedMotion()` de `motion/react` — si `true`, `duration: 0`, `delay: 0`, `y: 0`.

### Hover cards (discrétion Claude)

Hover subtil conforme à la philosophie "luxe = délibéré" :
- `transform: translateY(-4px)` + `box-shadow: var(--shadow-lg)` (0 10px 40px rgba(28,28,26,0.04))
- Transition : `transform var(--transition-smooth), box-shadow var(--transition-smooth)` (400ms ease-in-out)
- Pas de border, pas de changement de fond — tonal layering uniquement

---

## Layout Contract

### Section

```css
background-color: var(--color-background-alt); /* #F8F4EE */
padding: var(--spacing-section) var(--container-padding-mobile); /* 112px 24px mobile */
```

Desktop (>= 1280px) : `padding: var(--spacing-section) var(--container-padding-large)` (112px 64px).

### Conteneur interne

```css
max-width: var(--container-max); /* 1280px */
margin: 0 auto;
```

### En-tête section

```css
text-align: center;
margin-bottom: var(--spacing-2xl); /* 48px avant la grille */
```

Sous-titre : `margin-top: var(--spacing-md)` (16px) sous le H2.

### Grille cards

```css
/* Mobile first */
display: grid;
grid-template-columns: 1fr;        /* 1 colonne mobile */
gap: var(--spacing-xl);            /* 32px entre cards */

/* Tablet/Desktop >= 640px */
@media (min-width: 640px) {
  grid-template-columns: repeat(3, 1fr); /* 3 colonnes fixes */
}
```

Source breakpoint : STEP-02 (REQUIREMENTS.md) + CHARTE-GRAPHIQUE §6.

### Card individuelle

```css
background-color: var(--surface-container-lowest); /* #FFFFFF */
border-radius: var(--radius-lg);    /* 12px — D-06 */
box-shadow: var(--shadow-md);       /* 0 4px 6px rgba(0,0,0,0.07) */
padding: var(--spacing-2xl);        /* 48px — espace galerie */
display: flex;
flex-direction: column;
gap: var(--spacing-sm);             /* 8px entre les éléments internes */
```

Source fond/radius/ombre : D-05, D-06 (CONTEXT.md).
Source padding : discrétion Claude — 48px conforme à "Le luxe, c'est l'espace" (CHARTE-GRAPHIQUE §3).

### Numéro d'étape

```css
font-size: var(--font-size-xs);    /* 12px */
font-weight: 700;
color: var(--color-primary);       /* #E49400 — D-07 */
letter-spacing: 0.1em;
text-transform: uppercase;
margin-bottom: var(--spacing-xs);  /* 4px sous le numéro */
```

Format affiché : `"01"`, `"02"`, `"03"` (deux chiffres, zéro-padded).

### Icône

```css
/* Conteneur icône */
color: var(--color-text);          /* #1D1D1B — icône hérite la couleur */
margin-bottom: var(--spacing-sm);  /* 8px avant le H3 */
```

---

## Responsive Breakpoints

| Breakpoint | Comportement | Token |
|------------|-------------|-------|
| `< 640px` | 1 colonne, padding latéral 24px | `--container-padding-mobile` |
| `>= 640px` | 3 colonnes `repeat(3, 1fr)`, gap 32px | `--spacing-xl` |
| `>= 1024px` | Idem 640px — pas de changement de layout | — |
| `>= 1280px` | Padding latéral 64px | `--container-padding-large` |

---

## Accessibilité

| Élément | Règle |
|---------|-------|
| `<section>` | `id="comment-ca-marche"` pour ancre interne |
| H2 | Première et unique balise H2 de la section |
| H3 | Un par card — structure hiérarchique correcte |
| Icônes | `aria-hidden="true"` (décoratives) |
| Animations | `prefers-reduced-motion` géré via `useReducedMotion()` |
| Hover | Pas d'information critique portée par le hover uniquement |

---

## Registry Safety

| Registre | Blocs utilisés | Safety Gate |
|----------|---------------|-------------|
| shadcn official | aucun | non applicable — shadcn non initialisé |
| lucide-react | `Sofa`, `Palette`, `Home` | npm officiel — pas de registre shadcn tiers |

Pas de registre tiers. Lucide React est un package npm standard, pas un bloc shadcn. Pas de vetting shadcn requis.

---

## Dépendances à installer

| Package | Version | Commande | Statut |
|---------|---------|----------|--------|
| `lucide-react` | `1.7.0` | `npm install lucide-react@1.7.0` | A INSTALLER avant implémentation |
| `motion/react` | `12.38.0` (motion package) | déjà installé | OK |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting : PASS
- [ ] Dimension 2 Visuals : PASS
- [ ] Dimension 3 Color : PASS
- [ ] Dimension 4 Typography : PASS
- [ ] Dimension 5 Spacing : PASS
- [ ] Dimension 6 Registry Safety : PASS

**Approval :** pending

---

*Phase : 03-howitworks-assemblage*
*UI-SPEC créé : 2026-03-26*
*Sources : 03-CONTEXT.md (12 décisions), 03-RESEARCH.md (stack + patterns), CHARTE-GRAPHIQUE.md (tokens), globals.css (variables CSS), Hero.tsx + Hero.module.css (patterns existants)*
