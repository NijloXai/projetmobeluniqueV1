# Project Research Summary

**Project:** Möbel Unique — M007 Header sticky + Hero plein ecran + Section "Comment ca marche"
**Domain:** SPA publique Next.js 16 App Router — Frontend statique luxe
**Researched:** 2026-03-26
**Confidence:** HIGH (sources officielles Next.js verifiees, code existant analyse)

## Executive Summary

M007 est la premiere milestone front public d'un projet dont le backend est entierement terminé (M001-M006, ~5350 lignes). Elle consiste a remplacer le template Next.js par défaut par 3 sections fondatrices : un header sticky avec transition transparence/blanc, un hero plein ecran, et une section "Comment ca marche" en 3 etapes. La bonne nouvelle est que **aucune dependance npm n'est requise** — la stack existante (Next.js 16.2.1, CSS Modules, React 19) couvre la totalite des besoins avec les APIs browser natives (IntersectionObserver, addEventListener scroll).

L'approche recommandee repose sur un decouplage strict entre composants Client et Server : seul le Header necessite `'use client'` pour gerer l'etat du scroll. Hero et HowItWorks restent des Server Components purs, ce qui maximise la performance SSR et minimise le bundle JS cote client. Les tokens CSS sont deja complets dans `globals.css` — aucun nouveau token n'est necessaire pour M007. Les composants publics s'organisent dans `src/components/public/` en miroir du dossier `admin/` existant.

Les risques principaux sont concentres sur le Header : acces a `window` en dehors d'un `useEffect` (crash SSR), hydration mismatch si le scroll state differe serveur/client, et fuite memoire si le listener n'est pas nettoye. Sur le Hero, la combinaison `100svh` (et non `100vh`) + container `position: relative` pour `next/image fill` sont les deux points techniques non-negoiciables. L'effort total est estime a ~7h pour les 3 sections.

---

## Key Findings

### Recommandation Stack

Aucune nouvelle dependance a installer. M007 utilise exclusivement ce qui est deja present :

**Technologies confirmes suffisantes :**
- **Next.js 16.2.1** : `next/image` avec `fill` + `loading="eager"` (remplace `priority` deprecie en Next.js 16). Server Components par defaut.
- **IntersectionObserver (API browser native)** : scroll detection pour le header et les fade-ins. 43% plus performant que `window.scroll` sur machines lentes — pas de debounce manuel.
- **CSS Modules** : `@keyframes` natif pour les 3 animations requises (bounce fleche, fade-in etapes, transition header). GPU-acceleré via `opacity` + `transform` uniquement.
- **React 19 hooks** : `useState(false)` + `useEffect` avec cleanup — pattern complet et sur.

**Technologies a ne pas ajouter :**
- Framer Motion, GSAP, react-spring : sur-ingenierie pour 3 transitions simples (+55KB inutiles).
- react-intersection-observer : wrapper superflu de l'API native.
- react-scroll, react-use : trop generiques pour des besoins tres specifiques.

### Expected Features

**Must have — table stakes non-negociables :**
- Header `position: fixed`, h=64px, z-index=100, transition transparent → blanc a 80px de scroll
- Logo a gauche, 1 CTA a droite uniquement (pas de nav complete en M007)
- `box-shadow` au scroll (`--shadow-header`)
- Hero `100svh`, image fond + overlay `rgba(0,0,0,0.55)`, H1 + sous-titre + CTA primary
- Badge "Simulation IA" visible des l'entree (`--color-secondary` #EFC806)
- Section HowItWorks : 3 etapes numerotees, grid 3 colonnes desktop / 1 colonne mobile
- Fond alterne `--color-background-alt` (#F8F4EE) sur HowItWorks
- Responsive : breakpoints 640/1024/1280px, mobile-first
- `prefers-reduced-motion` respecte sur toutes les animations
- `<header role="banner">`, skip link, `scroll-padding-top: 64px`, `scroll-behavior: smooth`

**Should have — differenciateurs a effort faible :**
- Indicateur scroll hero (fleche, animation CSS pure `scrollBounce`)
- Fade-in IntersectionObserver sur les 3 etapes avec stagger 100ms

**Defer a M011 (polish) :**
- Header hide/show au scroll sur mobile
- Glassmorphism header (`backdrop-filter: blur`) — compatibilite Safari a verifier
- Optimisation fine des animations

**Anti-features a rejeter categoriquement :**
- Carousel/slider hero, video background, parallax scroll
- Navigation complete avec plusieurs liens (pas de pages cibles en M007)
- Lazy loading sur l'image hero (elle est LCP, doit etre eager)

### Architecture Approach

M007 adopte une architecture composants stricte : `page.tsx` reste Server Component orchestrateur, `Header.tsx` est le seul `'use client'`, Hero et HowItWorks sont des Server Components purs. Cette frontiere client minimale est critique — mettre `'use client'` sur `page.tsx` ferait basculer toute la page cote client et annulerait les benefices SSR des sections statiques.

**Composants crees dans `src/components/public/` :**
1. **Header** (`'use client'`) — scroll state via `window.addEventListener`, transition CSS conditionnelle via classe
2. **Hero** (Server Component) — statique, image fond, badge IA, H1, CTA
3. **HowItWorks** (Server Component) — 3 etapes, grid responsive, fade-in optionnel

**Fichiers modifies dans l'existant :**
1. `src/app/globals.css` — 2 ajouts au bloc `html {}` : `scroll-behavior: smooth` et `scroll-padding-top: var(--header-height)`
2. `src/app/page.tsx` — remplacement complet du template Next.js
3. `src/app/page.module.css` — remplacement complet (supprimer le dark mode template)
4. `src/app/layout.tsx` — pattern `title.template` pour corriger le titre "Back-office"

### Critical Pitfalls

1. **`window is not defined` au SSR** — Toujours initialiser `useState(false)` et acceder a `window` uniquement dans `useEffect`. Ne jamais faire `useState(window.scrollY > 80)`.

2. **Hydration mismatch sur le scroll state** — Le serveur rend `scrolled=false`, le client peut avoir un scroll deja actif au rechargement. Pattern : `const [mounted, setMounted] = useState(false)` + appliquer les classes de scroll uniquement apres `mounted`.

3. **`'use client'` boundary trop haute** — Ne jamais mettre `'use client'` sur `page.tsx`. La directive reste sur `Header.tsx` uniquement. Detection : verifier avec Next.js DevTools.

4. **`100vh` sur mobile (barre d'adresse)** — Sur iOS Safari, `100vh` inclut la barre cachee, ce qui tronque le CTA hero. Utiliser `100svh` avec fallback `-webkit-fill-available`.

5. **`next/image fill` sans `position: relative`** — L'image sort du container et couvre toute la page. Container hero doit avoir `position: relative; overflow: hidden` obligatoirement.

6. **Image hero absente de `public/`** — Le dossier ne contient que les SVGs template. Creer `public/images/` et y placer l'image avant d'implementer le composant (ou utiliser le gradient CSS temporaire documente dans STACK.md).

7. **Metadata "Back-office" sur la page publique** — Corriger le `layout.tsx` avec `title.template` pour que la page publique ne herite pas du titre admin.

---

## Implications for Roadmap

M007 est une milestone courte (~7h) avec des dependances lineaires simples. L'ordre de construction suit les dependances CSS et visuelles.

### Phase 1 : Fondation globals + Header
**Rationale :** Le header est visible en permanence et definit la hauteur (64px) dont depend le Hero. Les 2 modifications globals.css doivent preceder tous les composants.
**Delivers :** Header sticky fonctionnel, scroll detection, transition transparent/blanc, responsive
**Addresses :** Table stakes header (fixed, logo, CTA, box-shadow, aria)
**Avoids :** Pitfalls 1, 2, 3, 7, 8 (SSR, hydration, passive listener, cleanup)
**Recherche supplementaire :** Non requise — pattern standard etabli.

### Phase 2 : Hero plein ecran
**Rationale :** Depend de la hauteur du Header (padding-top: 64px). Image placeholder CSS disponible si pas d'image reelle.
**Delivers :** Hero 100svh, badge IA, H1, sous-titre, CTA primary, indicateur scroll
**Addresses :** Table stakes hero + differenciateur fleche animee
**Avoids :** Pitfalls 4, 5, 6 (100svh, position:relative, image manquante)
**Recherche supplementaire :** Non requise — patterns next/image documentes.

### Phase 3 : Section HowItWorks + assemblage page.tsx
**Rationale :** Section independante, aucune dependance sur Hero. page.tsx est remplace en dernier apres que les 3 composants sont prets.
**Delivers :** 3 etapes responsive, fond alterne, fade-in optionnel, page publique complete
**Addresses :** Table stakes HowItWorks + differenciateur fade-in stagger
**Avoids :** Pitfall 9 (dark mode template page.module.css), Pitfall 12 (metadata)
**Recherche supplementaire :** Non requise — grid CSS + IntersectionObserver documentes.

### Phase Ordering Rationale

- L'ordre globals → Header → Hero → HowItWorks → page.tsx suit les dependances CSS strictes : chaque element depend du precedent.
- Les 3 sections sont purement statiques (aucune API Supabase, aucun appel reseau) — M007 est une milestone front-only sans risque d'integration backend.
- Les pitfalls critiques (SSR, hydration) sont concentres sur Phase 1 (Header) — les phases suivantes sont mecaniquement plus simples.
- Pas de refactoring architectural prevu : la structure `components/public/` est un nouveau dossier sans impact sur l'existant.

### Research Flags

**Phases avec patterns standards (pas de recherche supplementaire) :**
- **Phase 1 (Header)** : IntersectionObserver + useEffect scroll listener — pattern universel Next.js App Router, entierement documente.
- **Phase 2 (Hero)** : next/image fill + 100svh — patterns officiels Next.js 16, aucune ambiguite.
- **Phase 3 (HowItWorks)** : Grid CSS + IntersectionObserver — CSS pur, aucune librairie.

**Phases necessitant une attention particuliere lors de l'implementation :**
- **Phase 1** : Verifier le pattern `mounted` pour l'hydration mismatch — tester sur rechargement en milieu de page.
- **Phase 2** : Confirmer que `100svh` est accepte dans la charte avant de livrer (la charte dit "100vh" mais svh est le correctif 2025).

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Documentation officielle Next.js 16.2.1 verifiee (2026-03-26). Aucune dependance nouvelle = aucun risque de compatibilite. |
| Features | HIGH | Sources NN/g, Smashing Magazine, WCAG officielles. Charte graphique projet = autorite absolue. |
| Architecture | HIGH | Code source existant analyse directement. Patterns Server/Client Next.js App Router confirmes par docs officielles. |
| Pitfalls | HIGH | Combinaison docs officielles Next.js + issues GitHub verifiees + sources multiples concordantes. |

**Overall confidence:** HIGH

### Gaps to Address

- **Image hero reelle** : Aucune image canapé n'est disponible dans `public/`. Le gradient CSS temporaire est documente et fonctionnel, mais une photo client devra etre fournie avant la mise en production. Format cible : WebP 1920x1080, < 300 Ko.
- **Contenu textuel H1 et sous-titre** : Les textes exacts du hero (accroche, sous-titre) ne sont pas specifies dans la charte graphique. A valider avec le client avant implementation.
- **Texte des 3 etapes HowItWorks** : Titres et descriptions des etapes non specifies. Pattern visuel clair, contenu a confirmer.
- **Glassmorphism header** : La charte prevoit cet effet mais il est reporte a M011 — tester la compatibilite Safari iOS avant de s'engager sur la feature.

---

## Sources

### Primary (HIGH confidence)
- Docs officielles Next.js 16.2.1 — `next/image`, Server/Client Components, generateMetadata (verifiees 2026-03-26)
- CHARTE-GRAPHIQUE.md (source primaire projet) — tokens, breakpoints, hauteur header, overlay, transitions
- `globals.css`, `layout.tsx`, `proxy.ts`, `AdminHeader.tsx` (code source existant analyse directement)
- MDN — IntersectionObserver, prefers-reduced-motion, scroll-padding-top
- W3C WCAG 2.1 — animation-from-interactions (2.3.3), skip navigation (2.4.1), contrast (1.4.3)
- caniuse.com — CSS backdrop-filter, 100svh support
- GitHub vercel/next.js issue #10148 — CSS Modules order conflict

### Secondary (MEDIUM confidence)
- ITNEXT benchmark 2024 — IntersectionObserver vs window.scroll (+43% performance)
- Smashing Magazine — sticky headers UX guidelines, accessible text over images
- NN/g — sticky headers best practices
- LogRocket — React hooks sticky headers, Client vs Server Component patterns
- DEV Community — window is not defined Next.js 2025
- Medium — fix mobile 100vh bug (dvh/svh units)

### Tertiary (LOW confidence)
- imidef.com — App Router pitfalls 2026 (non verifiable independamment)
- ecosire.com — Next.js 16 production patterns (blog personnel)

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
