# Phase 4: Prerequis + Catalogue core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 04-prerequis-catalogue-core
**Areas discussed:** Design des cards, Section layout, Etat sans produit, Image produit

---

## Design des cards

| Option | Description | Selected |
|--------|-------------|----------|
| Comme la maquette | Image 4/5, nom + sous-titre + prix, bouton Configurer, hover zoom image | |
| Plus simple | Image + nom + prix seulement. Pas de sous-titre ni hover complexe | |
| Tu decides | Claude adapte le style de la maquette au mieux | |

**User's choice:** "Fais-moi des propositions adaptees" — 3 propositions presentees

### Propositions

| Option | Description | Selected |
|--------|-------------|----------|
| A) Atelier Editorial | Fidele a la maquette Stitch — image 4/5, nom+prix, CTA visible | ✓ |
| B) Galerie Minimaliste | Image 1:1, card cliquable, pas de CTA visible | |
| C) Magazine Luxe | Image 16:9, texte en overlay sur l'image, CTA au hover | |

**User's choice:** A) Atelier Editorial
**Notes:** Look premium e-commerce, coherent avec la maquette Stitch

---

## Section layout

### Titre
| Option | Description | Selected |
|--------|-------------|----------|
| Nos Canapes | Simple et direct (wireframe) | ✓ |
| Collection Signature | Plus premium (maquette Stitch) | |
| Tu decides | Claude choisit le titre le plus coherent | |

**User's choice:** Nos Canapes

### Fond
| Option | Description | Selected |
|--------|-------------|----------|
| Blanc #FFFFFF | Contraste avec HowItWorks beige au-dessus | ✓ |
| Beige #F8F4EE | Meme fond que HowItWorks, continuite | |
| Tu decides | Claude choisit le meilleur contraste | |

**User's choice:** Blanc #FFFFFF — alternance beige/blanc pour le rythme visuel

---

## Etat sans produit

| Option | Description | Selected |
|--------|-------------|----------|
| Message simple | "Nos canapes arrivent bientot." — texte centre, discret | ✓ |
| Message + icone | Icone canape (Lucide) + message. Plus visuel | |
| Tu decides | Claude gere l'etat vide et l'etat erreur | |

**User's choice:** Message simple

---

## Image produit

| Option | Description | Selected |
|--------|-------------|----------|
| Premiere image | La premiere de model_images (sort_order le plus bas) | |
| Image 3/4 prioritaire | Chercher view_type '3/4' d'abord, fallback sur la premiere | ✓ |
| Tu decides | Claude choisit la meilleure logique | |

**User's choice:** Image 3/4 prioritaire

---

## Claude's Discretion

- Sous-titre de la section catalogue
- Padding et espacement
- Format d'affichage du prix
- Placeholder image (nuance de gris, taille icone)
- Dimensions du skeleton loading

## Deferred Ideas

- Swatches miniatures tissus sur les cards (v9.0)
- Tri prix/nouveautes (reporte)
- Animation d'entree des cards au scroll
