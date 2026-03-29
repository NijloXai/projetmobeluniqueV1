---
phase: 6
slug: modal-configurateur-placeholder
status: draft
shadcn_initialized: false
preset: none
created: 2026-03-29
---

# Phase 6 — UI Design Contract : Modal Configurateur Placeholder

> Contrat visuel et d'interaction pour la phase 06. Généré par gsd-ui-researcher, vérifié par gsd-ui-checker.
> Sources : CONTEXT.md (14 décisions verrouillées), RESEARCH.md (patterns `<dialog>` natif), globals.css (tokens existants).

---

## Design System

| Propriété | Valeur | Source |
|-----------|--------|--------|
| Tool | none — CSS Modules uniquement | CLAUDE.md (convention projet) |
| Preset | non applicable | CLAUDE.md |
| Component library | Radix UI (headless) — non utilisé dans cette phase | CLAUDE.md |
| Icon library | lucide-react 1.7.0 — icône `X` pour bouton fermeture | CONTEXT.md D-09, RESEARCH.md |
| Font | Montserrat (400, 500, 600, 700) via `--font-family` | globals.css |

**Note shadcn gate :** Pas de `components.json`. Projet interdit shadcn/ui par convention — gate non applicable.

---

## Spacing Scale

Tokens déclarés dans `globals.css` — réutilisés tel quel :

| Token CSS | Valeur px | Usage dans cette phase |
|-----------|-----------|------------------------|
| `--spacing-xs` | 4px | Gaps entre icône et label dans le bouton X |
| `--spacing-sm` | 8px | Gap entre éléments inline (price tag) |
| `--spacing-md` | 16px | Padding interne body du modal, gap entre sections |
| `--spacing-lg` | 24px | Padding interne du `.content` wrapper (horizontal) |
| `--spacing-xl` | 32px | Padding interne du `.content` wrapper (vertical) |
| `--spacing-2xl` | 48px | Espace entre l'image et le bloc body sur desktop |
| `--spacing-section` | 112px | Non utilisé dans cette phase |

**Exceptions :**

- Bouton fermeture X : 40×40px (touch target minimum), centrage icône 20px — valeur hors échelle mais justifiée par accessibilité (WCAG 2.5.5 — 44px recommandé, 40px accepté pour desktop-first)
- Image dans le modal : aspect-ratio 4/3, max-height 320px desktop / hauteur libre mobile (contrainte par le conteneur)
- Breakpoint plein écran mobile : `max-width: 640px` (décision RESEARCH.md Pattern 6, cohérent avec les breakpoints existants du projet)

---

## Typography

Tous les tokens viennent de `globals.css`. Font : Montserrat.

| Rôle | Token CSS | Valeur | Weight | Line Height | Usage dans le modal |
|------|-----------|--------|--------|-------------|---------------------|
| Body | `--font-size-base` | 16px (1rem) | 400 | 1.6 (global) | Description du canapé, texte placeholder |
| Label / Prix | `--font-size-sm` | 14px (0.875rem) | 500 | 1.5 | Prix formaté (`à partir de X €`), meta labels |
| Heading modal | `--font-size-xl` | 20px (1.25rem) | 600 | 1.2 | Nom du canapé (`h2#modal-title`) |
| Heading placeholder | `--font-size-lg` | 18px (1.125rem) | 600 | 1.3 | "Configurateur à venir" (titre de section) |

**Règle stricte : 4 tailles maximum, 2 weights (400 régulier + 600 semibold). Le weight 500 est réservé au prix uniquement.**

---

## Color

Tokens déclarés dans `globals.css` — aucun nouveau token dans cette phase.

| Rôle | Token CSS | Valeur hex | Usage dans le modal |
|------|-----------|------------|---------------------|
| Dominant (60%) | `--color-background` | `#FFFFFF` | Fond du modal (`.dialog` background) |
| Secondary (30%) | `--color-background-alt` | `#F8F4EE` | Fond du bloc placeholder (section séparée) |
| Accent (10%) | `--color-primary` | `#E49400` | Bouton X au hover (ring focus visible), séparateur `<hr>` |
| Muted | `--color-muted` | `#888888` | Prix formaté, texte description, texte placeholder body |
| Text | `--color-text` | `#1D1D1B` | Nom du canapé (h2), titre "Configurateur à venir" |
| Backdrop | rgba(0, 0, 0, 0.5) | — | `dialog::backdrop` (RESEARCH.md Pattern 6) |
| Destructive | `--color-error` | `#BA1A1A` | Non utilisé dans cette phase |

**Accent réservé uniquement à :**
1. Le focus ring visible sur le bouton X (`outline: 2px solid var(--color-primary)`)
2. Le séparateur `<hr>` entre le contenu produit et le bloc placeholder
3. Le hover state du bouton X (fond circulaire `rgba(228, 148, 0, 0.1)`)

**Tonal layering (D-11) :** Pas de bordures. La séparation entre zones s'effectue par contraste de fond (`#FFFFFF` → `#F8F4EE`). Cohérent avec les phases 1–5.

---

## Copywriting Contract

Toutes les copies sont en français (convention projet CLAUDE.md).

| Élément | Copy exacte | Source |
|---------|-------------|--------|
| CTA déclencheur (ProductCard, déjà câblé) | "Configurer ce modèle" | ProductCard.tsx (existant) |
| Titre du modal (nom dynamique) | `{model.name}` — ex : "Canapé Élégance" | CONTEXT.md D-01 |
| Prix (format existant) | "à partir de X XXX €" via `Intl.NumberFormat('fr-FR')` | ProductCard.tsx `formatPrice()` |
| Titre section placeholder | "Configurateur à venir" | CONTEXT.md D-02 |
| Corps du placeholder | "Bientôt, personnalisez tissu et couleur depuis cette page." | CONTEXT.md D-02 (texte exact) |
| Aria-label bouton fermeture | "Fermer le configurateur" | RESEARCH.md (squelette ConfiguratorModal) |
| Alt image canapé | `Canapé {model.name}` | RESEARCH.md (squelette — cohérent avec ProductCard pattern) |
| État vide (modal sans image) | Icône `Sofa` 48px (lucide-react) — pas de texte alternatif visible | Pattern ProductCard existant |

**Absence d'état d'erreur dans cette phase :** Le modal est un placeholder statique. Aucune requête réseau n'est initiée à l'ouverture. L'image peut être absente — fallback géré par `getPrimaryImage()` (retourne `null` → section image masquée silencieusement).

**Aucune action destructive dans cette phase.**

---

## Interaction Contract

Décisions verrouillées issues de CONTEXT.md + RESEARCH.md.

### Ouverture du modal

| Déclencheur | Action | Résultat attendu |
|-------------|--------|-----------------|
| Clic "Configurer ce modèle" dans ProductCard | `handleConfigure(model)` dans CatalogueClient | `setSelectedModel(model)` → `dialog.showModal()` via `useEffect` |
| — | Scroll lock body | `position: fixed` + `top: -${scrollY}px` + `width: 100%` (iOS Safari safe) |
| — | Focus | `autoFocus` sur le bouton X (premier élément focusable) |

### Fermeture du modal

| Déclencheur | Action | Résultat attendu |
|-------------|--------|-----------------|
| Touche Escape | Natif `<dialog>` → déclenche événement `close` | `onClose()` → `setSelectedModel(null)` |
| Clic backdrop | `e.target === e.currentTarget` sur `<dialog>` | `onClose()` → `setSelectedModel(null)` |
| Clic bouton X | `onClick={onClose}` | `onClose()` → `setSelectedModel(null)` |
| Toutes fermetures | Restauration scroll | `window.scrollTo(0, parseInt(scrollY) * -1)` |
| Toutes fermetures | Retour focus | `setTimeout(() => triggerRef.current?.focus(), 0)` |

**Note D-08 :** Pas d'animation d'ouverture/fermeture — apparition instantanée. Aucune transition CSS sur le dialog.

### Focus trap

`showModal()` applique `inert` automatiquement sur tout le contenu hors du dialog. Le Tab-cycle manuel complexe n'est pas implémenté (anti-pattern RESEARCH.md). Le premier focus à l'ouverture est placé sur le bouton X via `autoFocus`.

### Taille et layout

| Contexte | Largeur | Hauteur | Rayon | Source |
|----------|---------|---------|-------|--------|
| Desktop (≥ 640px) | `90vw`, `max-width: 960px` | `max-height: 90vh`, `overflow-y: auto` | `--radius-xl` (16px) | CONTEXT.md D-10, RESEARCH.md Pattern 6 |
| Mobile (< 640px) | `100vw`, `max-width: 100vw` | `100dvh`, `max-height: 100dvh` | `0` (plein écran) | CONTEXT.md D-12, RESEARCH.md Pattern 6 |

**Layout interne (desktop) :** Deux colonnes — image à gauche (ratio 4/3, ~50% de largeur), métadonnées + placeholder à droite (~50%). Sur mobile : colonne unique, image en haut, métadonnées en bas.

### Scroll

- Le contenu du modal défile via `.content` wrapper (pas `.dialog` lui-même) pour éviter le pitfall des scrollbars (RESEARCH.md Pitfall 2)
- Sur mobile plein écran : `.content` a `overflow-y: auto` et `height: 100%` (RESEARCH.md Pitfall 4)

---

## Structure des composants

| Fichier | Action | Justification |
|---------|--------|---------------|
| `src/components/public/Catalogue/ConfiguratorModal.tsx` | CRÉER | Nouveau composant modal |
| `src/components/public/Catalogue/ConfiguratorModal.module.css` | CRÉER | CSS Modules dédié (convention CLAUDE.md) |
| `src/components/public/Catalogue/CatalogueClient.tsx` | MODIFIER | Câbler `onConfigure`, état `selectedModel`, `triggerRef` |

**Composants existants non modifiés :** `ProductCard.tsx`, `CatalogueSection.tsx`, `ProductCardSkeleton.tsx`

---

## Registry Safety

| Registry | Blocs utilisés | Safety Gate |
|----------|----------------|-------------|
| shadcn officiel | aucun — projet n'utilise pas shadcn | non applicable |
| Tiers | aucun | non applicable |

**Aucune dépendance externe nouvelle.** Tout est disponible dans le projet : `lucide-react` (icône X), `next/image`, `<dialog>` natif, CSS Modules, tokens `globals.css`.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
