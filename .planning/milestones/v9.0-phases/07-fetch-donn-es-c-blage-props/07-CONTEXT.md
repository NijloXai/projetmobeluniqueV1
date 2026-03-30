# Phase 7: Fetch donnees + cablage props - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Les donnees tissus et visuels publies sont charges cote serveur dans CatalogueSection et passes en props jusqu'a ConfiguratorModal. Zero fetch client au moment de l'ouverture du modal. Phase 7 fournit les donnees brutes — la logique d'affichage (swatches, rendu IA, filtrage par modele) est Phase 8.

</domain>

<decisions>
## Implementation Decisions

### Strategie de fetch (Fetch global en bloc)
- **D-01:** CatalogueSection execute 3 queries Supabase en parallele via `Promise.all` : models (existant), fabrics actifs, visuels publies (valides + publies + tissu actif)
- **D-02:** Les visuels sont fetches en une seule requete globale (tous modeles confondus), pas de fetch par modele (evite N+1)
- **D-03:** Les tissus sont fetches via Supabase direct dans le Server Component (comme models), pas via une API publique

### Contrat de props (Props plates)
- **D-04:** CatalogueClient recoit 3 props separees : `models: ModelWithImages[]`, `fabrics: Fabric[]`, `visuals: VisualWithFabricAndImage[]`
- **D-05:** ConfiguratorModal recoit `model` + `fabrics[]` + `visuals[]` separement — chaque prop a un role clair
- **D-06:** Le type `VisualWithFabricAndImage` est defini dans database.ts : `GeneratedVisual & { fabric: Fabric, model_image: ModelImage }`

### Filtrage et responsabilites
- **D-07:** Phase 7 passe TOUS les tissus actifs et TOUS les visuels publies au modal sans filtrage par modele
- **D-08:** Le filtrage "tissus ayant au moins un rendu publie pour ce modele" est la responsabilite de Phase 8 cote UI
- **D-09:** Les tissus desactives (`is_active = false`) sont filtres cote JS apres le fetch Supabase (PostgREST ne filtre pas sur jointures imbriquees)

### Claude's Discretion
- Source donnees tissus : Supabase direct ou creation API publique GET /api/fabrics (recommande Supabase direct)
- Gestion erreur si un des 3 fetches echoue (degradation gracieuse vs erreur totale)
- Structure exacte du type VisualWithFabricAndImage et placement dans database.ts
- Strategie de filtrage `is_active` sur les visuels (query `.eq()` vs filtre JS)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Composants a modifier
- `src/components/public/Catalogue/CatalogueSection.tsx` — Server Component, actuellement fetch models uniquement. Ajouter fetch fabrics + visuals en Promise.all
- `src/components/public/Catalogue/CatalogueClient.tsx` — Client Component, actuellement recoit `models[]`. Etendre avec props `fabrics[]` + `visuals[]`, forwarding au modal
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — Placeholder actuel. Etendre l'interface props avec `fabrics[]` + `visuals[]` (contenu UI = Phase 8)

### Types et schemas
- `src/types/database.ts` lignes 196-214 — Types Fabric, GeneratedVisual, ModelWithImages, ModelWithImagesAndVisuals. Ajouter VisualWithFabricAndImage

### API existante (reference)
- `src/app/api/models/[slug]/visuals/route.ts` — API publique per-model, filtre validated+published+fabric.is_active. Pattern de reference pour les filtres Supabase

### Supabase client
- `src/lib/supabase/server.ts` — createClient server-side, utilise par CatalogueSection

### Requirements
- `.planning/REQUIREMENTS.md` — CONF-01, CONF-02, CONF-04, CONF-05, CONF-07, CONF-08, CONF-09, CONF-10

### Wireframe
- `fichier-mobelunique/wireframe-page-unique.md` Section 5 — Spec configurateur (layout, contenu)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CatalogueSection.tsx` : pattern Server Component avec fetch Supabase + mapping donnees — etendre avec Promise.all
- `GET /api/models/[slug]/visuals` : logique de filtrage visuels (validated + published + fabric.is_active) — reproduire dans le Server Component
- `ModelWithImagesAndVisuals` type : existe deja, reference pour la structure visuals + fabric
- `getPrimaryImage()` et `formatPrice()` dans ConfiguratorModal : dupliques avec ProductCard, a extraire eventuellement

### Established Patterns
- Server Component fetch Supabase direct (pas d'API interne) — CatalogueSection etablit ce pattern
- Props drilling : CatalogueSection → CatalogueClient → ConfiguratorModal
- CSS Modules par composant
- Types enrichis avec relations dans database.ts

### Integration Points
- `CatalogueSection.tsx` : ajouter 2 queries paralleles (fabrics, visuals) dans Promise.all
- `CatalogueClient.tsx` : etendre interface CatalogueClientProps avec fabrics + visuals, forwarding au modal
- `ConfiguratorModal.tsx` : etendre interface ConfiguratorModalProps avec fabrics + visuals (contenu placeholder remplace en Phase 8)
- `database.ts` : ajouter type VisualWithFabricAndImage

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Extraction de `getPrimaryImage`/`formatPrice` en utilitaires partages (todo pending, v9.0 ou v10.0)
- API publique GET /api/fabrics — pas necessaire tant que le fetch est server-side, a creer si besoin client futur
- Cache/revalidate des donnees — a evaluer en v10.0 si performance le justifie

</deferred>

---

*Phase: 07-fetch-donn-es-c-blage-props*
*Context gathered: 2026-03-29*
