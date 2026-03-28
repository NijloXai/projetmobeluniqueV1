---
phase: 01-fondation-header
verified: 2026-03-27T02:30:00Z
status: human_needed
score: 6/6 must-haves REDO verifies
re_verification: true
previous_status: human_needed
previous_score: 7/8 must-haves verified automatiquement
gaps_closed:
  - "HEAD-01 REDO — vrai logo PNG Mobel Unique remplace le carre ambre MU"
  - "Lien Shopify corrige : href='#' -> https://www.mobelunique.fr/"
  - "Favicon Mobel Unique (favicon.ico + icon.png + apple-icon.png) en place"
  - "Manifest PWA cree (src/app/manifest.ts, MetadataRoute.Manifest)"
  - "5 SVG Next.js par defaut supprimes de public/"
  - "Warning anti-pattern href='#' resolu"
gaps_remaining: []
regressions: []
human_verification:
  - test: "Swap logo blanc/noir au scroll"
    expected: "Logo blanc (logo-white.png) sur hero sombre, logo noir (logo-black.png) apres scroll 80px — swap instantane via src conditionnel next/image"
    why_human: "L'implementation next/image avec src conditionnel est correcte dans le code, mais le rendu visuel reel du swap blanc/noir ne peut etre confirme que dans un navigateur"
  - test: "Favicon Mobel Unique dans l'onglet navigateur"
    expected: "L'onglet affiche le favicon cursif Mobel Unique, plus le triangle orange Next.js par defaut"
    why_human: "favicon.ico (32x32) et icon.png (32x32) sont en place dans src/app/, mais le rendu onglet necessite un navigateur"
  - test: "Scroll 80px — transition transparente vers blanche avec ombre visible"
    expected: "Au-dela de 80px de scroll, le header devient blanc (rgba(252,249,245,0.92)) avec backdrop-blur(20px) et box-shadow en 300ms"
    why_human: "La logique JS et le CSS sont correctement cables, mais le declenchement visuel ne peut etre valide que dans un vrai navigateur"
  - test: "Skip link visible au focus Tab"
    expected: "Un appui sur Tab fait apparaitre le lien 'Aller au contenu' en ambre en haut a gauche (top: var(--spacing-md))"
    why_human: "Le CSS :focus est present (top: -100% -> top: spacing-md), mais le comportement focus ne peut etre valide que dans un navigateur"
  - test: "Responsive header sur mobile (375px) et tablette (640px)"
    expected: "Header visible a 24px de padding sur mobile/tablette, 48px a partir de 1024px, 64px a partir de 1280px"
    why_human: "Les breakpoints sont dans le CSS, mais le rendu multi-breakpoint necessite DevTools ou un vrai appareil"
  - test: "Titre SEO dans l'onglet navigateur"
    expected: "L'onglet affiche 'Accueil | Mobel Unique' sur http://localhost:3000"
    why_human: "Next.js compose le titre a l'execution — la logique est correcte mais le rendu final de l'onglet est a confirmer visuellement"
---

# Phase 1 : Fondation CSS et Header Sticky — Rapport de verification (REDO)

**Objectif de phase :** La fondation CSS est en place et le header sticky est visible et fonctionnel sur toute la page (REDO — vrais assets brand remplacant le placeholder "MU")
**Verifie :** 2026-03-27T02:30:00Z
**Statut :** human_needed (6/6 must-haves REDO verifies, comportements visuels a confirmer en navigateur)
**Re-verification :** Oui — apres execution du Plan 02 (brand assets + logo conditionnel)

---

## Realisation de l'objectif

### Verites observables (must_haves REDO — Plan 02)

| #  | Verite                                                                                     | Statut          | Preuve                                                                                                                        |
|----|-------------------------------------------------------------------------------------------|-----------------|-------------------------------------------------------------------------------------------------------------------------------|
| 1  | Le header affiche le vrai logo Mobel Unique PNG au lieu du carre ambre MU                 | VERIFIE         | Header.tsx L30-37 : `<Image src={...} className={styles.logoImage} priority />`. Blocs .logo et .brandName absents de Header.module.css. |
| 2  | Le logo est blanc sur hero sombre, noir apres scroll 80px                                 | VERIFIE (code)  | Header.tsx L31 : `src={scrolled ? '/brand/logo-black.png' : '/brand/logo-white.png'}`. Les deux PNG existent (133KB, 145KB). Rendu visuel a confirmer. |
| 3  | Le lien Retour a la boutique pointe vers https://www.mobelunique.fr/ dans le meme onglet  | VERIFIE         | Header.tsx L40 : `href="https://www.mobelunique.fr/"`. Aucun `target`. Aucun `noreferrer`. rel="noopener" seul. |
| 4  | Le favicon Mobel Unique apparait dans l'onglet du navigateur                              | VERIFIE (code)  | src/app/favicon.ico (4414 octets), src/app/icon.png (32x32, 1003 octets). Rendu onglet a confirmer. |
| 5  | Le manifest web est servi a /manifest.webmanifest avec les icones PWA                     | VERIFIE         | src/app/manifest.ts : MetadataRoute.Manifest, export default, theme_color '#E49400'. Icons /brand/icon-192.png (192x192) et /brand/icon-512.png (512x512). |
| 6  | Les 5 fichiers SVG par defaut de Next.js sont supprimes de public/                        | VERIFIE         | `ls public/*.svg` : "no matches found". `ls public/` : contient uniquement `brand/`. |

**Score REDO :** 6/6 must-haves verifies (4 certains, 2 avec confirmation visuelle requise)

---

### Artefacts requis (Plan 02)

| Artefact                                          | Attendu                                         | Statut    | Details                                                          |
|---------------------------------------------------|-------------------------------------------------|-----------|------------------------------------------------------------------|
| `public/brand/logo-white.png`                     | Logo blanc, >100KB                              | VERIFIE   | 133236 octets, 4168x4167px (sips confirme)                       |
| `public/brand/logo-black.png`                     | Logo noir, >100KB                               | VERIFIE   | 145184 octets, 4168x4167px (sips confirme)                       |
| `public/brand/icon-192.png`                       | Icone PWA 192x192                               | VERIFIE   | 7371 octets, 192x192px (sips confirme)                           |
| `public/brand/icon-512.png`                       | Icone PWA 512x512                               | VERIFIE   | 26089 octets, 512x512px (sips confirme)                          |
| `src/app/favicon.ico`                             | Favicon ICO >0 octets                           | VERIFIE   | 4414 octets                                                      |
| `src/app/icon.png`                                | Icon PNG 32x32                                  | VERIFIE   | 1003 octets, 32x32px (sips confirme)                             |
| `src/app/apple-icon.png`                          | Apple touch icon 180x180                        | VERIFIE   | 6805 octets, 180x180px (sips confirme)                           |
| `src/app/manifest.ts`                             | MetadataRoute.Manifest, export default          | VERIFIE   | 25 lignes. `import type { MetadataRoute } from 'next'`. Export default. theme_color '#E49400'. |
| `src/components/public/Header/Header.tsx`         | next/image avec src conditionnel scrolled       | VERIFIE   | 50 lignes. `import Image from 'next/image'` L4. src conditionnel L31. `priority` L36. |
| `src/components/public/Header/Header.module.css`  | .logoImage present, .logo et .brandName absents | VERIFIE   | 98 lignes. .logoImage L62-67 (height:36px; width:auto; object-fit:contain). .logo absent. .brandName absent. |

---

### Verification des liens cles (cablage)

| De                             | Vers                                                 | Via                                       | Statut | Details                                                                       |
|--------------------------------|------------------------------------------------------|-------------------------------------------|--------|-------------------------------------------------------------------------------|
| `Header.tsx`                   | `/brand/logo-white.png`, `/brand/logo-black.png`     | `Image src` conditionnel sur `scrolled`   | CABLE  | L31 : `src={scrolled ? '/brand/logo-black.png' : '/brand/logo-white.png'}`   |
| `src/app/manifest.ts`          | `/brand/icon-192.png`, `/brand/icon-512.png`         | `icons` array MetadataRoute.Manifest      | CABLE  | L13-23 : src `/brand/icon-192.png` et `/brand/icon-512.png` presents          |
| `Header.tsx`                   | `https://www.mobelunique.fr/`                        | `href` du lien Shopify                    | CABLE  | L40 : `href="https://www.mobelunique.fr/"` confirme                           |
| `page.tsx`                     | `Header/Header.tsx`                                  | import named export Header                | CABLE  | Inchange depuis Plan 01 — verifie lors de la verification initiale             |
| `Header.tsx`                   | `main#main-content`                                  | href='#main-content' dans skip link       | CABLE  | Inchange depuis Plan 01 — verifie lors de la verification initiale             |

---

### Trace de flux de donnees (Niveau 4)

Non applicable. Le Header est un composant interactif avec etat de scroll local (`useState(false)`) — pas de donnees distantes ou BDD. Les logos sont des assets statiques, pas des donnees dynamiques.

---

### Verifications comportementales (Spot-checks)

| Comportement                                 | Commande                              | Resultat              | Statut |
|----------------------------------------------|---------------------------------------|-----------------------|--------|
| TypeScript strict compile sans erreur        | `npx tsc --noEmit`                    | Exit code 0           | PASSE  |
| logo-white.png existe et >100KB              | `ls -la public/brand/logo-white.png`  | 133236 octets         | PASSE  |
| logo-black.png existe et >100KB              | `ls -la public/brand/logo-black.png`  | 145184 octets         | PASSE  |
| icon-192.png dimensions correctes            | sips                                  | 192x192               | PASSE  |
| icon-512.png dimensions correctes            | sips                                  | 512x512               | PASSE  |
| icon.png 32x32                               | sips                                  | 32x32                 | PASSE  |
| apple-icon.png 180x180                       | sips                                  | 180x180               | PASSE  |
| Aucun SVG Next.js dans public/               | `ls public/*.svg`                     | No matches found      | PASSE  |
| .logo absent de Header.module.css            | grep                                  | Aucune correspondance | PASSE  |
| .brandName absent de Header.module.css       | grep                                  | Aucune correspondance | PASSE  |
| `import Image from 'next/image'` present     | grep                                  | L4 confirme           | PASSE  |
| src conditionnel blanc/noir present          | grep                                  | L31 confirme          | PASSE  |
| href Shopify reel present                    | grep                                  | L40 confirme          | PASSE  |
| Pas de target="_blank"                       | grep                                  | Aucune correspondance | PASSE  |
| rel="noopener" seul (pas noreferrer)         | grep                                  | Aucune correspondance | PASSE  |
| Commits 623feee et 6aa8667 existent          | `git show --stat`                     | Les 2 commits present | PASSE  |

---

### Couverture des exigences

| Exigence | Plan source  | Description                                               | Statut           | Preuve                                                                              |
|----------|--------------|-----------------------------------------------------------|------------------|-------------------------------------------------------------------------------------|
| FOND-01  | 01-01-PLAN   | Page publique remplace le template Next.js par defaut     | SATISFAIT        | Verifie Plan 01. Aucune regression constatee.                                       |
| FOND-02  | 01-01-PLAN   | Metadata publique (titre, description pour SEO)           | SATISFAIT        | Verifie Plan 01. Aucune regression constatee.                                       |
| FOND-03  | 01-01-PLAN   | Responsive 4 breakpoints (mobile/tablet/desktop/large)    | SATISFAIT        | Header.module.css @media 1024px et 1280px intacts. Aucune regression.               |
| FOND-04  | 01-01-PLAN   | scroll-padding-top et scroll-behavior smooth dans globals | SATISFAIT        | Verifie Plan 01. Aucune regression constatee.                                       |
| HEAD-01  | 01-02-PLAN   | Header avec vrai logo brand et lien Shopify reel          | SATISFAIT        | next/image conditionnel, href mobelunique.fr, .logoImage. REDO complet et verifie. |
| HEAD-02  | 01-01-PLAN   | Transition transparent -> blanc au scroll (seuil 80px)    | SATISFAIT (code) | Inchange depuis Plan 01. scrollY > 80, .scrolled, transition 300ms.                |
| HEAD-03  | 01-01-PLAN   | Effet glassmorphism sur le header au scroll               | SATISFAIT        | Inchange depuis Plan 01. .scrolled : backdrop-filter: blur(20px).                  |
| HEAD-04  | 01-01-PLAN   | Skip link accessibilite "Aller au contenu"                | SATISFAIT (code) | Inchange depuis Plan 01. .skipLink + .skipLink:focus presents.                     |

**Exigences orphelines :** Aucune. Les 8 IDs (FOND-01 a FOND-04, HEAD-01 a HEAD-04) dans REQUIREMENTS.md sont tous assignes a la Phase 1, couverts par les plans 01 et 02, et marques [x] dans REQUIREMENTS.md.

---

### Anti-patterns detectes

| Fichier | Ligne | Pattern | Severite | Impact |
|---------|-------|---------|----------|--------|
| —       | —     | —       | —        | —      |

Aucun anti-pattern. Le warning `href="#"` de la verification initiale est resolu (href="https://www.mobelunique.fr/"). Aucun TODO/FIXME/PLACEHOLDER, aucun `return null`, aucun `console.log` residuel.

---

### Verifications comportementales a effectuer par l'humain

#### 1. Swap logo blanc/noir au scroll

**Test :** Ouvrir http://localhost:3000 (`npm run dev`). Observer le logo dans le header sur le fond hero sombre (doit etre blanc). Scroller lentement au-dela de 80px.
**Attendu :** Le logo passe de blanc (logo-white.png) a noir (logo-black.png) en meme temps que la transition de transparence du header (300ms).
**Pourquoi humain :** Le src conditionnel `scrolled ? '/brand/logo-black.png' : '/brand/logo-white.png'` est cable, mais le rendu visuel reel du swap et la lisibilite des logos necessitent un navigateur.

#### 2. Favicon dans l'onglet

**Test :** Ouvrir http://localhost:3000 et regarder l'onglet navigateur.
**Attendu :** L'onglet affiche le favicon cursif Mobel Unique, pas le triangle orange Next.js par defaut. Sur mobile Safari, l'icone d'ajout a l'ecran utilise apple-icon.png (180x180).
**Pourquoi humain :** favicon.ico et icon.png sont en place dans src/app/, mais le rendu onglet necessite un navigateur.

#### 3. Transition scroll header

**Test :** Sur http://localhost:3000, scroller lentement au-dela de 80px.
**Attendu :** Le header passe de transparent a rgba(252,249,245,0.92) avec backdrop-blur(20px) et box-shadow en 300ms.
**Pourquoi humain :** La logique JS et le CSS sont cables — comportement visuel a confirmer.

#### 4. Skip link au focus Tab

**Test :** Sur http://localhost:3000, appuyer sur la touche Tab.
**Attendu :** Le lien "Aller au contenu" apparait en haut a gauche avec un fond ambre.
**Pourquoi humain :** CSS :focus present mais comportement focus ne peut etre confirme que visuellement.

#### 5. Titre SEO dans l'onglet

**Test :** Ouvrir http://localhost:3000 et regarder l'onglet.
**Attendu :** L'onglet affiche "Accueil | Mobel Unique".
**Pourquoi humain :** Next.js compose le titre a l'execution.

#### 6. Responsive header

**Test :** Ouvrir DevTools > mode responsive. Tester 375px, 640px, 1024px, 1280px.
**Attendu :** Padding 24px de 0 a 1023px, 48px a partir de 1024px, 64px a partir de 1280px. Logo visible a toutes les tailles.
**Pourquoi humain :** Les @media queries sont presentes mais le rendu multi-breakpoint necessite DevTools.

---

## Resume

Le REDO de la Phase 1 est completement implemente. Les 6 must-haves du Plan 02 sont tous verifies : 4 avec certitude absolue (lien Shopify reel, manifest PWA, suppression SVG par defaut, dimensions des assets PNG) et 2 avec confirmation visuelle requise (swap logo blanc/noir, favicon dans onglet). TypeScript compile sans erreur (exit code 0). Aucun anti-pattern residuel — le warning `href="#"` de la verification initiale est resolu.

Les 8 exigences (FOND-01 a FOND-04, HEAD-01 a HEAD-04) sont toutes satisfaites et marquees [x] dans REQUIREMENTS.md. Aucune regression sur les artefacts du Plan 01.

Les items en attente de verification humaine concernent uniquement des **comportements de rendu navigateur** : swap visuel du logo blanc/noir, rendu favicon dans onglet, et les comportements interactifs (scroll, focus, titre SEO, responsive). Ces validations ne requierent pas de modifications de code.

---

_Verifie : 2026-03-27_
_Verificateur : Claude (gsd-verifier)_
