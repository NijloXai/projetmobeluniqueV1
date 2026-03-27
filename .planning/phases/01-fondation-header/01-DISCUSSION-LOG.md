# Phase 1: Fondation + Header - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 01-fondation-header
**Areas discussed:** Choix du logo, Favicon et meta, Contenu header, Assets dans public/

---

## Choix du logo

| Option | Description | Selected |
|--------|-------------|----------|
| Logo-01 noir complet | Monogramme 'mu' + texte 'MOBEL UNIQUE' en noir. Lisible sur fond blanc (scrolle) et polyvalent. | ✓ |
| Logo-02 ambre/or | Monogramme + texte en couleur primaire #E49400. Plus colore mais risque de manquer de contraste. | |
| Monogramme seul (sans texte) | Juste le 'mu' cursif, plus compact. Nom en texte HTML a cote. | |

**User's choice:** Logo-01 noir complet
**Notes:** Recommande pour sa polyvalence

### Suivi : Gestion fond sombre

| Option | Description | Selected |
|--------|-------------|----------|
| Deux logos : blanc (transparent) / noir (scrolle) | Logo-04 blanc quand transparent, Logo-01 noir quand scrolle. Swap automatique. | ✓ |
| Logo noir uniquement | Un seul logo, visible surtout apres scroll. | |
| Logo ambre uniquement | Logo-02 ambre, bon contraste sur les deux fonds. | |

**User's choice:** Deux logos avec swap automatique
**Notes:** Meilleure lisibilite dans les deux etats du header

---

## Favicon et meta

| Option | Description | Selected |
|--------|-------------|----------|
| Favicon-04 noir sur blanc | Monogramme noir sur fond blanc, bonne taille, lisible. | ✓ |
| Favicon-02 noir trait fin | Monogramme plus petit, plus de marge. | |
| Favicon-05 noir grande taille | Monogramme tres grand, remplit le carre. | |

**User's choice:** Favicon-04 noir sur blanc

### Suivi : App icon mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Setup complet (favicon + apple-touch-icon + manifest) | Tout configure avec les assets du dossier client. | ✓ |
| Juste le favicon | Seulement l'onglet navigateur. | |

**User's choice:** Setup complet

---

## Contenu header

| Option | Description | Selected |
|--------|-------------|----------|
| Lien 'Retour a la boutique' seul | Simple, coherent avec une SPA separee de Shopify. Header minimaliste. | ✓ |
| Navigation interne (ancres) | Liens vers sections : Catalogue, Configurateur, Contact. | |
| Tagline + lien boutique | "Crafted for Comfort, Built for Life." + lien retour. | |

**User's choice:** Lien seul, minimaliste

### Suivi : URL Shopify

| Option | Description | Selected |
|--------|-------------|----------|
| Garder le placeholder (#) | URL plus tard. | |
| Donner l'URL maintenant | URL Shopify a integrer. | ✓ |

**User's choice:** URL fournie : https://www.mobelunique.fr/

---

## Assets dans public/

| Option | Description | Selected |
|--------|-------------|----------|
| Dossier public/brand/ dedie | Separe des assets Next.js. Propre. | ✓ |
| Tout a la racine de public/ | Plus simple, moins organise. | |
| Dossiers par type (logos/, icons/) | Separation par type. | |

**User's choice:** Dossier public/brand/ dedie

### Suivi : Icones meubles

| Option | Description | Selected |
|--------|-------------|----------|
| Seulement logos + favicon | Strict necessaire pour le header. | ✓ |
| Tout copier maintenant | Logos + favicon + 18 icones + images. | |

**User's choice:** Seulement logos + favicon

### Suivi : Nettoyage fichiers Next.js

| Option | Description | Selected |
|--------|-------------|----------|
| Supprimer les fichiers Next.js par defaut | Plus propre. Fichiers inutilises. | ✓ |
| Les laisser | Suppression plus tard. | |

**User's choice:** Supprimer

---

## Claude's Discretion

- Taille exacte du logo dans le header
- Transition du swap logo blanc/noir
- Format et conversion favicon
- Configuration web manifest
- Nommage fichiers dans public/brand/

## Deferred Ideas

- Icones meubles SVG (18) — phases futures
- Images ambiance Unsplash — hero ou sections futures
- Tagline "Crafted for Comfort, Built for Life." — hero ou footer, pas header
