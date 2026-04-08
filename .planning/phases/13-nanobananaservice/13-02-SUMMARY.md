---
phase: 13-nanobananaservice
plan: 02
subsystem: api
tags: [maxDuration, rate-limit, sharp-resize, error-handling, image-safety, vercel]

# Dependency graph
requires:
  - phase: 13-nanobananaservice-01
    provides: NanoBananaService complet avec ImageSafetyError exportee
provides:
  - 3 routes IA adaptees pour latence reelle Gemini (maxDuration, rate-limit, resize, error handling)
affects: [15-tests, 16-audit]

# Tech tracking
tech-stack:
  added: []
  patterns: ["maxDuration export en tete de route", "rate-limit IP en memoire Map", "sharp resize avant envoi Gemini", "errors array dans reponse batch"]

key-files:
  created: []
  modified: ["src/app/api/admin/generate/route.ts", "src/app/api/admin/generate-all/route.ts", "src/app/api/simulate/route.ts"]

key-decisions:
  - "Rate-limit uniquement sur /api/simulate (route publique), pas sur les routes admin"
  - "Resize systematique a 1024px max via sharp avant envoi a Gemini pour limiter le payload"
  - "errors array dans generate-all pousse les echecs upload/insert/generate sans interrompre le batch"

patterns-established:
  - "maxDuration en premiere ligne de chaque route IA (avant les imports)"
  - "checkRateLimit() module-level avec Map<ip, {count, resetAt}>"
  - "Retry-After header sur les reponses 429"
  - "IMAGE_SAFETY -> 422, timeout/AbortError -> 504, generique -> 500"

requirements-completed: [IA-04, IA-06]

# Metrics
duration: 3min
completed: 2026-04-08
---

# Phase 13 Plan 02: Adaptation Routes IA Summary

**maxDuration Vercel + rate-limit IP 5/min sur simulate + resize Sharp 1024px + errors array generate-all + gestion IMAGE_SAFETY/timeout sur les 3 routes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-08T13:23:09Z
- **Completed:** 2026-04-08T13:26:15Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Les 3 routes IA exportent maxDuration (generate: 60s, generate-all: 300s, simulate: 60s)
- simulate a un rate-limit 5/min par IP avec reponse 429 + header Retry-After
- simulate resize les images uploadees a max 1024px via sharp avant envoi a Gemini (payload < 2 Mo)
- generate-all retourne un champ errors avec detail par angle (view_type + reason)
- generate et simulate gerent IMAGE_SAFETY (422), timeout/AbortError (504)
- TypeScript compile, build production passe

## Task Commits

Each task was committed atomically:

1. **Task 1: Adapter generate et generate-all** - `125a8c1` (feat)
2. **Task 2: Adapter simulate** - `632099c` (feat)

## Files Created/Modified
- `src/app/api/admin/generate/route.ts` - maxDuration=60, ImageSafetyError 422, timeout 504
- `src/app/api/admin/generate-all/route.ts` - maxDuration=300, errors array per-angle, ImageSafetyError 422
- `src/app/api/simulate/route.ts` - maxDuration=60, rate-limit 5/min IP, sharp resize 1024px, ImageSafetyError 422, timeout 504

## Decisions Made
- Rate-limit uniquement sur /api/simulate (route publique) conformement a D-18 — les routes admin sont protegees par requireAdmin()
- Resize systematique a 1024px max (fit: inside, withoutEnlargement: true) + JPEG quality 80 pour limiter le payload Gemini a < 2 Mo
- errors array dans generate-all pousse les echecs upload, insert et generate sans interrompre le batch — un angle qui echoue ne bloque pas les suivants
- IP extraite de x-forwarded-for (premier element) avec fallback x-real-ip puis 127.0.0.1

## Deviations from Plan

None - plan execute exactement comme ecrit.

## Issues Encountered

None

## User Setup Required

None - pas de configuration externe requise.

## Next Phase Readiness
- Les 3 routes IA sont pretes pour la latence reelle de Gemini
- Le factory getIAService() continue de fonctionner sans changement
- Phase 13 complete — pret pour Phase 14+ (audit, tests)

## Self-Check: PASSED

- [x] `src/app/api/admin/generate/route.ts` exists — maxDuration=60 line 1, ImageSafetyError 422, timeout 504
- [x] `src/app/api/admin/generate-all/route.ts` exists — maxDuration=300 line 1, errors array, ImageSafetyError 422
- [x] `src/app/api/simulate/route.ts` exists — maxDuration=60 line 1, rateMap, resize 1024px, ImageSafetyError 422, timeout 504
- [x] `.planning/phases/13-nanobananaservice/13-02-SUMMARY.md` exists
- [x] Commit `125a8c1` found (Task 1)
- [x] Commit `632099c` found (Task 2)
- [x] `npx tsc --noEmit` passes
- [x] `npm run build` passes

---
*Phase: 13-nanobananaservice*
*Completed: 2026-04-08*
