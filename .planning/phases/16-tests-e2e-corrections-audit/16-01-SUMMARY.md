---
phase: 16-tests-e2e-corrections-audit
plan: 01
subsystem: api, security, testing
tags: [zod, next-config, security-headers, csp, uuid-validation, dead-code, eslint]

# Dependency graph
requires:
  - phase: 14-audit-code
    provides: AUDIT.md avec findings securite et dead code
provides:
  - Security headers HTTP (X-Frame-Options, CSP, etc.) dans next.config.ts
  - Validation MIME dans /api/simulate
  - Validation UUID dans toutes les routes admin /[id]
  - Schemas Zod pour toutes les routes POST admin
  - Codebase nettoye (0 error ESLint, 0 erreur tsc, 10 deps supprimees)
affects: [16-02, 16-03]

# Tech tracking
tech-stack:
  added: []
  removed: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-label", "@radix-ui/react-select", "@radix-ui/react-slot", "@radix-ui/react-switch", "@radix-ui/react-toast", "@radix-ui/react-toggle", "zustand", "immer"]
  patterns: [uuid-regex-validation, zod-safeParse-admin-routes, security-headers-nextconfig]

key-files:
  created: []
  modified:
    - next.config.ts
    - src/lib/schemas.ts
    - src/app/api/simulate/route.ts
    - src/app/api/admin/generate/route.ts
    - src/app/api/admin/generate-all/route.ts
    - src/app/api/admin/visuals/bulk-validate/route.ts
    - src/app/api/admin/visuals/bulk-publish/route.ts
    - src/app/api/admin/models/[id]/route.ts
    - src/app/api/admin/fabrics/[id]/route.ts
    - src/app/api/admin/visuals/[id]/validate/route.ts
    - src/app/api/admin/visuals/[id]/publish/route.ts
    - src/lib/ai/nano-banana.ts
    - src/lib/ai/index.ts
    - src/types/database.ts
    - src/app/admin/(protected)/produits/IAGenerationSection.tsx
    - src/components/public/Catalogue/ConfiguratorModal.tsx
    - src/components/public/Catalogue/ConfiguratorModal.module.css

key-decisions:
  - "Zod 4 utilise .issues au lieu de .errors sur ZodError"
  - "UUID regex valide UUID v4 strict (4 dans version, 89ab dans variant)"
  - "console.log remplace par console.info (ESLint warning acceptable, pas error)"
  - "Blob URLs (preview/result) gardees en <img>, seules les URLs Supabase definitives passent a <Image>"

patterns-established:
  - "UUID_REGEX pattern: constante en haut de chaque fichier route admin /[id]"
  - "Zod safeParse pattern: parseResult.error.issues[0]?.message pour message d'erreur"
  - "coverImage CSS class: remplace inline style={{ objectFit: 'cover' }} sur les <Image>"

requirements-completed: [FIX-01]

# Metrics
duration: 20min
completed: 2026-04-11
---

# Phase 16 Plan 01: Corrections Audit Summary

**Security headers CSP/HSTS, validation MIME + UUID sur toutes les routes, schemas Zod admin POST, suppression 10 deps inutilisees et dead code**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-10T23:42:42Z
- **Completed:** 2026-04-11T00:03:00Z
- **Tasks:** 2
- **Files modified:** 29

## Accomplishments
- 5 security headers HTTP configures dans next.config.ts (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP)
- Validation MIME dans /api/simulate + IP extraction corrigee + seuil rateMap reduit
- Validation UUID v4 dans les 4 routes admin /[id] (models, fabrics, visuals/validate, visuals/publish)
- 4 schemas Zod (generateSchema, generateAllSchema, bulkSchema, imagesUploadBodySchema) remplacement validation manuelle dans 6 routes POST admin
- 10 dependances inutilisees supprimees (8 Radix UI + zustand + immer)
- Dead code supprime : 2 schemas enrichis, 4 types inferes, 2 types database, 1 variable inutilisee
- 0 error ESLint, 0 erreur tsc, build production OK, 183 tests unitaires passent

## Task Commits

Each task was committed atomically:

1. **Task 1: Security headers + corrections securite routes** - `7314d68` (fix)
2. **Task 2: Dead code cleanup + ESLint fixes + Zod schemas + deps** - `0d4a4b3` (fix)

## Files Created/Modified
- `next.config.ts` - Security headers (CSP, X-Frame-Options, etc.)
- `src/lib/schemas.ts` - 4 nouveaux schemas Zod admin, suppression schemas/types inutilises
- `src/app/api/simulate/route.ts` - MIME validation, IP extraction, rateMap seuil
- `src/app/api/admin/generate/route.ts` - Zod safeParse, console.info
- `src/app/api/admin/generate-all/route.ts` - Zod safeParse, console.info
- `src/app/api/admin/visuals/bulk-validate/route.ts` - Zod safeParse, console.info
- `src/app/api/admin/visuals/bulk-publish/route.ts` - Zod safeParse, console.info
- `src/app/api/admin/models/[id]/route.ts` - UUID validation 3 handlers
- `src/app/api/admin/fabrics/[id]/route.ts` - UUID validation 3 handlers
- `src/app/api/admin/visuals/[id]/validate/route.ts` - UUID validation
- `src/app/api/admin/visuals/[id]/publish/route.ts` - UUID validation
- `src/app/api/admin/models/[id]/images/route.ts` - Zod imagesUploadBodySchema
- `src/app/api/admin/models/[id]/visuals/route.ts` - Zod visualUploadSchema
- `src/lib/ai/nano-banana.ts` - Non-null assertion fix, buffer size limit, console.info
- `src/lib/ai/index.ts` - console.info
- `src/types/database.ts` - Suppression GeneratedVisualUpdate, ModelWithImagesAndVisuals
- `src/app/admin/(protected)/produits/IAGenerationSection.tsx` - Image import, <img> -> <Image>
- `src/components/public/Catalogue/ConfiguratorModal.tsx` - coverImage class, <img> -> <Image> swatch
- `src/components/public/Catalogue/ConfiguratorModal.module.css` - .coverImage class
- `src/components/public/Hero/__tests__/Hero.test.tsx` - Fix motion mock ESLint
- `src/components/public/HowItWorks/__tests__/HowItWorks.test.tsx` - Fix motion mock ESLint
- `src/__tests__/ConfiguratorModal.test.tsx` - Remove unused variable
- `src/__tests__/generate-route.test.ts` - Update tests for UUID Zod validation
- `src/__tests__/generate-all-route.test.ts` - Update tests for UUID Zod validation
- `src/__tests__/simulate-route.test.ts` - Update HEIC test for MIME validation
- `package.json` - Suppression 10 deps inutilisees
- `knip.json` - Ajout entry points scripts
- `.gitignore` - Ajout repertoires Playwright

## Decisions Made
- Utilisation de `.issues` au lieu de `.errors` sur ZodError (Zod v4 API)
- UUID regex strict (UUID v4 avec version byte 4 et variant byte 89ab)
- console.log -> console.info (warning ESLint acceptable, pas error -- config n'autorise que error/warn)
- Blob URLs (preview/result) conservees en `<img>` per D-03, seules URLs Supabase passent a `<Image>`
- Tests d'integration Supabase pre-existants en echec (pas de connexion) -- hors scope

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 API: .issues au lieu de .errors**
- **Found during:** Task 2 (Zod safeParse integration)
- **Issue:** Le plan utilisait `.error.errors[0]?.message` (syntaxe Zod v3). En Zod v4, la propriete est `.error.issues[0]?.message`
- **Fix:** Remplace `.errors` par `.issues` dans les 6 routes admin
- **Files modified:** 6 fichiers route admin
- **Committed in:** 0d4a4b3

**2. [Rule 1 - Bug] Tests unitaires casses par validation UUID Zod**
- **Found during:** Task 2 (verification tests)
- **Issue:** Les tests unitaires generate-route et generate-all-route utilisaient des IDs non-UUID ('m1', 'f1') qui sont maintenant rejetes par les schemas Zod
- **Fix:** Remplace les IDs de test par des UUIDs v4 valides, ajuste les assertions
- **Files modified:** generate-route.test.ts, generate-all-route.test.ts, simulate-route.test.ts
- **Committed in:** 0d4a4b3

**3. [Rule 1 - Bug] Test HEIC simulate adapte a la validation MIME**
- **Found during:** Task 2 (verification tests)
- **Issue:** Le test HEIC attendait le message d'erreur du service IA, mais notre validation MIME intercepte maintenant le type image/heic avant
- **Fix:** Test mis a jour pour refleter le nouveau message "Format non supporte"
- **Files modified:** simulate-route.test.ts
- **Committed in:** 0d4a4b3

---

**Total deviations:** 3 auto-fixed (3 Rule 1 bugs)
**Impact on plan:** Corrections necessaires pour la compatibilite Zod v4 et coherence des tests. Aucun changement de scope.

## Issues Encountered
- 2 tests simulate-route pre-existants en echec (ImageSafety 422 et AbortError 504) -- probleme de mocking async pre-existant, hors scope de ce plan

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Codebase propre : 0 error ESLint, 0 erreur tsc, build OK, 183 tests unitaires passent
- Security headers en place pour les tests E2E
- Schemas Zod couvrent toutes les routes POST admin
- Pret pour le plan 16-02 (infrastructure Playwright) et 16-03 (corrections restantes)

---
*Phase: 16-tests-e2e-corrections-audit*
*Completed: 2026-04-11*
