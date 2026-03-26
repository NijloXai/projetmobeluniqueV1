# Technology Stack — M007 Header + Hero + Comment ca marche

**Project:** Möbel Unique — SPA publique
**Milestone:** M007 — Header sticky + Hero plein ecran + Section "Comment ca marche"
**Researched:** 2026-03-26
**Overall confidence:** HIGH (sources officielles Next.js 16.2.1 verifiees)

---

## Verdict principal

**Aucune nouvelle dependance npm requise pour M007.**

Les 3 sections de M007 se construisent exclusivement avec :
- Next.js 16.2.1 (deja installe) — `next/image`, React hooks
- CSS Modules (convention projet) — animations `@keyframes`, transitions
- React 19 (deja installe) — `useEffect`, `useRef`, `useState`

---

## Stack M007 : ce qui change vs existant

### 1. Scroll detection — Header transparent vers blanc

**Approche recommandee : IntersectionObserver (pas de `window.scroll`)**

IntersectionObserver est 43% plus performant que window.scroll avec throttling sur machines lentes (source : ITNEXT benchmark 2024). Il ne tourne pas sur le main thread, elimine le besoin de debounce/throttle manuel, et s'integre proprement dans React via `useEffect` + cleanup.

**Pattern concret :**

```tsx
// 'use client' — composant Header
const sentinelRef = useRef<HTMLDivElement>(null);
const [isScrolled, setIsScrolled] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsScrolled(!entry.isIntersecting),
    { threshold: 0 }
  );
  if (sentinelRef.current) observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, []);
```

Une `<div>` sentinelle de 80px (cf. CHARTE-GRAPHIQUE.md seuil scroll) est placee juste apres le header dans le DOM. Quand elle quitte le viewport, le header bascule vers blanc.

**Alternative rejetee — `window.scroll` avec `useEffect`** : Fonctionne mais necessite throttling explicite et removeEventListener dans le cleanup. Plus verbeux, moins performant.

**Alternative rejetee — librairie tierce (react-use, react-scroll)** : Sur-ingenierie totale pour un simple changement d'etat booleen.

---

### 2. Image Hero — next/image avec fill

**Approche recommandee : `next/image` avec `fill` + `loading="eager"` + `fetchPriority="high"`**

IMPORTANT — Changement Next.js 16.2.1 (source officielle, verifie) :
- La prop `priority` est **deprecie** dans Next.js 16 en faveur de `preload`
- Pour les images LCP above-the-fold, utiliser `loading="eager"` OU `fetchPriority="high"` (pas les deux simultanément avec `preload`)
- `loading="eager"` est le remplacement direct de `priority` pour les hero images

**Pattern concret :**

```tsx
// Dans le composant Hero (Server Component possible car pas d'interactivite)
<div className={styles.heroBackground}>
  <Image
    src="/images/hero-canape.jpg"
    alt="Canapé personnalisable Möbel Unique"
    fill
    loading="eager"
    sizes="100vw"
    style={{ objectFit: 'cover', objectPosition: 'center' }}
  />
</div>
```

```css
/* Hero.module.css */
.heroBackground {
  position: relative; /* requis par fill */
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
```

**Overlay gradient sur l'image :**
Implementer avec un `::after` pseudo-element CSS (pas un element HTML supplementaire) :

```css
.heroBackground::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-overlay); /* rgba(0,0,0,0.55) */
  z-index: 1;
}

.heroContent {
  position: relative;
  z-index: 2; /* au-dessus de l'overlay */
}
```

**Placeholder Hero M007 :** Pas d'image reelle disponible dans `/public/` (seulement SVG Next.js). Utiliser un degradé CSS comme fond temporaire en attendant une vraie photo :

```css
.heroBackground {
  background: linear-gradient(135deg, #1a1a18 0%, #3d3428 50%, #1a1a18 100%);
}
```

L'Image next/image sera ajoutee quand une photo canapé sera fournie dans `/public/images/`.

**`sizes` obligatoire avec `fill` :** Sans `sizes`, le navigateur assume 100vw et telecharge une image enormement grande. Avec `sizes="100vw"` pour le hero plein ecran, Next.js genere le srcset complet (640w, 750w, 828w, 1080w, 1200w, 1920w...).

---

### 3. CSS Modules — Animations et transitions

**Approche recommandee : `@keyframes` natifs CSS + classes conditionnelles React**

Aucune librairie d'animation (Framer Motion, Motion One, react-spring) n'est necessaire pour M007. Les 3 sections sont des animations simples :

**Header :**
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
  transition: background var(--transition-fast), box-shadow var(--transition-fast);
  /* --transition-fast: 300ms ease — cf. CHARTE-GRAPHIQUE.md */
}

.headerScrolled {
  background: var(--color-background); /* #FFFFFF */
  box-shadow: var(--shadow-header);
}
```

**Section "Comment ca marche" — entree en fondu :**
Utiliser IntersectionObserver (meme pattern que header) pour declencher une classe CSS :

```css
/* HowItWorks.module.css */
.step {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity var(--transition-smooth), transform var(--transition-smooth);
  /* --transition-smooth: 400ms ease-in-out */
}

.stepVisible {
  opacity: 1;
  transform: translateY(0);
}
```

**Indicateur scroll hero (fleche animee) :**
```css
@keyframes scrollBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}

.scrollIndicator {
  animation: scrollBounce 1.5s ease-in-out infinite;
}
```

**Performance animations :** Utiliser exclusivement `opacity` et `transform` — ces proprietes sont GPU-accelerees et ne declenchent pas de layout reflow. Jamais `width`, `height`, `top`, `left` pour les animations.

---

### 4. Responsive avec CSS Modules

**Approche : Mobile-first avec media queries inline dans les .module.css**

Breakpoints valides depuis CHARTE-GRAPHIQUE.md (verifie dans globals.css) :

```css
/* Mobile (defaut) : < 640px */
/* Tablet */  @media (min-width: 640px) { }
/* Desktop */ @media (min-width: 1024px) { }
/* Large */   @media (min-width: 1280px) { }
```

CSS Modules supporte nativement les media queries dans les fichiers `.module.css`. Aucun setup supplementaire requis.

---

## Dependances — Tableau de decision

| Capacite | Solution | Librairie requise | Raison |
|----------|----------|-------------------|--------|
| Scroll detection header | IntersectionObserver + useState | AUCUNE | API browser native, React hooks suffisants |
| Image hero optimisee | `next/image` fill + loading="eager" | AUCUNE | Deja dans Next.js 16.2.1 |
| Animations CSS | `@keyframes` + transitions CSS | AUCUNE | CSS pur, GPU-accelere |
| Scroll reveal section | IntersectionObserver + class toggle | AUCUNE | Meme pattern que header |
| Responsive | Media queries CSS Modules | AUCUNE | CSS natif |
| Font Montserrat | `next/font/google` | AUCUNE | Deja configure dans layout.tsx |

---

## Ce qu'il ne faut PAS ajouter

| Librairie | Pourquoi rejeter |
|-----------|-----------------|
| Framer Motion / Motion One | Sur-ingenierie. Les animations M007 sont 3 transitions simples. Poids inutile (~55KB gzip). |
| react-intersection-observer | Wrapper inutile. L'API IntersectionObserver est native dans tous les navigateurs modernes et React 19 la gere bien avec useEffect. |
| react-scroll / react-use | Packages generiques pour des besoins tres specifiques. |
| styled-components / emotion | Interdit par convention projet. CSS Modules uniquement. |
| Tailwind | Interdit par convention projet. |
| GSAP | Totalement disproportionne pour des fade-ins et une transition header. |

---

## Integration avec l'existant

### layout.tsx — Metadonnees a corriger

La metadata actuelle indique "Back-office". M007 doit mettre a jour le layout.tsx public :

```tsx
export const metadata: Metadata = {
  title: "Möbel Unique — Canapés personnalisables Paris",
  description: "Visualisez votre canapé personnalisé avec notre configurateur IA. Choisissez votre tissu et simulez le rendu dans votre salon.",
};
```

Le `<html lang="fr">` et Montserrat sont deja corrects.

### globals.css — Tokens suffisants

Tous les tokens necessaires a M007 sont deja dans `globals.css` :
- `--header-height: 64px`
- `--color-overlay: rgba(0,0,0,0.55)`
- `--shadow-header`, `--transition-fast`, `--transition-smooth`
- `--spacing-section: 7rem`
- Typographie complete (display, hero-mobile, etc.)
- Breakpoints documentés dans CHARTE-GRAPHIQUE.md

**Aucune modification de globals.css requise pour M007.**

### Structure composants recommandee

```
src/
  components/
    public/                    ← Nouveau dossier (separe de /admin/)
      Header/
        Header.tsx             ← 'use client' (IntersectionObserver)
        Header.module.css
      Hero/
        Hero.tsx               ← Server Component (pas d'interactivite)
        Hero.module.css
      HowItWorks/
        HowItWorks.tsx         ← 'use client' (scroll reveal)
        HowItWorks.module.css
```

Convention : dossier `public/` pour les composants de la SPA publique, distinct de `admin/`.

---

## Verification de version

| Element | Version verifiee | Source |
|---------|-----------------|--------|
| `next/image` fill + `loading="eager"` | Next.js 16.2.1 | Docs officielles (lastUpdated: 2026-03-20) |
| `priority` deprecie → `preload`/`loading` | Next.js 16+ | Docs officielles verifiees |
| IntersectionObserver support | Universel (tous navigateurs modernes) | MDN, aucune polyfill requise |
| CSS Modules `@keyframes` | Next.js 16+ natif | Comportement standard |
| `useEffect` cleanup pattern | React 19.2.4 | Pattern standard verifie |

---

## Sources

- [Next.js Image Component — Docs officielles v16.2.1](https://nextjs.org/docs/app/api-reference/components/image) — verifie 2026-03-26
- [Scroll Listener vs Intersection Observers: benchmark performance](https://itnext.io/1v1-scroll-listener-vs-intersection-observers-469a26ab9eb6) — IntersectionObserver 43% plus performant
- [Building A Dynamic Header With Intersection Observer — Smashing Magazine](https://www.smashingmagazine.com/2021/07/dynamic-header-intersection-observer/) — pattern header
- [Next.js Core Web Vitals — LCP/FCP](https://eastondev.com/blog/en/posts/dev/20251219-nextjs-core-web-vitals/) — best practices hero image 2025
- [Simple React Scroll Animations With Zero Dependencies — Bret Cameron](https://www.bretcameron.com/blog/simple-react-scroll-animations-with-zero-dependencies) — pattern sans librairie
