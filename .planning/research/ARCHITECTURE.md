# Architecture Research — M008 Catalogue Produits

**Domain:** SPA publique Next.js 16 App Router — ajout catalogue dynamique avec search, sort, modal
**Researched:** 2026-03-28
**Confidence:** HIGH (code source existant analysé directement + patterns Next.js 16 App Router)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  page.tsx (Server Component — orchestrateur)                        │
│  ┌───────────────┐ ┌───────────────┐ ┌────────────────────────────┐ │
│  │  Header       │ │  Hero         │ │  HowItWorks                │ │
│  │  (Client)     │ │  (Client)     │ │  (Client)                  │ │
│  └───────────────┘ └───────────────┘ └────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  CatalogueSection (Server Component — fetch Supabase)           │ │
│  │  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  │  CatalogueClient (Client Component — state local)       │   │ │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │   │ │
│  │  │  │ SearchBar    │ │ SortSelect   │ │ ProductGrid    │  │   │ │
│  │  │  │ (Client)     │ │ (Client)     │ │ (Client)       │  │   │ │
│  │  │  └──────────────┘ └──────────────┘ └───────┬────────┘  │   │ │
│  │  │                                            │            │   │ │
│  │  │                              ┌─────────────┴──────────┐ │   │ │
│  │  │                              │  ProductCard (Client)  │ │   │ │
│  │  │                              └────────────────────────┘ │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  ConfigurateurModal (Client — Radix Dialog)                     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                          │ fetch (server-side)
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API Route : GET /api/models                                        │
│  Supabase PostgreSQL — models + model_images + fabrics (actifs)     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsabilité | Type | Fichier |
|-----------|----------------|------|---------|
| `CatalogueSection` | Fetch server-side des modèles, passe les données en props | Server Component | `components/public/Catalogue/CatalogueSection.tsx` |
| `CatalogueClient` | State catalogue (query, sort, selectedProduct, modalOpen), filtre + tri | Client Component | `components/public/Catalogue/CatalogueClient.tsx` |
| `SearchBar` | Input texte, émet la query vers CatalogueClient | Client Component | `components/public/Catalogue/SearchBar.tsx` |
| `SortSelect` | Select natif (Radix-free), émet le critère de tri | Client Component | `components/public/Catalogue/SortSelect.tsx` |
| `ProductGrid` | Layout grid responsive, itère sur les produits filtrés | Client Component | `components/public/Catalogue/ProductGrid.tsx` |
| `ProductCard` | Affiche un canapé (image, nom, prix, swatches, CTA) | Client Component | `components/public/Catalogue/ProductCard.tsx` |
| `ConfigurateurModal` | Radix Dialog, fullscreen mobile / 90vw desktop, placeholder v8 | Client Component | `components/public/Catalogue/ConfigurateurModal.tsx` |

---

## Recommended Project Structure

```
src/
  app/
    page.tsx                        ← MODIFIE : ajoute CatalogueSection + section id="catalogue"
    page.module.css                 ← inchangé
  components/
    public/
      Header/                       ← inchangé
      Hero/                         ← inchangé
      HowItWorks/                   ← inchangé
      Catalogue/                    ← NOUVEAU dossier
        CatalogueSection.tsx        ← Server Component (fetch)
        CatalogueSection.module.css ← styles section wrapper
        CatalogueClient.tsx         ← Client Component (state)
        CatalogueClient.module.css  ← styles toolbar (search + sort)
        SearchBar.tsx               ← Client Component
        SearchBar.module.css
        SortSelect.tsx              ← Client Component
        SortSelect.module.css
        ProductGrid.tsx             ← Client Component
        ProductGrid.module.css
        ProductCard.tsx             ← Client Component
        ProductCard.module.css
        ConfigurateurModal.tsx      ← Client Component (Radix Dialog)
        ConfigurateurModal.module.css
  lib/
    supabase/                       ← inchangé
    ai/                             ← inchangé
    schemas.ts                      ← inchangé
    utils.ts                        ← inchangé
  types/
    database.ts                     ← inchangé — ModelWithImages déjà défini
```

### Structure Rationale

- **Catalogue/ dossier unique** : tous les composants du catalogue vivent ensemble. Pas de sous-dossiers inutiles pour 7 composants liés.
- **CatalogueSection séparé de CatalogueClient** : pattern Server/Client boundary explicite. Le Server Component fait le fetch, le Client Component gère le state. Ce split évite de mettre `'use client'` au niveau section et de perdre le rendu serveur.
- **Pas de store Zustand pour M008** : le state catalogue (query, sort, selectedProduct, modalOpen) est local à CatalogueClient. Zustand sera justifié seulement en M009+ quand le configurateur et la simulation doivent partager le produit sélectionné entre des sections distantes.

---

## Architectural Patterns

### Pattern 1 : Server/Client Boundary au niveau section

**What:** CatalogueSection est un Server Component qui fait le fetch Supabase et passe `models` en props à CatalogueClient (Client Component).

**When to use:** Quand une section a des données initiales serveur + state interactif client. C'est le pattern standard Next.js App Router pour les sections avec données.

**Trade-offs:**
- Pro : fetch server-side, pas de waterfall client, pas de loading state initial
- Pro : CatalogueClient peut être réduit au minimum de JavaScript
- Con : les données sont figées au moment du rendu serveur (pas de refetch automatique)
- Con : légèrement plus de fichiers qu'une approche tout-client

```typescript
// CatalogueSection.tsx — Server Component
import { createClient } from '@/lib/supabase/server'
import { CatalogueClient } from './CatalogueClient'
import type { ModelWithImages } from '@/types/database'

export async function CatalogueSection() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('models')
    .select('*, model_images(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const models: ModelWithImages[] = (data ?? []).map((m) => ({
    ...m,
    model_images: (m.model_images ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }))

  return (
    <section id="catalogue" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Collection Signature</h2>
        <p className={styles.sectionSubtitle}>
          Choisissez votre modèle et configurez-le dans le tissu de votre choix.
        </p>
        <CatalogueClient initialModels={models} />
      </div>
    </section>
  )
}
```

**Note :** Ne pas passer par `/api/models` depuis le Server Component — appeler Supabase directement avec `createClient()` serveur. Évite un aller-retour HTTP inutile. L'API route existe pour les clients publics externes, pas pour la consommation interne serveur.

### Pattern 2 : State local dans CatalogueClient (sans Zustand)

**What:** CatalogueClient gère `searchQuery`, `sortOrder`, `selectedProduct`, `modalOpen` avec `useState`. Le filtrage et le tri sont des opérations pures `useMemo` sur `initialModels`.

**When to use:** State localisé à une seule section, pas partagé entre sections distantes.

**Trade-offs:**
- Pro : simple, zero dépendance externe, trivial à tester
- Pro : pas d'overhead Zustand pour 4 champs de state
- Con : si M009 a besoin de `selectedProduct`, il faudra le remonter (lift state up vers page.tsx ou migrer vers Zustand)

```typescript
// CatalogueClient.tsx — Client Component
'use client'

import { useState, useMemo } from 'react'
import type { ModelWithImages } from '@/types/database'

type SortOrder = 'newest' | 'price_asc' | 'price_desc'

interface CatalogueClientProps {
  initialModels: ModelWithImages[]
}

export function CatalogueClient({ initialModels }: CatalogueClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [selectedProduct, setSelectedProduct] = useState<ModelWithImages | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filteredModels = useMemo(() => {
    let result = [...initialModels]

    // Filtre par nom (insensible à la casse, diacritiques normalisées)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      result = result.filter((m) =>
        m.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
      )
    }

    // Tri
    switch (sortOrder) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'newest':
      default:
        result.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }

    return result
  }, [initialModels, searchQuery, sortOrder])

  function handleConfigurer(model: ModelWithImages) {
    setSelectedProduct(model)
    setModalOpen(true)
  }

  return (
    <>
      <div className={styles.toolbar}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <SortSelect value={sortOrder} onChange={setSortOrder} />
      </div>
      <ProductGrid models={filteredModels} onConfigurer={handleConfigurer} />
      {selectedProduct && (
        <ConfigurateurModal
          open={modalOpen}
          model={selectedProduct}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
```

### Pattern 3 : Modal avec Radix UI Dialog

**What:** ConfigurateurModal utilise `@radix-ui/react-dialog` (déjà installé, version 1.1.15). Le Dialog gère accessibilité, focus trap, Escape key, aria-modal nativement.

**When to use:** Modal accessible sans recoder les comportements natifs. Radix Dialog est déjà une dépendance du projet.

**Trade-offs:**
- Pro : accessibilité complète out of the box (focus trap, Esc, aria)
- Pro : déjà installé, pas de dépendance supplémentaire
- Con : les styles Radix sont headless — tout CSS à écrire dans le module
- Con : l'overlay Radix a un `z-index` à caler avec le header (z-index: 100)

```typescript
// ConfigurateurModal.tsx — Client Component
'use client'

import * as Dialog from '@radix-ui/react-dialog'
import type { ModelWithImages } from '@/types/database'
import styles from './ConfigurateurModal.module.css'

interface ConfigurateurModalProps {
  open: boolean
  model: ModelWithImages
  onClose: () => void
}

export function ConfigurateurModal({ open, model, onClose }: ConfigurateurModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          <Dialog.Title className={styles.title}>
            Configurateur — {model.name}
          </Dialog.Title>
          <Dialog.Close asChild>
            <button className={styles.closeBtn} aria-label="Fermer le configurateur">
              ✕
            </button>
          </Dialog.Close>
          <div className={styles.placeholder}>
            <p>Configurateur à venir en v9.0</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

CSS cible pour le modal :
```css
/* ConfigurateurModal.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  z-index: 200;
}

.content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: var(--container-max);
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-background);
  border-radius: var(--radius-xl);
  z-index: 201;
  padding: var(--spacing-2xl);
}

@media (max-width: 640px) {
  .content {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    top: 0;
    left: 0;
    transform: none;
  }
}
```

### Pattern 4 : next/image pour les ProductCards

**What:** Utiliser `<Image>` de `next/image` avec `fill` + `sizes` pour les images produit. Les images viennent de Supabase Storage (URLs absolues).

**When to use:** Toujours pour les images produit — optimisation automatique (WebP, lazy loading, LCP optimization).

**Trade-offs:**
- Pro : format WebP automatique, lazy loading natif, évite le CLS
- Con : requiert `next.config.js` avec le domaine Supabase dans `images.remotePatterns`
- Con : le container parent doit avoir `position: relative` et une hauteur explicite pour `fill`

```typescript
// ProductCard.tsx — extrait image
import Image from 'next/image'

const primaryImage = model.model_images[0]?.image_url

{primaryImage ? (
  <div className={styles.imageWrapper}>
    <Image
      src={primaryImage}
      alt={model.name}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className={styles.image}
      style={{ objectFit: 'cover' }}
    />
  </div>
) : (
  <div className={styles.imagePlaceholder} aria-hidden="true" />
)}
```

```css
/* ProductCard.module.css */
.imageWrapper {
  position: relative;
  aspect-ratio: 4 / 3;
  width: 100%;
  overflow: hidden;
  background: var(--surface-container-low);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.image {
  transition: transform var(--transition-smooth);
}

.card:hover .image {
  transform: scale(1.03);
}
```

**Configuration requise** dans `next.config.js` ou `next.config.ts` :

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}
```

---

## Data Flow

### Request Flow — Chargement initial

```
Navigateur demande /
    ↓
page.tsx (Server Component) render
    ↓
CatalogueSection (Server Component) render
    ↓
createClient() Supabase server → SELECT models + model_images WHERE is_active = true
    ↓
ModelWithImages[] passé en props à CatalogueClient
    ↓
HTML initial envoyé au navigateur (données embarquées, pas de fetch client)
    ↓
Hydratation : CatalogueClient becomes interactive (useState, useMemo actifs)
```

### Request Flow — Interaction utilisateur

```
User tape dans SearchBar
    ↓
setSearchQuery(value) → re-render CatalogueClient
    ↓
useMemo recalcule filteredModels (synchrone, pas d'API call)
    ↓
ProductGrid re-render avec filteredModels filtrés

User clique "Configurer ce modèle"
    ↓
handleConfigurer(model) → setSelectedProduct + setModalOpen(true)
    ↓
ConfigurateurModal render avec open=true
    ↓
Radix Dialog.Portal insère le DOM modal dans body
    ↓
Focus trap activé, Escape key gérée par Radix

User ferme le modal (Esc ou bouton X)
    ↓
onOpenChange(false) → onClose() → setModalOpen(false)
    ↓
ConfigurateurModal render avec open=false
    ↓
Radix retire le DOM du portal
```

### State Management

```
CatalogueClient (état local)
  searchQuery: string         ← SearchBar contrôlé
  sortOrder: SortOrder        ← SortSelect contrôlé
  selectedProduct: Model|null ← ProductCard CTA
  modalOpen: boolean          ← contrôle ConfigurateurModal

  filteredModels (useMemo)    ← dérivé de initialModels + searchQuery + sortOrder
```

**Pas de Zustand pour M008.** Zustand sera introduit en M009 quand le configurateur (section distante dans le DOM) devra accéder au `selectedProduct`. À ce moment, `useCatalogueStore` avec `{ selectedProduct, setSelectedProduct, modalOpen, setModalOpen }` remplacera le state local.

---

## Integration Points — Nouveau vs Modifié

### Fichiers MODIFIÉS

| Fichier | Modification | Raison |
|---------|-------------|--------|
| `src/app/page.tsx` | Ajouter `<CatalogueSection />` après `<HowItWorks />` | Orchestre la nouvelle section |
| `src/next.config.ts` | Ajouter `images.remotePatterns` pour Supabase Storage | next/image avec images Supabase |

### Fichiers CRÉÉS (nouveaux)

| Fichier | Type | Rôle |
|---------|------|------|
| `src/components/public/Catalogue/CatalogueSection.tsx` | Server Component | Fetch Supabase + wrapper section |
| `src/components/public/Catalogue/CatalogueSection.module.css` | CSS Module | Layout section, titre |
| `src/components/public/Catalogue/CatalogueClient.tsx` | Client Component | State (search, sort, modal) |
| `src/components/public/Catalogue/CatalogueClient.module.css` | CSS Module | Toolbar (search + sort) |
| `src/components/public/Catalogue/SearchBar.tsx` | Client Component | Input texte filtrage |
| `src/components/public/Catalogue/SearchBar.module.css` | CSS Module | Styles input |
| `src/components/public/Catalogue/SortSelect.tsx` | Client Component | Select tri (3 options) |
| `src/components/public/Catalogue/SortSelect.module.css` | CSS Module | Styles select |
| `src/components/public/Catalogue/ProductGrid.tsx` | Client Component | Grid CSS responsive |
| `src/components/public/Catalogue/ProductGrid.module.css` | CSS Module | Grid 1/2/3 col |
| `src/components/public/Catalogue/ProductCard.tsx` | Client Component | Card produit (image, prix, swatches, CTA) |
| `src/components/public/Catalogue/ProductCard.module.css` | CSS Module | Styles card |
| `src/components/public/Catalogue/ConfigurateurModal.tsx` | Client Component | Radix Dialog placeholder |
| `src/components/public/Catalogue/ConfigurateurModal.module.css` | CSS Module | Overlay + content modal |

### Fichiers INCHANGÉS

| Fichier | Raison |
|---------|--------|
| `src/app/api/models/route.ts` | API existante — pas de modification nécessaire |
| `src/types/database.ts` | `ModelWithImages` déjà défini |
| `src/lib/supabase/server.ts` | Client serveur réutilisé tel quel |
| `src/components/public/Header/Header.tsx` | Inchangé |
| `src/components/public/Hero/Hero.tsx` | Inchangé |
| `src/components/public/HowItWorks/HowItWorks.tsx` | Inchangé |
| `src/components/admin/**` | Espace admin isolé, pas touché |
| `src/proxy.ts` | Middleware inchangé — `/` est publique |
| `src/app/globals.css` | Tokens déjà complets, aucun ajout nécessaire |

---

## Build Order (ordre de construction recommandé)

L'ordre suit les dépendances : les feuilles (composants sans enfants) avant les conteneurs.

1. **`next.config.ts`** — Ajouter `images.remotePatterns`. Blocker pour toute image Supabase dans next/image. [MODIFIE `next.config.ts`]

2. **`ProductCard`** — Composant feuille. Dépend uniquement des types `ModelWithImages` (déjà définis) et de next/image (déjà installé). [CRÉE `Catalogue/ProductCard.tsx` + `.module.css`]

3. **`ProductGrid`** — Dépend de `ProductCard`. Layout grid + itération. [CRÉE `Catalogue/ProductGrid.tsx` + `.module.css`]

4. **`SearchBar`** — Composant feuille, aucune dépendance interne. [CRÉE `Catalogue/SearchBar.tsx` + `.module.css`]

5. **`SortSelect`** — Composant feuille, aucune dépendance interne. [CRÉE `Catalogue/SortSelect.tsx` + `.module.css`]

6. **`ConfigurateurModal`** — Dépend de `@radix-ui/react-dialog` (installé). Composant feuille du point de vue du catalogue. [CRÉE `Catalogue/ConfigurateurModal.tsx` + `.module.css`]

7. **`CatalogueClient`** — Assemble SearchBar + SortSelect + ProductGrid + ConfigurateurModal. Porte le state local. [CRÉE `Catalogue/CatalogueClient.tsx` + `.module.css`]

8. **`CatalogueSection`** — Appelle Supabase server + rend CatalogueClient. [CRÉE `Catalogue/CatalogueSection.tsx` + `.module.css`]

9. **`page.tsx`** — Ajouter `<CatalogueSection />` après `<HowItWorks />`. Ajout minimal, pas de remplacement complet. [MODIFIE `src/app/page.tsx`]

---

## Anti-Patterns

### Anti-Pattern 1 : Fetch côté client dans CatalogueClient

**What people do:** Mettre `'use client'` sur CatalogueSection, appeler `fetch('/api/models')` dans un `useEffect`, gérer loading/error states.

**Why it's wrong:** Ajoute un waterfall (HTML livré vide, puis fetch, puis render), un état de loading à gérer, et un skeleton à coder. L'API route existe pour les consommateurs externes — pas pour la consommation interne.

**Do this instead:** Server Component qui appelle Supabase directement, passe les données en props. Zéro waterfall, zéro loading state initial.

### Anti-Pattern 2 : 'use client' sur CatalogueSection

**What people do:** Mettre toute la section en Client Component pour simplifier.

**Why it's wrong:** Tout le fetch se fait côté client, le HTML initial ne contient pas les données, LCP dégradé.

**Do this instead:** Split explicite — CatalogueSection (Server) → CatalogueClient (Client). La boundary est une prop `initialModels: ModelWithImages[]`.

### Anti-Pattern 3 : Zustand dès M008

**What people do:** Créer `useCatalogueStore` pour gérer query + sort + selectedProduct.

**Why it's wrong:** Overkill pour un state qui ne sort pas de CatalogueClient. Zustand ajoute une dépendance runtime et une complexité inutile quand `useState` suffit.

**Do this instead:** State local dans CatalogueClient. Migrer vers Zustand en M009 si le configurateur (section séparée) doit consommer `selectedProduct`.

### Anti-Pattern 4 : URL searchParams pour le state catalogue

**What people do:** Synchroniser search + sort dans `?q=&sort=` via `useSearchParams` + `router.push`.

**Why it's wrong:** Chaque keystroke déclenche une navigation, ce qui recrée le Server Component et re-fetche. Pour M008, la recherche est purement client-side sur les données initiales — pas besoin de persister dans l'URL.

**Do this instead:** State local React. Si le besoin de partage de lien apparaît (deep link vers un filtre), envisager `useSearchParams` en M011+.

### Anti-Pattern 5 : `<img>` natif au lieu de next/image

**What people do:** `<img src={model.model_images[0]?.image_url} />` pour éviter la config.

**Why it's wrong:** Pas d'optimisation WebP, pas de lazy loading Next.js, pas de LCP optimization, CLS potentiel sans dimensions explicites.

**Do this instead:** next/image avec `fill` + `sizes` + container `position: relative`.

---

## Scaling Considerations

| Scale | Approach |
|-------|----------|
| 1-20 produits (état actuel) | fetch all + filter client-side — aucun problème |
| 20-100 produits | fetch all reste viable ; envisager pagination côté client si >50 produits visible simultanément |
| 100+ produits | Migrer vers server-side filtering : URL searchParams + revalidation, ou API route avec pagination |

**First bottleneck :** Le filtre `useMemo` client-side sur 20-30 modèles JSON est negligeable. Le vrai bottleneck sera le nombre d'images chargées simultanément. `next/image` avec `loading="lazy"` (par défaut sauf `priority`) et `sizes` correct gère cela naturellement.

---

## Sources

- Code source analysé directement : `src/app/page.tsx`, `src/app/api/models/route.ts`, `src/types/database.ts`, `src/components/public/Header/Header.tsx`, `src/components/admin/ConfirmDialog.tsx`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `package.json`
- Wireframe : `.planning/maquette/wireframe-page-unique.md` (section 4 — Catalogue)
- Design tokens : `src/app/globals.css`
- [Next.js App Router — Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) (HIGH confidence)
- [next/image — Remote Patterns](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns) (HIGH confidence)
- [@radix-ui/react-dialog — déjà installé v1.1.15](https://www.radix-ui.com/primitives/docs/components/dialog) (HIGH confidence)
- Zustand v5.0.12 installé — patron state local préféré avant Zustand pour state non-partagé (MEDIUM confidence)

---

*Architecture research pour : M008 Catalogue Produits*
*Researched: 2026-03-28*
