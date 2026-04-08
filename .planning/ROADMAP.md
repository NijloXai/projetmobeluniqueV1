# Roadmap: Mobel Unique

## Milestones

- **v7.0 Header + Hero + Comment ca marche** — Phases 1-3 (shipped 2026-03-27)
- **v8.0 Catalogue Produits** — Phases 4-6 (shipped 2026-03-29)
- **v9.0 Configurateur Tissu** — Phases 7-9 (shipped 2026-03-30)
- **v10.0 Simulation IA Salon** — Phases 10-12 (shipped 2026-04-07)
- **v11.0 Intégration IA Réelle + Audit Qualité** — Phases 13-16 (in progress)

## Phases

<details>
<summary>v7.0 Header + Hero + Comment ca marche (Phases 1-3) -- SHIPPED 2026-03-27</summary>

- [x] Phase 1: Fondation + Header (2/2 plans) -- completed 2026-03-26
- [x] Phase 2: Hero plein ecran (1/1 plans) -- completed 2026-03-26
- [x] Phase 3: HowItWorks + assemblage (1/1 plans) -- completed 2026-03-26

</details>

<details>
<summary>v8.0 Catalogue Produits (Phases 4-6) -- SHIPPED 2026-03-29</summary>

- [x] Phase 4: Prerequis + Catalogue core (2/2 plans) -- completed 2026-03-28
- [x] Phase 5: Recherche et etats interactifs (2/2 plans) -- completed 2026-03-29
- [x] Phase 6: Modal configurateur placeholder (1/1 plans) -- completed 2026-03-29

</details>

<details>
<summary>v9.0 Configurateur Tissu (Phases 7-9) -- SHIPPED 2026-03-30</summary>

- [x] Phase 7: Fetch donnees + cablage props (1/1 plans) -- completed 2026-03-29
- [x] Phase 8: Configurateur core (1/1 plans) -- completed 2026-03-29
- [x] Phase 9: Navigation angles (1/1 plans) -- completed 2026-03-30

</details>

<details>
<summary>v10.0 Simulation IA Salon (Phases 10-12) -- SHIPPED 2026-04-07</summary>

- [x] Phase 10: Dette technique v9.0 (0/0 plans, pre-resolved) -- completed 2026-04-07
- [x] Phase 11: Simulation IA Upload (2/2 plans) -- completed 2026-04-07
- [x] Phase 12: Simulation IA Affichage (1/1 plans) -- completed 2026-04-07

</details>

### v11.0 Intégration IA Réelle + Audit Qualité (In Progress)

**Milestone Goal:** Remplacer le mock Sharp par Nano Banana 2 (Gemini) sur toute la chaîne IA, auditer l'ensemble du projet, et établir un filet de tests unitaires + E2E.

- [x] **Phase 13: NanoBananaService** - Implémentation réelle du service IA Gemini avec retry, timeout, et deux chemins d'entrée image (completed 2026-04-08)
- [ ] **Phase 14: Audit Code** - Audit complet du projet (sécurité, performance, dead code, bonnes pratiques)
- [ ] **Phase 15: Tests Unitaires Vitest** - Couverture tests unitaires et intégration (NanoBanana, utils, routes)
- [ ] **Phase 16: Tests E2E + Corrections Audit** - Tests Playwright flux complets et corrections des problèmes identifiés

## Phase Details

### Phase 13: NanoBananaService
**Goal**: Le service IA réel Nano Banana 2 remplace le mock Sharp sur toute la chaîne de génération
**Depends on**: Phase 12 (v10.0 complete)
**Requirements**: IA-01, IA-02, IA-03, IA-04, IA-05, IA-06, IA-07
**Success Criteria** (what must be TRUE):
  1. Quand NANO_BANANA_API_KEY est définie, generate() appelle Gemini (pas Sharp mock) et retourne un buffer JPEG valide
  2. Une image simulate est redimensionnée à max 1024px avant envoi — Gemini ne reçoit jamais de payload > 20 Mo
  3. Un appel Gemini qui retourne 429 est automatiquement retenté (1s → 2s → 4s) sans erreur visible côté client
  4. Un finishReason IMAGE_SAFETY retourne une erreur explicite sans crash (pas d'accès à parts[0].inlineData.data)
  5. La route generate-all ne timeout pas sur Vercel (maxDuration = 300 exporté)
**Plans**: 2 plans

Plans:
- [x] 13-01-PLAN.md — NanoBananaService core (generate + addWatermark + retry + Gemini SDK)
- [x] 13-02-PLAN.md — Adaptation routes (maxDuration + rate-limit + resize + error handling)

### Phase 14: Audit Code
**Goal**: Les problèmes de sécurité, performance, dead code, et bonnes pratiques sont identifiés et documentés
**Depends on**: Phase 13
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04
**Success Criteria** (what must be TRUE):
  1. Un rapport d'audit liste tous les imports inutilisés, fichiers orphelins, et exports morts du projet
  2. Les failles de sécurité potentielles (validation inputs, auth bypass, XSS) sont identifiées avec niveau de sévérité
  3. Les requêtes N+1 et assets non optimisés sont identifiés avec impact estimé
  4. Les violations TypeScript strict (any implicites, error handling manquant) sont listées avec localisation fichier:ligne
**Plans**: TBD

### Phase 15: Tests Unitaires Vitest
**Goal**: Un filet de tests unitaires et d'intégration couvre NanoBananaService, les utils, et les routes critiques
**Depends on**: Phase 14
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. npm test passe au vert avec des tests NanoBananaService mockant @google/genai (retry, timeout, IMAGE_SAFETY, deux chemins image)
  2. Les utils slugify, calculatePrice, et extractStoragePath ont des tests couvrant les cas limites (accents, prix premium, chemins malformés)
  3. requireAdmin() retourne 401 sur token absent/expiré — vérifié par test d'intégration route
  4. La route simulate retourne 422 HEIC et 400 taille > 15 Mo — vérifié par test avec mock provider
**Plans**: TBD

### Phase 15.1: Tests Intégration Supabase (INSERTED)

**Goal:** [Urgent work - to be planned]
**Requirements**: TBD
**Depends on:** Phase 15
**Plans:** 2/2 plans complete

Plans:
- [ ] TBD (run /gsd-plan-phase 15.1 to break down)

### Phase 16: Tests E2E + Corrections Audit
**Goal**: Les parcours utilisateur critiques sont couverts par des tests E2E Playwright et les problèmes de l'audit sont corrigés
**Depends on**: Phase 15
**Requirements**: E2E-01, E2E-02, E2E-03, FIX-01
**Success Criteria** (what must be TRUE):
  1. npx playwright test passe au vert — setup auth admin globaleSetup inclus
  2. Le parcours public catalogue → configurateur → simulation (mock provider) s'exécute sans erreur E2E
  3. Le parcours admin generate → validate → publish s'exécute sans erreur E2E
  4. Les corrections appliquées depuis l'audit font passer npm run build et npx tsc --noEmit sans erreur
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Fondation + Header | v7.0 | 2/2 | Complete | 2026-03-26 |
| 2. Hero plein ecran | v7.0 | 1/1 | Complete | 2026-03-26 |
| 3. HowItWorks + assemblage | v7.0 | 1/1 | Complete | 2026-03-26 |
| 4. Prerequis + Catalogue core | v8.0 | 2/2 | Complete | 2026-03-28 |
| 5. Recherche et etats interactifs | v8.0 | 2/2 | Complete | 2026-03-29 |
| 6. Modal configurateur placeholder | v8.0 | 1/1 | Complete | 2026-03-29 |
| 7. Fetch donnees + cablage props | v9.0 | 1/1 | Complete | 2026-03-29 |
| 8. Configurateur core | v9.0 | 1/1 | Complete | 2026-03-29 |
| 9. Navigation angles | v9.0 | 1/1 | Complete | 2026-03-30 |
| 10. Dette technique v9.0 | v10.0 | 0/0 | Complete (pre-resolved) | 2026-04-07 |
| 11. Simulation IA Upload | v10.0 | 2/2 | Complete | 2026-04-07 |
| 12. Simulation IA Affichage | v10.0 | 1/1 | Complete | 2026-04-07 |
| 13. NanoBananaService | v11.0 | 2/2 | Complete   | 2026-04-08 |
| 14. Audit Code | v11.0 | 0/? | Not started | - |
| 15. Tests Unitaires Vitest | v11.0 | 0/? | Not started | - |
| 16. Tests E2E + Corrections Audit | v11.0 | 0/? | Not started | - |

---
*Roadmap created: 2026-03-26*
*v7.0 shipped: 2026-03-27*
*v8.0 shipped: 2026-03-29*
*v9.0 shipped: 2026-03-30*
*v10.0 shipped: 2026-04-07*
*v11.0 started: 2026-04-08*
