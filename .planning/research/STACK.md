# Stack Research — v11.0 Intégration IA Réelle + Tests

**Domain:** Remplacement mock IA + infrastructure de tests complète (unit / E2E)
**Milestone:** M011 — IA-REAL-01, IA-REAL-02, TEST-01, TEST-02
**Researched:** 2026-04-08
**Confidence:** MEDIUM-HIGH (SDK Google officiel vérifié via docs officielles ; versions npm vérifiées via recherche ; tests infrastructure déjà partiellement en place)

---

## Verdict principal

**Deux nouvelles dépendances npm requises uniquement :**

| Ajout | Pourquoi |
|-------|----------|
| `@google/genai` ^1.48.0 | SDK officiel Google pour Nano Banana 2 (gemini-3.1-flash-image-preview) |
| `@playwright/test` ^1.59.1 | Tests E2E — non encore installé dans le projet |

Tout le reste (Vitest, @testing-library/react, happy-dom) est **déjà installé** et opérationnel (6 fichiers de tests existants, vitest.config.ts configuré).

---

## Recommended Stack

### Core Technologies — Nano Banana 2

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@google/genai` | ^1.48.0 | SDK officiel Google Gen AI — accès à `gemini-3.1-flash-image-preview` | Seul SDK officiel supportant Nano Banana 2. Remplace l'ancien `@google/generative-ai`. API unifiée Gemini Developer API + Vertex AI. Publié activement (version 1.48.0 il y a 7 jours au moment de la recherche). |
| `gemini-3.1-flash-image-preview` | model string | Nano Banana 2 — génération image text-to-image + image editing | Modèle exact pour Nano Banana 2. Flash = optimisé vitesse/coût (~$0.045/image à 1K). Qualité proche de Pro. Supporte input image (editing/simulation salon). |

### Supporting Libraries — Tests (déjà installées)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | ^3.2.4 (installé) | Framework tests unitaires + intégration | Tous les tests non-E2E (composants, hooks, utils, API routes) |
| `@testing-library/react` | ^16.3.2 (installé) | Rendu composants React en tests | Tests composants UI (CatalogueClient, ConfiguratorModal, ProductCard) |
| `@testing-library/jest-dom` | ^6.9.1 (installé) | Matchers DOM enrichis (toBeInTheDocument, etc.) | Import dans setup.ts — déjà configuré |
| `@testing-library/user-event` | ^14.6.1 (installé) | Simulation interactions utilisateur réalistes | Clics, saisies, navigation clavier dans les tests composants |
| `happy-dom` | ^20.8.8 (installé) | Environnement DOM léger pour Vitest | Configuré dans vitest.config.ts (`environment: 'happy-dom'`) |
| `@vitejs/plugin-react` | ^4.7.0 (installé) | Plugin React pour Vitest | Configuré dans vitest.config.ts |

### Development Tools — Tests E2E (à installer)

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| `@playwright/test` | ^1.59.1 | Tests E2E cross-browser (Chromium, Firefox, WebKit) | À ajouter en devDependency. Playwright 1.59.1 est la version courante (avril 2026). |

---

## Integration avec le factory pattern existant

Le factory pattern dans `src/lib/ai/index.ts` est déjà conçu pour l'intégration :

```typescript
// src/lib/ai/index.ts — AUCUNE MODIFICATION REQUISE
export function getIAService(): IAService {
  if (process.env.NANO_BANANA_API_KEY) {
    return new NanoBananaService()  // ← remplacer le stub par l'implémentation réelle
  }
  return new MockIAService()        // ← conservé intact pour le dev sans clé
}
```

Seul `src/lib/ai/nano-banana.ts` est à réécrire. Le contrat `IAService` (types.ts) reste inchangé.

### Pattern d'appel SDK pour `generate()`

```typescript
// src/lib/ai/nano-banana.ts — implémentation réelle
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.NANO_BANANA_API_KEY })

// text-to-image (back-office : génération rendu tissu × angle)
const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-image-preview',
  contents: prompt,
  config: { responseModalities: ['TEXT', 'IMAGE'] },
})

// image editing avec source image (simulation salon)
const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-image-preview',
  contents: [
    { text: prompt },
    { inlineData: { mimeType: 'image/jpeg', data: base64ImageString } },
  ],
  config: { responseModalities: ['TEXT', 'IMAGE'] },
})

// Extraction du buffer image depuis la réponse
for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    const buffer = Buffer.from(part.inlineData.data, 'base64')
    // → retourner { imageBuffer: buffer, mimeType: 'image/png', extension: 'png' }
  }
}
```

Note : Nano Banana 2 retourne du PNG par défaut. Le mock retourne du JPEG. Adapter `NanoBananaService.generate()` pour retourner `mimeType: 'image/png'` et `extension: 'png'`. La route admin et simulate acceptent les deux formats (elles ne hardcodent pas l'extension).

### Pattern addWatermark avec le vrai SDK

`addWatermark()` ne nécessite PAS le SDK Gemini. Sharp est déjà installé et gère parfaitement la composition SVG. L'implémentation mock peut être réutilisée telle quelle dans `NanoBananaService` :

```typescript
// Réutiliser directement l'implémentation de MockIAService
async addWatermark(imageBuffer: Buffer, text = 'MÖBEL UNIQUE — Aperçu'): Promise<Buffer> {
  // ... même code Sharp que mock.ts
}
```

---

## Infrastructure tests existante

Le projet a déjà une infrastructure Vitest fonctionnelle. État actuel :

| Fichier de test | Couvre |
|-----------------|--------|
| `simulate-route.test.ts` | POST /api/simulate (6 cas dont HEIC) |
| `CatalogueClient.test.tsx` | Composant liste + recherche |
| `ConfiguratorModal.test.tsx` | Ouverture/fermeture modal |
| `ProductCard.test.tsx` | Rendu carte produit |
| `ProductCardSkeleton.test.tsx` | Rendu skeleton |
| `isActiveFilter.test.ts` | Utilitaire filtre |
| `nextconfig.test.ts` | Config Next.js |

Pour TEST-01 : étendre avec tests pour `NanoBananaService`, `MockIAService`, utils (`slugify`, `calculatePrice`), et les nouvelles routes admin.

Pour TEST-02 : ajouter Playwright pour les parcours E2E (catalogue → configurateur → simulation).

---

## Installation

```bash
# Nouvelle dépendance runtime
npm install @google/genai

# Nouvelle dépendance dev (E2E)
npm install -D @playwright/test

# Installer les browsers Playwright (une seule fois)
npx playwright install --with-deps chromium
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@google/genai` ^1.48.0 | `@google/generative-ai` (ancienne version) | Jamais — `@google/generative-ai` est l'ancien SDK, remplacé officiellement par `@google/genai`. Ne supporte pas les nouveaux modèles Gemini 3.x. |
| `@google/genai` direct | Vercel AI SDK (`ai` package) + Google provider | Si le projet devait supporter plusieurs providers IA (OpenAI, Anthropic, Google) dans une interface unifiée. Ici, le factory pattern maison remplit ce rôle. Ajouter Vercel AI SDK serait une sur-ingénierie. |
| `@playwright/test` pour E2E | Cypress | Playwright est plus léger, supporte les 3 engines, s'intègre mieux avec Next.js App Router (test du build de production). Cypress ne supporte pas nativement les Server Components. |
| `@playwright/test` pour E2E | Continuer avec les scripts `verify-e2e-m005.ts` | Les scripts existants (`scripts/verify-e2e-m005.ts`) sont des vérifications d'API via fetch, pas de vrais tests E2E browser. Playwright couvre le vrai parcours utilisateur. |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@google/generative-ai` | Ancien SDK Google (v1.x), déprécié au profit de `@google/genai`. Installe une version sans support Nano Banana 2. | `@google/genai` ^1.48.0 |
| Jest | Vitest est déjà installé, configuré, avec 7 fichiers de tests existants. Migrer vers Jest serait une régression (moins performant, pas de support ESM natif). | Vitest ^3.2.4 (déjà installé) |
| MSW (Mock Service Worker) | Utile pour mocker des requêtes HTTP sortantes dans les tests. Ici les mocks sont faits via `vi.mock()` au niveau module — pattern établi dans `simulate-route.test.ts`. MSW ajoute une couche sans bénéfice net. | `vi.mock('@/lib/ai')` + `vi.mock('@/lib/supabase/server')` |
| `nock` | Alternative à MSW pour Node, même raisonnement. Le pattern `vi.mock()` est plus idiomatique avec Vitest. | `vi.mock()` |
| Storybook | Pas de composant design system à documenter. Le projet est une SPA métier, pas une librairie de composants. | Tests `@testing-library/react` (déjà en place) |

---

## Stack Patterns by Variant

**Si NANO_BANANA_API_KEY n'est pas définie (développement local) :**
- `getIAService()` retourne `MockIAService` (Sharp) — comportement inchangé
- Aucune dépendance `@google/genai` chargée au runtime

**Si la génération Nano Banana 2 retourne une erreur de quota (429) :**
- `NanoBananaService.generate()` doit propager l'erreur avec un message explicite en français
- La route admin catch et retourne un 503 avec message utilisateur
- Ne pas retomber silencieusement sur le mock (comportement trompeur)

**Pour les tests Playwright (TEST-02) :**
- Toujours tester contre le build de production (`next build && next start`)
- Mocker `NANO_BANANA_API_KEY` absent en CI → MockIAService actif → tests déterministes
- Sauvegarder le state d'auth admin une fois, réutiliser via `storageState` Playwright

**Si Nano Banana 2 est en preview et que le modèle string change :**
- Le nom exact `gemini-3.1-flash-image-preview` est en preview au moment de la recherche
- Isoler le model string dans une constante dans `nano-banana.ts` pour faciliter la mise à jour

---

## Version Compatibility

| Package | Version | Compatible Avec | Notes |
|---------|---------|-----------------|-------|
| `@google/genai` ^1.48.0 | Node 22 (.nvmrc) | Node ≥18 requis | Compatible Node 22. API key via env var ou constructeur. TypeScript types inclus. |
| `@playwright/test` ^1.59.1 | Next.js 16.2.1 | Node ≥18 | Testé contre build de prod `next start`. `playwright.config.ts` à créer. |
| `vitest` ^3.2.4 | `@testing-library/react` ^16.3.2 | React 19.2.4 | Déjà validé — 7 fichiers de tests passent. |
| `@google/genai` ^1.48.0 | TypeScript strict | ^5 | SDK distribué avec types `.d.ts`, compatible strict mode. |

---

## Sources

- [Google AI — Nano Banana image generation (officiel)](https://ai.google.dev/gemini-api/docs/image-generation) — model string `gemini-3.1-flash-image-preview` vérifié, API `generateContent` avec `responseModalities`, extraction `part.inlineData.data` base64 (HIGH confidence)
- [npmjs @google/genai](https://www.npmjs.com/package/@google/genai) — version 1.48.0 courante confirmée (MEDIUM confidence — accès 403 au NPM registry, version citée par plusieurs sources concordantes)
- [Playwright installation](https://playwright.dev/docs/intro) — version 1.59.1 confirmée (MEDIUM confidence — sources multiples concordantes)
- [Next.js testing guides](https://nextjs.org/docs/app/guides/testing) — recommandations Vitest + Playwright pour App Router (MEDIUM confidence)
- Package.json projet — versions installées (Vitest 3.2.4, @testing-library/react 16.3.2, happy-dom 20.8.8) vérifiées directement (HIGH confidence)
- `src/lib/ai/` — factory pattern, types, mock, stub nano-banana lus directement (HIGH confidence)
- `src/__tests__/` — infrastructure tests existante (7 fichiers) lue directement (HIGH confidence)

---

*Stack research pour : Intégration IA Réelle + Tests v11.0 (M011)*
*Recherche : 2026-04-08*
