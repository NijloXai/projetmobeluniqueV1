# Domain Pitfalls — M007 Header + Hero + Comment ca marche

**Domain:** Next.js 16 App Router — Frontend public statique (header sticky, hero plein ecran, section 3 etapes)
**Researched:** 2026-03-26
**Overall confidence:** HIGH (verifie via docs officielles Next.js + sources multiples)

---

## Pitfalls Critiques

Ces erreurs provoquent des rerewrites, des bugs invisibles en dev qui apparaissent en prod, ou bloquent le build TypeScript.

---

### Pitfall 1 : `window is not defined` au SSR — Header scroll state

**Phase concernee :** Header sticky (FRONT-01)

**Ce qui se passe :**
Le Header utilise `useEffect` + `addEventListener('scroll')` pour basculer transparent → blanc.
Meme avec `'use client'`, Next.js execute une passe SSR initiale. Si le code accede a `window` ou `document` *en dehors* d'un `useEffect` (par exemple en initialisant l'etat avec `window.scrollY`), le build crashe avec `ReferenceError: window is not defined`.

**Exemple dangereux :**
```typescript
// INTERDIT — window n'existe pas cote serveur
const [scrolled, setScrolled] = useState(window.scrollY > 80)
```

**Exemple correct :**
```typescript
'use client'
const [scrolled, setScrolled] = useState(false) // false = valeur safe SSR

useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 80)
  window.addEventListener('scroll', handler, { passive: true })
  return () => window.removeEventListener('scroll', handler)
}, [])
```

**Prevention :**
- Toujours initialiser les states lies a `window` a une valeur neutre (`false`, `0`, `null`).
- Acceder a `window` uniquement a l'interieur de `useEffect`.
- Ne jamais utiliser `typeof window !== 'undefined'` comme garde au niveau du state initial — ca cause une erreur d'hydratation.

**Detection :** Build error `ReferenceError: window is not defined` ou hydration warning `Prop mismatch` en console.

---

### Pitfall 2 : Hydration mismatch — etat scroll different SSR vs client

**Phase concernee :** Header sticky (FRONT-01)

**Ce qui se passe :**
Le serveur rend le header en etat "transparent" (scrolled = false). Si le navigateur a un scroll > 80px au moment de l'hydratation (ex : rechargement en milieu de page), React detecte une discordance entre le HTML serveur et le rendu client. Ca produit un warning ou un flash visible.

**Prevention :**
- Utiliser `suppressHydrationWarning` sur l'element `<header>` si la classe CSS change selon le scroll.
- Ou mieux : appliquer la classe scroll via `useEffect` *apres* l'hydratation, jamais pendant le premier rendu.
- Pattern recommande :

```typescript
const [mounted, setMounted] = useState(false)

useEffect(() => { setMounted(true) }, [])

// Classes appliquees uniquement apres hydratation
const headerClass = mounted && scrolled ? styles.scrolled : styles.header
```

**Detection :** Warning React `Hydration failed because the initial UI does not match` dans la console navigateur.

---

### Pitfall 3 : `'use client'` boundary trop haute — bundle inutilement grossi

**Phase concernee :** Architecture composants (FRONT-01, FRONT-02, FRONT-03)

**Ce qui se passe :**
Si `page.tsx` (page publique) recoit `'use client'` pour supporter le scroll du Header, **toute** la page bascule en client component. Les sections Hero et "Comment ca marche" — qui sont purement statiques — perdent leurs benefices SSR et gonflent le bundle JS.

**Mauvaise approche :**
```typescript
// page.tsx
'use client' // <- pour gerer le scroll du header
export default function Home() {
  return <><Header /><Hero /><HowItWorks /></>
}
```

**Bonne approche :**
```
src/app/page.tsx          → Server Component (pas de 'use client')
src/components/public/
  Header.tsx              → 'use client' (scroll listener)
  Hero.tsx                → Server Component (statique)
  HowItWorks.tsx          → Server Component (statique)
```

`page.tsx` importe `Header`, `Hero`, `HowItWorks` sans `'use client'`. Seul `Header.tsx` a la directive.

**Detection :** Verifier avec Next.js DevTools que `Hero` et `HowItWorks` sont bien Server Components dans le bundle.

---

### Pitfall 4 : `100vh` incorrectement rendu sur mobile (barre d'adresse)

**Phase concernee :** Hero plein ecran (FRONT-02)

**Ce qui se passe :**
Sur iOS Safari et Chrome Android, `100vh` est calcule avec la barre d'adresse *cachee*. Au chargement, la barre d'adresse est visible, ce qui fait deborder le hero de l'ecran et cache le CTA en bas.

**Ne pas utiliser :**
```css
.hero {
  height: 100vh; /* incorrecte sur mobile */
}
```

**Solution recommandee (2025) :**
```css
.hero {
  height: 100svh; /* svh = Small Viewport Height, barre visible incluse */
}

/* Fallback pour navigateurs < 2022 */
@supports not (height: 100svh) {
  .hero {
    height: 100vh;
    min-height: -webkit-fill-available;
  }
}
```

`100svh` est supporte par tous les navigateurs modernes (Chrome 108+, Safari 15.4+, Firefox 101+). C'est la solution la plus propre en 2025.

**Detection :** Tester sur un vrai iPhone via Safari. Le CTA du hero ne doit pas etre coupe.

---

### Pitfall 5 : `next/image` avec `fill` — container parent sans `position: relative`

**Phase concernee :** Hero plein ecran avec image de fond (FRONT-02)

**Ce qui se passe :**
`<Image fill />` positionne l'image en `position: absolute`. Si le parent n'a pas `position: relative` (ou `absolute`/`fixed`), l'image s'echappe du container et couvre la page entiere.

**Erreur classique :**
```typescript
<section className={styles.hero}>
  {/* parent sans position: relative */}
  <Image src="/hero.jpg" fill alt="" />
</section>
```

**Prevention :**
```css
/* hero.module.css */
.hero {
  position: relative;   /* OBLIGATOIRE pour fill */
  height: 100svh;
  overflow: hidden;     /* coupe l'image si elle deborde */
}
```

```typescript
<Image
  src="/images/hero.jpg"
  fill
  priority               /* LCP — image above the fold */
  sizes="100vw"          /* evite le telechargement d'images trop grandes */
  style={{ objectFit: 'cover' }}
  alt=""                 /* alt vide car image decorative */
/>
```

**Ne pas oublier :**
- `priority` est obligatoire sur le hero — c'est le LCP de la page. Sans lui, Next.js lazy-loade l'image et le score Lighthouse chute.
- `sizes="100vw"` evite que le navigateur telecharge une image 3200px sur un ecran 375px.
- `alt=""` est correct pour une image purement decorative (fond).

**Detection :** Image qui couvre toute la page, ou Lighthouse LCP > 4s.

---

### Pitfall 6 : Image hero absente du dossier `public/` au build

**Phase concernee :** Hero plein ecran (FRONT-02)

**Ce qui se passe :**
Le dossier `public/` actuel ne contient que les SVGs du template Next.js (`next.svg`, `vercel.svg`, etc.). Il n'y a pas d'image hero. Si le composant Hero reference `/images/hero.jpg` sans que le fichier existe, Next.js build sans erreur mais affiche un 404 en runtime (l'image est manquante silencieusement).

**Prevention :**
- Creer `public/images/` et y placer l'image hero AVANT d'implanter le composant.
- Dimensionnement recommande : 1920x1080px, format WebP, < 300 Ko (Next.js optimise automatiquement, mais partir d'un fichier leurd ralentit le serveur de dev).
- Si l'image vient de Supabase Storage, configurer `remotePatterns` dans `next.config.ts` :

```typescript
// next.config.ts — actuellement vide, a configurer si image externe
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}
```

**Detection :** 404 en console navigateur sur l'URL `/images/hero.jpg` ou erreur `Un-configured Host` si image externe.

---

## Pitfalls Moderes

Ces erreurs degradent la qualite visuelle, les performances ou l'accessibilite, mais ne bloquent pas le build.

---

### Pitfall 7 : Event listener scroll sans `{ passive: true }` — performance mobile

**Phase concernee :** Header sticky (FRONT-01)

**Ce qui se passe :**
Sans `{ passive: true }`, le navigateur attend que le handler JS se termine avant de laisser l'utilisateur scroller. Sur mobile, ca cree un lag perceptible sur le scroll.

**Prevention :**
```typescript
window.addEventListener('scroll', handler, { passive: true })
```

**Detection :** Chrome DevTools > Performance > "Forced reflow" ou warning "Added non-passive event listener to a scroll-blocking event".

---

### Pitfall 8 : Fuite memoire — listener scroll sans cleanup dans `useEffect`

**Phase concernee :** Header sticky (FRONT-01)

**Ce qui se passe :**
Si le composant Header est demonte (navigation SPA) sans supprimer le listener, le handler continue de tourner en fond et peut provoquer des setState sur un composant demonte.

**Prevention — pattern obligatoire :**
```typescript
useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 80)
  window.addEventListener('scroll', handler, { passive: true })

  // Cleanup obligatoire
  return () => window.removeEventListener('scroll', handler)
}, []) // tableau vide = une seule inscription
```

**Attention :** Passer exactement la meme reference de fonction a `addEventListener` et `removeEventListener`. Une fonction inline dans le cleanup ne retirera pas le bon listener.

**Detection :** Warning React `Warning: Can't perform a React state update on an unmounted component`.

---

### Pitfall 9 : `page.module.css` du template — conflit dark mode et tokens

**Phase concernee :** Remplacement du template (FRONT-01 / FRONT-02)

**Ce qui se passe :**
Le fichier `page.module.css` existant contient :
- Des variables locales `--background`, `--foreground` qui shadent les tokens globaux.
- Un bloc `@media (prefers-color-scheme: dark)` qui inverse les couleurs en mode sombre.
- Une reference a `--font-geist-sans` qui n'est pas chargee dans ce projet.

Remplacer `page.tsx` sans supprimer `page.module.css` (ou en important encore l'ancien fichier) peut provoquer des conflits CSS inattendus.

**Prevention :**
- Supprimer entierement `page.module.css` lors de la réécriture de `page.tsx`.
- Creer un nouveau `page.module.css` vide ou specifique a la page publique.
- Ne jamais dupliquer les tokens — utiliser exclusivement les variables de `globals.css`.
- Ne pas ajouter de `@media (prefers-color-scheme: dark)` — le projet n'a pas de dark mode prevu.

**Detection :** Fond noir en mode sombre systeme, ou texte blanc invisible sur fond blanc.

---

### Pitfall 10 : `backdrop-filter: blur()` — prefixe `-webkit-` manquant

**Phase concernee :** Glassmorphism header au scroll (FRONT-01)

**Ce qui se passe :**
La charte graphique definit un effet glassmorphism pour le header scrolle :
```css
background: rgba(252, 249, 245, 0.8);
backdrop-filter: blur(20px);
```
Sans `-webkit-backdrop-filter`, l'effet ne s'affiche pas sur Safari (iOS et macOS) pour les versions < Safari 17.

**Prevention — toujours les deux proprietes :**
```css
.headerScrolled {
  background: rgba(252, 249, 245, 0.8);
  -webkit-backdrop-filter: blur(20px); /* Safari < 17 */
  backdrop-filter: blur(20px);
}
```

**Valeur de blur recommandee :** 12-16px. Au-dela de 20px, l'effet devient GPU-intensif sur mobile. Rester proche des 12px pour le header.

**Detection :** Tester sur Safari iOS — le header doit etre translucide, pas opaque.

---

### Pitfall 11 : CSS Modules — conflit de specifite avec `globals.css`

**Phase concernee :** Tous les composants (FRONT-01 a FRONT-05)

**Ce qui se passe :**
`globals.css` definit des regles globales sur `img { max-width: 100%; height: auto; }` et sur `button { cursor: pointer; }`. Ces regles ont une specifite de 0-0-1 (element selector). Un CSS Module qui stylise `.icon` sans specifier les dimensions peut entrer en conflit si la regle globale sur `img` s'applique a une image imbriquee.

De plus, Next.js ne garantit pas l'ordre de chargement des CSS Modules quand plusieurs sont charges dans la meme page (issue connue #10148). La specifite determinera quelle regle gagne — ce qui peut varier selon l'ordre de navigation.

**Prevention :**
- Toujours specifier explicitement `width` et `height` dans les CSS Modules pour les images et icons.
- Ne pas faire de `composes` depuis `globals.css` (non supporte en Next.js App Router).
- Utiliser les tokens CSS (`var(--color-primary)`) dans les modules au lieu de valeurs codees en dur.
- Pour les styles d'etats (`:hover`, `:focus`), toujours les ecrire dans le module du composant, pas dans globals.

**Detection :** Styles qui "sautent" apres navigation, ou styles differents entre premier chargement et navigation SPA.

---

### Pitfall 12 : Metadata titre — layout.tsx indique "Back-office"

**Phase concernee :** Initialisation page publique (FRONT-01)

**Ce qui se passe :**
Le `layout.tsx` racine contient :
```typescript
export const metadata: Metadata = {
  title: "Möbel Unique — Back-office",
  description: "Administration Möbel Unique — Visualisation IA...",
}
```

La page publique herite de ce titre "Back-office" si elle ne definit pas sa propre metadata. C'est incorrect et mauvais pour le SEO.

**Prevention :**
- Utiliser le pattern `title.template` dans `layout.tsx` :

```typescript
export const metadata: Metadata = {
  title: {
    template: '%s | Möbel Unique',
    default: 'Möbel Unique — Canapés personnalisables Paris',
  },
  description: 'Visualisez votre canapé dans le tissu de votre choix...',
}
```

- Exporter une `metadata` depuis `page.tsx` (page publique) et depuis `admin/login/page.tsx`.

**Detection :** Titre de l'onglet navigateur affiche "Back-office" sur la page publique.

---

## Pitfalls Mineurs

Ces problemes sont faciles a corriger mais courants lors d'une premiere implementation.

---

### Pitfall 13 : `scroll-padding-top` manquant — ancres cachees par le header fixe

**Phase concernee :** Navigation (FRONT-01 + sections suivantes)

**Ce qui se passe :**
Le header est `position: fixed` a `height: 64px`. Quand le CTA du hero "decouvrir" fait defiler vers la section suivante via une ancre (`#comment-ca-marche`), le titre de la section se retrouve cache derriere le header.

**Prevention :**
```css
/* globals.css */
html {
  scroll-behavior: smooth;
  scroll-padding-top: var(--header-height); /* 64px */
}
```

**Detection :** Cliquer sur le CTA hero — le H2 de la section suivante doit etre entierement visible, pas coupe par le header.

---

### Pitfall 14 : Accessibilite — header sans `<nav>` et sans skip link

**Phase concernee :** Header (FRONT-01)

**Ce qui se passe :**
Un header qui ne contient qu'un logo et un bouton CTA sans structure semantique (`<nav>`, `role="banner"`) prive les utilisateurs de lecteurs d'ecran des points de repere de navigation. WCAG 2.4.1 requiert un mecanisme pour bypasser les blocs repetitifs.

**Prevention :**
```typescript
<header role="banner" className={styles.header}>
  {/* ... logo ... */}
  <nav aria-label="Navigation principale">
    {/* liens si presentes */}
  </nav>
</header>
```

- Ajouter un skip link visible au focus :
```typescript
<a href="#contenu-principal" className={styles.skipLink}>
  Aller au contenu
</a>
```

- La section `<main>` de `page.tsx` doit avoir `id="contenu-principal"`.

**Detection :** Naviguer au clavier (Tab) — le focus doit sauter directement au contenu principal.

---

### Pitfall 15 : Image hero — `alt` incorrect pour image decorative

**Phase concernee :** Hero (FRONT-02)

**Ce qui se passe :**
Une image de fond purement decorative avec un `alt` descriptif sera annoncee par les lecteurs d'ecran, ce qui alourdit la navigation vocale inutilement. Inversement, une image qui *porte du sens* (ex : photo d'un canape precis) avec `alt=""` prive l'utilisateur d'informations.

**Prevention :**
- Image de fond ambiance → `alt=""` (vide, pas absent)
- Image d'un produit specifique → `alt="Canape [nom], vue de face"` descriptif

**Detection :** Tester avec VoiceOver (Mac) ou NVDA (Windows).

---

### Pitfall 16 : `public/` — fichiers template non supprimes

**Phase concernee :** Initialisation (prerequis M007)

**Ce qui se passe :**
Le dossier `public/` contient `next.svg`, `vercel.svg`, `window.svg`, `globe.svg`, `file.svg` du template Next.js. Ces fichiers sont servis publiquement, gonflent le build, et signalent que le projet est base sur un template non nettoye.

**Prevention :**
- Supprimer tous les SVGs du template au debut de M007.
- Creer `public/images/` pour les assets du projet.

---

### Pitfall 17 : Throttle du handler scroll absent — rerenders excessifs

**Phase concernee :** Header sticky (FRONT-01)

**Ce qui se passe :**
L'evenement `scroll` se declenche plusieurs dizaines de fois par seconde. Sans optimisation, `setScrolled` est appele a chaque frame, causant des rerenders inutiles du Header.

**Prevention — deux approches :**

Option A : Comparer avant de set (recommande pour ce cas simple) :
```typescript
const handler = () => {
  const isScrolled = window.scrollY > 80
  setScrolled(prev => prev !== isScrolled ? isScrolled : prev)
}
```

Option B : `requestAnimationFrame` pour limiter a 60fps :
```typescript
let ticking = false
const handler = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      setScrolled(window.scrollY > 80)
      ticking = false
    })
    ticking = true
  }
}
```

La comparaison avant set (option A) est suffisante ici car le state est binaire (true/false). Le seuil de scroll ne change qu'a deux moments : passage au-dessus de 80px, et retour en dessous.

---

## Tableau de synthese par phase

| Phase / Sujet | Pitfall prioritaire | Mitigation |
|---------------|---------------------|------------|
| Header sticky (FRONT-01) | `window is not defined` au SSR | Initialiser state a `false`, acceder `window` dans `useEffect` uniquement |
| Header sticky (FRONT-01) | Hydration mismatch scroll state | Pattern `mounted` + appliquer classe apres hydratation |
| Header sticky (FRONT-01) | Listener sans `passive` + sans cleanup | `{ passive: true }`, return cleanup dans `useEffect` |
| Architecture composants | `'use client'` trop haut dans l'arbre | Header seul en Client Component, Hero et HowItWorks restent Server Components |
| Hero plein ecran (FRONT-02) | `100vh` barre adresse mobile | Utiliser `100svh` avec fallback `-webkit-fill-available` |
| Hero plein ecran (FRONT-02) | `next/image fill` sans `position: relative` | Container parent obligatoirement `position: relative; overflow: hidden` |
| Hero plein ecran (FRONT-02) | Image hero absente de `public/` | Creer `public/images/hero.jpg` avant le composant |
| Glassmorphism header | `backdrop-filter` sans prefixe `-webkit-` | Toujours doubler avec `-webkit-backdrop-filter` |
| CSS Modules | Conflit dark mode depuis template | Supprimer `page.module.css` template, recree propre |
| CSS Modules | Specifite conflictuelle avec globals | Proprietes explicites, pas de composes depuis globals |
| Metadata | Titre "Back-office" sur page publique | Pattern `title.template` dans layout.tsx |
| Accessibilite | Header sans semantique, sans skip link | `role="banner"`, `<nav aria-label>`, skip link + `id` sur `<main>` |
| Ancres | Contenu cache par header fixe | `scroll-padding-top: var(--header-height)` sur `html` |

---

## Sources

- [Next.js — Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — HIGH confidence (doc officielle)
- [Next.js — use client directive](https://nextjs.org/docs/app/api-reference/directives/use-client) — HIGH confidence (doc officielle)
- [Next.js — Image Component](https://nextjs.org/docs/app/api-reference/components/image) — HIGH confidence (doc officielle)
- [Next.js — generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) — HIGH confidence (doc officielle)
- [App Router Pitfalls — imidef.com (fev 2026)](https://imidef.com/en/2026-02-11-app-router-pitfalls) — MEDIUM confidence
- [Next.js 16 Production Patterns — ecosire.com](https://ecosire.com/blog/nextjs-16-app-router-production) — MEDIUM confidence
- [Stop "window is not defined" in Next.js (2025) — DEV Community](https://dev.to/devin-rosario/stop-window-is-not-defined-in-nextjs-2025-394j) — MEDIUM confidence
- [Fix mobile 100vh CSS — dvh/svh units](https://medium.com/@alekswebnet/fix-mobile-100vh-bug-in-one-line-of-css-dynamic-viewport-units-in-action-102231e2ed56) — MEDIUM confidence
- [CSS Backdrop Filter support — caniuse.com](https://caniuse.com/css-backdrop-filter) — HIGH confidence
- [CSS Modules order conflict Next.js — issue #10148](https://github.com/vercel/next.js/issues/10148) — HIGH confidence (issue officielle)
- [WCAG Skip Navigation — testparty.ai](https://testparty.ai/blog/skip-navigation-links) — MEDIUM confidence
- [React useEffect cleanup for scroll listeners — pluralsight](https://www.pluralsight.com/guides/how-to-cleanup-event-listeners-react) — HIGH confidence
- [Hero Image in Next.js — perssondennis.com](https://www.perssondennis.com/articles/how-to-make-a-hero-image-in-nextjs) — MEDIUM confidence
