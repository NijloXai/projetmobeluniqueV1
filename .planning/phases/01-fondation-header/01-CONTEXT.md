# Phase 1: Fondation + Header - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Refonte du header avec les vrais assets brand Mobel Unique (logos, favicon, app icon) en remplacement du placeholder generique "MU". Copie des assets necessaires dans public/brand/. Nettoyage des fichiers Next.js par defaut. Le comportement scroll (transparent → glassmorphism) et le skip link accessibilite sont deja en place et ne changent pas.

</domain>

<decisions>
## Implementation Decisions

### Choix du logo header
- **D-01:** Logo complet (monogramme "mu" cursif + texte "MOBEL UNIQUE") en PNG via next/image, pas de SVG brut (les SVG source sont trop lourds — 2000x2000 export Illustrator avec backgrounds)
- **D-02:** Deux logos selon l'etat du header : Logo-04 (blanc) quand header transparent sur hero sombre, Logo-01 (noir) quand header scrolle sur fond blanc. Swap automatique lie a l'etat `scrolled`
- **D-03:** Source : `fichier-mobelunique/Logo Design/Logo-01.png` (noir) et `Logo-04.png` (blanc) copies dans `public/brand/`

### Favicon et meta
- **D-04:** Favicon = `fichier-mobelunique/Favicon/Favicon-04.png` (monogramme noir sur blanc, bonne taille) — copie dans `src/app/` pour convention Next.js App Router
- **D-05:** Setup complet : favicon.ico + apple-touch-icon.png + web manifest avec App Icon du dossier client `fichier-mobelunique/Appicon/`
- **D-06:** Les meta tags PWA sont configures dans le root layout ou via fichiers convention Next.js (icon.png, apple-icon.png, manifest)

### Contenu header
- **D-07:** Cote droit du header = lien "Retour a la boutique" uniquement (pas de navigation interne, pas de tagline)
- **D-08:** URL Shopify reelle : `https://www.mobelunique.fr/` (remplace le placeholder href="#")
- **D-09:** Le lien ouvre dans le meme onglet (pas target="_blank" — l'utilisateur quitte la SPA pour retourner a la boutique)

### Assets dans public/
- **D-10:** Dossier dedie `public/brand/` pour les assets de la marque
- **D-11:** Copier uniquement logos + favicon pour cette phase. Les icones meubles (18 SVG) et images ambiance seront ajoutees dans les phases futures
- **D-12:** Supprimer les fichiers Next.js par defaut dans public/ (file.svg, globe.svg, next.svg, vercel.svg, window.svg) — inutilises

### Claude's Discretion
- Taille exacte du logo dans le header (hauteur proportionnelle a --header-height: 64px)
- Transition du swap logo blanc→noir (animation ou instantane)
- Format exact du favicon.ico (conversion PNG→ICO, tailles multiples)
- Configuration du web manifest (nom, couleurs, display mode)
- Nommage des fichiers dans public/brand/ (garder noms originaux ou renommer)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Brand assets source
- `fichier-mobelunique/Logo Design/Logo-01.png` — Logo noir complet (monogramme + texte) pour header scrolle
- `fichier-mobelunique/Logo Design/Logo-04.png` — Logo blanc complet pour header transparent
- `fichier-mobelunique/Favicon/Favicon-04.png` — Favicon monogramme noir sur blanc
- `fichier-mobelunique/Appicon/` — App icons pour apple-touch-icon et manifest

### Requirements
- `.planning/REQUIREMENTS.md` — Requirements HEAD-01 a HEAD-04, FOND-01 a FOND-04

### Code existant
- `src/components/public/Header/Header.tsx` — Header actuel a modifier (remplacer logo generique)
- `src/components/public/Header/Header.module.css` — Styles header a adapter pour logo PNG
- `src/app/globals.css` — Design tokens CSS (couleurs, espacement, ombres, transitions)
- `src/app/layout.tsx` — Root layout (Montserrat, metadata template)
- `src/app/page.tsx` — Page d'accueil avec Header + Hero + HowItWorks

### Design
- `CLAUDE.md` — Conventions projet et design tokens
- `.planning/maquette/wireframe-page-unique.md` — Wireframe page unique v4

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Header scroll pattern existant : `useState(false)` + `useEffect` + scroll listener — on reutilise pour conditionner le swap logo
- Design tokens complets dans globals.css (couleurs, ombres, transitions)
- `next/image` disponible nativement — optimisation automatique des PNG

### Established Patterns
- CSS Modules : un fichier `.module.css` par composant
- Client components : `'use client'` pour composants avec state/effects
- SSR safety : `useState(false)` par defaut, jamais d'acces a window dans initialisation
- Tonal layering : contraste par couleurs de fond, pas de bordures

### Integration Points
- `Header.tsx` : remplacer le div `.logo` (carre ambre "MU") par `<Image>` avec src conditionnel selon `scrolled`
- `Header.tsx` : remplacer le `<span className={styles.brandName}>` par le logo complet (le texte est inclus dans l'image)
- `Header.module.css` : adapter les styles `.logo` et `.brand` pour un logo image au lieu d'un div texte
- `public/` : creer le dossier `brand/` et y copier les assets
- `src/app/` : ajouter favicon.ico, apple-icon.png, icon.png (convention Next.js App Router)

</code_context>

<specifics>
## Specific Ideas

- Le swap logo blanc/noir doit etre lie a l'etat `scrolled` deja gere dans le Header — meme condition, juste le src de l'image qui change
- Le Brand Style Guide specifie un clear space minimum autour du logo = hauteur du "M" — respecter ce padding
- Le logo complet (monogramme + texte) remplace a la fois le carre "MU" et le span "Mobel Unique" — plus de texte HTML pour le nom
- URL Shopify confirmee : https://www.mobelunique.fr/

</specifics>

<deferred>
## Deferred Ideas

- Icones meubles SVG (18 icones line-art) — a copier dans public/brand/ quand les sections catalogue/HowItWorks en auront besoin
- Images ambiance Unsplash — pour le hero ou sections futures
- Tagline "Crafted for Comfort, Built for Life." — pourrait etre ajoutee dans le hero ou footer, pas dans le header

</deferred>

---

*Phase: 01-fondation-header*
*Context gathered: 2026-03-27*
