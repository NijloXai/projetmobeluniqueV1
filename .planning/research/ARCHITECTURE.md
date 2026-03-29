# Architecture Research — v9.0 Configurateur Tissu

**Domain:** Intégration configurateur tissu dans modal existant — SPA Next.js 16 App Router
**Researched:** 2026-03-29
**Confidence:** HIGH (code source analysé directement, patterns établis dans le projet)

---

## Context: Ce qui existe déjà

La frontière Server/Client est établie et fonctionnelle :

- `CatalogueSection` (Server Component) : fetch Supabase `models + model_images`, passe `ModelWithImages[]` en props
- `CatalogueClient` (Client Component) : state search + selectedModel + triggerRef, ouvre `ConfiguratorModal`
- `ConfiguratorModal` : dialog natif, reçoit `model: ModelWithImages | null`, affiche placeholder

**Ce que v9.0 doit remplacer :** le bloc `.placeholder` ("Configurateur à venir") dans `ConfiguratorModal.tsx` par le vrai contenu configurateur.

**Ce que v9.0 ne touche pas :** `CatalogueSection`, `CatalogueClient`, `ProductCard`, la logique search/filter, le dialog natif, le scroll lock, les breakpoints.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  CatalogueSection (Server Component)                                │
│    fetch: models + model_images (inchangé)                          │
│    + fetch: fabrics actifs (NOUVEAU — co-fetch server-side)         │
│    + fetch: generated_visuals publiés (NOUVEAU — co-fetch)          │
│                                                                     │
│  ↓ props: models: ModelWithImages[]                                 │
│  ↓ props: fabrics: Fabric[]                        (NOUVEAU)        │
│  ↓ props: visuals: VisualWithFabric[]              (NOUVEAU)        │
│                                                                     │
│  CatalogueClient (Client Component — inchangé sauf forwarding)      │
│    ↓ passe fabrics + visuals filtrés par model.id à ConfiguratorModal│
│                                                                     │
│  ConfiguratorModal (Client Component — MODIFIÉ)                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  [col gauche 60%]          [col droite 40%]                 │    │
│  │  RenduIA (image visuel     FabricSelector (swatches)        │    │
│  │  ou placeholder si aucun   PriceDisplay (dynamique)         │    │
│  │  tissu sélectionné)        ShopifyCTA (lien externe)        │    │
│  │  AngleSelector             ←                                │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼ Supabase (server-side, buildtime)
┌─────────────────────────────────────────────────────────────────────┐
│  Tables: models, model_images, fabrics, generated_visuals           │
│  Buckets: fabric-swatches (public), generated-visuals (public)      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Decision Centrale : Fetch Server-Side vs Client-Side

**Verdict : Fetch server-side dans CatalogueSection. Pas de nouvel API route public.**

### Pourquoi server-side

`CatalogueSection` est déjà un Server Component async qui appelle Supabase directement. Le pattern est établi. Étendre ce fetch à deux queries supplémentaires (`fabrics` + `generated_visuals`) coûte zéro roundtrip réseau supplémentaire — tout se passe côté serveur au moment du rendu initial.

Un fetch client-side depuis `ConfiguratorModal` (avec `useEffect` + `fetch('/api/fabrics')`) créerait :

1. Un waterfall : l'utilisateur ouvre le modal, voit un skeleton, attend le réseau
2. Un état de chargement à gérer (loading, error, retry)
3. Un double rendu initial inutile

Les données de tissus et de visuels sont **stables au moment du rendu** — elles ne changent pas en temps réel pendant la session utilisateur. Un refresh de page suffit pour voir les nouvelles données publiées par l'admin.

### Pourquoi pas l'API route `/api/models/[slug]/visuals` existante

Cette route est conçue pour des consommateurs externes (mobile, Shopify embed). Elle fait deux requêtes séquentielles (d'abord chercher le model par slug, puis les visuals) et retourne un format enrichi qui n'est pas exactement ce dont le modal a besoin. L'appeler depuis le Server Component serait un aller-retour HTTP inutile — Supabase est accessible directement.

### Contre-argument valide à connaître

Si le catalogue comporte 50+ modèles avec chacun 10+ visuals, charger tous les visuals dès la page initiale alourdit le rendu. Pour v9.0 (catalogue limité à ~10 modèles, ~5 tissus, ~50 visuals max), ce n'est pas un problème. La migration vers un fetch client-side à l'ouverture du modal sera une optimisation différée documentée dans PITFALLS.md.

---

## Component Responsibilities

| Composant | Responsabilité | Type | Statut v9.0 |
|-----------|----------------|------|-------------|
| `CatalogueSection` | Fetch Supabase (models + images + fabrics + visuals), assemble les props | Server Component | MODIFIÉ |
| `CatalogueClient` | State search/modal, forward fabrics+visuals à ConfiguratorModal | Client Component | MODIFIÉ (forwarding uniquement) |
| `ConfiguratorModal` | Remplace le placeholder par le configurateur réel | Client Component | MODIFIÉ (contenu) |
| `FabricSelector` | Affiche les swatches cliquables, émet `selectedFabric` | Client Component | CRÉÉ |
| `RenduIA` | Affiche le visuel publié selon tissu + angle sélectionné, ou placeholder image si aucun visuel | Client Component | CRÉÉ |
| `AngleSelector` | Miniatures d'angles cliquables (view_type: front, 3/4, side, back, detail) | Client Component | CRÉÉ |
| `PriceDisplay` | Prix dynamique selon `is_premium` du tissu sélectionné | Client Component | CRÉÉ |

---

## Recommended Project Structure

```
src/
  components/
    public/
      Catalogue/
        CatalogueSection.tsx          ← MODIFIÉ : co-fetch fabrics + visuals
        CatalogueSection.module.css   ← inchangé
        CatalogueClient.tsx           ← MODIFIÉ : forwarding props fabrics/visuals
        ConfiguratorModal.tsx         ← MODIFIÉ : remplace placeholder par contenu réel
        ConfiguratorModal.module.css  ← MODIFIÉ : layout 2 colonnes desktop
        FabricSelector.tsx            ← CRÉÉ : swatches rail
        FabricSelector.module.css     ← CRÉÉ
        RenduIA.tsx                   ← CRÉÉ : image visuel IA ou fallback
        RenduIA.module.css            ← CRÉÉ
        AngleSelector.tsx             ← CRÉÉ : miniatures angles
        AngleSelector.module.css      ← CRÉÉ
        PriceDisplay.tsx              ← CRÉÉ : prix avec supplément premium
        PriceDisplay.module.css       ← CRÉÉ
        ProductCard.tsx               ← inchangé
        ProductCard.module.css        ← inchangé
        ProductCardSkeleton.tsx       ← inchangé
        ProductCardSkeleton.module.css ← inchangé
  app/
    api/
      models/route.ts                 ← inchangé
      models/[slug]/visuals/route.ts  ← inchangé (route externe non utilisée en interne)
      (pas de nouvelle route API publique nécessaire)
  types/
    database.ts                       ← inchangé — Fabric, GeneratedVisual, ModelWithImages déjà définis
  lib/
    utils.ts                          ← inchangé — calculatePrice(basePrice, isPremium) déjà disponible
```

### Rationale

- **Pas de sous-dossiers Configurateur/** : 5-6 composants liés qui partagent déjà le dossier `Catalogue/`. Créer un sous-dossier n'apporte rien pour ce volume.
- **PriceDisplay séparé** : isole la logique de prix dynamique (`calculatePrice` depuis `lib/utils.ts`). Testable indépendamment.
- **FabricSelector séparé de RenduIA** : découplage clair — sélection du tissu vs affichage du résultat. L'état `selectedFabric` remonte à `ConfiguratorModal` qui l'injecte dans les deux.

---

## Architectural Patterns

### Pattern 1 : Co-fetch server-side dans CatalogueSection

**What:** Étendre le Server Component existant avec deux queries Supabase parallèles (fabrics actifs + visuals publiés). Résultat passé en props à CatalogueClient, puis forwardé à ConfiguratorModal.

**When to use:** Données stables au moment du rendu, pas besoin de refetch en temps réel.

**Trade-offs:**
- Pro : zéro waterfall, zéro loading state dans le modal
- Pro : pas de nouveau fichier API, cohérent avec le pattern existant
- Con : toutes les données sont chargées même si l'utilisateur n'ouvre aucun modal
- Con : si visuals devient très volumineux (100+), considérer une stratégie lazy

```typescript
// CatalogueSection.tsx — modification minimale
export async function CatalogueSection() {
  const supabase = await createClient()

  // Queries parallèles — pas de await séquentiel
  const [modelsResult, fabricsResult, visualsResult] = await Promise.all([
    supabase
      .from('models')
      .select('*, model_images(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('fabrics')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('generated_visuals')
      .select('*, fabric:fabrics(*), model_image:model_images(*)')
      .eq('is_validated', true)
      .eq('is_published', true),
  ])

  // ... gestion erreurs + tri model_images
  return (
    <CatalogueClient
      models={models}
      fabrics={fabricsResult.data ?? []}
      visuals={visualsResult.data ?? []}
    />
  )
}
```

### Pattern 2 : Forwarding props sans Zustand

**What:** `CatalogueClient` reçoit `fabrics` et `visuals` en props et les passe à `ConfiguratorModal`. Pas de store global.

**When to use:** Les données de tissus et visuels sont en lecture seule dans le modal — aucun besoin de mutation partagée entre sections. Zustand sera justifié uniquement quand le configurateur doit communiquer avec la section Simulation (milestone ultérieur).

**Trade-offs:**
- Pro : zéro abstraction supplémentaire, props explicites, trivial à tracer
- Con : prop drilling un niveau (CatalogueSection → CatalogueClient → ConfiguratorModal) — acceptable pour 3 niveaux

```typescript
// CatalogueClient.tsx — ajout minimal
interface CatalogueClientProps {
  models: ModelWithImages[]
  fabrics: Fabric[]                    // NOUVEAU
  visuals: VisualWithFabricAndImage[]  // NOUVEAU
}

// Dans le JSX :
<ConfiguratorModal
  model={selectedModel}
  onClose={handleModalClose}
  fabrics={fabrics}          // NOUVEAU
  visuals={visuals.filter(v => v.model_id === selectedModel?.id)}  // filtre par modèle
/>
```

### Pattern 3 : State local dans ConfiguratorModal

**What:** `selectedFabric` et `selectedAngle` sont des états locaux à `ConfiguratorModal` via `useState`. Réinitialisés à chaque ouverture du modal (via `useEffect` sur `model`).

**When to use:** État purement UI du configurateur, pas partagé avec l'extérieur du modal.

**Trade-offs:**
- Pro : simple, pas de fuite d'état entre deux ouvertures de modal
- Pro : cohérent avec le pattern existant (selectedModel est dans CatalogueClient)
- Con : si le sticky bar mobile (milestone ultérieur) doit afficher le tissu sélectionné, il faudra remonter l'état

```typescript
// ConfiguratorModal.tsx
const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null)
const [selectedAngle, setSelectedAngle] = useState<string>('3/4')

// Reset à chaque changement de modèle
useEffect(() => {
  setSelectedFabricId(null)
  setSelectedAngle('3/4')
}, [model?.id])

// Visuel actif : croisement model_image (par view_type) + fabric sélectionné
const activeVisual = useMemo(() => {
  if (!selectedFabricId || !model) return null
  return visuals.find(
    v => v.fabric_id === selectedFabricId &&
         v.model_image?.view_type === selectedAngle
  ) ?? null
}, [visuals, selectedFabricId, selectedAngle])
```

### Pattern 4 : Tissu sélectionné → prix dynamique via calculatePrice

**What:** Utiliser `calculatePrice(model.price, fabric.is_premium)` depuis `src/lib/utils.ts` (déjà écrit et testé). Le supplément premium est 80 € fixe.

**When to use:** Toujours — la logique métier prix est centralisée dans utils.ts, ne pas la dupliquer dans le composant.

```typescript
// PriceDisplay.tsx
import { calculatePrice, formatPrice } from '@/lib/utils'

const total = selectedFabric
  ? calculatePrice(model.price, selectedFabric.is_premium)
  : model.price

const label = selectedFabric?.is_premium
  ? `${formatPrice(total)} (dont +80 € supplement premium)`
  : formatPrice(total)
```

---

## Data Flow

### Flux initial — chargement de la page

```
Navigateur demande /
    ↓
CatalogueSection (Server Component)
    ↓ Promise.all — 3 queries Supabase parallèles
    ├─ models + model_images WHERE is_active = true
    ├─ fabrics WHERE is_active = true
    └─ generated_visuals + fabric + model_image
           WHERE is_validated = true AND is_published = true
    ↓
HTML initial avec données embarquées (pas de fetch client initial)
    ↓
Hydratation React — CatalogueClient devient interactif
```

### Flux ouverture configurateur

```
User clique "Configurer ce modèle" (ProductCard)
    ↓
CatalogueClient.handleConfigure(model)
    → setSelectedModel(model)
    ↓
ConfiguratorModal render avec:
    model = ModelWithImages (le canapé)
    fabrics = Fabric[] (tous les tissus actifs — filtrés côté CatalogueClient non nécessaire,
                        filtrage par "a au moins un visual publié pour ce modèle" est optionnel)
    visuals = VisualWithFabricAndImage[] (filtrés par model.id dans CatalogueClient)
    ↓
ConfiguratorModal affiche:
    - Image principale (model_images view_type '3/4' — identique à avant)
    - FabricSelector avec fabrics []
    - RenduIA avec activeVisual = null (aucun tissu sélectionné → placeholder)
    - PriceDisplay avec model.price (tissu non sélectionné)
    - ShopifyCTA désactivé ou masqué (pas de tissu → pas d'achat direct)
```

### Flux sélection tissu

```
User clique un swatch (FabricSelector)
    ↓
setSelectedFabricId(fabric.id) dans ConfiguratorModal
    ↓
useMemo recalcule activeVisual
    → cherche generated_visuals WHERE fabric_id = selectedFabricId
                                  AND model_image.view_type = selectedAngle
    ↓
RenduIA re-render :
    si activeVisual trouvé → affiche generated_image_url (next/image)
    si aucun visual pour cet angle → affiche image originale du modèle (fallback gracieux)
    ↓
PriceDisplay re-render :
    calculatePrice(model.price, selectedFabric.is_premium)
    ↓
ShopifyCTA re-render :
    href = model.shopify_url (existant dans la table models)
    texte = "Commander sur Shopify" (actif car tissu sélectionné)
```

### Flux changement d'angle

```
User clique miniature angle (AngleSelector)
    ↓
setSelectedAngle(view_type) dans ConfiguratorModal
    ↓
useMemo recalcule activeVisual (même fabric_id, nouveau view_type)
    ↓
RenduIA re-render avec nouveau visuel ou fallback si pas de visual pour cet angle
```

### Schéma de données — types TypeScript utilisés

```
ModelWithImages (existant)
  model.id           → clé pour filtrer les visuals
  model.price        → base du calcul prix
  model.shopify_url  → href du CTA Shopify
  model.model_images → AngleSelector (thumbnails) + RenduIA (fallback)

Fabric (existant)
  fabric.id          → selectedFabricId
  fabric.name        → label swatch
  fabric.swatch_url  → miniature swatch (next/image)
  fabric.is_premium  → calcul prix (+80 €)
  fabric.category    → optionnel : groupement swatches

GeneratedVisual + fabric: Fabric + model_image: ModelImage (existant : VisualWithFabricAndImage)
  visual.generated_image_url  → RenduIA (next/image)
  visual.fabric_id            → croisement avec selectedFabricId
  visual.model_image.view_type → croisement avec selectedAngle
```

---

## Integration Points — Nouveau vs Modifié vs Inchangé

### Fichiers MODIFIÉS

| Fichier | Modification | Raison |
|---------|-------------|--------|
| `src/components/public/Catalogue/CatalogueSection.tsx` | Ajouter 2 queries Promise.all (fabrics + visuals), passer en props | Co-fetch server-side |
| `src/components/public/Catalogue/CatalogueClient.tsx` | Recevoir + forward fabrics/visuals en props, filtrer visuals par model.id | Forwarding minimal |
| `src/components/public/Catalogue/ConfiguratorModal.tsx` | Remplacer bloc `.placeholder` par FabricSelector + RenduIA + PriceDisplay + ShopifyCTA | Contenu réel |
| `src/components/public/Catalogue/ConfiguratorModal.module.css` | Ajuster layout `.body` pour accueillir les nouveaux composants | Mise en page configurateur |

### Fichiers CRÉÉS

| Fichier | Type | Rôle |
|---------|------|------|
| `src/components/public/Catalogue/FabricSelector.tsx` | Client Component | Rail de swatches cliquables, état actif visuel |
| `src/components/public/Catalogue/FabricSelector.module.css` | CSS Module | Grille swatches, état selected, badge premium |
| `src/components/public/Catalogue/RenduIA.tsx` | Client Component | Image visuel IA (next/image) ou fallback gracieux |
| `src/components/public/Catalogue/RenduIA.module.css` | CSS Module | Wrapper image, badge "Rendu IA", état loading |
| `src/components/public/Catalogue/AngleSelector.tsx` | Client Component | Miniatures d'angles cliquables |
| `src/components/public/Catalogue/AngleSelector.module.css` | CSS Module | Rail horizontal, état actif |
| `src/components/public/Catalogue/PriceDisplay.tsx` | Client Component | Prix formaté avec supplément premium |
| `src/components/public/Catalogue/PriceDisplay.module.css` | CSS Module | Layout prix + badge premium |

### Fichiers INCHANGÉS

| Fichier | Raison |
|---------|--------|
| `src/app/api/models/route.ts` | Route externe — pas touchée |
| `src/app/api/models/[slug]/visuals/route.ts` | Route externe — pas consommée en interne |
| `src/types/database.ts` | Fabric, GeneratedVisual, ModelWithImages déjà définis |
| `src/lib/utils.ts` | `calculatePrice` + `formatPrice` déjà disponibles |
| `src/components/public/Catalogue/ProductCard.tsx` | Inchangé |
| `src/components/public/Catalogue/ProductCardSkeleton.tsx` | Inchangé |
| `src/components/public/Catalogue/CatalogueSection.module.css` | Inchangé |
| `src/app/globals.css` | Tokens suffisants |
| Tous les composants admin | Espace isolé |

---

## Build Order

L'ordre suit les dépendances feuille → conteneur.

1. **Types** — Vérifier que `VisualWithFabricAndImage` (ou équivalent avec `model_image`) est défini dans `types/database.ts`. La query Supabase retourne `generated_visuals + fabric:fabrics(*) + model_image:model_images(*)`. Si le type enrichi n'existe pas, l'ajouter. [MODIFIE `types/database.ts` — ajout minimal si nécessaire]

2. **PriceDisplay** — Composant feuille, dépend uniquement de `Fabric` (type) et `calculatePrice`/`formatPrice` (utils). Aucune dépendance interne. [CRÉE `PriceDisplay.tsx` + `.module.css`]

3. **FabricSelector** — Composant feuille, reçoit `fabrics: Fabric[]`, `selectedId: string | null`, `onSelect: (id: string) => void`. Dépend de `next/image` pour les swatches. [CRÉE `FabricSelector.tsx` + `.module.css`]

4. **AngleSelector** — Composant feuille, reçoit `angles: string[]`, `selectedAngle: string`, `onSelect: (angle: string) => void`. Sans images (juste labels ou thumbnails des model_images). [CRÉE `AngleSelector.tsx` + `.module.css`]

5. **RenduIA** — Composant feuille, reçoit `visual: GeneratedVisual | null`, `fallbackUrl: string | null`, `alt: string`. Affiche le rendu IA ou l'image originale. Dépend de `next/image`. [CRÉE `RenduIA.tsx` + `.module.css`]

6. **ConfiguratorModal** — Assemble FabricSelector + AngleSelector + RenduIA + PriceDisplay. Porte `selectedFabricId` + `selectedAngle` en state local. Remplace le bloc `.placeholder`. [MODIFIE `ConfiguratorModal.tsx` + `.module.css`]

7. **CatalogueClient** — Recevoir les nouvelles props `fabrics` + `visuals`, les forwarder à ConfiguratorModal avec le filtre `model_id`. [MODIFIE `CatalogueClient.tsx`]

8. **CatalogueSection** — Ajouter `Promise.all` avec les deux nouvelles queries. Passer `fabrics` + `visuals` en props à CatalogueClient. [MODIFIE `CatalogueSection.tsx`]

---

## Anti-Patterns

### Anti-Pattern 1 : Fetch client-side à l'ouverture du modal

**What people do:** `useEffect(() => { fetch('/api/fabrics').then(...) }, [model])` dans ConfiguratorModal.

**Why it's wrong:** Crée un waterfall perceptible par l'utilisateur — le modal s'ouvre vide, puis les swatches apparaissent après 200-500ms. Nécessite un skeleton, un état d'erreur, une logique de retry. Toute cette complexité est évitable.

**Do this instead:** Co-fetch server-side dans CatalogueSection, données disponibles instantanément à l'ouverture du modal.

### Anti-Pattern 2 : Créer une nouvelle route API publique /api/fabrics

**What people do:** `GET /api/fabrics` publique pour que le Client Component fetch les tissus.

**Why it's wrong:** Ajoute une indirection inutile. CatalogueSection est déjà un Server Component avec accès direct Supabase. Une API route pour consommation interne par un Server Component est un anti-pattern Next.js documenté.

**Do this instead:** Query Supabase directe depuis CatalogueSection avec `createClient()` serveur.

### Anti-Pattern 3 : Filtrer les visuals par model_id dans CatalogueSection

**What people do:** Pour chaque modèle, ne passer que ses propres visuals en props.

**Why it's wrong:** Oblige à restructurer les visuals en dictionnaire par model_id côté serveur, complique le type des props, et de toute façon CatalogueClient doit quand même filtrer dynamiquement quand `selectedModel` change.

**Do this instead:** Passer tous les visuals publiés à CatalogueClient, filtrer par `model_id === selectedModel.id` au moment du forwarding à ConfiguratorModal (une ligne de code).

### Anti-Pattern 4 : Zustand pour selectedFabricId

**What people do:** Créer un store Zustand `useConfiguratorStore` avec `selectedFabricId`, `selectedAngle`, etc.

**Why it's wrong:** Overkill pour un état confiné à ConfiguratorModal. Zustand sera justifié en v10.0 (simulation salon) quand le tissu sélectionné doit être lu depuis une section distante dans le DOM.

**Do this instead:** `useState` local à ConfiguratorModal. Migration documentée pour v10.0.

### Anti-Pattern 5 : Afficher tous les swatches comme cliquables même sans visual publié

**What people do:** Afficher tous les tissus actifs avec la même apparence visuelle.

**Why it's wrong:** L'utilisateur clique un tissu, aucun rendu ne s'affiche — frustration. Il ne sait pas si c'est un bug ou une absence volontaire.

**Do this instead:** Identifier quels tissus ont au moins un visual publié pour ce modèle. Les autres tissus : apparence `opacity: 0.4` + curseur `not-allowed` + tooltip "Rendu non disponible". Cette logique est un `Set` calculé à partir des visuals reçus — aucun appel réseau supplémentaire.

---

## Scaling Considerations

| Échelle | Approche |
|---------|----------|
| Actuel : ~5 modèles, ~6 tissus, ~30 visuals | Co-fetch tout en server-side — aucun problème |
| 20 modèles, 15 tissus, ~300 visuals | Toujours viable en server-side ; `Promise.all` retourne rapidement |
| 50+ modèles, 30+ tissus, 1500+ visuals | Migrer vers fetch client-side à l'ouverture du modal : `GET /api/models/[id]/configurator` qui retourne fabrics + visuals pour un modèle spécifique |

**Premier bottleneck :** Non pas le volume de données JSON (quelques Ko), mais le nombre d'images `generated_image_url` chargées. `next/image` avec `loading="lazy"` gère cela — les visuals hors-viewport ne sont pas téléchargés.

---

## Sources

- Code source analysé directement :
  - `src/components/public/Catalogue/CatalogueSection.tsx`
  - `src/components/public/Catalogue/CatalogueClient.tsx`
  - `src/components/public/Catalogue/ConfiguratorModal.tsx`
  - `src/components/public/Catalogue/ConfiguratorModal.module.css`
  - `src/app/api/models/[slug]/visuals/route.ts`
  - `src/app/api/admin/fabrics/route.ts`
  - `src/types/database.ts`
  - `src/lib/utils.ts`
  - `src/lib/schemas.ts`
- Wireframe : `.planning/maquette/wireframe-page-unique.md` (section 5 — Configurateur)
- Requirements actifs : `.planning/PROJECT.md` (CONF-01, CONF-02, CONF-03, CONF-04)
- [Next.js — Do not call Route Handlers from Server Components](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#good-to-know) (HIGH confidence)
- Pattern `calculatePrice` : `src/lib/utils.ts` ligne 16 (HIGH confidence — code existant)

---

*Architecture research pour : v9.0 Configurateur Tissu*
*Researched: 2026-03-29*
