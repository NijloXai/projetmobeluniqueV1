# Phase 11: Simulation IA -- Upload et traitement - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 11-simulation-ia-upload-et-traitement
**Areas discussed:** Emplacement de la simulation, Zone d'upload et interaction, Feedback pendant le traitement, Prerequis et garde-fous

---

## Emplacement de la simulation

| Option | Description | Selected |
|--------|-------------|----------|
| Dans le modal (recommande) | Nouvelle etape dans le ConfiguratorModal | **yes** |
| Section separee sur la page | Section 7 dediee sous le catalogue, comme wireframe | |
| Nouveau modal dedie | Second modal separe ouvert depuis le configurateur | |

**User's choice:** Dans le modal configurateur comme nouvelle etape
**Notes:** Le flux reste continu : tissu -> simulation, tout dans le meme contexte

### Navigation entre etapes

| Option | Description | Selected |
|--------|-------------|----------|
| CTA "Visualiser chez moi" (recommande) | Bouton visible quand tissu selectionne + retour | **yes** |
| Tabs/onglets en haut du modal | Navigation libre entre les deux | |
| Stepper lineaire | Indicateur 1-2 sequentiel | |

### Layout etape simulation

| Option | Description | Selected |
|--------|-------------|----------|
| Zone upload remplace l'image (recommande) | Colonne gauche = zone upload, droite = rappel + CTA | **yes** |
| Image canape reste, upload a droite | Rendu IA visible a gauche, upload a droite | |
| Layout plein largeur | Zone upload centree, pas de 2 colonnes | |

### Position CTA "Visualiser chez moi"

| Option | Description | Selected |
|--------|-------------|----------|
| Sous le CTA Shopify (recommande) | Bouton outline secondaire sous "Acheter sur Shopify" | **yes** |
| Remplace le CTA Shopify | Principal devient simulation, Shopify passe secondaire | |
| Au-dessus de l'image | Petit lien au-dessus de la zone image | |

### Exemple avant/apres

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, montrer l'exemple | 2 mini-images avant/apres | |
| Non, pas necessaire | Concept clair du contexte | |
| Texte explicatif seulement | Court texte sans images | **yes** |

### Rappel configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Bandeau compact en haut (recommande) | Mini swatch + nom tissu + lien modifier | **yes** |
| Dans la colonne droite | Rappel dans le contenu droite | |
| Pas de rappel explicite | Titre du modal suffit | |

### Mobile layout simulation

| Option | Description | Selected |
|--------|-------------|----------|
| Zone upload en haut, rappel + CTA en bas (recommande) | Action principale immediatement visible | **yes** |
| Rappel config en haut, zone upload en bas | Contexte d'abord, action ensuite | |
| Tu decides | Claude a discretion | |

---

## Zone d'upload et interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Drag & drop + bouton (recommande) | Zone dashed + bouton "Choisir une photo" | |
| Bouton uniquement | Simple bouton, pas de zone drag & drop | |
| Capture camera + fichier | Mobile : camera directe. Desktop : drag & drop + fichier | **yes** |

**User's choice:** Capture camera + fichier via input unique accept=image/*
**Notes:** Le navigateur propose naturellement camera ou galerie sur mobile

### Preview avant envoi

| Option | Description | Selected |
|--------|-------------|----------|
| Preview + bouton confirmer (recommande) | Photo apparait + "Lancer la simulation" + "Changer de photo" | **yes** |
| Envoi immediat | Pas de preview intermediaire | |
| Preview sans confirmation | Affichage bref puis envoi auto | |

### Formats et taille

| Option | Description | Selected |
|--------|-------------|----------|
| JPEG/PNG, max 10 Mo (recommande) | Coherent API existante | |
| Tous formats image, max 10 Mo | Accept image/* permissif | |
| JPEG/PNG/HEIC, max 15 Mo | Inclure HEIC (iPhone), limite augmentee | **yes** |

### Style zone drag & drop

| Option | Description | Selected |
|--------|-------------|----------|
| Zone dashed, fond bg-alt (recommande) | Bordure pointillee, fond bg-alt | |
| Zone pleine minimaliste | Pas de bordure, tonal layering | |
| Tu decides | Claude a discretion | **yes** |

### Bouton camera

| Option | Description | Selected |
|--------|-------------|----------|
| Toujours visible (recommande) | 2 boutons : photo + fichier | |
| Camera mobile uniquement | Adaptatif par breakpoint | |
| Input unique accept=image/* | Un seul input partout | **yes** |

---

## Feedback pendant le traitement

| Option | Description | Selected |
|--------|-------------|----------|
| Image + overlay + etapes (wireframe) | Photo en fond, overlay, barre, 3 etapes | **yes** |
| Spinner + message simple | Spinner anime + messages tournants | |
| Tu decides | Claude choisit | |

### Barre de progression

| Option | Description | Selected |
|--------|-------------|----------|
| Simulee avec timer (recommande) | 0-30% rapide, 30-70% lent, 70-100% a reception | **yes** |
| Spinner uniquement, pas de % | Etapes textuelles sans pourcentage | |
| Vraie progression (refacto API) | SSE/streaming, plus complexe | |

### Annulation

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, bouton annuler (recommande) | AbortController, retour a preview | **yes** |
| Non, attendre le resultat | Pas de bouton annuler | |
| Fermer le modal = annuler | X et Escape annulent | |

### Libelles etapes

| Option | Description | Selected |
|--------|-------------|----------|
| Analyse / Placement / Rendu (recommande) | Simple, comprehensible | |
| Analyse / Integration / Finition | Plus precis sur le process IA | **yes** |
| Tu decides | Claude choisit | |

---

## Prerequis et garde-fous

### Tissu obligatoire

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, tissu obligatoire (recommande) | CTA visible uniquement avec tissu | |
| CTA toujours visible mais desactive | Bouton grise avec tooltip | |
| Tissu optionnel | Simulation avec tissu par defaut ou photo originale | **yes** |

**User's choice:** Tissu optionnel — photo originale du canape si pas de tissu

### Sans tissu selectionne

| Option | Description | Selected |
|--------|-------------|----------|
| Photo originale du canape (recommande) | Photo modele comme reference, fabric_id optionnel | **yes** |
| Forcer un tissu par defaut | Selectionner auto le premier tissu | |
| Finalement, exiger un tissu | Revenir sur la decision | |

### Gestion erreurs

| Option | Description | Selected |
|--------|-------------|----------|
| Message inline (recommande) | Erreur fichier sous zone upload, erreur IA dans progression | **yes** |
| Toast/notification flottante | Toast en bas du modal | |
| Tu decides | Claude choisit | |

### Retry

| Option | Description | Selected |
|--------|-------------|----------|
| Pas de retry auto (recommande) | Bouton "Reessayer" manuel | **yes** |
| 1 retry automatique | Retry silencieux une fois | |
| 3 retries avec backoff | Retry auto 3 fois | |

### Validation client

| Option | Description | Selected |
|--------|-------------|----------|
| Taille + type MIME (recommande) | file.size <= 15 Mo, types JPEG/PNG/HEIC | **yes** |
| Taille + type + dimensions min | En plus : 640x480 minimum | |
| Tu decides | Claude choisit | |

### State management

| Option | Description | Selected |
|--------|-------------|----------|
| useState local (recommande) | Tout dans ConfiguratorModal, etats idle/preview/generating/done/error | **yes** |
| Zustand store dedie | Store Zustand pour simulation | |
| useReducer | Reducer pour machine a etats | |

---

## Claude's Discretion

- Style exact de la zone drag & drop
- Animations/transitions entre etapes
- Timing progression simulee
- Icone zone upload
- Conversion HEIC serveur

## Deferred Ideas

- Affichage resultat, telechargement, partage WhatsApp, CTA Shopify post-sim -- Phase 12
- Streaming/SSE progression reelle -- hors scope
