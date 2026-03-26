# Wireframe — Page unique Mobel Unique

> **Projet :** Mobel Unique — Configurateur IA
> **Type :** Single Page App
> **Objectif :** Visualiser un canape dans differents tissus + simuler chez soi
> **Parcours :** Direct (hero -> catalogue -> config) ou Shopify (?produit=slug -> config direct)
> **Version :** v4 — 18 mars 2026

---

## Structure

| # | Section | Role |
|---|---------|------|
| 1 | Header minimal | Navigation, identite de marque, lien retour Shopify |
| 2 | Hero | Accroche emotionnelle, proposition de valeur, CTA principal |
| 3 | Comment ca marche | Rassurer et expliquer le parcours en 3 etapes |
| 4 | Catalogue | Presenter les modeles disponibles, selection du produit |
| 5 | Configurateur | Coeur de l'app — choix tissu, visualisation IA, dimensions, prix |
| 6 | Produits similaires | Anti dead-end — suggestions alternatives |
| 7 | Simulation | Upload photo salon, generation IA, resultat + partage |
| 8 | Footer | Credits, retour Shopify |

---

## Section 1 : Header minimal

**Objectif :** Identifier la marque sans distraire. Offrir un retour vers Shopify.

**Contenu :**

| Element | Type | Intention |
|---------|------|-----------|
| Logo monogramme "MU" | Div stylise (40x40px, fond primary) | Identite visuelle immediate |
| Nom "Mobel Unique" | Texte lie | Renforcement de la marque |
| "<- Retour a la boutique" | Lien externe (Shopify) | Sortie controlee vers l'e-commerce |

**Comportement :**
- Position fixe en haut
- Transparent sur le hero -> fond blanc au scroll (transition 0.3s)
- Le texte passe de blanc a sombre au scroll
- `z-index: 100`

---

## Section 2 : Hero

**Objectif :** Creer un impact emotionnel immediat. Vendre la promesse : "voyez votre canape chez vous".

**Contenu :**

| Element | Type | Intention |
|---------|------|-----------|
| Image de fond (placeholder) | Photo plein ecran — canape dans salon lumineux | Contexte aspirationnel |
| Overlay gradient | CSS gradient sombre | Lisibilite du texte |
| Badge "Visualisation par IA" | Pill doree | Positionner la technologie |
| Titre "Visualisez votre canape chez vous" | H1, 36-60px responsive | Proposition de valeur claire |
| Sous-titre | Paragraphe 16-18px | Detailler le benefice |
| CTA "Decouvrir nos canapes" | Bouton primary | Engager le scroll vers catalogue |
| Indicateur scroll | Fleche animee + "Defiler" | Guider le premier scroll |

---

## Section 3 : Comment ca marche

**Objectif :** Reduire l'incertitude. Montrer que c'est simple en 3 etapes.

**Contenu :**

| Element | Type | Intention |
|---------|------|-----------|
| Titre "Simple comme 1, 2, 3" | H2 section-title | Promesse de simplicite |
| Sous-titre | Texte muted | Cadrer le parcours |
| Etape 1 — Choisissez votre modele | Card avec icone | Premiere action |
| Etape 2 — Personnalisez avec votre tissu | Card avec icone | Deuxieme action |
| Etape 3 — Visualisez chez vous | Card avec icone | Resultat final |

**Layout :**
- Mobile : 1 colonne, cards empilees
- Tablet+ : 3 colonnes cote a cote
- Fond `bg-alt` (beige clair) pour contraste avec sections adjacentes

---

## Section 4 : Catalogue

**Objectif :** Presenter les modeles. Permettre la selection avant configuration.

**Contenu :**

| Element | Type | Intention |
|---------|------|-----------|
| Titre "Nos Canapes" | H2 section-title | Introduire le catalogue |
| Sous-titre | Texte muted | Inciter au clic |
| Product card (x3) | Card interactive | Presenter chaque modele |
| Image placeholder | Zone 220px, fond neutre | Visualisation produit |
| Nom + prix | Texte | Informer |
| Swatches miniatures | Cercles colores (22px) + "+N" | Montrer la variete de tissus |
| CTA "Configurer ce modele ->" | Bouton primary pleine largeur | Action principale |

**Produits presentes :**
- **Milano** — Canape 3 places — a partir de 1 290 EUR
- **Oslo** — Canape d'angle — a partir de 1 890 EUR
- **Firenze** — Canape 2 places — a partir de 990 EUR

**Layout :**
- Mobile : 1 colonne
- Tablet : 2 colonnes
- Desktop : 3 colonnes

---

## Section 5 : Configurateur

**Objectif :** Coeur de l'experience. Permettre la personnalisation tissu et la visualisation du resultat sous tous les angles.

### Layout

2 colonnes en desktop (60/40) :
- **Colonne gauche :** Image principale du rendu IA + miniatures d'angles
- **Colonne droite :** Controles (titre, zoom texture, swatches, prix, actions)
- Mobile : empile verticalement

### Colonne image

| Element | Type | Intention |
|---------|------|-----------|
| Image principale (340-480px) | Zone de rendu IA avec placeholder | Montrer le canape dans le tissu choisi |
| Badge "Rendu IA" | Pill sombre en bas a droite | Transparence sur la technologie |
| Dimensions overlay | Lignes cotees + labels positionnes | Montrer LxPxH directement sur l'image |
| Miniatures angles (x5) | Thumbnails 72x54px cliquables | Permettre la vue sous differents angles |

### Colonne controles

| Element | Type | Intention |
|---------|------|-----------|
| Titre "Milano — 3 places" | H3 heading | Identifier le produit selectionne |
| Dimensions texte | Texte muted "220 x 90 x 85 cm" | Info technique |
| Zoom texture | Encart blanc (100-120px preview + infos) | Voir le tissu de pres |
| Label "Choisissez votre tissu" | Texte uppercase bold | Introduire la selection |
| Swatches rail (x6) | Cercles 52px, scrollables | Selection du tissu |
| Recap prix | Card blanche avec ombre | Transparence tarifaire |
| CTA "Visualiser chez moi" | Bouton primary pleine largeur | Action principale -> simulation |
| CTA "Commander sur Shopify" | Bouton outline pleine largeur | Sortie vers achat |
| Lien "<- Changer de canape" | Text link muted | Retour catalogue |

### Swatches

| Tissu | Couleur | Badge |
|-------|---------|-------|
| Beige naturel | #c8a882 | inclus |
| Gris ardoise | #6b7280 | inclus |
| Bleu nuit | #1c2b3a | +80 EUR premium |
| Bordeaux | #5c2d2d | +80 EUR premium |
| Vert sauge | #3d4d3d | +80 EUR premium |
| Anthracite | #2c2c2c | inclus |

---

## Section 6 : Produits similaires

**Objectif :** Eviter le dead-end UX.

**Contenu :**

| Element | Type | Intention |
|---------|------|-----------|
| Titre "Vous aimerez aussi" | H2 section-title | Reassurance + cross-sell |
| Card Oslo | Card | Alternative canape d'angle |
| Card Firenze | Card | Alternative 2 places |
| Card Roma | Card | Alternative meridienne |

**Layout :**
- Mobile : cards horizontales empilees
- Desktop : 3 colonnes, cards verticales

---

## Section 7 : Simulation

**Objectif :** Permettre au client de voir son canape configure dans son propre salon via IA.

### 3 etats

#### Etat 1 : Avant upload

| Element | Type | Intention |
|---------|------|-----------|
| Exemple avant/apres | 2 cards cote a cote (grille 50/50) | Montrer le resultat attendu |
| Rappel configuration | Bandeau bg-alt avec swatch + texte + lien modifier | Rassurer sur la config choisie |
| Zone upload | Zone dashed, fond bg-alt, 48px padding | Interaction principale |
| Bouton "Choisir une photo" | Bouton sombre | Fallback pour mobile |

#### Etat 2 : Generation en cours

| Element | Type | Intention |
|---------|------|-----------|
| Image uploadee en fond | Zone 300px, fond neutre | Contexte visuel |
| Overlay sombre | Position absolute | Lisibilite |
| Message "Placement du canape..." | Texte blanc 15px bold | Etat courant |
| Barre de progression | 240px, fill primary a 60% | Avancement visuel |
| Etapes detaillees | 3 lignes (done/active/pending) | Transparence sur le processus |

#### Etat 3 : Resultat

| Element | Type | Intention |
|---------|------|-----------|
| Image resultat | Zone 380px | Resultat principal |
| Watermark "Mobel Unique" | Pill en bas a droite | Protection de l'image |
| Badge "Simulation IA — rendu approximatif" | Pill en haut a gauche | Disclaimer |
| Bouton "Telecharger l'image" | Bouton sombre pleine largeur | Garder le resultat |
| Envoyer via WhatsApp | Bouton vert #25D366 pleine largeur | Partage social / viralite |
| Bouton "Commander sur Shopify" | Bouton primary pleine largeur | Conversion finale |
| Lien "Reessayer avec une autre photo" | Text link muted | Iteration |

---

## Section 8 : Footer

**Objectif :** Cloturer la page. Rappeler la marque.

| Element | Type | Intention |
|---------|------|-----------|
| Logo MU + nom | Lien/div centre | Identite |
| Tagline "Powered by Mobel Unique - Visualisation IA" | Texte muted 13px | Credits |
| Lien retour Shopify | Lien primary | Sortie |

---

## Bandeau sticky mobile

| Element | Type | Intention |
|---------|------|-----------|
| Swatch preview | Cercle 40px avec bordure primary | Rappel visuel du tissu choisi |
| Prix total + label | "1 370 EUR / Milano x Bleu nuit" | Info critique toujours visible |
| CTA "Visualiser chez moi" | Bouton primary compact | Action principale accessible |

- Visible uniquement en mobile (< 1024px)
- Position fixed bottom, z-index 90

---

## Responsive

| Breakpoint | Cible | Changements principaux |
|------------|-------|----------------------|
| < 640px | Mobile | Layout 1 colonne partout, swatches scrollables, sticky bar visible |
| >= 640px | Tablet | Steps en 3 colonnes, catalogue en 2 colonnes |
| >= 1024px | Desktop | Hero titre 60px, catalogue 3 colonnes, configurateur 60/40, sticky bar masque |
| >= 1280px | Large desktop | Padding lateral augmente (64px) |

---

## Variables CSS

```css
--color-primary: #E49400
--color-secondary: #EFC806
--color-text: #1D1D1B
--color-bg: #FFFFFF
--color-bg-alt: #F8F4EE
--color-muted: #888888
--color-success: #4CAF50
--font-heading: 'Montserrat'
--font-body: 'Montserrat'
--header-height: 64px
```

---

## Navigation

### Parcours direct (landing page)
```
Hero -> Comment ca marche -> Catalogue -> Configurateur -> Produits similaires -> Simulation -> Shopify
```

### Parcours Shopify (lien produit)
```
?produit=slug -> Configurateur (scroll direct) -> Simulation -> Shopify
```

---

## Interactions JavaScript

| Interaction | Declencheur | Effet |
|-------------|-------------|-------|
| Header scroll | window.scroll > 80px | Ajout classe .scrolled (fond blanc + ombre) |
| Selection produit | Clic sur card catalogue | Active la card, scroll vers configurateur, maj titre |
| Selection swatch | Clic sur swatch-item | Active le swatch, met a jour le zoom texture |
| Selection angle | Clic sur thumbnail | Active le thumbnail |
| Navigation etats simulation | Clic sur state-tab | Affiche le panel correspondant |
