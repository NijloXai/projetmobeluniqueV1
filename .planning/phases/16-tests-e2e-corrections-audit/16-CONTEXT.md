# Phase 16: Tests E2E + Corrections Audit - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Mettre en place des tests E2E Playwright couvrant les parcours utilisateur critiques (public et admin) et corriger l'ensemble des 74 findings identifiés dans AUDIT.md (Phase 14). Les tests E2E utilisent Supabase CLI local (pattern Phase 15.1) et le mock Sharp comme provider IA. Les corrections audit couvrent les 3 niveaux de priorité (P1 critical + P2 warnings + P3 qualité).

</domain>

<decisions>
## Implementation Decisions

### Périmètre corrections audit
- **D-01:** Corriger les 74 findings de AUDIT.md — P1 (1 critical), P2 (15 warnings), P3 (26 qualité). Aucun finding reporté.
- **D-02:** Supprimer toutes les dépendances inutilisées : 8 packages Radix UI (@radix-ui/react-dialog, dropdown-menu, label, select, slot, switch, toast, toggle) + zustand + immer. Réinstaller si besoin en v12+.
- **D-03:** Remplacer `<img>` natif par `<Image>` next/image uniquement pour les URLs Supabase définitives. Garder `<img>` pour les blob URLs de preview (upload en cours).
- **D-04:** Ajouter des schemas Zod dans `src/lib/schemas.ts` pour les routes POST admin sans validation formelle (generate, generate-all, bulk-validate, bulk-publish, images, visuals, validate, publish).
- **D-05:** Remplacer `console.log` par `console.info` dans les routes et services IA (PERF-03/04/05/08). Satisfait ESLint no-console tout en gardant les métriques pour le monitoring.

### Données E2E
- **D-06:** Supabase CLI local (Docker) pour les données de test E2E — réutilise le pattern Phase 15.1 (supabase start, seed SQL, env vars locales).
- **D-07:** Mock Sharp comme provider IA en E2E — NANO_BANANA_API_KEY non définie dans l'environnement de test. Le factory pattern bascule automatiquement sur le mock (~5ms, déterministe).

### Config Playwright
- **D-08:** webServer auto dans `playwright.config.ts` — Playwright lance `npm run dev` automatiquement et attend la disponibilité du serveur.
- **D-09:** globalSetup + storageState pour l'auth admin — le globalSetup login une fois via la page /admin/login, sauvegarde les cookies dans un fichier `.auth/admin.json`. Chaque test admin réutilise le storageState.
- **D-10:** Chromium seul comme navigateur de test. Firefox/WebKit ajoutés en v12+ si besoin.

### Profondeur E2E
- **D-11:** Couverture complète : happy path (SC-2, SC-3) + cas d'erreur (404, auth 401, upload invalide) + responsive + accessibilité.
- **D-12:** Deux viewports : desktop (1280x720) + mobile (375x667). Vérifie que le catalogue, configurateur et simulation fonctionnent sur les deux.
- **D-13:** Audit accessibilité via @axe-core/playwright — audit WCAG automatisé sur chaque page traversée par les parcours E2E.

### Claude's Discretion
- Structure des fichiers E2E (e2e/ à la racine, organisation par parcours)
- Détails du seed SQL (nombre de modèles/tissus/images de test)
- Sélecteurs Playwright (data-testid vs rôles ARIA vs texte)
- Ordre d'exécution des corrections audit (P1 → P2 → P3 ou regroupé par fichier)
- Script npm pour orchestrer Supabase start + Playwright

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rapport d'audit (source des corrections)
- `.planning/phases/14-audit-code/AUDIT.md` — 74 findings structurés par catégorie (Sécurité, Performance, Dead Code, TypeScript). Chaque finding a fichier:ligne + sévérité + description + suggestion de correction.

### Tests existants (patterns à suivre)
- `src/__tests__/integration/` — Tests d'intégration Supabase CLI local (Phase 15.1) — pattern seed SQL, helpers auth, cleanup
- `vitest.config.ts` — Config Vitest existante (séparation unit/integration via projects)

### Code source impacté par les corrections
- `next.config.ts` — SEC-01 security headers (Critical)
- `src/app/api/simulate/route.ts` — SEC-02 validation MIME, SEC-04 eviction rateMap, SEC-08 IP extraction
- `src/app/api/admin/models/[id]/route.ts` — SEC-05 validation UUID, TS-04 types any
- `src/lib/supabase/middleware.ts` — TS-07 types cookiesToSet
- `src/lib/supabase/server.ts` — TS-08 types cookiesToSet
- `src/lib/ai/nano-banana.ts` — TS-13 lastError non-null assertion, PERF-04 console.log
- `src/lib/ai/index.ts` — PERF-03 console.log factory
- `src/lib/schemas.ts` — DEAD-05/06 schemas inutilisés, SEC-09 nouveaux schemas Zod
- `src/types/database.ts` — DEAD-09 types inutilisés
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — PERF-06 img→Image, PERF-07 inline styles, DEAD-12 eslint-disable
- `src/app/admin/(protected)/produits/IAGenerationSection.tsx` — DEAD-10 countUngenerated, PERF-06 img→Image
- `package.json` — DEAD-02 Radix UI, DEAD-03 zustand/immer

### Parcours E2E à couvrir
- `src/app/page.tsx` — Page d'accueil (point d'entrée parcours public)
- `src/components/public/Catalogue/CatalogueSection.tsx` — Catalogue (serveur)
- `src/components/public/Catalogue/CatalogueClient.tsx` — Catalogue (client, recherche)
- `src/components/public/Catalogue/ConfiguratorModal.tsx` — Configurateur tissu
- `src/components/public/Simulation/` — Simulation IA (upload, génération, résultat)
- `src/app/admin/login/page.tsx` — Login admin
- `src/app/admin/(protected)/produits/` — Admin produits (génération IA)

### Requirements
- `.planning/ROADMAP.md` — Success criteria Phase 16 (4 critères SC)
- `.planning/REQUIREMENTS.md` — E2E-01, E2E-02, E2E-03, FIX-01

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/__tests__/integration/helpers/` — Helpers d'intégration Phase 15.1 (auth helper signInWithPassword, Supabase client direct, seed/cleanup)
- `supabase/` — Config Supabase CLI locale (init, migrations, seed) — réutilisable pour les tests E2E
- Factory pattern IA (`getIAService()`) — bascule automatiquement sur Mock Sharp sans NANO_BANANA_API_KEY
- `src/lib/schemas.ts` — Schemas Zod existants (modelSchema, fabricSchema, etc.) — à étendre avec les schemas admin POST

### Established Patterns
- Supabase CLI local (Docker) pour les tests d'intégration (Phase 15.1)
- CSS Modules uniquement — les corrections inline styles doivent aller dans les .module.css
- `requireAdmin()` dans chaque route admin — pattern auth à tester E2E
- Auth flow : /admin/login → signInWithPassword → JWT cookies → requireAdmin()

### Integration Points
- `npm run dev` comme webServer Playwright (port 3000)
- Supabase local (port 54321) pour la BDD E2E
- `npx playwright test` comme commande E2E (à ajouter dans package.json scripts)
- `npx tsc --noEmit` pour vérifier les corrections TypeScript (SC-4)
- `npm run build` pour vérifier le build propre (SC-4)

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

*Phase: 16-tests-e2e-corrections-audit*
*Context gathered: 2026-04-11*
