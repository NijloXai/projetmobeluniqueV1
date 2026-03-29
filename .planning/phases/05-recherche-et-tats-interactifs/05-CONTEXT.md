# Phase 5: Recherche et etats interactifs - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Ajouter une barre de recherche au catalogue existant pour filtrer les canapes par nom, avec compteur de resultats dynamique et etat vide informatif. Le filtre s'ajoute dans CatalogueClient (deja Client Component). Pas de nouvelles routes API — filtrage cote client sur les donnees deja fetchees par CatalogueSection (Server Component).

</domain>

<decisions>
## Implementation Decisions

### Design barre de recherche
- **D-01:** Barre de recherche centree sous le sous-titre, avant la grille — coherent avec le layout centre existant du sectionHeader
- **D-02:** Style fond teinte sans bordure : fond `#F6F3EF` (surface-container-low), icone loupe muted a gauche, coins arrondis — tonal layering coherent avec les cards
- **D-03:** Placeholder texte : "Rechercher un canape..."
- **D-04:** Largeur max ~480px centree (meme contrainte que le sous-titre)

### Comportement du filtre
- **D-05:** Filtre sur `model.name` uniquement — simple et previsible pour l'utilisateur
- **D-06:** Filtre instantane a chaque frappe (pas de debounce) — acceptable pour 20-30 produits en memoire
- **D-07:** Normalisation des accents pour la comparaison (NFD + suppression diacritiques) — "canape" et "canape" donnent le meme resultat

### Compteur de resultats
- **D-08:** Format naturel singulier/pluriel : "1 canape" / "3 canapes"
- **D-09:** Position sous la barre de recherche, au-dessus de la grille, texte muted petit — feedback immediat
- **D-10:** Le compteur se met a jour en temps reel avec le filtre actif

### Etat vide recherche
- **D-11:** Message : "Aucun canape ne correspond a \"[terme]\"" — reprend le terme saisi
- **D-12:** Bouton "Effacer la recherche" sous le message pour revenir a la liste complete
- **D-13:** Style coherent avec l'etat vide existant (`.emptyMessage` dans CatalogueSection.module.css) — texte muted centre

### Claude's Discretion
- Espacement exact entre la barre de recherche et le compteur
- Taille de l'icone loupe et padding interne du champ
- Animation/transition sur le filtrage des cards (fade ou instantane)
- Focus ring style sur le champ de recherche
- Responsive : largeur du champ sur mobile (full-width ou avec marges)
- Bouton clear (X) dans le champ quand du texte est saisi

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Composants existants a modifier
- `src/components/public/Catalogue/CatalogueClient.tsx` — Client Component qui recoit `models` en props, ajout du state de recherche ici
- `src/components/public/Catalogue/CatalogueSection.module.css` — Styles section existants (`.sectionHeader`, `.grid`, `.emptyMessage`)

### Composants a consulter (patterns)
- `src/components/public/Catalogue/ProductCard.tsx` — Utilise `model.name` pour le filtrage
- `src/components/public/Catalogue/CatalogueSection.tsx` — Server Component, fetch Supabase, passe `models` a CatalogueClient

### Types et API
- `src/types/database.ts` — Type `ModelWithImages` (name, price, model_images)

### Design tokens
- `src/app/globals.css` — Variables CSS custom (--color-surface-container-low, --color-muted, spacing, radius)

### Maquette et wireframe
- `fichier-mobelunique/wireframe-page-unique.md` Section 4 — Spec catalogue (layout, interactions)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CatalogueClient` : deja Client Component avec `useState` potentiel — le filtre s'ajoute directement ici
- `.emptyMessage` dans CatalogueSection.module.css : style etat vide existant reutilisable
- `.sectionHeader` : layout centre existant ou inserer le champ de recherche
- Lucide React installe : icone `Search` disponible pour la loupe

### Established Patterns
- CSS Modules par composant — tout nouveau style dans CatalogueSection.module.css (ou nouveau fichier si composant separe)
- Tonal layering : fond teinte sans bordures pour les elements interactifs
- Montserrat avec tokens font-weight dans globals.css
- `id="catalogue"` sur la section pour le scroll depuis le Hero CTA

### Integration Points
- `CatalogueClient.tsx` : ajouter `useState` pour le terme de recherche, filtrer `models` avant le `.map()`
- `CatalogueSection.module.css` : ajouter les styles pour `.searchBar`, `.resultCount`, `.emptySearch`, `.resetButton`
- Pas de changement a `CatalogueSection.tsx` (Server Component) ni a `page.tsx`

</code_context>

<specifics>
## Specific Ideas

- Le compteur "3 canapes" doit se sentir naturel, pas technique — singulier/pluriel correct
- Le bouton "Effacer la recherche" doit etre visible mais pas dominant — style lien ou bouton secondaire
- La recherche insensible aux accents est critique pour l'UX francaise (beaucoup de gens tapent sans accents)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-recherche-et-tats-interactifs*
*Context gathered: 2026-03-29*
