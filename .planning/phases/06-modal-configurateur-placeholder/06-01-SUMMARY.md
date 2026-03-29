---
phase: 06-modal-configurateur-placeholder
plan: 01
subsystem: frontend-public
tags: [modal, configurator, dialog-natif, accessibility, tdd]
dependency_graph:
  requires:
    - Phase 04: ProductCard.tsx (onConfigure prop)
    - Phase 04: CatalogueClient.tsx (base à modifier)
    - Phase 05: CatalogueClient.tsx (recherche câblée)
  provides:
    - ConfiguratorModal.tsx (composant dialog natif réutilisable)
    - ConfiguratorModal.module.css (styles responsive 90vw/fullscreen)
    - CatalogueClient.tsx modifié (modal câblé)
  affects:
    - Phase 09 (configurateur réel viendra remplacer le placeholder)
tech_stack:
  added:
    - Native HTML dialog element (showModal/close API)
    - iOS scroll lock pattern (position:fixed)
  patterns:
    - TDD RED → GREEN (3 tâches)
    - ConfirmDialog pattern (useRef + useEffect dialog control)
    - Backdrop click via e.target === e.currentTarget
    - Focus restoration via triggerRef + setTimeout
key_files:
  created:
    - src/components/public/Catalogue/ConfiguratorModal.tsx
    - src/components/public/Catalogue/ConfiguratorModal.module.css
    - src/__tests__/ConfiguratorModal.test.tsx
  modified:
    - src/__tests__/setup.ts (HTMLDialogElement mocks)
    - src/components/public/Catalogue/CatalogueClient.tsx (câblage modal)
decisions:
  - "Dialog natif (pas Radix Dialog) — zero dépendance externe, focus trap natif via showModal + inert"
  - "return null APRÈS tous les hooks (React rules of hooks) — open = model !== null"
  - "Scroll lock iOS-safe via position:fixed + scrollY restore (pas overflow:hidden seul)"
  - "triggerRef.current?.focus() dans setTimeout(0) pour restauration focus async correcte"
metrics:
  duration: 150s
  completed_date: "2026-03-29"
  tasks_completed: 3
  files_created: 3
  files_modified: 2
---

# Phase 06 Plan 01: ConfiguratorModal dialog natif + câblage CatalogueClient Summary

**One-liner:** Dialog natif HTML avec teaser produit (image, prix, placeholder) câblé dans CatalogueClient via handleConfigure/handleModalClose avec focus restoration.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Mock dialog natif + tests RED MODAL-01/02/03 | ce59b48 | setup.ts, ConfiguratorModal.test.tsx |
| 2 | Créer ConfiguratorModal.tsx + module.css | fa5894f | ConfiguratorModal.tsx, ConfiguratorModal.module.css |
| 3 | Câbler CatalogueClient + vérification complète | c3ba2fe | CatalogueClient.tsx |

## What Was Built

Le composant `ConfiguratorModal` implémente un dialog HTML natif (`<dialog>`) avec :

- **Ouverture contrôlée** : `dialog.showModal()` / `dialog.close()` via useEffect synchronisé sur `open = model !== null`
- **Accessibilité** : `aria-modal="true"`, `role="dialog"`, `aria-labelledby="modal-title"`, bouton X avec `aria-label="Fermer le configurateur"`, `autoFocus` sur le bouton X
- **Fermeture** : bouton X (onClose), backdrop click (e.target === e.currentTarget), Escape natif (onClose sur event close)
- **Scroll lock iOS** : pattern `position:fixed + top: -scrollY` pour éviter le pitfall iOS Safari avec `overflow:hidden`
- **Teaser produit** : image (via next/image), h2 nom, prix formaté fr-FR, description, séparateur ambre, bloc placeholder "Configurateur à venir"
- **Responsive** : 90vw max 960px desktop, 2 colonnes (image + body) ≥640px, plein écran 100dvh < 640px

CatalogueClient modifié pour :
- Stocker le modèle sélectionné (`selectedModel` state) et le bouton déclencheur (`triggerRef`)
- Passer `handleConfigure` à chaque ProductCard (remplace `undefined`)
- Restaurer le focus sur le CTA déclencheur à la fermeture via `setTimeout(() => triggerRef.current?.focus(), 0)`

## Deviations from Plan

None — plan exécuté exactement comme spécifié.

## Known Stubs

Le bloc "Configurateur à venir" avec le texte "Bientôt, personnalisez tissu et couleur depuis cette page." est intentionnel — c'est le placeholder v8.0 explicitement spécifié par le plan. Le configurateur réel (sélection tissu, swatches, simulation IA) sera implémenté en Phase 09 (v9.0).

## Verification Results

- `npm test` : 70/70 tests verts (8 fichiers de tests)
- `npx tsc --noEmit` : zéro erreur TypeScript
- `npm run build` : build production sans erreur

## Self-Check: PASSED
