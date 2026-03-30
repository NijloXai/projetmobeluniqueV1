# Phase 08: Configurateur Core - Research

**Researched:** 2026-03-29
**Domain:** React useState, CSS Modules, next/image, ARIA radio group
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Filtrage des tissus eligibles dans ConfiguratorModal en croisant `visuals[]` et `fabrics[]` deja recus en props — `visuals.filter(v => v.model_id === model.id)` puis extraction des fabric_id uniques
- **D-02:** Aucun fetch supplementaire, aucune modification de CatalogueSection ou CatalogueClient
- **D-03:** Les tissus sans `swatch_url` (null) sont exclus de la grille de swatches
- **D-04:** Grille CSS Grid responsive de miniatures swatch_url cliquables
- **D-05:** Le swatch selectionne est visuellement distinct avec bordure `--color-primary` (#E49400)
- **D-06:** Les tissus premium affichent un badge "Premium" sur leur swatch
- **D-07:** L'image principale affiche le rendu IA publie (`generated_image_url`) quand un tissu est selectionne
- **D-08:** Fallback = photo originale du modele + badge "Photo originale" si aucun rendu trouve
- **D-09:** A l'ouverture du modal, aucun tissu pre-selectionne — etat initial `null`
- **D-10:** Importer `calculatePrice()` + `formatPrice()` depuis `src/lib/utils.ts`
- **D-11:** "A partir de X EUR" remplace par prix exact quand tissu selectionne
- **D-12:** Detail surcout "+80 EUR tissu premium" visible quand tissu premium selectionne
- **D-13:** `useState<string | null>` (fabric id) dans ConfiguratorModal — pas de Zustand
- **D-14:** CTA "Acheter sur Shopify" ouvre `model.shopify_url` en `target="_blank"`
- **D-15:** CTA masque si `model.shopify_url` est null ou vide
- **D-16:** Le contenu configurateur remplace la section `.placeholder` existante
- **D-17:** Layout 2 colonnes desktop conserve (image gauche / controles droite)

### Claude's Discretion

- Taille exacte des swatches dans la grille (56x56px carre per UI-SPEC)
- Espacement entre les swatches
- Position et style du badge "Premium" sur les swatches
- Position et style du badge "Photo originale" sur l'image
- Transition visuelle quand l'image change (instantane per UI-SPEC)
- Format exact du detail de prix premium
- Style du CTA "Acheter sur Shopify" (bouton outline per UI-SPEC)
- Accessibilite clavier de la grille de swatches

### Deferred Ideas (OUT OF SCOPE)

- Navigation entre angles de vue — Phase 9
- Zoom sur l'image du rendu IA — hors scope v9.0
- Filtres tissus par couleur/matiere — hors scope v9.0
- Zustand pour state configurateur — reserve v10.0
- Extraction getPrimaryImage/formatPrice en utilitaires partages — todo futur

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONF-01 | Le client voit les swatches des tissus disponibles (ayant au moins un rendu publie pour ce modele) | Filtrage via visuals prop — derivation useMemo recommandee |
| CONF-02 | Le client peut cliquer un swatch pour selectionner un tissu — swatch actif visuellement distinct | useState + conditionalClassName CSS Modules |
| CONF-03 | Les tissus premium affichent un badge "Premium" sur leur swatch | Positionnement absolu CSS + conditional render |
| CONF-05 | Si aucun rendu n'existe pour le tissu/angle, la photo originale s'affiche en fallback | Logique ternaire sur visual lookup |
| CONF-07 | Le prix se met a jour dynamiquement (base + 80 EUR si tissu premium) | calculatePrice() + formatPrice() de utils.ts |
| CONF-08 | Le detail du prix indique le surcout tissu quand applicable | Conditional render ligne secondaire |
| CONF-09 | Un CTA "Acheter sur Shopify" redirige vers le produit (nouvel onglet) | `<a target="_blank" rel="noopener noreferrer">` |
| CONF-10 | Le CTA est masque si le produit n'a pas de shopify_url | Conditional render `{model.shopify_url && ...}` |

</phase_requirements>

---

## Summary

Cette phase est une modification ciblée d'un composant React existant (`ConfiguratorModal.tsx`). Aucune nouvelle dependance, aucun fetch supplementaire — toutes les donnees sont deja en props. Le travail consiste a (1) remplacer le bloc `.placeholder` par la logique de selection tissu, (2) connecter l'image principale au rendu IA via `useState`, (3) afficher le prix dynamique via les utilitaires existants, (4) ajouter le CTA Shopify conditionnel.

Le principal risque d'erreur identifie est l'ordre des hooks React : le `useState` doit etre declare avant le guard `if (!model) return null` existant (ligne 70 dans ConfiguratorModal.tsx). Ce pattern est documente comme bloquer connu dans STATE.md. La grille de swatches necessite un pattern ARIA `role="radiogroup"` + `role="radio"` pour l'accessibilite clavier — pattern etabli dans UI-SPEC.

Le second risque est la deduplication des fabric_id : les `visuals` peuvent contenir plusieurs visuels pour le meme fabric_id (angles differents). Le filtrage doit extraire les fabric_id uniques, pas simplement lister les visuals.

**Recommandation principale:** Modifier uniquement `ConfiguratorModal.tsx` et `ConfiguratorModal.module.css`. Aucune autre modification de fichier.

---

## Standard Stack

### Core — tout deja present dans le projet

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React `useState` | React 19 (Next.js 16.2.1) | Etat de selection tissu | Suffisant per REQUIREMENTS.md — Zustand hors scope |
| `next/image` | Next.js 16.2.1 | Images optimisees (swatch, rendu IA) | Convention projet — deja utilise dans ConfiguratorModal |
| CSS Modules | Built-in Next.js | Styles scopes par composant | Convention projet stricte — PAS de Tailwind |
| `calculatePrice` / `formatPrice` | `src/lib/utils.ts` | Calcul et formatage du prix | Fonctions partagees front/back per CLAUDE.md |
| Lucide React `X` | Deja present | Icone fermeture | Deja importe dans ConfiguratorModal |

### Aucune nouvelle dependance a installer

Toutes les ressources sont deja dans le projet. Verification registry non requise.

---

## Architecture Patterns

### Structure des fichiers concernés

```
src/
  components/public/Catalogue/
    ConfiguratorModal.tsx          ← MODIFIER (logique + JSX)
    ConfiguratorModal.module.css   ← MODIFIER (swatches, badges, prix, CTA)
  lib/
    utils.ts                       ← LU SEULEMENT (calculatePrice, formatPrice)
  types/
    database.ts                    ← LU SEULEMENT (Fabric, VisualWithFabricAndImage)
```

### Pattern 1: Hooks avant le guard return null

**Ce qui existe (ligne 70 ConfiguratorModal.tsx) :**
```typescript
// IMPORTANT : return null APRES tous les hooks (React rules of hooks)
if (!model) return null
```

**Ce qui doit etre respecte :** Tout `useState` et `useCallback` supplementaire doit etre declare AVANT cette ligne. Violation = erreur React "Rendered fewer hooks than expected".

```typescript
// Source: React rules of hooks + STATE.md blocker connu
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
// ...

export function ConfiguratorModal({ model, onClose, fabrics, visuals }: ConfiguratorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = model !== null

  // ✅ useState AVANT le guard
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null)

  // useEffect scroll lock (existant) ...
  // useEffect dialog sync (existant) ...
  // useCallback handleDialogClick (existant) ...

  // GUARD en dernier
  if (!model) return null
  // ...
}
```

**Pitfall critique:** Si `useState` est place apres `if (!model) return null`, l'application crash a l'ouverture du modal (rules of hooks violation).

### Pattern 2: Reset du state a la fermeture du modal

**Probleme:** Quand l'utilisateur ferme le modal et rouvre un autre produit, `selectedFabricId` garde la valeur precedente.

**Solution:** Reset dans `useEffect` surveille par `model?.id` — quand le modele change (y compris de null a un modele), reset l'etat.

```typescript
// Reset selectedFabricId quand le modele change (ouverture d'un nouveau produit)
useEffect(() => {
  if (model === null) {
    setSelectedFabricId(null)
  }
}, [model])
```

**Alternative (plus simple):** Passer `key={model?.id ?? 'closed'}` au composant depuis le parent pour forcer un remount — mais cela implique modifier CatalogueClient.tsx ce qui viole D-02. Donc la solution useEffect est la bonne.

### Pattern 3: Derivation des tissus eligibles (fabric_id uniques)

**Raisonnement D-01:** `visuals[]` contient des visuels pour le modele courant (et potentiellement d'autres modeles si les props sont globales). Il faut filtrer par `model.id` ET extraire les fabric_id uniques (un tissu peut avoir plusieurs angles = plusieurs visuels).

```typescript
// Source: CONTEXT.md D-01 + analyse code existant
const eligibleFabricIds = new Set(
  visuals
    .filter(v => v.model_id === model.id && v.is_published)
    .map(v => v.fabric_id)
)

const eligibleFabrics = fabrics.filter(
  f => eligibleFabricIds.has(f.id) && f.swatch_url !== null
)
```

**Note sur is_published:** Les visuals passes en props depuis Phase 7 sont deja filtrés `is_published: true` cote server (CatalogueSection). Le filtre redondant `&& v.is_published` est une defense en profondeur acceptable — bas risque, pas de surcoût.

### Pattern 4: Lookup du visual courant

```typescript
// Source: analyse types database.ts
const currentVisual = selectedFabricId
  ? visuals.find(
      v => v.model_id === model.id &&
           v.fabric_id === selectedFabricId &&
           v.is_published
    )
  : null

const displayImageUrl = currentVisual?.generated_image_url ?? getPrimaryImage(model.model_images)
const isOriginalPhoto = selectedFabricId !== null && currentVisual === undefined
```

### Pattern 5: ARIA radiogroup pour la grille de swatches

**Requis par UI-SPEC (Interaction Contract — Accessibilite clavier).**

```tsx
// Source: UI-SPEC.md Interaction Contract + WAI-ARIA radiogroup pattern
<div
  role="radiogroup"
  aria-label="Choisissez votre tissu"
  className={styles.swatchGrid}
>
  {eligibleFabrics.map(fabric => (
    <button
      key={fabric.id}
      type="button"
      role="radio"
      aria-checked={selectedFabricId === fabric.id}
      aria-label={`${fabric.name}${fabric.is_premium ? ' — Premium' : ''}`}
      className={`${styles.swatch} ${selectedFabricId === fabric.id ? styles.swatchSelected : ''}`}
      onClick={() => setSelectedFabricId(fabric.id)}
    >
      <Image
        src={fabric.swatch_url!}
        alt=""
        fill
        style={{ objectFit: 'cover' }}
        sizes="56px"
      />
      {fabric.is_premium && (
        <span className={styles.badgePremium} aria-hidden="true">Premium</span>
      )}
    </button>
  ))}
</div>
```

**Note:** `role="radio"` sur un `<button>` est valide WAI-ARIA. L'alternative `<input type="radio">` masque avec `<label>` est plus semantique mais plus complexe — le pattern bouton+role est acceptable pour une grille d'images.

### Pattern 6: Prix dynamique avec deux états

```typescript
// Source: CONTEXT.md D-10, D-11, D-12 + utils.ts existant
import { calculatePrice, formatPrice } from '@/lib/utils'

// Dans le JSX :
const selectedFabric = selectedFabricId
  ? fabrics.find(f => f.id === selectedFabricId)
  : null

// Rendu :
{selectedFabric ? (
  <div className={styles.priceBlock}>
    <p className={styles.price}>
      {formatPrice(calculatePrice(model.price, selectedFabric.is_premium))}
    </p>
    {selectedFabric.is_premium && (
      <p className={styles.priceSupplement}>+ 80\u00a0€ · tissu premium</p>
    )}
  </div>
) : (
  <p className={styles.price}>
    {`\u00c0 partir de ${formatPrice(model.price)}`}
  </p>
)}
```

**Conflit avec formatPrice local:** ConfiguratorModal.tsx a sa propre `formatPrice` locale (ligne 16) qui retourne `"a partir de X €"`. Cette fonction DOIT etre supprimee ou renommee pour eviter le conflit avec l'import de `src/lib/utils.ts`. La fonction locale de `utils.ts` retourne juste le prix formate (sans prefix).

### Pattern 7: Badge par positionnement absolu CSS

```css
/* Source: UI-SPEC.md — badge Premium et badge Photo originale */
.swatch {
  position: relative; /* contexte pour les badges enfants */
}

.badgePremium {
  position: absolute;
  bottom: var(--spacing-xs);     /* 4px */
  right: var(--spacing-xs);      /* 4px */
  background: rgba(228, 148, 0, 0.15);
  color: var(--color-primary-dark);
  font-size: var(--font-size-xs); /* 12px */
  font-weight: 600;
  border-radius: var(--radius-sm); /* 4px */
  padding: 2px var(--spacing-xs); /* 2px 4px */
  line-height: 1;
  pointer-events: none;
}

.badgeOriginalPhoto {
  position: absolute;
  bottom: var(--spacing-sm);    /* 8px */
  left: var(--spacing-sm);      /* 8px */
  background: rgba(0, 0, 0, 0.55);
  color: #FFFFFF;
  font-size: var(--font-size-xs); /* 12px */
  font-weight: 600;
  border-radius: var(--radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm); /* 4px 8px */
  pointer-events: none;
}
```

### Anti-Patterns a Eviter

- **Placer useState apres le guard return null** — crash rules of hooks
- **Ne pas reset selectedFabricId quand le modal se ferme** — etat residuel entre produits
- **Filtrer les visuals sans deduplication des fabric_id** — tissus dupliques dans la grille
- **Modifier CatalogueSection ou CatalogueClient** — viole D-02, hors scope
- **Utiliser la formatPrice locale au lieu de utils.ts** — inconsistance, la locale retourne "a partir de" en dur
- **Omettre `rel="noopener noreferrer"` sur target="_blank"** — faille securite

---

## Don't Hand-Roll

| Probleme | Ne pas construire | Utiliser a la place | Pourquoi |
|---------|-------------------|---------------------|---------|
| Calcul prix premium | Formule inline `price + 80` | `calculatePrice(price, isPremium)` de `utils.ts` | Centralise, testee, source de verite |
| Formatage prix EUR | Template string | `formatPrice(price)` de `utils.ts` | Intl.NumberFormat avec locale fr-FR, gere les espaces insecables |
| Selection image principale | Logique inline de tri | `getPrimaryImage(model.model_images)` de ConfiguratorModal | Logique deja testee (priorite 3/4) |
| Reset etat fermeture | Gestion manuelle dans onClose | `useEffect` surveille `model` | Pattern React standard, evite la mutation de l'etat dans les callbacks |

**Insight cle:** `formatPrice()` de utils.ts retourne JUSTE le prix formate (ex: "1 590 €"). La formatPrice LOCALE dans ConfiguratorModal.tsx ajoute le prefix "a partir de" — les deux coexistent mais servent des cas differents. Phase 8 doit importer depuis utils.ts et supprimer ou neutraliser la locale.

---

## Common Pitfalls

### Pitfall 1: useState apres return null (bloquer State.md)

**Ce qui se passe:** React lance "Rendered fewer hooks than expected" en mode strict, ou comportement silencieusement incorrect en prod.
**Pourquoi:** Rules of hooks — les hooks doivent etre appeles dans le meme ordre a chaque render. Un guard early return avant un hook casse cette invariante.
**Comment eviter:** Declarer TOUS les hooks (useState, useEffect, useCallback) avant la premiere instruction `return` conditionnelle. Le commentaire `// IMPORTANT : return null APRES tous les hooks` existe deja dans ConfiguratorModal.tsx.
**Signe d'alerte:** Erreur console "Rendered fewer hooks" ou comportement de selection qui "saute" un rendu.

### Pitfall 2: Conflit entre formatPrice locale et formatPrice de utils.ts

**Ce qui se passe:** Si les deux sont importees/definies dans le meme fichier, TypeScript signale une erreur ou la mauvaise version est appelee silencieusement.
**Pourquoi:** La fonction locale `formatPrice` (ligne 16 ConfiguratorModal.tsx) a le meme nom que l'export de utils.ts.
**Comment eviter:** Supprimer (ou renommer) la fonction locale et importer depuis utils.ts. La fonction locale exporte aussi via `export function formatPrice` — son import dans les tests existants doit etre mis a jour si elle est supprimee. Verifier `src/__tests__/ConfiguratorModal.test.tsx` qui importe `formatPrice` depuis ConfiguratorModal directement (ligne 4).
**Impact sur les tests:** Les tests actuels testent `formatPrice` de ConfiguratorModal avec le format "a partir de X €". Si la fonction locale est supprimee, ces tests cassent. Solution: conserver la fonction locale mais ne pas l'utiliser pour le prix dynamique — ou adapter les tests.

### Pitfall 3: Etat residuel selectedFabricId entre produits

**Ce qui se passe:** L'utilisateur ouvre le modal du produit A, selectionne tissu X, ferme, ouvre produit B — le tissu X est toujours selectionne (meme s'il ne correspond pas au produit B).
**Pourquoi:** useState persiste dans le cycle de vie du composant parent. Le composant ConfiguratorModal n'est pas demonté entre les ouvertures.
**Comment eviter:** Reset `selectedFabricId` a null dans un useEffect qui surveille `model` (specifiquement quand model passe a null = fermeture).
**Signe d'alerte:** Image incorrecte affichee a l'ouverture d'un second produit.

### Pitfall 4: next/image avec `fill` dans un conteneur sans `position: relative`

**Ce qui se passe:** Image invisible ou mal positionnee — next/image en mode `fill` requiert que le conteneur parent ait `position: relative` (ou absolute/fixed).
**Pourquoi:** `fill` utilise `position: absolute` sur le tag `<img>` genere.
**Comment eviter:** S'assurer que `.swatch` et `.imageWrapper` ont `position: relative` dans le CSS Module. Le `.imageWrapper` l'a deja (Phase 6). Les `.swatch` doivent l'avoir aussi.
**Signe d'alerte:** Console warning Next.js "Image with fill should use sizes" + image invisible.

### Pitfall 5: Deduplication manquante des fabric_id

**Ce qui se passe:** Un tissu avec 3 angles = 3 visuels dans le tableau `visuals[]` → 3 swatches identiques dans la grille.
**Pourquoi:** `visuals.filter(v => v.fabric_id === ...)` retourne plusieurs entrees pour le meme tissu si plusieurs angles sont generes.
**Comment eviter:** Utiliser `new Set()` sur les fabric_id apres filtrage par model_id (Pattern 3 ci-dessus).
**Signe d'alerte:** Swatches dupliques dans la grille pour un meme tissu.

### Pitfall 6: CTA "Acheter" sans `rel="noopener noreferrer"`

**Ce qui se passe:** Faille de securite "reverse tabnapping" — la page ouverte dans le nouvel onglet peut acceder a `window.opener`.
**Pourquoi:** `target="_blank"` sans rel laisse la fenetre ouverte avoir acces au contexte parent.
**Comment eviter:** Toujours `rel="noopener noreferrer"` sur tout lien `target="_blank"`.

### Pitfall 7: iOS Safari scroll lock — conteneur modal

**Ce qui se passe (existant, State.md):** Scroll dans le body reprend apres fermeture si le lock position:fixed n'est pas correctement retire.
**Impact Phase 8:** Ajouter la grille de swatches va augmenter la hauteur du body du modal. Sur mobile, si le contenu deborde `.content` (qui a `overflow-y: auto`), le scroll interne du modal doit rester fluide. Ne pas ajouter `overflow: hidden` sur des elements intermediaires qui empecheraient le scroll `.content`.
**Comment eviter:** Respecter la structure `.dialog > .content > .inner > .body` existante. Seul `.content` gere le scroll vertical.

---

## Code Examples

Patterns verifies depuis le code existant du projet.

### Integration complete — logique de selection

```typescript
// Source: analyse ConfiguratorModal.tsx existant + CONTEXT.md decisions
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { calculatePrice, formatPrice } from '@/lib/utils'
import type { ModelWithImages, ModelImage, Fabric, VisualWithFabricAndImage } from '@/types/database'
import styles from './ConfiguratorModal.module.css'

export function getPrimaryImage(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const image34 = model_images.find((img) => img.view_type === '3/4')
  if (image34) return image34.image_url
  return model_images[0].image_url
}

// formatPrice LOCALE conservee pour les tests existants (retourne "a partir de X €")
export function formatPrice(price: number): string {
  return 'a partir de ' + new Intl.NumberFormat('fr-FR').format(price) + ' \u20ac'
}
// NOTE: Ne pas utiliser la locale ci-dessus pour le prix dynamique Phase 8 —
// importer formatPrice depuis utils.ts sous un alias different si conflit de nom.
```

**Strategie recommandee pour resoudre le conflit de nom:**

```typescript
// Import avec alias pour eviter le conflit de nom
import { calculatePrice, formatPrice as formatPriceUtil } from '@/lib/utils'
// Utiliser formatPriceUtil pour le prix dynamique dans JSX
// Conserver la fonction locale formatPrice pour ne pas casser les tests existants
```

### CSS swatch — contraintes dimensionnelles cles

```css
/* Source: UI-SPEC.md — cibles tactiles WCAG 2.5.5 */
.swatch {
  position: relative;        /* contexte pour next/image fill et badges */
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md); /* 8px */
  overflow: hidden;
  border: 3px solid transparent;  /* bordure transparente pour eviter le saut */
  cursor: pointer;
  background: none;
  padding: 0;
  transition: box-shadow var(--transition-fast);
  flex-shrink: 0;
}

.swatchSelected {
  border-color: var(--color-primary);
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.swatch:hover {
  box-shadow: var(--shadow-md);
}

.swatchGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: var(--spacing-xs); /* 4px */
  padding: var(--spacing-md) 0; /* 16px vertical */
}
```

### CTA Shopify — lien accessible

```tsx
{/* Source: UI-SPEC.md Interaction Contract CTA Shopify */}
{model.shopify_url && (
  <a
    href={model.shopify_url}
    target="_blank"
    rel="noopener noreferrer"
    className={styles.ctaShopify}
    aria-label={`Acheter ${model.name} sur Shopify — ouvre un nouvel onglet`}
  >
    Acheter sur Shopify
  </a>
)}
```

---

## State of the Art

| Ancien Approche | Approche Actuelle | Impact |
|----------------|-------------------|--------|
| `<input type="radio">` hidden + `<label>` | `<button role="radio">` dans `role="radiogroup"` | Valide WAI-ARIA, plus simple sans JS de synchronisation input/visuel |
| `useMemo` pour derivations | Calcul inline dans le corps de la fonction | Acceptable pour petits tableaux (< 50 tissus) — useMemo si perf visible |
| Zustand pour etat configurateur | `useState` local | Suffisant Phase 8 — migration Zustand reservee v10.0 |

**Deprecated/obsolete:**
- La fonction `formatPrice` locale dans ConfiguratorModal.tsx retourne "a partir de" en dur — ce format n'est valide que pour l'etat initial sans selection. Pour le prix dynamique, utiliser `formatPrice` de utils.ts.

---

## Open Questions

1. **Conflit de nom formatPrice**
   - Ce qu'on sait: ConfiguratorModal.tsx exporte une `formatPrice` locale avec un format different de utils.ts. Les tests existants (ligne 4 du test) importent cette version locale et testent son format specifique ("a partir de X €").
   - Ce qui est flou: Supprimer la locale casserait les tests existants. Garder les deux avec import alias est la solution la moins risquee.
   - Recommandation: Conserver la fonction locale exportee (pour compatibilite tests), importer utils.ts `formatPrice` sous l'alias `formatPriceUtil` pour le prix dynamique.

2. **`useMemo` pour eligibleFabrics**
   - Ce qu'on sait: La derivation eligibleFabricIds/eligibleFabrics est calculee a chaque render. Avec < 50 tissus, le cout est negligeable.
   - Ce qui est flou: Si le volume de tissus depasse ~100, useMemo serait justifie.
   - Recommandation: Pas de useMemo pour Phase 8 — garder simple. Ajouter si perf visible.

---

## Environment Availability

Step 2.6: SKIPPED — Phase purement code/config, zero dependance externe. Tous les outils (Next.js, Vitest, TypeScript) deja installes et fonctionnels (74 tests verts, Phase 7 complete).

---

## Validation Architecture

### Test Framework

| Propriete | Valeur |
|-----------|--------|
| Framework | Vitest 3.x + @testing-library/react |
| Config file | `vitest.config.ts` (racine projet) |
| Setup file | `src/__tests__/setup.ts` (mock HTMLDialogElement, cleanup) |
| Commande rapide | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` |
| Suite complete | `npm test` |

### Phase Requirements vers Tests

| Req ID | Comportement | Type | Commande Automatisee | Fichier Existant |
|--------|-------------|------|---------------------|-----------------|
| CONF-01 | eligibleFabrics ne contient que les tissus avec rendu publie | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) |
| CONF-02 | Cliquer un swatch met a jour selectedFabricId et le style | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) |
| CONF-03 | Badge "Premium" visible sur swatch premium | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ Wave 0 |
| CONF-05 | Fallback photo originale + badge quand pas de rendu | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ Wave 0 |
| CONF-07 | Prix mis a jour selon tissu selectionne | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ Wave 0 |
| CONF-08 | "+80 EUR tissu premium" visible uniquement pour premium | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ Wave 0 |
| CONF-09 | CTA Shopify pointe vers shopify_url en target blank | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ Wave 0 |
| CONF-10 | CTA masque si shopify_url null | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `src/__tests__/ConfiguratorModal.test.tsx` — ajouter describe "Phase 8 — configurateur" avec tests CONF-02, CONF-03, CONF-05, CONF-07, CONF-08, CONF-09, CONF-10
- [ ] Tests existants `[MODAL-03] affiche le message Configurateur a venir` et `[MODAL-03] affiche le texte explicatif placeholder` devront etre mis a jour (le placeholder est remplace)

### Cadence de validation

- **Par commit de tache:** `npx vitest run src/__tests__/ConfiguratorModal.test.tsx`
- **Par merge de wave:** `npm test`
- **Gate de phase:** `npm test` vert + `npx tsc --noEmit` propre avant `/gsd:verify-work`

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact Phase 8 |
|-----------|----------------|
| PAS de Tailwind, PAS de shadcn/ui | Tous les styles via CSS Modules uniquement |
| Un fichier `.module.css` par composant | Ne pas inliner les styles, ne pas creer de fichier CSS global supplementaire |
| Composants en PascalCase, un fichier par composant | Aucun sous-composant a extraire dans cette phase |
| Aucun `any` TypeScript | Les types Fabric, VisualWithFabricAndImage de database.ts sont stricts — les utiliser directement |
| Messages d'erreur en francais | Copie "Aucun tissu disponible pour ce modele." per UI-SPEC |
| Langue UI francais uniquement | Tous les labels, badges, CTA en francais |
| next/image pour images optimisees | Utiliser `<Image>` de next/image pour swatch_url et generated_image_url |
| Design tokens dans globals.css | Aucun nouveau token — utiliser les variables CSS existantes |

---

## Sources

### Primary (HIGH confidence)

- Code source `ConfiguratorModal.tsx` — structure hooks existante, guard return null, props interface
- Code source `ConfiguratorModal.module.css` — styles Phase 6, structure .imageWrapper, .body
- Code source `src/lib/utils.ts` — signatures exactes calculatePrice, formatPrice
- Code source `src/types/database.ts` — types Fabric, VisualWithFabricAndImage, ModelWithImages
- Code source `src/__tests__/ConfiguratorModal.test.tsx` — tests existants, imports locaux formatPrice
- `08-CONTEXT.md` — 17 decisions verrouillees
- `08-UI-SPEC.md` — contrat visuel complet (dimensions, couleurs, tokens, ARIA)
- `src/app/globals.css` — tokens CSS complets

### Secondary (MEDIUM confidence)

- WAI-ARIA Authoring Practices — radiogroup pattern (verifie via pattern etabli dans l'ecosysteme)
- Next.js docs next/image — `fill` + `position: relative` requis sur parent (pattern etabli)

### Tertiary (LOW confidence)

- Aucune

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tout dans le projet, zero nouvelle dependance
- Architecture: HIGH — code existant examine ligne par ligne, decisions verrouillees
- Pitfalls: HIGH — 5/7 pitfalls identifies depuis code existant et STATE.md, 2 depuis patterns React etablis

**Research date:** 2026-03-29
**Valid until:** 2026-04-29 (stable — pas de dependances externes qui evoluent)
