# Phase 1 : Fondation + Header — Recherche

**Researched:** 2026-03-26
**Domain:** Next.js 16.2.1 App Router — Client Component scroll, CSS Modules, accessibilité skip link, SEO metadata
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOND-01 | Page publique remplace le template Next.js par défaut | Remplacement complet page.tsx + page.module.css (template confirmé pollué — dark mode, variables conflictuelles, font-geist-sans) |
| FOND-02 | Metadata publique (titre, description pour SEO) | Pattern `export const metadata` dans page.tsx — hérite layout.tsx mais peut override. layout.tsx actuel contient "Back-office" — DOIT être mis à jour |
| FOND-03 | Responsive 4 breakpoints (mobile/tablet/desktop/large) | Media queries CSS Modules dans globals.css html block + chaque module composant. Breakpoints 640/1024/1280px confirmés dans wireframe |
| FOND-04 | scroll-padding-top et scroll-behavior smooth dans globals.css | 2 propriétés à ajouter au bloc `html {}` existant. Variables déjà disponibles : `--header-height: 64px` |
| HEAD-01 | Header sticky fixed avec logo MU et lien retour Shopify | `position: fixed`, `z-index: 100`, `height: var(--header-height)`. Logo div 40x40px fond `--color-primary`. Lien externe Shopify |
| HEAD-02 | Transition transparent -> blanc au scroll (seuil 80px, 300ms) | `useState(false)` + `useEffect` scroll listener avec `{ passive: true }` + classe CSS conditionnelle. `--transition-fast: 300ms ease` déjà défini |
| HEAD-03 | Effet glassmorphism sur le header au scroll (backdrop-blur 20px) | `-webkit-backdrop-filter: blur(20px)` + `backdrop-filter: blur(20px)` dans `.scrolled`. Background `rgba(252,249,245,0.8)` |
| HEAD-04 | Skip link accessibilité "Aller au contenu" (visible au focus) | Lien avant `<header>`, CSS visually-hidden + visible on `:focus`. `href="#main-content"`. `<main id="main-content">` dans page.tsx |
</phase_requirements>

---

## Résumé

Phase 1 établit la fondation CSS et le premier composant interactif de la SPA publique. Elle touche 4 fichiers existants (globals.css, layout.tsx, page.tsx, page.module.css) et crée 2 nouveaux fichiers (Header.tsx + Header.module.css).

La partie la plus délicate est le Header `'use client'` avec scroll detection : le SSR de Next.js rend d'abord le HTML serveur (scrolled = false), puis React hydrate côté client. Si l'utilisateur recharge la page en milieu de scroll, le header sera brièvement dans le mauvais état. Le pattern `mounted` résout ce flash mais ajoute un cycle de rendu. Pour ce projet (transition de couleur subtilement visible), le risque de flash est faible — l'initialisation à `false` est acceptable sans `mounted`.

Aucune nouvelle dépendance npm. Tout est faisable avec Next.js 16.2.1, React 19, CSS Modules et l'API browser native `window.scrollY`.

**Recommandation principale :** Header en Client Component isolé avec `useState(false)` + scroll listener passif. Comparer la valeur avant `setState` pour éviter les re-renders inutiles (état binaire). `page.tsx` reste Server Component.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact sur cette phase |
|-----------|----------------------|
| PAS de Tailwind, PAS de shadcn/ui — CSS Modules uniquement | Toutes les classes dans `.module.css` dédiés, aucune classe utilitaire |
| Un fichier `.module.css` par composant | `Header.module.css` séparé, nouveau `page.module.css` propre |
| Design tokens dans `src/app/globals.css` | Ne pas hardcoder de couleurs/espacements dans les modules |
| Composants en PascalCase, un fichier par composant | `Header.tsx` dans `src/components/public/Header/` |
| Messages d'erreur en français | N/A (pas d'erreurs utilisateur dans cette phase) |
| TypeScript strict (aucun `any`) | Typer l'état scroll : `useState<boolean>(false)` |
| Supabase client direct | N/A (phase sans API) |

---

## Standard Stack

### Core

| Librairie | Version | Usage | Pourquoi standard |
|-----------|---------|-------|-------------------|
| Next.js | 16.2.1 | App Router, métadonnées, `next/image` | Déjà installé — convention projet |
| React | 19.2.4 | `useState`, `useEffect`, hooks | Déjà installé |
| CSS Modules | Natif Next.js | Isolation des styles par composant | Convention stricte projet |

### APIs browser utilisées

| API | Usage | Support |
|-----|-------|---------|
| `window.scrollY` | Détecter le scroll > 80px | Universel |
| `addEventListener('scroll', handler, { passive: true })` | Listener non-bloquant | Chrome 51+, Firefox 49+, Safari 10+ |
| `removeEventListener` | Cleanup dans `useEffect` return | Universel |

### Aucune dépendance à ajouter

```bash
# RIEN à installer — tout est disponible dans le projet
```

---

## Architecture Patterns

### Structure de fichiers cible après Phase 1

```
src/
  app/
    globals.css                          # MODIFIÉ : +scroll-behavior, +scroll-padding-top
    layout.tsx                           # MODIFIÉ : metadata template public vs admin
    page.tsx                             # REMPLACÉ : template Next.js → page publique squelette
    page.module.css                      # REMPLACÉ : template pollué → propre et minimal
  components/
    admin/                               # INCHANGÉ
    public/                              # NOUVEAU dossier
      Header/
        Header.tsx                       # NOUVEAU : 'use client', scroll listener
        Header.module.css                # NOUVEAU : fixed, transition, glassmorphism
```

### Pattern 1 : Header Client Component avec scroll state

**Ce que c'est :** Composant `'use client'` isolé qui écoute le scroll et bascule une classe CSS.

**Quand l'utiliser :** Toute interaction avec `window`, `document`, ou des événements browser dans Next.js App Router.

**Code de référence :**
```typescript
// src/components/public/Header/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './Header.module.css'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 80
      // Comparaison avant setState — évite re-renders si état inchangé
      setScrolled(prev => prev !== isScrolled ? isScrolled : prev)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <a href="#main-content" className={styles.skipLink}>
        Aller au contenu
      </a>
      <header
        className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
        role="banner"
      >
        {/* Logo + lien retour Shopify */}
      </header>
    </>
  )
}
```

**Pourquoi `useState(false)` et non `useState(window.scrollY > 80)` :** `window` n'existe pas côté serveur. L'initialisation à `false` est la seule valeur sûre pour le SSR — voir Pitfall 1.

### Pattern 2 : Metadata dans page.tsx (pas layout.tsx)

**Ce que c'est :** Export `metadata` au niveau de `page.tsx` pour la page publique, sans toucher `layout.tsx`.

**Quand l'utiliser :** Chaque page qui a besoin de son propre titre/description SEO.

```typescript
// src/app/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Möbel Unique — Canapés personnalisables Paris',
  description: 'Visualisez votre canapé personnalisé dans le tissu de votre choix grâce à notre configurateur IA. Livraison Paris et Île-de-France.',
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content">
        {/* sections Phase 2+ */}
      </main>
    </>
  )
}
```

**Note sur layout.tsx :** Le metadata actuel de `layout.tsx` dit "Back-office". Deux options :
- Option A (recommandée) : Mettre à jour le `default` dans layout.tsx avec les métadonnées publiques, et chaque page admin override avec ses propres métadonnées. Plus propre.
- Option B : Garder layout.tsx inchangé, laisser page.tsx override. Fonctionne mais layout.tsx restera avec un titre trompeur.

**Option A — pattern title.template dans layout.tsx :**
```typescript
export const metadata: Metadata = {
  title: {
    template: '%s | Möbel Unique',
    default: 'Möbel Unique — Canapés personnalisables Paris',
  },
  description: 'Configurateur IA de canapés personnalisables.',
}
```
Avec ce pattern, `page.tsx` peut exporter juste `title: "Accueil"` et obtenir "Accueil | Möbel Unique".

### Pattern 3 : Skip link accessibilité

**Ce que c'est :** Lien "Aller au contenu" visible uniquement au focus clavier, permettant de bypasser le header (WCAG 2.4.1).

```typescript
// Dans Header.tsx — avant le <header>
<a href="#main-content" className={styles.skipLink}>
  Aller au contenu
</a>
```

```css
/* Header.module.css */
.skipLink {
  position: absolute;
  top: -100%;
  left: var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-text);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-weight: 600;
  z-index: 200;
  /* visible uniquement au focus */
  transition: top 0.2s ease;
}

.skipLink:focus {
  top: var(--spacing-md);
}
```

La cible `<main id="main-content">` est dans `page.tsx`.

### Pattern 4 : CSS glassmorphism avec compatibilité Safari

**Ce que c'est :** Effet de transparence floutée sur le header scrollé.

```css
/* Header.module.css */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height); /* 64px */
  z-index: 100;
  background: transparent;
  color: var(--color-background);
  transition:
    background var(--transition-fast),
    box-shadow var(--transition-fast),
    color var(--transition-fast);
}

.scrolled {
  background: rgba(252, 249, 245, 0.92);
  -webkit-backdrop-filter: blur(20px); /* Safari < 17, iOS */
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-header);
  color: var(--color-text);
}
```

**Attention texture du glassmorphism :** `rgba(252, 249, 245, 0.92)` = `--surface` (#FCF9F5) avec opacity. Une valeur inférieure à 0.85 rend le texte derrière trop visible et nuit à la lisibilité.

### Anti-patterns à éviter

- **`'use client'` sur page.tsx** : Désactive SSR pour toute la page. Header doit porter seul la directive.
- **Styles inline pour la transition** : `style={{ background: scrolled ? '#fff' : 'transparent' }}` — pas de GPU acceleration, recalcul à chaque render.
- **Header dans layout.tsx** : Exposerait le header public sur `/admin/*`.
- **`window.scrollY` dans l'initialisation du state** : `ReferenceError: window is not defined` côté serveur.
- **`preload` et `priority` ensemble** : Next.js 16.2.1 lance une erreur (vérifié dans `get-img-props.js`).

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser plutôt | Pourquoi |
|----------|-------------------|-----------------|----------|
| Transition CSS | Système de transition JS custom | CSS transition + classe conditionnelle | GPU-acceleré, 0 JavaScript supplémentaire |
| Font loading | Imports Google Fonts manuel | `next/font/google` (déjà configuré) | Optimisation automatique, pas de flash FOUT |
| Scroll throttle complexe | rAF + ticking pattern | Comparaison de valeur avant setState | Cas binaire (true/false), la comparaison suffit |
| Metadata SEO | `<head>` manuel avec `<title>` | `export const metadata` Next.js | Gestion automatique deduplication, Open Graph |

---

## Common Pitfalls

### Pitfall 1 : `window is not defined` au SSR
**Ce qui se passe :** `useState(window.scrollY > 80)` crash au build — `window` n'existe pas côté serveur.
**Pourquoi :** Même avec `'use client'`, Next.js fait une passe SSR pour générer le HTML initial.
**Comment éviter :** Toujours initialiser à `false`. Accéder à `window` uniquement dans `useEffect`.
**Signes d'alerte :** `ReferenceError: window is not defined` au `npm run build`.

### Pitfall 2 : Hydration mismatch au rechargement milieu de page
**Ce qui se passe :** HTML serveur a header transparent, mais si rechargement > 80px, React détecte discordance.
**Pourquoi :** Le serveur ne connaît pas la position de scroll du client.
**Comment éviter :** Pour ce projet, `useState(false)` + `useEffect` est suffisant. Le flash est de ~50ms, imperceptible. Si visible en production, ajouter le pattern `mounted` : initialiser classes CSS uniquement après `useEffect(() => setMounted(true), [])`.
**Signes d'alerte :** Warning React "Hydration failed because the initial UI does not match" en console.

### Pitfall 3 : Fuite mémoire — listener sans cleanup
**Ce qui se passe :** Le scroll listener continue après démontage du composant.
**Pourquoi :** Sans `return () => removeEventListener(...)` dans `useEffect`, le listener vit dans `window` indéfiniment.
**Comment éviter :** Toujours retourner une fonction de cleanup. Passer la même référence de fonction à `add` et `remove`.
**Signes d'alerte :** Warning "Can't perform a React state update on an unmounted component".

### Pitfall 4 : page.module.css template pollué
**Ce qui se passe :** Le `page.module.css` existant définit `--background`, `--foreground` (shadow des tokens globals), un block `@media (prefers-color-scheme: dark)`, et référence `--font-geist-sans` non chargée.
**Pourquoi :** C'est le template généré par `create-next-app`, jamais nettoyé.
**Comment éviter :** Supprimer entièrement et recréer un `page.module.css` minimal.
**Signes d'alerte :** Fond noir en dark mode système, ou texte blanc sur fond blanc.

### Pitfall 5 : Titre "Back-office" hérité sur la page publique
**Ce qui se passe :** layout.tsx a `title: "Möbel Unique — Back-office"` — la page publique hérite ce titre si elle ne définit pas le sien.
**Pourquoi :** Le metadata de `layout.tsx` est le fallback pour toutes les routes sans metadata propre.
**Comment éviter :** Exporter `metadata` depuis `page.tsx` ET mettre à jour le default dans `layout.tsx`.
**Signes d'alerte :** Onglet navigateur affiche "Back-office" sur `/`.

### Pitfall 6 : `backdrop-filter` sans préfixe `-webkit-`
**Ce qui se passe :** L'effet glassmorphism n'apparaît pas sur Safari iOS (Chrome OS X < 17).
**Pourquoi :** Safari < 17 nécessite le préfixe vendor.
**Comment éviter :** Toujours écrire les deux lignes : `-webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);`.
**Signes d'alerte :** Header opaque sur iPhone/Mac Safari sans l'effet de flou.

### Pitfall 7 : Scroll listener sans `{ passive: true }`
**Ce qui se passe :** Le navigateur attend que le handler JS termine avant de laisser défiler — lag perceptible sur mobile.
**Pourquoi :** Sans `passive`, le browser attend un potentiel `preventDefault()`.
**Comment éviter :** `window.addEventListener('scroll', handler, { passive: true })`.
**Signes d'alerte :** Chrome DevTools > Performance affiche "Added non-passive event listener to a scroll-blocking event".

### Pitfall 8 : Ancres masquées par le header fixe
**Ce qui se passe :** Le CTA du hero cible `#comment-ca-marche` mais le titre de la section se retrouve derrière le header de 64px.
**Pourquoi :** Le scroll natif ne tient pas compte d'un header fixe.
**Comment éviter :** `scroll-padding-top: var(--header-height)` sur `html` dans globals.css.
**Signes d'alerte :** Titre de section coupé derrière le header après clic sur une ancre.

---

## Code Examples

### globals.css — Ajouts Phase 1

```css
/* À ajouter dans le bloc html {} existant */
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  scroll-behavior: smooth;                       /* AJOUT Phase 1 */
  scroll-padding-top: var(--header-height);      /* AJOUT Phase 1 — 64px */
}
```

Note : le bloc `html {}` existe déjà dans globals.css avec `-webkit-font-smoothing`. Il faut y ajouter les 2 propriétés, pas créer un nouveau bloc.

### Header.module.css — Structure complète

```css
/* Lien skip accessibilité */
.skipLink {
  position: absolute;
  top: -100%;
  left: var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-text);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--font-size-sm);
  z-index: 200;
  text-decoration: none;
  transition: top 0.2s ease;
}

.skipLink:focus {
  top: var(--spacing-md);
}

/* Header principal */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height); /* 64px */
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--container-padding-mobile);
  background: transparent;
  color: var(--color-background); /* texte blanc sur hero */
  transition:
    background var(--transition-fast),
    box-shadow var(--transition-fast),
    color var(--transition-fast);
}

.scrolled {
  background: rgba(252, 249, 245, 0.92);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-header);
  color: var(--color-text); /* texte sombre après scroll */
}

/* Logo monogramme MU */
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-primary);
  color: var(--color-text);
  font-weight: 700;
  font-size: var(--font-size-sm);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: inherit;
}

.brandName {
  font-weight: 600;
  font-size: var(--font-size-lg);
  letter-spacing: -0.01em;
}

/* Lien retour Shopify */
.shopifyLink {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: inherit;
  text-decoration: none;
  opacity: 0.85;
  transition: opacity var(--transition-fast);
}

.shopifyLink:hover {
  opacity: 1;
}

/* Responsive */
@media (min-width: 1024px) {
  .header {
    padding: 0 var(--container-padding-desktop);
  }
}

@media (min-width: 1280px) {
  .header {
    padding: 0 var(--container-padding-large);
  }
}
```

### layout.tsx — Metadata mise à jour (Option A recommandée)

```typescript
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Möbel Unique',
    default: 'Möbel Unique — Canapés personnalisables Paris',
  },
  description: 'Configurateur IA de canapés personnalisables. Visualisez votre canapé dans le tissu de votre choix.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### page.tsx — Squelette Phase 1

```typescript
// src/app/page.tsx
import type { Metadata } from 'next'
import { Header } from '@/components/public/Header/Header'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Visualisez votre canapé personnalisé avec notre configurateur IA. Choisissez votre tissu et simulez le rendu dans votre salon.',
}

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Header />
      <main id="main-content" className={styles.main}>
        {/* Phase 2 : <Hero /> */}
        {/* Phase 3 : <HowItWorks /> */}
      </main>
    </div>
  )
}
```

Avec le `title.template` de layout.tsx, ceci affichera "Accueil | Möbel Unique".

---

## State of the Art

| Ancienne approche | Approche actuelle | Changé | Impact |
|-------------------|-------------------|--------|--------|
| `priority` seul pour images LCP | `priority` OU `preload` (pas les deux) | Next.js 16+ | `preload` est le nouveau nom — `priority` fonctionne encore mais ne peut pas coexister avec `preload` |
| `100vh` pour sections plein écran | `100svh` avec fallback | CSS 2022 | Corrige le bug barre d'adresse mobile iOS/Chrome — s'applique au Hero (Phase 2) |
| `window.scroll` + throttle manuel | `window.scroll` avec comparaison avant setState | React 19 | Suffisant pour état binaire — moins verbeux que rAF |
| Export default pour composants | Export nommé (convention projet) | Établi | Cohérence avec composants admin existants |

**Deprecated/obsolète :**
- `window.scroll` avec `requestAnimationFrame` ticking : sur-ingénierie pour un état binaire. La comparaison avant setState suffit.
- Pattern `typeof window !== 'undefined'` pour guard état initial : provoque hydration mismatch, ne pas utiliser.

---

## Open Questions

1. **URL du lien retour Shopify**
   - Ce qu'on sait : Le header doit avoir un lien "Retour à la boutique" vers Shopify
   - Ce qui est flou : L'URL Shopify réelle n'est pas documentée dans le projet. Faut-il une variable d'environnement `NEXT_PUBLIC_SHOPIFY_URL` ?
   - Recommandation : Créer une constante dans `src/lib/constants.ts` avec `export const SHOPIFY_URL = process.env.NEXT_PUBLIC_SHOPIFY_URL ?? '#'`. Utiliser `'#'` comme fallback temporaire.

2. **Comportement du texte du header sur fond transparent**
   - Ce qu'on sait : Sur le hero (fond sombre avec image), le texte doit être blanc. Après scroll, il doit être sombre.
   - Ce qui est flou : Si Phase 2 n'est pas encore implémentée, le hero sera vide et le fond de page sera blanc — le header transparent avec texte blanc sera invisible.
   - Recommandation : Pour Phase 1, appliquer temporairement `color: var(--color-text)` par défaut (texte sombre) et ignorer l'état "blanc sur fond d'image" jusqu'à Phase 2.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 1 est une phase code/CSS pure sans dépendances externes. Node.js 22.22.1 disponible, Next.js 16.2.1 installé, aucun outil CLI additionnel requis.

---

## Validation Architecture

> `workflow.nyquist_validation` absent de config.json — section incluse.

### Test Framework

| Propriété | Valeur |
|-----------|--------|
| Framework | Aucun framework de test configuré dans le projet |
| Config file | Aucun (pas de jest.config.*, vitest.config.*, pytest.ini) |
| Quick run command | `npx tsc --noEmit` (vérification types) |
| Full suite command | `npx tsx scripts/audit-full.ts` (44 checks) + `npm run build` |

### Phase Requirements → Test Map

| Req ID | Comportement | Type de test | Commande automatisée | Fichier existe ? |
|--------|--------------|--------------|---------------------|-----------------|
| FOND-01 | page.tsx ne contient plus le template Next.js | Build smoke | `npm run build` | ✅ (build vérifie l'absence d'erreurs) |
| FOND-02 | Onglet navigateur affiche le bon titre SEO | Manuel | Vérification navigateur | N/A |
| FOND-03 | Responsive 4 breakpoints actifs | Manuel | DevTools responsive mode | N/A |
| FOND-04 | scroll-padding-top actif dans globals.css | Manuel | Clic sur ancre + vérifier offset | N/A |
| HEAD-01 | Header visible, fixe, logo MU + lien Shopify | Manuel | Navigation visuelle | N/A |
| HEAD-02 | Transition transparent→blanc au scroll 80px | Manuel | Scroll lent > 80px | N/A |
| HEAD-03 | Glassmorphism actif sur Safari + Chrome | Manuel (cross-browser) | Test sur Safari iOS | N/A |
| HEAD-04 | Skip link visible au focus Tab | Manuel (accessibilité) | Tab key sur la page | N/A |

### Type check continu

```bash
npx tsc --noEmit   # Après chaque fichier TypeScript modifié
npm run build      # Validation finale de phase
```

### Wave 0 Gaps

Aucun framework de test automatisé n'est configuré et les requirements de Phase 1 sont tous vérifiables visuellement ou par build. Le gap principal est :

- [ ] Validation TypeScript automatique : `npx tsc --noEmit` après chaque composant
- [ ] Build smoke : `npm run build` avant de déclarer la phase terminée

*(Pas de test unitaire à créer — pas d'interactions testables automatiquement dans cette phase)*

---

## Sources

### Primaires (HIGH confidence)

- Code source analysé directement : `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/admin/AdminHeader.tsx`
- `node_modules/next/dist/client/image-component.d.ts` — confirmé : `priority` et `preload` coexistent en Next.js 16.2.1 mais ne peuvent pas être utilisés ensemble
- `node_modules/next/dist/shared/lib/get-img-props.js` — confirmé : erreur lancée si `preload && priority` simultanément
- `.planning/research/PITFALLS.md` — pitfalls vérifiés cross-project
- `.planning/research/STACK.md` — stack confirmé, aucune dépendance supplémentaire
- `.planning/research/ARCHITECTURE.md` — architecture patterns confirmés

### Secondaires (MEDIUM confidence)

- `.planning/maquette/wireframe-page-unique.md` — spécifications Header (seuil 80px, z-index 100, transition 0.3s, texte blanc→sombre)
- `.planning/REQUIREMENTS.md` — requirements FOND-01 à HEAD-04 avec critères de succès
- `.planning/ROADMAP.md` — Phase 1 = fondation CSS + Header uniquement

### Points vérifiés vs hypothèses

| Affirmation | Statut | Source |
|-------------|--------|--------|
| `priority` est deprecated en Next.js 16 | **FAUX** — `priority` fonctionne, mais `priority + preload` ensemble throw une erreur | `get-img-props.js` inspecté |
| CSS Modules support `@keyframes` natif | **VRAI** | Comportement Next.js 16 standard |
| `--header-height: 64px` déjà défini | **VRAI** | `globals.css` ligne 78 |
| `--transition-fast: 300ms ease` déjà défini | **VRAI** | `globals.css` ligne 81 |
| `--shadow-header` déjà défini | **VRAI** | `globals.css` ligne 70 |
| layout.tsx a le titre "Back-office" | **VRAI** | `layout.tsx` ligne 12 |
| `page.module.css` contient dark mode media query | **VRAI** | `page.module.css` inspecté |

---

## Metadata

**Confidence breakdown :**
- Standard stack : HIGH — code source inspecté directement, aucune incertitude
- Architecture : HIGH — patterns confirmés dans le code existant (AdminHeader, layout)
- Pitfalls : HIGH — vérifiés dans le code source et la recherche projet préexistante
- Metadata Next.js : HIGH — type definitions inspectées dans node_modules

**Research date :** 2026-03-26
**Valid until :** 2026-06-26 (stack stable, Next.js 16 LTS)
