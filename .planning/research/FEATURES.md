# Feature Research

**Domain:** Intégration IA réelle (Nano Banana 2 / Gemini) + tests complets — Next.js 16 + Supabase
**Milestone:** v11.0 — IA Réelle + Audit Qualité
**Researched:** 2026-04-08
**Confidence:** HIGH (Gemini API docs officiels vérifiés), MEDIUM (patterns tests, plusieurs sources concordantes)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Fonctionnalités que le milestone ne peut pas livrer sans elles. Leur absence = le ticket est incomplet.

| Feature | Pourquoi attendu | Complexité | Notes |
|---------|-----------------|------------|-------|
| `NanoBananaService.generate()` fonctionnel | Le factory pattern existe et bascule déjà sur Nano Banana si `NANO_BANANA_API_KEY` est défini — mais l'implémentation actuelle lance une erreur stub. Avec une vraie clé, toute génération admin explose | MEDIUM | SDK `@google/genai`, modèle `gemini-3.1-flash-image-preview`, envoyer prompt + image source en base64 `inlineData`, extraire `candidates[0].content.parts` image retournée |
| `NanoBananaService.addWatermark()` fonctionnel | `/api/simulate` appelle toujours `addWatermark()` après `generate()` — le stub lance une erreur, cassant le flux client complet | LOW | Sharp déjà installé et utilisé par `MockIAService`; réutiliser le même pattern de composite SVG |
| Retry exponentiel sur 429 / 5xx | L'API Gemini image a des limites strictes (IPM, RPM, RPD); le tier payant atteint quand même des 429 sous charge. Sans retry, une erreur transitoire fait échouer la génération définitivement | MEDIUM | 3 tentatives, délais 1s/2s/4s + jitter; ne retenter que 429/500/503; exposer `503 Service temporairement indisponible` au caller après épuisement |
| Timeout par appel Gemini | La génération d'image peut prendre 15-30 s; sans timeout, la route Next.js se pend indéfiniment | LOW | 30 s via `AbortSignal.timeout(30_000)` passé au SDK ou `Promise.race` avec un reject temporisé |
| Messages d'erreur en français | Toute la codebase utilise des messages d'erreur français — la cohérence est requise | LOW | Mapper les erreurs du SDK Gemini vers le vocabulaire projet (`"Génération IA impossible"`, `"Service temporairement indisponible"`, `"Format d'image non supporté"`) |
| Tests Vitest pour `NanoBananaService` | Le pattern de mock est établi dans `simulate-route.test.ts`; le service IA doit avoir ses propres tests unitaires | MEDIUM | Couvrir: happy path retourne `GenerateResult`, 429 déclenche retry puis succès, erreur permanente rejette, watermark composite fonctionne |
| Tests Vitest pour les fonctions utilitaires | `slugify`, `calculatePrice`, `extractStoragePath`, `buildBackOfficePrompt`, `buildSimulatePrompt` — fonctions pures, coût de test quasi nul | LOW | Aucun mock nécessaire; test des cas limites (accents, caractères spéciaux, slugs vides) |
| Tests Vitest pour les routes admin generate | Les routes `/api/admin/generate` et `/api/admin/generate-all` appellent `getIAService().generate()` — elles doivent gérer gracieusement les erreurs IA (propagation 500, cas success) | MEDIUM | Même pattern que `simulate-route.test.ts` : `vi.mock('@/lib/ai', ...)` puis import dynamique de la route |

### Differentiators (Competitive Advantage)

Features qui améliorent significativement la qualité ou la confiance sans être strictement bloquantes.

| Feature | Valeur ajoutée | Complexité | Notes |
|---------|---------------|------------|-------|
| Image source passée à Gemini pour `/api/simulate` | La photo du salon de l'utilisateur alimente le prompt inpainting — Gemini utilise le contexte de la pièce pour un placement réaliste vs. génération pure texte | MEDIUM | Convertir le `Buffer` uploadé → base64, passer en `inlineData` avec `buildSimulatePrompt`; Gemini 3.1 supporte nativement text+image→image |
| Photo du modèle passée comme contexte en back-office | Envoyer la vraie photo de l'angle canapé donne à Gemini une forme de référence concrète vs. le nom seul — meilleure fidélité de sortie | MEDIUM | `sourceImageUrl` déjà dans `GenerateRequest`; fetch URL → base64 avant d'appeler Gemini; fallback vers prompt seul si le fetch échoue |
| Logging structuré des erreurs Gemini | Capturer modèle, hash prompt, code erreur, latence en logs serveur — permet le debugging sans exposer de données sensibles côté client | LOW | `console.error('[NanaBanana]', { model, errorCode, latencyMs })` dans le catch; aucun changement côté utilisateur |
| Tests Playwright E2E — flux simulation | Valide le flux public complet (idle → generating → done) avec le mock provider — détecte les régressions dans le câblage UI sans coût IA | HIGH | `page.route('/api/simulate', ...)` pour intercepter et retourner un JPEG fixture; valider les états de la state machine UI |
| Tests Playwright E2E — flux admin generate + publish | Valide le flux admin le plus complexe : sélection modèle + tissu → generate → validate → publish; confirme les transitions de statut dans l'UI | HIGH | Mocker `/api/admin/generate` pour retourner une fixture; asserter les changements de statut des cards visuels |
| Tests Vitest pour `requireAdmin()` | Vérifie le contrat d'authentification : 401 sans session valide, 200 avec session valide — régression critique si auth casse | LOW | `vi.mock('@/lib/supabase/server', ...)` pour contrôler la session; test de chaque route admin protégée |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Pourquoi demandé | Pourquoi problématique | Alternative |
|---------|-----------------|----------------------|-------------|
| Streaming SSE pour la progression de la génération | "Montrer une barre de progression" — donne l'impression d'être plus réactif | L'API Gemini image retourne une image complète en une seule réponse — il n'y a pas de tokens partiels à streamer. SSE ajoute une infrastructure (EventSource, keep-alive) pour zéro bénéfice réel ici | Conserver le pattern actuel: POST attend la réponse; afficher un spinner CSS pendant `status === 'generating'` — déjà implémenté en Phase 11 |
| Cache Redis/mémoire des images générées | "Économiser les coûts API" | L'admin génère à la demande (le contenu change); la simulation client est unique par utilisateur (chaque photo de salon diffère). Le taux de hit cache est proche de zéro. Ajoute une dépendance Redis | Utiliser Supabase Storage comme couche de persistance — c'est le workflow conçu; la régénération via UI admin est intentionnelle |
| Statut de génération en temps réel via polling | "Savoir quand c'est terminé sans attendre" | Toute génération est synchrone dans les routes actuelles (admin attend la réponse); ajouter des jobs asynchrones nécessite une queue (Bull, Inngest) bien au-delà du scope | La route attend la génération et retourne le résultat; le timeout 30 s protège contre les blocages |
| Tests par snapshot des images générées | "S'assurer que le visuel est correct" | La sortie IA est non-déterministe par nature; les snapshots pixel-level seront flaky par définition | Mocker le service IA dans les tests; asserter le statut HTTP, le header `Content-Type`, et le buffer non-vide — pas le contenu pixel |
| Multi-providers avec UI de sélection | "Supporter aussi OpenAI DALL-E" | Le factory pattern est déjà l'abstraction — ajouter des providers est une préoccupation future; une UI de sélection n'a aucune valeur pour l'utilisateur maintenant | La variable d'env `NANO_BANANA_API_KEY` contrôle le provider; ajouter des providers dans `getIAService()` quand le besoin est réel |
| Tests E2E avec la vraie API Gemini | "Tester l'intégration réelle" | Coûts par requête ($0.045/image), latence 10-30 s par test, non-déterminisme, quota quotidien — un test suite complet brûle le budget et est lent | Mocker l'API Gemini en tests (`vi.mock('@google/genai')`); écrire des scripts d'intégration manuels séparés pour valider la clé API |

---

## Feature Dependencies

```
NanoBananaService.generate() [MUST]
    └──requiert──> @google/genai installé (npm install @google/genai)
    └──requiert──> encodage base64 de l'image source (fetch URL → Buffer → base64)
    └──requiert──> RetryHandler (logique backoff)
    └──requiert──> Timeout wrapper (AbortSignal ou Promise.race)
    └──retourne──> GenerateResult { imageBuffer, mimeType, extension }

NanoBananaService.addWatermark() [MUST]
    └──requiert──> sharp (déjà installé, utilisé par MockIAService)
    └──réutilise──> pattern SVG composite de MockIAService.addWatermark()

Tests Vitest: NanoBananaService [MUST]
    └──requiert──> NanoBananaService implémenté
    └──requiert──> vi.mock('@google/genai') — mocker GoogleGenAI constructor et generateContent

Tests Vitest: routes admin generate [MUST]
    └──requiert──> vi.mock('@/lib/ai') — pattern déjà établi dans simulate-route.test.ts
    └──requiert──> vi.mock('@/lib/supabase/server') — pattern établi

Tests Playwright E2E: flux simulate [DIFFERENTIATEUR]
    └──requiert──> @playwright/test installé
    └──requiert──> playwright.config.ts à la racine (webServer: npm run dev)
    └──requiert──> page.route('/api/simulate', ...) pour retourner JPEG fixture
    └──requiert──> serveur dev actif pendant les tests

Tests Playwright E2E: flux admin [DIFFERENTIATEUR]
    └──requiert──> infrastructure Playwright E2E simulate (config partagée)
    └──requiert──> fixtures Supabase OU mocks complets des routes admin API
    └──requiert──> session admin mockée ou réelle
```

### Dependency Notes

- **`NanoBananaService` requiert `@google/genai`:** SDK officiel Google (`npm install @google/genai`, package `@google/genai` sur npm, repo `github.com/googleapis/js-genai`). Auth via param `apiKey` dans le constructeur, depuis `process.env.NANO_BANANA_API_KEY`.

- **Retry requiert classification des erreurs:** Ne retenter que 429 (rate limit) et 5xx (serveur transitoire). Ne jamais retenter 400 (requête invalide) ou 403 (auth). Le SDK Gemini lance des erreurs typées — vérifier `error.status` ou `error.message`.

- **Playwright requiert une config séparée:** `playwright.config.ts` à la racine, `webServer: { command: 'npm run dev', url: 'http://localhost:3000' }`. Tests dans `e2e/` séparé de `src/__tests__/` (Vitest). Les deux frameworks coexistent sans conflit.

- **Fetch image source en back-office:** `sourceImageUrl` est une URL Supabase Storage. En contexte serveur (routes admin), le fetch est direct. Doit gérer les erreurs de fetch gracieusement — fallback vers prompt seul si l'image est inaccessible (ne pas bloquer la génération).

---

## MVP Definition

### IA-REAL-01 et IA-REAL-02 (ce milestone)

Minimum nécessaire pour remplacer le stub par une intégration réelle fonctionnelle.

- [ ] Installer `@google/genai` et implémenter `NanoBananaService.generate()` — envoyer prompt + image source base64, parser la part image de la réponse
- [ ] Implémenter `NanoBananaService.addWatermark()` — réutiliser le pattern Sharp composite de `MockIAService`
- [ ] Ajouter wrapper retry + timeout (3 tentatives, timeout 30 s) — prévient les blocages et échecs rate limit en production
- [ ] Tests unitaires pour `NanoBananaService` : happy path, retry sur 429, erreur permanente, watermark

### TEST-01 et AUDIT-01 (ce milestone)

Minimum nécessaire pour établir une couverture de tests sur le code existant.

- [ ] Tests unitaires pour utils (`slugify`, `calculatePrice`, `extractStoragePath`) — fonctions pures, aucun mock
- [ ] Tests unitaires pour prompts (`buildBackOfficePrompt`, `buildSimulatePrompt`) — vérification de sortie string
- [ ] Tests Vitest pour les routes admin generate — mocker `getIAService()`, asserter propagation 500 et chemin success
- [ ] Tests Vitest couvrant le comportement de `requireAdmin()` — mocker l'auth Supabase, asserter 401 sans session valide

### Ajouter après validation (v11.x)

- [ ] Tests Playwright E2E pour le flux simulate — ajouter après que la suite Vitest passe; valide l'intégration de toutes les pièces ensemble
- [ ] Tests Playwright E2E pour le flux admin generate+publish — ajoute de la confiance sur le workflow le plus complexe

### Future Consideration (v12+)

- [ ] Queue de génération asynchrone (Inngest ou similaire) — seulement si le temps de génération > 30 s devient une douleur utilisateur
- [ ] Expansion de providers (OpenAI DALL-E, Stability AI) — seulement si la qualité de sortie Gemini est insuffisante

---

## Feature Prioritization Matrix

| Feature | Valeur Utilisateur | Coût Implémentation | Priorité |
|---------|-------------------|---------------------|----------|
| `NanoBananaService.generate()` | HAUTE (active la vraie IA) | MEDIUM | P1 |
| `NanoBananaService.addWatermark()` | HAUTE (flux client cassé sans ça) | LOW | P1 |
| Retry + timeout wrapper | HAUTE (résilience production) | MEDIUM | P1 |
| Tests Vitest: NanoBananaService | HAUTE (détecte régressions couche IA) | MEDIUM | P1 |
| Tests Vitest: utils + prompts | MEDIUM (couverture logique pure) | LOW | P1 |
| Tests Vitest: routes admin generate | MEDIUM (gestion erreurs routes) | MEDIUM | P2 |
| Tests Vitest: requireAdmin() | MEDIUM (contrat auth) | LOW | P2 |
| Image source passée à Gemini (simulate) | MEDIUM (meilleure qualité IA) | MEDIUM | P2 |
| Image source passée à Gemini (back-office) | MEDIUM (meilleure fidélité rendu) | MEDIUM | P2 |
| Logging structuré erreurs Gemini | LOW (DX debugging) | LOW | P2 |
| Playwright E2E: flux simulate | HAUTE (garde contre régressions) | HIGH | P2 |
| Playwright E2E: flux admin | MEDIUM (déjà testé manuellement) | HIGH | P3 |

**Clé priorités:**
- P1 : Indispensable pour livrer IA-REAL-01/02 et TEST-01 — ne pas shipper sans
- P2 : Souhaitable, ajouter dans v11.0 si le temps le permet
- P3 : Nice-to-have, v11.x ou v12+

---

## Notes Techniques API Gemini

Vérifiées contre la documentation officielle (`ai.google.dev/gemini-api/docs/image-generation`, 2026-04-08).

**Modèle:** `gemini-3.1-flash-image-preview` (Nano Banana 2, publié le 2026-02-26)

**SDK:** `@google/genai` (package npm officiel, repo `github.com/googleapis/js-genai`)

**Pattern requête (édition image / inpainting):**
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.NANO_BANANA_API_KEY })

const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-image-preview',
  contents: [{
    role: 'user',
    parts: [
      { text: prompt },
      { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } }
    ]
  }],
  config: { responseModalities: ['IMAGE'] }
})
```

**Extraction de la réponse:**
```typescript
for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    const imageBuffer = Buffer.from(part.inlineData.data, 'base64')
    // → imageBuffer pour GenerateResult
  }
}
```

**Rate limits (tier payant):** 429 si dépassement RPM/RPD/IPM. Tier gratuit : IPM = 0 depuis le 2025-12-07 (impossible de générer des images gratuitement). Backoff exponentiel avec jitter requis en production.

**Pricing:** $0.045/image à résolution 1K (MEDIUM confidence — source tierce; vérifier la page pricing officielle Google pour les estimations de facturation).

---

## Notes Infrastructure Tests

Vérifiées contre la codebase projet et la documentation Next.js.

**Setup Vitest existant:**
- `vitest.config.ts` avec environnement `happy-dom`, `src/__tests__/setup.ts`
- Pattern établi: `vi.mock('@/lib/ai', () => ({ getIAService: vi.fn(...) }))` — utiliser pour tous les tests de routes touchant à l'IA
- `@testing-library/react` + `@testing-library/jest-dom` installés
- Vitest 3.2.4 installé

**Pattern routes API (prouvé dans `simulate-route.test.ts`):**
- Import direct `import { POST } from '@/app/api/...'` après les mocks
- Invocation avec `new Request('http://localhost/...', { method: 'POST', body: ... })`
- Pas besoin de `next-test-api-route-handler` — le pattern actuel est plus simple et déjà fonctionnel

**Pour les tests Playwright:** Playwright n'est pas encore installé. Nécessite `npm install -D @playwright/test` + `npx playwright install chromium`. Config à la racine du projet. Intercepter `/api/simulate` avec `page.route()` pour retourner un JPEG fixture (évite les coûts IA réels et le non-déterminisme). Point clé: tester la state machine UI (idle → generating → done → error), pas la sortie IA.

**Composants serveur async:** Vitest ne peut pas tester les Server Components async. Tester les handlers de routes API directement (pattern éprouvé). Utiliser Playwright pour les pages complètes en E2E.

---

## Sources

- [Nano Banana 2 image generation — Google AI for Developers](https://ai.google.dev/gemini-api/docs/image-generation) (HIGH confidence)
- [googleapis/js-genai — SDK TypeScript officiel](https://github.com/googleapis/js-genai) (HIGH confidence)
- [gemini-image-editing-nextjs-quickstart — Google Gemini](https://github.com/google-gemini/gemini-image-editing-nextjs-quickstart) (HIGH confidence)
- [Nano Banana 2 launch — TechCrunch 2026-02-26](https://techcrunch.com/2026/02/26/google-launches-nano-banana-2-model-with-faster-image-generation/) (MEDIUM confidence)
- [Gemini image 429 rate limit guide 2026](https://blog.laozhang.ai/en/posts/gemini-image-429-rate-limit) (MEDIUM confidence)
- [Testing Next.js App Router API routes — Arcjet](https://blog.arcjet.com/testing-next-js-app-router-api-routes/) (MEDIUM confidence)
- [E2E testing AI agents with Playwright in Next.js — DEV Community](https://dev.to/dumebii/how-to-e2e-test-ai-agents-mocking-api-responses-with-playwright-in-nextjs-nic) (MEDIUM confidence)
- [Vitest mocking guide](https://vitest.dev/guide/mocking) (HIGH confidence)
- [Next.js Vitest testing guide](https://nextjs.org/docs/app/guides/testing/vitest) (HIGH confidence)

---

*Feature research pour: Möbel Unique v11.0 — Intégration IA Réelle + Audit Qualité*
*Researched: 2026-04-08*
