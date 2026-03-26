# Phase 3: HowItWorks + assemblage - Research

**Researched:** 2026-03-26
**Domain:** React component with CSS Grid layout, Framer Motion scroll animation, Lucide React icons
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Titre H2 = "Comment ca marche" (pas "Simple comme 1, 2, 3" du wireframe)
- **D-02:** Sous-titre muted — Claude redige un texte court cadrant le parcours, ton rassurant
- **D-03:** Titres des 3 etapes : "Choisissez votre modele", "Personnalisez avec votre tissu", "Visualisez chez vous" (wireframe valide)
- **D-04:** Descriptions sous chaque etape — Claude redige 1-2 lignes par etape, ton simple et rassurant, coherent avec le Hero
- **D-05:** Cards blanches (#FFFFFF) sur fond section beige (#F8F4EE) avec ombre subtile (tonal layering, pas de bordures)
- **D-06:** Coins arrondis conformes aux tokens (--radius-lg: 12px)
- **D-07:** Numero visible (1, 2, 3) en couleur primary (#E49400) au-dessus de l'icone sur chaque carte
- **D-08:** Librairie Lucide React pour les icones des 3 etapes
- **D-09:** Style outline, taille et couleur — Claude choisit les icones les plus parlantes pour chaque etape
- **D-10:** Framer Motion (motion/react, deja installe) avec useInView pour detecter l'entree dans le viewport
- **D-11:** Stagger 100ms entre les cartes (la 2e apparait 100ms apres la 1ere, etc.)
- **D-12:** Fade-in + translateY (meme pattern que le Hero) — respecte prefers-reduced-motion

### Claude's Discretion

- Redaction du sous-titre section (D-02)
- Redaction des descriptions etapes (D-04)
- Choix exact des icones Lucide (D-09)
- Padding interne des cards
- Espacement entre les colonnes (gap)
- Hauteur/taille des icones
- Style du numero (taille, font-weight, opacite)
- Hover effect sur les cards (subtil ou aucun)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STEP-01 | 3 cartes etapes (choisir, personnaliser, visualiser) avec icones visibles sur fond #F8F4EE | Lucide React 1.7.0 a installer — Sofa, Palette, Home confirmes disponibles |
| STEP-02 | Layout responsive : 1 col mobile, 3 col desktop, fond alterne beige | CSS Grid `repeat(3, 1fr)` a 640px — tokens existants dans globals.css |
| STEP-03 | Animation apparition au scroll via IntersectionObserver (stagger 100ms) | `useInView` + `useReducedMotion` de motion@12.38.0 — pattern identique Hero |
</phase_requirements>

---

## Summary

La phase 3 est strictement une phase de composition front-end : un composant `HowItWorks` avec 3 cards en CSS Grid, des icones Lucide React, et une animation scroll via Framer Motion. Aucune API backend, aucune donnee dynamique.

Le projet dispose deja de toutes les dependances necessaires sauf Lucide React (a installer). Le pattern Framer Motion (`motion.div`, `useInView`, `useReducedMotion`) est deja etabli dans le composant Hero — la phase 3 reproduit exactement ce pattern avec `useInView` au lieu de l'animation d'entree immediate. La structure CSS Grid est standard (mobile-first, 1 colonne par defaut, 3 colonnes a 640px).

L'assemblage final consiste a remplacer le commentaire `{/* Phase 3 : <HowItWorks /> */}` dans `page.tsx` par le composant reel — modification minimaliste de 2 lignes.

**Primary recommendation:** Creer `HowItWorks.tsx` + `HowItWorks.module.css` dans `src/components/public/HowItWorks/`, installer `lucide-react@1.7.0`, puis integrer dans `page.tsx`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion/react | 12.38.0 (deja installe) | Animation scroll avec useInView + stagger | Deja utilise dans Hero — coherence codebase |
| lucide-react | 1.7.0 (a installer) | Icones outline pour les 3 etapes | Choix decide (D-08) — React 19 compatible |
| CSS Modules | natif Next.js | Styles scopes du composant | Convention projet stricte — aucun Tailwind |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript strict | 5.x (deja installe) | Types pour les props du composant | Obligatoire — aucun `any` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| lucide-react | SVG inline manuels | Lucide est decide (D-08) — SVG manuels inutiles |
| useInView | IntersectionObserver natif | useInView est decide (D-10) — motion deja installe |

**Installation:**
```bash
npm install lucide-react@1.7.0
```

**Version verification:** lucide-react@1.7.0 confirme comme derniere version stable via `npm view lucide-react version` (2026-03-26). motion@12.38.0 deja installe et verifie dans package.json.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
  components/
    public/
      HowItWorks/
        HowItWorks.tsx         # Composant principal ('use client')
        HowItWorks.module.css  # Styles CSS Modules
        __tests__/
          HowItWorks.test.tsx  # Tests unitaires
```

### Pattern 1: useInView avec stagger par index

**What:** Chaque card recoit un delai d'animation calcule depuis son index (`index * 0.1` secondes). `useInView` retourne `true` quand la section entre dans le viewport avec `once: true`.

**When to use:** Pour toute animation de liste/grille apparaissant au scroll, avec stagger entre les elements.

**Example:**
```typescript
// Source: motion@12.38.0 — signature verifiee par introspection du code source
'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'

// La ref est attachee au conteneur de la section, pas aux cards individuelles
export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  // once: true — l'animation ne se rejoue pas au re-scroll
  // margin: '-100px' — declenche un peu avant que la section soit completement visible
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()

  const steps = [/* ... */]

  return (
    <section>
      <div ref={ref}>
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: prefersReducedMotion ? 0 : index * 0.1, // stagger 100ms
              ease: 'easeInOut',
            }}
          >
            {/* contenu card */}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
```

### Pattern 2: CSS Grid responsive mobile-first

**What:** Grid 1 colonne par defaut (mobile), passage a 3 colonnes a 640px via media query.

**When to use:** Layout multi-colonnes avec fond de section et padding genereux (convention "Curated Atelier").

**Example:**
```css
/* HowItWorks.module.css */
.section {
  background-color: var(--color-background-alt); /* #F8F4EE */
  padding: var(--spacing-section) var(--container-padding-mobile); /* 7rem 24px */
}

.grid {
  display: grid;
  grid-template-columns: 1fr; /* mobile : 1 colonne */
  gap: var(--spacing-xl); /* 2rem entre cards */
  max-width: var(--container-max); /* 1280px */
  margin: 0 auto;
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(3, 1fr); /* tablet+ : 3 colonnes */
  }
}

/* Card blanche avec ombre subtile */
.card {
  background-color: var(--surface-container-lowest); /* #FFFFFF */
  border-radius: var(--radius-lg); /* 12px — D-06 */
  box-shadow: var(--shadow-md); /* 0 4px 6px rgba(0,0,0,0.07) */
  padding: var(--spacing-2xl); /* 3rem — espace genereux */
}
```

### Pattern 3: Structure d'une card etape

**What:** Numero en primary, icone outline, titre H3, description.

**When to use:** Toute card representant une etape numerotee avec icone.

**Example:**
```typescript
// Icones Lucide React confirmees disponibles dans v1.7.0
import { Sofa, Palette, Home } from 'lucide-react'

// Mapping etapes -> icones (choix Claude per D-09)
const steps = [
  {
    id: 1,
    icon: <Sofa size={32} strokeWidth={1.5} />,  // etape "Choisissez votre modele"
    title: 'Choisissez votre modele',
    description: '...'
  },
  {
    id: 2,
    icon: <Palette size={32} strokeWidth={1.5} />, // etape "Personnalisez avec votre tissu"
    title: 'Personnalisez avec votre tissu',
    description: '...'
  },
  {
    id: 3,
    icon: <Home size={32} strokeWidth={1.5} />,   // etape "Visualisez chez vous"
    title: 'Visualisez chez vous',
    description: '...'
  },
]
```

### Anti-Patterns to Avoid

- **useRef sur chaque card individuellement:** Creer une ref par card et autant de `useInView` — inutile et verbeux. Attacher une seule ref au conteneur grid et animer les cards depuis leur index.
- **`stagger()` fonction de motion:** La fonction `stagger()` de motion est pour `animate()` imperatif. Pour les composants React avec index, utiliser `delay: index * 0.1` directement dans `transition` — plus simple et plus lisible.
- **`initial={false}` sur AnimatePresence:** Non applicable ici — pas de montage/demontage conditionnel.
- **CSS Grid `auto-fit` avec `minmax`:** Risque de creer 1 ou 2 colonnes selon la largeur disponible. Utiliser `repeat(3, 1fr)` fixe a 640px pour garantir exactement 3 colonnes (STEP-02 impose 3 col desktop).
- **Animations CSS `@keyframes` pour le scroll:** Le composant Hero utilise CSS `@keyframes bounce` uniquement pour l'indicateur scroll (animation independante). Pour les animations au scroll, utiliser `useInView` de motion — pas de `@keyframes`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detection entree viewport | IntersectionObserver custom avec state | `useInView` de motion/react | Gere les edge cases (SSR, cleanup, threshold) et deja installe |
| Respect prefers-reduced-motion | Media query CSS + detection JS manuelle | `useReducedMotion()` de motion/react | Hook eprouve, SSR-safe, deja utilise dans Hero |
| Icones SVG outline | SVG inline code en dur | `lucide-react` | Accessible (aria-hidden natif), consistant, taille/couleur en props |

**Key insight:** Pour ce composant, tout ce qui est "nouveau" a deja un precedent direct dans le Hero existant. Copier le pattern, pas le reinventer.

---

## Common Pitfalls

### Pitfall 1: `animate` mal conditionne avec useInView

**What goes wrong:** La card reste invisible (opacity: 0) apres le scroll si `animate` ne bascule pas correctement selon `isInView`.

**Why it happens:** `isInView` commence a `false`. Si `animate` est `{ opacity: 1, y: 0 }` en dur (sans condition sur `isInView`), les cards s'animent au chargement et non au scroll. Si `animate` est conditionne mais que `initial` est aussi `{ opacity: 0 }`, les cards peuvent flasher.

**How to avoid:** Utiliser `animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}` avec `initial={{ opacity: 0, y: 20 }}`. La valeur `once: true` dans `useInView` empeche la re-animation au re-scroll.

**Warning signs:** Les cards sont invisibles apres le scroll, ou s'animent au chargement sans attendre le scroll.

### Pitfall 2: SSR mismatch avec motion et isInView

**What goes wrong:** Hydration mismatch entre le rendu serveur (isInView = false = opacity 0) et le rendu client.

**Why it happens:** `useInView` utilise `useState(false)` en interne (confirme dans le code source : `const [isInView, setInView] = useState(initial)`). Avec `initial = false` (defaut), le rendu initial est `opacity: 0` cote serveur ET cote client — pas de mismatch.

**How to avoid:** Ne pas passer `initial: true` a `useInView` (sinon le SSR rendrait les cards visibles et le client les masquerait). Laisser le defaut `initial: false`.

**Warning signs:** Erreur React "Hydration failed" dans la console.

### Pitfall 3: `lucide-react` non installe

**What goes wrong:** Erreur de build `Module not found: Can't resolve 'lucide-react'`.

**Why it happens:** `lucide-react` n'est pas dans les dependances actuelles (verifie dans package.json — absent).

**How to avoid:** Executer `npm install lucide-react@1.7.0` avant de creer le composant.

**Warning signs:** Erreur de compilation immediate au `npm run dev`.

### Pitfall 4: Icone couleur invisible sur fond beige

**What goes wrong:** L'icone n'est pas visible sur le fond de card (#FFFFFF) ou de section (#F8F4EE).

**Why it happens:** Par defaut, Lucide React herite la `color` CSS du parent. Si la couleur du texte du parent est `--color-muted` (#888888), l'icone sera grise et peu contrastee.

**How to avoid:** Passer `color` explicitement : `<Sofa size={32} strokeWidth={1.5} color="var(--color-primary)" />` ou via CSS sur le conteneur. Pour le style "outline premium", utiliser `--color-text` (#1D1D1B) ou `--color-primary` (#E49400).

**Warning signs:** Icone difficile a distinguer sur fond blanc.

### Pitfall 5: padding-top manquant sous le header fixe

**What goes wrong:** La section HowItWorks commence directement sous le Hero sans espace — la section header (fixe, 64px) pourrait couvrir le titre si l'utilisateur navigue par ancre.

**Why it happens:** `scroll-padding-top: var(--header-height)` est dans `globals.css` (FOND-04 complete), donc les ancres `#` sont automatiquement compensees. Pas de probleme specifique a cette section.

**How to avoid:** Ne PAS ajouter de `padding-top` supplementaire pour le header — le `scroll-padding-top` de globals.css gere ca. Le `padding` de la section doit etre `var(--spacing-section)` uniformement.

**Warning signs:** Section coupee en haut lors de la navigation par ancre.

---

## Code Examples

Verified patterns from official sources:

### useInView signature (verifiee par introspection code source motion@12.38.0)

```typescript
// Signature complete :
// useInView(ref, { root?, margin?, amount?, once = false, initial = false })
//
// - once: true => ne se re-declenche pas au re-scroll (recommande pour animations d'entree)
// - margin: '-100px' => declenche 100px avant le bas du viewport (anticipation)
// - initial: false => etat initial = non visible (defaut SSR-safe)

import { useRef } from 'react'
import { useInView } from 'motion/react'

const ref = useRef<HTMLDivElement>(null)
const isInView = useInView(ref, { once: true, margin: '-100px' })
```

### useReducedMotion (pattern etabli depuis Hero.tsx)

```typescript
import { useReducedMotion } from 'motion/react'

const prefersReducedMotion = useReducedMotion()

// Dans la transition :
transition={{
  duration: prefersReducedMotion ? 0 : 0.4,
  delay: prefersReducedMotion ? 0 : index * 0.1,
  ease: 'easeInOut',
}}

// Dans initial/animate :
initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
```

### Lucide React import pattern (v1.7.0)

```typescript
// Import nomme — tree-shakeable
import { Sofa, Palette, Home } from 'lucide-react'

// Usage avec taille et epaisseur de trait outline
<Sofa size={32} strokeWidth={1.5} />
<Palette size={32} strokeWidth={1.5} />
<Home size={32} strokeWidth={1.5} />

// Pour l'accessibilite — si l'icone est purement decorative :
<Sofa size={32} strokeWidth={1.5} aria-hidden="true" />
```

### Mock lucide-react pour les tests (pattern derivé du mock motion Hero.test.tsx)

```typescript
// Dans HowItWorks.test.tsx
vi.mock('lucide-react', () => ({
  Sofa: () => <svg data-testid="icon-sofa" aria-hidden="true" />,
  Palette: () => <svg data-testid="icon-palette" aria-hidden="true" />,
  Home: () => <svg data-testid="icon-home" aria-hidden="true" />,
}))

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      <div {...props}>{children}</div>,
    section: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      <section {...props}>{children}</section>,
  },
  useInView: () => true,      // section toujours "en vue" dans les tests
  useReducedMotion: () => false,
}))
```

### Integration dans page.tsx

```typescript
// Avant (commentaire Phase 3) :
{/* Phase 3 : <HowItWorks /> */}

// Apres :
import { HowItWorks } from '@/components/public/HowItWorks/HowItWorks'
// ...
<HowItWorks />
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package (`motion/react`) | motion@11 (2024) | Meme API, import depuis `motion/react` pas `framer-motion` |
| `useAnimation()` + `whileInView` | `useInView()` + `animate` conditionnel | motion@10+ | `whileInView` reste valide mais `useInView` donne plus de controle |
| `react-icons` | `lucide-react` | 2023+ | Lucide = fork de Feather Icons, maintenu activement, tree-shakeable |

**Deprecated/outdated:**
- `framer-motion` : package renomme en `motion` — utiliser `motion/react` (deja le cas dans ce projet)
- `whileInView` prop sur `motion.div` : toujours fonctionnel mais moins flexible que `useInView` pour le stagger conditionnel

---

## Open Questions

1. **Icone exacte pour "Personnalisez avec votre tissu"**
   - Ce que l'on sait : `Palette` et `Layers` sont disponibles dans lucide-react v1.7.0
   - Ce qui est incertain : L'icone ideale serait "tissu" mais lucide n'a pas d'icone "fabric" explicite
   - Recommendation : Utiliser `Palette` (sous-entend personnalisation couleur/matiere) — coherent avec le contexte canapé
   - Alternative : `Layers` si `Palette` parait trop "peinture"

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | ✓ | v22 (.nvmrc) | — |
| motion/react | D-10 animations | ✓ | 12.38.0 | — |
| lucide-react | D-08 icones | ✗ | 1.7.0 (a installer) | — |
| TypeScript | Types strict | ✓ | 5.x | — |
| Vitest | Tests unitaires | ✓ | 3.2.4 | — |

**Missing dependencies with no fallback:**
- `lucide-react@1.7.0` — doit etre installe avant creation du composant

**Missing dependencies with fallback:**
- Aucune

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --reporter=verbose src/components/public/HowItWorks` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STEP-01 | 3 cards avec titres "Choisissez votre modele", "Personnalisez avec votre tissu", "Visualisez chez vous" et icones presentes | unit | `npm test -- src/components/public/HowItWorks/__tests__/HowItWorks.test.tsx` | Wave 0 |
| STEP-01 | Numeros 1, 2, 3 visibles dans le DOM | unit | idem | Wave 0 |
| STEP-02 | Section avec fond `--color-background-alt` | unit | idem | Wave 0 |
| STEP-03 | Avec isInView=true (mock), cards ont opacity 1 dans le DOM | unit | idem | Wave 0 |

### Sampling Rate

- **Par tache commit:** `npm test -- src/components/public/HowItWorks`
- **Par merge wave:** `npm test`
- **Phase gate:** Suite complete verte avant `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/public/HowItWorks/__tests__/HowItWorks.test.tsx` — couvre STEP-01, STEP-02, STEP-03

*(Pas de gap framework — vitest + testing-library + happy-dom deja configures)*

---

## Project Constraints (from CLAUDE.md)

Directives obligatoires a respecter dans cette phase :

| Directive | Implication pour Phase 3 |
|-----------|--------------------------|
| PAS de Tailwind, PAS de shadcn/ui — CSS Modules uniquement | `HowItWorks.module.css` obligatoire, aucune classe utilitaire |
| Un fichier `.module.css` par composant | `HowItWorks.module.css` distinct de `page.module.css` |
| TypeScript strict (aucun `any`) | Typer les props du step array et les props du composant |
| Composants en PascalCase, un fichier par composant | `HowItWorks.tsx` uniquement — pas de split en sous-fichiers pour cette phase |
| Messages d'erreur en francais | N/A pour ce composant (pas de logique erreur) |
| Framework Next.js 16.2.1 App Router | `'use client'` requis (hooks motion + useRef) |
| Node v22 | Aucun impact specifique |

---

## Sources

### Primary (HIGH confidence)

- Introspection directe du code source `motion@12.38.0` dans `node_modules/` — signature `useInView`, presence de `stagger`, `useReducedMotion`
- `package.json` du projet — versions installees confirmees
- `src/components/public/Hero/Hero.tsx` — pattern Framer Motion etabli dans ce projet
- `src/app/globals.css` — tokens CSS disponibles
- `CHARTE-GRAPHIQUE.md` — tokens design de reference
- `vitest.config.ts` + `src/__tests__/setup.ts` — infrastructure de tests

### Secondary (MEDIUM confidence)

- `npm view lucide-react version` (2026-03-26) — version 1.7.0 confirmee comme derniere stable
- `npm view lucide-react` peerDependencies — React 19 compatible confirme
- lucide.dev/icons — noms des icones Sofa, Palette, Home confirmes via WebSearch + WebFetch

### Tertiary (LOW confidence)

- Aucun element de confiance basse dans cette recherche — tout a ete verifie par source primaire ou officielle

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verifiees dans node_modules et npm registry
- Architecture: HIGH — pattern exactement reproduit depuis Hero.tsx existant dans ce projet
- Pitfalls: HIGH — bases sur l'inspection du code source motion et les patterns etablis

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (lucide-react stable, motion stable — 30 jours)
