# Phase 02: Hero plein écran - Research

**Researched:** 2026-03-26
**Domain:** Next.js App Router — composant React client, Framer Motion (motion/react), CSS Modules, viewport units
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Fond couleur unie warm + overlay semi-transparent (pas de gradient CSS complexe, pas d'image stock). La vraie photo sera ajoutée plus tard.
- **D-02:** Intensité de l'overlay — Claude ajuste pour le meilleur contraste avec le texte blanc. (Résolu dans UI-SPEC : `rgba(0,0,0,0.55)` — token `--color-overlay`)
- **D-03:** Technique pour la future image réelle — Claude choisit entre background-image CSS ou next/image fill. (Résolu dans UI-SPEC : `background-image` CSS)
- **D-04:** H1 = "Visualisez votre canapé chez vous" (texte du wireframe validé tel quel)
- **D-05:** Sous-titre — Claude rédige. (Résolu dans UI-SPEC : "Choisissez votre tissu, configurez votre modèle et visualisez le résultat directement dans votre salon — avant même de commander.")
- **D-06:** Badge "Visualisation par IA" — pill dorée pleine (meilleure lisibilité sur fond sombre)
- **D-07:** CTA = "Découvrir nos canapés" avec href="#catalogue" (lien mort temporaire)
- **D-08:** Bouton plein avec gradient `linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))`, texte blanc
- **D-11:** Fade-in simultané global — tous les éléments apparaissent en même temps (pas de stagger)
- **D-12:** Durée du fade-in = 400ms
- **D-13:** Librairie Framer Motion pour les animations (pas CSS pur)
- **D-15:** Fade-out de l'indicateur de scroll quand l'utilisateur commence à scroller
- **D-16:** Indicateur décoratif seulement — pas de comportement au clic

### Claude's Discretion

- Intensité exacte de l'overlay (D-02) — déjà décidé dans UI-SPEC : `rgba(0,0,0,0.55)`
- Technique image future : background-image CSS vs next/image (D-03) — déjà décidé dans UI-SPEC
- Rédaction du sous-titre (D-05) — déjà rédigé dans UI-SPEC
- Style du badge IA : pill dorée vs outline (D-06) — dorée pleine confirmée dans UI-SPEC
- Taille, padding et radius du CTA (D-09) — `16px 32px` / `--radius-sm` dans UI-SPEC
- Effet hover du CTA (D-10) — `translateY(-2px)` + `box-shadow: --shadow-md` dans UI-SPEC
- Style de l'indicateur de scroll (D-14) — chevron SVG + texte "Défiler" dans UI-SPEC
- Hauteur hero svh vs vh (D-17) — `100svh` avec fallback `100vh` dans UI-SPEC
- Ajustement proportionnel des tailles sur mobile (D-18) — dans UI-SPEC responsive
- Support prefers-reduced-motion — désactiver animations si besoin

### Deferred Ideas (OUT OF SCOPE)

Aucune — la discussion est restée dans le scope de la phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HERO-01 | Section plein écran (100svh) avec image de fond et overlay | `100svh` supporté à 94.55% (Chrome 108+, Safari 15.4+, Firefox 101+) — fallback `100vh` inclus. Fond warm `#2C2418` + overlay `rgba(0,0,0,0.55)` |
| HERO-02 | Badge "Visualisation par IA", titre H1, sous-titre et CTA | Contenu, typographie et styles entièrement spécifiés dans UI-SPEC — implémentation purement CSS Modules |
| HERO-03 | Indicateur de scroll animé en bas du hero | Animation CSS `translateY` oscillant (1.5s ease-in-out infinite). Fade-out via `useState` + scroll listener (pattern Header.tsx). Pas de motion.div nécessaire ici — CSS pur suffit |
| HERO-04 | Animation fade-in des éléments au chargement | `motion.div` avec `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.4, ease: 'easeInOut' }}`. Nécessite l'installation du package `motion` |
</phase_requirements>

---

## Summary

La Phase 02 est un composant React client statique (`'use client'`) qui n'appelle aucune API. L'implémentation consiste à créer deux fichiers : `src/components/public/Hero/Hero.tsx` et `Hero.module.css`, puis intégrer `<Hero />` dans `page.tsx`.

La décision la plus critique de la phase est l'installation de **Framer Motion** (rebaptisé "Motion") — le package n'est pas encore dans le projet. Le bon package à installer est `motion` (pas `framer-motion`) et l'import est `from 'motion/react'`. La version actuelle est 12.38.0, compatible React 19 et Next.js 16.

L'animation d'entrée est un simple `motion.div` wrapper autour du bloc contenu central, avec `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}` en 400ms. L'indicateur de scroll est géré par CSS pur (animation `translateY` oscillante) + `useState/useEffect` pour le fade-out, exactement comme le scroll listener existant dans `Header.tsx`.

**Primary recommendation:** Créer `Hero.tsx` comme composant `'use client'`, installer `motion@12.38.0`, utiliser `100svh` avec fallback `100vh`, et réutiliser le pattern scroll listener de `Header.tsx` pour le fade-out de l'indicateur.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | 12.38.0 | Animation fade-in Framer Motion | Décision locked D-13. Supporte React 19 + Next.js App Router. Import via `motion/react` |
| CSS Modules | Next.js natif | Styles du composant Hero | Convention stricte projet — PAS de Tailwind |
| React (useState, useEffect) | 19.2.4 (déjà installé) | Scroll listener pour fade-out indicateur | Pattern établi Phase 01 (Header.tsx) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Next.js Link | 16.2.1 (déjà installé) | Navigation si nécessaire | Non requis pour le Hero (CTA = `<a>` vers ancre) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `motion` (motion/react) | `framer-motion` | Les deux packages fonctionnent (même code sous-jacent). `motion` est le nouveau nom officiel, `framer-motion` reste un alias. Le projet n'ayant pas encore de dépendance motion, installer `motion` est la bonne pratique |
| `100svh` | `100dvh` | `dvh` = viewport dynamique (se redimensionne quand la barre d'adresse mobile apparaît/disparaît — peut causer des sauts visuels). `svh` = hauteur fixe de la plus petite viewport — plus stable pour un hero |

**Installation:**
```bash
npm install motion
```

**Version verification:** version 12.38.0 vérifiée le 2026-03-26 via `npm view motion version`.

---

## Architecture Patterns

### Recommended Project Structure

```
src/components/public/Hero/
├── Hero.tsx           # Composant principal ('use client')
└── Hero.module.css    # Styles CSS Modules
```

Intégration dans `src/app/page.tsx` : remplacer `{/* Phase 2 : <Hero /> */}` par `<Hero />`.

### Pattern 1: Composant Client avec scroll listener

**What:** `'use client'` component avec `useState(false)` + `useEffect` pour le scroll, sans accès à `window` dans l'initialisation.

**When to use:** Tout composant nécessitant de réagir au scroll (Header, ScrollIndicator).

**Example:**
```typescript
// Source: Pattern établi src/components/public/Header/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import styles from './Hero.module.css'

export function Hero() {
  const [scrolled, setScrolled] = useState(false) // jamais window dans useState

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ...
}
```

### Pattern 2: Animation Framer Motion fade-in (motion/react)

**What:** `motion.div` wrapper avec `initial` / `animate` / `transition` pour une animation d'entrée au montage.

**When to use:** Éléments nécessitant une animation au chargement de page (D-13).

**Example:**
```typescript
// Source: https://motion.dev/docs/react-animation
'use client'

import { motion, useReducedMotion } from 'motion/react'

export function Hero() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: 'easeInOut'
      }}
    >
      {/* Badge + H1 + sous-titre + CTA */}
    </motion.div>
  )
}
```

### Pattern 3: Animation CSS oscillante (indicateur de scroll)

**What:** Keyframe CSS `@keyframes` + `animation` property dans le module CSS — pas de Framer Motion nécessaire pour les animations décoratives infinies.

**When to use:** Animations infinies et répétitives sans état React (oscillation du chevron).

**Example:**
```css
/* Source: CHARTE-GRAPHIQUE.md — transition indicateur scroll 1.5s ease-in-out infinite */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(8px); }
}

.chevron {
  animation: bounce 1.5s ease-in-out infinite;
}

.scrollIndicator {
  opacity: 1;
  transition: opacity var(--transition-fast); /* 300ms ease */
}

.scrollIndicatorHidden {
  opacity: 0;
}
```

### Pattern 4: Hero background avec overlay

**What:** `position: relative` sur le conteneur + `::before` pseudo-élément pour l'overlay sombre.

**When to use:** Fond coloré ou image avec texte blanc par-dessus.

**Example:**
```css
/* Source: UI-SPEC.md — Overlay du fond hero */
.hero {
  position: relative;
  height: 100svh;          /* svh = correctif mobile */
  background-color: #2C2418; /* warm dark placeholder */
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55); /* --color-overlay */
  z-index: 1;
}

.heroContent {
  position: relative;
  z-index: 2; /* au-dessus de l'overlay */
}
```

### Anti-Patterns to Avoid

- **Accéder à `window` dans `useState()`:** Provoque un crash SSR. Toujours `useState(false)` et lire `window` uniquement dans `useEffect`.
- **Utiliser `next/image` pour le fond hero:** Complexité SSR inutile pour un fond décoratif. Decision D-03 — utiliser `background-image` CSS.
- **Importer depuis `framer-motion` au lieu de `motion/react`:** Fonctionne mais utilise l'ancienne API. Utiliser `motion/react` pour la cohérence avec la v12.
- **Mettre Framer Motion dans un Server Component:** `motion.div` nécessite `'use client'`. Le composant Hero sera déjà client.
- **Utiliser `100dvh` au lieu de `100svh`:** `dvh` change de valeur quand la barre d'adresse mobile se cache/apparaît, causant des reflows. `svh` est stable.
- **Animation Framer Motion sur l'indicateur de scroll:** Sur-ingénierie — l'oscillation CSS est plus légère et ne nécessite pas de re-render React.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reduced motion | Logic manuelle via media query JS | `useReducedMotion()` de `motion/react` | Hook officiel, réagit aux changements en temps réel |
| Scroll position reactive | State management complexe | `useState(false)` + `useEffect` scroll listener | Pattern simple déjà prouvé dans Header.tsx |
| Fade-in animation | CSS keyframe opacity | `motion.div` avec `initial`/`animate` | Décision locked D-13 — Framer Motion obligatoire |

**Key insight:** Ce hero est entièrement statique (aucune API). La seule complexité technique réelle est l'installation et la configuration correcte de `motion`.

---

## Common Pitfalls

### Pitfall 1: Hydration mismatch avec Framer Motion
**What goes wrong:** `motion.div` peut générer des attributs `data-projection-id` différents entre le SSR et le client, causant un warning React.
**Why it happens:** Framer Motion utilise un compteur interne pour les IDs de projection de layout.
**How to avoid:** S'assurer que le composant Hero est bien marqué `'use client'`. Les animations simples `opacity`/`y` ne déclenchent pas d'hydration mismatch — seuls les `layoutId` le font.
**Warning signs:** Console React affiche "Hydration failed" ou "server-rendered HTML didn't match".

### Pitfall 2: `window` dans l'initialisation useState
**What goes wrong:** `TypeError: window is not defined` au build ou en SSR.
**Why it happens:** Next.js exécute les composants côté serveur même avec App Router.
**How to avoid:** `useState(false)` jamais `useState(window.scrollY > 0)`. Accéder à `window` uniquement dans `useEffect`.
**Warning signs:** Build error `window is not defined`.

### Pitfall 3: z-index de l'overlay et du contenu
**What goes wrong:** Le texte hero disparaît derrière l'overlay sombre.
**Why it happens:** `::before` avec `position: absolute; inset: 0` et `z-index: 1` sans que le contenu ait `z-index: 2`.
**How to avoid:** Toujours `position: relative; z-index: 2` sur `.heroContent`.
**Warning signs:** Le texte s'affiche mais disparaît après ajout de l'overlay.

### Pitfall 4: Header transparent et contenu hero
**What goes wrong:** Le titre H1 est partiellement masqué par le Header fixe (64px).
**Why it happens:** Le Hero est `position: relative` (pas `position: fixed`), le Header fixe par-dessus lui à `z-index: 100`.
**How to avoid:** Ajouter `padding-top: var(--header-height)` (64px) au bloc contenu centré, tel que spécifié dans UI-SPEC.
**Warning signs:** Le titre semble tronqué en haut sur desktop.

### Pitfall 5: `100svh` non supporté (navigateurs anciens)
**What goes wrong:** Sur Safari < 15.4, `100svh` est ignoré et la section est de hauteur 0.
**Why it happens:** `svh` est une unité récente (Baseline Widely Available depuis juin 2025, ~94% support).
**How to avoid:** Toujours inclure un fallback : `height: 100vh; height: 100svh;` — les navigateurs récents écrasent avec `100svh`.
**Warning signs:** Hero invisible sur navigateurs anciens.

---

## Code Examples

Verified patterns from official sources:

### Import correct depuis motion/react
```typescript
// Source: https://motion.dev/docs/react-quick-start
import { motion, useReducedMotion } from 'motion/react'
```

### Fade-in avec transition configurée
```typescript
// Source: https://motion.dev/docs/react-animation + https://motion.dev/docs/react-transitions
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: 'easeInOut' }}
>
  {/* contenu */}
</motion.div>
```

### prefers-reduced-motion avec useReducedMotion
```typescript
// Source: https://motion.dev/docs/react-use-reduced-motion
import { motion, useReducedMotion } from 'motion/react'

const prefersReducedMotion = useReducedMotion()

<motion.div
  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeInOut' }}
>
```

### Hauteur hero avec fallback svh
```css
/* Source: web.dev/blog/viewport-units + caniuse.com/viewport-unit-variants */
.hero {
  height: 100vh;   /* fallback navigateurs anciens */
  height: 100svh;  /* correctif barre d'adresse mobile — écrase 100vh sur navigateurs récents */
}
```

### Scroll listener SSR-safe (pattern établi Header.tsx)
```typescript
// Source: src/components/public/Header/Header.tsx
const [scrolled, setScrolled] = useState(false) // false par défaut — SSR safe

useEffect(() => {
  const handleScroll = () => setScrolled(window.scrollY > 0)
  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [])
```

### Badge pill doré (CSS Modules)
```css
/* Source: UI-SPEC.md — Badge pill "Visualisation par IA" */
.badge {
  display: inline-block;
  background: rgba(228, 148, 0, 0.9); /* --color-primary à 90% */
  color: #ffffff;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-sm);
}
```

### Bouton CTA gradient avec hover
```css
/* Source: CHARTE-GRAPHIQUE.md + UI-SPEC.md */
.cta {
  display: inline-block;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: #ffffff;
  padding: 16px 32px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  margin-top: var(--spacing-lg);
}

.cta:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.cta:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package + `import { motion } from 'framer-motion'` | `motion` package + `import { motion } from 'motion/react'` | Motion v11 (2024) | Les deux fonctionnent en v12. `motion/react` est recommandé pour les nouveaux projets |
| `100vh` pour full-screen hero | `100vh` (fallback) + `100svh` | CSS Viewport Units v2 (2022, Baseline Widely Available juin 2025) | Corrige le bug mobile où `100vh` inclut la barre d'adresse cachée |

---

## Open Questions

1. **Aucune question bloquante identifiée**
   - What we know: Toutes les décisions sont locked dans CONTEXT.md et UI-SPEC.md
   - What's unclear: Rien — la phase est entièrement spécifiée
   - Recommendation: Procéder directement à l'implémentation

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js v22 | Runtime | oui | 22.22.1 | — |
| npm | Installation `motion` | oui | inclus avec Node | — |
| `motion` package | HERO-04 (animation) | non (pas encore installé) | — | Aucun (décision locked D-13) |
| `next` | Framework | oui | 16.2.1 | — |
| `react` / `react-dom` | Composant | oui | 19.2.4 | — |

**Missing dependencies with no fallback:**
- `motion` (package npm) — doit être installé avant l'implémentation : `npm install motion`

**Missing dependencies with fallback:**
- Aucune

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Aucun framework de test détecté dans le projet |
| Config file | Aucun (pas de jest.config.*, vitest.config.*, pytest.ini) |
| Quick run command | `npx tsc --noEmit` (vérification types) |
| Full suite command | `npm run build` (build production) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HERO-01 | Hero occupe 100svh avec overlay visible | manual-only | `npm run dev` + inspection visuelle | N/A |
| HERO-02 | Badge, H1, sous-titre et CTA visibles et centrés | manual-only | `npm run dev` + inspection visuelle | N/A |
| HERO-03 | Indicateur scroll visible et s'estompe au scroll | manual-only | `npm run dev` + test scroll manuel | N/A |
| HERO-04 | Fade-in au chargement, pas d'erreur TypeScript | semi-auto | `npx tsc --noEmit` (types) + `npm run build` (build) + inspection visuelle | N/A |

**Justification manual-only:** Le Hero est un composant UI pur sans logique métier testable par assertion automatique. Les comportements visuels (dimensions, couleurs, animations) nécessitent une inspection visuelle. La vérification automatisable se limite à la compilation TypeScript et au build sans erreur.

### Sampling Rate

- **Par tâche:** `npx tsc --noEmit` — zéro erreur TypeScript
- **Fin de phase:** `npm run build` — build production sans erreur

### Wave 0 Gaps

Aucun framework de test à installer. La validation de la phase repose sur :
- [ ] `npm install motion` — dépendance manquante bloquante pour HERO-04
- [ ] `npx tsc --noEmit` vert après chaque fichier créé
- [ ] `npm run build` vert en fin de phase

---

## Project Constraints (from CLAUDE.md)

Directives actives qui contraignent cette phase :

| Directive | Impact sur la Phase 02 |
|-----------|------------------------|
| PAS de Tailwind, PAS de shadcn/ui — CSS Modules uniquement | Hero.module.css obligatoire. Aucune classe utility |
| Un fichier `.module.css` par composant | `Hero.module.css` distinct — pas de styles inline, pas de styles dans `globals.css` |
| Composants en PascalCase, un fichier par composant | `Hero.tsx`, pas de sous-composants dans des fichiers séparés pour cette phase |
| TypeScript strict (aucun `any`) | Typage complet de tous les props et valeurs de retour |
| Messages d'erreur en français | Non applicable — Hero est statique, pas d'états d'erreur |
| Langue française uniquement (UI) | Tout le texte en français (déjà dans UI-SPEC copywriting) |
| Design tokens dans `src/app/globals.css` | Uniquement des `var(--token)` dans Hero.module.css, jamais de valeurs hardcodées (sauf `#2C2418` fond warm et `#FFFFFF` texte blanc sur fond sombre) |
| Node v22 (.nvmrc) | Déjà vérifié — v22.22.1 actif |

---

## Sources

### Primary (HIGH confidence)
- [motion.dev/docs/react-animation](https://motion.dev/docs/react-animation) — API `motion.div`, `initial`, `animate`, fade-in pattern
- [motion.dev/docs/react-transitions](https://motion.dev/docs/react-transitions) — prop `transition`, `duration`, `ease`, `delay`
- [motion.dev/docs/react-quick-start](https://motion.dev/docs/react-quick-start) — import path `motion/react`, package `motion`
- [motion.dev/docs/react-use-reduced-motion](https://motion.dev/docs/react-use-reduced-motion) — `useReducedMotion()` hook
- [motion.dev/docs/react-motion-config](https://motion.dev/docs/react-motion-config) — `MotionConfig` `reducedMotion` prop
- [motion.dev/docs/react-use-scroll](https://motion.dev/docs/react-use-scroll) — `useScroll`, `useMotionValueEvent`
- `npm view motion version` (2026-03-26) — version 12.38.0, peerDeps React 18/19
- `.planning/phases/02-hero-plein-cran/02-UI-SPEC.md` — contrat de design complet, approuvé
- `.planning/phases/02-hero-plein-cran/02-CONTEXT.md` — 18 décisions locked
- `src/components/public/Header/Header.tsx` — pattern scroll listener établi Phase 01
- `src/app/globals.css` — tokens CSS vérifiés

### Secondary (MEDIUM confidence)
- [caniuse.com/viewport-unit-variants](https://caniuse.com/viewport-unit-variants) — support `svh` : 94.55% global, Baseline Widely Available juin 2025
- [web.dev/blog/viewport-units](https://web.dev/blog/viewport-units) — explication svh vs dvh vs lvh

### Tertiary (LOW confidence)
- WebSearch "framer-motion Next.js 16 use client SSR" — cross-vérifié avec docs officielles motion.dev

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — version npm vérifiée en direct, peerDeps React 19 confirmées
- Architecture: HIGH — patterns copiés exactement depuis code Phase 01 existant
- Pitfalls: HIGH — patterns SSR établis par Phase 01, hydration mismatch vérifié via docs motion.dev
- Viewport units: HIGH — caniuse + web.dev confirmés

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (30 jours — stack stable)
