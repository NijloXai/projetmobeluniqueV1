# Feature Landscape — M007 Header + Hero + Comment ca marche

**Domaine :** SPA luxe canapés personnalisables (Möbel Unique)
**Milestone :** M007 — Frontend public, 3 premières sections
**Date recherche :** 2026-03-26
**Périmètre :** Header sticky, Hero plein écran, Section "Comment ca marche" 3 étapes

---

## Context du projet

Backend complet (M001–M006, ~5350 lignes). La page publique est encore le template Next.js par
défaut. M007 remplace entièrement `src/app/page.tsx` et crée 3 composants visuels fondateurs.
Aucune API n'est nécessaire pour M007 — toutes les sections sont statiques.

Stack contrainte : CSS Modules uniquement (pas de Tailwind), Montserrat, tokens définis dans
`globals.css`, breakpoints 640/1024/1280px.

---

## Table Stakes — Header Sticky

Fonctionnalités attendues par tout visiteur. Leur absence rend le produit incomplet ou peu
professionnel.

| Feature | Pourquoi attendu | Complexité | Notes |
|---------|-----------------|------------|-------|
| Position `fixed` top 0, z-index 100 | Standard universel des SPAs | Faible | Spécifié dans CHARTE-GRAPHIQUE.md : h=64px, z=100 |
| Transition transparent -> fond blanc au scroll | Signature visuelle des sites luxe (Roche Bobois, Ligne Roset) | Faible | Seuil 80px défini. `background`, `box-shadow`, `color` en 300ms |
| Logo à gauche | Conventions de navigation universelles | Faible | Text ou SVG, taille adaptée 64px height |
| CTA à droite ("Explorer" / lien catalogue) | Point d'entrée vers l'action principale | Faible | Un seul CTA — pas de nav complète en M007 |
| `box-shadow` au scroll (`--shadow-header`) | Sépare visuellement le header du contenu sans bordure | Faible | `0 2px 12px rgba(0,0,0,0.08)` défini dans tokens |
| Responsive mobile : padding réduit (24px) vs desktop (48px) | UX mobile standard | Faible | Tokens `--container-padding-mobile/desktop` déjà définis |
| Semantic HTML `<header>` + `role="banner"` | Accessibilité WCAG 2.1 AA — navigation clavier et screen readers | Faible | Sans ça, skip links et AT échouent |
| `scroll-padding-top: 64px` sur `:root` | Empêche le header de masquer les ancres au focus clavier | Faible | Pitfall fréquent — doit être dans globals.css |

---

## Table Stakes — Hero Plein Écran

| Feature | Pourquoi attendu | Complexité | Notes |
|---------|-----------------|------------|-------|
| Hauteur `100vh` | Standard des heroes luxe full-screen | Faible | Défini CHARTE-GRAPHIQUE.md |
| Image de fond dominante (canapé en situation) | Vente émotionnelle — le luxe se montre, ne se décrit pas | Faible | `object-fit: cover`, `position: center` |
| Overlay sombre `rgba(0,0,0,0.55)` | Lisibilité du texte blanc sur image variable — WCAG impose 4.5:1 pour corps, 3:1 pour grands titres | Faible | Token `--color-overlay` déjà défini |
| H1 bold centré ou flush-left | Hiérarchie visuelle immédiate — premier élément scanné | Faible | `3.5rem` desktop / `2.25rem` mobile, définis dans tokens |
| Sous-titre descriptif (`1.125rem`) | Complète le H1, ancre la proposition de valeur | Faible | 1-2 lignes max, `--font-size-lg` |
| CTA principal avec gradient ambre | Appel à l'action unique et reconnaissable | Faible | Style button primary déjà défini dans CHARTE-GRAPHIQUE.md |
| Badge "IA" ou "Simulation IA" | Différenciateur clé du produit — doit apparaître dès l'entrée | Faible | `--color-secondary` (#EFC806), `--radius-full`, ALL-CAPS |
| `padding-top: 64px` sur le hero | Compense la hauteur du header fixed | Faible | Sans ça, le H1 est partiellement masqué |
| `alt=""` vide sur l'image décorative de fond | Image de fond = décorative, pas d'information. `role="img"` + `alt` si elle porte du sens | Faible | Si `background-image` CSS : pas de problème. Si `<img>` : `alt=""` |
| Texte blanc sur overlay sombre | Respect WCAG 1.4.3 — blanc sur `rgba(0,0,0,0.55)` dépasse 4.5:1 | Faible | Vérifier le ratio final avec l'image réelle |

---

## Table Stakes — Section "Comment ca marche"

| Feature | Pourquoi attendu | Complexité | Notes |
|---------|-----------------|------------|-------|
| 3 étapes clairement numérotées ou iconisées | Pattern universel — réduction de l'anxiété d'achat avant conversion | Faible | Numérotation 01/02/03 ou icônes SVG simples |
| Titre de section H2 centré | Structure et scannabilité | Faible | `2rem`, font-weight 700 — `--font-size-3xl` |
| Layout 3 colonnes desktop / colonne mobile | Attend universellement sur ce pattern | Moyen | `display: grid`, `grid-template-columns: repeat(3, 1fr)` desktop, `1fr` mobile |
| Titre + description par étape | Clarté du message — quel bénéfice à chaque étape | Faible | Titre ~3-5 mots, description ~15-25 mots |
| Fond alterné (`--color-background-alt`, `#F8F4EE`) | Tonal layering — sépare visuellement du hero sans bordure | Faible | Règle "No-Line" de la charte |
| Espacement généreux entre sections (`--spacing-section`, 7rem) | Signature visuelle luxe — "le luxe, c'est l'espace" | Faible | Token déjà défini |

---

## Differentiators — Features à valeur ajoutée (à implémenter)

Features qui élèvent l'expérience au-dessus du standard attendu.

| Feature | Valeur ajoutée | Complexité | Notes |
|---------|---------------|------------|-------|
| Indicateur de scroll sur le hero (flèche animée) | Guide l'utilisateur vers le contenu suivant, signal de contenu disponible | Faible | `translateY` animation 1.5s ease-in-out infinite — défini dans CHARTE-GRAPHIQUE.md |
| Fade-in au scroll sur les 3 étapes (IntersectionObserver) | Sentiment de qualité et d'attention au détail — luxe = deliberé | Moyen | `opacity: 0 -> 1` + `translateY(20px -> 0)`, 400ms, avec `prefers-reduced-motion` |
| Header hide-on-scroll-down / show-on-scroll-up (mobile) | Récupère de l'espace écran sur mobile sans perdre la navigation | Moyen | Pattern "intelligent sticky" — peut être reporté à M011 polish |
| Glassmorphism sur le header en état transparent (optionnel) | Raffinement visuel si contenu défile derrière | Moyen | `backdrop-filter: blur(20px)`, défini dans CHARTE-GRAPHIQUE.md — attention compat Safari |
| Animation stagger des 3 étapes (délai 100ms entre chaque) | Sentiment de narration séquentielle, pas un affichage simultané | Faible | `animation-delay: 0, 100ms, 200ms` — si IntersectionObserver implémenté |
| Icônes SVG inline pour les étapes | Plus léger que des images, colorisables avec `currentColor` | Faible | 3 icônes simples : canapé, palette tissu, visualisation |

---

## Anti-Features — À ne pas construire en M007

| Anti-Feature | Pourquoi éviter | Quoi faire à la place |
|--------------|----------------|----------------------|
| Navigation complète (menu avec plusieurs liens) | Pas de pages cibles en M007 — liens morts = mauvaise UX | Header minimal : logo + 1 CTA uniquement |
| Carousel / slider hero | Complexité accidentelle, performance impactée, accessibilité difficile (ARIA live regions), pattern prouvément moins efficace pour luxe | Image fixe unique de haute qualité |
| Video background | Coût réseau énorme (autoplay interdit sur mobile iOS sans `muted`), gestion complexe des fallbacks, hors périmètre M007 | Image haute résolution avec overlay |
| Parallax scroll sur le hero | Vestibular disorders — provoque des nausées. WCAG 2.3.3 recommande d'éviter. Complexité JS vs bénéfice faible | Hero statique ou fade-in simple |
| Animations CSS keyframes complexes sur le H1 | Luxe = délibéré, pas spectaculaire. Animations "snappy" contredisent la charte | Transition opacity simple si nécessaire |
| Lazy loading sur l'image hero | L'image hero est above-the-fold — elle DOIT être `priority` (Next.js `<Image priority>`) | `priority` prop sur `<Image>` |
| Compteurs JS, confettis, popups d'entrée | Bruit visuel incompatible avec la philosophie "Curated Atelier" | Silence visuel, copie persuasive |
| Hamburger menu complexe avec drawer animé | M007 n'a pas assez de liens pour justifier un menu complet | 1 bouton CTA texte ou icon simple |

---

## Dépendances entre features

```
globals.css tokens (existant)
  -> Header (transparent state, couleurs, z-index, shadow-header)
  -> Hero (overlay, typographie display, CTA gradient)
  -> Comment ca marche (surface-container, spacing-section)

Header (height: 64px)
  -> Hero (padding-top: 64px requis)
  -> scroll-padding-top: 64px sur :root (accessibilité ancres)

layout.tsx (Montserrat déjà configuré, existant)
  -> Tous les composants héritent la font

IntersectionObserver (optionnel)
  -> Fade-in "Comment ca marche"
  -> Stagger animation étapes (dépend de l'IO)
```

---

## Recommandation MVP pour M007

### Priorité 1 — Fondation non-négociable

1. Header sticky : transparent -> blanc (80px), logo + 1 CTA, 64px, `scroll-padding-top`
2. Hero : `100vh`, image fond + overlay, badge IA, H1 + sous-titre, CTA primary
3. Comment ca marche : 3 étapes, grid 3 colonnes desktop, fond `--color-background-alt`
4. Responsive complet : 4 breakpoints (< 640, >= 640, >= 1024, >= 1280)
5. `prefers-reduced-motion` respecté sur toute animation

### Priorité 2 — Différenciateurs simples (effort faible, gain élevé)

6. Indicateur de scroll hero (flèche, animation CSS pure)
7. Fade-in IntersectionObserver sur les étapes (avec stagger)

### Reporter à M011 (polish)

- Hide/show header au scroll sur mobile
- Glassmorphism header (compatibilité Safari à vérifier)
- Optimisation fine des animations

---

## Complexité et effort estimés

| Section | Composants | Effort estimé | Notes |
|---------|------------|---------------|-------|
| Header | `Header.tsx` + `Header.module.css` | ~2h | useScrollY hook simple, 2 états visuels |
| Hero | `Hero.tsx` + `Hero.module.css` | ~2h | Image statique, overlay CSS, badge, CTA |
| Comment ca marche | `HowItWorks.tsx` + `HowItWorks.module.css` | ~2h | Grid 3 cols + IntersectionObserver optionnel |
| `page.tsx` refacto | Assemblage des 3 sections | ~30min | Remplacement du template par défaut |
| **Total** | | **~7h** | |

---

## Considérations accessibilité par section

### Header
- `<header role="banner">` obligatoire
- `<nav aria-label="Navigation principale">` si liens présents
- Contraste du logo et du CTA sur fond transparent AND sur fond blanc (2 états)
- Skip link `#main-content` au-dessus du header (invisible sauf focus clavier)
- `scroll-padding-top: 64px` sur `:root`

### Hero
- `<main id="main-content">` pour recevoir le skip link
- H1 unique sur la page (le hero en est le propriétaire naturel)
- Image de fond via `background-image` CSS = décorative, aucun `alt` requis
- Si `<Image>` Next.js utilisé pour le fond : `alt=""` (décoratif) + `aria-hidden="true"`
- Ratio de contraste : blanc pur (#FFFFFF) sur `rgba(0,0,0,0.55)` = ~8.5:1 — conforme WCAG AAA
- CTA : texte descriptif, pas "Cliquez ici"
- Badge : `aria-label` si icône seule

### Comment ca marche
- Section avec `<section aria-labelledby="how-title">` + H2 `id="how-title"`
- Étapes : `<ol>` ou `<ul>` sémantique, ou articles dans une liste
- Icônes décoratives : `aria-hidden="true"`
- `@media (prefers-reduced-motion: reduce)` désactive toutes les animations

---

## Sources

- [LogRocket: 10 Best Hero Section Examples and Best Practices](https://blog.logrocket.com/ux-design/hero-section-examples-best-practices/) — MEDIUM confidence
- [Smashing Magazine: Designing Sticky Menus UX Guidelines](https://www.smashingmagazine.com/2023/05/sticky-menus-ux-guidelines/) — HIGH confidence
- [Smashing Magazine: Designing Accessible Text Over Images Part 1](https://www.smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1/) — HIGH confidence
- [Parallel HQ: What is a Sticky Header — UX Best Practices 2026](https://www.parallelhq.com/blog/what-sticky-header) — MEDIUM confidence
- [NN/g: Sticky Headers 5 Ways to Make Them Better](https://www.nngroup.com/articles/sticky-headers/) — HIGH confidence
- [W3C WCAG 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) — HIGH confidence
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) — HIGH confidence
- [TPGI: Prevent focused elements obscured by sticky headers](https://www.tpgi.com/prevent-focused-elements-from-being-obscured-by-sticky-headers/) — HIGH confidence
- [WebAIM: Contrast and Color Accessibility](https://webaim.org/articles/contrast/) — HIGH confidence
- CHARTE-GRAPHIQUE.md (source primaire, autorité absolue pour ce projet) — HIGH confidence
