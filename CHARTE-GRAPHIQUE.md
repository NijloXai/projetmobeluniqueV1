# Charte Graphique — Mobel Unique

> **Version :** 1.0 — 26 mars 2026
> **Source :** Stitch "Mobel Unique — SPA Desktop" + wireframe v4
> **Philosophie :** "The Curated Atelier" — chaque ecran est un espace galerie haut de gamme

---

## 1. Couleurs

### Palette principale

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#E49400` | CTA, accents, elements actifs |
| `--color-primary-dark` | `#845400` | Texte sur fond clair, gradient CTA |
| `--color-secondary` | `#EFC806` | Badge, highlights secondaires |
| `--color-text` | `#1D1D1B` | Texte principal (jamais #000000) |
| `--color-muted` | `#888888` | Texte secondaire, labels |
| `--color-error` | `#BA1A1A` | Erreurs |
| `--color-success` | `#4CAF50` | Badge "inclus" swatches |

### Surfaces (tonal layering)

| Token | Hex | Usage |
|-------|-----|-------|
| `--surface` | `#FCF9F5` | Canvas principal |
| `--surface-dim` | `#DCDAD6` | Fond attenue |
| `--surface-container-lowest` | `#FFFFFF` | Cards, elements "pop" |
| `--surface-container-low` | `#F6F3EF` | Groupes de contenu secondaires |
| `--surface-container` | `#F0EDEA` | Sections specialisees |
| `--surface-container-high` | `#EBE8E4` | Elements interactifs |
| `--surface-container-highest` | `#E5E2DE` | Inputs, etats survol |
| `--color-background` | `#FFFFFF` | Fond blanc |
| `--color-background-alt` | `#F8F4EE` | Fond beige clair (alternance sections) |

### Outline & Bordures

| Token | Hex | Usage |
|-------|-----|-------|
| `--outline` | `#857461` | Contours visibles |
| `--outline-variant` | `#D8C3AD` | Ghost borders (15% opacite max) |

### Couleurs specifiques

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-whatsapp` | `#25D366` | Bouton WhatsApp |
| `--color-whatsapp-hover` | `#1FB855` | Hover WhatsApp |
| `--color-overlay` | `rgba(0,0,0,0.55)` | Labels dimensions, badges |
| `--color-dimension-line` | `rgba(255,255,255,0.7)` | Traits de cote sur image |

---

## 2. Typographie

### Police

- **Famille :** Montserrat (Google Fonts)
- **Graisses :** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Variable CSS :** `--font-montserrat`

### Echelle typographique

| Token | Taille | Poids | Usage |
|-------|--------|-------|-------|
| `--font-size-display` | `3.5rem` (56px) | 700 | Hero H1 desktop |
| `--font-size-hero-mobile` | `2.25rem` (36px) | 700 | Hero H1 mobile |
| `--font-size-3xl` | `2rem` (32px) | 700 | Titres de sections (H2) |
| `--font-size-2xl` | `1.5rem` (24px) | 600 | Sous-titres (H3) |
| `--font-size-xl` | `1.25rem` (20px) | 600 | Prix total, accents |
| `--font-size-lg` | `1.125rem` (18px) | 400 | Sous-titres hero, descriptions produit |
| `--font-size-base` | `1rem` (16px) | 400 | Corps de texte |
| `--font-size-sm` | `0.875rem` (14px) | 400 | Labels, metadata |
| `--font-size-xs` | `0.75rem` (12px) | 500 | Labels uppercase, specs techniques |
| `--font-size-label` | `0.75rem` (12px) | 700 | Labels ALL-CAPS, tracking +0.1em |

### Regles typographiques

- **Line-height corps :** 1.6
- **Line-height titres :** 1.2
- **Letter-spacing display :** -0.02em
- **Letter-spacing labels :** 0.1em (ALL-CAPS)
- Jamais de `#000000` pour le texte — toujours `--color-text` (#1D1D1B)

---

## 3. Espacement

### Echelle

| Token | Valeur | Usage |
|-------|--------|-------|
| `--spacing-xs` | `0.25rem` (4px) | Micro-espaces |
| `--spacing-sm` | `0.5rem` (8px) | Espaces internes compacts |
| `--spacing-md` | `1rem` (16px) | Espaces internes standard |
| `--spacing-lg` | `1.5rem` (24px) | Espaces entre elements |
| `--spacing-xl` | `2rem` (32px) | Padding containers, separation groupes |
| `--spacing-2xl` | `3rem` (48px) | Separation listes (pas de dividers) |
| `--spacing-3xl` | `3.5rem` (56px) | Separation verticale entre sections |
| `--spacing-4xl` | `5.5rem` (88px) | Breathing room configurateur |
| `--spacing-section` | `7rem` (112px) | Separation majeure entre sections |

### Regles d'espacement

- **Padding interne containers :** minimum `--spacing-xl` (2rem)
- **Entre sections majeures :** `--spacing-section` (7rem)
- **Pas de dividers** — utiliser des gaps de `--spacing-2xl` (3rem)
- Le luxe, c'est l'espace

---

## 4. Rayons de bordure

| Token | Valeur | Usage |
|-------|--------|-------|
| `--radius-sm` | `4px` | Boutons sharp, badges |
| `--radius-md` | `8px` | Cards, inputs |
| `--radius-lg` | `12px` | Cards produit |
| `--radius-xl` | `16px` | Containers, modals |
| `--radius-2xl` | `24px` | Cards hero, elements highlight |
| `--radius-full` | `9999px` | Pills, swatches, avatars |

---

## 5. Elevation & Ombres

### Principe : Tonal Layering

Pas de drop shadows traditionnels. La hierarchie est creee par le contraste entre surfaces.

| Token | Valeur | Usage |
|-------|--------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Elevation subtile |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards, elements interactifs |
| `--shadow-lg` | `0 10px 40px rgba(28,28,26,0.04)` | Elements flottants (ambient) |
| `--shadow-header` | `0 2px 12px rgba(0,0,0,0.08)` | Header au scroll |
| `--shadow-sticky` | `0 -4px 12px rgba(0,0,0,0.1)` | Sticky bar mobile (ombre vers le haut) |

### Glassmorphism (elements flottants)

```css
background: rgba(252, 249, 245, 0.8); /* --surface at 80% */
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
```

### Ghost Borders (si bordure necessaire)

```css
border: 1px solid rgba(216, 195, 173, 0.15); /* --outline-variant at 15% */
```

---

## 6. Breakpoints & Layout

### Breakpoints

| Token | Valeur | Cible |
|-------|--------|-------|
| `--bp-mobile` | `< 640px` | Mobile |
| `--bp-tablet` | `>= 640px` | Tablette |
| `--bp-desktop` | `>= 1024px` | Desktop |
| `--bp-large` | `>= 1280px` | Grand ecran |

### Media queries CSS

```css
/* Mobile first — defaut */
/* Tablet */  @media (min-width: 640px) { }
/* Desktop */ @media (min-width: 1024px) { }
/* Large */   @media (min-width: 1280px) { }
```

### Conteneur

| Token | Valeur | Usage |
|-------|--------|-------|
| `--container-max` | `1280px` | Largeur max du contenu |
| `--container-padding-mobile` | `24px` | Padding lateral mobile |
| `--container-padding-desktop` | `48px` | Padding lateral desktop |
| `--container-padding-large` | `64px` | Padding lateral grand ecran |

---

## 7. Dimensions fixes

### Header

| Propriete | Valeur |
|-----------|--------|
| Hauteur | `64px` |
| Position | `fixed`, top 0, pleine largeur |
| z-index | `100` |
| Transition | transparent → blanc au scroll (seuil 80px) |
| Padding | `0 24px` (mobile) / `0 48px` (desktop) |

### Hero

| Propriete | Valeur |
|-----------|--------|
| Hauteur | `100vh` (plein ecran) |
| Titre desktop | `3.5rem` (56px), font-weight 700 |
| Titre mobile | `2.25rem` (36px), font-weight 700 |
| Overlay gradient | `rgba(0,0,0,0.55)` |

### Cards produit

| Propriete | Valeur |
|-----------|--------|
| Image hauteur | `220px` (placeholder) |
| Radius | `--radius-lg` (12px) |
| Swatches miniatures | `22px` diametre |
| Swatches configurateur | `52px` diametre |

### Configurateur

| Propriete | Valeur |
|-----------|--------|
| Layout desktop | 60% image / 40% controles |
| Image mobile | `340px` hauteur |
| Image desktop | `480px` hauteur |
| Zoom texture | `100px` (mobile) / `120px` (desktop) |
| Thumbnails angles | `72 x 54px` |

### Simulation

| Propriete | Valeur |
|-----------|--------|
| Zone upload padding | `48px` |
| Image resultat | `380px` hauteur |
| Barre progression | `240px` largeur |

### Sticky bar mobile

| Propriete | Valeur |
|-----------|--------|
| Visible | `< 1024px` uniquement |
| Position | `fixed`, bottom 0, pleine largeur |
| z-index | `90` |
| Swatch preview | `40px` diametre |

---

## 8. Boutons

### Primary (CTA principal)

```css
background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
color: #FFFFFF;
border-radius: var(--radius-sm);
font-weight: 600;
font-size: var(--font-size-sm);
text-transform: uppercase;
letter-spacing: 0.05em;
padding: 12px 24px;
```

### Secondary (outline)

```css
background: transparent;
border: 1px solid var(--color-primary);
color: var(--color-primary);
border-radius: var(--radius-sm);
```

### Tertiary (text-only)

```css
background: none;
border: none;
color: var(--color-primary);
text-decoration: underline;
text-underline-offset: 4px;
```

---

## 9. Animations & Transitions

### Regles generales

- **Duree standard :** `400ms` (luxe = delibere, pas rapide)
- **Easing :** `ease-in-out`
- **Pas d'animations "snappy"** — toujours fluide et lent

### Transitions specifiques

| Element | Propriete | Duree |
|---------|-----------|-------|
| Header scroll | background, box-shadow, color | `300ms ease` |
| Hover cards | background-color | `400ms ease-in-out` |
| Hover boutons | transform, box-shadow | `300ms ease` |
| Indicateur scroll | translateY | `1.5s ease-in-out infinite` |

---

## 10. Regles de design (DO / DON'T)

### DO

- Utiliser le tonal layering pour separer les sections (changement de fond, pas de bordures)
- Espaces genereux entre sections (`--spacing-section`)
- Images dominantes, typographie flush left
- Ghost borders uniquement si necessaire (inputs, accessibilite)
- Transition lentes et deliberees (400ms)

### DON'T

- Pas de `#000000` — toujours `#1D1D1B`
- Pas de bordures `1px solid` pour sectionner (regle "No-Line")
- Pas de dividers — utiliser l'espacement
- Pas de drop shadows lourds — tonal layering
- Pas d'animations rapides/snappy
- Pas de coins a 90 degres — minimum `--radius-sm` (4px)
- Pas de Tailwind, pas de shadcn/ui — CSS Modules uniquement

---

## 11. Fichiers de reference

| Fichier | Role |
|---------|------|
| `src/app/globals.css` | Tokens CSS (variables :root) |
| `src/app/layout.tsx` | Root layout (Montserrat, lang=fr) |
| Stitch project `16534774796210155266` | Maquette desktop + mobile |
| Screen `wireframe-page-unique.md` | Wireframe detaille (8 sections) |

---

*Ce document est la reference unique pour toutes les decisions visuelles du frontend Mobel Unique.*
