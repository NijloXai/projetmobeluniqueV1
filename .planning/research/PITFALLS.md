# Pitfalls Research — v8.0 Catalogue Produits

**Domain:** Next.js 16 App Router — Catalogue dynamique (search, sort, product grid, modal configurateur)
**Researched:** 2026-03-28
**Confidence:** HIGH (sources officielles Next.js + MDN + documentation Supabase verifiees)

---

## Critical Pitfalls

### Pitfall 1 : `useSearchParams` sans Suspense boundary — build cassé en production

**What goes wrong:**
Le hook `useSearchParams()` utilise pour lire ou mettre a jour les parametres de recherche/tri dans l'URL necessite une `<Suspense>` boundary en Next.js App Router. Sans elle, le build de production echoue avec l'erreur `Missing Suspense boundary with useSearchParams` — ou pire, l'ensemble de la page bascule en rendu client pur (CSR bailout), supprimant tout benefice SSR.

**Why it happens:**
En phase de build statique, l'URL n'existe pas encore — les search params sont des donnees dynamiques du client. Next.js ne peut pas prerendre un composant qui depend de valeurs inconnues a la compilation sans un mecanisme d'isolation. La Suspense boundary est ce mecanisme : elle permet de prerendre le shell statique et de charger les donnees dynamiques apres hydratation.

Pour ce projet, le filtre de recherche par nom et le tri seront probablement geres en memoire cote client (sans URL params) — mais si on choisit la route URL params pour la persistance, le pieges 'useSearchParams sans Suspense' est garantie de casser le build.

**How to avoid:**
Deux approches valides selon le besoin :

Option A — State client pur (recommandee pour ce projet) : Gerer la recherche et le tri avec `useState` dans un Client Component. Pas d'URL params, pas de Suspense requis. Adapte car le catalogue est une section d'une SPA sans navigation independante.

```typescript
'use client'
// CatalogueSection.tsx — Client Component
const [search, setSearch] = useState('')
const [sort, setSort] = useState<'price_asc' | 'price_desc' | 'newest'>('newest')
```

Option B — URL params avec Suspense obligatoire :

```typescript
// page.tsx (Server Component)
<Suspense fallback={<CatalogueSkeleton />}>
  <CatalogueClient />  {/* Client Component avec useSearchParams */}
</Suspense>
```

**Warning signs:**
Erreur de build `useSearchParams() should be wrapped in a suspense boundary` ou page blanche en production uniquement.

**Phase to address:**
Phase catalogue (CAT-01 a CAT-03) — decision architecturale a prendre avant d'ecrire le premier composant.

---

### Pitfall 2 : `next/image` avec URLs Supabase — `next.config.ts` vide bloque toutes les images

**What goes wrong:**
Le fichier `next.config.ts` est actuellement vide (`const nextConfig: NextConfig = {}`). Les images des produits (`model_images`) et des swatches tissu (`fabrics.swatch_url`) sont stockees dans Supabase Storage — leurs URLs ressemblent a `https://<ref>.supabase.co/storage/v1/object/public/model-photos/...`. Si on utilise `<Image>` de `next/image` avec ces URLs sans configurer `remotePatterns`, Next.js renvoie une erreur `Un-configured Host` et refuse d'optimiser l'image.

**Why it happens:**
Par securite, Next.js bloque toutes les sources d'images externes non declarees explicitement. Cette protection evite que des acteurs malveillants forcent le serveur d'optimisation d'images a traiter des URLs arbitraires.

**How to avoid:**
Configurer `remotePatterns` dans `next.config.ts` AVANT de creer le premier composant qui affiche une image Supabase :

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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

export default nextConfig
```

La valeur `*.supabase.co` couvre tous les projets Supabase (wildcard sur le sous-domaine). Le pathname `/storage/v1/object/public/**` restreint aux buckets publics uniquement — ne pas utiliser `/**` sans restriction de path.

Ajouter aussi `unoptimized: false` (default) est inutile, mais si les URLs Supabase retournent des erreurs 400 lors de l'optimisation (probleme connu dans certaines regions), le fallback est `unoptimized: true` sur les images concernees ou un custom loader.

**Warning signs:**
Erreur console `Error: Invalid src prop (...) hostname "*.supabase.co" is not configured` ou images grises/manquantes sur les product cards.

**Phase to address:**
Prerequis absolu de la Phase 1 (CAT-01 — product cards). Configurer avant tout code de composant.

---

### Pitfall 3 : Hydration mismatch avec l'etat de recherche/tri initialise cote client

**What goes wrong:**
Si la valeur initiale de l'etat `search` ou `sort` depend de quelque chose de specifique au client (valeur sauvegardee en `localStorage`, ou lue depuis l'URL via `window.location`), le rendu SSR et le rendu client seront differents. React detecte la discordance et produit un warning d'hydratation, parfois accompagne d'un flash visuel ou d'une reinitialisation des filtres.

**Why it happens:**
Next.js App Router fait une passe SSR meme pour les composants `'use client'`. Les valeurs comme `localStorage`, `sessionStorage`, ou `window.location.search` n'existent pas cote serveur — utiliser ces valeurs comme valeurs initiales de `useState` produit des contenus differents entre le premier rendu serveur et le rendu client.

**How to avoid:**
Toujours initialiser les etats de recherche/tri avec des valeurs deterministes et identiques cote serveur et client :

```typescript
'use client'
// BON : valeur initiale fixe, identique SSR et client
const [search, setSearch] = useState('')
const [sort, setSort] = useState<SortOption>('newest')

// MAUVAIS : lecture localStorage -> hydration mismatch
const [sort, setSort] = useState(() => {
  return (localStorage.getItem('catalogue-sort') as SortOption) ?? 'newest'
})
```

Si la persistance de tri entre sessions est requise (feature optionnelle), lire `localStorage` uniquement dans un `useEffect` APRES le premier rendu :

```typescript
const [sort, setSort] = useState<SortOption>('newest')

useEffect(() => {
  const saved = localStorage.getItem('catalogue-sort') as SortOption
  if (saved) setSort(saved)
}, [])
```

**Warning signs:**
Warning React `Hydration failed because the initial UI does not match what was rendered on the server` en console. Aussi : les filtres "sautent" apres le chargement de la page.

**Phase to address:**
Phase catalogue (CAT-02, CAT-03) — a l'implementation de la barre de recherche et du tri.

---

### Pitfall 4 : Recherche sans debounce — appels API excessifs ou filtrage saccade

**What goes wrong:**
Sans debounce sur le champ de recherche, chaque frappe du clavier declenche un re-render du catalogue (si le filtrage est en memoire) ou un appel API (si le filtrage est serveur-side). Sur un filtre en memoire, le probleme est mineur mais le rendu est saccade. Sur un filtre serveur, 10 frappes = 10 requetes HTTP, dont la plupart seront abandonnees.

**Why it happens:**
Le pattern `onChange={e => setSearch(e.target.value)}` met a jour l'etat a chaque caractere saisi. Sans limitation de cadence, React rerender le composant et recalcule les resultats filtres a chaque keystroke.

**How to avoid:**
Pour ce projet (filtrage en memoire, pas serveur-side), un debounce de 300ms sur le terme de recherche est suffisant :

```typescript
'use client'
import { useState, useMemo, useTransition } from 'react'

const [inputValue, setInputValue] = useState('') // mis a jour immediatement
const [debouncedSearch, setDebouncedSearch] = useState('') // utilise pour filtrer

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(inputValue), 300)
  return () => clearTimeout(timer)
}, [inputValue])

// Filtrage avec la valeur debouncee
const filteredModels = useMemo(() => {
  return models.filter(m =>
    m.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  )
}, [models, debouncedSearch])
```

Alternative plus simple — `useTransition` de React 19 pour marquer le filtrage comme transition non-urgente :

```typescript
const [isPending, startTransition] = useTransition()

const handleSearch = (value: string) => {
  setInputValue(value) // mise a jour immediate de l'input
  startTransition(() => setDebouncedSearch(value)) // filtre en arriere-plan
}
```

**Warning signs:**
Input qui "lag" pendant la frappe, ou liste qui scintille a chaque caractere.

**Phase to address:**
Phase catalogue (CAT-02) — implementation de la barre de recherche.

---

### Pitfall 5 : Modal sans focus trap — ecran bloquant au clavier et lecteurs d'ecran

**What goes wrong:**
Un modal qui n'emprisonne pas le focus clavier permet aux utilisateurs de "Tab" derriere le modal et d'interagir avec le contenu de la page sous-jacente. Pour les lecteurs d'ecran, le contenu derriere le modal reste visible et lisible, rendant l'experience confuse et non-conforme WCAG.

**Why it happens:**
La construction d'un modal avec un simple `display: flex` et une gestion de `z-index` ne suffit pas. Le DOM reste entierement accessible au clavier — le navigateur ne sait pas que le contenu derriere est "bloque".

**How to avoid:**
Pour le modal configurateur (90vw desktop, plein ecran mobile), implanter les attributs ARIA minimum et un focus trap manuel :

```typescript
// Modal.tsx — 'use client'
// 1. Attributs ARIA obligatoires
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Configurateur</h2>
  ...
  <button onClick={onClose} aria-label="Fermer le configurateur">✕</button>
</div>

// 2. Focus automatique a l'ouverture
useEffect(() => {
  if (isOpen) {
    closeButtonRef.current?.focus()
  }
}, [isOpen])

// 3. Retour du focus a l'element declencheur a la fermeture
// (conserver la ref du bouton "Configurer ce modele" qui a ouvert le modal)
useEffect(() => {
  return () => {
    triggerRef.current?.focus()
  }
}, [])

// 4. Fermeture avec Escape
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [onClose])
```

Pour le focus trap complet (cycle Tab/Shift+Tab), utiliser la librairie `focus-trap-react` (3KB gzip) — approuvee car ce projet n'a pas Radix UI disponible comme composant inline pour la SPA publique.

**Warning signs:**
Naviguer au clavier (Tab) fait sortir le focus du modal. VoiceOver/NVDA lit le contenu de la page sous le modal.

**Phase to address:**
Phase modal configurateur (CAT-04) — des la creation du composant Modal.

---

### Pitfall 6 : Body scroll non bloque sur iOS Safari quand le modal est ouvert

**What goes wrong:**
Sur iOS Safari, `overflow: hidden` sur le `<body>` ne bloque pas le scroll de la page derriere un modal. L'utilisateur peut scroller la page de fond pendant que le modal est ouvert — le contenu glisse sous le modal, creant un effet desorienant.

**Why it happens:**
C'est un bug historique d'iOS Safari qui ignore `overflow: hidden` sur `body` pour les evenements touch. Le body continue de recevoir les evenements `touchmove`.

**How to avoid:**
Pattern CSS moderne (2025) sans JavaScript :

```css
/* globals.css ou Modal.module.css */
body.modal-open {
  position: fixed;
  width: 100%;
  /* Stocker la position de scroll via JS avant de fixer */
  top: var(--scroll-position, 0);
  overflow-y: scroll; /* evite le saut de layout quand la scrollbar disparait */
}
```

```typescript
// Dans le composant Modal
useEffect(() => {
  if (isOpen) {
    const scrollY = window.scrollY
    document.documentElement.style.setProperty('--scroll-position', `-${scrollY}px`)
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
      window.scrollTo(0, scrollY) // restaurer position scroll
    }
  }
}, [isOpen])
```

**Warning signs:**
Sur un iPhone, le contenu de la page derriere le modal scroll quand on fait glisser le doigt dans le modal.

**Phase to address:**
Phase modal configurateur (CAT-04) — tester imperativement sur Safari iOS physique.

---

## Technical Debt Patterns

Raccourcis qui semblent raisonnables mais creent des problemes a moyen terme.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Filtrer les modeles directement dans le composant sans `useMemo` | Moins de code | Re-calcul du filtre a chaque re-render, meme si les donnees n'ont pas change | Jamais — `useMemo` sur le filtre est gratuit |
| `unoptimized={true}` sur toutes les images Supabase | Evite la config `remotePatterns` | Supabase renvoie des images non-optimisees (pas de WebP, pas de resize) → page lente | Jamais en production |
| Un seul composant `CatalogueSection.tsx` de 300+ lignes | Rapide a ecrire | Impossible a maintenir, search/sort/cards/modal entangled | MVP uniquement si composant < 150 lignes |
| Recherche qui compare en cassant les accents (`indexOf` sans normalize) | Trivial a implanter | "Canape" ne trouve pas "Canapé" — mauvaise UX | Jamais — normaliser les diacritiques |
| Sort state en `localStorage` immediatement (sans `useEffect`) | Persistance entre sessions | Hydration mismatch garanti | Jamais sans useEffect |
| Cards sans dimensions fixes sur l'image | Pas de CSS a calculer | CLS (Cumulative Layout Shift) — les cards "sautent" au chargement | Jamais en production |

---

## Integration Gotchas

Erreurs courantes lors de la connexion aux services existants.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `GET /api/models` | Appeler l'API dans un composant avec `fetch` cote client sans gerer l'etat loading/error | Utiliser `useState` + `useEffect` avec 3 etats (loading, data, error) ou React Suspense avec Server Component |
| Supabase Storage URLs | Utiliser `model_images[0].image_url` directement dans `<img>` natif (bypass next/image) | Toujours `<Image>` next/image avec `remotePatterns` configure — permet l'optimisation WebP automatique |
| `fabrics.swatch_url` pour les swatches | Utiliser `<Image fill>` pour des cercles de 22px | Utiliser `<Image width={22} height={22}>` — `fill` est pour les images sans dimensions connues |
| Types TypeScript | Utiliser `any[]` pour les donnees de l'API | Importer et utiliser les types de `src/types/database.ts` — `Database['public']['Tables']['models']['Row']` |
| Sort par prix | Trier directement `model.base_price` | Verification : le champ s'appelle `base_price` dans la table `models` — verifier les types avant de trier |
| Swatches sur les cards | Appeler `/api/fabrics` depuis chaque card separement | Inclure les tissus dans l'appel initial ou passer les swatches comme props depuis le parent |

---

## Performance Traps

Patterns qui fonctionnent en dev mais posent probleme a la croissance.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Charger TOUTES les images de tous les angles de chaque modele au load initial | Chargement long, bandwidth inutile | Charger uniquement `model_images[0]` (front) pour la card. Les autres angles se chargent dans le modal | Des 3+ modeles avec 5 angles chacun |
| `<Image>` sans prop `sizes` sur les product cards | Next.js telecharge une image 1920px pour une card de 400px | `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"` — correspond au grid 1/2/3 colonnes | Immediate — impact LCP |
| Re-fetch `GET /api/models` a chaque ouverture/fermeture du modal | API appelee plusieurs fois inutilement | Stocker les donnees dans le state parent du catalogue, passer le modele selectionne comme prop au modal | Immediate — visible dans Network tab |
| Filtre en memoire sur 100+ modeles sans `useMemo` | Lag visible dans l'input de recherche | `useMemo` sur le calcul de filtrage, dependances `[models, debouncedSearch, sort]` | Catalogue > 50 produits |
| Swatches: charger les tissu-swatches de TOUS les modeles au load | N requetes images supplementaires | Charger max 3-4 swatches par card, afficher "+N" pour le reste | Des 5+ tissus par modele |

---

## Security Mistakes

Problemes de securite specifiques a ce domaine.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Appeler `/api/admin/models` (route protegee) depuis le front public | Expose les donnees admin non-filtrées | Utiliser uniquement `GET /api/models` — route publique qui filtre sur `is_active = true` |
| Afficher `is_active`, `model_id` ou d'autres champs internes dans le HTML rendu | Fuite d'informations sur la structure backend | Ne passer aux composants cards que les champs utiles : `id`, `name`, `base_price`, `slug`, images front |
| Search input XSS | Injection de contenu si la valeur est rendue sans echappement | React echappe automatiquement les valeurs dans JSX — ne pas utiliser `dangerouslySetInnerHTML` avec la valeur de recherche |

---

## UX Pitfalls

Erreurs d'experience utilisateur courantes sur les catalogues produits.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Aucun etat vide quand la recherche ne retourne rien | L'utilisateur pense que l'app est cassee | Afficher un message "Aucun canapé ne correspond a votre recherche" avec un bouton "Effacer la recherche" |
| Aucun skeleton/placeholder pendant le chargement initial de l'API | Ecran vide puis apparition brutale de toutes les cards | Afficher 3 skeleton cards pendant le fetch — meme structure visuelle que les vraies cards |
| Search qui efface le tri quand on tape | L'utilisateur perd le contexte | Les etats `search` et `sort` sont independants — ne jamais resetter le tri quand la recherche change |
| CTA "Configurer ce modele" ne retourne pas le focus apres fermeture du modal | Navigation clavier cassee — l'utilisateur est "perdu" dans la page | `triggerRef.current?.focus()` dans le cleanup de l'useEffect du modal |
| Cards sans dimension image fixe | Les cards changent de taille selon le ratio de l'image — layout instable | `aspect-ratio: 4/3` sur le container image de chaque card, indépendamment des dimensions de l'image |
| Swatches sans tooltip/title | L'utilisateur ne sait pas a quel tissu correspond le cercle de couleur | `title={fabric.name}` sur chaque swatch — tooltip natif HTML accessible |
| Sort qui "saute" la vue scroll apres changement | L'utilisateur perd sa position dans le catalogue | Ne pas scroller vers le haut automatiquement apres un changement de tri — laisser l'utilisateur la ou il est |

---

## "Looks Done But Isn't" Checklist

Elements qui semblent complets en dev mais manquent en production.

- [ ] **Product cards :** Images visibles en dev (URLs hardcodees) mais cassees en production — verifier que `remotePatterns` est configure avec la vraie URL Supabase, pas une URL exemple.
- [ ] **Recherche :** Fonctionne avec accents en francais — "Canapé", "Möbel", "Firenzé" — tester `normalize('NFD').replace(/\p{Mn}/gu, '')` ou `.localeCompare` avec `sensitivity: 'base'`.
- [ ] **Modal :** Escape key ferme le modal — tester au clavier, pas seulement en cliquant le bouton fermer.
- [ ] **Modal :** Body scroll bloque sur iOS Safari — tester sur un vrai iPhone (pas simulateur).
- [ ] **Loading state :** API peut etre lente (cold start Supabase) — le skeleton doit s'afficher > 200ms.
- [ ] **Empty state :** Recherche "zzzzz" affiche un message explicatif, pas une grille vide silencieuse.
- [ ] **Grid responsive :** 1 colonne mobile / 2 colonnes tablette / 3 colonnes desktop — verifier les 3 breakpoints.
- [ ] **next/image sizes :** Prop `sizes` correcte sur chaque image de card — inspecter le srcset genere dans les DevTools Network.
- [ ] **TypeScript strict :** `npx tsc --noEmit` passe sans erreur apres integration des types Supabase sur les props de cards.
- [ ] **'use client' boundary :** Le composant Server Component `page.tsx` ne recoit pas la directive `'use client'` a cause du catalogue dynamique.

---

## Recovery Strategies

Si les pieges se produisent malgre la prevention.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `remotePatterns` manquant | LOW | Ajouter la config dans `next.config.ts`, redemarrer le serveur de dev. 5 minutes. |
| Hydration mismatch sur search state | LOW | Identifier la valeur initiale non-deterministe, la remplacer par une valeur fixe ou la deplacer dans `useEffect`. 15 minutes. |
| `useSearchParams` sans Suspense (si adopte) | MEDIUM | Extraire le composant appelant dans un enfant enveloppe de `<Suspense>`. 30 minutes. |
| Modal sans focus trap — reconcevoir | MEDIUM | Ajouter `focus-trap-react` (npm install), envelopper le contenu du modal. Tester clavier/VoiceOver. 1 heure. |
| Body scroll iOS non bloque | MEDIUM | Ajouter le pattern `position: fixed + top: var(--scroll-position)`. Tester sur iPhone physique. 1 heure. |
| Images Supabase non optimisees (400 errors) | HIGH | Investiguer si Supabase Storage transformations sont activees, ou configurer un custom loader. 2-4 heures. |
| Architecture composants trop monolithique | HIGH | Refactorer CatalogueSection en sous-composants separes (SearchBar, SortSelector, ProductGrid, ProductCard, Modal). Risque de regression. |

---

## Pitfall-to-Phase Mapping

Comment les phases de la roadmap adressent ces pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| `remotePatterns` Supabase manquant | Phase 1 — prerequis avant product cards | `next.config.ts` contient `remotePatterns` avec `*.supabase.co` |
| Hydration mismatch search/sort state | Phase 1 — architecture composants | `useState` initialise avec valeurs fixes, pas de `localStorage` en valeur initiale |
| `useSearchParams` sans Suspense | Phase 1 — decision search state | Decision documentee : state client pur (`useState`) vs URL params |
| Debounce recherche manquant | Phase 2 — implementation SearchBar | Input avec 300ms debounce, `useMemo` sur le filtre |
| Cards sans `sizes` next/image | Phase 2 — product cards | DevTools Network : srcset genere par Next.js present sur les images |
| Modal sans focus trap + ARIA | Phase 3 — composant Modal | Test clavier (Tab cycle) + VoiceOver (dialog announce) |
| Body scroll iOS non bloque | Phase 3 — composant Modal | Test manuel sur Safari iOS — body immobile pendant modal ouvert |
| Empty state manquant | Phase 2 — product grid | Recherche "test-inexistant" affiche message + bouton reset |
| Loading state absent | Phase 1 ou 2 | Skeleton visible pendant > 200ms (throttle Network en DevTools) |
| TypeScript non-strict sur les types API | Toutes les phases | `npx tsc --noEmit` passe a 0 erreur apres chaque phase |

---

## Sources

- [Next.js — Missing Suspense with useSearchParams (docs officielles)](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout) — HIGH confidence
- [Next.js — useSearchParams API reference](https://nextjs.org/docs/app/api-reference/functions/use-search-params) — HIGH confidence
- [Next.js — Image remotePatterns configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/images) — HIGH confidence
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) — HIGH confidence
- [Vercel Community — Supabase Storage INVALID_IMAGE_OPTIMIZE_REQUEST](https://community.vercel.com/t/images-from-supabase-storage-result-in-invalid-image-optimize-request/6009) — MEDIUM confidence
- [oneuptime.com — How to Fix useSearchParams SSR Issues (2026-01-24)](https://oneuptime.com/blog/post/2026-01-24-nextjs-usesearchparams-ssr-issues/view) — MEDIUM confidence
- [Aurora Scharff — Managing Advanced Search Param Filtering in Next.js App Router](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) — MEDIUM confidence
- [LogRocket — Build an accessible modal with focus-trap-react](https://blog.logrocket.com/build-accessible-modal-focus-trap-react/) — MEDIUM confidence
- [CSS-Tricks — Prevent Page Scrolling When a Modal is Open](https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/) — HIGH confidence
- [DEV Community — iOS Safari scroll lock bug CSS fix (2025)](https://dev.to/stripearmy/i-fixed-ios-safaris-scroll-lock-bug-with-just-css-and-made-a-react-package-for-it-2o41) — MEDIUM confidence
- [Next.js — Adding Search and Pagination (official tutorial)](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) — HIGH confidence
- [GitHub Issue #61654 — useSearchParams Suspense requirement discussion](https://github.com/vercel/next.js/discussions/61654) — HIGH confidence

---
*Pitfalls research for: Catalogue produits Next.js App Router + Supabase (search, sort, grid, modal)*
*Researched: 2026-03-28*
