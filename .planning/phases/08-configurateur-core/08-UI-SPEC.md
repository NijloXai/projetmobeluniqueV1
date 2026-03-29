---
phase: 8
slug: configurateur-core
status: draft
shadcn_initialized: false
preset: none
created: 2026-03-29
---

# Phase 8 — UI Design Contract : Configurateur Core

> Contrat visuel et d'interaction pour la phase 08. Généré par gsd-ui-researcher.
> Sources : 08-CONTEXT.md (17 décisions verrouillées), globals.css (tokens existants), ConfiguratorModal.module.css (Phase 6), wireframe Section 5.

---

## Design System

| Propriété | Valeur | Source |
|-----------|--------|--------|
| Tool | none — CSS Modules uniquement | CLAUDE.md (convention projet — PAS de shadcn, PAS de Tailwind) |
| Preset | non applicable | CLAUDE.md |
| Component library | Radix UI (headless) — non utilisé dans cette phase | CLAUDE.md |
| Icon library | lucide-react — icône `X` déjà présente, aucune nouvelle icône requise | ConfiguratorModal.tsx existant |
| Font | Montserrat (400, 600) via `--font-family` | globals.css |

**Note shadcn gate :** Pas de `components.json`. Projet interdit shadcn/ui par convention — gate non applicable.

---

## Spacing Scale

Tokens déclarés dans `globals.css` — réutilisés tel quel. Aucun nouveau token.

| Token CSS | Valeur px | Usage dans cette phase |
|-----------|-----------|------------------------|
| `--spacing-xs` | 4px | Gap entre swatches dans la grille, gap icône/label du badge |
| `--spacing-sm` | 8px | Margin-top prix sous nom, gap entre ligne de prix et détail premium |
| `--spacing-md` | 16px | Padding interne de la grille de swatches, margin-top de la section swatches |
| `--spacing-lg` | 24px | Margin-top séparateur, padding du bloc prix, padding du CTA de sa zone |
| `--spacing-xl` | 32px | Margin-top de l'ensemble CTA Shopify |
| `--spacing-2xl` | 48px | Non utilisé dans cette phase |

**Exceptions :**

- Swatch cliquable : 56×56px (carré avec `--radius-md` 8px) — valeur hors échelle justifiée par la cible tactile (WCAG 2.5.5 ≥ 44px) et la lisibilité du motif tissu
- Bordure swatch sélectionné : 3px solid `--color-primary` avec offset de 2px (ring visible sans rogner l'image de swatch)
- Badge "Premium" sur swatch : hauteur 20px, padding horizontal 4px — compact, non intrusif, multiple de 4
- Badge "Photo originale" sur image principale : positionnement absolu en bas à gauche, padding 4px 8px

---

## Typography

Tokens de `globals.css`. Font : Montserrat. Règle stricte : 4 tailles, 2 weights.

| Rôle | Token CSS | Valeur | Weight | Line Height | Usage dans cette phase |
|------|-----------|--------|--------|-------------|------------------------|
| Body | `--font-size-base` | 16px (1rem) | 400 | 1.6 | Description du canapé (hérité Phase 6) |
| Label / Prix | `--font-size-sm` | 14px (0.875rem) | 600 | 1.5 | Prix exact, détail surcoût "+80 EUR tissu premium", label "Choisissez votre tissu" |
| Heading modal | `--font-size-xl` | 20px (1.25rem) | 600 | 1.2 | Nom du canapé `h2#modal-title` (hérité Phase 6) |
| Badge | `--font-size-xs` | 12px (0.75rem) | 600 | 1 | Badge "Premium" sur swatch, badge "Photo originale" sur image |

**Les 2 weights autorisés : 400 (régulier) + 600 (semibold). Aucun autre weight.**

---

## Color

Tokens de `globals.css`. Aucun nouveau token dans cette phase.

| Rôle | Token CSS | Valeur hex | Usage dans cette phase |
|------|-----------|------------|------------------------|
| Dominant (60%) | `--color-background` | `#FFFFFF` | Fond du modal, fond de la grille de swatches, fond du bloc prix |
| Secondary (30%) | `--color-background-alt` | `#F8F4EE` | Fond de la zone configurateur (remplace `.placeholder`) — tonal layering |
| Accent (10%) | `--color-primary` | `#E49400` | Bordure du swatch sélectionné, focus ring bouton X, séparateur `<hr>` |
| Muted | `--color-muted` | `#888888` | Détail surcoût tissu premium, label "Choisissez votre tissu" |
| Text | `--color-text` | `#1D1D1B` | Nom du canapé, prix exact (montant) |
| Badge Premium | `--color-primary` | `#E49400` | Fond badge "Premium" sur swatch (opacité 0.15) — texte `--color-primary-dark` |
| Badge Photo originale | rgba(0,0,0,0.55) | — | Fond badge "Photo originale" sur image — texte `#FFFFFF` |
| CTA Shopify | `--color-text` | `#1D1D1B` | Bouton outline, fond transparent, bordure `--color-text` |
| Destructive | `--color-error` | `#BA1A1A` | Non utilisé dans cette phase |

**Accent (`--color-primary`) réservé uniquement à :**
1. La bordure du swatch sélectionné (3px solid)
2. Le focus ring visible sur le bouton X (hérité Phase 6)
3. Le séparateur `<hr>` (hérité Phase 6, opacité 0.3)
4. Le fond du badge "Premium" (opacité 0.15, non saturé)

**Tonal layering (D-11, pattern établi) :** Pas de bordures pour les zones. La séparation entre le bloc métadonnées et le bloc configurateur s'effectue par contraste de fond (`#FFFFFF` → `#F8F4EE`).

---

## Copywriting Contract

Toutes les copies sont en français (convention projet CLAUDE.md).

| Élément | Copy exacte | Source |
|---------|-------------|--------|
| Label section swatches | "Choisissez votre tissu" | Wireframe Section 5 |
| Prix sans tissu sélectionné | "À partir de X XXX €" | CONTEXT.md D-11 (format existant, prefix conservé sans sélection) |
| Prix avec tissu standard sélectionné | "X XXX €" | CONTEXT.md D-11 (prix exact, sans prefix) |
| Prix avec tissu premium sélectionné | "X XXX €" (ligne) + "+ 80 € · tissu premium" (ligne secondaire) | CONTEXT.md D-11, D-12 |
| Badge sur swatch premium | "Premium" | REQUIREMENTS.md CONF-03 / CONTEXT.md D-06 |
| Badge sur image sans rendu IA | "Photo originale" | REQUIREMENTS.md CONF-05 / CONTEXT.md D-08 |
| CTA achat Shopify | "Acheter sur Shopify" | CONTEXT.md D-14, REQUIREMENTS.md CONF-09 |
| Aria-label CTA Shopify | "Acheter {model.name} sur Shopify — ouvre un nouvel onglet" | Accessibilité — target="_blank" requiert avertissement |
| État vide swatches (aucun tissu avec rendu publié pour ce modèle) | "Aucun tissu disponible pour ce modèle." | Défaut robuste — cas improbable mais possible |
| Alt image rendu IA | "Canapé {model.name} en tissu {fabric.name}" | Pattern existant ProductCard / ConfiguratorModal |
| Alt image fallback (photo originale) | "Canapé {model.name} — photo originale" | Pattern existant |

**Aucune action destructive dans cette phase.** Aucune confirmation requise.

**Absence d'état d'erreur réseau :** Toutes les données (fabrics, visuals) sont déjà en props — aucune requête réseau à l'ouverture (CONTEXT.md D-02). Le seul état d'erreur est l'image de rendu inaccessible — géré silencieusement par fallback natif `onError` sur `<Image>`.

---

## Interaction Contract

### Grille de swatches

| Comportement | Spécification |
|--------------|---------------|
| Layout | CSS Grid — `grid-template-columns: repeat(auto-fill, minmax(56px, 1fr))`, gap `--spacing-xs` (4px) |
| Swatch non sélectionné | 56×56px, `--radius-md` (8px), image `swatch_url` couvre tout le carré (object-fit cover), bordure transparente 3px |
| Swatch sélectionné | Bordure 3px solid `--color-primary`, ring `outline: 2px solid var(--color-primary)`, `outline-offset: 2px` |
| Swatch au hover | `box-shadow: var(--shadow-md)`, transition `--transition-fast` (300ms) |
| Badge Premium | Positionnement absolu en bas à droite du swatch, hauteur 20px, fond `rgba(228, 148, 0, 0.15)`, texte `--color-primary-dark`, `--font-size-xs` (12px), weight 600, `--radius-sm` (4px), padding 2px 4px |
| Accessibilité clavier | `role="radio"` sur chaque swatch, `role="radiogroup"` sur le conteneur, `aria-checked`, navigation Tab entre groupes + flèches entre swatches |
| `aria-label` swatch | `"{fabric.name}{isPremium ? ' — Premium' : ''}"` |
| Tissus sans `swatch_url` | Exclus de la grille (CONTEXT.md D-03) — invisibles |

### Changement d'image principale

| Comportement | Spécification |
|--------------|---------------|
| Ancre visuelle primaire | Image principale (colonne gauche, aspect-ratio 4/3, élément dominant de la vue configurateur) |
| Déclencheur | Clic sur un swatch — `setSelectedFabricId(fabric.id)` |
| Image affichée | `generated_image_url` du visual correspondant (model_id + fabric_id) |
| Fallback | Si aucun visual trouvé → `getPrimaryImage(model.model_images)` + badge "Photo originale" |
| Transition | Aucune — changement instantané (cohérent avec D-08 Phase 6 : pas d'animation) |
| Aspect-ratio | Maintenu 4/3 — conservé de Phase 6 (pas de saut de layout) |

### Prix dynamique

| Comportement | Spécification |
|--------------|---------------|
| État initial (aucun tissu sélectionné) | "À partir de X XXX €" — format `formatPrice()` local existant (Phase 6) |
| Tissu standard sélectionné | Prix exact via `calculatePrice(model.price, false)` puis `formatPrice()` — sans prefix |
| Tissu premium sélectionné | Ligne 1 : prix total `calculatePrice(model.price, true)` + `formatPrice()` — Ligne 2 : "+ 80 € · tissu premium" en `--font-size-sm` `--color-muted` |
| Mise à jour | Immédiate (state React local `useState`) — aucun debounce nécessaire |

### CTA Shopify

| Comportement | Spécification |
|--------------|---------------|
| Visible si | `model.shopify_url` est non null et non vide |
| Masqué si | `model.shopify_url` est null ou vide (CONTEXT.md D-15, REQUIREMENTS.md CONF-10) |
| Style | Bouton outline pleine largeur — fond transparent, bordure 1px solid `--color-text`, texte `--color-text`, weight 600, `--font-size-base` (16px), hauteur 48px, `--radius-md` (8px) |
| Action | `target="_blank"` + `rel="noopener noreferrer"` vers `model.shopify_url` |
| Hover | Fond `--color-text` (inverse), texte `--color-background`, transition `--transition-fast` |

---

## Structure des composants

| Fichier | Action | Justification |
|---------|--------|---------------|
| `src/components/public/Catalogue/ConfiguratorModal.tsx` | MODIFIER | Ajouter logique selection + swatches + prix + CTA |
| `src/components/public/Catalogue/ConfiguratorModal.module.css` | MODIFIER | Ajouter styles swatches, badges, prix dynamique, CTA Shopify |

**Composants non modifiés :** `CatalogueSection.tsx`, `CatalogueClient.tsx`, `ProductCard.tsx`, `ProductCardSkeleton.tsx`

---

## Registry Safety

| Registry | Blocs utilisés | Safety Gate |
|----------|----------------|-------------|
| shadcn officiel | aucun — projet n'utilise pas shadcn | non applicable |
| Tiers | aucun | non applicable |

**Aucune dépendance externe nouvelle.** Tout est disponible dans le projet : `lucide-react` (icône X déjà importée), `next/image`, CSS Modules, tokens `globals.css`, `calculatePrice`/`formatPrice` de `src/lib/utils.ts`.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
