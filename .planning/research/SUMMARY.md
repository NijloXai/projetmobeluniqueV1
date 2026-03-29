# Project Research Summary

**Project:** Möbel Unique — M009 Configurateur Tissu
**Domain:** Configurateur tissu canapé dans modal dialog — SPA Next.js 16 App Router
**Researched:** 2026-03-29
**Confidence:** HIGH

## Executive Summary

M009 transforme le placeholder "Configurateur à venir" en configurateur fonctionnel. La bonne nouvelle : aucune dépendance npm n'est requise. Le projet possède déjà tout ce qu'il faut — React `useState`/`useMemo`, `next/image`, CSS Modules, `calculatePrice()` dans `utils.ts`, et la route API `/api/models/[slug]/visuals` qui retourne les rendus publiés avec les données tissu embarquées. Le configurateur repose sur des données pré-générées côté admin, pas sur une génération temps-réel. La complexité est donc organisationnelle (câbler les données) plutôt que technique.

L'approche recommandée est un co-fetch server-side dans `CatalogueSection` (déjà un Server Component async) pour charger en parallèle les modèles, les tissus actifs et les visuels publiés. Ces données sont passées en props jusqu'à `ConfiguratorModal` — un prop drilling de 3 niveaux acceptable. L'état local (`selectedFabricId`, `selectedAngle`) reste confiné au modal via `useState`. Zustand n'est pas justifié à ce stade. Cette architecture élimine tout waterfall réseau à l'ouverture du modal et produit une expérience sans latence perceptible.

Le risque principal n'est pas technique mais régressif : `ConfiguratorModal` a un `return null` conditionnel hérité de la Phase 6, et les nouveaux hooks doivent impérativement être déclarés avant ce guard. Le scroll lock iOS implémenté en Phase 6 doit rester intact malgré l'ajout du contenu configurateur. Le filtre `fabric.is_active` ne peut pas être délégué à Supabase PostgREST pour les jointures imbriquées — il doit être appliqué côté JS après fetch, comme dans la route existante.

---

## Key Findings

### Recommended Stack

Aucune nouvelle dépendance. Le configurateur est réalisable intégralement avec l'existant.

**Core technologies :**
- `React useState / useMemo` — état swatch sélectionné + angle actif + calcul visuels filtrés, organisation en `Map<fabricId, Map<viewType, Visual>>` pour lookup O(1)
- `next/image` (inclus Next.js 16.2.1) — rendu images swatches et visuels IA, `remotePatterns` Supabase déjà configuré
- `CSS Modules` — layout 2 colonnes 60/40 desktop, rail swatches, thumbnails angles, respect convention projet
- `calculatePrice()` / `formatPrice()` (`src/lib/utils.ts`) — source unique de vérité pour le prix premium (+80 EUR fixe)
- `/api/models/[slug]/visuals` — route publique existante (M006), retourne rendus publiés + `fabric` embedded + `model_image`
- `lucide-react` (1.7.0 installé) — icônes lien externe Shopify, chevrons

**Ce qu'il ne faut pas installer :**
- `react-zoom-pan-pinch` : peerDeps `^17 || ^18` seulement, React 19.2.4 non supporté officiellement
- `react-image-gallery` : ~30KB gzip pour 5 thumbnails statiques — surdimensionné
- `@uiw/react-color-swatch` : conçu pour couleurs hex, pas pour textures tissu (images)

### Expected Features

**Indispensables (table stakes) — livrer en M009 :**
- Grille de swatches cliquables avec `swatch_url`, badge "+80 EUR" sur premium, état actif visuellement distinct (bordure `--color-primary`)
- Affichage du rendu IA quand un tissu est sélectionné (image principale + badge "Rendu IA")
- Fallback sur la photo originale du modèle si aucun rendu publié pour le tissu sélectionné (badge "Photo originale")
- Prix dynamique mis à jour en temps réel dès la sélection du tissu via `calculatePrice()`
- CTA "Commander sur Shopify" lié à `model.shopify_url` (masqué si null, désactivé sans tissu sélectionné)
- Skeleton discret pendant le fetch initial, fermeture modal sans régression
- Tissu sélectionné par défaut au chargement (premier tissu non-premium)

**Compétitifs (différenciateurs) — ajouter si le temps le permet :**
- Navigation par angles : thumbnails 72x54px, uniquement les angles disponibles pour le tissu sélectionné
- Encart zoom texture : `swatch_url` dans un aperçu 100-120px avec nom et badge premium
- Badge "Rendu IA" / "Photo originale" selon la nature du visuel affiché
- Lien "Changer de modèle" pour éviter la dead-end dans le modal
- Dimensions du modèle affichées si `model.dimensions` non-null

**Différer (v10+) :**
- Bandeau sticky mobile (swatch + prix + CTA) — M009 si temps disponible, sinon M010
- Partage de configuration — M010 Simulation, WhatsApp share
- Simulation salon (upload photo + génération IA) — M010

**Anti-features à rejeter explicitement :**
- Génération IA temps-réel : les rendus sont pré-générés côté admin, pas de temps-réel public
- Filtrage swatches par catégorie : pertinent seulement à 20+ tissus, surcharge cognitive avant
- Zoom interactif loupe sur le rendu IA : complexité touch events élevée, non justifiée pour des rendus IA

### Architecture Approach

L'architecture suit le pattern établi du projet : co-fetch server-side dans `CatalogueSection` avec `Promise.all` (3 queries Supabase parallèles), forwarding en props via `CatalogueClient`, état local dans `ConfiguratorModal`. Quatre composants feuilles sont créés (`FabricSelector`, `RenduIA`, `AngleSelector`, `PriceDisplay`) et trois fichiers existants sont modifiés (`CatalogueSection`, `CatalogueClient`, `ConfiguratorModal`). Aucune nouvelle route API publique.

**Composants principaux :**
1. `CatalogueSection` (Server Component, MODIFIÉ) — co-fetch fabrics actifs + visuals publiés en `Promise.all`
2. `CatalogueClient` (Client Component, MODIFIÉ) — forwarding props fabrics/visuals, filtre visuals par `model.id` au moment du forwarding à `ConfiguratorModal`
3. `ConfiguratorModal` (Client Component, MODIFIÉ) — remplace le placeholder, porte `selectedFabricId` + `selectedAngle` en state local, orchestre les composants feuilles
4. `FabricSelector` (CRÉÉ) — rail de swatches cliquables, `role="radiogroup"`, état actif, badge premium
5. `RenduIA` (CRÉÉ) — image visuel IA ou fallback gracieux, badge "Rendu IA" / "Photo originale", `key={url}` pour forcer remount
6. `AngleSelector` (CRÉÉ) — thumbnails d'angles disponibles pour le tissu sélectionné uniquement
7. `PriceDisplay` (CRÉÉ) — `calculatePrice()` depuis `utils.ts`, `aria-live="polite"` pour annonce accessibilité

**Organisation des données en mémoire :**

Les données arrivent sous forme de tableau plat depuis `CatalogueSection`. Le `ConfiguratorModal` les organise en `Map<fabricId, Map<viewType, Visual>>` pour des lookups O(1). Les tissus disponibles sont dérivés de cette Map (pas de fetch séparé). Angle par défaut : `3/4` si disponible pour le tissu sélectionné, sinon premier angle disponible.

**Ordre de build (feuille → conteneur) :**

1. Vérifier types `VisualWithFabricAndImage` dans `database.ts`
2. `PriceDisplay` (dépend uniquement de `utils.ts`)
3. `FabricSelector` (dépend de `Fabric[]` + `next/image`)
4. `AngleSelector` (dépend de `string[]` uniquement)
5. `RenduIA` (dépend de `GeneratedVisual | null` + `next/image`)
6. `ConfiguratorModal` (assemble tout, porte l'état)
7. `CatalogueClient` (forwarding minimal)
8. `CatalogueSection` (ajoute `Promise.all`)

### Critical Pitfalls

1. **Hooks avant `return null`** — les nouveaux `useState` et `useEffect` doivent être déclarés AVANT le guard `if (!model) return null` hérité de la Phase 6. Ce guard doit rester en dernière position. Violation = crash React "Rendered more hooks than expected" en production.

2. **Filtre `fabric.is_active` côté JS obligatoire** — PostgREST ne supporte pas les filtres sur jointures imbriquées au niveau WHERE. Reproduire le pattern de `/api/models/[slug]/visuals/route.ts` : `filter(v => v.fabric?.is_active)` après fetch. Sans ce filtre, des tissus désactivés apparaissent dans les swatches.

3. **CLS sur swap d'angle** — fixer `aspect-ratio: 4/3` sur `.visualWrapper` indépendamment de l'angle, et utiliser `key={currentVisualUrl}` sur `<Image>` pour forcer le remount. Sans ça, le layout "saute" à chaque changement d'angle et l'ancienne image persiste pendant le chargement.

4. **Scroll iOS — ne pas ajouter `overflow: hidden` sur les conteneurs intermédiaires** — le scroll lock Phase 6 repose sur `overflow-y: auto` sur `.content` uniquement. Tout `overflow: hidden` sur `.inner`, `.body` ou équivalent coupe le scroll sur mobile. Tester sur appareil physique après chaque ajout de section dans le modal.

5. **Reset état à l'ouverture d'un nouveau modèle** — utiliser `useEffect([model?.id])` pour reset `selectedFabricId` et `selectedAngle`. Alternative plus simple : `key={model?.id}` sur `ConfiguratorModal` depuis `CatalogueClient` (démontage/remontage automatique, zéro logique de reset).

6. **Ne pas exposer `reference_image_url`** — le bucket `fabric-references` est privé. Les URLs signées expirent. Utiliser uniquement `swatch_url` (bucket `fabric-swatches` public) dans le configurateur public.

7. **Swatches sans `aria-pressed` / `aria-label`** — non-conformité WCAG silencieuse. Chaque swatch doit avoir `aria-label={fabric.name}` et `aria-pressed={isSelected}`. Le groupe doit avoir `role="radiogroup"`.

8. **`calculatePrice` inline** — ne jamais recréer la logique `price + 80` dans le composant. Importer depuis `src/lib/utils.ts`. La constante 80 est dans `utils.ts` — une seule source de vérité.

---

## Implications for Roadmap

Les 4 features du milestone (CONF-01 swatches, CONF-02 galerie angles, CONF-03 prix dynamique, CONF-04 CTA Shopify) ont des dépendances claires qui dictent un ordre d'implémentation feuille vers conteneur.

### Phase 1 : Fetch et câblage données (fondation)
**Rationale :** Toutes les features dépendent des données visuals/fabrics. Le choix fetch server-side vs client-side impacte la structure des types et les props. Décision à prendre avant d'écrire le premier composant.
**Delivers :** `CatalogueSection` avec `Promise.all` (3 queries), types `VisualWithFabricAndImage` vérifiés ou ajoutés, interface props `CatalogueClient` étendue, `ConfiguratorModal` étendue avec `fabrics` + `visuals` props
**Addresses :** Prérequis CONF-01, CONF-02, CONF-03, CONF-04
**Avoids :** Pitfall 1 (pas de route `/api/fabrics` publique), Pitfall 2 (waterfall fetch client-side), Pitfall 9 (hooks avant `return null`), Pitfall 10 (reset état)

### Phase 2 : Configurateur core (CONF-01, CONF-03, CONF-04)
**Rationale :** Swatches + prix + CTA forment le MVP minimal livrable. Dépendent uniquement des données Phase 1. Représentent la valeur métier principale — visible et testable par l'utilisateur sans galerie d'angles.
**Delivers :** `FabricSelector` (swatches cliquables 52px, badge premium), `PriceDisplay` (prix dynamique), `RenduIA` (image IA ou fallback), CTA Shopify, badge "Rendu IA" / "Photo originale", skeleton chargement, lien "Changer de modèle"
**Uses :** `calculatePrice()` / `formatPrice()` depuis `utils.ts`, `next/image` pour swatches et visuels, CSS Modules
**Avoids :** Pitfall 3 (filtre `fabric.is_active`), Pitfall 5 (utiliser `calculatePrice`, jamais inline), Pitfall 6 (scroll iOS), Pitfall 7 (swatches 44px minimum tap target), Pitfall 8 (fallback si aucun visual), Pitfall `calculatePrice` inline

### Phase 3 : Galerie angles et polish (CONF-02)
**Rationale :** La navigation par angles dépend du tissu sélectionné (les angles disponibles varient selon le tissu). Ne peut être implémentée qu'après Phase 2. Augmente la valeur de visualisation mais n'est pas bloquante pour valider le configurateur.
**Delivers :** `AngleSelector` (thumbnails 72x54px, uniquement les angles disponibles pour le tissu actif), encart zoom texture (swatch_url en 100-120px), dimensions modèle si non-null, bandeau sticky mobile (si temps disponible)
**Uses :** `useState` pour angle actif, `next/image`, CSS `aspect-ratio: 4/3` fixe sur le wrapper
**Avoids :** Pitfall 4 (CLS aspect-ratio fixe + `key={url}` sur Image), Pitfall 6 (scroll mobile avec contenu enrichi)

### Phase Ordering Rationale

- Phase 1 avant tout : sans données correctement câblées, aucun composant ne peut être testé avec les vraies données
- Phase 2 livre le MVP complet (swatches + prix + CTA) — validable par l'utilisateur avant d'ajouter les angles
- Phase 3 enrichit l'expérience mais n'est pas bloquante pour M010 (Simulation) — peut être livrée en M009 tardif ou M009.x
- L'ordre build feuilles → conteneurs est obligatoire : `PriceDisplay` et `FabricSelector` avant `ConfiguratorModal`
- Zustand n'est pas introduit en M009 — migration documentée pour M010 quand le tissu sélectionné doit être lu depuis la section Simulation (distante dans le DOM)

### Research Flags

Phases avec patterns bien documentés, pas de `/gsd:research-phase` supplémentaire nécessaire :

- **Phase 1 :** Pattern `Promise.all` dans `CatalogueSection` déjà établi dans le projet. Query Supabase directe depuis Server Component = anti-pattern Route Handler documenté Next.js. Code complet fourni dans ARCHITECTURE.md.
- **Phase 2 :** `calculatePrice()` existe, `next/image` est configuré, CSS Modules = convention projet. Tous les patterns sont vérifiés dans le code source. Code complet fourni dans STACK.md et ARCHITECTURE.md.
- **Phase 3 :** `aspect-ratio` CSS + `key` prop React = solutions standard MDN. Thumbnails avec `useState` = pattern établi en Phase 2.

Aucune phase ne nécessite de recherche supplémentaire. La recherche est complète et les patterns sont tous vérifiés dans le code source du projet.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Toutes les dépendances vérifiées dans `package.json`. Aucune nouvelle dépendance. peerDeps des alternatives vérifiés (`react-zoom-pan-pinch` exclu pour React 19 incompatibilité). |
| Features | HIGH | Wireframe v4 comme autorité absolue. API existante vérifiée dans le code source. Analyse concurrentielle IKEA / Roche Bobois / Ligne Roset. WCAG 2.1 AA pour swatches. |
| Architecture | HIGH | Code source analysé directement (CatalogueSection, CatalogueClient, ConfiguratorModal, route API visuals). Patterns établis dans le projet. Next.js docs anti-pattern Route Handler depuis Server Component. |
| Pitfalls | HIGH | 10 pitfalls identifiés à partir du code existant. Chaque pitfall a un "warning sign" et un "how to avoid" avec code. Patterns issus de la route existante `/api/models/[slug]/visuals/route.ts`. |

**Overall confidence : HIGH**

### Gaps to Address

- **Bandeau sticky mobile :** Non spécifié précisément dans le wireframe v4 pour M009. La décision d'inclure ou non dans M009 est à prendre à l'implémentation selon le temps disponible. Pas d'impact sur les phases 1-2-3 core.
- **Volume données en production :** La recherche suppose ~6 tissus et ~30 visuels (justification du co-fetch server-side). Si le catalogue dépasse 20 modèles avec 15+ tissus, migrer vers fetch client-side à l'ouverture du modal. Seuil et migration documentés dans ARCHITECTURE.md section "Scaling Considerations".
- **`model.dimensions` field :** Mentionné comme feature optionnelle (nullable). Présence dans le schéma Supabase à vérifier en début de Phase 3 avant implémentation.

---

## Sources

### Primary (HIGH confidence)
- `src/components/public/Catalogue/CatalogueSection.tsx` — architecture Server Component existante, pattern fetch
- `src/components/public/Catalogue/CatalogueClient.tsx` — pattern forwarding props
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — modal Phase 6, position hooks, scroll lock iOS
- `src/app/api/models/[slug]/visuals/route.ts` — pattern fetch + filtre `fabric.is_active` côté JS
- `src/types/database.ts` — types `Fabric`, `GeneratedVisual`, `ModelWithImages` vérifiés
- `src/lib/utils.ts` — `calculatePrice()` et `formatPrice()` vérifiées
- `package.json` — versions installées vérifiées directement
- `.planning/maquette/wireframe-page-unique.md` — autorité layout section 5 configurateur
- CLAUDE.md — prix premium = prix de base + 80 EUR fixe

### Secondary (MEDIUM confidence)
- [Next.js — Do not call Route Handlers from Server Components](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#good-to-know) — anti-pattern API route depuis Server Component
- [react-medium-image-zoom GitHub peerDeps](https://github.com/rpearce/react-medium-image-zoom/blob/main/package.json) — `^16.8 || ^17 || ^18 || ^19` confirmé React 19 compatible
- [npmpeer.dev — react-zoom-pan-pinch](https://www.npmpeer.dev/packages/react-zoom-pan-pinch/compatibility) — peerDeps `^17 || ^18` seulement, React 19 non supporté
- Cylindo — Best practices furniture configurator UX
- Baymard — Mobile swatch UX (57% des sites manquent les swatches mobiles)
- Analyse concurrentielle IKEA / Roche Bobois / Ligne Roset / France Canapé

### Tertiary (LOW confidence)
- Smashing Magazine — Configurator UX patterns (preset, real-time feedback, price display)

---
*Research completed: 2026-03-29*
*Ready for roadmap: yes*
