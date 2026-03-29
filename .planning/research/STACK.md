# Stack Research — v9.0 Configurateur Tissu

**Domain:** SPA configurateur tissu — swatch picker, galerie angles, zoom texture, prix dynamique
**Milestone:** M009 — Configurateur Tissu (CONF-01, CONF-02, CONF-03, CONF-04)
**Researched:** 2026-03-29
**Confidence:** HIGH (capacites de base verifiees dans le projet ; decision zoom documentee ci-dessous)

---

## Verdict principal

**Aucune nouvelle dependance npm requise pour M009.**

Les quatre features du configurateur sont realisables avec les capacites deja installees :

| Feature | Solution | Librairie requise |
|---------|----------|-------------------|
| Swatches cliquables (CONF-01) | `useState` + CSS Modules (cercles 52px) | AUCUNE |
| Galerie angles avec miniatures (CONF-02) | `useState` selectedAngle + `next/image` | AUCUNE |
| Zoom texture swatch (wireframe : encart 100-120px) | CSS `transform: scale()` + `overflow: hidden` | AUCUNE |
| Prix dynamique +80 EUR premium (CONF-03) | `calculatePrice()` deja dans `src/lib/utils.ts` | AUCUNE |
| CTA Shopify (CONF-04) | `<a href={model.shopify_url}>` | AUCUNE |

---

## Recommended Stack

### Core Technologies (deja installees — aucun ajout)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React `useState` | 19.2.4 (installe) | Etat swatch selectionne, angle selectionne | Pattern etabli dans CatalogueClient — coherence totale |
| `next/image` | inclus Next.js 16.2.1 | Rendu IA par angle dans la galerie | `remotePatterns` Supabase Storage deja configure (Phase 4) |
| CSS Modules | natif Next.js | Layout 2 colonnes 60/40, swatches rail, thumbnails angles | Convention projet obligatoire, tous les tokens existent |
| `calculatePrice()` | `src/lib/utils.ts` | Prix base + 80 EUR si tissu premium | Fonction deja implementee, testee dans le projet |
| `/api/models/[slug]/visuals` | route existante | Recupere les rendus IA publies par modele, inclut les donnees tissu | Route publique deja implementee (M006), retourne `fabric` embedded |
| `motion/react` | 12.38.0 (installe) | Transitions optionnelles swatch/angle (si design le requiert) | Deja present, utilise dans phases anterieures — pas de poids supplementaire |

### Supporting Libraries (deja installees)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | 1.7.0 (installe) | Icones dans le modal (chevron, check, externe) | Coherence avec le reste du projet |
| `zustand` + `immer` | 5.0.12 / 11.1.4 (installes) | Etat global tissu selectionne si partage entre composants | Seulement si l'etat tissu doit etre accessible hors du modal (bandeau sticky mobile) |
| Zod 4 | 4.3.6 (installe) | Validation reponse API visuals | Si typage runtime est necessaire (conseille pour robustesse) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript strict | Types des donnees visuals + fabrics | `GeneratedVisual & { fabric: Fabric }` deja defini dans `database.ts` |
| vitest + @testing-library/react | Tests composants configurateur | Pattern etabli — 74 tests existants, infrastructure en place |

---

## Architecture de donnees

### Shape des donnees de l'API `/api/models/[slug]/visuals`

La route publique existante retourne exactement ce dont le configurateur a besoin :

```typescript
// Type derive de database.ts — deja defini
type VisualWithFabricAndImage = GeneratedVisual & {
  fabric: Fabric          // { id, name, slug, is_premium, swatch_url, ... }
  model_image: ModelImage // { id, image_url, view_type, sort_order }
}

// Reponse JSON de GET /api/models/[slug]/visuals
// Filtre cote serveur : is_validated=true, is_published=true, fabric.is_active=true
VisualWithFabricAndImage[]
```

### Pattern de donnees pour le configurateur

Le configurateur n'a pas besoin d'une route `/api/fabrics` publique separee. Les tissus disponibles sont derives des visuals publies : un tissu est "disponible" si au moins un rendu publie existe pour ce modele avec ce tissu. Cette approche evite la desynchronisation (tissu actif mais aucun rendu publie).

```typescript
// Derivation cote client depuis la reponse visuals
const availableFabrics = useMemo(() => {
  const seen = new Set<string>()
  return visuals
    .filter(v => { const seen_result = !seen.has(v.fabric.id); seen.add(v.fabric.id); return seen_result })
    .map(v => v.fabric)
}, [visuals])

// Visuels pour le tissu selectionne (tous les angles)
const selectedVisuals = useMemo(() =>
  visuals.filter(v => v.fabric_id === selectedFabricId),
  [visuals, selectedFabricId]
)
```

---

## Patterns de composants

### 1. Swatches cliquables (CONF-01)

**Pattern :** Rail scrollable de cercles 52px, `role="radio"` + `aria-checked` pour accessibilite.

```tsx
// ConfiguratorFabricPicker.tsx
const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null)

// Rendu swatch : cercle avec swatch_url ou couleur CSS fallback
<button
  role="radio"
  aria-checked={selectedFabricId === fabric.id}
  className={`${styles.swatch} ${selectedFabricId === fabric.id ? styles.swatchActive : ''}`}
  style={{ backgroundImage: fabric.swatch_url ? `url(${fabric.swatch_url})` : undefined }}
  onClick={() => setSelectedFabricId(fabric.id)}
  title={fabric.name}
>
  {fabric.is_premium && <span className={styles.premiumBadge}>+80 €</span>}
</button>
```

Pas de librairie color picker — les swatches sont des images de texture (swatch_url), pas des couleurs solides. Un `<button>` circle avec `background-image` est la solution directe.

### 2. Galerie angles avec miniatures (CONF-02)

**Pattern :** Image principale grande + rail thumbnails 72x54px, `useState` pour l'angle actif.

```tsx
// ConfiguratorVisualGallery.tsx
const [activeVisualId, setActiveVisualId] = useState<string | null>(null)

const activeVisual = selectedVisuals.find(v => v.id === activeVisualId) ?? selectedVisuals[0]

// Image principale
<div className={styles.mainImage}>
  {activeVisual ? (
    <Image
      src={activeVisual.generated_image_url}
      alt={`${model.name} — ${activeVisual.model_image.view_type}`}
      fill
      sizes="(max-width: 640px) 100vw, 60vw"
      style={{ objectFit: 'cover' }}
      priority
    />
  ) : (
    <div className={styles.placeholder}>/* placeholder canape + tissu non selectionne */</div>
  )}
</div>

// Thumbnails angles
<div className={styles.anglesRail} role="tablist">
  {selectedVisuals.map(visual => (
    <button
      key={visual.id}
      role="tab"
      aria-selected={visual.id === activeVisual?.id}
      className={`${styles.thumbnail} ${visual.id === activeVisual?.id ? styles.thumbnailActive : ''}`}
      onClick={() => setActiveVisualId(visual.id)}
    >
      <Image
        src={visual.generated_image_url}
        alt={visual.model_image.view_type}
        fill
        sizes="72px"
        style={{ objectFit: 'cover' }}
      />
    </button>
  ))}
</div>
```

Pas de librairie carousel/gallery — 5 angles maximum selon la maquette. Un rail CSS avec `overflow-x: auto` et `scroll-snap-type: x mandatory` est suffisant.

### 3. Zoom texture swatch (encart wireframe section 5)

**Spec maquette :** "Encart blanc (100-120px preview + infos)" dans la colonne controles. C'est un zoom *statique* : affiche la swatch du tissu selectionne en grand, pas un zoom interactif pan/pinch.

**Pattern :** CSS `transform: scale()` sur `hover`, ou simplement une `<Image>` 100-120px avec `object-fit: cover`. Pas de librairie de zoom.

```tsx
// TexturePreview.tsx
<div className={styles.texturePreview}>
  {selectedFabric?.swatch_url ? (
    <Image
      src={selectedFabric.swatch_url}
      alt={`Texture ${selectedFabric.name}`}
      fill
      sizes="120px"
      style={{ objectFit: 'cover' }}
      className={styles.textureImage}
    />
  ) : (
    <div className={styles.texturePlaceholder} style={{ background: '#e0e0e0' }} />
  )}
  <div className={styles.textureInfo}>
    <span className={styles.textureName}>{selectedFabric?.name ?? 'Choisissez un tissu'}</span>
    {selectedFabric?.is_premium && <span className={styles.texturePremium}>+80 €</span>}
  </div>
</div>
```

L'effet "zoom sur la texture" du wireframe signifie afficher la swatch en grand dans un encart — pas un magnifier interactif. Si la spec evolue vers un zoom interactif (pan/pinch), evaluer `react-medium-image-zoom` a ce moment (voir section Alternatives).

### 4. Prix dynamique (CONF-03)

**Pattern :** `calculatePrice()` deja dans `utils.ts`, `formatPrice()` aussi. Zero code nouveau.

```tsx
// Dans ConfiguratorControls.tsx
import { calculatePrice, formatPrice } from '@/lib/utils'

const totalPrice = selectedFabric
  ? calculatePrice(model.price, selectedFabric.is_premium)
  : model.price

// Affichage
<p className={styles.priceTotal}>{formatPrice(totalPrice)}</p>
{selectedFabric?.is_premium && (
  <p className={styles.priceSupplement}>dont +80 € supplement tissu premium</p>
)}
```

### 5. CTA Shopify (CONF-04)

**Pattern :** Lien `<a>` externe vers `model.shopify_url`. Pas de router Next.js (URL externe).

```tsx
{model.shopify_url && (
  <a
    href={model.shopify_url}
    target="_blank"
    rel="noopener noreferrer"
    className={styles.shopifyCta}
  >
    Commander sur Shopify
    <ExternalLink size={16} aria-hidden="true" />
  </a>
)}
```

---

## Structure des fichiers

```
src/components/public/Catalogue/
├── ConfiguratorModal.tsx              ← MODIFIER : remplacer placeholder par ConfiguratorContent
├── ConfiguratorModal.module.css       ← MODIFIER : layout 2 colonnes 60/40 desktop
├── ConfiguratorContent.tsx            ← NOUVEAU : orchestrateur (fetch visuals + etat)
├── ConfiguratorContent.module.css     ← NOUVEAU
├── ConfiguratorVisualGallery.tsx      ← NOUVEAU : image principale + rail thumbnails
├── ConfiguratorVisualGallery.module.css
├── ConfiguratorFabricPicker.tsx       ← NOUVEAU : swatches rail + texture preview
├── ConfiguratorFabricPicker.module.css
├── ConfiguratorControls.tsx           ← NOUVEAU : prix dynamique + CTA Shopify
└── ConfiguratorControls.module.css
```

Le composant `ConfiguratorContent` gere le fetch via `useEffect` vers `/api/models/[slug]/visuals` et orchestre l'etat global (tissu selectionne, angle actif). Les enfants sont des composants presentationnels purs.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| CSS + `useState` pour swatches | `@uiw/react-color-swatch` | Jamais ici — les swatches sont des textures (images), pas des couleurs hexadecimales. La librairie est concue pour un color picker hex. |
| CSS + `useState` pour galerie angles | `react-image-gallery` | Si le produit evolue vers un carousel avec transitions et lightbox. Pour 5 angles statiques, la librairie est sur-dimensionnee (~30KB gzip). |
| CSS encart statique pour texture preview | `react-medium-image-zoom` v5.4.1 (supporte React 19) | Si la spec evolue vers un zoom interactif click-to-enlarge sur la texture. Seule librairie de zoom verifiee React 19 compatible (peerDeps: `^16.8 \|\| ^17 \|\| ^18 \|\| ^19`). |
| CSS encart statique pour texture preview | `react-zoom-pan-pinch` v3.7.0 | A EVITER : peerDeps declares `^17 \|\| ^18` seulement. React 19 non supporte officiellement. |
| Derive fabrics depuis visuals | Route `/api/fabrics` publique separee | Seulement si le catalogue doit afficher les tissus independamment des rendus generes. Ici, un tissu sans rendu publie ne sert a rien dans le configurateur. |
| `calculatePrice()` + `formatPrice()` existants | Logique inline custom | Jamais — fonctions deja testees et coherentes avec les conventions projet. |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-zoom-pan-pinch` v3.7.0 | peerDeps `^17 \|\| ^18` — React 19.2.4 non supporte officiellement. Risque de conflit au `npm install --legacy-peer-deps` uniquement. | CSS `transform: scale()` pour l'encart texture (use case couvert) |
| `react-image-gallery` ou `lightgallery` | ~30-50KB gzip pour une galerie de 5 thumbnails statiques. Carousel avec navigation fleche/keyboard geree manuellement est trivial en CSS + `useState`. | `useState` + `next/image` + CSS Modules |
| `@uiw/react-color-swatch` | Concu pour selectionner une couleur hex, pas une texture tissu (image). Ajoute ~8KB pour une fonctionnalite realisable avec un `<button>` et `background-image`. | CSS Modules + `<button>` circle |
| Zustand pour l'etat configurateur | L'etat (tissu selectionne, angle actif) est local au modal. Zustand est justifie seulement si le bandeau sticky mobile doit lire le meme etat hors du modal — decision a prendre a l'implementation. | `useState` dans `ConfiguratorContent.tsx` |
| Fetch Supabase direct cote client | Bypass la route API publique existante. Expose la structure de la BDD au client. | `fetch('/api/models/[slug]/visuals')` via `useEffect` dans `ConfiguratorContent` |
| Route `/api/fabrics` publique nouvelle | Inutile — les tissus disponibles pour un modele sont deja inclus dans la reponse de `/api/models/[slug]/visuals` (champ `fabric` embedded). | Deriver les tissus disponibles depuis la reponse visuals |

---

## Stack Patterns by Variant

**Si le bandeau sticky mobile (wireframe bas de page) doit afficher le tissu selectionne :**
- Promouvoir l'etat `selectedFabricId` dans Zustand (deja installe)
- `ConfiguratorContent` dispatch vers le store, `StickyBar` lit depuis le store
- Pas besoin de nouvelle librairie

**Si aucun rendu IA publie n'existe pour un modele :**
- `ConfiguratorContent` recoit un tableau vide depuis l'API
- Afficher un etat vide explicatif : "Les rendus IA sont en cours de preparation pour ce modele."
- Le swatches picker reste vide, les CTA prix/Shopify restent fonctionnels (prix de base)

**Si le nombre d'angles depasse 5 :**
- Le rail thumbnails devient scrollable horizontalement via `overflow-x: auto` + `scroll-snap-type: x mandatory`
- Pas de librairie carousel necessaire avant 10+ angles

**Si la simulation (SIM-01, v10.0) necessite un zoom interactif sur le rendu :**
- Evaluer `react-medium-image-zoom` v5.4.1 a ce moment (React 19 compatible verifie)
- Ne pas l'installer prematurement pour M009

---

## Version Compatibility

| Package | Version actuelle | Compatible Avec | Notes |
|---------|-----------------|-----------------|-------|
| `next/image` | inclus Next.js 16.2.1 | React 19.2.4 | `remotePatterns` Supabase configure, pattern `fill` + `sizes` etabli |
| `calculatePrice` / `formatPrice` | `src/lib/utils.ts` | TypeScript strict | Deja testees dans le projet |
| `motion/react` | 12.38.0 | React 19.2.4 | Si animations swatch/angle requises |
| `react-medium-image-zoom` | 5.4.1 (NON INSTALLE) | `^16.8 \|\| ^17 \|\| ^18 \|\| ^19` verifie | A installer seulement si zoom interactif requis |
| `react-zoom-pan-pinch` | 3.7.0 (NON INSTALLE) | `^17 \|\| ^18` — React 19 NON verifie | A EVITER pour ce projet |

---

## API publiques disponibles

| Route | Methode | Retourne | Status |
|-------|---------|----------|--------|
| `/api/models` | GET | Modeles actifs + model_images | Existante (M001) |
| `/api/models/[slug]` | GET | Modele actif par slug | Existante |
| `/api/models/[slug]/visuals` | GET | Visuals publies + fabric + model_image | Existante (M006) |

La route `/api/models/[slug]/visuals` est le point d'entree unique pour M009. Elle retourne tout ce dont le configurateur a besoin en un seul appel.

---

## Installation

Aucune installation requise. Le stack est complet avec les dependances existantes.

```bash
# Aucune commande npm install necessaire pour M009
# Stack complet avec l'existant :
# - next/image (Next.js 16.2.1)
# - react useState/useMemo (React 19.2.4)
# - CSS Modules
# - calculatePrice / formatPrice (src/lib/utils.ts)
# - lucide-react 1.7.0
# - /api/models/[slug]/visuals (route publique existante)
```

---

## Sources

- Package.json projet — versions installees verifiees directement
- `src/app/api/models/[slug]/visuals/route.ts` — route publique verifiee, retourne `fabric` embedded
- `src/lib/utils.ts` — `calculatePrice()` et `formatPrice()` verifiees
- `src/types/database.ts` — `GeneratedVisual`, `Fabric`, `ModelImage` types verifies
- [react-medium-image-zoom package.json sur GitHub](https://github.com/rpearce/react-medium-image-zoom/blob/main/package.json) — peerDeps `^16.8 || ^17 || ^18 || ^19` verifie (HIGH confidence)
- [react-zoom-pan-pinch peerDependencies — npmpeer.dev](https://www.npmpeer.dev/packages/react-zoom-pan-pinch/compatibility) — peerDeps `^17 || ^18` seulement (React 19 non supporte) verifie (MEDIUM confidence)
- [Wireframe page unique v4](../maquette/wireframe-page-unique.md) — section 5 configurateur, spec zoom texture "encart 100-120px" = preview statique, pas zoom interactif
- [CSS image zoom sans librairie — MDN scale()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/transform-function/scale) — HIGH confidence

---

*Stack research pour : Configurateur Tissu v9.0 (M009)*
*Recherche : 2026-03-29*
