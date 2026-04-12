# Refonte UX — Site Public Mobel Unique

> **Date :** 2026-04-12
> **Scope :** Catalogue + Configurateur (site public)
> **Approche :** Hybride — refonte configurateur + polish catalogue
> **Hors scope :** Hero (geree separement), admin (spec dedie), SEO, performance backend

---

## 1. Objectifs

- Aligner l'UI sur la charte graphique ("The Curated Atelier" — galerie haut de gamme)
- Ameliorer l'ergonomie et la fluidite du parcours client
- Rendre le configurateur plus intuitif avec un guidage clair
- Respecter l'accessibilite WCAG AA
- Extraire le ConfiguratorModal monolithique en sous-composants maintenables

---

## 2. Catalogue — Polish UX

### 2.1 Cards produit

| Aspect | Actuel | Cible |
|--------|--------|-------|
| Fond section | #FFFFFF | `--surface` (#FCF9F5) |
| Fond card | implicite | `--surface-container-lowest` (#FFFFFF) — tonal layering |
| Hover | background-color change | `translateY(-4px)` + shadow douce + crossfade image |
| CTA | Toujours visible, outline | Apparait au hover (opacity 0→1), texte "Personnaliser" |
| Radius | 0 (bord a bord) | `--radius-lg` (12px) |
| Image ratio | 4:5 | 4:5 (inchange) |
| Entry animation | Aucune | Staggered fadeInUp (50ms decalage, Motion) |

**Image swap au hover :**
- Si le modele a plusieurs angles, crossfade vers le 2e angle au hover (400ms ease-in-out)
- Precharger la 2e image en `<img>` cache (opacity 0, position absolute)
- Sur mobile : pas de hover, image statique (pas de carrousel pour garder la simplicite)

**Hover elevation :**
```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(28, 28, 26, 0.04); /* --shadow-lg */
}
```

### 2.2 Filtres

- Barre de pills horizontales au-dessus de la grille
- Source des categories : derivees des modeles actifs (champ `dimensions` ou tag futur)
- Pill "Tous" active par defaut
- Pill active : fond `--color-primary`, texte blanc
- Pill inactive : fond `--surface-container-low`, ghost border, texte `--color-text`
- Animation layout (Motion `layout` prop) quand les cards se reorganisent
- Recherche conservee avec **debounce 300ms** (actuellement pas de debounce)
- Compteur de resultats sous les filtres

### 2.3 Skeleton loading

- Couleur shimmer : `--surface-container` (#F0EDEA) → `--surface-container-high` (#EBE8E4) → retour
- Meme layout que les vraies cards (coherence)
- Images chargees apparaissent en fade-in 400ms
- `aria-label="Chargement du catalogue"` sur le conteneur skeleton

### 2.4 Accessibilite catalogue

- Contraste `--color-muted` : passe de #888888 a **#767676** (ratio 4.5:1 sur blanc)
- Focus-visible sur chaque card : `outline: 2px solid var(--color-primary); outline-offset: 2px`
- Pills filtres : `role="tablist"` + `role="tab"` + `aria-selected`
- Cards : `aria-label` descriptif ("Canape Oslo — a partir de 1 500 euros")

---

## 3. Configurateur — Refonte UX

### 3.1 Architecture

**Takeover full-screen** au lieu du modal actuel :
- Element `<dialog>` conserve (accessibilite native)
- Dimensions : 100vw x 100dvh (full viewport)
- Fond propre `--surface` (#FCF9F5)
- Bouton fermer : icone X, 44x44px zone de tap, position fixed top-right
- Transition d'ouverture : expand depuis la card (shared layout animation Motion)
- Transition de fermeture : shrink inverse vers la card
- Scroll lock iOS-safe conserve

**Layout deux colonnes (desktop >= 1024px) :**
- Gauche 60% : zone image/preview, fond `--surface-container-low`
- Droite 40% : options/controles, fond `--surface`, scrollable

**Layout mobile (< 1024px) :**
- Stack vertical : image en haut (max 340px), options en dessous
- Sticky bar en bas avec prix + CTA principal (z-index 90, shadow sticky)

### 3.2 Stepper de progression

- Position : haut du configurateur, sous le bouton fermer
- 4 etapes : **Tissu** → **Apercu** → **Simulation** → **Resultat**
- Etape active : cercle `--color-primary` + texte bold
- Etape completee : cercle avec check (icone Lucide Check, 14px)
- Etape future : cercle `--surface-container-highest` + texte muted
- Separateurs : ligne 1px `--outline-variant`
- Navigation libre : clic sur une etape completee pour y revenir
- `aria-current="step"` sur l'etape active
- Mobile : labels caches, seulement les cercles (gain de place)

### 3.3 Etape 1 — Tissu

**Swatches :**
- Taille : 48px diametre (toucher confortable)
- Forme : ronde (`border-radius: 50%`)
- Groupement : par categorie via pills tabs (Velours, Lin, Coton, Cuir...)
- Swatch active : anneau 2px `--color-primary` avec gap 2px (`outline-offset: 2px`)
- Swatch hover : tooltip avec nom + type + prix supplement si premium
- Semantique : `role="radiogroup"` sur le conteneur, `role="radio"` + `aria-checked` sur chaque swatch
- Transition au clic : micro-scale bounce (0.95 → 1.02 → 1, 250ms)

**Preview live :**
- Crossfade 400ms ease-in-out au changement de tissu
- Image precharge (prefetch de toutes les images tissu du modele)
- Si pas d'image generee pour ce tissu : afficher l'image de base avec un badge "Apercu non disponible"

**Prix :**
- Affiche en bas du panneau droit
- Se met a jour en temps reel au changement de tissu
- Format : "1 580 €" (Intl.NumberFormat fr-FR)
- Mention "+ 80 €" a cote du nom si premium

**CTA :**
- "Suivant — Apercu des angles" (bouton primaire gradient, pleine largeur)
- Desactive tant qu'aucun tissu n'est selectionne

### 3.4 Etape 2 — Apercu

**Image principale :**
- Grande image du canape avec tissu selectionne
- Aspect ratio 4:3
- Fond `--surface-container-low`
- Radius `--radius-lg`

**Navigation angles :**
- Thumbnails 72x54px en ligne sous l'image
- Thumbnail active : bordure 2px `--color-primary`
- Crossfade 400ms au changement d'angle
- Si un seul angle disponible : pas de thumbnails

**Actions :**
- CTA primaire : "Simuler chez moi" → passe a l'etape 3
- CTA secondaire (outline) : "Commander sur Shopify" → lien externe
- Sur mobile : les deux CTA dans la sticky bar

### 3.5 Etape 3 — Simulation

**Upload photo :**
- Zone drag & drop avec guidage visuel
- **Guidage photo** : 3 exemples inline (bon cadrage / trop pres / trop sombre) avec icones check/croix
- Texte guide : "Photographiez l'espace ou vous souhaitez placer votre canape"
- Validation : max 15 Mo, JPEG/PNG/HEIC, resolution minimum 800x600
- Feedback erreur en francais avec suggestion corrective
- Alternative : **pieces predefinies** (3-4 photos de salons types) pour les users qui ne veulent pas uploader
- Pieces predefinies : grille de 3-4 vignettes cliquables (salon moderne, salon classique, petit espace, loft)

**SofaPlacer ameliore :**
- Comportement actuel conserve (drag + slider taille)
- Ajouts :
  - Bouton "Reinitialiser la position" (icone RotateCcw, position top-left de la zone)
  - Feedback visuel pendant le drag : ombre portee sous le rectangle
  - Grille de guidage optionnelle (lignes pointillees horizontales a 33% et 66%)
  - Curseur : `grab` au repos, `grabbing` pendant le drag (deja en place)
  - Label "Deplacez le rectangle pour positionner votre canape" au premier affichage (disparait apres 1er drag)

**CTA :**
- "Lancer la simulation" (bouton primaire, pleine largeur)
- Desactive si aucune photo et pas de piece predefinie selectionnee

### 3.6 Etape 4 — Resultat

**Progress pendant la generation :**
- Remplace la barre de progression actuelle par des **etapes nommees** :
  1. "Analyse de votre photo..." (0-20%)
  2. "Placement du canape..." (20-50%)
  3. "Application des textures..." (50-80%)
  4. "Finalisation du rendu..." (80-100%)
- Chaque etape : icone animee (spinner) + texte
- Etape completee : icone check verte + texte barre
- Animation : fade entre les etapes

**Slider avant/apres :**
- Composant `BeforeAfterSlider` reutilisable
- Photo originale a gauche, resultat a droite
- Ligne verticale draggable au centre (poignee ronde 32px, fond blanc, ombre)
- Labels "Avant" / "Apres" au-dessus des images
- Accessible au clavier : fleches gauche/droite deplacent le slider de 5%
- `aria-label="Comparaison avant et apres la simulation"`
- Mobile : swipe horizontal ou tap pour basculer (toggle au lieu de slider si ecran < 480px)

**Actions :**
- Grille 2x2 de boutons :
  - "Telecharger HD" (icone Download) — bouton primaire
  - "Partager" (icone Share2) — Web Share API, fallback WhatsApp
  - "Commander ce canape" (icone ExternalLink) — lien Shopify
  - "Reessayer" (icone RotateCcw) — retour etape 3 avec photo conservee
- Toast de confirmation apres telecharger/partager

### 3.7 Responsive mobile

| Element | Desktop (>= 1024px) | Mobile (< 1024px) |
|---------|---------------------|-------------------|
| Layout | 2 colonnes 60/40 | Stack vertical |
| Stepper | Labels + cercles | Cercles seuls |
| Image | Dans colonne gauche | Max 340px hauteur |
| Options | Colonne droite scrollable | Sous l'image |
| CTA | Dans le panneau options | Sticky bar bottom |
| Slider avant/apres | Drag horizontal | Toggle tap |

---

## 4. Micro-interactions transversales

### 4.1 Transitions

- **Standard** : 400ms ease-in-out (conformite charte)
- **Hover boutons** : 300ms ease (transform + shadow)
- **Crossfade images** : 400ms ease-in-out
- **Stepper transition** : slide horizontal 400ms (etape sort a gauche, suivante entre par la droite)
- **Toast** : slide-up 300ms + fade-in, auto-dismiss 4s
- `prefers-reduced-motion` : toutes les durees a 0ms sauf les transitions fonctionnelles (opacite instantanee)

### 4.2 Toast de confirmation

- Position : bas-centre, 24px du bord
- Style : fond #1D1D1B, texte blanc, radius `--radius-md`, padding 12px 20px
- Icone check animee (stroke-dashoffset)
- Auto-dismiss 4s, avec bouton close optionnel
- Z-index : 300 (au-dessus de tout)

### 4.3 Loading images

- Toute image apparait en fade-in (opacity 0→1, 400ms)
- Skeleton shimmer en attendant (couleurs chaudes)
- Next.js Image avec `placeholder="empty"` (pas de blur par defaut — le shimmer suffit)

---

## 5. Accessibilite (WCAG AA)

| Aspect | Action |
|--------|--------|
| Contraste texte muted | #888888 → #767676 (ratio 4.5:1) |
| Focus visible | `outline: 2px solid #E49400; outline-offset: 2px` partout |
| Swatches | `role="radiogroup"` + `role="radio"` + `aria-checked` |
| Configurateur | `aria-modal="true"` + focus trap |
| Stepper | `aria-current="step"` |
| Slider avant/apres | Clavier fleches, `aria-label`, `aria-valuenow` |
| Pills filtres | `role="tablist"` + `role="tab"` + `aria-selected` |
| Images produit | Alt descriptif : "Canape {nom} en {tissu}, vue {angle}" |
| Toast | `role="status"` + `aria-live="polite"` |
| Reduced motion | Respecte `prefers-reduced-motion: reduce` |

---

## 6. Refactor technique

### 6.1 Decomposition ConfiguratorModal

Le composant actuel (300+ lignes, state machine implicite) est decompose en :

```
src/components/public/Configurator/
  index.tsx                  — Conteneur dialog + state machine + stepper
  ConfiguratorStepper.tsx    — Barre de progression 4 etapes
  StepTissu.tsx              — Selection tissu (swatches, categories, preview)
  StepApercu.tsx             — Navigation angles + CTA
  StepSimulation.tsx         — Upload + guidage + SofaPlacer
  StepResultat.tsx           — Slider avant/apres + actions
  BeforeAfterSlider.tsx      — Composant slider reutilisable
  PhotoGuidance.tsx          — Exemples de bon/mauvais cadrage
  PresetRooms.tsx            — Grille de pieces predefinies
  SofaPlacer.tsx             — Deplace depuis components/public/ (ameliore)
  Toast.tsx                  — Composant toast reutilisable
  configurator.module.css    — Styles partages (layout, stepper)
  step-tissu.module.css
  step-apercu.module.css
  step-simulation.module.css
  step-resultat.module.css
  before-after-slider.module.css
```

### 6.2 State machine

```typescript
type ConfiguratorStep = 'tissu' | 'apercu' | 'simulation' | 'resultat'

interface ConfiguratorState {
  step: ConfiguratorStep
  selectedFabricId: string | null
  selectedAngle: string        // view_type de l'angle actif
  uploadedPhoto: File | null   // photo du salon (ou null si preset)
  presetRoomId: string | null  // piece predefinie selectionnee
  sofaPosition: { x: number; y: number; scale: number }
  simulationStatus: 'idle' | 'generating' | 'done' | 'error'
  resultImageUrl: string | null
}
```

Navigation :
- `tissu` → `apercu` : quand un tissu est selectionne
- `apercu` → `simulation` : clic "Simuler chez moi"
- `simulation` → `resultat` : generation terminee
- Retour libre vers toute etape precedente (etat conserve)

### 6.3 Catalogue filtres

- Source des categories : extraites dynamiquement des modeles (`models.dimensions` ou futur champ `category`)
- Si pas de champ category : utiliser une constante cote client pour la v1 (iteration future)
- Le filtre est un state local (pas d'URL pour la v1, sauf la recherche qui pourrait etre dans l'URL)

---

## 7. Contraintes techniques

- **CSS Modules uniquement** (pas de Tailwind, pas de shadcn/ui)
- **Design tokens** depuis `globals.css` (toutes les valeurs hardcodees remplacees par des variables)
- **Motion** (Framer Motion) pour les animations layout et les transitions entre etapes
- **Lucide React** pour les icones
- **Next.js Image** pour toutes les images (optimisation automatique)
- **TypeScript strict** (aucun `any`)
- **Messages en francais** uniquement

---

## 8. Criteres de succes

1. Le configurateur suit un parcours en 4 etapes clair avec stepper visuel
2. Le changement de tissu declenche un crossfade fluide (400ms) de l'image
3. Le slider avant/apres fonctionne au toucher et au clavier
4. Les cards catalogue ont une animation d'entree staggered et un hover elevation
5. Les filtres pills reorganisent la grille avec animation layout
6. Tous les elements interactifs ont un focus-visible conforme
7. Le contraste texte respecte WCAG AA (4.5:1 minimum)
8. Le ConfiguratorModal est decompose en fichiers < 150 lignes chacun
9. Zero regression fonctionnelle sur le parcours existant (selection tissu, simulation, telechargement)
10. Responsive : le configurateur fonctionne correctement sur mobile (sticky bar, stack vertical)
