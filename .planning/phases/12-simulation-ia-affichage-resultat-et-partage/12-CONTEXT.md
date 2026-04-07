# Phase 12: Simulation IA -- Affichage resultat et partage - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Affichage du rendu simulation IA dans le modal configurateur, avec options de telechargement, partage et relance. Le resultat est deja genere et stocke en blob par Phase 11 — cette phase gere uniquement son affichage et les actions post-resultat.

</domain>

<decisions>
## Implementation Decisions

### Affichage du resultat
- **D-01:** Le resultat IA s'affiche dans la colonne gauche du modal, meme emplacement que la zone upload/preview Phase 11. Pas de lightbox, pas de slider before/after.
- **D-02:** Disclaimer discret sous l'image : "Apercu genere par IA — le rendu reel peut varier" en texte gris petit
- **D-03:** Titre de l'etape resultat : "Votre simulation". Sous-titre dynamique : "{model.name} x {fabric.name} dans votre salon" (ou "Canape original" si pas de tissu)

### Transition visuelle
- **D-04:** Fondu enchaine de la barre de progression vers l'image resultat en ~400ms. La progression passe a 100%, puis fondu vers l'image.

### Actions post-resultat
- **D-05:** 4 boutons d'action sous le resultat :
  1. "Telecharger" — telechargement direct du blob JPEG, nom fichier `mobel-unique-simulation.jpg`
  2. "Partager" — Web Share API si disponible (mobile natif), sinon lien WhatsApp `wa.me/`
  3. "Commander sur Shopify" — lien vers `model.shopify_url` (meme CTA que le configurateur)
  4. "Essayer une autre photo" — retour a l'etat idle (zone upload DnD vierge), config tissu preservee
- **D-06:** Telechargement direct JPEG sans choix de format. Utilise `URL.createObjectURL` + `<a download>` pattern
- **D-07:** Partage : `navigator.share({ files: [blob] })` sur mobile si supporte, sinon `https://wa.me/?text=...` avec message pre-rempli sur desktop

### Experience mobile
- **D-08:** Layout 1 colonne : image resultat en haut, 4 boutons d'action empiles verticalement en dessous. Coherent avec le layout upload Phase 11.

### Gestion de flux
- **D-09:** "Essayer une autre photo" reset a l'etat `idle` (zone upload vierge). Efface `resultBlobUrl` et `selectedFile`. La selection tissu/modele est preservee.
- **D-10:** Pas d'historique de simulations. Chaque simulation est ephemere — l'utilisateur telecharge s'il veut conserver. State management reste en `useState` local.

### Claude's Discretion
- Style exact des boutons d'action (primaire, secondaire, outline)
- Icones des boutons (download, share, cart, refresh)
- Espacement et padding du layout resultat
- Message pre-rempli pour le partage WhatsApp
- Gestion du cas `shopify_url === null` (masquer le bouton Commander)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Composant modal existant (Phase 11 implementation)
- `src/components/public/Catalogue/ConfiguratorModal.tsx` -- Modal avec state machine 5 etats (idle/preview/generating/done/error), `resultBlobUrl` stocke mais non rendu dans etat `done`
- `src/components/public/Catalogue/ConfiguratorModal.module.css` -- Styles existants a etendre pour l'etape resultat

### API simulation
- `src/app/api/simulate/route.ts` -- Route POST retourne JPEG binaire avec watermark, fabric_id optionnel

### Design tokens
- `src/app/globals.css` -- Variables CSS (--color-primary, --color-bg-alt, --radius-*, --shadow-*)

### Contexte Phase 11
- `.planning/phases/11-simulation-ia-upload-et-traitement/11-CONTEXT.md` -- Decisions D-01 a D-19, state machine, patterns etablis
- `.planning/phases/11-simulation-ia-upload-et-traitement/11-02-SUMMARY.md` -- Implementation details, known stubs (etat done sans rendu)

### Wireframe
- `.planning/maquette/wireframe-page-unique.md` Section 7 -- Spec simulation (3 etats, zone upload, progression, resultat)

### Requirements
- `.planning/REQUIREMENTS.md` -- SIM-01 (upload photo salon et simulation IA)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resultBlobUrl` (state dans ConfiguratorModal) — blob URL du JPEG genere, pret a afficher via `<img src={resultBlobUrl}>`
- `selectedFabric` — tissu selectionne pour le sous-titre dynamique
- `model.shopify_url` — URL Shopify pour le CTA Commander
- `handleBackToConfigurator` — fonction retour deja implementee
- CTA Shopify pattern — `<a>` avec classe `ctaShopify` deja style

### Established Patterns
- CSS Modules avec tonal layering (pas de bordures, contraste par fond)
- useState local pour state management dans le modal
- URL.revokeObjectURL dans 3 chemins (handleFileSelected, reset model, unmount)
- Transitions CSS 400ms (design system Stitch)

### Integration Points
- Etat `simulationState === 'done'` dans ConfiguratorModal — actuellement un stub sans rendu JSX
- `resultBlobUrl` est set dans `handleLancerSimulation` mais jamais utilise dans le JSX
- Colonne gauche `leftColumn` du `simulationStep` — ajouter un bloc conditionnel pour `done`

</code_context>

<specifics>
## Specific Ideas

- Le flux doit etre fluide : generation → fondu → resultat avec actions. Pas de page intermediaire.
- Le download doit etre instantane (le blob est deja en memoire, pas de re-fetch serveur)
- Le partage mobile doit utiliser le menu natif du systeme quand possible (meilleure UX)
- Le disclaimer IA doit etre discret — ne pas detourner de l'impact visuel du resultat

</specifics>

<deferred>
## Deferred Ideas

- Historique/galerie de simulations en session — feature a part entiere
- Streaming/SSE pour progression reelle — complexite disproportionnee
- Comparaison before/after avec slider — pourrait etre ajoute en polish
- Integration Nano Banana reelle — M012+

</deferred>

---

*Phase: 12-simulation-ia-affichage-resultat-et-partage*
*Context gathered: 2026-04-07*
