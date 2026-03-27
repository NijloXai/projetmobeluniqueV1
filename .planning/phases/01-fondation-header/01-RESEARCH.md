# Phase 1 : Fondation + Header (REDO brand assets) — Recherche

**Researched:** 2026-03-27
**Domain:** Next.js 16.2.1 App Router — Favicon/icon conventions, next/image logo conditionnel, conversion PNG→ICO, web manifest
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Choix du logo header**
- D-01 : Logo complet (monogramme "mu" cursif + texte "MOBEL UNIQUE") en PNG via next/image, pas de SVG brut (les SVG source sont trop lourds — 2000x2000 export Illustrator avec backgrounds)
- D-02 : Deux logos selon l'etat du header : Logo-04 (blanc) quand header transparent sur hero sombre, Logo-01 (noir) quand header scrolle sur fond blanc. Swap automatique lie a l'etat `scrolled`
- D-03 : Source : `fichier-mobelunique/Logo Design/Logo-01.png` (noir) et `Logo-04.png` (blanc) copies dans `public/brand/`

**Favicon et meta**
- D-04 : Favicon = `fichier-mobelunique/Favicon/Favicon-04.png` (monogramme noir sur blanc, bonne taille) — copie dans `src/app/` pour convention Next.js App Router
- D-05 : Setup complet : favicon.ico + apple-touch-icon.png + web manifest avec App Icon du dossier client `fichier-mobelunique/Appicon/`
- D-06 : Les meta tags PWA sont configures dans le root layout ou via fichiers convention Next.js (icon.png, apple-icon.png, manifest)

**Contenu header**
- D-07 : Cote droit du header = lien "Retour a la boutique" uniquement (pas de navigation interne, pas de tagline)
- D-08 : URL Shopify reelle : `https://www.mobelunique.fr/` (remplace le placeholder href="#")
- D-09 : Le lien ouvre dans le meme onglet (pas target="_blank" — l'utilisateur quitte la SPA pour retourner a la boutique)

**Assets dans public/**
- D-10 : Dossier dedie `public/brand/` pour les assets de la marque
- D-11 : Copier uniquement logos + favicon pour cette phase. Les icones meubles (18 SVG) et images ambiance seront ajoutees dans les phases futures
- D-12 : Supprimer les fichiers Next.js par defaut dans public/ (file.svg, globe.svg, next.svg, vercel.svg, window.svg) — inutilises

### Claude's Discretion
- Taille exacte du logo dans le header (hauteur proportionnelle a --header-height: 64px)
- Transition du swap logo blanc→noir (animation ou instantane)
- Format exact du favicon.ico (conversion PNG→ICO, tailles multiples)
- Configuration du web manifest (nom, couleurs, display mode)
- Nommage des fichiers dans public/brand/ (garder noms originaux ou renommer)

### Deferred Ideas (OUT OF SCOPE)
- Icones meubles SVG (18 icones line-art) — a copier dans public/brand/ quand les sections catalogue/HowItWorks en auront besoin
- Images ambiance Unsplash — pour le hero ou sections futures
- Tagline "Crafted for Comfort, Built for Life." — pourrait etre ajoutee dans le hero ou footer, pas dans le header
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOND-01 | Page publique remplace le template Next.js par defaut | COMPLETE depuis Phase 1 initiale — page.tsx et page.module.css sont propres |
| FOND-02 | Metadata publique (titre, description pour SEO) | COMPLETE depuis Phase 1 initiale — layout.tsx a le template correct, page.tsx exporte metadata |
| FOND-03 | Responsive 4 breakpoints (mobile/tablet/desktop/large) | COMPLETE depuis Phase 1 initiale — breakpoints dans Header.module.css |
| FOND-04 | scroll-padding-top et scroll-behavior smooth dans globals.css | COMPLETE depuis Phase 1 initiale — les deux proprietes sont presentes dans globals.css |
| HEAD-01 | Header sticky fixed avec logo MU et lien retour Shopify | REDO : remplacer div "MU" par next/image conditionnel + mettre l'URL Shopify reelle |
| HEAD-02 | Transition transparent vers blanc au scroll (seuil 80px, 300ms) | COMPLETE depuis Phase 1 initiale — ne change pas |
| HEAD-03 | Effet glassmorphism sur le header au scroll (backdrop-blur 20px) | COMPLETE depuis Phase 1 initiale — ne change pas |
| HEAD-04 | Skip link accessibilite "Aller au contenu" (visible au focus) | COMPLETE depuis Phase 1 initiale — ne change pas |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact sur cette phase |
|-----------|----------------------|
| PAS de Tailwind, PAS de shadcn/ui — CSS Modules uniquement | Styles du logo image dans Header.module.css uniquement |
| TypeScript strict (aucun `any`) | next/image props typees correctement |
| Composants PascalCase, un fichier par composant | Header.tsx inchange comme composant 'use client' |
| Design tokens dans src/app/globals.css | Taille logo en rem ou via variable CSS, pas hardcode |
| Langue francaise | alt du logo en francais, manifest.name en francais |

---

## Resume

Ce REDO de Phase 1 est une mise a jour chirurgicale du Header existant pour remplacer le placeholder "MU" par les vrais assets brand client. Toutes les fonctionnalites FOND et HEAD sont deja implementees — seul HEAD-01 (logo) est modifie en code, et les fichiers favicon/manifest sont nouveaux.

Le travail se decompose en 3 blocs independants : (1) copie des PNG de logo dans `public/brand/` et modification de Header.tsx pour utiliser `next/image` avec src conditionnel selon l'etat `scrolled`, (2) generation des fichiers icone via sips (natif macOS, confirme disponible sur cette machine) et placement dans `src/app/` selon la convention Next.js App Router, (3) creation du manifest.ts et nettoyage des assets Next.js par defaut dans `public/`.

Aucune dependance npm supplementaire n'est requise. `sharp` est deja installe pour l'optimisation next/image. `sips` (macOS natif, confirme disponible) suffit pour la conversion PNG→ICO et les redimensionnements.

**Recommandation principale :** Approche fichiers-convention Next.js App Router — placer `favicon.ico`, `icon.png`, `apple-icon.png` directement dans `src/app/`. Ne pas utiliser la Metadata API `icons:` en parallele (conflit documente). Creer `src/app/manifest.ts` pour le web manifest TypeScript.

---

## Standard Stack

### Core

| Librairie | Version | Usage | Pourquoi standard |
|-----------|---------|-------|-------------------|
| next/image | integre Next.js 16.2.1 | Affichage logo PNG optimise | Optimisation automatique WebP, srcset, lazy loading |
| sips | macOS natif (confirme disponible) | Conversion PNG→ICO et resize PNG | Aucune installation, supporte ICO en ecriture |
| sharp | ^0.34.5 (deja installe) | Resize PNG en build next/image | Deja dans le projet |

### Aucune dependance a ajouter

```bash
# RIEN a installer — tout est disponible dans le projet
```

---

## Architecture Patterns

### Structure de fichiers cible apres REDO Phase 1

```
src/
  app/
    favicon.ico                          # NOUVEAU : convention Next.js
    icon.png                             # NOUVEAU : 32x32, <link rel="icon"> moderne
    apple-icon.png                       # NOUVEAU : 180x180, <link rel="apple-touch-icon">
    manifest.ts                          # NOUVEAU : web manifest TypeScript
    layout.tsx                           # INCHANGE (pas de metadata.icons a ajouter)
    globals.css                          # INCHANGE
  components/
    public/
      Header/
        Header.tsx                       # MODIFIE : div "MU" + span brandName → <Image> conditionnel
        Header.module.css                # MODIFIE : .logo et .brandName → .logoImage

public/
  brand/
    logo-noir.png                        # NOUVEAU : Logo-01.png copie
    logo-blanc.png                       # NOUVEAU : Logo-04.png copie
    icon-192.png                         # NOUVEAU : App Icon 192x192 pour manifest PWA
    icon-512.png                         # NOUVEAU : App Icon 512x512 pour manifest PWA
  # file.svg, globe.svg, next.svg, vercel.svg, window.svg  SUPPRIMES (D-12)
```

### Pattern 1 : next/image avec src conditionnel

**Ce que c'est :** Dans le Client Component `'use client'` existant, le state `scrolled` conditionne la prop `src` du composant `<Image>`. Deux PNG sont dans `public/brand/` — le composant reference leurs chemins publics en string (pas de static import pour eviter le bundle).

**Pourquoi path string et non static import :** Les logos source sont 4168x4167px / 130-142KB. Avec un static import, le build emballe l'image dans le JS client. Avec un path string `/brand/logo-blanc.png`, next/image optimise et sert un WebP redimensionne a la demande.

```tsx
// Source: nextjs.org/docs/app/api-reference/components/image (v16.2.1, verifie 2026-03-25)
import Image from 'next/image'

// Dans le JSX, remplace div .logo + span .brandName :
<Link href="/" className={styles.brand} aria-label="Möbel Unique — Accueil">
  <Image
    src={scrolled ? '/brand/logo-noir.png' : '/brand/logo-blanc.png'}
    alt="Möbel Unique"
    width={144}
    height={144}
    className={styles.logoImage}
    priority
  />
</Link>
```

**Props cles :**
- `width={144} height={144}` : ratio 1:1 = ratio du canvas source PNG (4168x4167, quasi-carre). Evite tout recadrage involontaire.
- `priority` : desactive le lazy loading (image above-the-fold, toujours visible). Empeche le flash logo.
- `className={styles.logoImage}` : CSS controle la taille rendue (height: 36px; width: auto).
- `alt="Möbel Unique"` : le lien parent a `aria-label` complet — alt court suffit.

**CSS dans Header.module.css :**

```css
.logoImage {
  height: 36px;
  width: auto;
  object-fit: contain;
  display: block;
}
```

**Note `width: auto` :** next/image injecte des attributs HTML `width` et `height` sur le `<img>` pour la prevention CLS. CSS `width: auto` prend le dessus pour l'affichage reel. Le browser calcule la largeur proportionnelle a la hauteur 36px.

### Pattern 2 : Convention fichiers Next.js App Router pour les icones

**Regles documentation officielle (verifie nextjs.org v16.2.1, 2026-03-25) :**

| Fichier | Emplacement | Format | HTML genere automatiquement |
|---------|-------------|--------|----------------------------|
| `favicon.ico` | `app/` uniquement | `.ico` | `<link rel="icon" href="/favicon.ico" sizes="any" />` |
| `icon.png` | `app/` | `.ico .jpg .jpeg .png .svg` | `<link rel="icon" href="/icon?..." type="image/png" sizes="32x32" />` |
| `apple-icon.png` | `app/` | `.jpg .jpeg .png` | `<link rel="apple-touch-icon" href="/apple-icon?..." type="image/png" sizes="180x180" />` |
| `manifest.ts` | `app/` | `.ts .js` | `<link rel="manifest" href="/manifest.webmanifest" />` |

**IMPORTANT — Conflit a eviter :** Ne pas utiliser simultanement `metadata.icons` dans `layout.tsx` ET les fichiers convention. Les deux mecanismes s'additionnent et generent des balises `<link>` dupliques. Choisir l'approche fichiers-convention uniquement (recommandee).

### Pattern 3 : Conversion PNG→ICO avec sips

**Confirme en live sur cette machine (Darwin 24.6.0) :**

```bash
# sips supporte com.microsoft.ico en ecriture (verifie avec sips --formats)
# Test live reussi : 4414 bytes generes

# Etape 1 : Redimensionner vers 32x32
sips -z 32 32 "fichier-mobelunique/Favicon/Favicon-04.png" --out /tmp/favicon-32.png

# Etape 2 : Convertir PNG 32x32 en ICO
sips -s format ico /tmp/favicon-32.png --out src/app/favicon.ico
```

**Fallback si sips echoue :** `npm install to-ico` (package v1.1.5) + script Node.js utilisant sharp pour les buffers. Non requis sauf probleme.

### Pattern 4 : manifest.ts TypeScript

```typescript
// src/app/manifest.ts
// Source: nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest (v16.2.1, 2026-03-25)
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Möbel Unique — Canapés personnalisables Paris',
    short_name: 'Möbel Unique',
    description: 'Configurateur IA de canapés personnalisables.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#E49400',
    icons: [
      {
        src: '/brand/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/brand/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

### Anti-Patterns a eviter

- **`metadata.icons` + fichiers convention en parallele** : duplique les `<link>` dans `<head>`. Choisir une seule approche.
- **Static import de PNG 130KB+ dans Header.tsx** : emballe l'image dans le JS client. Utiliser un path string.
- **Omettre `priority` sur le logo header** : lazy loading par defaut provoquerait un flash visible sur l'image above-the-fold.
- **`width/height` de next/image en pixels CSS** : ces props definissent le ratio intrinseque (prevention CLS), pas la taille rendue. La taille rendue est en CSS.
- **Placer `favicon.ico` dans `public/` au lieu de `src/app/`** : servi statiquement mais sans balise `<link>` automatique par Next.js.

---

## Don't Hand-Roll

| Probleme | Ne pas construire | Utiliser | Pourquoi |
|----------|-------------------|----------|----------|
| Optimisation PNG logo | Servir les 130KB bruts | next/image path string | Conversion WebP automatique, resize adaptatif, cache |
| Conversion PNG→ICO | Script Node.js custom | sips (natif macOS) | Confirme disponible, 0 installation requise |
| Tags favicon/apple-touch dans `<head>` | Balises `<link>` manuelles dans layout.tsx | Fichiers convention `src/app/` | Next.js genere les bons attributs automatiquement |
| Web manifest | `public/manifest.json` statique | `src/app/manifest.ts` TypeScript | Type-safe MetadataRoute.Manifest, `<link>` genere auto |

---

## Inventaire des assets brand

### Assets source (dossier non git : fichier-mobelunique/)

| Source | Dimensions | Taille | Destination | Usage |
|--------|-----------|--------|-------------|-------|
| `Logo Design/Logo-01.png` | 4168x4167px | 142KB | `public/brand/logo-noir.png` | Header scrolle (fond blanc) |
| `Logo Design/Logo-04.png` | 4168x4167px | 130KB | `public/brand/logo-blanc.png` | Header transparent (fond sombre) |
| `Favicon/Favicon-04.png` | 268x267px | 5KB | Base pour `src/app/favicon.ico` et `src/app/icon.png` | Favicon navigateur |
| `Appicon/Appicon 1024X1024-01.png` | 2134x2134px | 61KB | `src/app/apple-icon.png` (180px) + `public/brand/icon-192.png` + `public/brand/icon-512.png` | Apple touch icon + manifest PWA |

**Note canvas logo :** Les logos sont sur un canvas quasi-carre 4168x4167. Le logo visible (monogramme cursif + texte) est landscape avec du clear space autour. Specifier `width={144} height={144}` sur `<Image>` (ratio 1:1 = ratio canvas) + CSS `height: 36px; width: auto; object-fit: contain` est l'approche la plus fiable pour eviter tout recadrage.

---

## Pitfalls communs

### Pitfall 1 : Conflit metadata API + fichiers convention

**Ce qui se passe :** Si `layout.tsx` contient `metadata.icons` OU `metadata.manifest` en meme temps que des fichiers `src/app/favicon.ico` / `src/app/icon.png`, Next.js genere des balises `<link>` dupliques.

**Comment eviter :** Choisir l'approche fichiers-convention uniquement. Ne pas toucher `metadata.icons` dans `layout.tsx`. Verifier avec `curl localhost:3000 | grep 'rel="icon"'` apres implementation.

### Pitfall 2 : Logo visible rogne ou distordu

**Ce qui se passe :** Canvas source 1:1 mais logo visible est ~3:1. Si `width=160 height=40` est specifie sur `<Image>`, next/image suppose un ratio 4:1 et peut renvoyer une image mal cadree selon la largeur de viewport.

**Comment eviter :** Specifier `width={144} height={144}` (1:1 = ratio du canvas source) + CSS `height: 36px; width: auto; object-fit: contain`. Le logo entier est preserve avec le clear space naturel.

### Pitfall 3 : Flash logo blanc au rechargement a mi-page

**Ce qui se passe :** SSR rend `scrolled = false` donc logo blanc. Rechargement en milieu de page = bref flash logo blanc avant hydration.

**Statut :** Accepte dans ce projet (cf. STATE.md). Ne pas ajouter de pattern `mounted`. Le flash est invisible dans 95% des cas d'usage normaux (acces via URL depuis Shopify = toujours depuis le haut).

### Pitfall 4 : favicon.ico dans public/ au lieu de src/app/

**Ce qui se passe :** Le fichier est accessible via URL mais Next.js n'injecte pas le `<link rel="icon">` tag automatiquement.

**Comment eviter :** Placer tous les fichiers convention (`favicon.ico`, `icon.png`, `apple-icon.png`, `manifest.ts`) dans `src/app/` uniquement.

### Pitfall 5 : sips ICO mono-taille

**Impact :** sips produit un ICO a une seule taille (32x32). Acceptable pour navigateurs modernes. L'ICO multi-taille n'est necessaire que pour IE11 et bookmarks Windows anciens — hors scope.

---

## Script de preparation des assets

```bash
# Executer depuis la racine du projet (/Users/salah/Desktop/projetmobelunique)

# 1. Dossier public/brand/
mkdir -p public/brand

# 2. Logos header
cp "fichier-mobelunique/Logo Design/Logo-01.png" public/brand/logo-noir.png
cp "fichier-mobelunique/Logo Design/Logo-04.png" public/brand/logo-blanc.png

# 3. favicon.ico (32x32, convention app/)
sips -z 32 32 "fichier-mobelunique/Favicon/Favicon-04.png" --out /tmp/mu-favicon-32.png
sips -s format ico /tmp/mu-favicon-32.png --out src/app/favicon.ico
rm /tmp/mu-favicon-32.png

# 4. icon.png (32x32, convention app/)
sips -z 32 32 "fichier-mobelunique/Favicon/Favicon-04.png" --out src/app/icon.png

# 5. apple-icon.png (180x180, convention app/)
sips -z 180 180 "fichier-mobelunique/Appicon/Appicon 1024X1024-01.png" --out src/app/apple-icon.png

# 6. Icones manifest PWA
sips -z 192 192 "fichier-mobelunique/Appicon/Appicon 1024X1024-01.png" --out public/brand/icon-192.png
sips -z 512 512 "fichier-mobelunique/Appicon/Appicon 1024X1024-01.png" --out public/brand/icon-512.png

# 7. Supprimer assets Next.js par defaut (D-12)
rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

---

## State of the Art

| Ancienne approche | Approche actuelle | Quand change | Impact |
|-------------------|------------------|--------------|--------|
| `<link rel="icon">` manuel dans `_document.tsx` (Pages Router) | Fichiers convention `favicon.ico`, `icon.png` dans `app/` | Next.js 13.3 (App Router) | Zero config, tags generes automatiquement |
| ICO multi-taille obligatoire | ICO mono-taille + `icon.png` moderne | ~2021 (navigateurs modernes) | Workflow simplifie — sips suffit |
| `public/manifest.json` statique | `app/manifest.ts` TypeScript | Next.js 13.3 | Type-safe, `<link>` auto |

**Deprecie :**
- Pages Router `_document.tsx` avec `<Head>` manuel — remplace par conventions App Router
- Favicon multi-taille complexe — les navigateurs modernes preferent PNG ou SVG

---

## Questions ouvertes

1. **Dimensions CSS exactes du logo dans le header**
   - Ce que l'on sait : header-height = 64px, clear space = hauteur du "M" selon Brand Style Guide
   - Ce qui est flou : la hauteur exacte du "M" dans le logo source (necessite inspection visuelle)
   - Recommandation : commencer avec `height: 36px` (56% de 64px), ajuster visuellement

2. **Transition swap logo blanc/noir**
   - Ce que l'on sait : la transition couleur du header est 300ms ease (`--transition-fast`)
   - Ce qui est flou : est-ce que le swap d'image doit aussi etre anime (cross-fade) ou instantane ?
   - Recommandation : instantane par defaut (le header lui-meme s'anime, le logo suit). Ajouter `transition: opacity 0.3s ease` sur `.logoImage` si le flash est visible en test

---

## Environment Availability

| Dependance | Requise pour | Disponible | Version | Fallback |
|------------|-------------|------------|---------|----------|
| sips | Conversion PNG→ICO, resize | oui | macOS natif (Darwin 24.6.0, confirme) | to-ico npm v1.1.5 |
| sharp | Optimisation next/image (build) | oui | ^0.34.5 | — |
| next/image | Logo header optimise | oui | integre Next.js 16.2.1 | — |
| fichier-mobelunique/ | Assets brand source | oui (non git, confirme present) | — | Bloquant si absent |

**Aucune dependance manquante bloquante.**

---

## Validation Architecture

> workflow.nyquist_validation absent de .planning/config.json — traite comme enabled.

### Cadre de test

| Propriete | Valeur |
|-----------|--------|
| Framework | Aucun framework de test installe (pas de jest.config, vitest.config detectes) |
| Config | — |
| Commande rapide | `npx tsc --noEmit` + `npm run build` |
| Suite complete | `npx tsc --noEmit` |

### Map Requirements → Tests

| ID | Comportement | Type | Commande automatisee | Fichier existe ? |
|----|-------------|------|---------------------|-----------------|
| HEAD-01 | Logo PNG s'affiche dans le header | Visuel | `npm run build` sans erreur TypeScript | Header.tsx (a modifier) |
| HEAD-01 | Logo blanc quand header transparent | Visuel manuel | Inspection browser `localhost:3000` scroll en haut | N/A |
| HEAD-01 | Logo noir quand header scrolle 80px+ | Visuel manuel | Inspection browser `localhost:3000` scroll bas | N/A |
| D-08 | URL Shopify reelle dans lien droit | Integration | `curl -s localhost:3000 \| grep 'mobelunique.fr'` | N/A |
| D-04 | favicon.ico genere le bon tag `<link>` | Integration | `curl -s localhost:3000 \| grep 'favicon'` | N/A (a creer) |
| D-05 | apple-icon.png genere `<link rel="apple-touch-icon">` | Integration | `curl -s localhost:3000 \| grep 'apple-touch-icon'` | N/A (a creer) |
| D-06 | manifest.ts genere `<link rel="manifest">` | Integration | `curl -s localhost:3000 \| grep 'manifest'` | N/A (a creer) |
| D-12 | Assets Next.js par defaut supprimes de public/ | Filesystem | `ls public/*.svg 2>/dev/null \| wc -l` doit retourner 0 | Oui (5 fichiers a supprimer) |

### Wave 0 Gaps

Aucun test unitaire requis pour cette phase (manipulation d'assets et modification composant visuel). Les validations `curl` et `npm run build` sont executables sans framework.

---

## Sources

### Primaires (confiance HIGH)

- [nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons) — conventions favicon, icon, apple-icon (v16.2.1, date doc 2026-03-25)
- [nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest) — manifest.ts TypeScript (v16.2.1, date doc 2026-03-25)
- [nextjs.org/docs/app/api-reference/components/image](https://nextjs.org/docs/app/api-reference/components/image) — next/image props src, width, height, priority (v16.2.1, date doc 2026-03-25)
- Test live sips sur la machine (Darwin 24.6.0) — conversion PNG→ICO confirmee, ICO 4414 bytes genere
- Dimensions PNG lues directement depuis les fichiers source (bytes 16-23 header PNG) — confirme 4168x4167 logos, 268x267 favicon, 2134x2134 appicons

### Secondaires (confiance MEDIUM)

- [unwrite.co/blog/nextjs-15-favicon-app-router-guide/](https://unwrite.co/blog/nextjs-15-favicon-app-router-guide/) — guide pratique favicon Next.js 15/16, verifie contre docs officielles

### Tertiaires (confiance LOW — non utilisees dans les recommandations)

- WebSearch "sips macOS PNG to ICO" — sources contradictoires sur le support ICO natif (remplacees par test live)

---

## Metadata

**Confidence breakdown :**
- Conventions Next.js favicon/manifest : HIGH — documentation officielle v16.2.1 consultee le 2026-03-25
- next/image props conditionnel : HIGH — documentation officielle v16.2.1
- Conversion sips PNG→ICO : HIGH — confirme par test live sur cette machine
- Dimensions des assets brand : HIGH — lues directement depuis les bytes PNG

**Research date :** 2026-03-27
**Valide jusqu'a :** 2026-04-27 (stack stable, pas de changements breaking attendus sur Next.js 16.x)
