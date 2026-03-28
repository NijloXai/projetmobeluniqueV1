# Stack Research — v8.0 Catalogue Produits

**Domain:** SPA catalogue e-commerce avec recherche, tri, grid produits, modal configurateur
**Milestone:** M008 — Catalogue Produits (CAT-01, CAT-02, CAT-03, CAT-04)
**Researched:** 2026-03-28
**Confidence:** HIGH (stack entierement couverte par existant + patterns officiels Next.js verifies)

---

## Verdict principal

**Aucune nouvelle dependance npm requise pour M008.**

Le catalogue se construit exclusivement avec des capacites deja installees :
- `@radix-ui/react-dialog@1.1.15` (deja present) — modal configurateur
- `next/image` (Next.js 16.2.1) — images produits optimisees
- React `useState` / `useCallback` (React 19.2.4) — recherche et tri client-side
- CSS Modules + tokens globals.css — tout le layout et les animations
- `useMemo` React natif — filtrage performant de la liste produits

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js 16.2.1 | deja installe | Fetch initial des produits (Server Component) | `fetch('/api/models')` dans un Server Component — donnees disponibles avant hydratation, pas de loading state visible |
| React 19.2.4 | deja installe | Recherche/tri client-side via useState + useMemo | Le catalogue reoit les donnees du serveur comme prop, filtre/trie entierement cote client sans aller-retour reseau |
| @radix-ui/react-dialog | 1.1.15 (installe) | Modal configurateur (CAT-04) | Deja present, WAI-ARIA Dialog pattern, focus trap natif, Escape key, zero config acces. 90vw desktop / plein ecran mobile par CSS |
| next/image | inclus Next.js | Images produit dans les cards | Genere srcset automatique pour grille responsive, WebP natif, lazy loading par defaut pour les cards hors viewport |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.7.0 (installe) | Icones barre recherche (Search, X, ChevronDown) | Icone loupe dans l'input, croix clear, chevron tri |
| CSS Modules | natif Next.js | Layout grid, cards, modal, barre recherche | Chaque composant nouveau : CatalogueSection, ProductCard, CatalogueSearchBar, SortDropdown, ConfigurateurModal |
| globals.css tokens | existant | Espacements, couleurs, transitions | `--transition-smooth: 400ms`, `--shadow-md`, `--color-primary`, `--color-background-alt` |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript strict | Types donnees API | Typer `ModelWithImages` depuis `database.ts` — `models` row + `model_images[]` |
| vitest | Tests composants | Pattern existant dans le projet |

---

## Architecture de donnees

### Fetch pattern recommande

**Server Component (page.tsx ou CatalogueSection.tsx async) fetch les donnees une fois :**

```tsx
// src/app/page.tsx (Server Component)
async function getModels() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/models`, {
    next: { revalidate: 60 } // revalide toutes les minutes
  })
  if (!res.ok) return []
  return res.json()
}

export default async function HomePage() {
  const models = await getModels()
  return (
    <>
      <Header />
      <Hero />
      <HowItWorks />
      <CatalogueSection initialModels={models} />  {/* 'use client' */}
    </>
  )
}
```

**Pourquoi pas useEffect/fetch cote client :** Le catalogue est la section principale de la SPA. Un fetch client cree un flash vide (skeleton) visible pendant l'hydratation. Fetch serveur = donnees disponibles des le premier rendu HTML.

**Pourquoi pas URL search params :** C'est une SPA mono-page sans navigation entre routes. L'etat de recherche/tri est ephemere (session utilisateur). URL params ajoutent de la complexite (useRouter, useSearchParams, Suspense boundary obligatoire) sans benefice pour ce cas d'usage.

### Shape des donnees recues

```typescript
// Type derive de database.ts
type ModelWithImages = {
  id: string
  name: string
  slug: string
  price: number           // Prix de base en EUR
  description: string | null
  dimensions: string | null
  shopify_url: string | null
  is_active: boolean
  created_at: string
  model_images: {
    id: string
    image_url: string     // URL Supabase Storage (bucket model-photos)
    view_type: string     // 'front' | 'side' | 'angle' | etc.
    sort_order: number
  }[]
}
```

---

## Patterns de composants

### 1. Recherche client-side avec useMemo

```tsx
// CatalogueSection.tsx — 'use client'
const [query, setQuery] = useState('')
const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')

const filteredModels = useMemo(() => {
  let result = initialModels.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase())
  )
  if (sort === 'price_asc') result = [...result].sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') result = [...result].sort((a, b) => b.price - a.price)
  // 'newest' = ordre du serveur (created_at DESC, deja trie par l'API)
  return result
}, [initialModels, query, sort])
```

Pas de debounce necessaire : `useMemo` est synchrone et instantane pour 20-50 produits. Debounce utile seulement pour des appels reseau, pas pour du filtrage en memoire.

### 2. Modal Radix Dialog — 90vw desktop, plein ecran mobile

```tsx
// ConfigurateurModal.tsx — 'use client'
import * as Dialog from '@radix-ui/react-dialog'

// CSS Modules uniquement pour le sizing
// .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); }
// .content { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
//            width: 90vw; max-height: 90vh; overflow-y: auto; }
// @media (max-width: 640px) { .content { width: 100vw; height: 100dvh; top: 0; left: 0; transform: none; } }
```

`@radix-ui/react-dialog` gere automatiquement : focus trap, aria-labelledby, aria-describedby, Escape key, scroll lock. Aucune librairie supplementaire.

### 3. next/image dans les product cards

```tsx
// ProductCard.tsx
<div className={styles.imageWrapper}>
  <Image
    src={model.model_images[0]?.image_url ?? '/images/placeholder-canape.jpg'}
    alt={model.name}
    fill
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    style={{ objectFit: 'cover' }}
    // Pas loading="eager" — les cards sont sous la fold, lazy par defaut = correct
  />
</div>
```

`sizes` correctement calibre pour la grille 1/2/3 colonnes evite le telechargement d'images surdimensionnees.

---

## Dependances — Tableau de decision

| Capacite | Solution | Librairie requise | Raison |
|----------|----------|-------------------|--------|
| Fetch donnees produits | `fetch` dans Server Component | AUCUNE | Next.js 16 natif, cache + revalidate inclus |
| Recherche par nom | `useMemo` + `useState` | AUCUNE | < 50 produits, filtrage memoire instantane |
| Tri prix / nouveautes | `useMemo` sort | AUCUNE | Meme tableau, tri JavaScript natif |
| Modal configurateur | `@radix-ui/react-dialog` | DEJA INSTALLE (1.1.15) | Accessibility native, pas de code custom |
| Images produit optimisees | `next/image` fill + sizes | AUCUNE | Deja dans Next.js 16.2.1 |
| Swatches apercu (couleurs) | CSS circles avec `background-color` | AUCUNE | Simple styling CSS |
| Icone recherche | `lucide-react` Search | DEJA INSTALLE (1.7.0) | Coherent avec le reste de l'app |
| Grid responsive | CSS Grid via CSS Modules | AUCUNE | `grid-template-columns: repeat(auto-fill, minmax())` ou breakpoints |
| Animations cards | CSS transitions + `@keyframes` | AUCUNE | Meme pattern que M007 (hover: scale, shadow) |
| Etat modal ouvert/ferme | `useState` dans le parent | AUCUNE | Zustand overkill pour un booleen local |

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| fetch Server Component | SWR / React Query client-side | Si le catalogue doit se mettre a jour en temps reel (websockets, polling) — pas le cas ici |
| useMemo filtrage memoire | URL search params + useSearchParams | Si les URLs de recherche doivent etre partageables / bookmarkables — pas pertinent pour une SPA non-indexee |
| @radix-ui/react-dialog (installe) | react-modal, @reach/dialog | Jamais : Radix est deja present, ces alternatives ajoutent du poids inutile |
| useMemo sans debounce | debounce (lodash ou custom) | Si le filtrage declenchait des appels API — ici c'est du filtrage memoire pur, debounce inutile |
| next/image fill + sizes | img HTML standard | Jamais dans Next.js — next/image = WebP auto, srcset auto, lazy loading, prevention CLS |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| SWR / React Query | Sur-ingenierie totale pour un fetch statique au chargement de page. Ajoute 15-45KB. | fetch Server Component natif Next.js 16 |
| react-virtualized / react-window | Virtualisation inutile pour 20-50 produits. Complexite injustifiee. | CSS Grid standard — le navigateur gere sans probleme |
| @radix-ui/react-popover ou react-select | Pour le dropdown de tri. Radix Dropdown Menu est deja installe (@radix-ui/react-dropdown-menu@2.1.16). | @radix-ui/react-dropdown-menu existant OU select HTML natif avec CSS Modules |
| lodash debounce | Inutile pour filtrage memoire. Ajoute du poids. | useMemo React natif |
| react-spring / GSAP / Framer Motion | Les animations de card (hover scale, apparition grid) sont realisables en CSS pur. | CSS transitions + @keyframes (meme pattern M007) |
| Tanstack Table | Overkill pour un grid de 20 produits avec 2 criteres de tri. | Array.sort() + useMemo |
| next/dynamic avec ssr:false pour le modal | Le modal Radix fonctionne en SSR sans erreur d'hydratation. | Import direct |

---

## Stack Patterns by Variant

**Si les produits doivent apparaitre sans flash au premier rendu :**
- Fetch dans le Server Component parent (page.tsx), passe `initialModels` en prop a `CatalogueSection`
- `CatalogueSection` est 'use client' mais recoit des donnees deja presentes

**Si le nombre de produits depasse 100 a terme :**
- Ajouter pagination cote serveur (query param `?page=N` dans l'API `/api/models`)
- Ou infinite scroll avec Intersection Observer (meme pattern que scroll-reveal M007)
- Pas de virtualisation necessaire avant 500+ items en DOM

**Si le dropdown de tri doit etre accessible :**
- Utiliser `@radix-ui/react-dropdown-menu` (deja installe v2.1.16) plutot qu'un `<select>` natif
- Ou `<select>` natif style avec CSS Modules — plus simple, accessibilite native, pas de JS supplementaire

**Pattern recommande pour le select de tri (simple = meilleur) :**
- `<select>` HTML natif + CSS Modules : zero JS, accessibilite navigateur native, stylable en CSS pur avec appearance:none + custom arrow
- Garder `@radix-ui/react-dropdown-menu` pour des menus complexes (navigation, actions multiples)

---

## Version Compatibility

| Package | Version | Compatible Avec | Notes |
|---------|---------|-----------------|-------|
| @radix-ui/react-dialog | 1.1.15 | React 19.2.4, Next.js 16.2.1 | Verifie : aucun peer dep conflict |
| @radix-ui/react-dropdown-menu | 2.1.16 | React 19.2.4 | Deja utilise dans l'admin |
| next/image | inclus 16.2.1 | — | `fill` + `sizes` pattern etabli en M007 |
| lucide-react | 1.7.0 | React 19.2.4 | Tree-shakable, import nomme par icone |

---

## Integration avec l'existant

### Structure composants

```
src/
  components/
    public/
      Header/          ← existant (M007)
      Hero/            ← existant (M007)
      HowItWorks/      ← existant (M007)
      Catalogue/       ← NOUVEAU M008
        CatalogueSection.tsx    'use client' — conteneur recherche + tri + grid
        CatalogueSection.module.css
        ProductCard.tsx         Server Component (pas d'interactivite propre)
        ProductCard.module.css
        CatalogueSearchBar.tsx  'use client' — input avec icone Search
        CatalogueSearchBar.module.css
        ConfigurateurModal.tsx  'use client' — Radix Dialog wrapper
        ConfigurateurModal.module.css
```

### page.tsx — ajout fetch

```tsx
// src/app/page.tsx (existant, devient async)
import { CatalogueSection } from '@/components/public/Catalogue/CatalogueSection'

async function getModels() {
  // URL absolue en SSR, relative en client (Next.js gere)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/models`, { next: { revalidate: 60 } })
  if (!res.ok) return []
  return res.json()
}

export default async function HomePage() {
  const models = await getModels()
  return (
    <main>
      <Header />
      <Hero />
      <HowItWorks />
      <CatalogueSection initialModels={models} />
    </main>
  )
}
```

### globals.css — tokens suffisants

Tous les tokens necessaires sont deja presents :
- `--shadow-md`, `--shadow-lg` — hover state cards
- `--transition-smooth: 400ms ease-in-out` — hover animations
- `--color-background-alt: #F8F4EE` — fond section catalogue
- `--color-primary: #E49400` — CTA buttons, swatches actifs
- `--color-muted: #888888` — prix "a partir de", compteur swatches "+N"
- `--spacing-section: 7rem` — padding section

**Aucune modification de globals.css requise pour M008.**

---

## Sources

- [Next.js Image Component — Docs officielles v16.2.1](https://nextjs.org/docs/app/api-reference/components/image) — sizes, fill, lazy loading verifie
- [Next.js Getting Started: Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) — Server Component fetch pattern
- [Next.js Adding Search and Pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) — pattern recherche client vs URL params
- [Radix UI Dialog — Primitives](https://www.radix-ui.com/primitives/docs/components/dialog) — WAI-ARIA, focus trap, CSS Modules integration
- Package.json projet — versions installees verifiees directement

---

*Stack research pour: Catalogue Produits v8.0 (M008)*
*Recherche: 2026-03-28*
