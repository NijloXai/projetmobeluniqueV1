# Project Research Summary

**Project:** Möbel Unique v11.0 — Intégration IA Réelle + Audit Qualité
**Domain:** E-commerce visualisation IA (canapes personnalisables)
**Researched:** 2026-04-08
**Confidence:** HIGH

## Executive Summary

Möbel Unique v11.0 a un scope chirurgical : un seul fichier à modifier (`src/lib/ai/nano-banana.ts`) pour remplacer le stub IA par une implémentation réelle via `@google/genai` (SDK officiel Google, modèle `gemini-3.1-flash-image-preview`). Le factory pattern `getIAService()` est déjà en place — les 3 routes consommatrices (`/api/admin/generate`, `/api/admin/generate-all`, `/api/simulate`) restent inchangées. Deux nouvelles dépendances npm seulement : `@google/genai` (runtime) et `@playwright/test` (devDependency).

L'infrastructure Vitest existante (10 fichiers de tests, vitest.config.ts, happy-dom) est réutilisée sans modification. L'approche recommandée est séquentielle : implémenter `NanoBananaService` avec retry + timeout d'abord, puis tests unitaires Vitest (mock `@google/genai`), puis audit code complet, puis Playwright E2E contre le mock provider (sans clé API, donc sans coût ni non-déterminisme).

Les risques sont tous prévisibles et évitables — timeout `generate-all` (latence réelle Gemini 5-30s vs ~5ms mock), rate limiting 429 sans retry, refus silencieux `IMAGE_SAFETY`, image inline > 20 Mo.

## Key Findings

### Recommended Stack

Seules 2 nouvelles dépendances. Le reste du stack existant (Next.js 16, Supabase, Sharp, Vitest) est réutilisé tel quel.

**Core technologies:**
- `@google/genai` ^1.48.0 : SDK officiel Google pour Gemini — seul moyen d'appeler `gemini-3.1-flash-image-preview`
- `@playwright/test` ^1.59.1 : tests E2E — non encore installé dans le projet
- `sharp` (déjà installé) : conversion PNG→JPEG obligatoire — Gemini retourne PNG, Storage attend JPEG

### Expected Features

**Must have (table stakes):**
- `NanoBananaService.generate()` avec deux chemins (URL Supabase → fetch+base64 pour admin, data URI → split direct pour simulate)
- `NanoBananaService.addWatermark()` via Sharp SVG (réutiliser le pattern du MockIAService)
- Retry exponentiel 1s/2s/4s + jitter sur 429/5xx
- Timeout 30s via `AbortSignal.timeout()`
- Vérification `finishReason === 'STOP'` avant parsing
- `export const maxDuration = 300` dans `generate-all/route.ts`
- Resize image simulate (sharp, max 1024px) avant envoi Gemini

**Should have (competitive):**
- Logging structuré erreurs Gemini
- Tests Vitest pour routes admin generate + `requireAdmin()`
- Tests Playwright E2E flux simulation + admin

**Defer (v12+):**
- Queue asynchrone pour génération batch
- Multi-providers IA
- Cache Redis résultats

### Architecture Approach

Factory pattern Strategy inchangé. `nano-banana.ts` est le seul fichier modifié côté IA. Tests Vitest dans `src/__tests__/` (pattern établi). Tests Playwright dans `e2e/` à la racine.

**Major components:**
1. `NanoBananaService` — implémentation réelle `generate()` + `addWatermark()` avec retry/timeout
2. Tests Vitest — extension du pattern `vi.mock()` existant pour couvrir NanoBanana, utils, routes
3. Tests Playwright — E2E contre mock provider, `globalSetup` pour auth admin

### Critical Pitfalls

1. **`generate-all` timeout** — `maxDuration = 300` + évaluer `Promise.all` pour les angles
2. **429 sans retry** — backoff 1s→4s, max 3 tentatives, jitter ±20%
3. **`IMAGE_SAFETY` non géré** — vérifier `finishReason` avant tout accès à `parts[0].inlineData.data`
4. **Image inline > 20 Mo** — resize systématique pour simulate, URL publique pour admin
5. **CI avec vraie clé API** — `NANO_BANANA_API_KEY` absente en CI, tests unitaires mockent `getIAService()`

## Implications for Roadmap

### Phase 1: Implémentation NanoBananaService
**Rationale:** Fondation de tout — sans IA réelle, rien d'autre ne fonctionne
**Delivers:** `NanoBananaService` complet avec retry, timeout, finishReason, image resize, PNG→JPEG
**Addresses:** IA-REAL-01 + IA-REAL-02
**Avoids:** Timeout generate-all, 429 sans retry, IMAGE_SAFETY crash

### Phase 2: Audit code complet
**Rationale:** Avant d'ajouter des tests, identifier tous les problèmes existants
**Delivers:** Rapport audit (sécurité, performance, dead code, bonnes pratiques)
**Addresses:** AUDIT-01

### Phase 3: Tests unitaires + intégration Vitest
**Rationale:** Infrastructure déjà en place, étendre le filet de sécurité
**Delivers:** Tests NanoBananaService, utils, routes admin/client
**Uses:** Vitest existant, `vi.mock('@google/genai')`
**Addresses:** TEST-01

### Phase 4: Tests E2E Playwright + corrections audit
**Rationale:** Parcours UI complets après filet unitaire + fixes des issues trouvées
**Delivers:** E2E catalogue → configurateur → simulation, corrections audit
**Addresses:** TEST-02 + FIX-01

### Phase Ordering Rationale

- Impl IA d'abord → tests unitaires validant l'impl → E2E validant le flux complet
- Audit entre impl et tests pour identifier les problèmes avant d'écrire les tests
- Corrections audit groupées avec E2E car les deux touchent le code existant

### Research Flags

Phases avec patterns standard (skip research-phase):
- **Phase 1:** Code source existant analysé, SDK docs vérifiées, patterns clairs
- **Phase 2:** Audit est une analyse, pas une implémentation
- **Phase 3:** Infrastructure Vitest existante, patterns établis
- **Phase 4:** Playwright docs + patterns standard Next.js

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Code source analysé, SDK vérifié via docs officielles |
| Features | HIGH | API Gemini docs officiels, code existant analysé |
| Architecture | HIGH | Routes, factory, mock, stub, tests — observation directe |
| Pitfalls | HIGH | Code + docs Vercel + Gemini rate limits + Playwright auth |

**Overall confidence:** HIGH

### Gaps to Address

- Model string `gemini-3.1-flash-image-preview` en preview — isoler dans constante
- Pricing $0.045/image est source tierce — vérifier page pricing officielle
- Latence Gemini en prod (5-30s) — `Promise.all` pour `generate-all` à évaluer sur données réelles

## Sources

### Primary (HIGH confidence)
- Code source `src/lib/ai/` — factory pattern, types, mock, stub analysés
- Documentation Gemini API officielle — SDK `@google/genai`, model strings, API `generateContent`
- Documentation Vitest officielle — patterns mock, configuration
- Documentation Playwright officielle — storageState, globalSetup

### Secondary (MEDIUM confidence)
- Versions npm `@google/genai` 1.48.0, `@playwright/test` 1.59.1 — sources multiples concordantes
- Pricing Gemini — sources tierces

---
*Research completed: 2026-04-08*
*Ready for roadmap: yes*
