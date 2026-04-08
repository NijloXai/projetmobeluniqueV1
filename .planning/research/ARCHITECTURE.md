# Architecture Research

**Domain:** Nano Banana 2 (Gemini) integration + testing infrastructure — Next.js 16 App Router
**Researched:** 2026-04-08
**Confidence:** HIGH (code source analysé directement, interface existante vérifiée)

---

## Context: Ce qui existe déjà

Le factory pattern IA est en place et fonctionnel :

- `src/lib/ai/types.ts` — interface `IAService` avec `generate()` + `addWatermark()`
- `src/lib/ai/index.ts` — factory `getIAService()` : `NANO_BANANA_API_KEY` set → `NanoBananaService`, sinon → `MockIAService`
- `src/lib/ai/mock.ts` — `MockIAService` complet (sharp SVG, deterministe)
- `src/lib/ai/nano-banana.ts` — `NanoBananaService` **stub** : deux méthodes lancent `Error('Service Nano Banana 2 non configuré')`
- `src/lib/ai/prompts.ts` — `buildBackOfficePrompt()` + `buildSimulatePrompt()`
- Trois routes consommatrices : `/api/admin/generate`, `/api/admin/generate-all`, `/api/simulate`
- Infrastructure test : Vitest 3.x + `@testing-library/react` + `happy-dom`, 10 fichiers `.test.ts(x)` existants

**Ce que v11.0 change :** uniquement `src/lib/ai/nano-banana.ts` — le reste du système est inchangé.

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  ConfiguratorModal (Client Component)                          │  │
│  │  state machine: idle → preview → generating → done → error     │  │
│  │  POST /api/simulate (FormData: image + model_id + fabric_id?)  │  │
│  └───────────────────────────┬────────────────────────────────────┘  │
└──────────────────────────────│───────────────────────────────────────┘
                               │ HTTP (FormData)
┌──────────────────────────────│───────────────────────────────────────┐
│                        NEXT.JS API LAYER                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ POST /api/admin/ │  │ POST /api/admin/ │  │  POST /api/       │  │
│  │ generate         │  │ generate-all     │  │  simulate         │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────────┘  │
│           └────────────────┬────┘                      │             │
│                            ↓                           ↓             │
│                   getIAService()              getIAService()         │
│                   (factory — inchangé)        (factory — inchangé)  │
└────────────────────────────┬───────────────────────────┬─────────────┘
                             │                           │
┌────────────────────────────│───────────────────────────│─────────────┐
│                       AI SERVICE LAYER                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  IAService (interface — types.ts — INCHANGÉ)                 │   │
│  │  generate(GenerateRequest): Promise<GenerateResult>          │   │
│  │  addWatermark(Buffer, text?): Promise<Buffer>                 │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │ implements                           │
│          ┌────────────────────┴──────────────────┐                  │
│  ┌───────────────────┐             ┌──────────────────────────────┐  │
│  │  MockIAService    │             │  NanoBananaService           │  │
│  │  (sharp SVG)      │             │  REMPLACE le stub            │  │
│  │  INCHANGÉ         │             │  @google/genai               │  │
│  │  pas d'API key    │             │  gemini-3.1-flash-image-prev │  │
│  └───────────────────┘             └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────  ┘
```

---

## Component Responsibilities

| Composant | Responsabilité | Statut v11.0 |
|-----------|----------------|--------------|
| `getIAService()` factory | Sélectionne le provider selon `NANO_BANANA_API_KEY` | INCHANGÉ |
| `NanoBananaService` | Génération via Gemini 3.1 Flash Image | REMPLACE le stub |
| `MockIAService` | Placeholder deterministe (sharp SVG) | INCHANGÉ |
| `IAService` interface | Contrat `generate()` + `addWatermark()` | INCHANGÉ |
| `buildBackOfficePrompt` | Prompt texte-to-image pour admin | INCHANGÉ |
| `buildSimulatePrompt` | Prompt image-to-image pour simulation salon | INCHANGÉ (revision possible) |
| POST `/api/admin/generate` | Génération single angle, upsert Storage + DB | INCHANGÉ |
| POST `/api/admin/generate-all` | Génération tous angles, boucle séquentielle | INCHANGÉ |
| POST `/api/simulate` | Simulation publique avec watermark, éphémère | INCHANGÉ |

---

## Recommended Project Structure

```
src/
├── lib/
│   └── ai/
│       ├── types.ts            # INCHANGÉ — interface IAService
│       ├── index.ts            # INCHANGÉ — factory getIAService()
│       ├── mock.ts             # INCHANGÉ — MockIAService (sharp)
│       ├── nano-banana.ts      # MODIFIÉ — remplace stub par impl réelle Gemini
│       └── prompts.ts          # INCHANGÉ (reviser buildSimulatePrompt si prompt tuning nécessaire)
│
├── app/api/
│   ├── admin/generate/route.ts       # INCHANGÉ
│   ├── admin/generate-all/route.ts   # INCHANGÉ
│   └── simulate/route.ts             # INCHANGÉ
│
├── __tests__/                        # Flat — tests intégration routes + utils
│   ├── setup.ts                      # INCHANGÉ — happy-dom + HTMLDialogElement mocks
│   ├── simulate-route.test.ts        # INCHANGÉ — 7 tests existants
│   ├── CatalogueClient.test.tsx      # INCHANGÉ — existant
│   ├── ConfiguratorModal.test.tsx    # INCHANGÉ — existant
│   ├── ProductCard.test.tsx          # INCHANGÉ — existant
│   ├── ProductCardSkeleton.test.tsx  # INCHANGÉ — existant
│   ├── isActiveFilter.test.ts        # INCHANGÉ — existant
│   ├── nextconfig.test.ts            # INCHANGÉ — existant
│   ├── nano-banana.test.ts           # NOUVEAU — tests unitaires NanoBananaService
│   └── generate-route.test.ts        # NOUVEAU — tests intégration /api/admin/generate
│
├── components/public/
│   └── (tous inchangés)
│
└── (à la racine du projet)
    ├── vitest.config.ts              # INCHANGÉ — happy-dom, include src/**/*.test.*
    ├── playwright.config.ts          # NOUVEAU — E2E Playwright
    └── e2e/                          # NOUVEAU — dossier séparé de src/ pour Playwright
        ├── catalogue.spec.ts         # Parcours catalogue : chargement, search
        ├── configurateur.spec.ts     # Ouvrir modal, sélectionner tissu, voir rendu
        └── simulation.spec.ts        # Upload photo, générer (mock), télécharger
```

### Rationale

- **`nano-banana.ts` seul modifié** : la force de ce design est que tous les consommateurs (3 routes) restent inchangés. Le factory pattern absorbe le changement de provider.
- **`e2e/` hors `src/`** : Vitest est configuré avec `include: ['src/**/*.test.{ts,tsx}']` — les fichiers `.spec.ts` dans `e2e/` ne sont jamais ramassés par Vitest. Playwright a son propre runner. Zéro collision.
- **Pattern flat `src/__tests__/`** : convention déjà établie pour les tests de routes et utils. Les tests de composants (Header, Hero, HowItWorks) co-localisent dans `__tests__/` au niveau du composant — les deux patterns coexistent déjà dans le projet.

---

## Architectural Patterns

### Pattern 1 : Strategy via Factory — Aucun changement de contrat

**What:** `getIAService()` lit `process.env.NANO_BANANA_API_KEY` et retourne l'implémentation correcte. Les trois routes appelant `getIAService().generate()` sont aveugles au provider réel.

**When to use:** Déjà en place. Zéro modification dans les routes.

**Trade-offs:** Simple pour deux providers. Si un troisième provider est nécessaire (Vertex AI, Replicate), la factory nécessite un `else if` supplémentaire — acceptable à cette échelle.

**Point d'intégration clé:** Seules deux méthodes de `NanoBananaService` sont à implémenter pour v11.0.

### Pattern 2 : NanoBananaService — Deux formes d'appel selon le contexte

**What:** Gemini 3.1 Flash Image (`@google/genai`, modèle `gemini-3.1-flash-image-preview`) traite deux cas distincts identifiés par le format de `sourceImageUrl` dans `GenerateRequest`.

**Cas admin (IA-REAL-01):** `sourceImageUrl` est une URL Supabase Storage publique (`https://...supabase.co/...`). L'image est la photo d'angle du canapé. Le modèle génère un rendu tissu à partir de l'image source.

```typescript
// sourceImageUrl = URL publique → fetch + base64
const imageResp = await fetch(request.sourceImageUrl)
const imageBase64 = Buffer.from(await imageResp.arrayBuffer()).toString('base64')

const response = await this.ai.models.generateContent({
  model: 'gemini-3.1-flash-image-preview',
  contents: [
    { text: buildBackOfficePrompt(request.modelName, request.fabricName, request.viewType) },
    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
  ],
})
```

**Cas simulation (IA-REAL-02):** `sourceImageUrl` est déjà une data URI `data:image/jpeg;base64,...` (construite dans `/api/simulate` à partir de `image.arrayBuffer()`). Pas de fetch réseau nécessaire.

```typescript
// sourceImageUrl = data URI → split direct
const [header, base64] = request.sourceImageUrl.split(',')
const mimeType = header.split(':')[1].split(';')[0] // 'image/jpeg' ou 'image/png'

const response = await this.ai.models.generateContent({
  model: 'gemini-3.1-flash-image-preview',
  contents: [
    { text: buildSimulatePrompt(request.modelName, request.fabricName) },
    { inlineData: { mimeType, data: base64 } },
  ],
})
```

**Extraction du buffer (identique pour les deux cas):**

```typescript
for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    // Gemini retourne du PNG par défaut — convertir en JPEG pour maintenir
    // la cohérence des chemins Storage (extension 'jpg' partout)
    const rawBuffer = Buffer.from(part.inlineData.data, 'base64')
    const jpegBuffer = await sharp(rawBuffer).jpeg({ quality: 90 }).toBuffer()
    return { imageBuffer: jpegBuffer, mimeType: 'image/jpeg', extension: 'jpg' }
  }
}
throw new Error('Aucune image générée par le service IA. Réessayez.')
```

**Trade-offs:** La détection `startsWith('data:')` vs URL HTTPS est simple et couvre les deux cas actuels. La conversion PNG→JPEG via sharp garantit que l'extension `jpg` reste cohérente avec les chemins Storage existants, évitant des fichiers orphelins lors des upserts.

### Pattern 3 : addWatermark Partagé via Sharp

**What:** `MockIAService.addWatermark()` utilise sharp pour composer un SVG de filigrane. `NanoBananaService.addWatermark()` doit faire la même chose — sharp est déjà une dépendance projet.

**Recommended:** Extraire la logique de filigrane dans `src/lib/ai/watermark.ts`, importée par les deux providers. Évite la duplication et simplifie les tests de chaque provider.

**Alternative rejetée:** Demander à Gemini d'ajouter un filigrane via prompt — non-déterministe, gaspille des tokens API, rendu texte non contrôlé.

### Pattern 4 : Tests Unitaires NanoBananaService — Mock @google/genai

**What:** Les tests de `NanoBananaService` doivent mocker `@google/genai` entièrement. Le vrai API ne doit jamais être appelé en test.

**Pattern déjà établi dans le projet** (`simulate-route.test.ts`) :

```typescript
// nano-banana.test.ts
const mockGenerateContent = vi.fn()
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}))

// Dans le test :
mockGenerateContent.mockResolvedValueOnce({
  candidates: [{
    content: {
      parts: [{ inlineData: { data: Buffer.from('fake-png').toString('base64') } }]
    }
  }]
})
```

**When to use:** Tous les tests de `NanoBananaService`. Jamais d'appels réseau réels en Vitest.

### Pattern 5 : E2E Playwright avec Serveur Mock

**What:** Les tests E2E Playwright tournent contre le serveur de dev (ou build) avec le mock provider (`MockIAService` via absence de `NANO_BANANA_API_KEY`). Aucune clé Gemini n'est nécessaire en CI.

**Configuration minimale:**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
})
```

**Trade-offs:** Les tests E2E avec mock valident le parcours UI, pas la qualité des rendus Gemini. La validation de l'IA réelle est manuelle (l'admin génère + valide dans l'interface). C'est un choix délibéré — les tests E2E testent le comportement utilisateur, pas la qualité d'un service externe.

---

## Data Flow

### Flux génération admin (IA-REAL-01)

```
Admin UI
  → POST /api/admin/generate { model_id, model_image_id, fabric_id }
  → requireAdmin() [auth JWT]
  → supabase queries : model.name + model_image.image_url + fabric.name
  → upsert : supprime ancien fichier Storage + ligne DB si existant
  → getIAService()
     → NANO_BANANA_API_KEY set → NanoBananaService.generate({
         modelName, fabricName, viewType,
         sourceImageUrl: "https://...supabase.co/storage/..." ← URL publique
       })
       → fetch(sourceImageUrl) → base64
       → GoogleGenAI.models.generateContent([textPrompt, inlineData])
       → candidates[0].content.parts → part.inlineData.data
       → Buffer.from(base64) → sharp().jpeg() → { imageBuffer, 'jpg' }
  → supabase.storage.upload(imageBuffer, 'generated-visuals')
  → supabase.from('generated_visuals').insert({ is_validated: false, is_published: false })
  → JSON 201 { id, generated_image_url, ... }
```

### Flux simulation publique (IA-REAL-02)

```
ConfiguratorModal
  → POST /api/simulate FormData { image: File, model_id, fabric_id? }
  → validation taille (15 Mo max), model_id requis
  → supabase : model.name, fabric.name (si fabric_id fourni)
  → image.arrayBuffer() → base64 → data URI "data:image/jpeg;base64,..."
  → getIAService()
     → NANO_BANANA_API_KEY set → NanoBananaService.generate({
         modelName, fabricName: 'tissu original' | fabric.name,
         viewType: 'simulation',
         sourceImageUrl: "data:image/jpeg;base64,..."  ← data URI, pas de fetch
       })
       → split data URI → base64 + mimeType
       → GoogleGenAI.models.generateContent([textPrompt, inlineData])
       → Buffer.from(base64) → sharp().jpeg()
  → NanoBananaService.addWatermark(buffer, 'MÖBEL UNIQUE — Aperçu')
  → NextResponse(Uint8Array, { Content-Type: 'image/jpeg', Cache-Control: 'no-store' })
```

### Flux tests Vitest

```
npm run test (vitest run)
  → src/__tests__/setup.ts : happy-dom, HTMLDialogElement mocks
  → Tests existants (10 fichiers) — INCHANGÉS
  → nano-banana.test.ts :
      vi.mock('@google/genai') → test generate() avec URL publique
      vi.mock('@google/genai') → test generate() avec data URI
      vi.mock('@google/genai') → test addWatermark()
      vi.mock('@google/genai') → test erreur si candidates vide
      vi.mock('@google/genai') → test retry sur 429 (si implémenté)
  → generate-route.test.ts :
      vi.mock('@/lib/ai') → test upsert (existing visual cleanup)
      vi.mock('@/lib/supabase/admin') → test auth 401
      vi.mock('@/lib/ai') → test 404 modèle introuvable
```

### Flux tests E2E Playwright

```
npx playwright test
  → webServer démarre Next.js (localhost:3000, sans NANO_BANANA_API_KEY → mock)
  → catalogue.spec.ts : page d'accueil → cartes produits → barre recherche
  → configurateur.spec.ts : clic "Configurer" → modal → swatch → rendu mock
  → simulation.spec.ts : étape simulation → upload JPEG → génération mock → download
```

---

## Integration Points : Nouveau vs Modifié vs Inchangé

### Fichier MODIFIÉ — seul changement côté IA

| Fichier | Modification | Détail |
|---------|-------------|--------|
| `src/lib/ai/nano-banana.ts` | Remplacer le stub par l'implémentation Gemini | Deux méthodes : `generate()` + `addWatermark()` |

### Fichiers CRÉÉS

| Fichier | Type | Rôle |
|---------|------|------|
| `src/__tests__/nano-banana.test.ts` | Vitest unit test | Tests NanoBananaService avec `@google/genai` mocké |
| `src/__tests__/generate-route.test.ts` | Vitest integration test | Tests `/api/admin/generate` : auth, upsert, 404 |
| `playwright.config.ts` | Config Playwright | À la racine du projet |
| `e2e/catalogue.spec.ts` | Playwright E2E | Parcours catalogue |
| `e2e/configurateur.spec.ts` | Playwright E2E | Parcours configurateur tissu |
| `e2e/simulation.spec.ts` | Playwright E2E | Parcours simulation salon |

### Fichiers INCHANGÉS

| Fichier | Raison |
|---------|--------|
| `src/lib/ai/types.ts` | Interface déjà correcte — couvre les deux use cases |
| `src/lib/ai/index.ts` | Factory correct — aucune modification nécessaire |
| `src/lib/ai/mock.ts` | Toujours utilisé sans API key |
| `src/lib/ai/prompts.ts` | Prompts corrects — tuning manuel possible post-intégration |
| `src/app/api/admin/generate/route.ts` | Appelle `getIAService()` — interface inchangée |
| `src/app/api/admin/generate-all/route.ts` | Idem |
| `src/app/api/simulate/route.ts` | Idem — `sourceImageUrl` déjà data URI |
| `vitest.config.ts` | Configuration correcte — pas de modification |
| `src/__tests__/setup.ts` | Setup suffisant — pas de modification |
| Tous les composants UI | Pas touchés par cette milestone |

---

## External Services

| Service | Intégration | Notes |
|---------|-------------|-------|
| Gemini API (`@google/genai`) | `new GoogleGenAI({ apiKey: process.env.NANO_BANANA_API_KEY })` | Instancier dans le constructeur `NanoBananaService` — une instance par service |
| Supabase Storage | INCHANGÉ — reçoit `GenerateResult.imageBuffer` (Buffer JPEG) | Chemin déterministe `{slug}/{fabric_id}-{model_image_id}.jpg` |
| Supabase DB | INCHANGÉ — insère l'URL publique retournée par Storage | Workflow validate → publish inchangé |

---

## Internal Boundaries

| Frontière | Communication | Notes |
|-----------|---------------|-------|
| Route → AI Service | `getIAService()` retourne `IAService` | Factory ne change jamais — point d'intégration clé |
| `NanoBananaService` → Gemini | `this.ai.models.generateContent()` | Gérer HTTP 429 (rate limit) avec retry exponentiel : 3 tentatives, 1s/2s/4s |
| `NanoBananaService` → sharp | Watermark + conversion PNG→JPEG | sharp est déjà en dépendance projet |
| Vitest → Routes | `vi.mock()` au niveau module + import dynamique après mock | Pattern établi dans `simulate-route.test.ts` |
| Playwright → Next.js | HTTP sur serveur dev local | `webServer` dans `playwright.config.ts` démarre le serveur automatiquement |

---

## Anti-Patterns

### Anti-Pattern 1 : Appels Gemini réels dans les tests unitaires

**What people do:** Importer `NanoBananaService` dans les tests Vitest sans mocker `@google/genai`.

**Why it's wrong:** Tests lents (2-5s par appel), flaky (dépendance réseau), coûteux en API credits, nécessitent `NANO_BANANA_API_KEY` en CI.

**Do this instead:** `vi.mock('@google/genai', () => ({ GoogleGenAI: vi.fn(() => ({ models: { generateContent: mockFn } })) }))` avant tout import. Le mock retourne une structure `candidates[0].content.parts[0].inlineData.data` contrôlée.

### Anti-Pattern 2 : Retourner PNG sans conversion dans GenerateResult

**What people do:** Retourner directement le PNG de Gemini dans `GenerateResult` avec `extension: 'png'`.

**Why it's wrong:** Les chemins Storage sont déjà `{slug}/{fabric_id}-{model_image_id}.jpg` dans tous les enregistrements existants. Un upsert générant un `.png` ne trouvera pas l'ancien `.jpg` lors de la suppression `extractStoragePath()`, créant des fichiers orphelins dans le bucket.

**Do this instead:** Convertir PNG→JPEG via `sharp(rawBuffer).jpeg({ quality: 90 }).toBuffer()` dans `NanoBananaService.generate()`. Retourner `{ extension: 'jpg', mimeType: 'image/jpeg' }` — identique au mock.

### Anti-Pattern 3 : Filigrane via prompt Gemini

**What people do:** Demander à Gemini d'ajouter "MÖBEL UNIQUE — Aperçu" en filigrane dans le prompt de `addWatermark()`.

**Why it's wrong:** Non-déterministe, gaspille tokens API, rendu texte variable selon la luminosité du fond, impossible de contrôler la police/position/opacité.

**Do this instead:** Utiliser sharp pour le SVG overlay — identique à `MockIAService.addWatermark()`. Extraire en utilitaire partagé si les deux classes dupliquent la logique.

### Anti-Pattern 4 : Deuxième config Vitest pour les tests de routes

**What people do:** Créer `vitest.node.config.ts` avec `environment: 'node'` pour les tests de routes API, séparé du `happy-dom` pour les composants.

**Why it's wrong:** `simulate-route.test.ts` prouve déjà que les tests de routes fonctionnent en `happy-dom` grâce aux mocks module-level. Une deuxième config ajoute de la complexité inutile.

**Do this instead:** Suivre le pattern existant — `vi.mock('@/lib/ai')` + `vi.mock('@/lib/supabase/admin')` + import dynamique de la route après les mocks.

### Anti-Pattern 5 : Tests E2E avec vraie clé Gemini

**What people do:** Configurer `NANO_BANANA_API_KEY` dans l'environnement Playwright pour tester le vrai provider.

**Why it's wrong:** Tests lents (5-15s par génération), coûteux, non-déterministes (le rendu IA varie), fragiles si l'API est en maintenance.

**Do this instead:** E2E avec le mock provider (sans clé API). Les tests valident le parcours UI : l'upload déclenche-t-il la génération ? Le spinner apparaît-il ? L'image résultante est-elle affichée ? Ces comportements sont indépendants de la qualité du rendu.

---

## Scaling Considerations

| Scale | Approche |
|-------|----------|
| Usage admin actuel (< 10 générations/jour) | Boucle séquentielle dans `generate-all` OK — pas de concurrence |
| Croissance admin (50+ générations/jour) | Ajouter retry exponentiel dans `NanoBananaService` pour absorber les 429 |
| `generate-all` avec > 5 angles × 3-5s/angle | Risque timeout 60s. Ajouter `export const maxDuration = 60` dans la route. Si insuffisant : Supabase Edge Functions en background job |
| Simulation publique (utilisateurs simultanés) | `/api/simulate` est stateless — Next.js gère la concurrence horizontalement. Aucun changement nécessaire |

### Scaling Priorities

1. **Premier bottleneck :** Rate limit Gemini API (HTTP 429). Implémenter retry avec back-off exponentiel dans `NanoBananaService.generate()` — 3 tentatives avec délais 1000ms / 2000ms / 4000ms. Lancer une erreur en français après épuisement.
2. **Deuxième bottleneck :** Timeout de `generate-all` pour les modèles avec 6+ angles. Ajouter `export const maxDuration = 60` immédiatement, documenter la migration vers background job si la latence Gemini dépasse 10s/image.

---

## Build Order pour v11.0

L'ordre minimise les dépendances bloquantes.

1. **`@google/genai` installation** — `npm install @google/genai`. Vérifier que la version supportée par Node 22 est disponible.

2. **`NanoBananaService.generate()`** — Implémenter les deux chemins (URL publique → fetch + data URI → split). Conversion PNG→JPEG via sharp incluse. [MODIFIE `src/lib/ai/nano-banana.ts`]

3. **`NanoBananaService.addWatermark()`** — Soit extraire la logique de `MockIAService`, soit l'écrire directement. Identique à MockIAService. [MODIFIE `src/lib/ai/nano-banana.ts`]

4. **`nano-banana.test.ts`** — Tests unitaires avec `@google/genai` mocké : `generate()` cas URL publique, cas data URI, cas candidates vide, cas erreur 429. [CRÉE `src/__tests__/nano-banana.test.ts`]

5. **`generate-route.test.ts`** — Tests intégration `/api/admin/generate` : auth 401, 404 modèle, upsert (cleanup ancien visuel), génération réussie. [CRÉE `src/__tests__/generate-route.test.ts`]

6. **Playwright install + config** — `npm install -D @playwright/test`, créer `playwright.config.ts`. [CRÉE `playwright.config.ts`]

7. **`e2e/catalogue.spec.ts`** — Parcours le plus simple : chargement page, cartes visibles, recherche. [CRÉE `e2e/catalogue.spec.ts`]

8. **`e2e/configurateur.spec.ts`** — Ouvrir modal, sélectionner tissu, vérifier rendu mock affiché. [CRÉE `e2e/configurateur.spec.ts`]

9. **`e2e/simulation.spec.ts`** — Upload photo, lancer simulation mock, vérifier état `done` + image résultat. [CRÉE `e2e/simulation.spec.ts`]

---

## Sources

- Code source analysé directement (HIGH confidence) :
  - `src/lib/ai/types.ts` — interface IAService
  - `src/lib/ai/index.ts` — factory getIAService
  - `src/lib/ai/nano-banana.ts` — stub actuel
  - `src/lib/ai/mock.ts` — MockIAService complet
  - `src/lib/ai/prompts.ts` — builders de prompts
  - `src/app/api/admin/generate/route.ts` — consommateur admin single
  - `src/app/api/admin/generate-all/route.ts` — consommateur admin bulk
  - `src/app/api/simulate/route.ts` — consommateur public
  - `src/__tests__/simulate-route.test.ts` — pattern de test établi
  - `vitest.config.ts` — configuration existante
- Gemini API image generation Node.js : https://ai.google.dev/gemini-api/docs/image-generation (MEDIUM — contenu vérifié via WebFetch)
- `@google/genai` npm : https://www.npmjs.com/package/@google/genai
- Next.js Vitest guide : https://nextjs.org/docs/app/guides/testing/vitest
- Next.js Playwright guide : https://nextjs.org/docs/pages/guides/testing/playwright

---

*Architecture research pour : v11.0 Nano Banana 2 + Tests — Möbel Unique*
*Researched: 2026-04-08*
