# Phase 2: Hero plein écran - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Section hero occupant 100% de la hauteur de la fenêtre, communiquant la proposition de valeur de Möbel Unique avec une animation d'entrée. Inclut badge IA, titre H1, sous-titre, CTA et indicateur de scroll animé.

</domain>

<decisions>
## Implementation Decisions

### Image de fond / Placeholder
- **D-01:** Fond couleur unie warm + overlay semi-transparent (pas de gradient CSS complexe, pas d'image stock). La vraie photo sera ajoutée plus tard.
- **D-02:** Intensité de l'overlay — Claude ajuste pour le meilleur contraste avec le texte blanc.
- **D-03:** Technique pour la future image réelle — Claude choisit entre background-image CSS ou next/image fill.

### Contenu textuel
- **D-04:** H1 = "Visualisez votre canapé chez vous" (texte du wireframe validé tel quel)
- **D-05:** Sous-titre — Claude rédige un texte adapté au ton général (le wireframe dit "paragraphe 16-18px détaillant le bénéfice")
- **D-06:** Badge "Visualisation par IA" en style pill — Claude choisit le style le plus lisible sur fond sombre (doré plein ou outline)
- **D-07:** CTA = "Découvrir nos canapés" avec href="#catalogue" (scroll smooth vers la section catalogue, lien mort temporaire jusqu'à Phase 4)

### Style du bouton CTA
- **D-08:** Bouton plein avec gradient primary→primary-dark (#E49400→#845400), texte blanc
- **D-09:** Taille et padding du CTA — Claude ajuste pour le meilleur équilibre visuel
- **D-10:** Effet hover du CTA — Claude choisit l'effet le plus cohérent avec le design system

### Animation d'entrée
- **D-11:** Fade-in simultané global — tous les éléments apparaissent en même temps (pas de stagger séquentiel)
- **D-12:** Durée du fade-in = 400ms (cohérent avec --transition-smooth dans globals.css)
- **D-13:** Librairie Framer Motion pour les animations (pas CSS pur)

### Indicateur de scroll
- **D-14:** Style de l'indicateur — Claude choisit (chevron + texte ou chevron seul)
- **D-15:** Fade-out au scroll — l'indicateur disparaît quand l'utilisateur commence à scroller
- **D-16:** Décoratif seulement — pas de comportement au clic (pas de scroll vers section suivante)

### Responsive
- **D-17:** Unité de hauteur hero (svh/vh) — Claude choisit la plus compatible
- **D-18:** Ajustement des tailles responsive — Claude suit les tokens de la charte (display 3.5rem→hero-mobile 2.25rem pour le H1)

### Claude's Discretion
- Intensité exacte de l'overlay (D-02)
- Technique image future : background-image CSS vs next/image (D-03)
- Rédaction du sous-titre (D-05)
- Style du badge IA : pill dorée vs outline (D-06)
- Taille, padding et radius du CTA (D-09)
- Effet hover du CTA (D-10)
- Style de l'indicateur de scroll (D-14)
- Hauteur hero svh vs vh (D-17)
- Ajustement proportionnel des tailles sur mobile (D-18)
- Support prefers-reduced-motion (désactiver animations si besoin)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Wireframe et design
- `.planning/maquette/wireframe-page-unique.md` — Section 2: Hero — dimensions, contenu, comportement, éléments requis
- `CHARTE-GRAPHIQUE.md` — Tous les tokens design (couleurs, typographie, espacement, ombres, transitions)

### Requirements
- `.planning/REQUIREMENTS.md` — Requirements HERO-01 à HERO-04 avec critères d'acceptation

### Code existant
- `src/app/globals.css` — Design tokens CSS variables déjà configurés
- `src/components/public/Header/Header.tsx` — Pattern scroll state existant (useState + useEffect + scroll listener)
- `src/app/page.tsx` — Placeholder `{/* Phase 2 : <Hero /> */}` à remplacer
- `src/app/page.module.css` — Layout page (flex column)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Header scroll pattern : `useState(false)` + `useEffect` + `window.addEventListener('scroll', ...)` — réutilisable pour le fade-out de l'indicateur de scroll
- Design tokens complets dans globals.css : couleurs, espacement, typographie, transitions, ombres
- Montserrat font déjà configurée dans layout.tsx

### Established Patterns
- CSS Modules : un fichier `.module.css` par composant (pas de Tailwind)
- Client components : `'use client'` pour les composants avec state/effects
- SSR safety : `useState(false)` par défaut, jamais d'accès à `window` dans l'initialisation

### Integration Points
- `page.tsx` : remplacer le commentaire `{/* Phase 2 : <Hero /> */}` par `<Hero />`
- Composant à créer dans `src/components/public/Hero/Hero.tsx` + `Hero.module.css`
- Header déjà transparent sur le hero — le hero doit supporter du texte blanc lisible sous le header

</code_context>

<specifics>
## Specific Ideas

- Le wireframe v4 dit : "Créer un impact émotionnel immédiat. Vendre la promesse : voyez votre canapé chez vous."
- Philosophie design "Curated Atelier" — chaque écran est un espace galerie haut de gamme
- Le gradient CTA (primary→primary-dark) donne un aspect premium cohérent avec cette philosophie

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-hero-plein-cran*
*Context gathered: 2026-03-26*
