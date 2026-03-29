# Phase 6: Modal configurateur placeholder - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 06-modal-configurateur-placeholder
**Areas discussed:** Contenu du placeholder, Approche technique, Design et animation, Comportement mobile

---

## Contenu du placeholder

| Option | Description | Selected |
|--------|-------------|----------|
| Teaser riche | Image canape + nom + prix + description + message "Configurateur a venir" | :heavy_check_mark: |
| Minimal informatif | Nom + message + lien Shopify | |
| Squelette du futur | Layout prefigurant le vrai configurateur avec zones grisees | |

**User's choice:** Teaser riche
**Notes:** Donne un avant-gout du futur configurateur avec les donnees produit reelles.

---

## Approche technique

| Option | Description | Selected |
|--------|-------------|----------|
| Radix Dialog | Focus trap, aria-modal, retour focus integres. Headless, stylable CSS Modules. | |
| `<dialog>` natif | Comme ConfirmDialog admin. Escape et backdrop gratuits, focus trap manuelle. | :heavy_check_mark: |
| Tu decides | Claude choisit selon les contraintes | |

**User's choice:** `<dialog>` natif
**Notes:** Coherent avec le pattern deja etabli dans ConfirmDialog admin. Focus trap et retour focus a coder manuellement.

---

## Design et animation

### Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Fade-in + scale | opacity 0→1 + scale 0.96→1, 300ms ease-out | |
| Slide-up | Monte depuis le bas, naturel mobile | |
| Pas d'animation | Apparition instantanee | :heavy_check_mark: |

**User's choice:** Pas d'animation
**Notes:** Zero complexite CSS supplementaire.

### Bouton fermeture

| Option | Description | Selected |
|--------|-------------|----------|
| Croix haut droite | Icone X (Lucide) dans cercle subtil | :heavy_check_mark: |
| Bouton texte "Fermer" | Lien texte discret | |
| Tu decides | Claude choisit | |

**User's choice:** Croix en haut a droite
**Notes:** Pattern classique e-commerce.

---

## Comportement mobile

### Scroll lock

| Option | Description | Selected |
|--------|-------------|----------|
| overflow:hidden sur body | Simple et efficace. iOS Safari flag dans STATE.md. | |
| Pas de scroll lock | Body scrollable derriere. UX degradee. | |
| Tu decides | Claude gere selon contraintes | :heavy_check_mark: |

**User's choice:** Tu decides
**Notes:** Claude a discretion sur l'approche scroll lock, avec attention particuliere pour iOS Safari.

### Swipe-down

| Option | Description | Selected |
|--------|-------------|----------|
| Non, pas de swipe | Fermeture bouton X, Escape, overlay uniquement | :heavy_check_mark: |
| Oui, swipe-down ferme | Geste natif mobile, code touch supplementaire | |
| Tu decides | Claude evalue | |

**User's choice:** Pas de swipe
**Notes:** Simple, pas de librairie gesture supplementaire.

---

## Claude's Discretion

- Scroll lock body (approche technique)
- Padding interne et espacement modal
- Breakpoint 90vw → plein ecran
- Style image et separateur

## Deferred Ideas

None — discussion stayed within phase scope
