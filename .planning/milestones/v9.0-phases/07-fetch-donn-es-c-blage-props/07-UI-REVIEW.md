---
phase: 07
slug: fetch-donn-es-c-blage-props
audited: 2026-03-29
baseline: UI-SPEC.md (approuve)
screenshots: captures (localhost:3000 actif)
---

# Phase 07 — UI Review

**Audite:** 2026-03-29
**Baseline:** UI-SPEC.md — contrat de design Phase 7
**Screenshots:** captures (.planning/ui-reviews/07-20260329-170002/)

---

## Pillar Scores

| Pilier | Score | Finding principal |
|--------|-------|-------------------|
| 1. Copywriting | 4/4 | Toutes les 7 copies du contrat sont conformes et inchangees |
| 2. Visuals | 4/4 | Aucun changement UI visible requis — rendu identique a Phase 6 confirme |
| 3. Color | 4/4 | Tokens CSS exclusifs dans les fichiers Phase 7 ; Hero.module.css (hors perimetre) contient des hex bruts |
| 4. Typography | 2/4 | font-weight: 700 (sectionTitle) et font-weight: 500 (resetButton) non autorises par la spec Phase 7 |
| 5. Spacing | 3/4 | padding-left: 2.5rem (40px) dans la barre de recherche — valeur hors echelle de tokens |
| 6. Experience Design | 4/4 | Couverture complete : skeleton, erreur 3-fetches, vide catalogue, vide recherche, gestion focus |

**Total : 21/24**

---

## Top 3 Priority Fixes

1. **font-weight: 700 sur .sectionTitle** — Viole la spec Phase 7 (poids autorises : 400 et 600 uniquement) — remplacer `font-weight: 700` par `font-weight: 600` dans `CatalogueSection.module.css` ligne 25.

2. **font-weight: 500 sur .resetButton** — Poids 500 non declare dans la spec Phase 7 — remplacer `font-weight: 500` par `font-weight: 600` dans `CatalogueSection.module.css` ligne 182.

3. **padding-left: 2.5rem hors echelle** — La valeur 40px n'existe pas dans le systeme de tokens (`--spacing-md` = 16px, `--spacing-lg` = 24px, `--spacing-xl` = 32px) — remplacer `padding-left: 2.5rem` par `padding-left: var(--spacing-xl)` (32px) dans `CatalogueSection.module.css` ligne 115, ou ajouter un token `--spacing-input-icon: 2.5rem` dans globals.css si la valeur 40px est intentionnelle.

---

## Detailed Findings

### Pilier 1 : Copywriting (4/4)

Toutes les copies du contrat UI-SPEC.md sont presentes et inchangees dans les fichiers modifies par Phase 7.

| Copie attendue | Fichier | Ligne | Statut |
|----------------|---------|-------|--------|
| "Impossible de charger les produits. Veuillez rafraichir la page." | CatalogueSection.tsx | 35 | PASS |
| "Nos canapes arrivent bientot." | CatalogueClient.tsx | 68 | PASS |
| "Aucun canape ne correspond a \"{query}\"" | CatalogueClient.tsx | 123 | PASS |
| "Effacer la recherche" | CatalogueClient.tsx | 130 | PASS |
| "Configurateur a venir" | ConfiguratorModal.tsx | 116 | PASS |
| "Bientot, personnalisez tissu et couleur depuis cette page." | ConfiguratorModal.tsx | 118 | PASS |
| aria-label "Fermer le configurateur" | ConfiguratorModal.tsx | 89 | PASS |

La condition d'erreur couvre correctement les 3 fetches : `modelsResult.error || fabricsResult.error || visualsResult.error` (CatalogueSection.tsx ligne 30). Aucun label generique anglophone detecte dans les composants publics.

---

### Pilier 2 : Visuals (4/4)

La spec Phase 7 declare explicitement : "aucune modification visuelle en Phase 7, layout inchange". Le rendu observe confirme cette garantie.

Screenshots fullpage (1440px) : le hero noir est suivi d'une section "Comment ca marche" (fond beige), puis la grille catalogue avec 3 skeleton loaders. Les skeleton loaders sont correctement rendus (ProductCardSkeleton.tsx) indiquant que le composant est bien charge via Suspense.

Le modal ConfiguratorModal affiche le placeholder "Configurateur a venir" avec le corps de texte conforme. La hierarchie visuelle (nom canape h2 > prix > description > separateur > placeholder) est intacte.

Note : le screenshot desktop 1440px sans scroll affiche le hero sans texte hero visible — le hero text est rendu uniquement sur la moitie inferieure de la viewport (confirme en mobile et tablet). Ce comportement est pre-existant a Phase 7, hors perimetre de cet audit.

---

### Pilier 3 : Couleur (4/4)

**Fichiers Phase 7 modifies** (CatalogueSection.module.css, ConfiguratorModal.module.css) : utilisation exclusive de tokens CSS custom. Zero couleur hex brute.

Usage de l'accent dans les fichiers Phase 7 :
- `var(--color-primary)` : focus ring barre recherche (box-shadow ligne 126), hover clearButton (ligne 191/195), outline resetButton (ligne 195) dans CatalogueSection.module.css
- `var(--color-primary)` : outline focus closeButton (ligne 52), separateur hr (ligne 106) dans ConfiguratorModal.module.css

Accent conforme a la spec (separateur + outline focus uniquement).

**Hors perimetre Phase 7** (note pour suivi futur) : Hero.module.css contient `#2C2418` (ligne 9) et `rgba(228, 148, 0, 0.9)` (ligne 41). Ces valeurs hardcodees precedent Phase 7 et seront a corriger en tokenisant vers `--color-primary`.

---

### Pilier 4 : Typographie (2/4)

La spec Phase 7 autorise deux poids uniquement : **400** (regular) et **600** (semibold).

**Violations detectees dans les fichiers Phase 7 :**

| Fichier | Ligne | Classe | Valeur | Attendu |
|---------|-------|--------|--------|---------|
| CatalogueSection.module.css | 25 | `.sectionTitle` | `font-weight: 700` | `font-weight: 600` |
| CatalogueSection.module.css | 182 | `.resetButton` | `font-weight: 500` | `font-weight: 600` |

Ces deux fichiers CSS ne font pas partie des fichiers crees en Phase 7 (ils existaient depuis Phase 4/5) mais la spec Phase 7 stipule : "Poids declares : 400 (regular) et 600 (semibold). Aucun autre poids autorise en Phase 7." — cela s'applique a tous les composants actifs.

**ConfiguratorModal.module.css : conforme.** Poids utilises : 600 (modelName ligne 80, price ligne 89, placeholderTitle ligne 120) et 400 (description via weight non specifie herite de 400).

Tailles de police utilisees dans les composants Phase 7 : `--font-size-xs`, `--font-size-sm`, `--font-size-base`, `--font-size-lg`, `--font-size-xl`, `--font-size-2xl`, `--font-size-3xl`, `--font-size-display` — 8 tailles distinctes au total sur l'ensemble public (depassement de la recommendation 4 tailles max mais tokens CSS, pas de valeurs brutes).

---

### Pilier 5 : Espacement (3/4)

**L'echelle de tokens est correctement utilisee** dans la majorite des declarations : `--spacing-xs` (x3), `--spacing-sm` (x10), `--spacing-md` (x18), `--spacing-lg` (x7), `--spacing-xl` (x7), `--spacing-2xl` (x4), `--spacing-section` (x10).

**Anomalie detectee :**

| Fichier | Ligne | Declaration | Statut |
|---------|-------|-------------|--------|
| CatalogueSection.module.css | 115 | `padding-left: 2.5rem` | Hors echelle (40px — pas de token correspondant) |

Cette valeur compense l'offset de l'icone de recherche dans le champ input. Elle est intentionnelle (commentee `/* 40px — espace pour l'icone loupe */`) mais non tokenisee. La valeur la plus proche est `--spacing-xl` (32px) ou `--spacing-2xl` (48px). Un token dedicace `--input-icon-offset` serait propre, sinon utiliser `--spacing-xl` (32px) est acceptable.

**Hors perimetre Phase 7** : Hero.module.css lignes 43 et 77 utilisent `padding: 8px 16px` et `padding: 16px 32px` en px bruts equivalents aux tokens mais non references via les variables CSS.

---

### Pilier 6 : Experience Design (4/4)

Couverture des etats comprehensive :

**Etat de chargement :** `ProductCardSkeleton` / `CatalogueSkeletonGrid` — composants dedies avec animation, 3 placeholders cards affichees (confirme en screenshot fullpage).

**Etat d'erreur :** CatalogueSection.tsx ligne 30-40 — message "Impossible de charger les produits" declenche si l'un des 3 fetches Promise.all echoue (modelsResult.error || fabricsResult.error || visualsResult.error). Couverture totale correcte.

**Etats vides :**
- Catalogue vide (aucun modele Supabase) : CatalogueClient.tsx ligne 64-71
- Recherche sans resultats : CatalogueClient.tsx ligne 119-132 avec CTA "Effacer la recherche"
- Image produit absente : ProductCard.tsx et ConfiguratorModal.tsx — guard `if (model_images.length === 0) return null`

**Gestion du focus :**
- `autoFocus` sur le bouton fermeture a l'ouverture du modal (ConfiguratorModal.tsx ligne 90)
- Restauration focus au declencheur a la fermeture via `triggerRef` + `setTimeout(() => triggerRef.current?.focus(), 0)` (CatalogueClient.tsx lignes 30, 52, 60)
- Scroll lock iOS-safe via pattern `position:fixed` avec sauvegarde/restauration `scrollY` (ConfiguratorModal.tsx lignes 33-46)

**Props obligatoires (sans ?) :** `fabrics: Fabric[]` et `visuals: VisualWithFabricAndImage[]` declares obligatoires dans ConfiguratorModal — previent les erreurs `undefined.filter is not a function` en Phase 8. Verification TypeScript : `npx tsc --noEmit` passe (confirme dans le SUMMARY).

**Prefixe underscore conforme :** `fabrics: _fabrics, visuals: _visuals` dans la destructuration (ConfiguratorModal.tsx ligne 27) — satisfait le linter sans supprimer les declarations de props, avec commentaire explicatif ligne 28.

---

## Registry Safety

shadcn non initialise (components.json absent). Audit registre non applicable.

---

## Files Audited

- `src/types/database.ts` (lignes 200-219) — Type VisualWithFabricAndImage
- `src/components/public/Catalogue/CatalogueSection.tsx` — Promise.all + filtrage JS
- `src/components/public/Catalogue/CatalogueSection.module.css` — typographie et espacement
- `src/components/public/Catalogue/CatalogueClient.tsx` — props drilling + etats
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — interface etendue + placeholder
- `src/components/public/Catalogue/ConfiguratorModal.module.css` — tokens couleur et typographie
- `src/components/public/Catalogue/ProductCardSkeleton.tsx` — loading state
- `src/app/globals.css` (lignes 1-80) — design tokens de reference
- Screenshots : `.planning/ui-reviews/07-20260329-170002/` (desktop, mobile, tablet, fullpage x2)
