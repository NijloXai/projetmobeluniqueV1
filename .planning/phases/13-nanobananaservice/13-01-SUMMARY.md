---
phase: 13-nanobananaservice
plan: 01
subsystem: ai
tags: [gemini, google-genai, sharp, retry, image-generation, nano-banana]

# Dependency graph
requires:
  - phase: 05-ia-generation-mock
    provides: IAService interface, factory pattern, MockIAService, prompts
provides:
  - NanoBananaService complet (generate + addWatermark + retry + timeout + IMAGE_SAFETY)
  - ImageSafetyError exportee pour detection HTTP 422
affects: [13-02-nanobananaservice, 15-tests, 16-audit]

# Tech tracking
tech-stack:
  added: ["@google/genai@1.48.0"]
  patterns: ["retry exponentiel avec jitter", "AbortSignal.timeout par tentative", "IMAGE_SAFETY -> ImageSafetyError"]

key-files:
  created: []
  modified: ["src/lib/ai/nano-banana.ts"]

key-decisions:
  - "Import Part type depuis @google/genai pour typage strict resolveImagePart"
  - "contents passe comme [string, Part] (PartUnion[]) — SDK accepte directement"

patterns-established:
  - "Retry exponentiel 1s/2s/4s + jitter (0.8-1.2x) sur 429/5xx/AbortError"
  - "AbortSignal.timeout() cree DANS chaque tentative retry (pas avant la boucle)"
  - "Verification finishReason avant acces aux parts Gemini"
  - "Erreur 401 Gemini masquee derriere message generique (D-15)"

requirements-completed: [IA-01, IA-02, IA-03, IA-05, IA-07]

# Metrics
duration: 4min
completed: 2026-04-08
---

# Phase 13 Plan 01: NanoBananaService Summary

**NanoBananaService complet via @google/genai : generate() Gemini avec retry exponentiel, IMAGE_SAFETY, deux chemins image, conversion PNG→JPEG, et watermark Sharp**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-08T13:15:37Z
- **Completed:** 2026-04-08T13:19:58Z
- **Tasks:** 2
- **Files modified:** 3 (package.json, package-lock.json, nano-banana.ts)

## Accomplishments
- SDK @google/genai@1.48.0 installe et verifie
- NanoBananaService remplace le stub (18 lignes → 253 lignes)
- generate() appelle Gemini gemini-3.1-flash-image-preview avec retry exponentiel (1s/2s/4s + jitter)
- IMAGE_SAFETY produit ImageSafetyError explicite en francais
- Deux chemins d'image : URL fetch→base64 (admin) / data URI split (simulate)
- Conversion PNG→JPEG via Sharp (quality 85)
- addWatermark() identique au pattern MockIAService
- TypeScript strict, zero `any`, tsc --noEmit passe

## Task Commits

Each task was committed atomically:

1. **Task 0: Installer @google/genai** - `e2ab8af` (chore)
2. **Task 1: Implementer NanoBananaService complet** - `b028c8f` (feat)

## Files Created/Modified
- `package.json` - Ajout dependance @google/genai@1.48.0
- `package-lock.json` - Lock file mis a jour
- `src/lib/ai/nano-banana.ts` - NanoBananaService complet (generate + addWatermark + retry + timeout)

## Decisions Made
- Utilise `import { GoogleGenAI, type Part } from '@google/genai'` pour typer strictement resolveImagePart() avec le type Part du SDK
- Passe `contents: [prompt, imagePart]` comme `PartUnion[]` (string + Part) — le SDK accepte directement, pas besoin de wrapper Content
- `lastError` type `Error | undefined` plutot que `Error | null` pour coherence TypeScript strict

## Deviations from Plan

None - plan execute exactement comme ecrit.

## Issues Encountered

None

## User Setup Required

None - pas de configuration externe requise. La cle `NANO_BANANA_API_KEY` doit etre definie dans `.env.local` pour activer le service (deja documente dans CLAUDE.md).

## Next Phase Readiness
- NanoBananaService est pret a etre utilise par les routes existantes via le factory `getIAService()`
- Plan 13-02 (maxDuration + rate-limit + generate-all errors) peut demarrer immediatement
- Le factory `index.ts` n'a pas ete modifie — compatibilite totale

## Self-Check: PASSED

- [x] `src/lib/ai/nano-banana.ts` exists (253 lines)
- [x] `.planning/phases/13-nanobananaservice/13-01-SUMMARY.md` exists
- [x] Commit `e2ab8af` found (Task 0)
- [x] Commit `b028c8f` found (Task 1)
- [x] `npx tsc --noEmit` passes

---
*Phase: 13-nanobananaservice*
*Completed: 2026-04-08*
