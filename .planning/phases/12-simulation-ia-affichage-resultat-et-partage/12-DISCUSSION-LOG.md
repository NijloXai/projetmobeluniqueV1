# Phase 12: Simulation IA -- Affichage resultat et partage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 12-simulation-ia-affichage-resultat-et-partage
**Areas discussed:** Affichage du resultat, Actions post-resultat, Experience mobile, Gestion d'erreur, Transition visuelle, Texte et copywriting, Historique simulations

---

## Affichage du resultat

| Option | Description | Selected |
|--------|-------------|----------|
| Image plein espace gauche | Le resultat remplace la zone upload dans la colonne gauche | ✓ |
| Slider before/after | Comparaison glissante photo originale vs rendu IA | |
| Image zoomable plein ecran | Lightbox plein ecran par-dessus le modal | |

**User's choice:** Image plein espace gauche
**Notes:** Coherent avec le flux Phase 11, simple et sobre

---

## Disclaimer

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, texte discret | Petit texte gris : "Apercu genere par IA — le rendu reel peut varier" | ✓ |
| Non, le watermark suffit | Le watermark est deja present sur l'image | |
| Vous decidez | Claude choisit | |

**User's choice:** Oui, texte discret

---

## Actions post-resultat

| Option | Description | Selected |
|--------|-------------|----------|
| Telecharger + Partager + Shopify + Recommencer | 4 boutons complets | ✓ |
| Telecharger + Shopify + Recommencer | 3 boutons sans partage | |
| Telecharger + Recommencer seulement | Minimaliste | |

**User's choice:** 4 boutons complets

---

## Telechargement

| Option | Description | Selected |
|--------|-------------|----------|
| Telechargement direct JPEG | Clic = download immediat du blob | ✓ |
| Choix format JPEG/PNG | Menu deroulant format | |
| Vous decidez | Claude choisit | |

**User's choice:** Telechargement direct JPEG

---

## Experience mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Image en haut, actions empilees | Layout 1 colonne coherent Phase 11 | ✓ |
| Image plein ecran avec overlay | Actions en overlay semi-transparent | |
| Vous decidez | Claude adapte | |

**User's choice:** Image en haut, actions empilees

---

## Partage

| Option | Description | Selected |
|--------|-------------|----------|
| Web Share API + fallback WhatsApp | navigator.share() mobile, wa.me/ desktop | ✓ |
| Lien WhatsApp uniquement | Toujours wa.me/ | |
| Vous decidez | Claude choisit | |

**User's choice:** Web Share API avec fallback WhatsApp

---

## Transition visuelle

| Option | Description | Selected |
|--------|-------------|----------|
| Fondu enchaine | Progression 100% puis fondu ~400ms vers resultat | ✓ |
| Slide vertical | Image glisse de bas en haut | |
| Vous decidez | Claude choisit | |

**User's choice:** Fondu enchaine

---

## Titre etape resultat

| Option | Description | Selected |
|--------|-------------|----------|
| Votre simulation | Simple, direct. Sous-titre dynamique | ✓ |
| Resultat de la simulation | Plus descriptif mais plus long | |
| Vous decidez | Claude choisit | |

**User's choice:** Votre simulation

---

## Texte bouton partage

| Option | Description | Selected |
|--------|-------------|----------|
| Partager | Court et universel avec icone | ✓ |
| Envoyer a un proche | Plus chaleureux | |
| Partager sur WhatsApp | Explicite mais limitant | |

**User's choice:** Partager

---

## Historique simulations

| Option | Description | Selected |
|--------|-------------|----------|
| Non, pas d'historique | Chaque simulation ephemere, download pour garder | ✓ |
| Galerie temporaire en session | Carrousel miniatures, perdu au reload | |
| Reporter a une future phase | Feature a part entiere | |

**User's choice:** Pas d'historique

---

## Recommencer (flux)

| Option | Description | Selected |
|--------|-------------|----------|
| Retour a l'etat idle | Reset complet vers zone upload vierge, config preservee | ✓ |
| Retour a l'etat preview | Garde la photo actuelle | |
| Vous decidez | Claude choisit | |

**User's choice:** Retour a l'etat idle

---

## Claude's Discretion

- Style exact des boutons d'action
- Icones des boutons
- Espacement et padding du layout resultat
- Message pre-rempli pour le partage WhatsApp
- Gestion du cas shopify_url null

## Deferred Ideas

- Historique/galerie de simulations
- Comparaison before/after avec slider
- Streaming/SSE pour progression reelle
