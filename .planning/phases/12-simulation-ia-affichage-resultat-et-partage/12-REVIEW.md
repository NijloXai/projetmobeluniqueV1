---
phase: 12-simulation-ia-affichage-resultat-et-partage
reviewed: 2026-04-07T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/components/public/Catalogue/ConfiguratorModal.tsx
  - src/components/public/Catalogue/ConfiguratorModal.module.css
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 12 : Rapport de Code Review

**Reviewed:** 2026-04-07
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Les deux fichiers constituent l'etape Phase 12 du configurateur modal : affichage du resultat IA, telechargement, et partage Web Share API / WhatsApp. Le code est globalement solide — les hooks sont bien ordres, les Object URLs sont revokes, l'AbortController est correctement gere. Trois avertissements de comportement et trois points d'information ont ete identifies.

---

## Warnings

### WR-01: Double rendu de `<input ref={fileInputRef}>` — ref pointe sur le second

**File:** `src/components/public/Catalogue/ConfiguratorModal.tsx:659-693`

**Issue:** `fileInputRef` est attache a deux elements `<input type="file">` distincts dans le meme arbre JSX rendu simultanement. Le premier est dans la `uploadZone` (etat `idle`, ligne 660), le second est dans le `previewContainer` (etats `preview`/`error`, ligne 687). React assigne `ref.current` au dernier element monte dans l'ordre du DOM ; en pratique les deux blocs ne sont jamais renders ensemble (ils sont conditionnes sur `simulationState`), donc la ref est correcte au moment de l'utilisation. Mais si jamais l'etat changeait entre deux renders concurrents (React 18 Concurrent), la ref pourrait pointer temporairement vers l'ancien input deja demonte, ce qui fait que `fileInputRef.current?.click()` devient un no-op silencieux. Le pattern correct est un seul `<input>` hisse hors des blocs conditionnels.

**Fix:**
```tsx
// Deplacer l'unique input file au niveau du dialog (hors des blocs conditionnels)
// et garder uniquement les boutons declencheurs dans les blocs.

// Apres le <div className={styles.content}>, juste avant la fermeture :
<input
  ref={fileInputRef}
  type="file"
  accept="image/jpeg,image/png,image/heic,image/heif"
  className={styles.uploadHiddenInput}
  onChange={handleInputChange}
  aria-label="Selectionner une photo de votre salon"
  aria-describedby="upload-formats"
/>
// Supprimer les deux occurrences inline aux lignes 659-667 et 686-693.
```

---

### WR-02: `handlePartager` — erreur du second `fetch(resultBlobUrl)` non refletee dans l'UI

**File:** `src/components/public/Catalogue/ConfiguratorModal.tsx:289-317`

**Issue:** Dans `handlePartager`, un second `fetch(resultBlobUrl)` est effectue pour reconvertir le Blob URL en `File` (ligne 298). Si ce fetch echoue (blob URL revoque entre-temps, ou erreur reseau inattendue), l'exception est silencieusement attrapee par le `catch` a la ligne 305 et tombe dans le fallback WhatsApp. Ce comportement est intentionnel pour WhatsApp, mais si `navigator.canShare` est `undefined` (ancien navigateur) et que `window.open` WhatsApp est egalement bloque par le bloqueur de popups, l'utilisateur ne voit aucun feedback d'echec. L'absence de message d'erreur visible laisse l'utilisateur sans information.

**Fix:**
```tsx
const handlePartager = useCallback(async () => {
  if (!resultBlobUrl || !model) return

  const shopifyUrl = model.shopify_url ?? 'https://mobelunique.fr'
  const message = `Regardez comment ce canape s'integre dans mon salon ! Visualise avec Mobel Unique \u2014 ${shopifyUrl}`

  if (typeof navigator?.canShare === 'function') {
    try {
      const response = await fetch(resultBlobUrl)
      const blob = await response.blob()
      const file = new File([blob], 'mobel-unique-simulation.jpg', { type: 'image/jpeg' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Ma simulation M\u00f6bel Unique' })
        return
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      // Fall through to WhatsApp (comportement voulu)
    }
  }

  const opened = window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer'
  )
  if (!opened) {
    // La popup a ete bloquee — informer l'utilisateur
    setErrorMessage('Le partage a ete bloque par votre navigateur. Telechargez l\'image et partagez-la manuellement.')
  }
}, [resultBlobUrl, model])
```

---

### WR-03: `id="modal-title"` duplique dans le meme DOM rendu

**File:** `src/components/public/Catalogue/ConfiguratorModal.tsx:550, 788, 819`

**Issue:** L'attribut `id="modal-title"` est applique a trois elements `<h2>` differents selon l'etat du modal. Le `<dialog>` utilise `aria-labelledby="modal-title"`. Bien que les trois `<h2>` ne soient jamais dans le DOM simultanement, le lint HTML (et certains outils d'accessibilite) signale des IDs dupliques si deux branches d'un arbre React sont evaluees. Plus important : si React batch deux renders et que les deux branches sont brievement montees, le comportement `aria-labelledby` devient ambigu. La pratique recommandee est d'utiliser une variable pour le texte du titre et un seul `<h2 id="modal-title">`.

**Fix:**
```tsx
// Calculer le titre avant le return
const modalTitle = modalStep === 'configurator'
  ? model.name
  : simulationState === 'done' ? 'Votre simulation' : 'Simulation'

// Un seul h2 dans chaque branche, ou mieux, hisse au-dessus des deux etapes :
// <h2 id="modal-title" className={...}>{modalTitle}</h2>
// Retirer les trois occurrences inline.
```

---

## Info

### IN-01: `handleReessayer` — wrapper inutile autour de `handleLancerSimulation`

**File:** `src/components/public/Catalogue/ConfiguratorModal.tsx:273-275`

**Issue:** `handleReessayer` est un simple wrapper de `handleLancerSimulation` sans logique propre. Il alourdit inutilement la surface de l'API interne du composant.

**Fix:**
```tsx
// Supprimer handleReessayer et utiliser directement handleLancerSimulation :
<button type="button" className={styles.retryButton} onClick={handleLancerSimulation}>
  Reessayer
</button>
```

---

### IN-02: Classes CSS `actionButtons` et `actionButtonsMobile` jamais differenciees

**File:** `src/components/public/Catalogue/ConfiguratorModal.module.css:803-816`

**Issue:** `.actionButtons` (ligne 803) et `.actionButtonsMobile` (ligne 811) ont des regles identiques et `.actionButtons` n'est reference dans aucun element JSX du composant. C'est du CSS mort.

**Fix:** Supprimer la classe `.actionButtons` (lignes 803-808) du fichier CSS — elle n'est pas utilisee. Seules `.actionButtonsMobile` et `.actionButtonsDesktop` sont utilisees dans le composant.

---

### IN-03: `aria-hidden="false"` explicite est redondant

**File:** `src/components/public/Catalogue/ConfiguratorModal.tsx:755, 796`

**Issue:** `aria-hidden="false"` est la valeur par defaut implicite de tout element HTML. L'ecrire explicitement n'apporte rien et peut induire en erreur en laissant penser que ces elements etaient precedemment caches via `aria-hidden="true"`.

**Fix:** Supprimer les attributs `aria-hidden="false"` aux lignes 755 et 796.

---

_Reviewed: 2026-04-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
