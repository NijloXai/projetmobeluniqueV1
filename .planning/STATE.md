---
gsd_state_version: 1.0
milestone: v8.0
milestone_name: Catalogue Produits
status: verifying
stopped_at: Completed 04-02-PLAN.md — CatalogueSection + CatalogueClient + integration page.tsx
last_updated: "2026-03-28T06:23:15.386Z"
last_activity: 2026-03-28
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 2
  completed_plans: 2
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** Le client peut visualiser un canape dans le tissu de son choix et le simuler dans son salon avant d'acheter.
**Current focus:** Phase 04 — prerequis-catalogue-core

## Current Position

Phase: 04 (prerequis-catalogue-core) — EXECUTING
Plan: 2 of 2
Status: Phase complete — ready for verification
Last activity: 2026-03-28

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 4 (depuis v7.0)
- Average duration: ~1h/plan
- Total execution time: ~4h (v7.0)

**By Phase (v7.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 01 Fondation + Header | 1 | 3 tasks | 6 files |
| Phase 02 Hero | 1 | 2 tasks | 5 files |
| Phase 03 HowItWorks | 1 | 8 tasks | 6 files |
| Phase 04-prerequis-catalogue-core P01 | 2 | 2 tasks | 8 files |
| Phase 04 P02 | 2 | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions heritees de v7.0 :

- CSS Modules uniquement (pas de Tailwind)
- `100svh` pour le Hero (correctif mobile 2025)
- Pattern `mounted` pour eviter hydration mismatch sur le Header
- useState(false) pour scroll state — jamais d'acces a window dans l'initialisation useState (SSR)
- title.template '%s | Mobel Unique' dans layout.tsx
- scroll-padding-top: var(--header-height) dans globals.css — 64px reserve
- motion@12 (motion/react) pour animations Framer Motion
- lucide-react@1.7.0 pour icones
- Logo swap conditionnel blanc/noir via next/image

Decisions v8.0 :

- Modal large configurateur (pas de section separee) — 90vw desktop, plein ecran mobile
- Server/Client boundary : CatalogueSection (Server) fetch Supabase, CatalogueClient (Client) gere etat local
- Zustand reserve pour M009+ quand le configurateur reel devra consommer selectedProduct a distance
- next.config.ts remotePatterns : blocker absolu a traiter en tout premier (Phase 4)
- Pas de pagination — scalable pour 20-30 produits avec filtre memoire
- [Phase 04-01]: remotePatterns **.supabase.co double wildcard — evite hardcode project ref Supabase
- [Phase 04-01]: getPrimaryImage prioritise view_type 3/4, fallback model_images[0] — robuste meme sans sort_order
- [Phase 04-01]: Intl.NumberFormat('fr-FR') natif pour prix — zero librairie externe
- [Phase 04]: Fetch Supabase direct dans CatalogueSection (pas via /api/models) — meme processus Node, zero aller-retour HTTP
- [Phase 04]: HomePage reste synchrone — seul CatalogueSection suspend, Header/Hero/HowItWorks s'affichent immediatement

### Pending Todos

Aucun.

### Blockers/Concerns

- [Phase 4] Verifier le nom exact du champ prix dans src/types/database.ts (base_price vs price)
- [Phase 4] Verifier que GET /api/models retourne bien model_images pour alimenter les cards
- [Phase 5] Swatches miniatures : verifier si API retourne les tissus lies au modele (hors scope v8.0 MVP)
- [Phase 6] iOS Safari body scroll lock : requiert test sur appareil physique (pas simulateur)

## Session Continuity

Last session: 2026-03-28T06:23:15.384Z
Stopped at: Completed 04-02-PLAN.md — CatalogueSection + CatalogueClient + integration page.tsx
Resume file: None
