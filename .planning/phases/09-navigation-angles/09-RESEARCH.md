# Phase 9: Navigation angles - Research

**Researched:** 2026-03-30
**Domain:** Composant React avec état d'angle, crossfade CSS, scroll horizontal mobile
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Thumbnails places sous l'image principale dans la colonne gauche (desktop) et sous l'image pleine largeur (mobile)
- **D-02:** Pas de labels texte sous les thumbnails, image seule suffit
- **D-03:** Scroll horizontal (`overflow-x: auto`) sur mobile si le nombre d'angles depasse la largeur ecran
- **D-04:** Fond integre a l'image (meme zone), pas de bandeau background-alt distinct
- **D-05:** Le thumbnail actif a une bordure primary 3px #E49400 + outline 2px — meme traitement que les swatches tissu selectionnes
- **D-06:** Fade crossfade ~200ms entre les images quand on clique un thumbnail (pas de changement instantane)
- **D-07:** L'alt text de l'image principale se met a jour avec le nom de l'angle (ex: "Canape Milano en tissu Velours — vue profil")
- **D-08:** A l'ouverture du modal, les thumbnails montrent les photos originales du modele par angle (toutes les model_images)
- **D-09:** L'angle par defaut est 3/4 si disponible, sinon premiere image (logique getPrimaryImage existante)
- **D-10:** Quand un tissu est selectionne, seuls les angles ayant un rendu IA publie pour ce tissu sont affiches — les angles sans rendu sont caches
- **D-11:** Si un seul angle a un rendu publie pour le tissu selectionne, la rangee de thumbnails est masquee (pas de navigation utile)
- **D-12:** Au changement de tissu, l'angle selectionne est conserve si le nouveau tissu a un rendu pour cet angle — sinon reset au 3/4 (ou premier angle disponible)
- **D-13:** A la deselection du tissu, retour aux photos originales du modele avec les thumbnails de tous les angles
- **D-14:** Un `useState<string | null>` separe pour l'angle selectionne (model_image_id ou view_type), independant de selectedFabricId
- **D-15:** A la reouverture du modal sur le meme modele, l'angle selectionne est preserve (pas de reset)
- **D-16:** Au changement de modele, l'angle reset au 3/4 (coherent avec le reset du tissu Phase 8)

### Claude's Discretion

- Taille exacte des thumbnails (wireframe suggere 72x54px, a adapter selon l'espace)
- Espacement entre les thumbnails
- Implementation exacte du crossfade (opacity transition sur un seul element ou deux elements superposes)
- Style du scroll horizontal mobile (scrollbar cachee ou visible)
- Gestion du focus clavier sur les thumbnails (tab, enter)

### Deferred Ideas (OUT OF SCOPE)

- Zoom sur l'image du rendu IA — hors scope v9.0
- Swipe gauche/droite entre angles sur mobile
- Animation de slide entre angles (fade choisi)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONF-06 | Le client peut naviguer entre les angles disponibles via des thumbnails | Rangee de thumbnails cliquables sous l'image principale, useState selectedAngle, filtrage par model_image_id dans currentVisual |
</phase_requirements>

---

## Summary

Phase 9 est un ajout de fonctionnalite pur au composant `ConfiguratorModal.tsx` existant. Le perimetre est bien delimite : ajouter une rangee de thumbnails sous l'image principale, gérer un etat `selectedAngle` (string | null representant un `model_image_id`), filtrer les angles disponibles selon le tissu selectionne, et animer le changement d'image par un crossfade opacity a 200ms.

Le code existant de Phase 8 fournit tous les patterns necessaires. Le pattern `swatchSelected` (border + outline primary) est reutilisable tel quel pour les thumbnails actifs. La logique `eligibleFabrics` montre le pattern de filtrage JS a repliquer pour les angles. La structure des types est complete — `VisualWithFabricAndImage` inclut `model_image: ModelImage` avec `model_image_id` et `view_type`.

**Contrainte technique critique:** `selectedAngle` doit stocker un `model_image_id` (UUID string), pas un `view_type` (string libre). Raison : plusieurs images peuvent theoriquement avoir le meme view_type, et les visuals sont indexes par `model_image_id` (UNIQUE constraint `generated_visuals(model_image_id, fabric_id)`).

**Contrainte token CSS:** `--transition-fast` vaut 300ms dans globals.css. La decision D-06 demande ~200ms. Le crossfade doit utiliser `200ms ease` inline ou une valeur CSS directe — ne pas reutiliser `--transition-fast`.

**Primary recommendation:** Ajouter `useState<string | null>` pour l'angle, calculer `availableAngles` depuis `model.model_images` (sans tissu) ou depuis `visuals` filtres (avec tissu), et appliquer le crossfade via `opacity transition 200ms` sur le composant `<Image>`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useState | 19.2.4 | Etat local selectedAngle | Conforme decision D-14 — pas de Zustand |
| next/image | 16.2.1 | Thumbnails + image principale | Deja utilise dans ConfiguratorModal Phase 8 |
| CSS Modules | — | Styles .thumbnailRow, .thumbnail, .thumbnailActive | Convention projet stricte |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS opacity transition | — | Crossfade 200ms | Applique directement sur l'element Image, zero dependance |

### Alternatives Considerees

| Au lieu de | Pourrait utiliser | Compromis |
|------------|-------------------|-----------|
| opacity transition CSS | framer-motion / motion | motion est deja installe (package.json), mais over-engineering pour un fade simple a 200ms — CSS suffit |
| `model_image_id` comme cle angle | `view_type` | view_type n'est pas unique — model_image_id est la cle UNIQUE garantie |
| Rangee sous imageWrapper | Carrousel avec fleches | Carrousel = complexite non justifiee, wireframe montre thumbnails statiques |

**Installation:** Aucune dependance supplementaire a installer.

---

## Architecture Patterns

### Structure des modifications

```
src/components/public/Catalogue/
├── ConfiguratorModal.tsx          ← Ajouter useState selectedAngle,
│                                      logique availableAngles,
│                                      rangee thumbnails, crossfade
└── ConfiguratorModal.module.css   ← Ajouter .thumbnailRow, .thumbnail,
                                       .thumbnailActive, .imageMain
```

```
src/__tests__/
└── ConfiguratorModal.test.tsx     ← Ajouter suite "Phase 9 — navigation angles"
                                       couvrant CONF-06
```

### Pattern 1 : selectedAngle comme model_image_id

**Ce que c'est:** `selectedAngle` stocke le `model_image_id` (UUID) de l'image couramment affichee, pas le `view_type`.

**Pourquoi:** Les visuals sont lies par `model_image_id` (contrainte UNIQUE `generated_visuals(model_image_id, fabric_id)`). Filtrer par `model_image_id` est direct et sans ambiguite.

**Initialisation:** Appel de `getPrimaryImage` transforme en lookup par `view_type === '3/4'` pour trouver l'`id` correspondant.

```typescript
// Source: analyse du code existant ConfiguratorModal.tsx Phase 8
// getPrimaryImage retourne l'image_url — on a besoin de l'id
function getPrimaryImageId(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const image34 = model_images.find((img) => img.view_type === '3/4')
  if (image34) return image34.id
  return model_images[0]?.id ?? null
}

const [selectedAngle, setSelectedAngle] = useState<string | null>(() =>
  model ? getPrimaryImageId(model.model_images) : null
)
```

**Important:** Ce hook doit etre declare AVANT le `if (!model) return null` guard (regle React hooks existante, documentee dans STATE.md Blockers/Concerns).

### Pattern 2 : Reset angle au changement de modele

**Ce que c'est:** `useEffect` sur `model?.id` pour reset `selectedAngle` au 3/4 du nouveau modele.

```typescript
// Source: pattern etabli Phase 8 ConfiguratorModal.tsx ligne 73-75
useEffect(() => {
  setSelectedFabricId(null)
  setSelectedAngle(model ? getPrimaryImageId(model.model_images) : null)
}, [model?.id])
```

**Pitfall:** Ne pas creer deux `useEffect` separes sur `model?.id` — les merger dans le meme effect pour eviter les doubles renders.

### Pattern 3 : Calcul availableAngles

**Ce que c'est:** La liste d'angles a afficher dans la rangee de thumbnails depends de l'etat courant.

```typescript
// Sans tissu selectionne : tous les model_images du modele
// Avec tissu selectionne : uniquement les model_images ayant un rendu publie pour ce tissu

const availableAngles: ModelImage[] = selectedFabricId
  ? model.model_images.filter((img) =>
      visuals.some(
        (v) =>
          v.model_id === model.id &&
          v.model_image_id === img.id &&
          v.fabric_id === selectedFabricId &&
          v.is_published
      )
    )
  : model.model_images
```

### Pattern 4 : Logique currentVisual etendue avec angle

**Ce que c'est:** La recherche du visual publie doit maintenant croiser `fabric_id` ET `model_image_id`.

```typescript
// Phase 8 (avant) :
const currentVisual = selectedFabricId
  ? visuals.find(
      v => v.model_id === model.id &&
           v.fabric_id === selectedFabricId &&
           v.is_published
    ) ?? null
  : null

// Phase 9 (apres) :
const currentVisual = selectedFabricId && selectedAngle
  ? visuals.find(
      v => v.model_id === model.id &&
           v.fabric_id === selectedFabricId &&
           v.model_image_id === selectedAngle &&
           v.is_published
    ) ?? null
  : null
```

**Consequence sur displayImageUrl:** Quand tissu selectionne mais pas de visual pour cet angle, fallback vers `model.model_images.find(img => img.id === selectedAngle)?.image_url ?? originalImageUrl`.

### Pattern 5 : Crossfade opacity 200ms

**Ce que c'est:** Transition CSS `opacity` sur l'element `<Image>` principal pour simuler un fade lors du changement d'angle.

**Implementation simple (un seul element) — RECOMMANDEE:**

```css
/* ConfiguratorModal.module.css */
.imageMain {
  opacity: 1;
  transition: opacity 200ms ease;
}

/* Applique via key prop en React — force le remount = re-fade */
/* OU via className conditionnelle pendant le changement */
```

**Implementation via key React (la plus simple) :**

```tsx
<Image
  key={displayImageUrl}   /* changement de key = remount = transition depuis opacity 0 */
  src={displayImageUrl}
  alt={...}
  fill
  style={{ objectFit: 'cover' }}
  sizes="(max-width: 640px) 100vw, 50vw"
  className={styles.imageMain}
/>
```

Avec CSS :
```css
.imageMain {
  animation: fadeIn 200ms ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

**Pourquoi ce pattern (key) plutot que state `isFading`:** Evite un useState supplementaire, fonctionne avec next/image sans hacks de z-index, compatible happy-dom pour les tests (les tests n'ont pas besoin de verifier l'animation).

**Note sur --transition-fast:** Ce token vaut 300ms. La decision D-06 demande 200ms. Utiliser `200ms ease` directement dans le keyframe, ne pas reutiliser `--transition-fast`.

### Pattern 6 : Rangee thumbnails — HTML semantique

**Ce que c'est:** La rangee de thumbnails suit le meme pattern semantique que la grille de swatches — `role="radiogroup"` + `role="radio"` pour l'accessibilite.

```tsx
{availableAngles.length > 1 && (
  <div
    className={styles.thumbnailRow}
    role="radiogroup"
    aria-label="Choisir l'angle de vue"
  >
    {availableAngles.map((img) => (
      <button
        key={img.id}
        type="button"
        role="radio"
        aria-checked={selectedAngle === img.id}
        aria-label={`Vue ${img.view_type}`}
        className={`${styles.thumbnail} ${selectedAngle === img.id ? styles.thumbnailActive : ''}`}
        onClick={() => setSelectedAngle(img.id)}
      >
        <Image
          src={img.image_url}
          alt=""
          fill
          style={{ objectFit: 'cover' }}
          sizes="72px"
        />
      </button>
    ))}
  </div>
)}
```

**D-11 respecte:** `availableAngles.length > 1` masque la rangee si un seul angle disponible.

### Pattern 7 : Interaction tissu → angle (D-12)

**Ce que c'est:** Quand le tissu change, conserver l'angle si possible, sinon reset.

```typescript
// A appliquer dans le handler onClick du swatch tissu
const handleFabricSelect = (fabricId: string) => {
  setSelectedFabricId(fabricId)
  // Verifier si l'angle actuel a un rendu pour le nouveau tissu
  const hasRenderForCurrentAngle = selectedAngle && visuals.some(
    v => v.model_id === model.id &&
         v.fabric_id === fabricId &&
         v.model_image_id === selectedAngle &&
         v.is_published
  )
  if (!hasRenderForCurrentAngle) {
    // Reset au 3/4 ou premier angle disponible pour ce tissu
    const anglesForFabric = model.model_images.filter((img) =>
      visuals.some(
        v => v.model_id === model.id &&
             v.model_image_id === img.id &&
             v.fabric_id === fabricId &&
             v.is_published
      )
    )
    const default34 = anglesForFabric.find(img => img.view_type === '3/4')
    setSelectedAngle(default34?.id ?? anglesForFabric[0]?.id ?? null)
  }
}
```

### Pattern 8 : displayImageUrl etendu

**Ce que c'est:** La resolution de l'image a afficher doit couvrir tous les cas.

```typescript
// Image de l'angle selectionne (photo originale ou rendu IA)
const selectedAngleImage = selectedAngle
  ? model.model_images.find(img => img.id === selectedAngle)
  : null

// Rendu IA pour le tissu + angle actuel
const currentVisual = selectedFabricId && selectedAngle
  ? visuals.find(
      v => v.model_id === model.id &&
           v.fabric_id === selectedFabricId &&
           v.model_image_id === selectedAngle &&
           v.is_published
    ) ?? null
  : null

// Resolution finale :
// 1. Rendu IA publie pour tissu + angle -> currentVisual.generated_image_url
// 2. Photo originale de l'angle selectionne -> selectedAngleImage.image_url
// 3. Fallback absolu -> getPrimaryImage(model.model_images)
const displayImageUrl =
  currentVisual?.generated_image_url ??
  selectedAngleImage?.image_url ??
  getPrimaryImage(model.model_images)

// Badge "Photo originale" — quand tissu selectionne MAIS pas de rendu pour cet angle
const isOriginalFallback = selectedFabricId !== null && currentVisual === null
```

### Anti-Patterns a Eviter

- **Stocker view_type dans selectedAngle:** view_type n'est pas garanti unique, model_image_id est la cle UNIQUE de la contrainte BDD.
- **Creer un useEffect separé sur selectedFabricId pour l'angle:** merger dans le onClick du swatch pour eviter la complexite de deduire l'intention.
- **Deux `<Image>` superposes pour le crossfade:** ajoute position:relative/absolute + z-index + gestion de l'etat "en transition" — inutilement complexe pour un fade simple.
- **Reutiliser `--transition-fast` (300ms) pour le crossfade:** la decision D-06 specifie ~200ms, ne pas introduire un token qui contredit la decision utilisateur.
- **Afficher les thumbnails AVANT le guard `if (!model)`:** les hooks (useState) doivent etre declares avant le guard, mais le JSX de thumbnails est dans le return apres le guard — pas de probleme.

---

## Don't Hand-Roll

| Probleme | Ne pas construire | Utiliser a la place | Pourquoi |
|----------|------------------|---------------------|----------|
| Crossfade image | Bibliotheque de transition / deux images superposees | CSS `@keyframes fadeIn` + `key` prop React | Zero dependance, compatible next/image, happy-dom-testable |
| Scroll horizontal | Composant carousel custom | `overflow-x: auto` CSS natif | Convention projet D-03 — scroll natif suffit |
| Selection angle | State machine complexe | `useState<string \| null>` | Decision D-14 explicite |
| Thumbnails image | Composant tiers | `<button>` + `<Image>` pattern existant swatch | Coherence avec le pattern swatches Phase 8 |

---

## Common Pitfalls

### Pitfall 1 : Hooks avant le guard `if (!model) return null`

**Ce qui se passe:** Placer un `useState` ou `useEffect` apres le guard provoque une erreur React "Rendered fewer hooks than expected".

**Pourquoi ca arrive:** Le guard `if (!model) return null` existe depuis Phase 6. Les nouveaux hooks de Phase 9 doivent etre declares AVANT lui.

**Comment eviter:** Toujours declarer `useState<string | null>` pour selectedAngle et le `useEffect` de reset AVANT la ligne `if (!model) return null` (actuellement ligne 78 du fichier).

**Signe d'alerte:** Erreur console "React has detected a change in the order of Hooks".

### Pitfall 2 : useEffect sur model?.id — ne pas doubler

**Ce qui se passe:** Creer un deuxieme `useEffect` sur `model?.id` pour le reset d'angle alors qu'il en existe deja un pour `selectedFabricId`.

**Pourquoi ca arrive:** Separation logique qui semble propre mais cree deux renders consecutifs.

**Comment eviter:** Fusionner le reset de `selectedFabricId` ET de `selectedAngle` dans le meme `useEffect([model?.id])`.

### Pitfall 3 : currentVisual sans filtre selectedAngle

**Ce qui se passe:** La logique Phase 8 cherche le premier visual publie pour `model_id + fabric_id` sans tenir compte de l'angle. Quand plusieurs angles ont des rendus, on affiche toujours le meme (le premier retourne par le tableau `visuals`).

**Pourquoi ca arrive:** Oubli d'ajouter `v.model_image_id === selectedAngle` au filtre.

**Comment eviter:** Verifier que le filtre `currentVisual` inclut les trois criteres : `model_id + fabric_id + model_image_id`.

### Pitfall 4 : selectedAngle null quand model_images est vide

**Ce qui se passe:** `getPrimaryImageId` retourne `null` si `model_images.length === 0`. La logique `currentVisual` doit tolerer `selectedAngle === null`.

**Comment eviter:** Le guard `selectedFabricId && selectedAngle` dans la recherche currentVisual couvre deja ce cas.

### Pitfall 5 : Thumbnail src pointe vers l'image IA et pas l'originale

**Ce qui se passe:** Les thumbnails montrent les rendus IA generés au lieu des photos originales du modele. Ca cree une regression visuelle (les rendus IA sont large, le thumbnail serait compresse).

**Comportement correct:** Les thumbnails affichent TOUJOURS `model_image.image_url` (photo originale), jamais le rendu IA genere. Seule l'image principale change entre photo et rendu IA selon le tissu selectionne.

### Pitfall 6 : next/image avec `fill` dans un container sans `position: relative`

**Ce qui se passe:** Les thumbnails avec `fill` disparaissent ou debordent si le parent `.thumbnail` n'a pas `position: relative` et des dimensions explicites.

**Comment eviter:** Le `.thumbnail` CSS doit avoir `position: relative`, `width`, `height`, et `overflow: hidden` (exactement comme `.swatch` Phase 8).

---

## Code Examples

### Exemple complet : logique selectedAngle

```typescript
// Source: patterns etablis ConfiguratorModal.tsx Phase 8

// --- AVANT le guard if (!model) return null ---

const [selectedAngle, setSelectedAngle] = useState<string | null>(null)

// Initialisation + reset au changement de modele — fusionner avec reset fabric
useEffect(() => {
  setSelectedFabricId(null)
  if (model) {
    const image34 = model.model_images.find((img) => img.view_type === '3/4')
    setSelectedAngle(image34?.id ?? model.model_images[0]?.id ?? null)
  } else {
    setSelectedAngle(null)
  }
}, [model?.id])

// --- APRES le guard if (!model) return null ---

// Angles disponibles : tous (sans tissu) ou filtres par rendu publie (avec tissu)
const availableAngles: ModelImage[] = selectedFabricId
  ? model.model_images.filter((img) =>
      visuals.some(
        (v) =>
          v.model_id === model.id &&
          v.model_image_id === img.id &&
          v.fabric_id === selectedFabricId &&
          v.is_published
      )
    )
  : model.model_images

// Rendu IA actuel (filtre par tissu + angle)
const currentVisual = selectedFabricId && selectedAngle
  ? visuals.find(
      (v) =>
        v.model_id === model.id &&
        v.fabric_id === selectedFabricId &&
        v.model_image_id === selectedAngle &&
        v.is_published
    ) ?? null
  : null

// Image de l'angle selectionne (photo originale)
const selectedAngleImage = model.model_images.find(
  (img) => img.id === selectedAngle
)

// Resolution image principale
const displayImageUrl =
  currentVisual?.generated_image_url ??
  selectedAngleImage?.image_url ??
  getPrimaryImage(model.model_images)

// Badge fallback
const isOriginalFallback = selectedFabricId !== null && currentVisual === null

// Alt text angle (D-07)
const angleLabel = selectedAngleImage?.view_type ?? ''
const imageAlt =
  currentVisual && selectedFabric
    ? `Canape ${model.name} en tissu ${selectedFabric.name}${angleLabel ? ` \u2014 vue ${angleLabel}` : ''}`
    : selectedAngleImage
      ? `Canape ${model.name} \u2014 vue ${selectedAngleImage.view_type}`
      : `Canape ${model.name}`
```

### Exemple : Handler changement tissu avec preservation angle (D-12)

```typescript
// Source: logique derivee de la contrainte D-12 CONTEXT.md

const handleFabricSelect = (fabricId: string) => {
  setSelectedFabricId(fabricId)

  const hasRenderForCurrentAngle =
    selectedAngle !== null &&
    visuals.some(
      (v) =>
        v.model_id === model.id &&
        v.fabric_id === fabricId &&
        v.model_image_id === selectedAngle &&
        v.is_published
    )

  if (!hasRenderForCurrentAngle) {
    const anglesForFabric = model.model_images.filter((img) =>
      visuals.some(
        (v) =>
          v.model_id === model.id &&
          v.model_image_id === img.id &&
          v.fabric_id === fabricId &&
          v.is_published
      )
    )
    const default34 = anglesForFabric.find((img) => img.view_type === '3/4')
    setSelectedAngle(default34?.id ?? anglesForFabric[0]?.id ?? null)
  }
}
```

### Exemple : CSS thumbnailRow

```css
/* Source: pattern etabli .swatch Phase 8 ConfiguratorModal.module.css */

.thumbnailRow {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-xs);          /* 4px */
  margin-top: var(--spacing-sm);   /* 8px sous l'image principale */
  overflow-x: auto;                /* D-03 : scroll horizontal mobile */
  /* Masquer la scrollbar visuellement tout en la gardant fonctionnelle */
  scrollbar-width: none;           /* Firefox */
}

.thumbnailRow::-webkit-scrollbar {
  display: none;                   /* Chrome/Safari */
}

.thumbnail {
  position: relative;
  flex-shrink: 0;
  width: 72px;
  height: 54px;                    /* ratio 4/3 — coherent avec image principale */
  border-radius: var(--radius-sm); /* 4px */
  overflow: hidden;
  border: 3px solid transparent;
  cursor: pointer;
  background: none;
  padding: 0;
  transition: box-shadow var(--transition-fast);
}

.thumbnail:hover {
  box-shadow: var(--shadow-md);
}

.thumbnailActive {
  border-color: var(--color-primary);    /* #E49400 — D-05 */
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Crossfade image principale — D-06 : 200ms (pas --transition-fast qui est 300ms) */
.imageMain {
  animation: imageFadeIn 200ms ease;
}

@keyframes imageFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

---

## State of the Art

| Ancienne approche | Approche actuelle | Impact |
|-------------------|-------------------|--------|
| Two-image crossfade avec position absolute + z-index + state | key prop React + CSS @keyframes | Moins de code, zero etat supplementaire, compatible next/image |
| Carousel avec fleches prev/next | Thumbnails scrollables horizontalement | Conforme wireframe, plus direct, pas de dependance |
| Stocker view_type comme cle d'angle | Stocker model_image_id | Alignement avec la contrainte UNIQUE BDD |

---

## Open Questions

1. **Alt text de la photo originale quand selectedAngle et pas de tissu**
   - Ce que l'on sait: D-07 specifie "Canape Milano en tissu Velours — vue profil" pour le cas avec tissu
   - Ce qui est flou: Format exact pour l'etat sans tissu (photo originale) — "Canape Milano — vue 3/4" ou juste "Canape Milano" ?
   - Recommandation: Utiliser "Canape {name} — vue {view_type}" quand un angle est selectionne sans tissu (coherent avec D-07)

2. **Comportement selectedAngle quand availableAngles devient vide**
   - Ce que l'on sait: D-12 gere le reset au changement de tissu
   - Ce qui est flou: Que faire si `anglesForFabric` est vide apres le filtrage (tissu sans aucun rendu publie — ne devrait pas arriver car `eligibleFabrics` filtre deja sur `is_published`) ?
   - Recommandation: `setSelectedAngle(null)` dans ce cas — `displayImageUrl` fallback vers `getPrimaryImage`

---

## Environment Availability

Step 2.6: SKIPPED — phase purement code/config, aucune dependance externe au-dela du projet existant.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (racine projet) |
| Setup file | `src/__tests__/setup.ts` |
| Quick run command | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` |
| Full suite command | `npm test` |
| Estimated runtime | ~1 seconde |

### Phase Requirements → Test Map

| Req ID | Comportement | Type de test | Commande automatisee | Fichier existe? |
|--------|-------------|-------------|---------------------|----------------|
| CONF-06 | Thumbnails angles visibles quand tissu selectionne a plusieurs rendus | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) |
| CONF-06 | Cliquer un thumbnail change l'image principale | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) |
| CONF-06 | Thumbnail actif a aria-checked="true" | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) |
| CONF-06 | Rangee masquee si un seul angle disponible | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) |
| CONF-06 | Sans tissu : thumbnails montrent photos originales de tous les angles | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) |
| CONF-06 | Changement de tissu preserve l'angle si rendu existe, sinon reset 3/4 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) |
| CONF-06 | Changement de modele reset l'angle au 3/4 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (existant — [EDGE] switch de modele) |
| D-07 | Alt text inclut le nom de l'angle quand tissu selectionne | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) |

### Sampling Rate

- **Apres chaque commit de tache:** `npx vitest run src/__tests__/ConfiguratorModal.test.tsx`
- **Apres chaque wave:** `npm test`
- **Phase gate:** Suite complete verte + `npx tsc --noEmit` propre avant `/gsd:verify-work`

### Wave 0 Gaps

Aucun fichier de test a creer — `src/__tests__/ConfiguratorModal.test.tsx` existe et sera enrichi avec la suite "Phase 9 — navigation angles".

- [ ] Ajouter `describe('Phase 9 — navigation angles', ...)` dans `src/__tests__/ConfiguratorModal.test.tsx` avec les fixtures multi-angles necessaires (model avec 2+ model_images, visuals pour angles differents)
- [ ] Ajouter fixtures: `mockModelMultiAngle` (3 model_images : 3/4, face, profil) + visuals correspondants

---

## Project Constraints (from CLAUDE.md)

Directives applicables a cette phase :

| Directive | Impact sur Phase 9 |
|-----------|-------------------|
| PAS de Tailwind, PAS de shadcn/ui — CSS Modules uniquement | Tous les styles dans `.thumbnailRow`, `.thumbnail`, `.thumbnailActive`, `.imageMain` en CSS Modules |
| Un fichier `.module.css` par composant | Ajouter dans `ConfiguratorModal.module.css` existant (meme composant) |
| TypeScript strict (aucun `any`) | `useState<string \| null>` type explicite, `availableAngles: ModelImage[]` type explicite |
| Messages d'erreur en français | Alt text et aria-label en francais (ex: "Vue 3/4", "Choisir l'angle de vue") |
| Design tokens dans `src/app/globals.css` | Utiliser `--color-primary`, `--spacing-xs`, `--spacing-sm`, `--radius-sm`, `--shadow-md` |
| next/image pour les images | Thumbnails utilisant `<Image>` avec `fill` et `sizes="72px"` |
| Supabase client direct (pas Prisma) | Sans impact (Phase 9 = UI pure, pas de fetch) |
| `useState` local dans ConfiguratorModal | Confirme par D-14 — Zustand reserve v10.0 |

---

## Sources

### Primary (HIGH confidence)

- Code source `ConfiguratorModal.tsx` Phase 8 (analyse directe) — patterns hooks, useState, useEffect, guard
- Code source `ConfiguratorModal.module.css` Phase 8 (analyse directe) — pattern `.swatchSelected`, design tokens
- `src/types/database.ts` (analyse directe) — types `ModelImage`, `VisualWithFabricAndImage`, contrainte `model_image_id`
- `src/app/globals.css` (analyse directe) — valeur exacte `--transition-fast: 300ms` (confirme que 200ms doit etre inline)
- `src/__tests__/ConfiguratorModal.test.tsx` Phase 8 (analyse directe) — infrastructure de test existante, patterns de fixtures
- `.planning/phases/09-navigation-angles/09-CONTEXT.md` (analyse directe) — decisions verrouillees D-01 a D-16
- `package.json` (analyse directe) — Vitest 3.2.4, @testing-library/react 16.3.2, next/image inclus dans next 16.2.1

### Secondary (MEDIUM confidence)

- `fichier-mobelunique/wireframe-page-unique.md` Section 5 — thumbnails 72x54px, colonne gauche
- `.planning/STATE.md` — piege documente "Hooks React avant return null guard"

### Tertiary (LOW confidence)

- Aucune source LOw — toutes les informations sont issues du code source direct et des decisions verrouillees

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — code source analyse directement, zero dependance externe
- Architecture: HIGH — patterns etablis Phase 8, types BDD confirmes, logique derivee des decisions D-01 a D-16
- Pitfalls: HIGH — pitfall hook guard documente dans STATE.md, autres derives de l'analyse du code existant
- Tests: HIGH — infrastructure Vitest existante et fonctionnelle (106 tests verts)

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stack stable, pas de dependances externes)
