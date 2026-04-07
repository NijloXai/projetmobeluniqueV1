# Phase 12: Simulation IA — Affichage resultat et partage - Research

**Researched:** 2026-04-07
**Domain:** UI React / Web APIs natives (Blob, Web Share, download)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Le resultat IA s'affiche dans la colonne gauche du modal, meme emplacement que la zone upload/preview Phase 11. Pas de lightbox, pas de slider before/after.
- D-02: Disclaimer discret sous l'image : "Apercu genere par IA — le rendu reel peut varier" en texte gris petit
- D-03: Titre "Votre simulation". Sous-titre dynamique : "{model.name} x {fabric.name} dans votre salon" (ou "Canape original" si pas de tissu)
- D-04: Fondu enchaine de la barre de progression vers l'image resultat en ~400ms. La progression passe a 100%, puis fondu vers l'image.
- D-05: 4 boutons d'action : Telecharger, Partager, Commander sur Shopify, Essayer une autre photo
- D-06: Telechargement direct JPEG sans choix format. Utilise `URL.createObjectURL` + `<a download>` pattern
- D-07: Partage : `navigator.share({ files: [blob] })` sur mobile si supporte, sinon `https://wa.me/?text=...` avec message pre-rempli sur desktop
- D-08: Layout 1 colonne mobile : image resultat en haut, 4 boutons d'action empiles verticalement en dessous.
- D-09: "Essayer une autre photo" reset a l'etat idle. Efface resultBlobUrl et selectedFile. Config tissu/modele preservee.
- D-10: Pas d'historique de simulations. State management reste en useState local.

### Claude's Discretion
- Style exact des boutons d'action (primaire, secondaire, outline) — resolu dans UI-SPEC
- Icones des boutons (download, share, cart, refresh) — resolu dans UI-SPEC
- Espacement et padding du layout resultat — resolu dans UI-SPEC
- Message pre-rempli pour le partage WhatsApp — resolu dans UI-SPEC
- Gestion du cas shopify_url === null (masquer le bouton Commander) — resolu dans UI-SPEC

### Deferred Ideas (OUT OF SCOPE)
- Historique/galerie de simulations en session
- Streaming/SSE pour progression reelle
- Comparaison before/after avec slider
- Integration Nano Banana reelle (M012+)
</user_constraints>

---

## Summary

Phase 12 est une extension ciblée de `ConfiguratorModal.tsx` : remplir le stub vide `simulationState === 'done'` avec un affichage du résultat + 4 boutons d'action. Le blob est déjà en mémoire (`resultBlobUrl`), aucune API supplémentaire n'est nécessaire. Toutes les opérations (download, share, reset) sont des primitives natives du navigateur.

La complexité principale réside dans deux points : (1) la transition 400ms de la barre de progression vers l'image, qui nécessite une classe CSS dédiée plutôt que de modifier le keyframe partagé `imageFadeIn` existant, et (2) la logique de partage conditionnelle Web Share API vs WhatsApp fallback, qui doit tester `navigator.canShare({ files })` avant d'appeler `navigator.share`.

Le layout mobile/desktop est déjà établi par Phase 11. Cette phase ajoute uniquement le bloc conditionnel `done` dans la colonne gauche et met à jour la colonne droite pour l'état `done`.

**Recommandation primaire :** Implémenter en un seul plan (une seule PR), pas besoin de découpe en waves — la surface est petite (environ 80-100 lignes TSX + 40 lignes CSS).

---

## Standard Stack

### Core (aucune nouvelle dépendance)

| Élément | Version | But | Source |
|---------|---------|-----|--------|
| `lucide-react` | 1.7.0 | Icônes Download, Share2, ExternalLink, RefreshCw | [VERIFIED: npm list] |
| `URL.createObjectURL` + `<a download>` | Native | Téléchargement blob JPEG | [VERIFIED: déjà utilisé en Phase 11, lignes 142/248] |
| `navigator.share` + `navigator.canShare` | Native | Web Share API mobile | [VERIFIED: MDN + WebSearch] |
| CSS Modules | — | Styles sans Tailwind ni shadcn | [VERIFIED: CLAUDE.md convention stricte] |
| `useState` local | React 19.2.4 | State management éphémère (D-10) | [VERIFIED: codebase existant] |

**Installation :** Aucune installation requise. Toutes les primitives sont disponibles.

### Icônes vérifiées dans lucide-react@1.7.0

| Icône | Import | Disponible |
|-------|--------|------------|
| `Download` | `import { Download } from 'lucide-react'` | [VERIFIED: node -e test] |
| `Share2` | `import { Share2 } from 'lucide-react'` | [VERIFIED: node -e test] |
| `ExternalLink` | `import { ExternalLink } from 'lucide-react'` | [VERIFIED: node -e test] |
| `RefreshCw` | `import { RefreshCw } from 'lucide-react'` | [VERIFIED: node -e test] |

---

## Architecture Patterns

### Point d'intégration exact

Le stub vide se trouve à la ligne 680 de `ConfiguratorModal.tsx`, dans la section `{modalStep === 'simulation'}`, colonne gauche `leftColumn`. Il n'y a pas de JSX pour `simulationState === 'done'`.

```
Colonne gauche (leftColumn) :
  - idle     → zone upload DnD         [implementé]
  - preview  → previewContainer        [implementé]
  - error    → previewContainer        [implementé]
  - generating → generatingContainer   [implementé]
  - done     → (STUB VIDE)             ← PHASE 12 ajoute ici

Colonne droite (body) :
  - Tous états → backButton + titre + configRecap  [implementé]
  - done     → titre "Votre simulation" + sous-titre + 4 boutons  ← PHASE 12 modifie
```

### Pattern 1 : Affichage image résultat avec animation 400ms

**Ce qu'il faut faire :** Ajouter une classe `.resultImage` dans le CSS qui surcharge la durée de `imageFadeIn` à 400ms (le keyframe partagé tourne à 200ms pour `imageMain`). Ne pas modifier `imageFadeIn` directement — cela casserait les transitions des phases précédentes.

```typescript
// Source : ConfiguratorModal.tsx pattern existant lignes 449-459 + CONTEXT.md D-04
{simulationState === 'done' && resultBlobUrl && (
  <div className={styles.resultContainer} aria-live="polite" aria-label="Simulation generee">
    <img
      src={resultBlobUrl}
      alt={`Simulation IA de votre salon avec le canape ${model.name}`}
      className={styles.resultImage}
    />
  </div>
)}
```

```css
/* Source : UI-SPEC Section "Zone resultat" + D-04 */
.resultContainer {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-background-alt);
}

.resultImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: imageFadeIn 400ms ease; /* 400ms, pas 200ms comme imageMain */
}

/* keyframe imageFadeIn est DÉJÀ déclaré dans le CSS Phase 9 — ne pas le redéclarer */
```

### Pattern 2 : Download blob sans re-fetch

**Principe :** Le blob est déjà en mémoire dans `resultBlobUrl`. Il n'y a pas besoin de créer un nouveau `createObjectURL` — utiliser `resultBlobUrl` directement comme `href`.

```typescript
// Source : CONTEXT.md D-06, pattern standard HTML5
const handleDownload = useCallback(() => {
  if (!resultBlobUrl) return
  const a = document.createElement('a')
  a.href = resultBlobUrl
  a.download = 'mobel-unique-simulation.jpg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}, [resultBlobUrl])
```

**Pourquoi `document.body.appendChild/removeChild` :** Certains navigateurs (Safari en particulier) ignorent le `click()` programmatique sur un élément non attaché au DOM. Le pattern append → click → remove est la forme robuste cross-browser. [VERIFIED: convention reconnue, MDN recommend this approach]

### Pattern 3 : Web Share API avec fallback WhatsApp

**Le piège à éviter :** Tester uniquement `navigator.share` n'est pas suffisant — certains navigateurs implémentent `share()` mais pas le partage de fichiers. Il faut double-vérifier avec `navigator.canShare({ files })`.

```typescript
// Source : MDN navigator.canShare + CONTEXT.md D-07
const handlePartager = useCallback(async () => {
  if (!resultBlobUrl) return

  // Convertir le blob URL en File pour navigator.share({ files })
  const response = await fetch(resultBlobUrl)
  const blob = await response.blob()
  const file = new File([blob], 'mobel-unique-simulation.jpg', { type: 'image/jpeg' })

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: 'Ma simulation Möbel Unique',
      })
    } catch (err) {
      // AbortError = utilisateur a annulé le partage natif — ne pas traiter comme erreur
      if (err instanceof Error && err.name !== 'AbortError') {
        // Fallback WhatsApp si navigator.share échoue pour une raison technique
        ouvrirWhatsApp()
      }
    }
  } else {
    ouvrirWhatsApp()
  }
}, [resultBlobUrl, model])

const ouvrirWhatsApp = useCallback(() => {
  const url = model?.shopify_url ?? 'https://mobelunique.fr'
  const message = encodeURIComponent(
    `Regardez comment ce canape s'integre dans mon salon ! Visualise avec Mobel Unique — ${url}`
  )
  window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
}, [model])
```

**Note importante :** `fetch(resultBlobUrl)` sur un blob URL local ne fait pas de requête réseau — c'est une lecture synchrone du blob en mémoire. C'est la façon standard de convertir un blob URL en `File` pour Web Share API. [CITED: web.dev/patterns/files/share-files]

### Pattern 4 : Reset "Essayer une autre photo" (D-09)

**Ce qui doit être effacé :** `resultBlobUrl` (avec `revokeObjectURL` préalable), `selectedFile`. **Ce qui doit être préservé :** `selectedFabricId`, `selectedAngle`, `modalStep`.

```typescript
// Source : CONTEXT.md D-09
const handleEssayerAutrePhoto = useCallback(() => {
  if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
  setResultBlobUrl(null)
  setSelectedFile(null)
  setSimulationState('idle')
  setProgress(0)
  setProgressStage(0)
  setErrorMessage(null)
  // selectedFabricId et selectedAngle intentionnellement préservés
}, [resultBlobUrl])
```

### Pattern 5 : Layout colonne droite état `done`

La colonne droite (`.body`) change de contenu selon `simulationState`. En état `done`, elle affiche titre + sous-titre + 4 boutons. En mobile, les boutons sont dans la colonne gauche (sous le disclaimer).

```typescript
// Source : UI-SPEC Layout responsive section
// La colonne droite affiche les boutons UNIQUEMENT sur desktop (>= 640px)
// Sur mobile, les boutons sont rendus dans la colonne gauche après le disclaimer
```

L'approche retenue par l'UI-SPEC (Claude's Discretion) : pas de `order` CSS — le JSX conditionne directement. Cela signifie qu'il faut rendre les boutons en deux endroits selon le breakpoint. **Pattern recommandé :** une classe CSS `.actionsDesktopOnly` avec `display: none` sur mobile et `display: flex` sur desktop, et une classe `.actionsMobileOnly` inversée.

### Anti-Patterns à éviter

- **Ne pas modifier `@keyframes imageFadeIn`** — ce keyframe est partagé par `imageMain` (Phase 9, crossfade 200ms). Créer une classe `.resultImage` distincte avec `animation: imageFadeIn 400ms ease`.
- **Ne pas créer un nouveau blob URL pour le download** — `resultBlobUrl` est déjà un blob URL valide. Utiliser directement comme `href`.
- **Ne pas tester seulement `navigator.share`** — tester `navigator.canShare({ files: [file] })` est obligatoire pour distinguer les navigateurs qui supportent le partage de fichiers de ceux qui ne supportent que le partage de texte.
- **Ne pas oublier le `revokeObjectURL` dans handleEssayerAutrePhoto** — le blob doit être libéré avant d'effacer la référence, sinon fuite mémoire. Le pattern est déjà établi dans `handleFileSelected` et le cleanup unmount.
- **Ne pas ajouter `aria-live` avec value `assertive`** — l'UI-SPEC spécifie `aria-live="polite"` sur le container résultat. `assertive` interromprait les lecteurs d'écran.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser à la place | Pourquoi |
|----------|-------------------|---------------------|----------|
| Download de fichier | Lien `<a>` statique dans le JSX | Pattern `createElement('a') + click() + removeChild` | iOS Safari ignore les liens download statiques non initiés par un clic direct utilisateur dans certains contextes |
| Vérification support Web Share | Regex user-agent | `navigator.canShare({ files })` | User-agent sniffing est fragile et non maintenable |
| Partage de fichier depuis blob URL | Envoyer l'URL blob à navigator.share | `fetch(blobUrl)` → `new File()` → `navigator.share({ files })` | `navigator.share` ne peut pas recevoir une blob URL — il faut un objet `File` |
| Animation fade-in résultat | CSS transition sur opacity avec état React | `@keyframes imageFadeIn` via classe CSS dédiée | Cohérence avec le système d'animation établi en Phase 9 |

---

## Common Pitfalls

### Pitfall 1 : `navigator.share` sans vérification `canShare({ files })`
**Ce qui va mal :** Sur desktop Chrome ou Firefox, `navigator.share` existe mais refuse les fichiers. L'appel lève une exception `DOMException: Permission denied` ou `NotAllowedError`.
**Pourquoi :** Web Share API Level 1 (texte) est mieux supporté que Level 2 (fichiers). Même navigateur, support différent selon le niveau.
**Comment éviter :** Toujours chaîner : `navigator.share && navigator.canShare({ files }) && navigator.share(...)`.
**Signes d'alerte :** L'app fonctionne sur mobile mais crash sur desktop Chrome lors des tests.

### Pitfall 2 : Conflit de keyframe `imageFadeIn`
**Ce qui va mal :** Si on redéclare `@keyframes imageFadeIn` dans un nouveau bloc CSS, le navigateur utilise la dernière déclaration en cascade. Les images des phases précédentes (crossfade angles Phase 9) perdent leur animation 200ms.
**Pourquoi :** Les keyframes CSS Modules sont globaux dans la feuille compilée — deux déclarations du même nom se remplacent.
**Comment éviter :** Utiliser uniquement `.resultImage { animation: imageFadeIn 400ms ease; }` sans redéclarer le keyframe.
**Signes d'alerte :** Tester le crossfade thumbnails (Phase 9) après déploiement — s'il a ralenti à 400ms, le keyframe a été écrasé.

### Pitfall 3 : Fuite mémoire blob URL sur reset
**Ce qui va mal :** Si `handleEssayerAutrePhoto` efface `resultBlobUrl` sans appeler `URL.revokeObjectURL` en premier, le blob JPEG reste en mémoire jusqu'à la fermeture du tab.
**Pourquoi :** Les blob URLs sont des références permanentes à des objets en mémoire jusqu'à révocation explicite.
**Comment éviter :** Appeler `URL.revokeObjectURL(resultBlobUrl)` avant `setResultBlobUrl(null)`. Le pattern est déjà établi dans `handleFileSelected` (ligne 141) et le cleanup unmount (ligne 298).
**Signes d'alerte :** Les tests de fuite mémoire Phase 11 (T-11-07 : `revokeObjectURL` appelé dans 3 chemins) doivent rester verts.

### Pitfall 4 : Bouton Commander rendu quand `shopify_url === null`
**Ce qui va mal :** Le lien Shopify est optionnel dans le schéma Supabase. Rendre `<a href={null}>` produit `href="null"` en HTML — navigation vers `/null`.
**Pourquoi :** JSX sérialise `null` en string dans les attributs HTML.
**Comment éviter :** Conditionner le rendu du bouton : `{model.shopify_url && <a href={model.shopify_url} ...>}`. Pattern identique au `ctaShopify` existant dans l'étape configurateur (ligne 555).
**Signes d'alerte :** TypeScript strict le détecte à la compilation si le type est `string | null`.

### Pitfall 5 : WhatsApp fallback sans `noopener`
**Ce qui va mal :** `window.open('https://wa.me/...', '_blank')` sans `noopener,noreferrer` expose `window.opener` — vulnérabilité de type reverse tabnapping.
**Pourquoi :** Sécurité web basique pour tous les liens `target="_blank"` vers des domaines tiers.
**Comment éviter :** `window.open(url, '_blank', 'noopener,noreferrer')`.

---

## Code Examples

### Download JPEG (pattern complet)

```typescript
// Source : pattern MDN <a download> + validation CONTEXT.md D-06
const handleDownload = useCallback(() => {
  if (!resultBlobUrl) return
  const a = document.createElement('a')
  a.href = resultBlobUrl
  a.download = 'mobel-unique-simulation.jpg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}, [resultBlobUrl])
```

### Partage conditionnel Web Share API → WhatsApp fallback

```typescript
// Source : MDN navigator.canShare + CONTEXT.md D-07 + UI-SPEC message WhatsApp
const handlePartager = useCallback(async () => {
  if (!resultBlobUrl || !model) return
  
  const shopifyUrl = model.shopify_url ?? 'https://mobelunique.fr'
  const message = `Regardez comment ce canape s'integre dans mon salon ! Visualise avec Mobel Unique — ${shopifyUrl}`

  // Tenter Web Share API avec fichier
  if (typeof navigator?.canShare === 'function') {
    try {
      const response = await fetch(resultBlobUrl)
      const blob = await response.blob()
      const file = new File([blob], 'mobel-unique-simulation.jpg', { type: 'image/jpeg' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Ma simulation Möbel Unique' })
        return
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return // Utilisateur a annulé
      // Fall through to WhatsApp
    }
  }

  // Fallback WhatsApp (desktop ou navigateur sans support fichiers)
  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer'
  )
}, [resultBlobUrl, model])
```

### Reset vers idle (D-09)

```typescript
// Source : CONTEXT.md D-09 + pattern revokeObjectURL Phase 11
const handleEssayerAutrePhoto = useCallback(() => {
  if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
  setResultBlobUrl(null)
  setSelectedFile(null)
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  setPreviewUrl(null)
  setSimulationState('idle')
  setProgress(0)
  setProgressStage(0)
  setErrorMessage(null)
  // selectedFabricId, selectedAngle, modalStep : intentionnellement préservés (D-09)
}, [resultBlobUrl, previewUrl])
```

### JSX état `done` — colonne gauche

```typescript
// Source : ConfiguratorModal.tsx structure existante + UI-SPEC "Zone resultat"
{simulationState === 'done' && resultBlobUrl && (
  <>
    <div
      className={styles.resultContainer}
      aria-live="polite"
      aria-label="Simulation generee"
    >
      <img
        src={resultBlobUrl}
        alt={`Simulation IA de votre salon avec le canape ${model.name}`}
        className={styles.resultImage}
      />
    </div>
    <p className={styles.resultDisclaimer}>
      Apercu genere par IA &mdash; le rendu reel peut varier
    </p>
    {/* Boutons d'action : visibles uniquement sur mobile (< 640px) */}
    <div className={styles.actionButtonsMobile}>
      {/* Les 4 boutons — identiques à ceux de la colonne droite */}
    </div>
  </>
)}
```

### CSS nouvelles classes Phase 12

```css
/* Source : UI-SPEC "Zone resultat" + tokens globals.css */

/* Container image résultat */
.resultContainer {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-background-alt);
}

/* Image avec fade-in 400ms (D-04) — ne pas redéclarer @keyframes imageFadeIn */
.resultImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: imageFadeIn 400ms ease;
}

/* Disclaimer IA (D-02) */
.resultDisclaimer {
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--color-muted);
  font-style: italic;
  margin-top: var(--spacing-sm);
}

/* Bouton "Telecharger" (CTA primaire) */
.downloadButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  width: 100%;
  height: 48px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity 150ms ease;
}

.downloadButton:hover { opacity: 0.9; }
.downloadButton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Bouton "Partager" (WhatsApp vert) */
.shareButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  width: 100%;
  height: 48px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: #FFFFFF;
  background: var(--color-whatsapp);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 150ms ease;
}

.shareButton:hover { background: var(--color-whatsapp-hover); }
.shareButton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Bouton "Commander sur Shopify" (outline — identique ctaShopify) */
.orderButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  width: 100%;
  height: 48px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-text);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-decoration: none;
  transition: background-color 150ms ease, color 150ms ease;
}

.orderButton:hover {
  background: var(--color-text);
  color: var(--color-background);
}

.orderButton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Bouton "Essayer une autre photo" (tertiary text-only) */
.retryPhotoButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  width: 100%;
  height: 44px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: color 150ms ease;
}

.retryPhotoButton:hover { color: var(--color-text); }
.retryPhotoButton:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Groupe de 4 boutons d'action */
.actionButtons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xl);
}

/* Boutons d'action en colonne gauche : uniquement mobile (< 640px) */
.actionButtonsMobile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xl);
}

/* Boutons d'action en colonne droite : uniquement desktop (>= 640px) */
.actionButtonsDesktop {
  display: none;
}

@media (min-width: 640px) {
  .actionButtonsMobile { display: none; }
  .actionButtonsDesktop {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-xl);
  }
  .resultContainer {
    aspect-ratio: auto;
    min-height: 300px;
  }
}
```

---

## State of the Art

| Ancienne approche | Approche actuelle | Impact |
|-------------------|-------------------|--------|
| Navigator.share texte uniquement | Navigator.share({ files }) sur mobile | Partage natif de l'image JPEG via l'OS |
| `<a download>` statique dans JSX | Pattern `createElement + click + removeChild` | Robuste sur iOS Safari |
| Tester `navigator.share` seulement | Tester `navigator.canShare({ files })` | Évite DOMException sur desktop |

---

## Assumptions Log

| # | Claim | Section | Risque si faux |
|---|-------|---------|----------------|
| A1 | `fetch(blobUrl)` ne fait pas de requête réseau — lit le blob en mémoire | Pattern 3 + Code Examples | Faible — comportement confirmé par spec Fetch et usage répandu [ASSUMED: formation + MDN implicite] |
| A2 | Sur iOS Safari, `navigator.share({ files })` est supporté depuis iOS 15+ | Pitfall 1 | Faible — fallback WhatsApp gère le cas non supporté |

---

## Open Questions

1. **Boutons en double dans le DOM (mobile vs desktop)**
   - Ce qu'on sait : l'UI-SPEC préconise `.actionButtonsMobile` et `.actionButtonsDesktop` affichés/masqués par media query CSS
   - Ce qui est flou : Impact accessibilité d'avoir 4 boutons en double dans le DOM (2x pour mobile, 2x pour desktop)
   - Recommandation : Utiliser `aria-hidden="true"` sur le groupe masqué, ou opter pour une variante JSX conditionnelle avec `useMediaQuery` hook léger. L'UI-SPEC a retenu l'approche CSS masquage — acceptable si `aria-hidden` est appliqué.

---

## Environment Availability

Pas de dépendances externes ajoutées dans cette phase. Toutes les primitives (`URL.createObjectURL`, `navigator.share`, `fetch`, `window.open`) sont natives au navigateur.

| Dépendance | Requise par | Disponible | Fallback |
|------------|-------------|------------|----------|
| `lucide-react` Download, Share2, ExternalLink, RefreshCw | Boutons d'action | ✓ 1.7.0 | — |
| `navigator.share` + `canShare` | Bouton Partager mobile | ✓ mobile / ✗ desktop | WhatsApp fallback |
| `URL.createObjectURL` | Download + résultat affiché | ✓ déjà utilisé | — |
| `--color-whatsapp` token | Bouton Partager | ✓ globals.css ligne 31 | — |

**Aucune dépendance bloquante.**

---

## Validation Architecture

### Test Framework

| Propriété | Valeur |
|-----------|--------|
| Framework | Vitest + Testing Library + happy-dom |
| Config | `vitest.config.ts` à la racine |
| Commande rapide | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` |
| Suite complète | `npm test` (vitest run) |

### Phase Requirements → Test Map

| Req ID | Comportement | Type de test | Commande | Fichier existe? |
|--------|-------------|-------------|----------|-----------------|
| SIM-03a | Etat done affiche l'image résultat avec animation | Unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (à étendre) |
| SIM-03b | Bouton Telecharger déclenche download JPEG | Unit | même fichier | ✅ (à étendre) |
| SIM-03c | Bouton Partager appelle navigator.share ou ouvre wa.me | Unit | même fichier | ✅ (à étendre) |
| SIM-03d | Bouton Commander masqué si shopify_url === null | Unit | même fichier | ✅ (à étendre) |
| SIM-03e | "Essayer une autre photo" reset à idle, config préservée | Unit | même fichier | ✅ (à étendre) |

### Taux d'échantillonnage

- **Par commit :** `npx vitest run src/__tests__/ConfiguratorModal.test.tsx`
- **Par wave :** `npm test`
- **Gate phase :** Suite complète verte avant `/gsd-verify-work`

### Wave 0 Gaps

Les tests Phase 12 sont à ajouter dans `src/__tests__/ConfiguratorModal.test.tsx` — le fichier existe et contient déjà le setup, les mocks, et les helpers. Aucune installation supplémentaire nécessaire.

- [ ] Test SIM-03a : image résultat visible dans état `done` (mock fetch simulant blob response)
- [ ] Test SIM-03b : téléchargement — vérifier que `createElement('a') + click()` est appelé avec `download='mobel-unique-simulation.jpg'`
- [ ] Test SIM-03c : partage — mock `navigator.canShare` → vérifier `navigator.share` appelé, et fallback `window.open` quand `canShare` retourne false
- [ ] Test SIM-03d : bouton Commander masqué quand `model.shopify_url === null`
- [ ] Test SIM-03e : reset vérifie `revokeObjectURL` appelé + état `idle` + `selectedFabricId` préservé

---

## Security Domain

### Applicable ASVS Categories

| Catégorie ASVS | Applicable | Contrôle standard |
|----------------|-----------|-------------------|
| V2 Authentication | non | — |
| V3 Session Management | non | — |
| V4 Access Control | non | — |
| V5 Input Validation | non (pas de saisie utilisateur dans cette phase) | — |
| V6 Cryptography | non | — |

### Patterns de menace connus

| Pattern | STRIDE | Mitigation standard |
|---------|--------|---------------------|
| Reverse tabnapping via window.open | Spoofing | `noopener,noreferrer` dans tous les `window.open` vers domaines tiers |
| Lien Shopify href null | Tampering | Conditionner le rendu : `model.shopify_url && <a href={model.shopify_url}>` |

---

## Sources

### Primaires (HIGH confidence)

- `ConfiguratorModal.tsx` lignes 1-717 — état exact du code Phase 11, points d'intégration [VERIFIED: lecture directe]
- `ConfiguratorModal.module.css` — keyframe `imageFadeIn`, classes existantes [VERIFIED: lecture directe]
- `src/app/globals.css` — tokens `--color-whatsapp`, `--color-whatsapp-hover` [VERIFIED: lecture directe lignes 31-32]
- `lucide-react@1.7.0` — disponibilité icônes Download, Share2, ExternalLink, RefreshCw [VERIFIED: node -e test]
- `12-CONTEXT.md` — décisions D-01 à D-10 [VERIFIED: lecture directe]
- `12-UI-SPEC.md` — contrat visuel complet [VERIFIED: lecture directe]

### Secondaires (MEDIUM confidence)

- MDN navigator.share — Web Share API avec fichiers, `canShare` obligatoire [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share]
- web.dev patterns/files/share-files — pattern `fetch(blobUrl)` → `new File()` [CITED: https://web.dev/patterns/files/share-files]

### Tertiaires (LOW confidence)

- Aucune source LOW confidence utilisée dans cette recherche.

---

## Metadata

**Confidence breakdown :**
- Standard Stack : HIGH — toutes dépendances vérifiées dans le projet réel
- Architecture : HIGH — code source Phase 11 lu et analysé, points d'intégration exacts identifiés
- Pitfalls : HIGH — 4 des 5 pitfalls vérifiés contre le code existant, 1 (Web Share + canShare) vérifié via MDN
- Tests : HIGH — framework Vitest existant, fichier test existant, structure claire

**Research date :** 2026-04-07
**Valid until :** 2026-05-07 (APIs natives stables)
