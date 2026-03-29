# Pitfalls Research — v9.0 Configurateur Tissu

**Domain:** Configurateur tissu dans modal dialog natif — swatches, visuels IA, prix dynamique
**Researched:** 2026-03-29
**Confidence:** HIGH (analyse directe du code existant + patterns établis dans le projet)

---

## Critical Pitfalls

### Pitfall 1 : Pas d'API publique fabrics — appel admin par erreur ou fetch interdit

**What goes wrong:**
Il n'existe pas de route `/api/fabrics` publique dans le projet. La seule route disponible est `/api/admin/fabrics` qui requiert `requireAdmin()`. Si le composant ConfiguratorModal tente de fetcher les tissus via un fetch côté client vers cette route, il reçoit une 401 et affiche un configurateur vide sans explication claire.

**Why it happens:**
Le développeur suppose par analogie avec les modèles (`/api/models`) qu'il existe une route publique parallèle pour les tissus. Ce n'est pas le cas : les modèles ont une route publique parce que le catalogue les affiche ; les tissus n'en ont jamais eu besoin avant la v9.0.

**How to avoid:**
Deux options, chacune avec un pattern précis à suivre :

Option A — Fetch Supabase direct dans un Server Component (recommandée, cohérente avec `CatalogueSection`) :
Créer un wrapper Server Component autour du modal qui fetch les tissus actifs avant d'ouvrir. Passer les tissus comme props au composant client.

```typescript
// FabricLoader.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import type { Fabric } from '@/types/database'

export async function fetchActiveFabrics(): Promise<Fabric[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fabrics')
    .select('id, name, slug, swatch_url, is_premium, is_active')
    .eq('is_active', true)
    .order('name')
  return data ?? []
}
```

Option B — Créer une route publique `/api/fabrics` filtrée sur `is_active=true` :
Pattern identique à `/api/models/route.ts` mais pour les tissus. Si cette route est créée, la sécurité doit se limiter aux champs publics (pas `reference_image_url` qui vient d'un bucket privé).

**Warning signs:**
Console réseau : 401 sur `/api/admin/fabrics`. Swatches absents dans le configurateur. Si `createClient()` sans `requireAdmin()` est appelé sur une route admin, RLS bloque la requête silencieusement (retourne `[]` au lieu d'une erreur explicite).

**Phase to address:**
Phase 1 (architecture fetch) — décision à prendre avant d'écrire le premier composant du configurateur.

---

### Pitfall 2 : Fetch visuals dans le modal au clic — latence perceptible et état vide transitoire

**What goes wrong:**
Le développeur déclenche le fetch des visuels générés (`/api/models/[slug]/visuals`) au moment où l'utilisateur clique sur "Configurer ce modèle". Le modal s'ouvre immédiatement mais affiche un spinner, puis les swatches apparaissent 500–1500ms plus tard (cold start Supabase). L'utilisateur voit un modal vide ou partiellement chargé avant d'interagir.

**Why it happens:**
Le modal reçoit un `ModelWithImages` (juste les images du modèle, pas les visuels IA). Les visuels générés sont dans `generated_visuals` avec jointure `fabrics` — ils ne font pas partie du payload initial du catalogue. Le développeur les charge au moment de l'ouverture du modal pour éviter de tout charger au load de la page.

**How to avoid:**
Deux stratégies selon le nombre de produits :

Stratégie A — Preload côté serveur dans `CatalogueSection` pour les projets avec peu de produits (< 20) :
Étendre la query existante pour inclure les visuels publiés avec leurs tissus dans le payload initial :

```typescript
// CatalogueSection.tsx — requête enrichie
const { data } = await supabase
  .from('models')
  .select(`
    *,
    model_images(*),
    generated_visuals(
      id,
      generated_image_url,
      model_image_id,
      fabric:fabrics(id, name, slug, swatch_url, is_premium, is_active)
    )
  `)
  .eq('is_active', true)
  .eq('generated_visuals.is_published', true)
  .eq('generated_visuals.is_validated', true)
  .order('created_at', { ascending: false })
```

**Attention** : le filtre `.eq('generated_visuals.is_published', true)` sur une relation ne fonctionne pas comme un WHERE sur la table principale — il filtre les visuels mais retourne quand même tous les modèles (même ceux sans visuels). C'est le comportement voulu : un modèle sans visual IA reste visible dans le catalogue.

Stratégie B — Fetch lazy côté client avec `useEffect` déclenché à l'ouverture du modal (projets > 20 produits, ou visuels nombreux) :
Afficher un skeleton swatches pendant le fetch, jamais de vide silencieux.

**Warning signs:**
Modal qui s'ouvre avec un swatch grid vide pendant 1-2 secondes. Ou au contraire, chargement initial de la page lent parce que la query initiale inclut trop de données joinées.

**Phase to address:**
Phase 1 (fetch strategy) — décision avant implémentation, impacts directs sur la structure des types.

---

### Pitfall 3 : Supabase join sur `generated_visuals` — filtre relationnel non transitif

**What goes wrong:**
La query Supabase `.eq('generated_visuals.is_published', true)` ne filtre pas les rangs de la table principale (`models`) — elle filtre seulement les éléments de la relation. Un modèle sans aucun visual publié est retourné avec `generated_visuals: []`, pas exclu. C'est correct pour l'affichage catalogue, mais peut surprendre si le développeur attend une liste de modèles "seulement ceux avec des visuels".

Plus critique : le filtre `fabric.is_active` ne peut pas être appliqué côté Supabase sur une jointure imbriquée à deux niveaux dans l'API PostgREST standard. La route existante `/api/models/[slug]/visuals/route.ts` le fait correctement en filtrant côté serveur après fetch :

```typescript
// Pattern établi (correct) — à reproduire
const filteredVisuals = (visuals ?? []).filter((v) => {
  const fabric = v.fabric as { is_active: boolean } | null
  return fabric?.is_active === true
})
```

Si ce filtre est oublié dans le nouveau code du configurateur, des swatches de tissus désactivés apparaissent dans la liste.

**Why it happens:**
PostgREST (le moteur derrière Supabase) ne supporte pas les filtres sur jointures imbriquées au niveau WHERE de la table parente. Les filtres sur relations sont des filtres sur les colonnes retournées, pas des conditions d'exclusion de la table principale.

**How to avoid:**
Reproduire le pattern de `/api/models/[slug]/visuals/route.ts` pour tout fetch de visuels : filtrer côté JS après réception des données pour éliminer les tissus `is_active: false`. Ne jamais assumer que Supabase a filtré les tissus désactivés automatiquement.

```typescript
// Pattern correct à reproduire dans le configurateur
const publishedVisuals = allVisuals.filter(
  (v) => v.is_published && v.is_validated && v.fabric?.is_active
)
```

**Warning signs:**
Des swatches de tissus "désactivés" apparaissent dans le configurateur. Ou un modèle qui devrait avoir des visuels apparaît avec `generated_visuals: []` parce que le filtre a exclu le modèle au lieu des visuels.

**Phase to address:**
Phase 1 (fetch strategy) + Phase 2 (rendu swatches).

---

### Pitfall 4 : CLS (Cumulative Layout Shift) quand on bascule d'angle de vue

**What goes wrong:**
Dans le configurateur, l'utilisateur sélectionne un tissu et voit l'image IA sous différents angles (3/4, face, côté, etc.). Quand il clique sur un autre angle, l'image se recharge et le conteneur "saute" le temps que la nouvelle image se charge — surtout si les images ont des ratios différents ou si `next/image` recalcule les dimensions.

**Why it happens:**
Le composant gallery d'angle utilise `<Image fill>` ou des dimensions variables selon le `view_type`. Sans dimensions fixes réservées sur le conteneur, le navigateur recalcule le layout à chaque swap d'image. `next/image` avec `fill` requiert un parent avec `position: relative` et des dimensions fixes — si ces dimensions ne sont pas fixées, le CLS se produit.

**How to avoid:**
Fixer un aspect-ratio constant sur le conteneur image, indépendamment de l'angle affiché :

```css
/* ConfiguratorModal.module.css */
.visualWrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3; /* fixe pour tous les angles */
  overflow: hidden;
  background: var(--color-background-alt); /* placeholder visible pendant le load */
}
```

```typescript
// Dans le composant gallery
<div className={styles.visualWrapper}>
  <Image
    src={currentVisualUrl}
    alt={`${model.name} - ${selectedFabric.name} - ${currentAngle}`}
    fill
    style={{ objectFit: 'cover' }}
    sizes="(max-width: 640px) 100vw, 50vw"
    priority={currentAngle === '3/4'} // priorité pour l'angle principal
  />
</div>
```

L'attribut `key` sur `<Image>` permet de forcer un remount (et donc un state loading distinct) quand la source change — sans `key`, React réutilise le composant et l'ancienne image reste visible pendant le chargement de la nouvelle :

```typescript
<Image key={currentVisualUrl} src={currentVisualUrl} ... />
```

**Warning signs:**
Layout "saute" visiblement quand l'utilisateur change d'angle. Ou l'image précédente persiste pendant le chargement de la nouvelle sans état de transition visible.

**Phase to address:**
Phase 2 (gallery angles) — aspect-ratio fixe obligatoire dès la création du conteneur.

---

### Pitfall 5 : Prix dynamique — afficher le mauvais prix si `is_premium` change entre sessions

**What goes wrong:**
Le composant affiche `model.price + 80` quand `selectedFabric.is_premium` est `true`. Si les données tissus sont chargées une seule fois au mount du composant (snapshot), et que l'admin change `is_premium` d'un tissu entre deux visites utilisateur, la page peut afficher un prix incorrect jusqu'au prochain reload.

Le problème plus courant : calculer le prix premium avec la mauvaise logique. La contrainte projet est `prix premium = prix de base + 80€ fixe`, mais un développeur peut l'interpréter comme `prix × 1.05` ou ajouter le supplément à chaque sélection de tissu au lieu de le calculer à la sélection.

**Why it happens:**
La contrainte `+80€` est documentée dans `CLAUDE.md` et `src/lib/utils.ts` (`calculatePrice`), mais un développeur qui ne consulte pas ces fichiers peut recréer la logique différemment.

**How to avoid:**
Toujours utiliser `calculatePrice` de `src/lib/utils.ts` — cette fonction est l'unique source de vérité pour ce calcul :

```typescript
import { calculatePrice, formatPrice } from '@/lib/utils'

// Dans le composant configurateur
const displayPrice = selectedFabric
  ? calculatePrice(model.price, selectedFabric.is_premium)
  : model.price

// Affichage
<p className={styles.price}>
  {formatPrice(displayPrice)}
  {selectedFabric?.is_premium && (
    <span className={styles.premiumBadge}>Tissu premium (+80 €)</span>
  )}
</p>
```

Ne pas dupliquer la constante `80` dans le composant. Ne pas recréer une fonction `formatPrice` locale dans le modal — la version dans `src/lib/utils.ts` utilise `Intl.NumberFormat` avec le style currency EUR, ce qui est différent de la version simplifiée dans `ProductCard` (qui n'utilise pas le style currency). Choisir un seul format et s'y tenir.

**Warning signs:**
`model.price` affiché sans le supplément pour un tissu premium. Ou supplément calculé à tort comme pourcentage. Ou deux implémentations différentes de `formatPrice` dans le même écran (ProductCard et ConfiguratorModal affichent des formats de prix différents).

**Phase to address:**
Phase 2 (prix dynamique) — utiliser `calculatePrice` dès le premier rendu du prix dans le configurateur.

---

### Pitfall 6 : Scroll interne du modal bloqué sur iOS Safari — régression de la Phase 6

**What goes wrong:**
Le scroll lock implémenté en Phase 6 (`document.body.style.position = 'fixed'`) résout le problème de scroll du fond de page sur iOS. Mais quand le configurateur ajoute un swatch grid et une galerie d'angles dans le modal, le contenu du modal lui-même peut dépasser `90vh` sur desktop ou `100dvh` sur mobile. Si le scroll est uniquement sur `.content` (le wrapper interne), un contenu plus riche peut casser l'équilibre et rendre le modal non-scrollable sur certains appareils.

**Why it happens:**
La Phase 6 a configuré le scroll sur `.content` avec `max-height: 90vh; overflow-y: auto` sur desktop, et `height: 100dvh; overflow-y: auto` sur mobile. Avec le configurateur réel, le contenu triple (swatches, galerie, angles, prix, CTA). La hauteur fixe du `.content` reste correcte, mais si un élément enfant a `overflow: hidden` ou `position: absolute` sans tenir compte du contexte de scroll, des parties du configurateur peuvent disparaître hors du viewport scrollable.

**How to avoid:**
Valider le scroll du modal sur mobile avec le contenu complet (pas seulement le placeholder). Structure CSS à maintenir :

```css
/* Invariant à ne pas modifier — Phase 6 */
.dialog {
  overflow: visible; /* scroll sur .content, pas ici */
}

.content {
  max-height: 90vh;
  overflow-y: auto;
}

@media (max-width: 639px) {
  .content {
    height: 100dvh;
    max-height: 100dvh;
    overflow-y: auto;
  }
}
```

Ne pas ajouter `overflow: hidden` sur `.inner`, `.body`, ou tout autre conteneur intermédiaire — cela couperait le scroll. Le seul conteneur qui peut avoir `overflow: hidden` est `.imageWrapper` et `.visualWrapper` (pour clipper les images).

**Warning signs:**
Sur mobile, le CTA "Acheter sur Shopify" est invisible (hors écran) sans possibilité de scroller. Sur desktop, le grid swatches est tronqué en bas du modal. Ou la scrollbar du `.content` disparaît après ajout du nouveau contenu.

**Phase to address:**
Phase 2 et Phase 3 — tester le scroll sur mobile physique après chaque ajout de section dans le modal.

---

### Pitfall 7 : Swatch grid — overflow horizontal sur mobile, swatches trop petits pour le tap

**What goes wrong:**
Le swatch grid s'affiche en flex-wrap ou grid multi-colonnes, ce qui fonctionne bien sur desktop. Sur mobile, si le modal est en plein écran et le grid contient 8+ tissus, les swatches peuvent déborder horizontalement (scroll horizontal non voulu), ou être trop petits (< 44px tap target) pour être activables au doigt.

**Why it happens:**
Les swatches de tissu sont typiquement des petits cercles ou carrés (32–48px) représentant la texture/couleur. Un design correct sur desktop avec 5 colonnes donne des swatches trop petits sur un écran de 375px si le même grid est utilisé.

**How to avoid:**
Utiliser `flex-wrap: wrap` avec un `min-width` garanti sur chaque swatch, et une taille minimum respectant les guidelines tactiles (44px minimum selon WCAG 2.5.5) :

```css
/* Swatch grid */
.swatchGrid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm); /* 8px */
}

.swatchButton {
  width: 48px;
  height: 48px;
  min-width: 44px; /* tap target minimum */
  min-height: 44px;
  border-radius: var(--radius-full);
  border: 2px solid transparent;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 150ms ease;
  flex-shrink: 0;
}

.swatchButton[aria-pressed="true"] {
  border-color: var(--color-primary); /* #E49400 — sélection visible */
}
```

Ne pas utiliser un grid CSS avec `repeat(auto-fill, minmax(40px, 1fr))` sans `min-width` explicite — sur des viewports très étroits, les colonnes peuvent être calculées à moins de 44px.

**Warning signs:**
Sur un écran 375px, les swatches font 32px ou moins. Scroll horizontal dans la zone de swatches. Difficile de cliquer sur un swatch spécifique au doigt.

**Phase to address:**
Phase 2 (swatch grid) — définir les dimensions des swatches avec les valeurs absolues, pas uniquement relatives.

---

### Pitfall 8 : Swatch sélectionné sans fallback si aucun visuel publié pour ce tissu

**What goes wrong:**
L'utilisateur clique sur un swatch de tissu. Le configurateur cherche dans les visuels le rendu correspondant à `(model_image_id, fabric_id)`. Si aucun visuel n'est publié pour ce tissu + ce modèle, le slot image reste vide ou affiche l'image originale sans indication que le rendu IA n'est pas disponible. L'utilisateur est confus — il pense que l'app est cassée.

**Why it happens:**
La table `generated_visuals` a une contrainte UNIQUE sur `(model_image_id, fabric_id)` mais il n'y a aucune garantie qu'un visual existe pour chaque combinaison tissu/angle. Un tissu peut être actif mais n'avoir aucun visuel généré (ou généré mais non publié) pour ce modèle.

**How to avoid:**
Afficher explicitement un état "visuel non disponible" quand la sélection tissu + angle ne correspond à aucun visual publié. Ne jamais afficher un slot vide silencieux :

```typescript
// Dans le composant configurateur
const currentVisual = visuals.find(
  (v) => v.fabric_id === selectedFabric?.id &&
         v.model_image_id === currentAngle?.id
)

// Dans le JSX
{currentVisual ? (
  <Image src={currentVisual.generated_image_url} ... />
) : (
  <div className={styles.noVisual}>
    <p>Rendu non disponible pour cet angle</p>
  </div>
)}
```

Pour l'angle par défaut (3/4 front), si aucun visual n'existe, revenir à l'image de base du modèle (`model_images` pour ce `view_type`) comme fallback visuel.

**Warning signs:**
Slot image vide quand l'utilisateur sélectionne un tissu. Ou l'image précédente persiste sans changement visible quand aucun visual n'existe pour le nouveau tissu sélectionné.

**Phase to address:**
Phase 2 (affichage visuel) — l'état "pas de rendu disponible" doit être prévu dès le premier rendu du configurateur.

---

### Pitfall 9 : `return null` avant les hooks dans ConfiguratorModal — régression Phase 6

**What goes wrong:**
La Phase 6 a correctement placé `if (!model) return null` APRES tous les hooks. Si une refactorisation de `ConfiguratorModal.tsx` déplace ou ajoute des hooks après ce early return, React lève l'erreur "Rendered more hooks than during the previous render" — qui crashe l'application entière silencieusement en production (erreur boundary).

**Why it happens:**
Quand le configurateur ajoute de nouveaux hooks (`useState` pour le tissu sélectionné, `useState` pour l'angle courant, `useEffect` pour fetch des visuels), un développeur peut être tenté de les placer après le `if (!model) return null` pour "éviter de les exécuter inutilement". C'est une violation des règles des hooks React.

**How to avoid:**
Tous les hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) doivent être déclarés AVANT tout `return null` conditionnel. Pour les hooks qui n'ont de sens que quand `model` est défini, initialiser avec des valeurs par défaut :

```typescript
export function ConfiguratorModal({ model, onClose }: ConfiguratorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = model !== null

  // Nouveaux hooks v9.0 — tous avant le return null
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null)
  const [currentAngleId, setCurrentAngleId] = useState<string | null>(null)

  // useEffect scroll lock (Phase 6 — ne pas toucher)
  useEffect(() => { ... }, [open])

  // useEffect dialog control (Phase 6 — ne pas toucher)
  useEffect(() => { ... }, [open])

  // Reset des sélections à l'ouverture d'un nouveau modèle
  useEffect(() => {
    if (model) {
      setSelectedFabricId(null)
      setCurrentAngleId(null)
    }
  }, [model?.id]) // dépend de l'id, pas de l'objet entier (évite les boucles)

  // IMPORTANT : early return APRÈS tous les hooks
  if (!model) return null

  // ... reste du composant
}
```

**Warning signs:**
Erreur React "Rendered fewer hooks than expected" ou "Rendered more hooks than expected" dans la console. En production, error boundary déclenché à l'ouverture du modal.

**Phase to address:**
Phase 1 (refactorisation du composant) — vérifier l'ordre des hooks dès l'ajout du premier `useState` pour le tissu sélectionné.

---

### Pitfall 10 : Reset état configurateur à l'ouverture d'un nouveau modèle

**What goes wrong:**
L'utilisateur ouvre le configurateur pour "Canapé Milano", sélectionne le tissu "Velours Bleu" et angle "Face". Il ferme le modal. Il ouvre ensuite le configurateur pour "Canapé Firenzé". Le modal s'ouvre avec le tissu "Velours Bleu" encore sélectionné (état React non resetté), et cherche un visual `(firenze_model_image_id, velours_bleu_fabric_id)` qui n'existe peut-être pas.

**Why it happens:**
`ConfiguratorModal` garde son état React (`selectedFabricId`, `currentAngleId`) entre les ouvertures si le composant reste monté dans le DOM. `CatalogueClient` ne démonte pas le `ConfiguratorModal` entre les sélections — il passe simplement `model=null` pour fermer, et un nouveau `model` pour ouvrir.

**How to avoid:**
Resetter l'état tissu/angle quand `model.id` change (pas quand `model` change — un changement d'objet référence est différent d'un changement de modèle) :

```typescript
useEffect(() => {
  if (model?.id) {
    setSelectedFabricId(null)
    setCurrentAngleId(null)
  }
}, [model?.id])
```

Alternative : utiliser `key={model?.id}` sur `ConfiguratorModal` depuis `CatalogueClient`. Next.js/React démonte et remonte le composant à chaque changement de `key`, ce qui remet tous les états à zero automatiquement. Avantage : aucune logique de reset à gérer. Inconvénient : le composant se réinitialise entièrement (perte des animations d'ouverture si elles sont ajoutées plus tard).

**Warning signs:**
Swatch du tissu précédent reste sélectionné après changement de modèle. Prix premium affiché pour un modèle dont aucun tissu n'a encore été sélectionné.

**Phase to address:**
Phase 1 (architecture state) — décision `useEffect + model.id` vs `key={model.id}` à prendre avant implémentation.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Dupliquer `getPrimaryImage` et `formatPrice` dans `ConfiguratorModal` au lieu de les centraliser | Pas de refacto | Deux sources de vérité, divergence possible si le format prix change | Jamais — extraire dans `src/lib/utils.ts` dès la v9.0 |
| Fetch visuels dans `useEffect` au clic sans cache | Simple à implémenter | 500ms de latence à chaque ouverture de modal, cold start Supabase visible | MVP uniquement si couplé à un skeleton swatches |
| Inliner la constante `80` pour le prix premium | Rapide | Inconsistance si le supplément change, impossible à tester unitairement | Jamais — utiliser `calculatePrice` de `src/lib/utils.ts` |
| Swatch grid sans état accessible (`aria-pressed`) | Visuellement correct | Non conforme WCAG — les lecteurs d'écran ne savent pas quel swatch est sélectionné | Jamais en production |
| `<img>` natif pour les swatches au lieu de `next/image` | Évite la config `sizes` | Pas d'optimisation WebP, pas de lazy loading optimisé | Pour les swatches < 48px seulement (`next/image` a un overhead pour très petites images) |
| Charger toutes les images de tous les angles en mémoire | Transition instantanée entre angles | N images chargées même si l'utilisateur ne change jamais d'angle | Jamais si plus de 3 angles — lazy load par angle |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase `generated_visuals` + `fabrics` | Oublier le filtre `fabric.is_active` côté JS | Filtrer après fetch comme dans `/api/models/[slug]/visuals/route.ts` : `filter(v => v.fabric?.is_active)` |
| Supabase join imbriqué | Utiliser `.eq('generated_visuals.is_published', true)` comme filtre modèle | Ce filtre s'applique aux visuels retournés, pas aux modèles — les modèles sans visuals restent dans le résultat |
| `next/image` avec swatch URLs | Utiliser `<Image fill>` pour des swatches de 48px dans un flex container | Utiliser `<Image width={48} height={48}>` — `fill` nécessite `position: relative` sur le parent et est surdimensionné pour des petites images |
| `calculatePrice` | Recréer la logique `price + 80` localement | Importer depuis `src/lib/utils.ts` — source unique de vérité pour le supplément premium |
| Dialog natif — onClose event | Appeler `dialog.close()` dans le handler `onClose` | `onClose` signifie "le dialog vient de se fermer" — mettre à jour uniquement le state React, ne pas rappeler `close()` |
| Supabase bucket `fabric-references` | Utiliser `reference_image_url` dans le configurateur public | Ce bucket est privé — l'URL signée expire. Ne pas exposer ce champ dans l'API publique ou les props publics. Utiliser uniquement `swatch_url` (bucket `fabric-swatches` public) |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Charger `generated_visuals` pour tous les modèles au load initial | Page catalogue lente, Time to Interactive dégradé | Fetch lazy au clic ou preload uniquement pour les N premiers modèles | Dès 5 modèles avec 4 angles × 6 tissus = 120 images potentielles |
| `<Image>` sans prop `priority` pour le premier angle (3/4) | Premier visuel IA charge après interaction, perceptible | Ajouter `priority` sur le visual de l'angle par défaut après sélection tissu | Immédiat — impact LCP dans le modal |
| Swatches sans dimensions fixes (`width`/`height`) | CLS dans le swatch grid au chargement des images swatch | `width={48} height={48}` explicite sur chaque `<Image>` swatch | Immédiat — visible dans Lighthouse |
| Re-render du ConfiguratorModal à chaque frappe dans la barre de recherche | Modal flickering si ouvert pendant la recherche | `selectedModel` dans `CatalogueClient` est indépendant de `query` — vérifier que le modal n'est pas dans le flux de rendu conditionnel de la recherche | Immédiat dès que `query` change avec le modal ouvert |
| Fetch visuels sans déduplication fabric | Même tissu demandé plusieurs fois si l'utilisateur change d'angle | Grouper les visuels par `fabric_id` une seule fois à la réception des données | Dès 3+ tissus avec 3+ angles |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposer `reference_image_url` dans une API publique | URL signée (bucket privé) exposée publiquement, expiration = lien cassé | Exclure `reference_image_url` de toute route ou query publique — ce champ est admin uniquement |
| Appeler `/api/admin/fabrics` depuis le frontend public | 401 en production, ou contournement si l'auth est mal configurée | Créer une route publique dédiée ou fetcher Supabase directement avec le client anonyme qui est contraint par RLS |
| Afficher `model_id` ou `fabric_id` (UUIDs) dans le HTML rendu | Fuite mineure sur la structure BDD | Passer uniquement les données affichées (name, slug, swatch_url, is_premium) comme props — les IDs peuvent rester pour les lookups internes mais pas dans le DOM |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Pas d'indication visuelle du tissu sélectionné | L'utilisateur ne sait pas quel swatch est actif | Border colorée + `aria-pressed="true"` sur le swatch sélectionné |
| Aucun état "chargement" entre sélection tissu et affichage visuel | L'utilisateur répète ses clics en pensant que rien ne s'est passé | Skeleton ou opacité réduite sur le visuel pendant le swap d'image |
| Prix affiché comme "à partir de X €" même après sélection tissu | Confusion — le prix exact n'est jamais affiché | Afficher le prix exact (avec ou sans supplément premium) dès qu'un tissu est sélectionné, supprimer "à partir de" |
| CTA "Acheter sur Shopify" visible même sans tissu sélectionné | Lien vers Shopify sans configuration — l'utilisateur arrive sur la page produit sans contexte tissu | Désactiver ou masquer le CTA Shopify jusqu'à ce qu'un tissu soit sélectionné |
| Tous les angles affichés même si certains n'ont pas de visuel | L'utilisateur clique sur un angle et voit "rendu non disponible" | Afficher uniquement les angles qui ont un visual publié pour le tissu sélectionné, masquer les autres |
| Swatch sans nom accessible | Les utilisateurs daltoniens ne peuvent pas identifier le tissu | `aria-label={fabric.name}` obligatoire sur chaque bouton swatch |

---

## "Looks Done But Isn't" Checklist

- [ ] **Prix premium :** Le supplément +80€ s'affiche sur le swatch sélectionné ET dans le prix total — vérifier que `calculatePrice(model.price, true)` est utilisé, pas `model.price + 80` inline.
- [ ] **État désélectionné :** Cliquer deux fois sur le même swatch ne casse pas l'état — vérifier que `selectedFabricId` ne devient pas `null` si on reclique le tissu déjà sélectionné (ou décider si c'est le comportement voulu).
- [ ] **Scroll mobile :** Le CTA "Acheter sur Shopify" est visible et cliquable sur un iPhone 375px sans scroll — tester avec le contenu complet (swatches, galerie, prix, CTA).
- [ ] **Reset modèle :** Fermer et rouvrir le configurateur sur un autre modèle remet le tissu sélectionné à zéro — vérifier avec deux modèles différents en séquence.
- [ ] **Fabric désactivée :** Un tissu passé à `is_active: false` entre le chargement de la page et la sélection n'apparaît pas dans les swatches — dépend du moment du fetch.
- [ ] **Visuals non publiés :** La sélection d'un tissu sans aucun visual publié affiche un message explicatif, pas un slot vide.
- [ ] **Lien Shopify :** `model.shopify_url` peut être `null` (champ nullable dans la table `models`) — le bouton "Acheter sur Shopify" doit être désactivé ou masqué si `shopify_url` est null.
- [ ] **Accessibilité swatches :** Chaque bouton swatch a `aria-label`, `aria-pressed`, et une taille de tap d'au moins 44px — vérifier avec les DevTools accessibilité.
- [ ] **TypeScript strict :** `generatesd_visuals` jointure avec `fabric` a le bon type — vérifier que `v.fabric` est typé `Fabric` et non `unknown` ou `Record<string, unknown>`.
- [ ] **`formatPrice` unifiée :** Une seule implémentation de formatage prix dans tout le modal — ni `ProductCard.formatPrice` ni la version locale, uniquement `formatPrice` de `src/lib/utils.ts`.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Pas d'API publique fabrics — découvert en prod | LOW | Créer `src/app/api/fabrics/route.ts` en 15 min (copie de `/api/models/route.ts` adapté), ou convertir un composant client en Server Component avec fetch Supabase direct |
| `calculatePrice` non utilisée — prix incohérents | LOW | Grep tous les `+ 80` et `price + ` dans le code, remplacer par `calculatePrice` de `src/lib/utils.ts`. 20 min. |
| CLS swatch/angle — recalcul layout | LOW | Ajouter `aspect-ratio: 4/3` fixe sur `.visualWrapper`, ajouter `key={currentVisualUrl}` sur `<Image>`. 10 min. |
| Return null avant hooks — crash modal | MEDIUM | Déplacer tous les `useState`/`useEffect` avant le early return. Vérifier l'ordre avec les règles des hooks React. 30 min. |
| État tissu non resetté entre modèles | MEDIUM | Ajouter `useEffect(() => { reset() }, [model?.id])` ou `key={model?.id}` sur `ConfiguratorModal`. 15 min + tests. |
| Tissus désactivés visibles dans configurateur | MEDIUM | Ajouter `.filter(v => v.fabric?.is_active)` dans le composant de rendu. 10 min. |
| Scroll iOS modal cassé après ajout contenu | HIGH | Audit de tous les `overflow: hidden` ajoutés sur les conteneurs internes. Vérifier que seul `.visualWrapper` et `.imageWrapper` ont `overflow: hidden`. Tester sur iPhone physique. 1-2h. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Pas d'API publique fabrics | Phase 1 — architecture fetch | Route ou Server Component créé, swatches visibles dans le modal |
| Fetch visuals au clic — latence | Phase 1 — décision fetch strategy | Choix documenté (preload vs lazy), skeleton swatches si lazy |
| Supabase join filtre non transitif | Phase 1 — query design | `filter(v => v.fabric?.is_active)` présent dans le code |
| CLS au changement d'angle | Phase 2 — gallery angles | `aspect-ratio` fixe sur `.visualWrapper`, `key` sur `<Image>` |
| Prix dynamique — mauvaise logique | Phase 2 — prix dynamique | `calculatePrice` de `src/lib/utils.ts` utilisée, pas de constante `80` inline |
| Scroll modal iOS — régression | Phase 2 + Phase 3 | Test mobile physique après chaque ajout de section dans le modal |
| Swatch grid — tap target mobile | Phase 2 — swatch grid | Swatches 44px minimum, flex-wrap, pas d'overflow horizontal |
| Swatch sans visuel — état vide | Phase 2 — affichage visuel | État "rendu non disponible" présent dans le JSX |
| Return null avant hooks | Phase 1 — refactorisation | `if (!model) return null` est la dernière ligne avant le JSX |
| Reset état entre modèles | Phase 1 — architecture state | Ouvrir deux modèles différents en séquence : état tissu resetté |

---

## Sources

- Analyse directe du code : `src/components/public/Catalogue/ConfiguratorModal.tsx` — pattern dialog natif Phase 6
- Analyse directe du code : `src/app/api/models/[slug]/visuals/route.ts` — pattern filtre `fabric.is_active` côté JS
- Analyse directe du code : `src/lib/utils.ts` — `calculatePrice`, `formatPrice` (sources de vérité uniques)
- Analyse directe du code : `src/types/database.ts` — schéma `generated_visuals`, `fabrics`, contrainte UNIQUE
- Analyse directe du code : `src/components/public/Catalogue/CatalogueSection.tsx` — pattern Server Component + Supabase direct
- Documentation projet : `.planning/phases/06-modal-configurateur-placeholder/06-RESEARCH.md` — pitfalls Phase 6 documentés
- Documentation projet : `CLAUDE.md` — contrainte prix premium = base + 80€ fixe
- MDN Web Docs — React Rules of Hooks (hooks avant les returns conditionnels)
- PostgREST docs — filtres sur relations (comportement des filtres sur jointures imbriquées)
- WCAG 2.5.5 — Target Size (44px minimum pour les cibles tactiles)

---

*Pitfalls research for: Configurateur tissu dans modal dialog natif — v9.0 Möbel Unique*
*Researched: 2026-03-29*
