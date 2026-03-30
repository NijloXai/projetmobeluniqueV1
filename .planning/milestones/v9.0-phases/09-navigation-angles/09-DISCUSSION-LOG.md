# Phase 9: Navigation angles - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 09-navigation-angles
**Areas discussed:** Position des thumbnails, Etat initial sans tissu, Angles sans rendu IA, Interaction angle + tissu

---

## Position des thumbnails

| Option | Description | Selected |
|--------|-------------|----------|
| Sous l'image (recommande) | Comme le wireframe : rangee horizontale sous l'image principale | ✓ |
| Dans la colonne droite | Thumbnails integres dans la colonne controles | |
| Overlay sur l'image | Thumbnails en surimpression en bas de l'image | |

**User's choice:** Sous l'image
**Notes:** Conforme au wireframe, desktop colonne gauche, mobile pleine largeur

### Taille et style

| Option | Description | Selected |
|--------|-------------|----------|
| 72x54px wireframe | Taille du wireframe, ratio 4/3 | |
| Taille plus grande 96x72px | Plus lisibles | |
| Tu decides | Claude choisit | ✓ |

**User's choice:** Tu decides

### Labels texte

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, avec labels | Le wireframe montre des labels sous chaque thumbnail | |
| Non, image seule | Plus epure, l'image suffit | ✓ |

**User's choice:** Non, image seule

### Mobile scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll horizontal | Rangee scrollable horizontalement avec overflow-x | ✓ |
| Wrap sur 2 lignes | Les thumbnails passent a la ligne | |
| Tu decides | Claude choisit | |

**User's choice:** Scroll horizontal

### Transition image

| Option | Description | Selected |
|--------|-------------|----------|
| Fade crossfade | Fondu enchaine rapide ~200ms | ✓ |
| Changement instantane | L'image change immediatement | |
| Tu decides | Claude choisit | |

**User's choice:** Fade crossfade

### Fond thumbnails

| Option | Description | Selected |
|--------|-------------|----------|
| Fond distinct | Bandeau background-alt sous l'image | |
| Meme fond que l'image | Thumbnails sans bandeau distinct | ✓ |
| Tu decides | Claude choisit | |

**User's choice:** Meme fond que l'image

### Style actif

| Option | Description | Selected |
|--------|-------------|----------|
| Bordure primary | Meme traitement que swatches : bordure 3px #E49400 + outline 2px | ✓ |
| Opacite differenciee | Actif opaque, inactifs a 60% | |
| Tu decides | Claude choisit | |

**User's choice:** Bordure primary

### Accessibilite

| Option | Description | Selected |
|--------|-------------|----------|
| Image + alt text | Change image ET met a jour alt text avec le nom de l'angle | ✓ |
| Image seule | Seule l'image change | |
| Tu decides | Claude gere | |

**User's choice:** Image + alt text

---

## Etat initial sans tissu

| Option | Description | Selected |
|--------|-------------|----------|
| Photos originales | Les thumbnails montrent les photos originales du modele | ✓ |
| Thumbnails masques | N'apparaissent qu'apres selection d'un tissu | |
| Thumbnails grises/placeholder | Presents mais grises | |

**User's choice:** Photos originales

### Angle par defaut

| Option | Description | Selected |
|--------|-------------|----------|
| 3/4 si disponible | Wireframe montre 3/4 actif par defaut, fallback premiere image | ✓ |
| getPrimaryImage actuel | Garder la logique existante | |

**User's choice:** 3/4 si disponible

---

## Angles sans rendu IA

| Option | Description | Selected |
|--------|-------------|----------|
| Photo originale + badge | Thumbnail montre photo originale avec badge | |
| Cacher les angles sans rendu | Seuls les angles avec rendu IA affiches | ✓ |
| Photo originale sans badge | Photo originale sans indication | |

**User's choice:** Cacher les angles sans rendu

### Un seul angle

| Option | Description | Selected |
|--------|-------------|----------|
| Cacher si 1 seul angle | Rangee masquee quand un seul angle | ✓ |
| Toujours afficher | Meme avec 1 angle, rangee visible | |

**User's choice:** Cacher si 1 seul angle

---

## Interaction angle + tissu

### Changement de tissu

| Option | Description | Selected |
|--------|-------------|----------|
| Garder l'angle si dispo | Conserve l'angle si rendu existe, sinon reset 3/4 | ✓ |
| Toujours reset au 3/4 | Chaque changement remet au 3/4 | |
| Tu decides | Claude choisit | |

**User's choice:** Garder l'angle si disponible

### Deselection tissu

| Option | Description | Selected |
|--------|-------------|----------|
| Photos originales | Retour aux photos originales du modele | ✓ |
| Masquer les thumbnails | Sans tissu, pas de navigation | |

**User's choice:** Photos originales

### State structure

| Option | Description | Selected |
|--------|-------------|----------|
| useState separe | Nouveau useState pour l'angle, independant de selectedFabricId | ✓ |
| Tu decides | Claude choisit | |

**User's choice:** useState separe

### Reouverture modal

| Option | Description | Selected |
|--------|-------------|----------|
| Reset au 3/4 | Coherent avec reset tissu Phase 8 | |
| Preserver l'angle | Client retrouve sa derniere vue | ✓ |

**User's choice:** Preserver l'angle

### Changement de modele

| Option | Description | Selected |
|--------|-------------|----------|
| Reset au 3/4 | Nouveau modele = etat frais | ✓ |
| Preserver l'angle | Reste sur meme angle entre modeles | |

**User's choice:** Reset au 3/4

---

## Claude's Discretion

- Taille exacte des thumbnails
- Espacement entre thumbnails
- Implementation technique du crossfade
- Style scrollbar mobile
- Navigation clavier (tab, enter)

## Deferred Ideas

- Zoom image rendu IA — hors scope v9.0
- Swipe mobile entre angles — amelioration future
- Slide animation entre angles — non retenue
