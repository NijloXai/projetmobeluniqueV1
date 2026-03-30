# Phase 7: Fetch données + câblage props - Research

**Researched:** 2026-03-29
**Domain:** Next.js 16 Server Components + Supabase direct fetch + TypeScript props drilling
**Confidence:** HIGH

## Summary

La phase 7 consiste à enrichir `CatalogueSection` (Server Component) avec deux requêtes Supabase parallèles (fabrics actifs + visuels publiés), et à descendre ces données en props plates jusqu'à `ConfiguratorModal` via `CatalogueClient`. Zéro fetch côté client au moment de l'ouverture du modal.

Le code existant dans `CatalogueSection.tsx` fournit déjà le pattern exact à suivre : fetch Supabase direct avec `createClient()`, mapping des données, passage en props à `CatalogueClient`. Il s'agit d'étendre ce pattern avec `Promise.all` plutôt que de l'inventer.

La principale complexité est la query visuels avec jointures (`fabric:fabrics(*)`, `model_image:model_images(*)`), le filtrage JS obligatoire de `is_active` sur le tissu joint (décision D-09, confirmée dans le code de l'API existante `/api/models/[slug]/visuals`), et l'ajout du type `VisualWithFabricAndImage` dans `database.ts`.

**Primary recommendation:** Copier exactement le pattern de filtrage de `/api/models/[slug]/visuals/route.ts` dans le Server Component, l'envelopper dans `Promise.all`, et ajouter les props manquantes en cascade jusqu'au modal.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** CatalogueSection execute 3 queries Supabase en parallele via `Promise.all` : models (existant), fabrics actifs, visuels publies (valides + publies + tissu actif)
- **D-02:** Les visuels sont fetches en une seule requete globale (tous modeles confondus), pas de fetch par modele (evite N+1)
- **D-03:** Les tissus sont fetches via Supabase direct dans le Server Component (comme models), pas via une API publique
- **D-04:** CatalogueClient recoit 3 props separees : `models: ModelWithImages[]`, `fabrics: Fabric[]`, `visuals: VisualWithFabricAndImage[]`
- **D-05:** ConfiguratorModal recoit `model` + `fabrics[]` + `visuals[]` separement — chaque prop a un role clair
- **D-06:** Le type `VisualWithFabricAndImage` est defini dans database.ts : `GeneratedVisual & { fabric: Fabric, model_image: ModelImage }`
- **D-07:** Phase 7 passe TOUS les tissus actifs et TOUS les visuels publies au modal sans filtrage par modele
- **D-08:** Le filtrage "tissus ayant au moins un rendu publie pour ce modele" est la responsabilite de Phase 8 cote UI
- **D-09:** Les tissus desactives (`is_active = false`) sont filtres cote JS apres le fetch Supabase (PostgREST ne filtre pas sur jointures imbriquees)

### Claude's Discretion

- Source donnees tissus : Supabase direct ou creation API publique GET /api/fabrics (recommande Supabase direct)
- Gestion erreur si un des 3 fetches echoue (degradation gracieuse vs erreur totale)
- Structure exacte du type VisualWithFabricAndImage et placement dans database.ts
- Strategie de filtrage `is_active` sur les visuels (query `.eq()` vs filtre JS)

### Deferred Ideas (OUT OF SCOPE)

- Extraction de `getPrimaryImage`/`formatPrice` en utilitaires partages (todo pending, v9.0 ou v10.0)
- API publique GET /api/fabrics — pas necessaire tant que le fetch est server-side, a creer si besoin client futur
- Cache/revalidate des donnees — a evaluer en v10.0 si performance le justifie
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONF-01 | Le client voit les swatches des tissus disponibles (ayant au moins un rendu publie pour ce modele) | Donnees fabrics[] disponibles dans ConfiguratorModal — filtrage par modele = Phase 8 |
| CONF-02 | Le client peut cliquer un swatch pour selectionner un tissu | Props fabrics[] present dans modal — interaction = Phase 8 |
| CONF-04 | Le modal affiche le rendu IA publie du canape dans le tissu selectionne | Props visuals[] present dans modal — affichage = Phase 9 |
| CONF-05 | Si aucun rendu n'existe, la photo originale du modele s'affiche en fallback | Props visuals[] disponibles pour logique de fallback = Phase 8/9 |
| CONF-07 | Le prix affiche se met a jour dynamiquement (base + 80 EUR si tissu premium) | `is_premium` inclus dans type Fabric — logique prix = Phase 8 |
| CONF-08 | Le detail du prix indique le surcout tissu quand applicable | `is_premium` dans Fabric disponible — affichage = Phase 8 |
| CONF-09 | Un CTA "Acheter sur Shopify" redirige vers le produit | `shopify_url` deja dans ModelWithImages — logique CTA = Phase 8 |
| CONF-10 | Le CTA est masque si le produit n'a pas de shopify_url | `shopify_url` nullable deja dans type — logique = Phase 8 |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version (verifiee) | Purpose | Why Standard |
|---------|--------------------|---------|--------------|
| `@supabase/supabase-js` | 2.100.1 (latest) | Client PostgREST + Auth | Deja installe, pattern etabli dans le projet |
| `@supabase/ssr` | 0.9.0 (latest) | Server-side client Next.js App Router | `createClient()` deja utilise dans CatalogueSection |
| TypeScript | ~5.x | Typage strict | Convention projet — `aucun any` |
| Next.js | 16.2.1 (projet) | Server Components, App Router | Framework du projet |

### Supporting

Aucun nouveau package requis pour cette phase. Toutes les briques sont deja presentes.

### Alternatives Considerees

| Au lieu de | Aurait pu utiliser | Pourquoi rejete |
|------------|--------------------|-----------------|
| Supabase direct dans Server Component | API publique GET /api/fabrics | Indirection inutile, le Server Component a deja acces direct (D-03) |
| Promise.all pour parallelisme | Awaits sequentiels | Waterfall reseau — rejete par D-01 |
| Filtre JS post-fetch pour is_active | `.eq('fabric.is_active', true)` en PostgREST | PostgREST ne filtre pas sur jointures imbriquees (D-09, confirme dans code existant) |

**Installation :** Aucun nouveau package a installer.

---

## Architecture Patterns

### Structure des fichiers modifies

```
src/
  types/
    database.ts                    # Ajouter VisualWithFabricAndImage (lignes ~215)
  components/public/Catalogue/
    CatalogueSection.tsx           # Server Component — ajouter Promise.all + 2 fetches
    CatalogueClient.tsx            # Client Component — etendre props + forwarding
    ConfiguratorModal.tsx          # Etendre interface props (contenu = Phase 8)
```

### Pattern 1: Promise.all dans Server Component

**What:** Executer 3 queries Supabase en parallele, chacune independante des autres.
**When to use:** Toujours quand les 3 fetches ne dependent pas les uns des autres.

```typescript
// Source: pattern etabli dans CatalogueSection.tsx + decisions D-01/D-02/D-03
// Verifiable: https://supabase.com/docs/reference/javascript/select

const supabase = await createClient()

const [modelsResult, fabricsResult, visualsResult] = await Promise.all([
  supabase
    .from('models')
    .select('*, model_images(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false }),

  supabase
    .from('fabrics')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true }),

  supabase
    .from('generated_visuals')
    .select('*, fabric:fabrics(*), model_image:model_images(*)')
    .eq('is_validated', true)
    .eq('is_published', true)
    .order('created_at', { ascending: false }),
])
```

### Pattern 2: Filtrage JS obligatoire de is_active sur jointure

**What:** PostgREST ne supporte pas le filtrage sur colonnes de tables jointes via `.eq()`. Le filtre `fabric.is_active` doit etre fait en JS apres le fetch.

**Preuve dans le code existant** (`/api/models/[slug]/visuals/route.ts`, lignes 54-61) :

```typescript
// Source: src/app/api/models/[slug]/visuals/route.ts (code existant, ligne 54)
const filteredVisuals = (visuals ?? []).filter(
  (v) => {
    const fabric = v.fabric as { is_active: boolean } | null
    return fabric?.is_active === true
  }
)
```

Avec le type `VisualWithFabricAndImage`, le filtre devient :

```typescript
// Source: adapte du pattern existant (D-09)
const activeVisuals = (rawVisuals ?? []).filter(
  (v): v is VisualWithFabricAndImage =>
    v.fabric !== null && (v.fabric as Fabric).is_active === true
)
```

### Pattern 3: Type VisualWithFabricAndImage dans database.ts

**What:** Type enrichi representant un visual avec ses relations resolvees. Suit le pattern de `ModelWithImages` et `ModelWithImagesAndVisuals` deja presents (lignes 205-214).

```typescript
// Source: decisions D-06, pattern existant dans database.ts lignes 205-214
export type VisualWithFabricAndImage = GeneratedVisual & {
  fabric: Fabric
  model_image: ModelImage
}
```

Ce type correspond exactement a la query Supabase `.select('*, fabric:fabrics(*), model_image:model_images(*)')` — pattern identique a l'API existante.

### Pattern 4: Props drilling CatalogueSection → CatalogueClient → ConfiguratorModal

**What:** Props plates passees en cascade. Chaque composant recoit les donnees dont il a besoin.

```typescript
// CatalogueClient — interface etendue (D-04)
interface CatalogueClientProps {
  models: ModelWithImages[]
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
}

// ConfiguratorModal — interface etendue (D-05)
interface ConfiguratorModalProps {
  model: ModelWithImages | null
  onClose: () => void
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
}
```

**Forwarding dans CatalogueClient** : `ConfiguratorModal` recoit `fabrics` et `visuals` en props. Phase 8 les utilisera — Phase 7 les connecte seulement.

### Pattern 5: Gestion d'erreur avec degradation gracieuse

**What:** Si un des 3 fetches echoue, afficher une erreur. La decision exacte (erreur totale vs partielle) est laissee a la discretion Claude.

**Recommandation (discretion Claude) :** Traiter toute erreur Supabase dans Promise.all comme une erreur bloquante et retourner le message d'erreur existant — coherent avec le pattern actuel de `CatalogueSection`.

```typescript
// Pattern coherent avec l'existant (CatalogueSection.tsx lignes 15-25)
if (modelsResult.error || fabricsResult.error || visualsResult.error) {
  return (
    <section id="catalogue" className={styles.section}>
      <div className={styles.container}>
        <p className={styles.errorMessage}>
          Impossible de charger les produits. Veuillez rafraichir la page.
        </p>
      </div>
    </section>
  )
}
```

### Anti-Patterns a Eviter

- **Fetch sequentiel avec await individuel :** Cree un waterfall reseau (300ms + 300ms + 300ms au lieu de max(300ms)). Toujours `Promise.all` quand les requetes sont independantes.
- **Filtrage PostgREST sur jointure :** `.eq('fabric.is_active', true)` sur une jointure imbriquee ne fonctionne pas avec Supabase PostgREST. Le filtre JS post-fetch est obligatoire (confirme dans le code existant).
- **Fetch client au moment de l'ouverture du modal :** Cree un delai visible pour l'utilisateur. Les donnees doivent etre pre-chargees cote serveur.
- **Hook useState/useEffect dans Server Component :** `CatalogueSection` est un Server Component — uniquement du code async/await, pas de hooks React.
- **Declarer des useState apres le guard `if (!model) return null` dans ConfiguratorModal :** Le guard existe a la ligne 67. Les nouveaux hooks (si requis) doivent etre declares AVANT ligne 67 (regle des hooks React). Note du STATE.md.

---

## Don't Hand-Roll

| Probleme | Ne pas construire | Utiliser | Pourquoi |
|----------|-------------------|----------|----------|
| Parallelisme des requetes | Gestionnaire de queue custom | `Promise.all` natif | Standard JS, pas de dependance |
| Jointures SQL | Assemblage manuel en JS | Supabase `.select('*, relation(*)')` | PostgREST resout les jointures cote serveur |
| Typage des donnees enrichies | Type inline dans chaque composant | Type central dans `database.ts` | Coherence, maintenance, pattern etabli |
| Filtrage `is_active` | Logique custom | Filtre `.filter()` JS simple | Le pattern existe deja dans l'API |

---

## Common Pitfalls

### Pitfall 1: PostgREST ne filtre pas les colonnes de jointures imbriquees

**What goes wrong:** Ecrire `.eq('fabric.is_active', true)` dans la query Supabase n'a aucun effet — les visuels avec tissu inactif sont quand meme retournes.
**Why it happens:** PostgREST applique les filtres sur la table principale uniquement.
**How to avoid:** Toujours filtrer `fabric.is_active` cote JS apres le fetch (pattern confirme dans `/api/models/[slug]/visuals/route.ts`).
**Warning signs:** Des tissus desactives apparaissent dans les donnees malgre le filtre.

### Pitfall 2: Hooks React declares apres un return conditionnel dans ConfiguratorModal

**What goes wrong:** Ajouter un `useState` ou `useEffect` apres `if (!model) return null` (ligne 67 de ConfiguratorModal.tsx) viole les regles des hooks React et casse le composant.
**Why it happens:** L'ordre des hooks doit etre stable entre les rendus — un return conditionnel avant un hook interrompt cet ordre.
**How to avoid:** Declarer tous les hooks en haut du composant, avant tout return conditionnel. Le commentaire `// IMPORTANT : return null APRES tous les hooks` est deja present dans le code.
**Warning signs:** Erreur React "Rendered more hooks than during the previous render".

### Pitfall 3: Typage insuffisant du resultat Supabase pour les jointures

**What goes wrong:** Supabase retourne les jointures avec le type `Json` si le type generique n'est pas precisement defini — on perd le typage des relations.
**Why it happens:** Le type generique `Database` ne contient pas les types enrichis avec relations.
**How to avoid:** Definir `VisualWithFabricAndImage` dans `database.ts` et l'utiliser comme type de sortie apres le filtrage JS. Caster les resultats Supabase vers ce type.
**Warning signs:** TypeScript montre `any` ou `Json` pour `visual.fabric` au lieu de `Fabric`.

### Pitfall 4: Props `fabrics` et `visuals` absentes mais composant compile

**What goes wrong:** ConfiguratorModal accepte les nouvelles props optionnelles (avec `?`) par facilite — Phase 8 recoit alors des `undefined` silencieusement.
**Why it happens:** TypeScript ne signale pas l'absence de props optionnelles.
**How to avoid:** Declarer `fabrics: Fabric[]` et `visuals: VisualWithFabricAndImage[]` comme props **obligatoires** (sans `?`). Phase 8 aura toujours ces donnees disponibles.
**Warning signs:** Le modal fonctionne en Phase 7 mais plante en Phase 8 avec `undefined.filter is not a function`.

### Pitfall 5: CatalogueClient — appel au modal sans forwarder les nouvelles props

**What goes wrong:** L'interface `CatalogueClientProps` est etendue mais l'appel `<ConfiguratorModal ... />` dans le JSX n'inclut pas `fabrics` et `visuals`.
**Why it happens:** TypeScript signale l'erreur uniquement si les props sont obligatoires dans ConfiguratorModal.
**How to avoid:** Ajouter simultanement les props a l'interface ET a l'appel JSX. Verifier avec `npx tsc --noEmit`.

---

## Code Examples

### Fetch complet dans CatalogueSection (pattern verifie)

```typescript
// Source: pattern de /api/models/[slug]/visuals/route.ts + decisions CONTEXT.md
import { createClient } from '@/lib/supabase/server'
import type { ModelWithImages, Fabric, VisualWithFabricAndImage } from '@/types/database'

export async function CatalogueSection() {
  const supabase = await createClient()

  const [modelsResult, fabricsResult, visualsResult] = await Promise.all([
    supabase
      .from('models')
      .select('*, model_images(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),

    supabase
      .from('fabrics')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }),

    supabase
      .from('generated_visuals')
      .select('*, fabric:fabrics(*), model_image:model_images(*)')
      .eq('is_validated', true)
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ])

  if (modelsResult.error || fabricsResult.error || visualsResult.error) {
    // ... return message d'erreur
  }

  const models: ModelWithImages[] = (modelsResult.data ?? []).map((model) => ({
    ...model,
    model_images: (model.model_images ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }))

  const fabrics: Fabric[] = fabricsResult.data ?? []

  // Filtrage JS obligatoire : PostgREST ne filtre pas les jointures (D-09)
  const visuals: VisualWithFabricAndImage[] = (visualsResult.data ?? []).filter(
    (v): v is VisualWithFabricAndImage =>
      v.fabric !== null && (v.fabric as Fabric).is_active === true
  )

  return <CatalogueClient models={models} fabrics={fabrics} visuals={visuals} />
}
```

### Type VisualWithFabricAndImage dans database.ts

```typescript
// Source: decisions D-06, pattern existant lignes 205-214 de database.ts
// Ajouter apres la ligne 214 (apres ModelWithImagesAndVisuals)
export type VisualWithFabricAndImage = GeneratedVisual & {
  fabric: Fabric
  model_image: ModelImage
}
```

### Interface ConfiguratorModalProps etendue

```typescript
// Source: decisions D-05 — props obligatoires (pas optionnelles)
interface ConfiguratorModalProps {
  model: ModelWithImages | null
  onClose: () => void
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
}
```

---

## State of the Art

| Ancienne approche | Approche actuelle | Impact |
|-------------------|-------------------|--------|
| Fetch par modele au clic (N+1 waterfall) | Promise.all global cote serveur | Zero latence a l'ouverture du modal |
| Fetch client avec useEffect | Server Component fetch | Pre-rendu serveur, pas de spinner |
| Type generique `any` pour jointures | Types enrichis dans database.ts | Typage strict bout-en-bout |

---

## Open Questions

1. **Gestion d'erreur partielle dans Promise.all**
   - Ce que l'on sait : Promise.all rejette si n'importe quelle promesse echoue
   - Ce qui est flou : doit-on degrader partiellement (modal sans tissus) ou bloquer totalement ?
   - Recommandation : Erreur totale (coherent avec pattern existant) — la degradation partielle est complexe a tester et peu probable en production (les 3 tables sont les memes Supabase)

2. **Sort order des tissus dans la query fabrics**
   - Ce que l'on sait : `.order('name', { ascending: true })` est raisonnable
   - Ce qui est flou : y a-t-il un champ `sort_order` prevu sur la table fabrics ?
   - Verification : `database.ts` montre que la table `fabrics` n'a pas de champ `sort_order` — order par `name` est correct

---

## Environment Availability

Step 2.6: SKIPPED — phase purement code/types, aucune dependance externe. Supabase deja configure, client deja installe.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (racine du projet) |
| Quick run command | `npx vitest run src/__tests__/CatalogueClient.test.tsx src/__tests__/ConfiguratorModal.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Comportement | Type de test | Commande automatisee | Fichier existant ? |
|--------|-------------|-------------|---------------------|-------------------|
| CONF-01 | fabrics[] present dans ConfiguratorModal props | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a etendre) |
| CONF-02 | fabrics[] transmis sans perte depuis CatalogueClient | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ (a etendre) |
| CONF-04 | visuals[] present dans ConfiguratorModal props | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a etendre) |
| CONF-05 | visuals[] accessible pour logique fallback | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a etendre) |
| CONF-07 | is_premium dans fabrics transmis | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ (a etendre) |
| CONF-08 | is_premium accessible dans modal | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a etendre) |
| CONF-09 | shopify_url deja dans ModelWithImages | unit | existant | ✅ |
| CONF-10 | shopify_url nullable gere | unit | existant | ✅ |
| D-09 | tissus inactifs filtres avant passage au modal | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Par commit de tache :** `npx vitest run src/__tests__/CatalogueClient.test.tsx src/__tests__/ConfiguratorModal.test.tsx`
- **Par merge de wave :** `npx vitest run`
- **Phase gate :** Suite complete verte avant `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Cas de test "tissus inactifs filtres" dans `CatalogueClient.test.tsx` — couvre D-09
- [ ] Cas de test "ConfiguratorModal recoit fabrics et visuals en props" dans `ConfiguratorModal.test.tsx` — couvre D-04/D-05
- [ ] Cas de test "CatalogueClient forwarde fabrics et visuals au modal" dans `CatalogueClient.test.tsx` — couvre D-04

*Note : les fichiers de test existent deja — seuls des cas de test supplementaires sont requis, pas de nouveaux fichiers.*

---

## Project Constraints (from CLAUDE.md)

Directives extraites de `CLAUDE.md` que le planificateur doit verifier :

| Directive | Application Phase 7 |
|-----------|---------------------|
| TypeScript strict, aucun `any` | Types `VisualWithFabricAndImage`, `Fabric[]` explicites — pas de `any` dans les filtres |
| CSS Modules uniquement, pas de Tailwind | Phase 7 ne touche pas au CSS |
| Supabase client direct (pas de Prisma) | Confirme — `createClient()` server-side utilise |
| Messages d'erreur en français | Le message d'erreur existant est en francais — ne pas changer |
| Composants PascalCase, un fichier par composant | Aucun nouveau composant cree |
| Prix premium = prix de base + 80€ fixe | Non concerne par Phase 7 (logique Phase 8) |
| `proxy.ts` pour middleware (pas middleware.ts) | Non concerne par Phase 7 |

---

## Sources

### Primary (HIGH confidence)

- Code source `/api/models/[slug]/visuals/route.ts` — pattern filtre JS `is_active` sur jointure, confirme D-09
- Code source `CatalogueSection.tsx` — pattern Server Component + Supabase direct, confirme D-03
- Code source `database.ts` lignes 204-214 — pattern types enrichis existants, confirme D-06
- `npm view @supabase/supabase-js version` = 2.100.1 (verifie en direct)
- `npm view @supabase/ssr version` = 0.9.0 (verifie en direct)

### Secondary (MEDIUM confidence)

- `.planning/phases/07-fetch-donn-es-c-blage-props/07-CONTEXT.md` — decisions D-01 a D-09
- `.planning/STATE.md` — notes sur hooks avant guard return, filtre is_active

### Tertiary (LOW confidence)

- Aucun — toutes les claims sont supportees par le code existant ou les decisions lockes.

---

## Metadata

**Confidence breakdown:**
- Standard stack : HIGH — versions verifiees via npm, code existant confirme les patterns
- Architecture : HIGH — patterns directement lisibles dans le code existant du projet
- Pitfalls : HIGH — pitfall PostgREST confirme par code existant, pitfall hooks documente dans STATE.md

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stack stable, Next.js 16 + Supabase 2.x)
