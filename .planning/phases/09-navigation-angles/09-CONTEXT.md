# Phase 9: Navigation angles - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Le client peut naviguer entre les angles de vue disponibles pour le tissu selectionne via des thumbnails cliquables sous l'image principale. Seuls les angles ayant un rendu IA publie sont affiches quand un tissu est selectionne. Sans tissu, les photos originales sont utilisees.

</domain>

<decisions>
## Implementation Decisions

### Position et layout des thumbnails
- **D-01:** Thumbnails places sous l'image principale dans la colonne gauche (desktop) et sous l'image pleine largeur (mobile) — conforme au wireframe
- **D-02:** Pas de labels texte sous les thumbnails, image seule suffit
- **D-03:** Scroll horizontal (`overflow-x: auto`) sur mobile si le nombre d'angles depasse la largeur ecran
- **D-04:** Fond integre a l'image (meme zone), pas de bandeau background-alt distinct
- **D-05:** Le thumbnail actif a une bordure primary 3px #E49400 + outline 2px — meme traitement que les swatches tissu selectionnes

### Transition et accessibilite
- **D-06:** Fade crossfade ~200ms entre les images quand on clique un thumbnail (pas de changement instantane)
- **D-07:** L'alt text de l'image principale se met a jour avec le nom de l'angle (ex: "Canape Milano en tissu Velours — vue profil")

### Etat initial sans tissu
- **D-08:** A l'ouverture du modal, les thumbnails montrent les photos originales du modele par angle (toutes les model_images)
- **D-09:** L'angle par defaut est 3/4 si disponible, sinon premiere image (logique getPrimaryImage existante)

### Angles sans rendu IA
- **D-10:** Quand un tissu est selectionne, seuls les angles ayant un rendu IA publie pour ce tissu sont affiches — les angles sans rendu sont caches
- **D-11:** Si un seul angle a un rendu publie pour le tissu selectionne, la rangee de thumbnails est masquee (pas de navigation utile)

### Interaction angle + tissu
- **D-12:** Au changement de tissu, l'angle selectionne est conserve si le nouveau tissu a un rendu pour cet angle — sinon reset au 3/4 (ou premier angle disponible)
- **D-13:** A la deselection du tissu, retour aux photos originales du modele avec les thumbnails de tous les angles
- **D-14:** Un `useState<string | null>` separe pour l'angle selectionne (model_image_id ou view_type), independant de selectedFabricId

### Persistance de l'angle
- **D-15:** A la reouverture du modal sur le meme modele, l'angle selectionne est preserve (pas de reset)
- **D-16:** Au changement de modele, l'angle reset au 3/4 (coherent avec le reset du tissu Phase 8)

### Claude's Discretion
- Taille exacte des thumbnails (wireframe suggere 72x54px, a adapter selon l'espace)
- Espacement entre les thumbnails
- Implementation exacte du crossfade (opacity transition sur un seul element ou deux elements superposes)
- Style du scroll horizontal mobile (scrollbar cachee ou visible)
- Gestion du focus clavier sur les thumbnails (tab, enter)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Composant a modifier
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — Composant principal, ajouter la rangee de thumbnails sous l'image, logique de selection d'angle, crossfade
- `src/components/public/Catalogue/ConfiguratorModal.module.css` — Ajouter styles pour thumbnails, scroll horizontal, bordure active, crossfade

### Types et donnees
- `src/types/database.ts` — `VisualWithFabricAndImage` (propriete `model_image: ModelImage` avec `view_type`), `ModelImage` (view_type, image_url)

### Utilitaires existants
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — `getPrimaryImage()` locale (logique 3/4 ou premiere image) a reutiliser pour le defaut

### Design tokens
- `src/app/globals.css` — Variables CSS custom (--color-primary, --spacing-*, --radius-*, --transition-fast)

### Requirements
- `.planning/REQUIREMENTS.md` — CONF-04 (rendu IA publie par angle), CONF-06 (navigation angles via thumbnails)

### Wireframe
- `fichier-mobelunique/wireframe-page-unique.md` Section 5 — Miniatures angles 72x54px, colonne gauche sous l'image

### Phase precedente
- `.planning/phases/08-configurateur-core/08-CONTEXT.md` — D-07/D-08 (rendu IA + fallback), D-09 (etat initial null), D-13 (useState local), D-17 (layout 2 colonnes)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getPrimaryImage(model_images)` dans ConfiguratorModal : logique de selection 3/4 ou premiere image — reutilisable pour le defaut d'angle
- `model.model_images` : tableau de tous les angles du modele avec `view_type` et `image_url`
- `visuals[]` : deja passes en props, contiennent `model_image: ModelImage` avec `view_type` pour croiser angles et rendus IA
- Design tokens complets dans globals.css (transitions, spacing, radius)
- `.swatchSelected` dans ConfiguratorModal.module.css : pattern de bordure primary reutilisable pour le thumbnail actif

### Established Patterns
- CSS Modules par composant
- `<dialog>` natif avec `showModal()`
- `useState` local pour la selection (selectedFabricId existant)
- `useEffect` sur `model?.id` pour reset au changement de modele
- next/image pour les images optimisees
- Tonal layering sans bordures (sauf elements selectionnes)

### Integration Points
- ConfiguratorModal.tsx : ajouter useState pour selectedAngle, rangee de thumbnails sous `.imageWrapper`, logique de crossfade sur l'image principale
- ConfiguratorModal.module.css : ajouter styles `.thumbnailRow`, `.thumbnail`, `.thumbnailActive`, crossfade animation
- Modifier la logique `currentVisual` pour filtrer aussi par `model_image_id` (angle selectionne)
- Modifier la logique `displayImageUrl` pour prendre en compte l'angle selectionne

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Zoom sur l'image du rendu IA — hors scope v9.0 (REQUIREMENTS.md Out of Scope)
- Swipe gauche/droite entre angles sur mobile — possible amelioration future
- Animation de slide entre angles (au lieu du fade) — non retenue, fade choisi

</deferred>

---

*Phase: 09-navigation-angles*
*Context gathered: 2026-03-30*
