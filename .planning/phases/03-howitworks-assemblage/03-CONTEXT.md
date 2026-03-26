# Phase 3: HowItWorks + assemblage - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Section "Comment ca marche" expliquant le parcours utilisateur en 3 etapes illustrees (choisir, personnaliser, visualiser). Fond alterne beige, layout responsive 1 col mobile / 3 col desktop, animation apparition au scroll. Le template Next.js est entierement remplace apres cette phase.

</domain>

<decisions>
## Implementation Decisions

### Contenu textuel
- **D-01:** Titre H2 = "Comment ca marche" (pas "Simple comme 1, 2, 3" du wireframe)
- **D-02:** Sous-titre muted — Claude redige un texte court cadrant le parcours, ton rassurant
- **D-03:** Titres des 3 etapes : "Choisissez votre modele", "Personnalisez avec votre tissu", "Visualisez chez vous" (wireframe valide)
- **D-04:** Descriptions sous chaque etape — Claude redige 1-2 lignes par etape, ton simple et rassurant, coherent avec le Hero

### Style des cartes
- **D-05:** Cards blanches (#FFFFFF) sur fond section beige (#F8F4EE) avec ombre subtile (tonal layering, pas de bordures)
- **D-06:** Coins arrondis conformes aux tokens (--radius-lg: 12px)
- **D-07:** Numero visible (1, 2, 3) en couleur primary (#E49400) au-dessus de l'icone sur chaque carte

### Icones
- **D-08:** Librairie Lucide React pour les icones des 3 etapes
- **D-09:** Style outline, taille et couleur — Claude choisit les icones les plus parlantes pour chaque etape (canape/tissu/maison ou equivalent)

### Animation au scroll
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Wireframe et design
- `.planning/maquette/wireframe-page-unique.md` — Section 3: Comment ca marche — layout, contenu, elements requis
- `CHARTE-GRAPHIQUE.md` — Tokens design (couleurs, typographie, espacement, ombres, transitions)

### Requirements
- `.planning/REQUIREMENTS.md` — Requirements STEP-01 a STEP-03 avec criteres d'acceptation

### Code existant
- `src/app/globals.css` — Design tokens CSS variables (couleurs, ombres, radius, transitions)
- `src/components/public/Hero/Hero.tsx` — Pattern Framer Motion existant (motion.div, useReducedMotion)
- `src/app/page.tsx` — Placeholder `{/* Phase 3 : <HowItWorks /> */}` a remplacer
- `src/app/page.module.css` — Layout page (flex column)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `motion/react` (motion@12) deja installe — utiliser `motion.div`, `useInView`, `useReducedMotion`
- Design tokens complets dans globals.css : couleurs, espacement, typographie, ombres, transitions
- Montserrat font configuree dans layout.tsx
- Pattern Hero pour animation fade-in (motion.div avec opacity + translateY)

### Established Patterns
- CSS Modules : un fichier `.module.css` par composant
- Client components : `'use client'` pour composants avec state/effects/motion
- SSR safety : `useState(false)` par defaut, jamais d'acces a window dans initialisation
- Tonal layering : contraste par couleurs de fond, pas de bordures (design system Curated Atelier)

### Integration Points
- `page.tsx` : remplacer le commentaire `{/* Phase 3 : <HowItWorks /> */}` par `<HowItWorks />`
- Composant a creer dans `src/components/public/HowItWorks/HowItWorks.tsx` + `HowItWorks.module.css`
- La section suit immediatement le Hero dans le flux de page

</code_context>

<specifics>
## Specific Ideas

- Philosophie "Curated Atelier" — chaque section est un espace galerie haut de gamme
- Le fond beige (#F8F4EE) cree un contraste naturel avec les sections blanches adjacentes (Hero dessus, Catalogue en dessous)
- Les numeros en primary (#E49400) renforcent visuellement la sequence et le branding

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-howitworks-assemblage*
*Context gathered: 2026-03-26*
