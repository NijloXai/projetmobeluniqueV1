# Phase 15: Tests Unitaires Vitest - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Combler les gaps de couverture test identifiés par les success criteria du ROADMAP. Le codebase a déjà 161 tests passants (13 fichiers) couvrant NanoBananaService, routes admin, route simulate, composants UI. Cette phase ajoute les tests manquants : utils (slugify, calculatePrice, extractStoragePath), requireAdmin 401, et timeout NanoBanana explicite.

</domain>

<decisions>
## Implementation Decisions

### Stratégie requireAdmin 401
- **D-01:** Tester requireAdmin() en unitaire en mockant le client Supabase auth — vérifier 3 cas : token absent, token expiré, token valide
- **D-02:** Tester aussi les routes admin (generate, generate-all) avec requireAdmin mocké pour retourner une erreur — vérifier que les routes retournent 401 avec message français

### Couverture utils
- **D-03:** Créer `src/__tests__/utils.test.ts` avec tests pour slugify, calculatePrice, extractStoragePath
- **D-04:** Cas limites choisis par Claude selon pertinence du code existant (accents français/allemands pour slugify, prix 0/négatif/premium pour calculatePrice, URLs valides/signées/malformées/null pour extractStoragePath)

### Organisation fichiers test
- **D-05:** Tous les nouveaux tests dans `src/__tests__/` — cohérent avec les 14 fichiers existants, pas de refactoring d'organisation
- **D-06:** Convention de nommage existante conservée : `{sujet}.test.ts`

### Timeout NanoBanana
- **D-07:** Ajouter un test timeout dédié dans `src/__tests__/nano-banana.test.ts` vérifiant que le service produit une erreur explicite sur timeout 30s (pas seulement testé via les routes)

### Claude's Discretion
- Nombre exact de cas limites par fonction utils (entre basique et exhaustif, selon pertinence)
- Détails d'implémentation des mocks Supabase auth pour requireAdmin
- Structure interne des describe/it pour les nouveaux tests
- Gestion des timers Vitest pour le test timeout (vi.useFakeTimers vs AbortController mock)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tests existants (patterns à suivre)
- `src/__tests__/nano-banana.test.ts` — 14 tests, pattern mock @google/genai, à étendre avec timeout
- `src/__tests__/simulate-route.test.ts` — Pattern mock Supabase + IA service, tests route complète
- `src/__tests__/generate-route.test.ts` — Pattern mock requireAdmin + routes admin, à étendre avec 401
- `src/__tests__/generate-all-route.test.ts` — Pattern similaire generate-route
- `src/__tests__/setup.ts` — Setup global Vitest (happy-dom)

### Code source à tester
- `src/lib/utils.ts` — slugify, calculatePrice, extractStoragePath, formatPrice, getPrimaryImage
- `src/lib/supabase/admin.ts` — requireAdmin() function
- `src/lib/ai/nano-banana.ts` — NanoBananaService (timeout à tester)

### Configuration
- `vitest.config.ts` — Config Vitest (happy-dom, path alias @/, include pattern)

### Requirements
- `.planning/ROADMAP.md` — Success criteria Phase 15 (4 critères SC)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vitest.config.ts` : setup complet avec happy-dom, path alias, setup file — aucune modification nécessaire
- Pattern mock dans `nano-banana.test.ts` : vi.mock('@google/genai') avec factory — réutiliser pour le test timeout
- Pattern mock Supabase dans `simulate-route.test.ts` : chaining .from().select().eq().single() — réutiliser pour requireAdmin
- `src/__tests__/setup.ts` : setup global existant

### Established Patterns
- Mocks déclarés avant imports dynamiques (`await import(...)` après `vi.mock()`)
- `vi.clearAllMocks()` dans `beforeEach`
- Tests nommés en français sans accents (convention établie)
- Messages d'erreur vérifiés via `.toContain()` sur le texte français

### Integration Points
- `npm test` (vitest run) — les nouveaux tests s'intègrent automatiquement via le pattern `src/**/*.test.{ts,tsx}`
- Pas besoin de modifier vitest.config.ts — le include pattern couvre déjà `src/__tests__/`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-tests-unitaires-vitest*
*Context gathered: 2026-04-09*
