# Phase 6 : Modal configurateur placeholder — Research

**Researched:** 2026-03-29
**Domain:** HTML `<dialog>` natif, accessibilité modal, scroll lock iOS Safari
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Le modal affiche l'image principale du canapé (logique `getPrimaryImage`), le nom, le prix formaté, et la description du modèle
- **D-02:** Sous un séparateur, un message "Configurateur à venir" avec texte : "Bientôt, personnalisez tissu et couleur depuis cette page."
- **D-03:** Le modèle sélectionné est passé via le callback `onConfigure` déjà câblé (prop `ModelWithImages`)
- **D-04:** Utiliser `<dialog>` natif avec `showModal()` — cohérent avec ConfirmDialog admin existant
- **D-05:** Focus trap manuel : piéger le focus dans le modal tant qu'il est ouvert (Tab/Shift+Tab cyclent entre les éléments focusables)
- **D-06:** Retour du focus au CTA déclencheur à la fermeture du modal
- **D-07:** `aria-modal="true"` et `role="dialog"` sur l'élément `<dialog>`
- **D-08:** Pas d'animation d'ouverture/fermeture — apparition instantanée
- **D-09:** Bouton de fermeture : icône X (Lucide `X`) dans un cercle subtil, positionné en haut à droite
- **D-10:** Taille : 90vw desktop avec max-width raisonnable, plein écran (100vw/100vh) mobile
- **D-11:** Fond blanc, tonal layering (pas de bordures), ombre large. Backdrop semi-transparent
- **D-12:** Plein écran sur mobile (< 640px) — le modal occupe tout l'écran
- **D-13:** Pas de swipe-down pour fermer — fermeture par bouton X, Escape ou clic overlay uniquement
- **D-14:** Fermeture via touche Escape (natif avec `<dialog>`)

### Claude's Discretion

- Scroll lock body quand le modal est ouvert (overflow:hidden ou autre approche selon contraintes iOS Safari)
- Padding interne et espacement des éléments dans le modal
- Breakpoint exact pour le switch 90vw → plein écran
- Taille et style exact de l'image dans le modal (aspect-ratio, max-height)
- Style du séparateur entre le contenu produit et le message placeholder

### Deferred Ideas (OUT OF SCOPE)

Aucune idée différée — la discussion est restée dans le scope de la phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MODAL-01 | Le CTA "Configurer ce modèle" ouvre un modal large (90vw desktop, plein écran mobile) | Pattern `<dialog>` natif, CSS responsive breakpoint 640px |
| MODAL-02 | Le modal est accessible (focus trap, fermeture Escape, aria-modal) | `showModal()` applique `inert` nativement — focus containment garanti ; Escape natif ; `aria-labelledby` sur heading |
| MODAL-03 | Le modal affiche un placeholder "Configurateur à venir" avec le nom du canapé sélectionné | Réutilise `getPrimaryImage`, `formatPrice`, `ModelWithImages` depuis les composants existants |
</phase_requirements>

---

## Summary

La phase 6 est une tâche d'implémentation focalisée : un nouveau composant `ConfiguratorModal` basé sur `<dialog>` natif, câblé depuis `CatalogueClient`. Le pattern est déjà établi dans le projet via `ConfirmDialog` — l'adaptation principale est la taille (90vw/plein écran), le contenu riche (image + métadonnées produit), et la gestion du backdrop click.

Point critique découvert : `showModal()` applique automatiquement l'attribut `inert` à tout le contenu de la page hors du dialog. Le focus trap est donc **natif et automatique** — il ne faut pas implémenter un Tab-cycle manuel au sens complexe. Ce qui est requis par D-05/D-06 est : stocker la ref du déclencheur avant ouverture et restaurer le focus explicitement à la fermeture (car les navigateurs le font automatiquement sauf si l'implémentation React gère le state de façon asynchrone).

Pour le scroll lock, la solution CSS-only `:has(dialog[open])` est élégante mais iOS Safari a un bug persistant sur `overflow: hidden` sur `body`. La recommandation est `position: fixed` sur le body avec restauration du scroll position — ou `overscroll-behavior: contain` sur le `<dialog>` lui-même (support Chrome 144+ uniquement, mars 2026). Décision : approche `position: fixed` pour fiabilité maximale iOS.

**Recommandation primaire :** Nouveau composant `ConfiguratorModal` dans `src/components/public/Catalogue/`, adapté depuis le pattern `ConfirmDialog`, avec CSS Modules dédié. `CatalogueClient` gère l'état `selectedModel | null`.

---

## Standard Stack

### Core

| Bibliothèque | Version | Rôle | Statut projet |
|---|---|---|---|
| `<dialog>` natif HTML | N/A | Élément modal accessible | Déjà utilisé (ConfirmDialog) |
| `useRef<HTMLDialogElement>` | React 19 | Contrôle `showModal()` / `close()` | Pattern établi |
| `useRef<HTMLButtonElement>` | React 19 | Stocker ref du déclencheur pour retour focus | Nouveau dans ce composant |
| `lucide-react` | 1.7.0 (installé) | Icône `X` pour bouton fermeture | Déjà installé |
| `next/image` | Next.js 16.2.1 | Image canapé dans le modal | Déjà utilisé dans ProductCard |
| CSS Modules | N/A | `ConfiguratorModal.module.css` | Convention projet obligatoire |

### Pas de nouvelles dépendances

Aucune installation requise. Tout est disponible dans le projet.

---

## Architecture Patterns

### Structure des fichiers à créer/modifier

```
src/components/public/Catalogue/
├── ConfiguratorModal.tsx           ← NOUVEAU composant
├── ConfiguratorModal.module.css    ← NOUVEAU styles
└── CatalogueClient.tsx             ← MODIFIER : wire onConfigure + état modal
```

### Pattern 1 : Contrôle du `<dialog>` via useRef + useEffect

Identique à `ConfirmDialog` existant. Le state React (`selectedModel`) pilote le dialog via `useEffect`.

```typescript
// Source : src/components/admin/ConfirmDialog.tsx (pattern établi)
const dialogRef = useRef<HTMLDialogElement>(null)

useEffect(() => {
  const dialog = dialogRef.current
  if (!dialog) return
  if (open && !dialog.open) {
    dialog.showModal()
  } else if (!open && dialog.open) {
    dialog.close()
  }
}, [open])
```

### Pattern 2 : Retour du focus au déclencheur (D-06)

`showModal()` restitue normalement le focus automatiquement. Dans un contexte React où le state change asynchroneusement, un `ref` explicite sur le bouton déclencheur est plus fiable. Stocker la ref dans `CatalogueClient` et la passer au handler de fermeture.

```typescript
// Dans CatalogueClient
const triggerRef = useRef<HTMLButtonElement | null>(null)

function handleConfigure(model: ModelWithImages, triggerEl: HTMLButtonElement) {
  triggerRef.current = triggerEl
  setSelectedModel(model)
}

function handleClose() {
  setSelectedModel(null)
  // Restitution explicite après que le dialog est fermé
  setTimeout(() => triggerRef.current?.focus(), 0)
}
```

**Note :** L'approche `setTimeout(..., 0)` donne le temps au navigateur de retirer le dialog du DOM avant de déplacer le focus. Alternative : utiliser l'événement `close` du dialog.

### Pattern 3 : Fermeture au clic sur le backdrop

Le `<dialog>` ne ferme pas nativement au clic backdrop. Le pattern établi (web.dev) est d'écouter le click sur l'élément `<dialog>` lui-même — un click sur le backdrop est enregistré comme click sur `<dialog>` (pas sur son contenu).

```typescript
// Source : https://web.dev/articles/building/a-dialog-component
function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
  if (e.target === e.currentTarget) {
    onClose()
  }
}

// Dans le JSX :
<dialog ref={dialogRef} onClick={handleDialogClick} onClose={onClose}>
  <div className={styles.content}>
    {/* tout le contenu dans un wrapper — les clics ne remontent pas jusqu'à <dialog> */}
  </div>
</dialog>
```

**Important :** Le contenu du modal DOIT être dans un `div` wrapper intermédiaire. Sans ce wrapper, un click à l'intérieur du modal peut se propager jusqu'à `<dialog>` et déclencher la fermeture.

### Pattern 4 : Scroll lock body

**Décision pour la discrétion Claude :** `position: fixed` sur le body est la solution la plus fiable pour iOS Safari.

```typescript
// Approche CSS-only (marche partout SAUF iOS Safari avec overflow:hidden)
// html:has(dialog[open]) { overflow: hidden; }  ← ÉVITER, non fiable iOS

// Approche JS — fiable iOS Safari
useEffect(() => {
  if (open) {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
  } else {
    const scrollY = document.body.style.top
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    window.scrollTo(0, parseInt(scrollY || '0') * -1)
  }
}, [open])
```

Alternative plus simple si iOS Safari n'est pas une priorité de test immédiate (le blocker est noté dans STATE.md) : `document.body.style.overflow = open ? 'hidden' : ''`. Fonctionne sur desktop et Android, potentiellement défaillant sur iPhone physique.

**Recommandation :** Implémenter la solution `position: fixed` complète dès maintenant pour éviter la dette.

### Pattern 5 : `aria-labelledby` et accessibilité

```typescript
// <dialog> natif avec showModal() fournit déjà :
// - role="dialog" implicite
// - aria-modal="true" implicite (via showModal)
// - inert sur le reste de la page

// Ajouter explicitement (D-07 requiert les deux explicitement) :
<dialog
  ref={dialogRef}
  aria-modal="true"
  aria-labelledby="modal-title"
  role="dialog"
  className={styles.dialog}
>
  <h2 id="modal-title" className={styles.title}>{model.name}</h2>
```

**Note :** `showModal()` applique déjà `aria-modal` implicitement, mais le mettre explicitement (D-07) est défensif et correct.

### Pattern 6 : Taille responsive (D-10, D-12)

```css
/* ConfiguratorModal.module.css */
.dialog {
  border: none;
  padding: 0;
  width: 90vw;
  max-width: 960px;
  max-height: 90vh;
  border-radius: var(--radius-xl);
  box-shadow: 0 24px 80px rgba(28, 28, 26, 0.16);
  background: var(--color-background);
  overflow-y: auto;
}

.dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

/* Plein écran mobile — breakpoint 640px (décision Claude) */
@media (max-width: 640px) {
  .dialog {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    margin: 0;
  }
}
```

**Note :** `100dvh` (dynamic viewport height) est préférable à `100vh` sur mobile pour tenir compte des barres d'adresse rétractables Safari. Supporté iOS Safari 15.4+.

### Anti-Patterns à éviter

- **Ne PAS implémenter un Tab-cycle manuel complexe :** `showModal()` rend `inert` le reste de la page — le focus est naturellement contenu. Un Tab-cycle manuel redondant peut créer des conflits.
- **Ne PAS utiliser `overflow: hidden` seul sur `body` pour le scroll lock :** Bug iOS Safari documenté depuis des années.
- **Ne PAS omettre le wrapper `div` autour du contenu :** Sans lui, les clics internes propagent jusqu'à `<dialog>` et ferment le modal via le backdrop-click handler.
- **Ne PAS utiliser `dialog.close()` dans le handler `onClose` de `<dialog>` :** Crée une double fermeture. Le `onClose` (événement `close`) signale que le dialog est déjà fermé — synchroniser le state React, ne pas rappeler `close()`.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser plutôt | Pourquoi |
|---|---|---|---|
| Focus containment | Implémentation Tab-cycle complète | `showModal()` natif + `inert` auto | Le navigateur fait déjà ce travail depuis 2022 |
| Fermeture Escape | Listener `keydown` sur `Escape` | Événement `close` natif du `<dialog>` | `showModal()` gère Escape nativement, déclenche `onClose` |
| Icône de fermeture | SVG custom | `import { X } from 'lucide-react'` | Déjà installé, cohérence avec le projet |
| Formatage prix | Fonction custom | `formatPrice()` de `ProductCard` | Déjà implémenté, Intl.NumberFormat fr-FR |
| Sélection image principale | Logique custom | `getPrimaryImage()` de `ProductCard` | Déjà implémenté, prioritise view_type '3/4' |
| Animation d'entrée | transition CSS | Aucune (D-08 : apparition instantanée) | Décision locked |

---

## Common Pitfalls

### Pitfall 1 : Double-close au Escape

**Ce qui se passe :** `<dialog>` ferme nativement via Escape et déclenche l'événement `close`. Si le code gère aussi `onClose` comme un appel à `dialog.close()`, il y a une tentative de fermeture sur un dialog déjà fermé.
**Pourquoi :** L'événement `close` du `<dialog>` signifie "le dialog vient d'être fermé" — pas "fermer le dialog".
**Comment éviter :** Dans `onClose` (handler de l'événement `close`), mettre à jour uniquement le state React (`setSelectedModel(null)`). Ne jamais appeler `dialog.close()` depuis ce handler.

### Pitfall 2 : Le backdrop click ferme sur les scrollbars internes

**Ce qui se passe :** La technique `e.target === e.currentTarget` pour détecter le backdrop click peut déclencher faussement si le `<dialog>` a un overflow scroll et que l'utilisateur clique sur la scrollbar.
**Pourquoi :** Les scrollbars sont techniquement sur l'élément `<dialog>`, pas sur le contenu wrapper.
**Comment éviter :** S'assurer que le scroll est sur le wrapper interne (`.content`), pas sur `.dialog` lui-même. Ou utiliser `getBoundingClientRect()` pour vérifier si le click est réellement en dehors des bounds du contenu.

### Pitfall 3 : Focus non restitué sur mobile

**Ce qui se passe :** Sur iOS Safari, le focus peut ne pas revenir sur le bouton déclencheur à la fermeture du modal.
**Pourquoi :** Safari a un comportement différent pour le focus sur les éléments non-input.
**Comment éviter :** Le bouton CTA doit avoir `tabIndex={0}` (implicite pour `<button>`). La restitution via `setTimeout(..., 0)` après `setSelectedModel(null)` est le pattern fiable.

### Pitfall 4 : `max-height` sans `overflow-y` sur mobile plein écran

**Ce qui se passe :** Si le contenu dépasse la hauteur de l'écran mobile et que `overflow-y` n'est pas défini, le contenu est tronqué ou le modal déborde.
**Pourquoi :** `100dvh` fixe la hauteur mais sans `overflow-y: auto`, le contenu interne ne scroll pas.
**Comment éviter :** Sur le breakpoint mobile, le wrapper `.content` doit avoir `overflow-y: auto` et `height: 100%`.

### Pitfall 5 : `position: fixed` scroll lock décale la page

**Ce qui se passe :** Quand `body` passe à `position: fixed`, la page saute au top (scroll position perdu).
**Pourquoi :** `position: fixed` retire l'élément du flux normal, la position de scroll est perdue.
**Comment éviter :** Stocker `window.scrollY` avant d'appliquer `position: fixed`, l'utiliser comme `body.style.top = -scrollY + 'px'`. À la fermeture, restaurer avec `window.scrollTo(0, scrollY)`.

---

## Code Examples

### Squelette ConfiguratorModal

```typescript
// src/components/public/Catalogue/ConfiguratorModal.tsx
'use client'

import { useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { ModelWithImages, ModelImage } from '@/types/database'
import styles from './ConfiguratorModal.module.css'

// Réutilise la logique de ProductCard
function getPrimaryImage(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const image34 = model_images.find((img) => img.view_type === '3/4')
  if (image34) return image34.image_url
  return model_images[0].image_url
}

function formatPrice(price: number): string {
  return 'à partir de ' + new Intl.NumberFormat('fr-FR').format(price) + ' €'
}

interface ConfiguratorModalProps {
  model: ModelWithImages | null
  onClose: () => void
}

export function ConfiguratorModal({ model, onClose }: ConfiguratorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = model !== null

  // Scroll lock iOS-safe
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
  }, [open])

  // Contrôle showModal / close
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Backdrop click : e.target === <dialog> (pas son contenu)
  const handleDialogClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!model) return null

  const imageUrl = getPrimaryImage(model.model_images)

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={handleDialogClick}
    >
      <div className={styles.content}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer le configurateur"
          autoFocus
        >
          <X size={20} aria-hidden="true" />
        </button>
        {/* Image produit */}
        {imageUrl && (
          <div className={styles.imageWrapper}>
            <Image
              src={imageUrl}
              alt={`Canapé ${model.name}`}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
        )}
        {/* Métadonnées */}
        <div className={styles.body}>
          <h2 id="modal-title" className={styles.modelName}>{model.name}</h2>
          <p className={styles.price}>{formatPrice(model.price)}</p>
          {model.description && (
            <p className={styles.description}>{model.description}</p>
          )}
          {/* Séparateur + message placeholder */}
          <hr className={styles.separator} />
          <div className={styles.placeholder}>
            <p className={styles.placeholderTitle}>Configurateur à venir</p>
            <p className={styles.placeholderText}>
              Bientôt, personnalisez tissu et couleur depuis cette page.
            </p>
          </div>
        </div>
      </div>
    </dialog>
  )
}
```

### Modification CatalogueClient

```typescript
// Ajouts dans CatalogueClient.tsx
// Source : logique locale, pattern React standard

const [selectedModel, setSelectedModel] = useState<ModelWithImages | null>(null)
const triggerRef = useRef<HTMLButtonElement | null>(null)

function handleConfigure(model: ModelWithImages) {
  setSelectedModel(model)
  // Note: stocker le déclencheur nécessite de passer l'event depuis ProductCard
  // Alternative simple : utiliser l'événement natif close du dialog
}

function handleModalClose() {
  setSelectedModel(null)
  // Restitution focus — le dialog close event déclenche ceci après fermeture
  setTimeout(() => triggerRef.current?.focus(), 0)
}

// Dans le JSX, remplacer onConfigure={undefined} par :
<ProductCard
  key={model.id}
  model={model}
  onConfigure={handleConfigure}
/>

// Ajouter en dehors de la grille :
<ConfiguratorModal model={selectedModel} onClose={handleModalClose} />
```

---

## State of the Art

| Ancienne approche | Approche actuelle | Depuis | Impact |
|---|---|---|---|
| Focus trap JS manuel (Tab-cycle) | `showModal()` + `inert` natif | 2022 (Chrome/FF/Safari) | Pas besoin d'implémenter Tab-cycle complet |
| `overflow: hidden` sur body pour scroll lock | `position: fixed` + restauration scroll | Long terme | Fiabilité iOS Safari |
| Librairies modal (React Modal, Radix Dialog) | `<dialog>` natif | 2022-2023 | Zéro dépendance externe pour modals simples |
| `closedby="any"` pour backdrop click | Click handler JS `e.target === e.currentTarget` | `closedby` pas encore Safari | JS reste nécessaire en 2025 pour Safari |
| `100vh` sur mobile | `100dvh` (dynamic viewport height) | iOS Safari 15.4+ | Corrige le problème barre d'adresse |

**Deprecié / à éviter :**
- `polyfill dialog` (dialog-polyfill) : obsolète, tous les navigateurs supportent `<dialog>` nativement depuis 2022.
- `aria-hidden="true"` sur le fond (ancienne approche) : remplacé par `inert` appliqué automatiquement par `showModal()`.

---

## Open Questions

1. **Retour focus complexe si ProductCard ne passe pas la ref du bouton**
   - Ce que l'on sait : `ProductCard.onConfigure` ne passe actuellement que `model`, pas l'élément déclencheur
   - Ce qui est flou : Faut-il modifier la signature de `onConfigure` pour passer `(model, e)` ou utiliser une autre approche ?
   - Recommandation : Utiliser l'événement natif `close` du `<dialog>` — le navigateur restitue automatiquement le focus à l'élément qui a déclenché `showModal()` dans les navigateurs modernes. Si insuffisant, stocker le `document.activeElement` avant l'ouverture dans `CatalogueClient`.

2. **iOS Safari scroll lock — test sur appareil physique**
   - Ce que l'on sait : Bug documenté dans STATE.md comme blocker pour la phase 6
   - Ce qui est flou : L'approche `position: fixed` résout-elle 100% des cas sur iPhone ?
   - Recommandation : Implémenter `position: fixed` (plus fiable que `overflow: hidden`). Marquer comme "à valider sur iPhone physique" dans le plan.

---

## Environment Availability

Aucune dépendance externe nouvelle pour cette phase. Tout est disponible dans le projet :

| Dépendance | Disponible | Version | Note |
|---|---|---|---|
| `lucide-react` | Oui | 1.7.0 | Icône `X` prête à l'emploi |
| `next/image` | Oui | Next.js 16.2.1 | `remotePatterns` configuré (Phase 4) |
| TypeScript strict | Oui | 5.x | Aucun `any` |
| `<dialog>` natif | Oui | Tous navigateurs modernes (Chrome 37+, Safari 15.4+, FF 98+) | Pas de polyfill requis |

---

## Validation Architecture

### Test Framework

| Propriété | Valeur |
|---|---|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.2 |
| Config | `vitest.config.ts` (racine projet) |
| Commande rapide | `npm test -- --reporter=verbose src/__tests__/ConfiguratorModal.test.tsx` |
| Suite complète | `npm test` |

### Phase Requirements → Test Map

| Req ID | Comportement | Type test | Commande automatisée | Fichier existant ? |
|---|---|---|---|---|
| MODAL-01 | Cliquer "Configurer ce modèle" ouvre le modal (dialog.open = true) | unit | `npm test -- src/__tests__/ConfiguratorModal.test.tsx` | Non — Wave 0 |
| MODAL-01 | Taille 90vw desktop / 100vw mobile (vérification CSS classes) | unit | idem | Non — Wave 0 |
| MODAL-02 | Modal a `aria-modal="true"` et `aria-labelledby` | unit | idem | Non — Wave 0 |
| MODAL-02 | Fermeture Escape déclenche `onClose` | unit | idem | Non — Wave 0 |
| MODAL-02 | Clic backdrop (hors contenu) déclenche `onClose` | unit | idem | Non — Wave 0 |
| MODAL-02 | Clic bouton X déclenche `onClose` | unit | idem | Non — Wave 0 |
| MODAL-03 | Modal affiche le nom du modèle sélectionné | unit | idem | Non — Wave 0 |
| MODAL-03 | Modal affiche le message "Configurateur à venir" | unit | idem | Non — Wave 0 |

### Sampling Rate

- **Par commit de tâche :** `npm test -- src/__tests__/ConfiguratorModal.test.tsx`
- **Par merge de wave :** `npm test` (suite complète)
- **Gate de phase :** Suite complète verte avant `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/ConfiguratorModal.test.tsx` — couvre MODAL-01, MODAL-02, MODAL-03
- [ ] Mock `HTMLDialogElement.showModal` / `close` dans `src/__tests__/setup.ts` (happy-dom ne supporte pas les méthodes de dialog nativement)

**Note importante sur happy-dom :** happy-dom ne supporte pas `showModal()` nativement. Le mock suivant est nécessaire dans `setup.ts` ou dans le fichier de test :

```typescript
// Dans src/__tests__/setup.ts — à ajouter
HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) {
  this.setAttribute('open', '')
})
HTMLDialogElement.prototype.close = vi.fn(function(this: HTMLDialogElement) {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
})
```

---

## Project Constraints (from CLAUDE.md)

Directives obligatoires que le planificateur doit vérifier :

| Directive | Application à cette phase |
|---|---|
| PAS de Tailwind, PAS de shadcn/ui — CSS Modules uniquement | `ConfiguratorModal.module.css` obligatoire, zéro classe utilitaire |
| Un fichier `.module.css` par composant | `ConfiguratorModal.module.css` dédié |
| Design tokens dans `globals.css` | Utiliser `var(--radius-xl)`, `var(--shadow-lg)`, `var(--color-background)`, etc. |
| Composants en PascalCase, un fichier par composant | `ConfiguratorModal.tsx` seul fichier |
| Messages d'erreur en français | Messages du placeholder en français (déjà dans D-02) |
| TypeScript strict (aucun `any`) | Typer explicitement tous les props et handlers |
| Lucide React pour icônes | `import { X } from 'lucide-react'` |

---

## Sources

### Primary (HIGH confidence)

- MDN Web Docs — `<dialog>` element : https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
- MDN Web Docs — `showModal()` : https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
- web.dev — Building a dialog component : https://web.dev/articles/building/a-dialog-component
- Codebase projet — `src/components/admin/ConfirmDialog.tsx` (pattern établi)
- Codebase projet — `src/components/public/Catalogue/ProductCard.tsx` (`getPrimaryImage`, `formatPrice`)
- Codebase projet — `src/app/globals.css` (design tokens)

### Secondary (MEDIUM confidence)

- CSS-Tricks — "There is no need to trap focus on a dialog element" (vérifié : `inert` est automatique avec `showModal()`)
- web.dev/learn/html/dialog — backdrop click pattern `e.target === e.currentTarget`
- Chip Cullen — scroll lock avec `:has(dialog[open])` (limité : pas de mention iOS Safari)

### Tertiary (LOW confidence — à valider)

- WebSearch — `position: fixed` + scroll restoration pour iOS Safari : plusieurs sources convergent mais test physique requis
- WebSearch — `overscroll-behavior: contain` sur Chrome 144+ : trop récent, pas supporté iOS Safari au 2026-03-29

---

## Metadata

**Confidence breakdown :**
- Standard stack : HIGH — aucune dépendance nouvelle, pattern déjà en place dans le projet
- Architecture patterns : HIGH — vérifié via MDN + web.dev + code existant
- Pitfalls : HIGH (desktop) / MEDIUM (iOS Safari scroll lock) — iOS requiert test physique
- Tests : HIGH — infrastructure Vitest déjà opérationnelle, seul mock `showModal` est un gap connu

**Research date :** 2026-03-29
**Valid until :** 2026-04-28 (stable — API `<dialog>` native ne change pas)
