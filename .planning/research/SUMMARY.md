# Project Research Summary

**Project:** Möbel Unique — M008 Catalogue Produits
**Domain:** SPA catalogue e-commerce luxe — canapés personnalisables, Next.js 16 App Router
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

M008 est la section catalogue de la SPA publique, s'intégrant à la page existante (Header + Hero + HowItWorks livrés en v7.0). Elle affiche les canapés actifs depuis Supabase en grille responsive, avec recherche par nom, tri par prix et nouveauté, et un modal configurateur (placeholder en v8.0, fonctionnel en M009). La bonne nouvelle : aucune dépendance npm supplémentaire n'est requise. Tout se construit avec le stack déjà installé — `@radix-ui/react-dialog@1.1.15`, `next/image`, `lucide-react@1.7.0`, `useState`/`useMemo` React natif, et CSS Modules.

L'approche recommandée repose sur une séparation nette Server/Client : `CatalogueSection` (Server Component) appelle Supabase directement et passe les données en props à `CatalogueClient` (Client Component) qui gère l'état local (recherche, tri, modal). Ce pattern évite tout waterfall client, élimine le loading state initial visible, et conserve les bénéfices SSR tout en permettant l'interactivité. Le state reste local à `CatalogueClient` — Zustand est réservé à M009+ quand le configurateur (section distante) devra consommer le produit sélectionné.

Le risque principal est technique et résolu d'emblée : `next.config.ts` est actuellement vide — la configuration `remotePatterns` pour Supabase Storage doit être ajoutée en tout premier, avant tout composant utilisant `next/image`. Le second risque concerne le modal : sans le focus trap natif de Radix Dialog (déjà installé), le modal serait inaccessible au clavier. Ces deux risques sont préemptés par l'utilisation des outils déjà présents dans le projet.

---

## Key Findings

### Recommended Stack

Aucune installation npm n'est requise pour M008. Toutes les capacités nécessaires sont couvertes par l'existant. Le fetch des données s'effectue côté serveur avec `createClient()` Supabase (pattern déjà établi dans l'admin), ce qui élimine le waterfall visible. La recherche et le tri sont des opérations `useMemo` en mémoire — instantané pour 20-50 produits sans debounce obligatoire, bien qu'un debounce 300ms via `useTransition` React 19 améliore le ressenti sur les machines lentes.

**Core technologies :**
- **Next.js 16.2.1 (Server Components)** : fetch Supabase direct dans `CatalogueSection` — données disponibles avant hydratation, zero waterfall
- **React 19 `useState` + `useMemo`** : recherche/tri client-side en mémoire — instantané pour moins de 50 produits, zero dépendance
- **`@radix-ui/react-dialog@1.1.15`** (installé) : modal configurateur — focus trap, ARIA, Escape key nativement inclus, z-index 200/201 pour passer au-dessus du header (100)
- **`next/image` fill + sizes** : images produit — WebP auto, lazy loading, CLS évité — requiert `remotePatterns` dans `next.config.ts`
- **`lucide-react@1.7.0`** (installé) : icône Search dans la barre de recherche

### Expected Features

**Must have — table stakes M008 :**
- Cards produit (image, nom, prix "à partir de X €", CTA "Configurer ce modèle") — base absolue de tout catalogue
- Grid responsive 1 col mobile / 2 col tablet / 3 col desktop — standard universel
- États : skeleton chargement, erreur API, catalogue vide — robustesse minimale attendue
- Barre de recherche filtrage par nom — scalable dès 20+ produits
- Tri prix croissant / décroissant / nouveautés — contrôle utilisateur attendu en e-commerce
- Modal configurateur placeholder (Radix Dialog, 90vw desktop / plein écran mobile) — destination du CTA card
- Focus trap modal + fermeture Escape + overlay clic — WCAG 2.1 AA non-négociable

**Should have — différenciateurs :**
- Swatches miniatures 22px sur les cards (cercles de couleur tissu) + badge "+N" — communication de la personnalisation sans ouvrir le modal (requiert vérification/création de `GET /api/fabrics` public)
- Compteur de résultats "X modèles" pendant filtrage/tri — feedback immédiat
- Scroll anchor CTA hero vers `#catalogue` — cohérence de la SPA
- Hover state card avec élévation subtile (`box-shadow` + `translateY(-2px)`) — feeling de qualité luxe

**Defer (M009+) :**
- Contenu réel du modal : sélection tissu, swatches 52px, zoom texture — M009
- Animation entrée/sortie modal raffinée — M011 polish
- Bandeau sticky mobile dans le modal — M009/M010

### Architecture Approach

L'architecture repose sur 7 composants dans un dossier `src/components/public/Catalogue/`. La boundary Server/Client est explicite : `CatalogueSection` (Server Component) fait le fetch Supabase via `createClient()` serveur et passe `ModelWithImages[]` en props à `CatalogueClient` (Client Component). Ce dernier orchestre `SearchBar`, `SortSelect`, `ProductGrid` (qui contient `ProductCard`) et `ConfigurateurModal`. La seule modification de l'existant concerne `next.config.ts` (ajout `remotePatterns`) et `src/app/page.tsx` (ajout `<CatalogueSection />`).

**Composants principaux :**
1. **`CatalogueSection`** (Server) — fetch Supabase direct, wrapper `<section id="catalogue">`, H2 "Collection Signature"
2. **`CatalogueClient`** (Client) — state local `searchQuery`, `sortOrder`, `selectedProduct`, `modalOpen` + `useMemo` filtrage/tri avec normalisation diacritiques
3. **`ProductCard`** (Client) — `next/image fill + sizes`, prix `Intl.NumberFormat('fr-FR')`, CTA callback `onConfigurer`
4. **`ConfigurateurModal`** (Client) — `@radix-ui/react-dialog`, overlay `z-index:200`, content `z-index:201`, CSS mobile plein écran
5. **`SearchBar`** / **`SortSelect`** / **`ProductGrid`** — composants feuilles contrôlés par `CatalogueClient`

### Critical Pitfalls

1. **`next.config.ts` vide bloque toutes les images Supabase** — configurer `remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }]` en premier absolu, avant d'écrire le moindre composant image.

2. **Hydration mismatch si l'état search/sort lit `localStorage`** — initialiser `useState('')` et `useState('newest')` avec des valeurs fixes déterministes ; toute lecture de `localStorage` uniquement dans un `useEffect` post-rendu.

3. **Modal sans focus trap (WCAG 2.1 AA)** — utiliser `@radix-ui/react-dialog` (déjà installé) qui gère focus trap, `aria-modal`, Escape key et retour de focus nativement. Ne pas recoder manuellement.

4. **Body scroll non bloqué sur iOS Safari** — `overflow: hidden` sur `body` est ignoré par iOS Safari ; utiliser le pattern `position: fixed; top: var(--scroll-position)` avec restauration `window.scrollTo` dans le cleanup `useEffect` du modal.

5. **`next/image` sans prop `sizes`** — sans `sizes`, Next.js télécharge une image 1920px pour une card de 400px. Toujours passer `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"` sur les product cards (grille 1/2/3 colonnes).

---

## Implications for Roadmap

La recherche identifie 3 phases naturelles basées sur les dépendances entre composants. L'ordre suit le principe feuilles avant conteneurs.

### Phase 1 — Prérequis et fondation (CAT-01)
**Rationale :** `next.config.ts` doit être configuré avant tout composant image — c'est un blocker absolu. ProductCard est la feuille dont dépendent ProductGrid et CatalogueClient.
**Delivers :** `next.config.ts` avec `remotePatterns` + `ProductCard` + `ProductGrid` + `CatalogueSection` affichant les vraies données Supabase en grille responsive.
**Addresses :** Cards produit, grid 1/2/3 colonnes, image optimisée, placeholder image, état vide, titre H2 section.
**Avoids :** Pitfall `remotePatterns` manquant (blocker), pitfall `<img>` natif, pitfall `'use client'` sur `CatalogueSection`.

### Phase 2 — Interactivité catalogue (CAT-02, CAT-03)
**Rationale :** La recherche et le tri dépendent de `CatalogueClient` qui dépend de `ProductGrid` (Phase 1). Une fois les données visibles, l'interactivité s'ajoute sans risque de régression.
**Delivers :** `CatalogueClient` avec `SearchBar`, `SortSelect`, skeleton chargement, état erreur, compteur résultats.
**Uses :** `useState` + `useMemo` + `useTransition` React 19, `lucide-react` Search icon, `Intl.NumberFormat('fr-FR')`.
**Implements :** Pattern filtrage/tri en mémoire, normalisation diacritiques NFD, composition filtre puis tri.
**Avoids :** Pitfall hydration mismatch (init `useState` avec valeurs fixes), pitfall `useSearchParams` sans Suspense (décision : state client pur), pitfall filtre sans `useMemo`.

### Phase 3 — Modal configurateur (CAT-04)
**Rationale :** Le modal dépend du `selectedProduct` géré par `CatalogueClient` (Phase 2). L'accessibilité clavier et mobile requiert des tests dédiés sur appareil physique.
**Delivers :** `ConfigurateurModal` placeholder 90vw desktop / plein écran mobile, overlay `z-index:200+`, focus trap Radix, Escape, body scroll lock iOS.
**Uses :** `@radix-ui/react-dialog@1.1.15` (installé), CSS Modules, pattern `position: fixed + top: var(--scroll-position)`.
**Avoids :** Pitfall focus trap absent, pitfall body scroll iOS Safari, pitfall z-index conflit avec header (`z-index:100`).

### Phase Ordering Rationale

- `next.config.ts` remotePatterns est un blocker absolu pour `next/image` — toujours en premier.
- ProductCard doit exister avant ProductGrid, qui doit exister avant CatalogueClient — les feuilles avant les conteneurs.
- Le modal peut être développé en parallèle de la Phase 2 techniquement (dépendances uniquement sur les types `ModelWithImages` et Radix Dialog), mais se teste seulement quand CatalogueClient expose le `selectedProduct`.
- Zustand n'est pas introduit en M008 — le state `selectedProduct` reste local à `CatalogueClient`. La migration vers Zustand est planifiée pour M009 quand le configurateur réel (section distante dans le DOM) devra consommer ce state.

### Research Flags

**Phases avec patterns standards (pas de research-phase nécessaire) :**
- **Phase 1 — ProductCard + grid :** Patterns `next/image fill + sizes` et CSS Grid bien documentés, code source existant analysé directement, exemples de code complets fournis dans ARCHITECTURE.md.
- **Phase 2 — Recherche/tri :** Pattern `useState + useMemo` trivial, implémenté dans des dizaines de projets Next.js, implémentation complète fournie dans ARCHITECTURE.md.
- **Phase 3 — Radix Dialog :** Librairie déjà installée et utilisée dans l'admin, documentation officielle vérifiée, CSS cible complet fourni dans ARCHITECTURE.md.

**Point d'attention non-bloquant :**
- **Swatches sur les cards (P2)** : Vérifier l'existence de `GET /api/fabrics` (route publique, distincte de `/api/admin/fabrics`). Si absente, la créer prend environ 30 minutes (pattern identique à `/api/models`). Ne pas bloquer les phases 1/2/3 sur ce point — les swatches sont des P2 ajoutés après validation du MVP.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions vérifiées dans package.json, zero nouvelle dépendance requise, patterns officiels Next.js vérifiés |
| Features | HIGH | Wireframe v4 + charte graphique + schéma database + contrat API — toutes sources de vérité directement accessibles dans le projet |
| Architecture | HIGH | Code source existant analysé directement, patterns App Router officiels vérifiés, exemples de code complets fournis dans ARCHITECTURE.md |
| Pitfalls | HIGH | Sources officielles Next.js + MDN + CSS-Tricks vérifiées, recovery costs estimés, checklist "Looks Done But Isn't" fournie |

**Overall confidence : HIGH**

### Gaps to Address

- **`GET /api/fabrics` public** : Non confirmée dans la recherche. Vérifier `src/app/api/fabrics/route.ts` avant de commencer les swatches. Si absente, créer en début de Phase 1 ou déplacer les swatches en v8.x post-validation. Ne bloque pas le MVP.

- **Nom exact du champ prix** : La recherche mentionne à la fois `base_price` (PITFALLS.md, Integration Gotchas) et `price` (STACK.md, ARCHITECTURE.md) comme nom du champ dans la table `models`. Vérifier dans `src/types/database.ts` avant d'implémenter ProductCard et le tri par prix.

- **iOS Safari body scroll** : Requiert un test sur appareil physique — le simulateur Xcode ne reproduit pas ce bug. Prévoir un test manuel explicite dans la checklist CAT-04, distinct des tests desktop.

---

## Sources

### Primary (HIGH confidence)
- `src/types/database.ts` — types Supabase auto-générés, noms de champs de vérité
- `src/app/api/models/route.ts` — contrat API publique confirmé
- `src/app/page.tsx` — structure page existante (Header, Hero, HowItWorks)
- `src/app/globals.css` — tokens CSS complets, aucun ajout requis pour M008
- `package.json` — versions installées vérifiées directement
- `.planning/maquette/wireframe-page-unique.md` — autorité wireframe v4
- [Next.js Image remotePatterns](https://nextjs.org/docs/app/api-reference/config/next-config-js/images)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Radix UI Dialog Primitives](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Next.js Missing Suspense with useSearchParams](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout)

### Secondary (MEDIUM confidence)
- [CSS-Tricks — Prevent Page Scrolling When Modal is Open](https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/) — pattern body scroll lock iOS
- [Vercel Community — Supabase Storage image optimization issues](https://community.vercel.com/t/images-from-supabase-storage-result-in-invalid-image-optimize-request/6009) — fallback `unoptimized` si Supabase Storage transformations défaillantes
- NN/g E-Commerce UX patterns — product listing pages — validation des choix UX catalogue
- Roche Bobois / Ligne Roset — analyse concurrentielle directe, grille 3 colonnes, swatches sur cards

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
