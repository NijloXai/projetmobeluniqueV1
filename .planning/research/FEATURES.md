# Feature Research — M009 Configurateur Tissu

**Domain:** Configurateur tissu canapé — SPA Next.js avec visuels IA pré-générés
**Milestone:** M009 — Remplacement du placeholder "Configurateur à venir" par le configurateur réel
**Researched:** 2026-03-29
**Confidence:** HIGH (wireframe v4 + schéma DB + API existantes + analyse concurrentielle)

---

## Context

Le modal configurateur (MODAL-01/02/03) est en place : dialog natif, focus trap, fermeture
Escape/X/backdrop, scroll lock iOS. Il affiche actuellement un placeholder "Configurateur à venir".

Les données backend sont complètes :
- `GET /api/models/[slug]/visuals` : rendus publiés (is_validated + is_published + fabric.is_active),
  avec tissu jointuré et image_url de chaque rendu
- `fabrics` table : name, swatch_url, is_premium, is_active, category
- `generated_visuals` table : model_image_id (= angle), fabric_id, generated_image_url, is_published
- Contrainte UNIQUE (model_image_id, fabric_id) : un rendu par combinaison angle × tissu
- Prix premium = prix de base + 80€ fixe (CLAUDE.md)
- `models.shopify_url` : lien Shopify par modèle (nullable)

Ce milestone transforme ce placeholder en configurateur fonctionnel. Les rendus IA sont
**pré-générés côté admin** — pas de génération temps-réel dans le configurateur public.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features que tout visiteur d'un configurateur canapé luxe attend. Leur absence = produit cassé.

| Feature | Pourquoi attendu | Complexité | Notes |
|---------|-----------------|------------|-------|
| Grille de swatches tissu cliquables | Standard universel des configurateurs meuble — IKEA, BUT, Roche Bobois | FAIBLE | Cercles 52px (wireframe v4), tous les tissus `is_active=true`, au moins 1 swatch visible |
| Affichage du rendu IA quand un tissu est sélectionné | Raison d'être du configurateur — sans ça, c'est juste une liste de tissus | MOYEN | Image du rendu publié pour (model_image_id, fabric_id) via `/api/models/[slug]/visuals` |
| Swatch actif visuellement distinct | L'utilisateur doit savoir quel tissu est sélectionné | FAIBLE | Bordure `--color-primary` (#E49400) + éventuel ring ou scale(1.1) |
| Nom du tissu affiché avec le swatch sélectionné | Identifier ce qu'on a choisi — requis par WCAG 2.1 AA aussi | FAIBLE | Label textuel sous ou à côté du swatch actif — pas seulement en tooltip |
| Prix mis à jour dynamiquement | Transparence tarifaire — 9/10 acheteurs veulent voir le prix total avant achat | FAIBLE | Base + 80€ si `fabric.is_premium`, sinon prix de base — logique déjà dans PROJECT.md |
| Badge "premium" ou "+80 EUR" sur les tissus premium | L'utilisateur doit anticiper le surcoût avant de cliquer | FAIBLE | Badge court sur le swatch ou label inline — pas de surprise au checkout |
| CTA "Commander sur Shopify" | Sortie vers l'achat — sans ça le configurateur est une dead-end | FAIBLE | Lien `model.shopify_url` (nullable) — bouton désactivé ou masqué si null |
| Image de fallback si aucun rendu publié pour ce tissu | Tissu actif peut ne pas avoir de rendu publié (workflow admin incomplet) | MOYEN | Afficher la photo originale du modèle (`model_images[0]`) + badge "Aperçu sans IA" |
| État chargement pendant le fetch des visuels | L'appel API est async — éviter le flash de contenu vide | FAIBLE | Skeleton dans la zone image pendant le fetch initial |
| Fermeture du modal et retour au catalogue fonctionnels | Déjà implémenté — ne pas régresser lors du remplacement du placeholder | FAIBLE | Tester que le remplacement du contenu interne ne casse pas les handlers existants |

### Differentiators (Competitive Advantage)

Features qui élèvent l'expérience au-dessus du configurateur basique.

| Feature | Valeur ajoutée | Complexité | Notes |
|---------|---------------|------------|-------|
| Navigation par angles (thumbnails) | Les rendus existent par `view_type` (3/4, face, profil, dos, détail) — montrer l'angle IA | MOYEN | Thumbnails 72×54px (wireframe v4), un par angle disponible pour le tissu sélectionné, clic = maj image principale |
| Zoom texture (encart tissu de près) | Sécuriser la décision matière — 70% des acheteurs meuble ont besoin de voir le tissu en détail | FAIBLE | `fabric.reference_image_url` (bucket fabric-references) dans un encart 100-120px avec nom et catégorie |
| Badge "Rendu IA" sur l'image principale | Transparence sur la nature du visuel — différenciateur de confiance | FAIBLE | Pill sombre bas-droite sur la zone image — "Rendu IA" quand rendu actif, "Photo originale" quand fallback |
| Nombre d'angles disponibles affiché | Informer sur la richesse du catalogue de rendus avant de cliquer | FAIBLE | "5 angles disponibles" sous les thumbnails ou en label |
| Lien "Changer de canapé" | Anti dead-end — retour fluide vers le catalogue sans fermer/rouvrir | FAIBLE | Text link `← Changer de modèle` qui appelle `onClose()` |
| Bandeau sticky mobile (swatch + prix + CTA) | Prix et action toujours visibles sur mobile sans scroller — conversion critique | MOYEN | `position: fixed`, bottom 0, visible uniquement < 1024px (wireframe v4), masqué si Shopify URL absente |
| Affichage dimensions du modèle | Information produit complémentaire — "220 × 90 × 85 cm" — attendu en haut de gamme | FAIBLE | `model.dimensions` (nullable) — afficher sous le nom si present |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Pourquoi demandé | Pourquoi problématique | Alternative |
|---------|-----------------|----------------------|-------------|
| Génération IA temps-réel dans le configurateur | "Visualisation à la demande" | Les rendus sont pré-générés côté admin — la stack IA (Nano Banana / Mock Sharp) n'est pas conçue pour du temps-réel public. Latence 5-15s, coût par requête, watermark public sur `/api/simulate` | Afficher les rendus publiés — qualité contrôlée par admin, zéro latence |
| Sélecteur de quantité / taille dans le configurateur | "Upsell inline" | Ce n'est pas un configurateur de commande — c'est un outil de visualisation. La commande se fait sur Shopify. Ajouter quantité = confusion de rôle | Rediriger vers Shopify pour tout ce qui est "commander" |
| Partage de configuration par URL ou lien | "Partage réseaux sociaux" | Requiert persistance d'état (localStorage ou query params), gestion de l'hydratation SSR, et coordination avec le Shopify URL. Hors scope M009. | Section Simulation (M010) avec WhatsApp share — prévue dans le wireframe |
| Comparaison avant/après tissu | "Voir la différence" | Requiert deux images côte à côte = layout complexe dans le modal. Le toggle "photo originale → rendu IA" via badge offre une forme de comparaison suffisante | Badge "Rendu IA / Photo originale" + fallback clair |
| Filtrage des swatches par catégorie de tissu | "Organisation des options" | À 6-10 tissus actifs, un filtre est une surcharge cognitive. La catégorie existe dans `fabric.category` mais n'est pertinente qu'à 20+ tissus | Grille linéaire scrollable — simple et rapide |
| Zoom interactif sur l'image principale (loupe) | "Voir les détails du rendu" | Complexité d'implémentation élevée (touch events, position calcul), rendu IA ne justifie pas un zoom photo-réaliste. La référence tissu dans l'encart zoom couvre ce besoin | Encart `reference_image_url` pour le détail matière |
| Loader animé façon "génération en cours" pendant le fetch | "Sentiment de technologie IA" | Trompe l'utilisateur — les rendus sont déjà générés, le fetch est rapide (< 500ms). Un vrai loader donnerait l'impression d'une attente inexistante | Skeleton discret le temps du premier fetch — disparaît rapidement |
| Mode plein écran image (expand) | "Mieux voir le rendu" | Le modal est déjà 90vw desktop / plein écran mobile. Un expand intérieur = imbrication de modals ou z-index battles | Taille d'image généreuse dans le layout 60/40 (wireframe v4) |

---

## Feature Dependencies

```
GET /api/models/[slug]/visuals (existant, opérationnel)
  └──fournit──> Liste de rendus publiés avec fabric + model_image jointés
      └──requiert──> model.slug (déjà dans ConfiguratorModal via ModelWithImages)

Swatches cliquables
  └──requiert──> Liste des tissus actifs ayant au moins un rendu publié
  └──dépend de──> generated_visuals filtrés (is_published + fabric.is_active)
  └──dépend de──> fabric.swatch_url (pour l'image du swatch)
  └──dépend de──> useState selectedFabricId

Image principale rendu IA
  └──requiert──> selectedFabricId + selectedViewType (angle actif)
  └──dépend de──> generated_visuals (trouver le rendu pour [fabric_id, model_image.view_type])
  └──fallback──> model_images[0].image_url si aucun rendu pour cette combinaison

Thumbnails angles
  └──requiert──> Liste des angles DISPONIBLES pour le tissu sélectionné
  └──dépend de──> generated_visuals groupés par view_type pour le fabric_id actif
  └──requiert──> selectedFabricId (les angles disponibles changent selon le tissu)
  └──dépend de──> useState selectedViewType

Prix dynamique
  └──requiert──> selectedFabricId → fabric.is_premium
  └──dépend de──> model.price (base)
  └──calcule──> price + (is_premium ? 80 : 0)

Zoom texture (encart)
  └──requiert──> selectedFabricId → fabric.reference_image_url
  └──fallback──> fabric.swatch_url si reference_image_url est null

CTA Commander sur Shopify
  └──requiert──> model.shopify_url (nullable)
  └──affiche──> Bouton actif si shopify_url présent, masqué ou disabled si null

Bandeau sticky mobile
  └──requiert──> selectedFabricId (swatch + nom tissu)
  └──requiert──> Prix dynamique calculé
  └──requiert──> model.shopify_url (lien achat)
  └──visible──> uniquement < 1024px (CSS media query)
```

### Dependency Notes

- **Données visuals via un seul fetch :** `GET /api/models/[slug]/visuals` retourne tous les rendus
  publiés du modèle (tous tissus, tous angles). Ce fetch unique charge tout — pas de fetch par swatch
  ou par angle. Organiser côté client en `Map<fabricId, Map<viewType, GeneratedVisual>>` pour un
  accès O(1).

- **slug du modèle dans le modal :** Le composant `ConfiguratorModal` reçoit `model: ModelWithImages`.
  Le type `Model` inclut `slug`. Aucune prop supplémentaire à passer — le slug est disponible.

- **Tissus sans rendu publié :** Un tissu peut être `is_active=true` mais sans aucun rendu publié.
  Dans ce cas, il ne figure pas dans la réponse de `/api/models/[slug]/visuals`. Ne pas l'afficher
  dans les swatches, ou l'afficher grisé avec un état "aperçu non disponible". Recommandé : ne pas
  afficher — évite la frustration de cliquer et de voir un fallback photo.

- **Angle par défaut :** Au chargement, sélectionner l'angle `3/4` si disponible pour le tissu
  sélectionné par défaut, sinon le premier angle disponible. Logique `getPrimaryImage` déjà dans
  `ConfiguratorModal.tsx` — réutiliser ce pattern.

- **Tissu sélectionné par défaut :** Premier tissu dans la liste (non-premium si possible) — ne pas
  forcer l'utilisateur à cliquer avant de voir quoi que ce soit.

---

## MVP Definition

### Launch With — M009

Minimum viable pour valider le configurateur tissu et débloquer M010 (Simulation).

- [ ] **Fetch visuels** : appel `GET /api/models/[slug]/visuals` au montage du modal — chargé en
  mémoire une seule fois
- [ ] **Grille swatches** : afficher tous les tissus ayant au moins 1 rendu publié, avec `swatch_url`,
  nom au hover/focus, badge "+80 EUR" si premium
- [ ] **Sélection swatch** : clic → `selectedFabricId` mis à jour → image principale change
- [ ] **Image principale** : rendu IA si disponible, sinon photo originale + badge "Photo originale"
- [ ] **Badge "Rendu IA"** sur l'image quand c'est un rendu IA publié
- [ ] **Prix dynamique** : base + 80€ si premium, affiché en temps réel
- [ ] **CTA Shopify** : bouton "Commander sur Shopify" lié à `model.shopify_url` (masqué si null)
- [ ] **État chargement** : skeleton dans la zone image pendant le fetch
- [ ] **Lien "Changer de modèle"** : `onClose()` avec text link discret

### Add After Validation — v9.x

Features à ajouter une fois le configurateur core validé (même milestone si temps).

- [ ] **Navigation angles** : thumbnails 72×54px par angle disponible, clic change l'image principale
- [ ] **Encart zoom texture** : `reference_image_url` ou fallback `swatch_url`, 100-120px
- [ ] **Dimensions modèle** : `model.dimensions` affiché sous le nom si non-null

### Future Consideration — v10+

Features à différer — dépendent de milestones ultérieurs ou hors scope M009.

- [ ] **Bandeau sticky mobile** : swatch + prix + CTA — M009 si temps, sinon M010
- [ ] **Partage de configuration** : WhatsApp — M010 Simulation
- [ ] **Simulation salon** : upload photo + génération IA — M010
- [ ] **Produits similaires** — M011 polish

---

## Feature Prioritization Matrix

| Feature | Valeur Utilisateur | Coût Implémentation | Priorité |
|---------|-------------------|---------------------|----------|
| Fetch visuels + organisation en Map | HAUTE | FAIBLE | P1 |
| Grille swatches cliquables | HAUTE | FAIBLE | P1 |
| Image principale rendu IA | HAUTE | FAIBLE | P1 |
| Prix dynamique premium | HAUTE | FAIBLE | P1 |
| Badge "Rendu IA" / "Photo originale" | HAUTE | FAIBLE | P1 |
| CTA Commander Shopify | HAUTE | FAIBLE | P1 |
| Fallback photo originale | MOYENNE | FAIBLE | P1 |
| Skeleton chargement | MOYENNE | FAIBLE | P1 |
| Navigation angles (thumbnails) | HAUTE | MOYEN | P2 |
| Encart zoom texture | MOYENNE | FAIBLE | P2 |
| Dimensions modèle | FAIBLE | FAIBLE | P2 |
| Lien "Changer de modèle" | FAIBLE | FAIBLE | P2 |
| Bandeau sticky mobile | HAUTE (mobile) | MOYEN | P2 |

**Clé priorités :**
- P1 : Indispensable pour livrer M009 — CONF-01, CONF-02, CONF-03, CONF-04
- P2 : Souhaitable, ajouter dans M009 si temps disponible
- P3 : Nice-to-have, M011 polish

---

## Competitor Feature Analysis

| Feature | IKEA | Roche Bobois | Ligne Roset | Notre Approche |
|---------|------|--------------|-------------|----------------|
| Swatches | Cercles/carrés, tous visibles, tooltip nom | Carrés avec hover zoom, catégories | Cercles 40px, scrollables, label dessous | Cercles 52px (wireframe), label visible pour sélectionné, badge premium |
| Affichage rendu | 3D temps réel | Photo IA pré-générée par angle | Photo lifestyle studio | Photo IA pré-générée (admin → publish), pas de temps-réel |
| Angles | Rotation 360° interactive | Thumbnails 3-5 angles cliquables | 2-3 angles, thumbnails | Thumbnails par angle publié — dépend du workflow admin |
| Prix | Mis à jour temps réel | Affiché en permanence | "À partir de" + surcoût tissu clair | Base + 80€ premium, affiché dynamiquement |
| Fallback | N/A (3D toujours disponible) | "Visuel non disponible" message | Photo standard si pas de rendu | Photo originale modèle + badge "Photo originale" |
| CTA achat | "Ajouter au panier" inline | "Demander un devis" | "Commander" → page produit | Lien Shopify externe — sortie contrôlée |
| Mobile | Swatches scrollables, sticky CTA | Swatches en carousel | Swatches 2 colonnes | Swatches scrollables + bandeau sticky (v9.x) |

---

## Considérations Techniques Clés

### Organisation des données en mémoire

La réponse de `GET /api/models/[slug]/visuals` est un tableau plat de rendus. Organiser en Map
imbriquée côté client pour des lookups O(1) :

```typescript
// Map<fabricId, Map<viewType, GeneratedVisual>>
type VisualsMap = Map<string, Map<string, GeneratedVisual & { fabric: Fabric; model_image: ModelImage }>>

function buildVisualsMap(visuals: Visual[]): VisualsMap {
  const map = new Map()
  for (const v of visuals) {
    if (!map.has(v.fabric_id)) map.set(v.fabric_id, new Map())
    map.get(v.fabric_id)!.set(v.model_image.view_type, v)
  }
  return map
}
```

### Tissus disponibles (avec au moins 1 rendu)

```typescript
// Extraire les tissus uniques ayant des rendus
const availableFabrics = Array.from(
  new Map(visuals.map(v => [v.fabric_id, v.fabric])).values()
)
```

### Sélection angle par défaut

```typescript
// Trouver le meilleur angle pour un tissu donné
function getBestAngle(fabricMap: Map<string, Visual>, preferredViewType = '3/4'): string {
  if (fabricMap.has(preferredViewType)) return preferredViewType
  return fabricMap.keys().next().value // premier angle disponible
}
```

### Fallback image

```typescript
// Résolution de l'image à afficher
function resolveImage(
  visualsMap: VisualsMap,
  fabricId: string | null,
  viewType: string,
  fallbackUrl: string
): { url: string; isAI: boolean } {
  if (fabricId && visualsMap.get(fabricId)?.get(viewType)) {
    return { url: visualsMap.get(fabricId)!.get(viewType)!.generated_image_url, isAI: true }
  }
  return { url: fallbackUrl, isAI: false }
}
```

### Prix dynamique

```typescript
const PREMIUM_SURCHARGE = 80 // Fixe selon CLAUDE.md

function calculatePrice(basePrice: number, isPremium: boolean): number {
  return basePrice + (isPremium ? PREMIUM_SURCHARGE : 0)
}
```

### État interne du configurateur

```typescript
// État minimal dans ConfiguratorModal (ou composant ConfiguratorContent interne)
const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null)
const [selectedViewType, setSelectedViewType] = useState<string>('3/4')
const [visuals, setVisuals] = useState<Visual[]>([])
const [loading, setLoading] = useState(true)

// Initialisation : sélectionner le premier tissu non-premium par défaut
useEffect(() => {
  if (visuals.length > 0 && !selectedFabricId) {
    const first = availableFabrics.find(f => !f.is_premium) ?? availableFabrics[0]
    setSelectedFabricId(first?.id ?? null)
  }
}, [visuals])
```

### Reset au changement de modèle

Quand `model` change (l'utilisateur ferme et rouvre pour un autre canapé), réinitialiser
`selectedFabricId`, `selectedViewType` et `visuals`. Utiliser `useEffect([model?.id])`.

---

## Accessibilité Configurateur

| Élément | Exigence | Mise en oeuvre |
|---------|----------|----------------|
| Swatches | `role="radio"` + `aria-checked` + `aria-label="Nom tissu"` | Groupe `role="radiogroup"` avec label "Choisissez votre tissu" |
| Swatch premium | Mention textuelle dans `aria-label` | `aria-label="Bleu nuit — tissu premium, +80 EUR"` |
| Image rendu | `alt` descriptif dynamique | `"Rendu IA du canapé Milano en tissu Bleu nuit, vue 3/4"` |
| Image fallback | `alt` + indication non-AI | `"Photo du canapé Milano — aperçu non disponible pour ce tissu"` |
| Thumbnails angles | `aria-label` avec view_type | `"Vue de face"`, `"Vue de côté"` — aria-pressed si actif |
| Prix dynamique | `aria-live="polite"` | Annonce le changement de prix sans interrompre la navigation |
| Encart zoom texture | `alt` de l'image de référence | `"Texture du tissu Bleu nuit en gros plan"` |
| CTA Shopify | Lien externe signalé | Texte "Commander sur Shopify" + `aria-label` avec modèle + tissu + prix total |

---

## Sources

- Wireframe v4 `.planning/maquette/wireframe-page-unique.md` — autorité absolue layout + dimensions (HIGH confidence)
- Schema database `src/types/database.ts` — source de vérité données disponibles (HIGH confidence)
- API `src/app/api/models/[slug]/visuals/route.ts` — contrat API confirmé (HIGH confidence)
- `ConfiguratorModal.tsx` — implémentation existante, patterns à conserver (HIGH confidence)
- PROJECT.md — requirements CONF-01/02/03/04 et contrainte prix premium (HIGH confidence)
- Cylindo — Best practices furniture configurator (MEDIUM confidence, vérifié)
- Baymard — Mobile swatch UX, 57% sites manquent swatches mobiles (MEDIUM confidence)
- Smashing Magazine — Configurator UX patterns (preset, real-time feedback, price display) (MEDIUM confidence)
- Analyse concurrentielle IKEA / Roche Bobois / Ligne Roset / France Canapé (MEDIUM confidence)
- WCAG 2.1 AA — radiogroup pattern pour swatches, aria-live pour prix (HIGH confidence)

---

*Feature research pour : Configurateur Tissu Möbel Unique — M009*
*Researched: 2026-03-29*
