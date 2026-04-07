# Phase 11: Simulation IA -- Upload et traitement - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Upload photo salon par l'utilisateur et envoi au service IA pour simulation du canape configure dans l'environnement. Le resultat IA est genere et recu. L'affichage du resultat, le telechargement et le partage sont hors scope (Phase 12).

</domain>

<decisions>
## Implementation Decisions

### Emplacement de la simulation
- **D-01:** La simulation est une nouvelle etape dans le ConfiguratorModal existant, pas une section separee sur la page
- **D-02:** Navigation via CTA "Visualiser chez moi" (style outline/secondaire) place sous le CTA "Acheter sur Shopify", visible meme sans tissu selectionne
- **D-03:** Bouton retour "Modifier la configuration" pour revenir a l'etape tissu
- **D-04:** Layout 2 colonnes conserve : la zone upload remplace l'image canape a gauche, rappel config + CTAs a droite
- **D-05:** Bandeau compact en haut de l'etape simulation : mini swatch (24px) + "Milano x Bleu Nuit" + lien "Modifier" vers etape tissu. Fond bg-alt
- **D-06:** Texte explicatif court au-dessus de la zone upload ("Prenez votre salon en photo, on y place votre canape") — pas d'exemple avant/apres en images
- **D-07:** Sur mobile (1 colonne) : zone upload en haut, rappel config + CTA en bas

### Zone d'upload et interaction
- **D-08:** Zone drag & drop desktop + input unique accept=image/* (sur mobile, le navigateur propose naturellement camera ou galerie)
- **D-09:** Apres selection photo : preview de l'image dans la zone upload + bouton "Lancer la simulation" + lien "Changer de photo"
- **D-10:** Formats acceptes : JPEG, PNG, HEIC/HEIF. Taille max : 15 Mo (API a mettre a jour de 10 Mo a 15 Mo)
- **D-11:** Validation cote client avant envoi : file.size <= 15 Mo et file.type in [image/jpeg, image/png, image/heic, image/heif]. Messages d'erreur en francais

### Feedback pendant le traitement
- **D-12:** Photo salon affichee en fond avec overlay sombre + barre de progression + 3 etapes detaillees
- **D-13:** Barre de progression simulee (timer) : 0-30% rapide (1s), 30-70% lent (3-5s), 70-100% a reception du resultat
- **D-14:** 3 etapes : "Analyse de la piece" / "Integration du canape" / "Finition et eclairage"
- **D-15:** Bouton "Annuler" sous la barre de progression. AbortController cote client pour couper le fetch. Retour a l'etat preview photo

### Prerequis et garde-fous
- **D-16:** Tissu optionnel pour la simulation — si aucun tissu selectionne, utiliser la photo originale du canape comme reference pour le prompt IA. L'API devra accepter fabric_id optionnel
- **D-17:** Messages d'erreur inline dans la zone upload (fichier trop gros, format invalide) et dans la zone de progression (erreur IA serveur) + bouton "Reessayer"
- **D-18:** Pas de retry automatique — l'utilisateur decide via bouton "Reessayer"

### State management
- **D-19:** useState local dans ConfiguratorModal. Etat simulation : 'idle' | 'preview' | 'generating' | 'done' | 'error'. Coherent avec le pattern actuel (Zustand reserve pour plus tard)

### Claude's Discretion
- Style exact de la zone drag & drop (bordure dashed vs tonal layering sans bordure)
- Padding, espacement et taille de la zone upload
- Animation/transition entre etape tissu et etape simulation
- Timing exact de la progression simulee
- Icone dans la zone upload (camera, image, upload)
- Conversion HEIC cote serveur si necessaire (Sharp peut lire HEIC)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API simulation existante
- `src/app/api/simulate/route.ts` -- Route POST /api/simulate, FormData (image + model_id + fabric_id), retourne JPEG + watermark. MAX_FILE_SIZE a mettre a jour (10 Mo -> 15 Mo), fabric_id a rendre optionnel
- `src/lib/ai/types.ts` -- Interface GenerateRequest (modelName, fabricName, viewType, sourceImageUrl)
- `src/lib/ai/index.ts` -- Factory getIAService(), mock vs NanoBanana
- `src/lib/ai/mock.ts` -- MockIAService avec generate() et addWatermark() via Sharp
- `src/lib/ai/prompts.ts` -- buildSimulatePrompt(modelName, fabricName) pour la simulation

### Composant modal existant
- `src/components/public/Catalogue/ConfiguratorModal.tsx` -- Modal configurateur a etendre avec etape simulation. Contient deja : selection tissu, angles, prix dynamique, CTA Shopify
- `src/components/public/Catalogue/ConfiguratorModal.module.css` -- Styles du modal a etendre
- `src/components/public/Catalogue/CatalogueClient.tsx` -- Parent qui gere l'etat modal (model selectionne, fabrics, visuals)

### Types et donnees
- `src/types/database.ts` -- Types ModelWithImages, Fabric, VisualWithFabricAndImage
- `src/lib/utils.ts` -- getPrimaryImage, calculatePrice, formatPrice

### Design tokens
- `src/app/globals.css` -- Variables CSS (--color-primary, --color-bg-alt, --radius-*, --shadow-*)

### Wireframe
- `.planning/maquette/wireframe-page-unique.md` Section 7 -- Spec simulation (3 etats, zone upload, progression, resultat). Adapte pour integration dans le modal

### Requirements
- `.planning/REQUIREMENTS.md` -- SIM-01 (upload photo salon)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `POST /api/simulate` : route complete qui accepte FormData et retourne JPEG avec watermark — a adapter pour fabric_id optionnel et MAX_FILE_SIZE 15 Mo
- `buildSimulatePrompt()` : prompt pre-construit pour la simulation (modelName, fabricName)
- `MockIAService.generate()` : generateur mock Sharp qui fonctionne deja avec viewType='simulation'
- `ConfiguratorModal` : composant complet avec dialog natif, scroll lock iOS, backdrop click, selection tissu et angles
- `getPrimaryImage()` / `formatPrice()` dans utils.ts : reutilisables pour le rappel config

### Established Patterns
- Dialog natif `<dialog>` + `showModal()` (Phase 6) — pas de Radix
- CSS Modules par composant — nouveau fichier ou extension de ConfiguratorModal.module.css
- Tonal layering (pas de bordures, contraste par fond) — design system etabli
- Scroll lock iOS-safe (position:fixed pattern) — deja en place dans ConfiguratorModal
- useState local pour state management dans le modal (Phase 8-9)
- AbortController natif pour annulation fetch

### Integration Points
- `ConfiguratorModal.tsx` : ajouter un state 'step' ('configurator' | 'simulation'), conditionner le rendu gauche/droite selon le step
- `CatalogueClient.tsx` : pas de changement necessaire (les props model/fabrics/visuals sont deja passees)
- `/api/simulate/route.ts` : modifier MAX_FILE_SIZE et rendre fabric_id optionnel
- `src/lib/ai/prompts.ts` : adapter buildSimulatePrompt si fabric optionnel

</code_context>

<specifics>
## Specific Ideas

- Le flux doit rester fluide dans le modal : tissu -> "Visualiser chez moi" -> upload -> simulation -> resultat (Phase 12)
- L'utilisateur mobile doit pouvoir prendre directement une photo de son salon via le selecteur natif du navigateur
- La progression simulee (timer) doit sembler naturelle — accelerer au debut, ralentir au milieu, completer instantanement a reception
- Le bandeau rappel config doit etre compact et discret — ne pas detourner de l'action principale (upload)

</specifics>

<deferred>
## Deferred Ideas

- Affichage du resultat simulation (image, watermark, disclaimer) -- Phase 12
- Telechargement de l'image resultat -- Phase 12
- Partage WhatsApp -- Phase 12
- CTA "Commander sur Shopify" post-simulation -- Phase 12
- Lien "Reessayer avec une autre photo" -- Phase 12
- Streaming/SSE pour progression reelle -- hors scope, complexite disproportionnee

</deferred>

---

*Phase: 11-simulation-ia-upload-et-traitement*
*Context gathered: 2026-04-07*
