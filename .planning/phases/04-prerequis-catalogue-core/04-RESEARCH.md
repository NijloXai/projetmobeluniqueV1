# Phase 4: Prerequis + Catalogue core — Research

**Researched:** 2026-03-28
**Domain:** Next.js 16 App Router, next/image remotePatterns, Server Component data fetching, CSS Grid responsive, CSS shimmer skeleton
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Ajouter `images.remotePatterns` pour autoriser les URLs Supabase Storage (`*.supabase.co`). Prerequis bloquant — aucune image produit ne s'affiche sans ca.
- **D-02:** Style fidele a la maquette Stitch — image portrait aspect-ratio 4/5 bord-a-bord, nom Montserrat bold uppercase + description courte muted, prix en primary bold aligne a droite.
- **D-03:** CTA "Configurer ce modele" pleine largeur en bas de la card, fond transparent avec bordure primary subtile, hover → fond primary + texte blanc.
- **D-04:** Fond card `#F6F3EF` (surface-container-low), hover → `#EBE8E4` (surface-container-high). Tonal layering, pas de bordures.
- **D-05:** Hover image : zoom subtil (scale 1.05, transition 700ms) dans un overflow hidden.
- **D-06:** Titre H2 = "Nos Canapes" (simple et direct, style wireframe).
- **D-07:** Fond section blanc `#FFFFFF` — alternance avec HowItWorks beige au-dessus.
- **D-08:** ID `catalogue` sur la section pour que le CTA Hero `#catalogue` fonctionne (scroll smooth deja configure).
- **D-09:** Priorite `view_type === '3/4'` dans model_images, fallback sur la premiere image (sort_order le plus bas).
- **D-10:** Si aucune image pour un modele : placeholder gris avec icone canape (Lucide Sofa) centree.
- **D-11:** Si aucun canape actif en BDD : message simple centre "Nos canapés arrivent bientot." — texte muted, pas d'icone.
- **D-12:** Server Component fetch directement dans page.tsx (ou CatalogueSection Server Component), passe les donnees en props au client component pour l'interactivite (Phase 5).
- **D-13:** Skeleton loading avec cards placeholder pendant le chargement (CSS shimmer, memes dimensions que les vraies cards).

### Claude's Discretion

- Sous-titre de la section catalogue (court, ton invitant)
- Padding et espacement de la section (coherent avec HowItWorks)
- Dimensions exactes du skeleton loading
- Format d'affichage du prix (ex: "1 290 EUR" ou "a partir de 1 290 EUR")
- Placeholder image : nuance de gris et taille de l'icone

### Deferred Ideas (OUT OF SCOPE)

- Swatches miniatures tissus sur les cards — v9.0 (depend de l'API fabrics)
- Tri prix/nouveautes — reporte par decision utilisateur
- Pagination / scroll infini — pas necessaire pour 20-30 produits
- Animation d'entree des cards au scroll — peut etre ajoute plus tard si souhaite
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TECH-01 | Les images Supabase Storage s'affichent via next/image (remotePatterns configure) | Section remotePatterns — syntaxe exacte `**.supabase.co` verifiee docs officielles Next.js 16 |
| CAT-01 | L'utilisateur voit les canapes disponibles sous forme de cards avec image, nom et prix | Pattern Server Component async + props vers client — code example fourni |
| CAT-02 | Les cards s'affichent en grille responsive (1 col mobile / 2 col tablet / 3 col desktop) | CSS Grid media queries — pattern etabli HowItWorks.module.css |
| CAT-03 | Un skeleton loading s'affiche pendant le chargement des produits | Suspense + fallback skeleton — pattern documente, shimmer CSS fourni |
</phase_requirements>

---

## Summary

Cette phase repose sur trois mecanismes bien etablis dans le projet : (1) configuration next.config.ts pour debloquer les images externes Supabase, (2) async Server Component qui fetch Supabase directement et passe les donnees serialisees a un Client Component, (3) CSS Grid avec media queries pour la grille responsive identique au pattern HowItWorks.

Le pattern Server/Client boundary est la decision architecturale la plus critique. `CatalogueSection` est un async Server Component qui attend les donnees Supabase, enveloppe dans `<Suspense>` depuis page.tsx pour afficher le skeleton pendant le fetch. `CatalogueClient` est le Client Component qui recoit `ModelWithImages[]` comme prop et gere l'etat interactif futur (Phase 5).

Le prerequis bloquant TECH-01 doit etre resolu en Wave 0 ou premiere tache — aucune image ne s'affiche sans `remotePatterns` configure, ce qui rend le dev et la validation visuellement impossible.

**Primary recommendation:** Creer `CatalogueSection` comme async Server Component qui fetch Supabase directement (pas via `/api/models`), l'envelopper dans `<Suspense fallback={<CatalogueSkeletonGrid />}>` dans page.tsx, et passer `ModelWithImages[]` comme prop serialisee a `CatalogueClient`.

---

## Project Constraints (from CLAUDE.md)

Directives obligatoires extraites de CLAUDE.md — le planner doit verifier la conformite :

| Directive | Valeur | Impact Phase 4 |
|-----------|--------|----------------|
| CSS Modules uniquement | Pas de Tailwind, pas de shadcn | Tous les styles dans `.module.css` par composant |
| TypeScript strict | Aucun `any` | Types explicites `ModelWithImages[]`, props typees |
| Composants PascalCase | Un fichier par composant | `CatalogueSection.tsx`, `ProductCard.tsx`, etc. |
| Un `.module.css` par composant | Convention stricte | 4 fichiers CSS pour 4 composants |
| Messages erreur en francais | UI francais uniquement | "Impossible de charger les produits. Veuillez rafraichir la page." |
| Supabase client direct | Pas de Prisma | `createClient()` depuis `@/lib/supabase/server` |
| Design tokens dans globals.css | Variables CSS custom | Utiliser `var(--color-primary)`, `var(--spacing-section)` etc. |
| Dossier public components | `src/components/public/` | Nouveau sous-dossier `Catalogue/` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next/image | 16.2.1 (built-in) | Optimisation images externes Supabase | Obligatoire pour CLS prevention + WebP auto |
| React Suspense | 19.2.4 (built-in) | Skeleton fallback pendant fetch async | Mecanisme officiel Next.js App Router streaming |
| createClient (server) | projet (supabase/server.ts) | Fetch Supabase depuis Server Component | Pattern etabli dans le projet |
| Lucide React | 1.7.0 (installe) | Icone `Sofa` placeholder image vide | Deja installe, decision D-10 |
| CSS Modules | Next.js built-in | Styles scopees par composant | Convention stricte CLAUDE.md |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Intl.NumberFormat | Browser built-in | Formatage prix "1 290 €" | Dans ProductCard pour formatter `price: number` |
| lucide-react/Sofa | 1.7.0 | Icone placeholder quand aucune image | Si `model_images.length === 0` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Component direct Supabase | fetch('/api/models') depuis Server Component | Fetch /api/models depuis un Server Component est inutile — meme process Node, aller-retour HTTP inutile. Fetch Supabase directement. |
| Suspense + fallback skeleton | loading.js au niveau route | loading.js couvre toute la page. Suspense au niveau section permet que Header/Hero/HowItWorks s'affichent immediatement. Utiliser Suspense. |
| CSS Grid fixed columns | auto-fill/auto-fit | auto-fill masque les colonnes vides et aligne les cards differemment. Grille a colonnes fixes par breakpoint est plus predictible pour un catalogue de 3-30 produits. |

**Installation:** Aucune installation requise — toutes les dependances sont deja presentes.

**Version verification:** Next.js 16.2.1 confirme dans package.json. React 19.2.4 confirme. Vitest 3.2.4 dans devDependencies.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
  components/
    public/
      Catalogue/
        CatalogueSection.tsx        # async Server Component — fetch Supabase + Suspense wrapper
        CatalogueSection.module.css # Styles section (layout, header, grid)
        CatalogueClient.tsx         # 'use client' — recoit ModelWithImages[], futur etat Phase 5
        CatalogueClient.module.css  # Styles client grid (none Phase 4 — vide ou shared avec section)
        ProductCard.tsx             # Presentationnel pur — props: model, onConfigure? (no-op Phase 4)
        ProductCard.module.css      # Styles card (tonal layering, image, corps, CTA)
        ProductCardSkeleton.tsx     # Presentationnel pur — shimmer CSS, dimensions identiques
        ProductCardSkeleton.module.css  # Animation shimmer
  app/
    page.tsx                        # async — importe CatalogueSection, enveloppe en <Suspense>
next.config.ts                      # remotePatterns Supabase (TECH-01 — prerequis bloquant)
```

### Pattern 1: remotePatterns Supabase dans next.config.ts

**What:** Autoriser next/image a optimiser les images dont le hostname match `*.supabase.co`.
**When to use:** Toujours — prerequis bloquant TECH-01. Sans ca, toute `<Image src="https://xxx.supabase.co/..." />` retourne erreur 400.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/image (Next.js 16.2.1, 2026-03-25)
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
```

**Pourquoi `**` et pas `*` :** La doc officielle Next.js 16 precise : `*` match un seul sous-domaine, `**` match n'importe quel nombre de sous-domaines en debut. `**.supabase.co` couvre `abcdef.supabase.co` et des sous-domaines imbriques. `*.supabase.co` est aussi valide mais `**` est plus robuste.

**Note sur `pathname`:** Specifier `/storage/v1/object/public/**` est plus securise qu'omettre pathname (qui implique `**` implicite). Cela limite next/image a optimiser uniquement les fichiers du bucket public Supabase.

### Pattern 2: Async Server Component + Suspense boundary

**What:** `CatalogueSection` est un async Server Component qui fetch Supabase directement. `page.tsx` l'enveloppe dans `<Suspense fallback={...}>`.
**When to use:** Quand on veut que la section catalogue streame independamment — le reste de la page (Header, Hero, HowItWorks) s'affiche immediatement.

**Important:** La doc Next.js 16 precise qu'on ne peut PAS ajouter un `<Suspense>` dans le meme composant qui fetch les donnees — il faut un composant enfant async separe.

```typescript
// Source: https://nextjs.org/docs/app/getting-started/fetching-data (Next.js 16.2.1, 2026-03-25)

// src/app/page.tsx — Server Component (pas async necessaire si tout est delegue)
import { Suspense } from 'react'
import { Header } from '@/components/public/Header/Header'
import { Hero } from '@/components/public/Hero/Hero'
import { HowItWorks } from '@/components/public/HowItWorks/HowItWorks'
import { CatalogueSection } from '@/components/public/Catalogue/CatalogueSection'
import { CatalogueSkeletonGrid } from '@/components/public/Catalogue/ProductCardSkeleton'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Header />
      <main id="main-content" className={styles.main}>
        <Hero />
        <HowItWorks />
        <Suspense fallback={<CatalogueSkeletonGrid />}>
          <CatalogueSection />
        </Suspense>
      </main>
    </div>
  )
}
```

```typescript
// src/components/public/Catalogue/CatalogueSection.tsx — async Server Component
import { createClient } from '@/lib/supabase/server'
import { CatalogueClient } from './CatalogueClient'
import type { ModelWithImages } from '@/types/database'
import styles from './CatalogueSection.module.css'

export async function CatalogueSection() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('models')
    .select('*, model_images(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <section id="catalogue" className={styles.section}>
        <p className={styles.errorMessage}>
          Impossible de charger les produits. Veuillez rafraichir la page.
        </p>
      </section>
    )
  }

  const models: ModelWithImages[] = (data ?? []).map((model) => ({
    ...model,
    model_images: (model.model_images ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    ),
  }))

  return <CatalogueClient models={models} />
}
```

**Attention:** Ne pas refetcher via `/api/models` depuis un Server Component. Le fetch HTTP interne est inutile (meme processus Node) et moins efficace que l'acces Supabase direct.

### Pattern 3: next/image avec aspect-ratio 4/5 et fill

**What:** Pour les images produit dont les dimensions sont inconnues, utiliser `fill` avec un conteneur position:relative + aspect-ratio.
**When to use:** Toujours pour les images de catalogue dont on ne connait pas les dimensions a l'avance.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/image (Next.js 16.2.1)
// ProductCard.tsx
import Image from 'next/image'
import styles from './ProductCard.module.css'

// Dans le composant :
<div className={styles.imageWrapper}>  {/* position: relative; aspect-ratio: 4/5; overflow: hidden */}
  <Image
    src={imageUrl}
    alt={`Canapé ${model.name}`}
    fill
    style={{ objectFit: 'cover' }}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    className={styles.image}  {/* transition: transform 700ms ease */}
  />
</div>
```

```css
/* ProductCard.module.css */
.imageWrapper {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
}

.image {
  transition: transform 700ms ease;
}

.card:hover .image {
  transform: scale(1.05);
}
```

**Critique — prop `sizes`:** Un `sizes` incorrect cause le telechargement d'images surdimensionnees. Pour 3 colonnes : `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`.

### Pattern 4: CSS Grid responsive — colonnes fixes par breakpoint

**What:** Grille a colonnes fixes par breakpoint, pas auto-fill. Pattern identique a HowItWorks.module.css etabli en Phase 3.
**When to use:** Quand le nombre de colonnes est connu et ne doit pas varier selon la taille des cards (catalogue produit).

```css
/* Source: Pattern etabli HowItWorks.module.css (Phase 3, projet) */
.grid {
  display: grid;
  grid-template-columns: 1fr;    /* mobile: 1 colonne */
  gap: var(--spacing-xl);        /* 32px */
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);   /* tablet: 2 colonnes */
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);   /* desktop: 3 colonnes */
  }
}
```

### Pattern 5: CSS Shimmer skeleton

**What:** Animation shimmer purement CSS — gradient qui se deplace de gauche a droite. Aucun JS, aucune librairie.
**When to use:** Pour tous les elements du ProductCardSkeleton.

```css
/* ProductCardSkeleton.module.css */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--surface-container) 0%,
    var(--surface-container-highest) 50%,
    var(--surface-container) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Pattern 6: Selecteur d'image produit (vue 3/4)

**What:** Logique de selection de l'image a afficher sur la card — priorite `view_type === '3/4'`, fallback premier element (sort_order deja trie par l'API).
**When to use:** Dans ProductCard, avant de passer `src` a next/image.

```typescript
// Source: Decision D-09, CONTEXT.md
function getPrimaryImage(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const threequarter = model_images.find(img => img.view_type === '3/4')
  return (threequarter ?? model_images[0]).image_url
}
```

**Note:** `model_images` est deja trie par `sort_order` ascendant par l'API (ou dans CatalogueSection). `model_images[0]` est donc toujours le premier par sort_order.

### Pattern 7: Formatage prix

**What:** `Intl.NumberFormat` pour formater le prix avec separateurs milliers francais.
**When to use:** Dans ProductCard pour afficher `model.price`.

```typescript
// Source: Decision UI-SPEC + Intl Web API
function formatPrice(price: number): string {
  return 'a partir de ' + new Intl.NumberFormat('fr-FR').format(price) + ' €'
}
// 1290 → "a partir de 1 290 €"
```

### Anti-Patterns to Avoid

- **Fetch `/api/models` depuis CatalogueSection:** Un Server Component qui appelle sa propre route API HTTP est un aller-retour inutile. Utiliser directement `createClient()` Supabase.
- **`async` page.tsx avec `await` CatalogueSection:** Si page.tsx attend CatalogueSection, tout le rendu est bloque. Utiliser Suspense — page.tsx reste synchrone.
- **next/image sans `sizes`:** Cause le telechargement de l'image en taille maximale sur tous les appareils. Toujours specifier `sizes`.
- **next/image avec `fill` sans `position: relative` sur le parent:** L'image s'echappe du conteneur. Le parent doit avoir `position: relative`.
- **Suspense dans le meme composant qui fetch:** La doc Next.js 16 confirme que Suspense ne fonctionne pas si le composant qui fetch est le meme que celui qui contient le `<Suspense>`. Separer en composant enfant (CatalogueSection enfant de page.tsx).
- **`hostname: '*.supabase.co'`** au lieu de `'**.supabase.co'`: `*` ne couvre qu'un seul niveau de sous-domaine. Utiliser `**` pour couvrir `xxx.supabase.co` et sous-domaines eventuels.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization et formats WebP | Conversion manuelle | `next/image` | Gere WebP, AVIF, lazy-loading, srcset, CLS automatiquement |
| Formatage prix avec separateurs francais | Regex manuel | `Intl.NumberFormat('fr-FR')` | Gere les regles locale correctement, zero dependance |
| Skeleton loading animation | JS setInterval | CSS `@keyframes` shimmer | Plus performant, pas de JS, GPU-accelere |
| Streaming/loading state | useState isLoading | React `<Suspense>` | Mecanisme officiel App Router, SSR-safe |
| Image fallback sur erreur | onError handler complexe | Logique `getPrimaryImage()` + placeholder JSX conditionnel | Predictible, sans etat |

**Key insight:** Dans Next.js App Router, le skeleton loading est gere par le systeme Suspense — pas par useState/useEffect dans le client. Le skeleton est le `fallback` prop de `<Suspense>`, qui s'affiche pendant le rendu async du Server Component.

---

## Common Pitfalls

### Pitfall 1: next/image "Un-configured Host" en production

**What goes wrong:** L'image s'affiche en dev (si non optimisee) mais retourne 400 en production.
**Why it happens:** `next/image` verifie `remotePatterns` avant d'optimiser. Sans configuration, l'optimiseur refuse les URLs externes.
**How to avoid:** Traiter TECH-01 comme toute premiere tache. Verifier avec `npm run build` que la config est prise en compte.
**Warning signs:** Message d'erreur dans la console : "Error: Invalid src prop ... hostname ... is not configured under images in your `next.config.js`".

### Pitfall 2: Suspense boundary au mauvais niveau

**What goes wrong:** Le skeleton ne s'affiche jamais — la page bloque jusqu'a ce que les donnees soient chargees.
**Why it happens:** Le `<Suspense>` est place dans le meme composant que le fetch, ou le composant fetching n'est pas async.
**How to avoid:** `<Suspense>` dans page.tsx (composant parent), `CatalogueSection` est le composant enfant async qui suspendit.
**Warning signs:** La page entiere bloque — on ne voit pas le Hero/HowItWorks pendant le chargement du catalogue.

### Pitfall 3: image zoom visible hors du conteneur

**What goes wrong:** Le `scale(1.05)` au hover fait depasser l'image en dehors de la card.
**Why it happens:** L'`overflow: hidden` est sur `imageWrapper` mais pas sur le bon element, ou la transition est sur le mauvais element.
**How to avoid:** `overflow: hidden` sur `.imageWrapper`, `transform` sur `.image` (l'element `<Image>` genere par next/image). Verifier que le `.card` lui-meme n'a pas d'overflow visible.
**Warning signs:** Un liseré de l'image apparait en dehors de la card au hover.

### Pitfall 4: Champ `price` vs `base_price`

**What goes wrong:** TypeScript error ou prix undefined a l'affichage.
**Why it happens:** Confusion sur le nom du champ dans la BDD.
**How to avoid:** Confirme par `src/types/database.ts` ligne 143 : le champ est `price: number` (pas `base_price`). Utiliser `model.price` directement.
**Warning signs:** TypeScript error "Property 'base_price' does not exist on type 'Model'".

### Pitfall 5: Hydration mismatch sur les prix

**What goes wrong:** Warning React "Text content does not match server-rendered HTML".
**Why it happens:** `Intl.NumberFormat` peut produire des resultats differents entre Node (SSR) et le navigateur selon la locale systeme.
**How to avoid:** `ProductCard` est un composant presentationnel rendu cote serveur (Server Component) ou dans un Client Component stable. Si `ProductCard` devient Client Component plus tard, tester avec la locale `fr-FR` explicite dans `Intl.NumberFormat('fr-FR')`.
**Warning signs:** Warning hydration dans la console Chrome.

### Pitfall 6: CatalogueSkeletonGrid — mauvais nombre de skeletons

**What goes wrong:** Le skeleton affiche 3 cards sur mobile, ce qui depasse la largeur ou cree un layout shift a la resolution.
**Why it happens:** On affiche un nombre fixe de skeletons sans adapter au breakpoint.
**How to avoid:** Afficher 3 skeletons fixes dans la grille responsive — la grille CSS gerera l'affichage sur 1/2/3 colonnes. 3 skeletons = correcte sur desktop, s'empilent sur mobile.
**Warning signs:** Les skeletons sortent de l'ecran sur mobile.

---

## Code Examples

Verified patterns from official sources and existing project codebase:

### CatalogueSkeletonGrid — fallback Suspense

```typescript
// Source: Pattern CSS shimmer + UI-SPEC Phase 4
// src/components/public/Catalogue/ProductCardSkeleton.tsx
import styles from './ProductCardSkeleton.module.css'

function ProductCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.imageZone} ${styles.shimmer}`} />
      <div className={styles.body}>
        <div className={styles.row}>
          <div className={styles.lineName} />
          <div className={styles.linePrice} />
        </div>
        <div className={styles.lineDesc} />
        <div className={`${styles.lineCta} ${styles.shimmer}`} />
      </div>
    </div>
  )
}

export function CatalogueSkeletonGrid() {
  return (
    <section id="catalogue" aria-label="Chargement du catalogue" aria-busy="true">
      <div className={styles.grid}>
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </section>
  )
}
```

### ProductCard — structure de base

```typescript
// Source: Pattern UI-SPEC + database.ts types
// src/components/public/Catalogue/ProductCard.tsx
import Image from 'next/image'
import { Sofa } from 'lucide-react'
import type { ModelWithImages, ModelImage } from '@/types/database'
import styles from './ProductCard.module.css'

function getPrimaryImage(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const threequarter = model_images.find(img => img.view_type === '3/4')
  return (threequarter ?? model_images[0]).image_url
}

function formatPrice(price: number): string {
  return 'a partir de ' + new Intl.NumberFormat('fr-FR').format(price) + ' \u20ac'
}

interface ProductCardProps {
  model: ModelWithImages
  onConfigure?: (model: ModelWithImages) => void
}

export function ProductCard({ model, onConfigure }: ProductCardProps) {
  const primaryImage = getPrimaryImage(model.model_images)

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={`Canapé ${model.name}`}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <Sofa size={48} strokeWidth={1.5} aria-hidden="true" className={styles.placeholderIcon} />
          </div>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.metaRow}>
          <div className={styles.nameGroup}>
            <h3 className={styles.name}>{model.name}</h3>
            {model.description && (
              <p className={styles.description}>{model.description}</p>
            )}
          </div>
          <span className={styles.price}>{formatPrice(model.price)}</span>
        </div>
        <button
          type="button"
          className={styles.cta}
          onClick={() => onConfigure?.(model)}
          aria-label={`Configurer le modele ${model.name}`}
        >
          Configurer ce modele
        </button>
      </div>
    </article>
  )
}
```

### CatalogueClient — wrapper client

```typescript
// Source: Pattern Server/Client boundary Next.js 16, CONTEXT.md D-12
// src/components/public/Catalogue/CatalogueClient.tsx
'use client'

import type { ModelWithImages } from '@/types/database'
import { ProductCard } from './ProductCard'
import styles from './CatalogueSection.module.css'

interface CatalogueClientProps {
  models: ModelWithImages[]
}

export function CatalogueClient({ models }: CatalogueClientProps) {
  // Phase 5 ajoutera : const [search, setSearch] = useState('')
  // Phase 6 ajoutera : const [selectedModel, setSelectedModel] = useState<ModelWithImages | null>(null)

  if (models.length === 0) {
    return (
      <section id="catalogue" className={styles.section}>
        <div className={styles.container}>
          <p className={styles.emptyMessage}>Nos canapés arrivent bientôt.</p>
        </div>
      </section>
    )
  }

  return (
    <section
      id="catalogue"
      className={styles.section}
      aria-labelledby="catalogue-title"
    >
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 id="catalogue-title" className={styles.sectionTitle}>
            Nos Canapés
          </h2>
          <p className={styles.sectionSubtitle}>
            Selectionnez une base pour commencer la configuration.
          </p>
        </div>
        <div className={styles.grid}>
          {models.map((model) => (
            <ProductCard
              key={model.id}
              model={model}
              onConfigure={undefined}  {/* Phase 6 */}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `domains` dans next.config | `remotePatterns` | Next.js 13+ | `domains` est deprecated. Utiliser `remotePatterns` obligatoirement. |
| `layout="fill"` sur Image | prop `fill` booleenne | Next.js 13 | L'ancienne API `layout` n'existe plus. |
| `objectFit` prop sur Image | `style={{ objectFit: 'cover' }}` | Next.js 13 | Maintenant via style prop CSS standard. |
| getServerSideProps | async Server Component | Next.js 13 App Router | Plus de getServerSideProps dans App Router. Composant async directement. |
| `import { motion } from 'framer-motion'` | `import { motion } from 'motion/react'` | motion@12 | Package renomme. Deja correct dans le projet (HowItWorks). |

**Deprecated/outdated:**
- `images.domains` dans next.config : remplace par `remotePatterns`. Ne pas utiliser.
- `layout="fill"` prop sur `<Image>` : remplace par `fill` booleenne.

---

## Open Questions

1. **Supabase Storage — URLs publiques vs signees**
   - What we know: Les images `model-photos` sont dans un bucket public. Les URLs `image_url` dans la BDD sont des URLs completes Supabase Storage publiques.
   - What's unclear: Le format exact de l'URL (avec ou sans transformation Supabase Image). Necessite verification sur une image reelle.
   - Recommendation: Utiliser l'URL telle quelle depuis la BDD dans `<Image src={image_url} />`. Si les URLs contiennent des parametres de transformation Supabase (`?width=xxx`), next/image et le loader Supabase peuvent entrer en conflit. Tester sur une vraie image en dev apres avoir configure remotePatterns.

2. **`CatalogueSection` vs data fetching dans `page.tsx`**
   - What we know: Decision D-12 dit "Server Component fetch directement dans page.tsx (ou CatalogueSection Server Component)". La doc Next.js 16 recommande de faire fetcher par un composant enfant pour que Suspense fonctionne.
   - What's unclear: Si page.tsx est async et await les donnees, tout se bloque. Si page.tsx delegue a CatalogueSection (enfant async), Suspense fonctionne.
   - Recommendation: Implementer CatalogueSection comme composant enfant async separe (pas inline dans page.tsx). C'est la seule architecture qui permet le Suspense/skeleton.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|---------|
| Node.js | Dev server | oui | v22 (.nvmrc) | — |
| Supabase (credentials) | CatalogueSection data fetch | A verifier | — | Message "Nos canapés arrivent bientot." si 0 produits actifs |
| next/image optimizer | TECH-01 | oui (built-in) | 16.2.1 | — |
| lucide-react | Icone Sofa placeholder | oui | 1.7.0 | — |
| Vitest | Tests | oui | 3.2.4 | — |

**Missing dependencies with no fallback:** Aucune.

**Note sur Supabase:** Les credentials sont dans `.env.local`. Si la BDD ne contient pas de produits actifs, l'etat vide s'affiche — pas d'erreur.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (racine) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |
| Environment | happy-dom |
| Setup | `src/__tests__/setup.ts` (@testing-library/jest-dom/vitest) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| TECH-01 | next.config.ts contient remotePatterns Supabase | unit (config test) | `npm test -- --reporter=verbose` | Non — Wave 0 |
| CAT-01 | ProductCard affiche image, nom et prix d'un modele | unit (render) | `npm test -- src/__tests__/ProductCard.test.tsx` | Non — Wave 0 |
| CAT-02 | CatalogueClient affiche la grille avec les cards | unit (render) | `npm test -- src/__tests__/CatalogueClient.test.tsx` | Non — Wave 0 |
| CAT-03 | CatalogueSkeletonGrid rend 3 skeletons avec aria-busy | unit (render) | `npm test -- src/__tests__/ProductCardSkeleton.test.tsx` | Non — Wave 0 |

**Note sur TECH-01:** Le test de configuration next.config.ts peut simplement importer et verifier que `remotePatterns` contient une entree avec `hostname: '**.supabase.co'`.

### Sampling Rate

- **Par tache:** `npm test` (vitest run, toute la suite)
- **Par wave merge:** `npm test && npx tsc --noEmit`
- **Phase gate:** Suite verte + `npx tsc --noEmit` zero erreur avant `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/ProductCard.test.tsx` — couvre CAT-01 (render image, nom, prix)
- [ ] `src/__tests__/CatalogueClient.test.tsx` — couvre CAT-02 (grille, etat vide)
- [ ] `src/__tests__/ProductCardSkeleton.test.tsx` — couvre CAT-03 (3 skeletons, aria-busy)
- [ ] `src/__tests__/nextconfig.test.ts` — couvre TECH-01 (remotePatterns present et correct)

Fixtures partagees existantes : `src/__tests__/setup.ts` existe. Pas de `conftest` ni de fixtures de modeles — a creer dans chaque test file.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16.2.1 Image Component docs](https://nextjs.org/docs/app/api-reference/components/image) — remotePatterns syntax, wildcard rules, fill prop, sizes, lastUpdated 2026-03-25
- [Next.js 16.2.1 Fetching Data docs](https://nextjs.org/docs/app/getting-started/fetching-data) — async Server Component pattern, Suspense boundary, lastUpdated 2026-03-25
- `src/types/database.ts` (projet) — champ `price: number` confirme (pas `base_price`), `ModelWithImages` type defini ligne 205
- `src/components/public/HowItWorks/HowItWorks.module.css` (projet) — pattern CSS Grid etabli, breakpoints, tokens

### Secondary (MEDIUM confidence)
- WebSearch: wildcard hostname `**` pour subdomain matching — confirme avec docs officielles ci-dessus
- WebSearch: Suspense doit etre dans composant parent et non dans le composant qui fetch — confirme par docs Next.js

### Tertiary (LOW confidence)
- Aucun.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — toutes les dependances presentes et versionnees dans package.json
- Architecture: HIGH — patterns verifies sur docs officielles Next.js 16 (2026-03-25)
- remotePatterns: HIGH — syntaxe exacte extraite des docs officielles Next.js 16
- Pitfalls: HIGH — base sur docs officielles + code existant projet
- Tests: MEDIUM — test files a creer, framework confirme present

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (Next.js stable — 30 jours)
