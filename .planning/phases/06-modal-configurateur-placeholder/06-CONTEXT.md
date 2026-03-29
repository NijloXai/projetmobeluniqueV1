# Phase 6: Modal configurateur placeholder - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Le CTA "Configurer ce modele" de chaque card produit ouvre un modal large accessible qui affiche un teaser du canape selectionne et annonce le configurateur a venir. Le modal est un placeholder — le contenu reel du configurateur (swatches, rendu IA, prix dynamique) est hors scope (v9.0).

</domain>

<decisions>
## Implementation Decisions

### Contenu du placeholder (Teaser riche)
- **D-01:** Le modal affiche l'image principale du canape (reutilise la logique `getPrimaryImage` de ProductCard), le nom, le prix formate, et la description du modele
- **D-02:** Sous un separateur, un message "Configurateur a venir" avec texte explicatif : "Bientot, personnalisez tissu et couleur depuis cette page."
- **D-03:** Le modele selectionne est passe via le callback `onConfigure` deja cable sur ProductCard (prop `ModelWithImages`)

### Approche technique
- **D-04:** Utiliser `<dialog>` natif avec `showModal()` — coherent avec ConfirmDialog admin existant
- **D-05:** Focus trap manuel : pieger le focus dans le modal tant qu'il est ouvert (Tab/Shift+Tab cyclent entre les elements focusables)
- **D-06:** Retour du focus au CTA declencheur a la fermeture du modal
- **D-07:** `aria-modal="true"` et `role="dialog"` sur l'element `<dialog>`

### Design
- **D-08:** Pas d'animation d'ouverture/fermeture — apparition instantanee
- **D-09:** Bouton de fermeture : icone X (Lucide `X`) dans un cercle subtil, positionne en haut a droite du modal
- **D-10:** Taille : 90vw desktop avec max-width raisonnable, plein ecran (100vw/100vh) mobile
- **D-11:** Fond blanc, tonal layering (pas de bordures), ombre large. Backdrop semi-transparent

### Comportement mobile
- **D-12:** Plein ecran sur mobile (< 640px) — le modal occupe tout l'ecran
- **D-13:** Pas de swipe-down pour fermer — fermeture par bouton X, Escape ou clic overlay uniquement
- **D-14:** Fermeture via touche Escape (natif avec `<dialog>`)

### Claude's Discretion
- Scroll lock body quand le modal est ouvert (overflow:hidden ou autre approche selon contraintes iOS Safari)
- Padding interne et espacement des elements dans le modal
- Breakpoint exact pour le switch 90vw → plein ecran
- Taille et style exact de l'image dans le modal (aspect-ratio, max-height)
- Style du separateur entre le contenu produit et le message placeholder

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Composants existants a modifier
- `src/components/public/Catalogue/CatalogueClient.tsx` — Client Component, wire `onConfigure` pour ouvrir le modal avec le modele selectionne
- `src/components/public/Catalogue/ProductCard.tsx` — Prop `onConfigure` deja definie, CTA "Configurer ce modele" deja cable

### Pattern modal existant
- `src/components/admin/ConfirmDialog.tsx` — Pattern `<dialog>` + `showModal()` + `useRef` + `useEffect` a adapter
- `src/components/admin/ConfirmDialog.module.css` — Styles de reference (backdrop, radius, shadow)

### Types et donnees
- `src/types/database.ts` — Type `ModelWithImages` (name, price, description, model_images)

### Design tokens
- `src/app/globals.css` — Variables CSS custom (colors, spacing, typography, radius, shadows)

### Maquette et wireframe
- `fichier-mobelunique/wireframe-page-unique.md` Section 5 — Spec configurateur (layout 2 colonnes 60/40, futur contenu)

### Requirements
- `.planning/REQUIREMENTS.md` — MODAL-01, MODAL-02, MODAL-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ConfirmDialog` : pattern `<dialog>` natif avec `showModal()` / `close()` via `useRef` + `useEffect` — adapter pour un modal plus large
- `getPrimaryImage()` dans ProductCard : logique de selection image 3/4 reutilisable
- `formatPrice()` dans ProductCard : formatage prix deja en place
- Lucide React : icone `X` disponible pour le bouton fermer
- `ModelWithImages` type : contient toutes les donnees necessaires (name, price, description, model_images)

### Established Patterns
- CSS Modules par composant — nouveau fichier `ConfiguratorModal.module.css`
- Tonal layering (pas de bordures, contraste par fond) — coherent phases 1-5
- `<dialog>::backdrop` pour le fond semi-transparent — etabli par ConfirmDialog
- Design tokens globals.css pour couleurs, spacing, radius, shadows

### Integration Points
- `CatalogueClient.tsx` : ajouter `useState<ModelWithImages | null>` pour le modele selectionne, passer `onConfigure` a chaque ProductCard
- Nouveau composant `ConfiguratorModal` dans `src/components/public/Catalogue/`
- Pas de changement a `ProductCard.tsx` (prop `onConfigure` deja definie)
- Pas de changement a `CatalogueSection.tsx` (Server Component)

</code_context>

<specifics>
## Specific Ideas

- Le teaser riche doit donner envie — montrer l'image du canape, pas juste du texte
- Le message placeholder doit etre positif et tournee vers l'avenir ("Bientot") pas un dead-end
- Reutiliser `getPrimaryImage` et `formatPrice` depuis ProductCard pour coherence visuelle

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-modal-configurateur-placeholder*
*Context gathered: 2026-03-29*
