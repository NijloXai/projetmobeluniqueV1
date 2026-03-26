# Architecture Patterns — M007 Frontend Public (Header + Hero + HowItWorks)

**Domain:** SPA publique Next.js 16 App Router, sections statiques
**Researched:** 2026-03-26
**Confidence:** HIGH (vérification directe du code existant + docs officielles Next.js)

---

## Contexte : ce qui existe déjà

```
src/
  app/
    layout.tsx          ← Root layout (Montserrat, lang=fr, AUCUNE structure DOM imposée)
    globals.css         ← Tokens complets (couleurs, typo, spacing, ombres, layout)
    page.tsx            ← Template Next.js par défaut — A REMPLACER ENTIEREMENT
    page.module.css     ← CSS template Next.js — A REMPLACER ENTIEREMENT
    admin/              ← Routes admin isolées, ne pas toucher
  components/
    admin/              ← 5 composants admin — ne pas toucher
    (vide côté public)  ← Aucun composant public n'existe encore
  proxy.ts              ← Middleware Supabase (matche toutes les routes sauf fichiers statiques)
```

Le `layout.tsx` racine est intentionnellement minimal : pas de wrapper DOM, pas de header global. C'est le bon point de départ — la page publique construit sa propre structure.

---

## Architecture recommandée pour M007

### Arborescence cible après M007

```
src/
  app/
    page.tsx                        ← REMPLACÉ : orchestre les sections (Server Component)
    page.module.css                 ← REMPLACÉ : styles de la page racine uniquement
  components/
    admin/                          ← inchangé
    public/                         ← NOUVEAU : tous les composants publics ici
      Header/
        Header.tsx                  ← NOUVEAU ('use client' — scroll state)
        Header.module.css           ← NOUVEAU
      Hero/
        Hero.tsx                    ← NOUVEAU (Server Component)
        Hero.module.css             ← NOUVEAU
      HowItWorks/
        HowItWorks.tsx              ← NOUVEAU (Server Component)
        HowItWorks.module.css       ← NOUVEAU
```

**Rationale du dossier `components/public/`** : miroir exact de `components/admin/`. Cohérence avec la convention établie : les composants partagés réutilisables vont dans `src/components/<namespace>/`. Les composants colocalisés dans `app/` servent les routes admin (ex: `ModelList.tsx` dans `produits/`). Les composants de sections de la page d'accueil ne sont pas des routes, ils sont des blocs réutilisables — ils appartiennent dans `components/public/`.

### Structure des sous-dossiers par composant

Chaque composant public suit le même pattern que les composants admin existants :

```
ComponentName/
  ComponentName.tsx         ← Logique + JSX
  ComponentName.module.css  ← Styles isolés
```

Un fichier CSS Module par composant, un composant par fichier. Convention stricte déjà établie dans le projet.

---

## Décisions Server Component vs Client Component

### Règle de décision

| Besoin | Directive | Raison |
|--------|-----------|--------|
| Scroll state (header transparent → blanc) | `'use client'` | Écoute `window.scrollY`, `useEffect`, `useState` |
| Hero statique (badge, H1, CTA) | Server Component (défaut) | Aucun état, aucune interactivité |
| HowItWorks statique (3 étapes) | Server Component (défaut) | Aucun état, aucune interactivité |
| page.tsx orchestrateur | Server Component (défaut) | Composition uniquement |

### Header : le seul Client Component de M007

Le Header doit détecter le scroll pour sa transition transparent → blanc. C'est le seul composant qui nécessite `'use client'` dans M007.

Pattern établi (confirmé par LogRocket, Skillthrive, Next.js App Router docs) :

```typescript
// src/components/public/Header/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import styles from './Header.module.css'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      {/* ... */}
    </header>
  )
}
```

CSS correspondant :

```css
/* Header.module.css */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--header-height);  /* 64px défini dans globals.css */
  background: transparent;
  transition: background var(--transition-smooth),
              box-shadow var(--transition-smooth);
}

.scrolled {
  background: var(--color-background);  /* #FFFFFF */
  box-shadow: var(--shadow-header);
}
```

**Pourquoi `position: fixed` et non `position: sticky` ?** Le Hero est plein écran (100vh). Un header `sticky` disparaîtrait dans le flux du document et ne resterait pas visible au-dessus du Hero. `fixed` est correct pour un header qui doit rester en overlay sur le Hero puis devenir opaque au scroll.

**Optimisation scroll** : `{ passive: true }` dans `addEventListener` est obligatoire pour les événements scroll — évite de bloquer le thread principal.

### Hero et HowItWorks : Server Components purs

```typescript
// src/components/public/Hero/Hero.tsx
// PAS de 'use client' — Server Component par défaut

import styles from './Hero.module.css'

export function Hero() {
  return (
    <section className={styles.hero}>
      {/* badge IA, H1, sous-titre, CTA */}
    </section>
  )
}
```

Avantage : rendu HTML immédiat, pas de JavaScript client, pas d'hydratation.

### page.tsx orchestrateur

```typescript
// src/app/page.tsx
// Server Component — composition des sections

import { Header } from '@/components/public/Header/Header'
import { Hero } from '@/components/public/Hero/Hero'
import { HowItWorks } from '@/components/public/HowItWorks/HowItWorks'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
      </main>
    </>
  )
}
```

Un Server Component peut importer et composer des Client Components. La frontière `'use client'` est localisée au Header uniquement — Hero et HowItWorks restent en dehors du bundle client.

---

## Intégration avec layout.tsx racine

`layout.tsx` est **inchangé**. Il ne reçoit pas le Header car :
1. L'admin a son propre `AdminHeader` dans son layout
2. Les routes `/admin/*` ne doivent pas afficher le header public
3. Le root layout ne contient que `<html>`, `<body>` et l'import de fonts — c'est voulu

La metadata sera mise à jour dans `page.tsx` via `export const metadata` pour la page publique, sans toucher `layout.tsx` :

```typescript
// src/app/page.tsx
export const metadata = {
  title: "Möbel Unique — Canapés personnalisables Paris",
  description: "Visualisez votre canapé dans le tissu de votre choix grâce à l'IA.",
}
```

---

## Scroll behavior avec App Router

### scroll-padding-top

Le Header fixe (64px) masquera le début des sections si des liens d'ancrage sont utilisés. Ajouter dans `globals.css` :

```css
html {
  scroll-padding-top: var(--header-height);  /* 64px */
}
```

La variable `--header-height: 64px` est déjà définie dans `globals.css`.

### scroll-behavior

Pour les CTAs "Voir comment ça marche" qui font défiler vers la section :

```css
html {
  scroll-behavior: smooth;
}
```

À ajouter dans `globals.css`. Pas de JavaScript nécessaire pour le défilement ancré.

### Pas de useScrollTo ni de router.push

M007 est une page unique sans navigation inter-pages. Le scroll est purement CSS (`scroll-behavior: smooth` + ancres `href="#how-it-works"`). Pas besoin de `useRouter` côté public pour M007.

---

## Flux de données pour M007

M007 est entièrement **statique** — aucun appel API, aucune donnée Supabase.

```
page.tsx (Server)
  └── Header (Client — scroll state local uniquement)
  └── Hero (Server — HTML statique)
  └── HowItWorks (Server — HTML statique)
```

Les futures sections (M008 catalogue, M009 configurateur) ajouteront des appels API dans leurs propres Server Components. La page.tsx restera le point d'orchestration.

---

## Patterns à suivre

### Pattern 1 : Export nommé (non default)

Tous les composants admin utilisent des exports nommés (`export function AdminHeader`). Appliquer la même convention aux composants publics.

```typescript
// BON
export function Hero() { ... }

// A EVITER (incohérent avec le reste du projet)
export default function Hero() { ... }
```

L'exception est `page.tsx` et `layout.tsx` qui nécessitent des exports default imposés par Next.js.

### Pattern 2 : Import absolu via @/

```typescript
import { Hero } from '@/components/public/Hero/Hero'
import { Header } from '@/components/public/Header/Header'
```

Cohérent avec les imports existants dans le projet (`@/components/admin/AdminHeader`).

### Pattern 3 : Tokens globals.css dans tous les CSS Modules

Ne jamais redéfinir les couleurs ou espacements en dur dans un CSS Module. Utiliser exclusivement les variables CSS custom de `globals.css` :

```css
/* BON */
.hero {
  background: var(--color-background-alt);
  padding: var(--spacing-section) var(--container-padding-desktop);
}

/* MAUVAIS */
.hero {
  background: #F8F4EE;
  padding: 7rem 48px;
}
```

---

## Anti-patterns à éviter

### Anti-pattern 1 : 'use client' sur page.tsx

Mettre `'use client'` sur `page.tsx` désactive les Server Components pour toute la page. Le Header doit porter seul sa directive client.

### Anti-pattern 2 : Styles inline pour la transition du header

```tsx
// MAUVAIS — recalcul à chaque render, pas de GPU acceleration
<header style={{ background: scrolled ? '#fff' : 'transparent' }}>

// BON — CSS transition avec classe conditionnelle
<header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
```

La version CSS Module avec classe conditionnelle délègue la transition au moteur CSS (GPU accelerated).

### Anti-pattern 3 : Mettre le Header dans layout.tsx

Cela exposerait le header public sur les routes `/admin/*`. La composition dans `page.tsx` est la bonne approche.

### Anti-pattern 4 : Composants de section dans `app/`

```
// MAUVAIS — colocarisation dans app/ pour des composants non-routables
src/app/Hero.tsx
src/app/HowItWorks.tsx

// BON — dans components/public/ comme les composants admin
src/components/public/Hero/Hero.tsx
src/components/public/HowItWorks/HowItWorks.tsx
```

---

## Ordre de construction recommandé (M007)

L'ordre suit les dépendances visuelles et CSS :

1. **globals.css** — Ajouter `scroll-behavior: smooth` et `scroll-padding-top` au bloc `html`. Pas de nouveau token à créer, les tokens M007 (header-height, transitions, couleurs) sont déjà présents. [MODIFIE `globals.css`]

2. **Header** — Premier car visible en permanence, définit le `z-index` et la hauteur qui impacte le Hero. [CRÉE `components/public/Header/`]

3. **Hero** — Plein écran avec offset pour le header fixe (`padding-top: var(--header-height)` ou `min-height: 100vh`). [CRÉE `components/public/Hero/`]

4. **HowItWorks** — Section indépendante, pas de dépendance sur Hero. [CRÉE `components/public/HowItWorks/`]

5. **page.tsx** — Remplacement final : importe les 3 composants, supprime le template Next.js, met à jour la metadata. [REMPLACE `app/page.tsx` et `app/page.module.css`]

---

## Points d'intégration explicites

| Point | Fichier | Action | Type |
|-------|---------|--------|------|
| Scroll padding + smooth scroll | `src/app/globals.css` | Ajouter 2 propriétés au bloc `html {}` | Modification mineure |
| Root layout metadata | `src/app/layout.tsx` | Aucune modification nécessaire | Inchangé |
| Page d'accueil | `src/app/page.tsx` | Remplacement complet du template | Remplacement |
| CSS template Next.js | `src/app/page.module.css` | Remplacement complet | Remplacement |
| Middleware proxy | `src/proxy.ts` | Aucune modification — route `/` est publique | Inchangé |
| Composants admin | `src/components/admin/` | Aucune modification | Inchangé |

---

## Considérations responsive

Les breakpoints définis dans `globals.css` n'ont pas de media queries prédéfinies — ils sont sous forme de variables CSS (`--container-padding-mobile`, etc.). Les media queries doivent être écrites dans chaque CSS Module.

Convention à appliquer dans tous les composants M007 :

```css
/* Mobile first */
.section { padding: 0 var(--container-padding-mobile); }  /* < 640px */

@media (min-width: 640px) {
  .section { padding: 0 var(--container-padding-desktop); }
}

@media (min-width: 1280px) {
  .section { padding: 0 var(--container-padding-large); }
  .section .inner { max-width: var(--container-max); margin: 0 auto; }
}
```

Les breakpoints du projet (640px tablet, 1024px desktop, 1280px large) sont cohérents avec les variables de `globals.css`.

---

## Sources

- Code source existant analysé directement (`layout.tsx`, `globals.css`, `proxy.ts`, `AdminHeader.tsx`, `IAGenerationSection.tsx`)
- [Next.js — Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) (HIGH confidence)
- [Using React Hooks for sticky headers — LogRocket](https://blog.logrocket.com/using-react-hooks-to-create-sticky-headers/) (MEDIUM confidence)
- [Next.js App Router Project Structure — Makerkit](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure) (MEDIUM confidence)
- [Build a sticky nav with React — ibrahima-ndaw](https://www.ibrahima-ndaw.com/blog/build-a-sticky-nav-with-react/) (MEDIUM confidence)
