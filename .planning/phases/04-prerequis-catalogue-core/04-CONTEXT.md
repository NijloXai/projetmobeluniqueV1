# Phase 4: Prerequis + Catalogue core - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Configurer next.config.ts pour les images Supabase, puis creer la section catalogue sur la page publique avec des cards produits alimentees par GET /api/models. Grid responsive 1/2/3 colonnes, skeleton loading, et integration dans page.tsx apres HowItWorks. Le CTA des cards sera connecte au modal configurateur en Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Configuration next.config.ts
- **D-01:** Ajouter `images.remotePatterns` pour autoriser les URLs Supabase Storage (`*.supabase.co`). Prerequis bloquant — aucune image produit ne s'affiche sans ca.

### Design des cards (Atelier Editorial)
- **D-02:** Style fidele a la maquette Stitch — image portrait aspect-ratio 4/5 bord-a-bord, nom Montserrat bold uppercase + description courte muted, prix en primary bold aligne a droite
- **D-03:** CTA "Configurer ce modele" pleine largeur en bas de la card, fond transparent avec bordure primary subtile, hover → fond primary + texte blanc
- **D-04:** Fond card `#F6F3EF` (surface-container-low), hover → `#EBE8E4` (surface-container-high). Tonal layering, pas de bordures
- **D-05:** Hover image : zoom subtil (scale 1.05, transition 700ms) dans un overflow hidden

### Section layout
- **D-06:** Titre H2 = "Nos Canapes" (simple et direct, style wireframe)
- **D-07:** Fond section blanc `#FFFFFF` — alternance avec HowItWorks beige au-dessus
- **D-08:** ID `catalogue` sur la section pour que le CTA Hero `#catalogue` fonctionne (scroll smooth deja configure)

### Image produit
- **D-09:** Priorite `view_type === '3/4'` dans model_images, fallback sur la premiere image (sort_order le plus bas)
- **D-10:** Si aucune image pour un modele : placeholder gris avec icone canape (Lucide Sofa) centree

### Etat sans produit
- **D-11:** Si aucun canape actif en BDD : message simple centre "Nos canapes arrivent bientot." — texte muted, pas d'icone

### Data fetching
- **D-12:** Server Component fetch directement dans page.tsx (ou CatalogueSection Server Component), passe les donnees en props au client component pour l'interactivite (Phase 5)
- **D-13:** Skeleton loading avec cards placeholder pendant le chargement (CSS shimmer, memes dimensions que les vraies cards)

### Claude's Discretion
- Sous-titre de la section catalogue (court, ton invitant)
- Padding et espacement de la section (coherent avec HowItWorks)
- Dimensions exactes du skeleton loading
- Format d'affichage du prix (ex: "1 290 EUR" ou "a partir de 1 290 EUR")
- Placeholder image : nuance de gris et taille de l'icone

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API et types
- `src/app/api/models/route.ts` — GET /api/models retourne Model avec model_images tries par sort_order
- `src/types/database.ts` lignes 135-170 — Type Model (name, price, slug, description, dimensions) et ModelImage (image_url, view_type, sort_order)
- `src/types/database.ts` lignes 204-207 — Type ModelWithImages deja defini

### Page existante
- `src/app/page.tsx` — Server Component, importe Header + Hero + HowItWorks. Catalogue s'insere apres HowItWorks
- `src/app/page.module.css` — Styles existants de la page

### Config
- `next.config.ts` — Actuellement vide, doit recevoir remotePatterns Supabase

### Maquette et wireframe
- `fichier-mobelunique/stitch-desktop-hero.html` lignes 190-242 — Section catalogue HTML Stitch (cards Milano/Oslo/Firenze)
- `fichier-mobelunique/wireframe-page-unique.md` Section 4 — Spec catalogue (layout, interactions, responsive)

### Design tokens
- `src/app/globals.css` — Variables CSS custom (colors, spacing, typography, radius)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ModelWithImages` type dans database.ts — exact type retourne par GET /api/models
- `createClient` (server) dans `src/lib/supabase/server.ts` — pour fetch cote serveur
- Lucide React (installe) — icone Sofa pour placeholder image vide

### Established Patterns
- CSS Modules par composant (.module.css) — convention stricte
- Tonal layering (pas de bordures, contraste par fond) — etabli dans Phases 1-3
- Server Component pour page.tsx — pattern des phases precedentes
- Montserrat font avec tokens (font-weight 400/500/600/700) dans globals.css

### Integration Points
- `page.tsx` — ajouter `<CatalogueSection />` apres `<HowItWorks />`
- `next.config.ts` — ajouter remotePatterns pour domaine Supabase
- Hero CTA `#catalogue` → doit matcher `id="catalogue"` sur la section
- `src/components/public/` — nouveau dossier `Catalogue/`

</code_context>

<specifics>
## Specific Ideas

- Le catalogue doit etre scalable pour 20+ produits au fil du temps (le client va ajouter des canapes)
- Style "Atelier Editorial" : premium e-commerce, pas template basique
- Alternance de fond blanc/beige entre les sections pour creer du rythme visuel

</specifics>

<deferred>
## Deferred Ideas

- Swatches miniatures tissus sur les cards — v9.0 (depend de l'API fabrics)
- Tri prix/nouveautes — reporte par decision utilisateur
- Pagination / scroll infini — pas necessaire pour 20-30 produits
- Animation d'entree des cards au scroll — peut etre ajoute plus tard si souhaite

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-prerequis-catalogue-core*
*Context gathered: 2026-03-28*
