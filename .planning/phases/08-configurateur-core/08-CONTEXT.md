# Phase 8: Configurateur core - Context

**Gathered:** 2026-03-29 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Le client peut selectionner un tissu, voir le rendu IA correspondant, lire le prix mis a jour et cliquer pour acheter. Le contenu du configurateur remplace le placeholder "Configurateur a venir" dans ConfiguratorModal. La navigation entre angles de vue est hors scope (Phase 9).

</domain>

<decisions>
## Implementation Decisions

### Filtrage tissus par modele
- **D-01:** Le filtrage des tissus eligibles (ayant au moins un rendu publie pour le modele selectionne) se fait dans ConfiguratorModal en croisant `visuals[]` et `fabrics[]` deja recus en props — `visuals.filter(v => v.model_id === model.id)` puis extraction des fabric_id uniques
- **D-02:** Aucun fetch supplementaire, aucune modification de CatalogueSection ou CatalogueClient (contrat Phase 7 D-07/D-08 respecte)
- **D-03:** Les tissus sans `swatch_url` (null) sont exclus de la grille de swatches — pas de placeholder visuel

### Grille de swatches
- **D-04:** Grille CSS Grid responsive de miniatures swatch_url cliquables
- **D-05:** Le swatch selectionne est visuellement distinct avec bordure `--color-primary` (#E49400)
- **D-06:** Les tissus premium affichent un badge "Premium" sur leur swatch

### Rendu IA et fallback
- **D-07:** Quand un tissu est selectionne, l'image principale du modal affiche le rendu IA publie (`generated_image_url` du visual correspondant)
- **D-08:** Si aucun rendu n'existe pour le tissu selectionne, la photo originale du modele s'affiche avec un badge "Photo originale"
- **D-09:** A l'ouverture du modal, aucun tissu n'est pre-selectionne — la photo originale du modele s'affiche par defaut (etat initial null)

### Prix dynamique
- **D-10:** Importer `calculatePrice()` + `formatPrice()` de `src/lib/utils.ts` pour le calcul et le formatage du prix
- **D-11:** Le format local "a partir de X EUR" est remplace par le prix exact quand un tissu est selectionne (plus de prefix "a partir de")
- **D-12:** Le detail du surcout est visible quand un tissu premium est selectionne (affichage du supplement +80 EUR)

### Etat de selection
- **D-13:** `useState<string | null>` (fabric id) dans ConfiguratorModal — pas de Zustand (reserve v10.0 per REQUIREMENTS.md)

### CTA Acheter
- **D-14:** CTA "Acheter sur Shopify" redirige vers `model.shopify_url` en nouvel onglet (`target="_blank"`)
- **D-15:** Le CTA est masque si le modele n'a pas de `shopify_url`

### Layout
- **D-16:** Le contenu configurateur remplace la section placeholder existante (`.placeholder`) dans le body du modal
- **D-17:** Le layout 2 colonnes existant est conserve (image gauche / controles droite sur desktop, colonne unique mobile)

### Claude's Discretion
- Taille exacte des swatches dans la grille (cercles vs carres)
- Espacement entre les swatches
- Position et style du badge "Premium" sur les swatches
- Position et style du badge "Photo originale" sur l'image
- Transition visuelle quand l'image change (fade vs instant)
- Format exact du detail de prix premium (ex: "dont +80 EUR tissu premium")
- Style du CTA "Acheter sur Shopify" (bouton primary vs secondary)
- Accessibilite clavier de la grille de swatches (tab, enter)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Composants a modifier
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — Composant principal, remplacer le placeholder par le configurateur. Props `fabrics[]` et `visuals[]` deja recues mais non utilisees
- `src/components/public/Catalogue/ConfiguratorModal.module.css` — Styles du modal, ajouter styles pour swatches, badges, prix dynamique, CTA

### Utilitaires existants
- `src/lib/utils.ts` — `calculatePrice(basePrice, isPremium)` ligne 16 et `formatPrice(price)` ligne 24 a importer
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — `getPrimaryImage()` locale pour le fallback photo originale

### Types et donnees
- `src/types/database.ts` — Types `Fabric` (swatch_url, is_premium), `VisualWithFabricAndImage` (generated_image_url, model_id, fabric_id, fabric, model_image), `ModelWithImages`

### Requirements
- `.planning/REQUIREMENTS.md` — CONF-01, CONF-02, CONF-03, CONF-05, CONF-07, CONF-08, CONF-09, CONF-10

### Design tokens
- `src/app/globals.css` — Variables CSS custom (--color-primary, --spacing-*, --radius-*, --font-size-*)

### Wireframe
- `fichier-mobelunique/wireframe-page-unique.md` Section 5 — Spec configurateur (layout, contenu swatches, prix)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `calculatePrice(basePrice, isPremium)` dans `utils.ts` : calcul exact base + 80 EUR si premium
- `formatPrice(price)` dans `utils.ts` : formatage EUR via Intl.NumberFormat
- `getPrimaryImage()` dans ConfiguratorModal : selection image 3/4 ou premiere image
- `formatPrice()` local dans ConfiguratorModal : format "a partir de X EUR" — a adapter
- Design tokens complets dans globals.css (couleurs, spacing, radius, transitions)

### Established Patterns
- CSS Modules par composant (un .module.css par composant)
- Tonal layering sans bordures (contraste par fond) — sauf swatch selectionne qui a une bordure primary
- `<dialog>` natif avec `showModal()` pour le modal
- Props drilling : CatalogueSection -> CatalogueClient -> ConfiguratorModal
- next/image pour les images optimisees

### Integration Points
- ConfiguratorModal.tsx : remplacer le placeholder, ajouter logique de selection et affichage
- ConfiguratorModal.module.css : ajouter styles pour swatches grid, badges, prix, CTA
- Importer `calculatePrice` et `formatPrice` depuis `src/lib/utils.ts`
- Pas de modification necessaire sur CatalogueSection, CatalogueClient ou ProductCard

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Navigation entre angles de vue — Phase 9
- Zoom sur l'image du rendu IA — hors scope v9.0
- Filtres tissus par couleur/matiere — hors scope v9.0 (REQUIREMENTS.md Out of Scope)
- Zustand pour state configurateur — reserve v10.0 (REQUIREMENTS.md Out of Scope)
- Extraction getPrimaryImage/formatPrice en utilitaires partages — todo existant Phase 7

</deferred>

---

*Phase: 08-configurateur-core*
*Context gathered: 2026-03-29*
