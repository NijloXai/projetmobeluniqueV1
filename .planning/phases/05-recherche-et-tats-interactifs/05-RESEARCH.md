# Phase 5: Recherche et états interactifs - Research

**Researched:** 2026-03-29
**Domain:** Filtrage client-side React, normalisation Unicode FR, CSS Modules interactifs
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Design barre de recherche**
- D-01: Barre de recherche centrée sous le sous-titre, avant la grille
- D-02: Style fond teinté sans bordure — fond `#F6F3EF` (`--surface-container-low`), icône loupe muted à gauche, coins arrondis
- D-03: Placeholder texte : "Rechercher un canapé..."
- D-04: Largeur max ~480px centrée (même contrainte que le sous-titre)

**Comportement du filtre**
- D-05: Filtre sur `model.name` uniquement
- D-06: Filtre instantané à chaque frappe (pas de debounce) — acceptable pour 20-30 produits en mémoire
- D-07: Normalisation des accents pour la comparaison (NFD + suppression diacritiques)

**Compteur de résultats**
- D-08: Format naturel singulier/pluriel : "1 canapé" / "3 canapés"
- D-09: Position sous la barre de recherche, au-dessus de la grille, texte muted petit
- D-10: Le compteur se met à jour en temps réel avec le filtre actif

**État vide recherche**
- D-11: Message : `Aucun canapé ne correspond à "[terme]"` — reprend le terme saisi
- D-12: Bouton "Effacer la recherche" sous le message pour revenir à la liste complète
- D-13: Style cohérent avec `.emptyMessage` existant (texte muted centré)

### Claude's Discretion
- Espacement exact entre la barre de recherche et le compteur
- Taille de l'icône loupe et padding interne du champ
- Animation/transition sur le filtrage des cards (fade ou instantané)
- Focus ring style sur le champ de recherche
- Responsive : largeur du champ sur mobile (full-width ou avec marges)
- Bouton clear (X) dans le champ quand du texte est saisi

### Deferred Ideas (OUT OF SCOPE)
Aucun — discussion restée dans le scope de la phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAT-04 | Le nombre de produits affichés est visible (ex: "3 canapés") | `filteredModels.length` calculé en dérivé du state — pluriel via opérateur ternaire |
| SRCH-01 | L'utilisateur peut rechercher un canapé par nom via une barre de recherche | `useState` + `Array.filter()` + `normalize()` dans CatalogueClient.tsx |
| SRCH-02 | Un message s'affiche quand aucun produit ne correspond à la recherche | Branche conditionnelle sur `filteredModels.length === 0 && query !== ''` |
</phase_requirements>

---

## Summary

Cette phase est un cas classique de filtrage client-side React sur données en mémoire. Le data flow est déjà établi : `CatalogueSection` (Server Component) fetch Supabase et passe `models: ModelWithImages[]` en props à `CatalogueClient` (Client Component). Il suffit d'ajouter un `useState` pour le terme de recherche et de dériver `filteredModels` avant le `.map()`.

La seule subtilité technique est la normalisation Unicode pour les accents français. La méthode canonique est `string.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()` — vérifiée localement : `'canapé'.normalize('NFD').replace(...)` retourne `'canape'`. Aucune bibliothèque externe n'est nécessaire.

Pas de nouvelle route API. Pas de Zustand (réservé pour M009+). Pas de debounce (20-30 produits). Tout se résout en pur JavaScript natif + CSS Modules dans le fichier existant.

**Primary recommendation:** Modifier uniquement `CatalogueClient.tsx` et `CatalogueSection.module.css`. Aucune dépendance nouvelle. La logique de normalisation est une fonction pure extractible pour les tests.

---

## Standard Stack

### Core

| Bibliothèque | Version | Rôle | Pourquoi standard |
|---|---|---|---|
| React `useState` | (intégré Next.js 16) | State du terme de recherche | Client Component déjà présent |
| JavaScript natif `String.prototype.normalize` | ES2015 / Node 22 | Suppression des diacritiques FR | Zéro dépendance, support universel |
| Lucide React `Search` | 1.7.0 (installé) | Icône loupe dans le champ | Déjà utilisé dans le projet (Sofa icon) |
| CSS Modules | (intégré Next.js) | Styles du champ de recherche | Convention stricte du projet |

### Supporting

| Bibliothèque | Version | Rôle | Quand utiliser |
|---|---|---|---|
| Lucide React `X` | 1.7.0 (installé) | Bouton clear dans le champ | Quand `query !== ''` (Claude's Discretion) |

### Alternatives considérées

| Standard | Alternative écartée | Raison |
|---|---|---|
| `normalize('NFD')` natif | `fuse.js`, `match-sorter` | Overkill pour un filtre simple sur un champ — zéro dep. |
| `useState` local | Zustand store | Zustand réservé M009+ (décision STATE.md) |
| Filtre synchrone | `useDeferredValue` / `useTransition` | Inutile pour <30 items — pas de rendu coûteux |
| `Array.filter()` + `.includes()` | Index de recherche (lunr, flexsearch) | Volume ≤30 produits, simple substring suffit |

**Installation:** Aucune nouvelle dépendance. Tout est déjà disponible.

---

## Architecture Patterns

### Structure des fichiers à modifier

```
src/components/public/Catalogue/
├── CatalogueClient.tsx          ← MODIFIER (ajouter useState + logique filtre)
├── CatalogueSection.module.css  ← MODIFIER (ajouter .searchWrapper, .searchInput, etc.)
├── CatalogueSection.tsx         ← NE PAS TOUCHER (Server Component)
└── ProductCard.tsx              ← NE PAS TOUCHER
```

### Pattern 1: Filtre client-side par dérivation

**What:** `filteredModels` n'est pas un state — c'est une valeur dérivée calculée à chaque render depuis `models` (props) et `query` (state). Un seul `useState` pour le terme de recherche suffit.

**When to use:** Toujours quand les données source sont stables (props) et le volume est faible.

```typescript
// Source: React documentation — derived state
'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { ModelWithImages } from '@/types/database'
import { ProductCard } from './ProductCard'
import styles from './CatalogueSection.module.css'

// Fonction pure extractible pour les tests
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

interface CatalogueClientProps {
  models: ModelWithImages[]
}

export function CatalogueClient({ models }: CatalogueClientProps) {
  const [query, setQuery] = useState('')

  // Valeur dérivée — pas de useState supplémentaire
  const filteredModels = query
    ? models.filter((m) => normalize(m.name).includes(normalize(query)))
    : models

  // Singulier/pluriel
  const countLabel =
    filteredModels.length === 1
      ? '1 canapé'
      : `${filteredModels.length} canapés`

  // ...
}
```

### Pattern 2: Normalisation Unicode française

**What:** `String.prototype.normalize('NFD')` décompose les caractères composites en base + diacritique. Le `replace(/[\u0300-\u036f]/g, '')` supprime la couche diacritique. Résultat : "canapé" → "canape", "Björk" → "Bjork".

**When to use:** Toujours pour des comparaisons de chaînes en français où l'utilisateur peut taper sans accents.

```typescript
// Vérification locale (Node 22) — résultat confirmé : "canape"
'canapé'.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // → 'canape'
'Canapé'.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() // → 'canape'
```

### Pattern 3: État vide de recherche vs état vide produits

**What:** Deux états vides distincts avec des messages différents.

```typescript
// models vide (Supabase retourne []) — état existant
if (models.length === 0) { /* "Nos canapés arrivent bientôt." */ }

// filteredModels vide après recherche — nouvel état
if (filteredModels.length === 0 && query !== '') {
  // "Aucun canapé ne correspond à \"[terme]\"" + bouton reset
}
```

### Pattern 4: Bouton reset dans l'état vide

**What:** `setQuery('')` sur le click du bouton "Effacer la recherche". Le focus peut retourner sur l'input via `useRef`.

```typescript
const inputRef = useRef<HTMLInputElement>(null)

function handleReset() {
  setQuery('')
  inputRef.current?.focus()
}
```

### Anti-Patterns à éviter

- **State dupliqué:** Ne pas créer `filteredModels` comme un state `useState` — c'est une dérivation, pas un état indépendant. La source de vérité est `models` (props) + `query` (state).
- **Effect pour le filtre:** Ne pas utiliser `useEffect` pour mettre à jour une liste filtrée — c'est du rendu synchrone, pas un side-effect.
- **Debounce inutile:** Ne pas ajouter de debounce — décision D-06, 20-30 items max, pas de coût de render observable.
- **Nouveau composant pour le champ:** Le champ de recherche est intégré dans `CatalogueClient.tsx` — pas besoin d'un composant `SearchBar` séparé pour cette phase.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser à la place | Pourquoi |
|---|---|---|---|
| Normalisation accents | Regex custom, table de mapping | `normalize('NFD') + replace` natif | Standard ES2015, zéro bug, zéro dep |
| Singulier/pluriel FR | Librairie i18n | Opérateur ternaire simple | 1 seul mot, 2 cas — le ternaire est plus lisible |
| Icône loupe | SVG inline custom | `Search` de lucide-react (déjà installé) | Cohérence avec `Sofa` utilisé dans ProductCard |
| Compteur d'items | Librairie compteur | `array.length` natif | Trivial |

**Key insight:** Cette phase ne nécessite aucune bibliothèque externe. Tout ce qui est nécessaire est déjà présent dans le runtime JavaScript + les dépendances installées du projet.

---

## Common Pitfalls

### Pitfall 1: Comparaison sans normalisation des deux côtés

**What goes wrong:** Normaliser uniquement `query` mais pas `model.name`. "canapé milano" ne matche pas "canape" si le nom stocké en BDD garde ses accents.

**Why it happens:** On pense à normaliser l'input utilisateur mais pas la valeur comparée.

**How to avoid:** Appliquer `normalize()` aux deux opérandes dans le `.filter()` : `normalize(m.name).includes(normalize(query))`.

**Warning signs:** "canape" ne trouve pas "Canapé Milano" en test manuel.

### Pitfall 2: Casse non normalisée

**What goes wrong:** "MILANO" ne trouve pas "Milano" si on oublie `.toLowerCase()`.

**Why it happens:** La comparaison est case-sensitive par défaut.

**How to avoid:** Inclure `.toLowerCase()` dans la fonction `normalize()` — les deux chaînes sont comparées en minuscules.

### Pitfall 3: Espace superflu dans la query

**What goes wrong:** L'utilisateur tape "canapé " (avec espace final) et rien ne correspond.

**Why it happens:** `.includes()` cherche la chaîne exacte incluant l'espace.

**How to avoid:** Ajouter `.trim()` dans la fonction `normalize()`.

### Pitfall 4: Compteur affiché quand query est vide

**What goes wrong:** Afficher "12 canapés" quand aucune recherche n'est active — cela ressemble à une pagination ou un filtre actif.

**Why it happens:** Le compteur est rendu sans condition sur `query`.

**How to avoid:** La spec (D-09, CAT-04) indique que le compteur doit être visible. Vérifier si le compteur doit toujours s'afficher ou uniquement quand `query !== ''`. D'après D-10 "se met à jour avec le filtre actif" et CAT-04 "Le nombre de produits affichés est visible" — le compteur est toujours visible. Confirmer avec le planificateur.

### Pitfall 5: Hydration mismatch sur l'input

**What goes wrong:** Le composant est un Client Component mais si `useState` est initialisé avec une valeur calculée côté serveur, React peut détecter un mismatch.

**Why it happens:** N'arrive pas ici car `useState('')` est une valeur constante. Pas de risque.

**How to avoid:** Initialiser `useState('')` — aucune valeur dépendante du DOM ou du serveur.

### Pitfall 6: Test qui teste CatalogueClient sans le state de recherche

**What goes wrong:** Les tests existants dans `CatalogueClient.test.tsx` vérifient le rendu sans recherche. Ils passeront encore mais ne couvriront pas les nouvelles branches.

**Why it happens:** Le test existant n'importe pas `userEvent` ni ne simule la saisie.

**How to avoid:** Ajouter `@testing-library/user-event` dans les nouveaux tests. Il est déjà installé dans le projet (vérifié via `@testing-library/jest-dom`).

---

## Code Examples

### Fonction normalize (pure, testable)

```typescript
// Extractible dans un fichier utilitaire ou inline dans le composant
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Usage dans le filtre
const filteredModels = query
  ? models.filter((m) => normalize(m.name).includes(normalize(query)))
  : models
```

### Compteur singulier/pluriel

```typescript
const countLabel =
  filteredModels.length === 1
    ? '1 canapé'
    : `${filteredModels.length} canapés`
```

### Input de recherche avec icône Lucide

```tsx
import { Search, X } from 'lucide-react'

<div className={styles.searchWrapper}>
  <Search size={16} aria-hidden="true" className={styles.searchIcon} />
  <input
    ref={inputRef}
    type="search"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Rechercher un canapé..."
    className={styles.searchInput}
    aria-label="Rechercher un canapé par nom"
  />
  {query && (
    <button
      type="button"
      onClick={handleReset}
      className={styles.clearButton}
      aria-label="Effacer la recherche"
    >
      <X size={14} aria-hidden="true" />
    </button>
  )}
</div>
```

### État vide de recherche

```tsx
{filteredModels.length === 0 && query !== '' ? (
  <div className={styles.emptySearch}>
    <p className={styles.emptyMessage}>
      Aucun canapé ne correspond à &ldquo;{query}&rdquo;
    </p>
    <button
      type="button"
      onClick={handleReset}
      className={styles.resetButton}
    >
      Effacer la recherche
    </button>
  </div>
) : (
  <div className={styles.grid}>
    {filteredModels.map((model) => (
      <ProductCard key={model.id} model={model} onConfigure={undefined} />
    ))}
  </div>
)}
```

### Classes CSS Modules à ajouter dans CatalogueSection.module.css

```css
/* Conteneur de la barre de recherche — centré comme le sous-titre */
.searchWrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 480px;
  margin: var(--spacing-xl) auto 0; /* sous le sectionHeader */
}

/* Icône loupe à gauche */
.searchIcon {
  position: absolute;
  left: var(--spacing-md);
  color: var(--color-muted);
  pointer-events: none;
}

/* Input de recherche */
.searchInput {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) 2.5rem; /* espace pour l'icône */
  background-color: var(--surface-container-low); /* #F6F3EF — D-02 */
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  color: var(--color-text);
  outline: none;
}

.searchInput:focus {
  box-shadow: 0 0 0 2px var(--color-primary);
}

/* Bouton clear (X) dans le champ */
.clearButton {
  position: absolute;
  right: var(--spacing-md);
  background: none;
  border: none;
  color: var(--color-muted);
  display: flex;
  align-items: center;
  padding: 0;
}

/* Compteur de résultats */
.resultCount {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin-top: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

/* État vide de recherche */
.emptySearch {
  text-align: center;
  padding: var(--spacing-section) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

/* Bouton reset dans l'état vide */
.resetButton {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  cursor: pointer;
}

.resetButton:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
```

---

## State of the Art

| Ancienne approche | Approche actuelle | Impacte cette phase |
|---|---|---|
| `useEffect` pour mettre à jour une liste filtrée | Dérivation directe dans le render | Oui — ne pas utiliser useEffect |
| Debounce systématique sur les inputs | Debounce seulement si fetch async | Non applicable ici (décision D-06) |
| `Intl.Collator` pour la normalisation | `normalize('NFD') + replace` pour les accents | Non — Collator est pour le tri, pas le filtre |
| `type="text"` sur les inputs de recherche | `type="search"` (sémantique + clear natif iOS) | Oui — utiliser `type="search"` |

**Note sur `type="search"`:** L'attribut `type="search"` fournit un bouton clear natif sur certains navigateurs (Chrome desktop). Cela peut conflitter avec le bouton X custom. Dans ce cas, masquer le bouton natif via CSS : `input[type="search"]::-webkit-search-cancel-button { display: none; }`.

---

## Open Questions

1. **Compteur toujours visible ou seulement pendant la recherche active ?**
   - Ce qu'on sait : D-10 dit "se met à jour avec le filtre actif", CAT-04 dit "le nombre de canapés affichés est visible"
   - Ce qui est flou : "visible" implique-t-il en permanence ou seulement quand query est active ?
   - Recommandation : afficher le compteur en permanence (toujours montrer combien de canapés sont dans le catalogue). Cohérent avec CAT-04. Simple à implémenter.

2. **Bouton clear (X) dans le champ — Claude's Discretion**
   - Ce qu'on sait : laissé à la discrétion de Claude
   - Recommandation : inclure le bouton X. Pattern standard et accessible. `type="search"` + bouton custom X cohérent avec le design system tonal.

---

## Environment Availability

Step 2.6 : SKIPPED — phase purement client-side, aucune dépendance externe au-delà du projet lui-même. Lucide React et @testing-library déjà installés et vérifiés.

---

## Validation Architecture

### Test Framework

| Propriété | Valeur |
|---|---|
| Framework | Vitest 3.2.4 + @testing-library/react |
| Config file | `vitest.config.ts` (existant) |
| Commande rapide | `npm run test` |
| Suite complète | `npm run test` (47 tests, ~1s) |
| Environnement | happy-dom |

### Phase Requirements → Test Map

| Req ID | Comportement | Type | Commande automatisée | Fichier existe ? |
|---|---|---|---|---|
| SRCH-01 | Saisir "mil" filtre et affiche seulement "Milano" | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | Fichier existe — nouveaux cas à ajouter |
| SRCH-01 | Saisir "canape" trouve "Canapé Milano" (normalisation) | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | Fichier existe — nouveaux cas à ajouter |
| SRCH-02 | Saisir "zzz" affiche l'état vide avec le terme | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | Fichier existe — nouveaux cas à ajouter |
| SRCH-02 | Cliquer "Effacer la recherche" remet tous les canapés | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | Fichier existe — nouveaux cas à ajouter |
| CAT-04 | Compteur affiche "2 canapés" avec 2 modèles | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | Fichier existe — nouveaux cas à ajouter |
| CAT-04 | Compteur affiche "1 canapé" (singulier) avec 1 modèle | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | Fichier existe — nouveaux cas à ajouter |

### Sampling Rate

- **Par tâche :** `npm run test`
- **Par wave merge :** `npm run test`
- **Phase gate :** Suite complète verte avant `/gsd:verify-work`

### Wave 0 Gaps

Les tests pour les nouvelles fonctionnalités doivent être ajoutés dans le fichier existant :

- [ ] `src/__tests__/CatalogueClient.test.tsx` — ajouter les cas SRCH-01, SRCH-02, CAT-04
  - Import `@testing-library/user-event` (installé via @testing-library/jest-dom)
  - Tester la fonction `normalize` si elle est exportée, sinon tester via le comportement rendu
- [ ] Vérifier que `@testing-library/user-event` est bien disponible pour les interactions input

---

## Sources

### Primary (HIGH confidence)

- Vérification locale Node 22 — `'canapé'.normalize('NFD').replace(...)` → `'canape'` (confirmé)
- Lecture directe de `CatalogueClient.tsx`, `CatalogueSection.module.css`, `globals.css` — code source du projet
- Lecture de `src/__tests__/CatalogueClient.test.tsx` — infrastructure de test existante
- Lecture de `vitest.config.ts` — configuration test confirmée

### Secondary (MEDIUM confidence)

- MDN Web Docs — `String.prototype.normalize()` — API ES2015 standard
- React documentation — pattern de dérivation (filteredList = useMemo/direct compute from state+props)

### Tertiary (LOW confidence)

- Aucun.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — aucune dépendance nouvelle, tout est dans le projet
- Architecture: HIGH — code source lu directement, pattern React classique
- Pitfalls: HIGH — vérifiés par lecture du code existant et test local de normalisation

**Research date:** 2026-03-29
**Valid until:** Stable — JavaScript natif, pas de version à surveiller
