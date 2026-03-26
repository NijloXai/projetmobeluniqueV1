# Phase 2: Hero plein écran - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 02-hero-plein-cran
**Areas discussed:** Image de fond, Contenu textuel, Style CTA, Animation, Responsive, Scroll indicator

---

## Image de fond / Placeholder

| Option | Description | Selected |
|--------|-------------|----------|
| Gradient CSS sombre | Gradient radial ou linéaire dans les tons warm/sombre. Zero dépendance. | |
| Image stock temporaire | Photo d'un salon lumineux avec canapé (type Unsplash). | |
| Couleur unie + overlay | Fond beige/warm uni avec overlay semi-transparent. Minimaliste. | ✓ |

**User's choice:** Couleur unie + overlay
**Notes:** Pas d'image réelle disponible. Solution minimaliste cohérente avec la charte.

### Intensité overlay

| Option | Description | Selected |
|--------|-------------|----------|
| Léger (30-40%) | Le fond warm reste visible, texte blanc lisible mais doux | |
| Standard (55%) | Correspond à --color-overlay déjà dans globals.css | |
| Tu décides | Claude ajuste l'opacité pour le meilleur contraste | ✓ |

**User's choice:** Tu décides

### Image future

| Option | Description | Selected |
|--------|-------------|----------|
| background-image CSS | Plus simple pour un hero fullscreen | |
| next/image avec fill | Optimisation automatique (WebP, lazy) | |
| Tu décides | Claude choisit l'approche technique | ✓ |

**User's choice:** Tu décides

---

## Contenu textuel

### Titre H1

| Option | Description | Selected |
|--------|-------------|----------|
| Garder le wireframe | "Visualisez votre canapé chez vous" — direct, clair | ✓ |
| Variante émotionnelle | "Votre canapé idéal, dans votre salon" | |
| Variante technologie | "Créez votre canapé sur mesure par IA" | |

**User's choice:** Garder le wireframe — "Visualisez votre canapé chez vous"

### Sous-titre

| Option | Description | Selected |
|--------|-------------|----------|
| Explicatif | "Choisissez parmi nos tissus et visualisez le résultat grâce à l'IA" | |
| Aspirationnel | "Personnalisez chaque détail et voyez votre création prendre vie" | |
| Tu décides | Claude rédige un sous-titre adapté au ton général | ✓ |

**User's choice:** Tu décides

### Badge IA

| Option | Description | Selected |
|--------|-------------|----------|
| Doré (secondary) | Fond --color-secondary (#EFC806), texte sombre | |
| Outline doré | Bordure --color-primary, fond transparent, texte blanc | |
| Tu décides | Claude choisit le style le plus lisible | ✓ |

**User's choice:** Tu décides

### CTA action

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll vers #catalogue | Scroll smooth vers la section catalogue | ✓ |
| Scroll vers #comment-ca-marche | Scroll vers la section suivante | |
| Lien mort temporaire | href="#" en attendant | |

**User's choice:** Scroll vers #catalogue

---

## Style du bouton CTA

### Style

| Option | Description | Selected |
|--------|-------------|----------|
| Plein primary | Fond --color-primary (#E49400), texte blanc | |
| Plein avec gradient | Gradient primary→primary-dark, texte blanc. Premium. | ✓ |
| Outline blanc | Bordure blanche, texte blanc, fond transparent | |

**User's choice:** Plein avec gradient — aspect premium cohérent avec "Curated Atelier"

### Taille

| Option | Description | Selected |
|--------|-------------|----------|
| Large (16px 40px) | Grand bouton imposant, font-size-lg | |
| Medium (12px 32px) | Taille standard, font-size-base | |
| Tu décides | Claude ajuste taille et padding | ✓ |

**User's choice:** Tu décides

### Hover

| Option | Description | Selected |
|--------|-------------|----------|
| Scale up léger | transform: scale(1.05) + shadow | |
| Changement luminosité | Le gradient s'éclaircit ou s'assombrit | |
| Tu décides | Claude choisit l'effet le plus cohérent | ✓ |

**User's choice:** Tu décides

---

## Animation d'entrée

### Type d'animation

| Option | Description | Selected |
|--------|-------------|----------|
| Fade-in stagger | Éléments apparaissent un par un (badge→H1→sous-titre→CTA) | |
| Fade-in simultané | Tous les éléments apparaissent en même temps | ✓ |
| Slide-up + fade | Chaque élément monte légèrement en faisant un fade-in | |

**User's choice:** Fade-in simultané

### Durée

| Option | Description | Selected |
|--------|-------------|----------|
| Rapide (400ms) | Correspond à --transition-smooth dans globals.css | ✓ |
| Standard (600ms) | Un poil plus lent | |
| Lent (800ms) | Entrée cinématique | |

**User's choice:** Rapide (400ms)

### Librairie

| Option | Description | Selected |
|--------|-------------|----------|
| CSS pur (keyframes) | Zero dépendance, @keyframes + animation | |
| Framer Motion | Plus puissant, ajoute ~30kb | ✓ |
| Tu décides | Claude choisit l'approche technique | |

**User's choice:** Framer Motion

---

## Responsive du hero

### Hauteur

| Option | Description | Selected |
|--------|-------------|----------|
| 100svh partout | Fullscreen sur tous les écrans | |
| 100svh mobile, 100vh desktop | svh uniquement où nécessaire | |
| Tu décides | Claude choisit l'unité la plus compatible | ✓ |

**User's choice:** Tu décides

### Tailles responsive

| Option | Description | Selected |
|--------|-------------|----------|
| Tout réduit proportionnellement | Badge, titre, sous-titre, CTA plus petits sur mobile | |
| Seul le titre réduit | Badge, sous-titre et CTA gardent la même taille | |
| Tu décides | Claude ajuste selon tokens charte | ✓ |

**User's choice:** Tu décides

---

## Comportement scroll indicator

### Disparition

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, fade-out au scroll | Disparaît quand scrollY > seuil | ✓ |
| Non, toujours visible | Reste visible dans le hero | |
| Tu décides | Claude choisit le comportement | |

**User's choice:** Oui, fade-out au scroll

### Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Oui | Clic = scroll smooth vers section suivante | |
| Non, décoratif seulement | Purement visuel, pas interactif | ✓ |
| Tu décides | Claude choisit | |

**User's choice:** Non, décoratif seulement

---

## Claude's Discretion

- Intensité overlay
- Technique image future (background-image vs next/image)
- Rédaction sous-titre
- Style badge IA (pill dorée vs outline)
- Taille/padding/radius CTA
- Effet hover CTA
- Style indicateur scroll
- Hauteur hero (svh/vh)
- Ajustement tailles responsive
- Support prefers-reduced-motion

## Deferred Ideas

None — discussion stayed within phase scope
