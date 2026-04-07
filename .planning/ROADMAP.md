# Roadmap: Mobel Unique

## Milestones

- **v7.0 Header + Hero + Comment ca marche** — Phases 1-3 (shipped 2026-03-27)
- **v8.0 Catalogue Produits** — Phases 4-6 (shipped 2026-03-29)
- **v9.0 Configurateur Tissu** — Phases 7-9 (shipped 2026-03-30)
- **v10.0 Simulation IA Salon** — Phases 10-12 (started 2026-04-07)

## Phases

<details>
<summary>v7.0 Header + Hero + Comment ca marche (Phases 1-3) -- SHIPPED 2026-03-27</summary>

- [x] Phase 1: Fondation + Header (1/1 plans) -- completed 2026-03-26
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

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Fondation + Header | v7.0 | 1/1 | Complete | 2026-03-26 |
| 2. Hero plein ecran | v7.0 | 1/1 | Complete | 2026-03-26 |
| 3. HowItWorks + assemblage | v7.0 | 1/1 | Complete | 2026-03-26 |
| 4. Prerequis + Catalogue core | v8.0 | 2/2 | Complete | 2026-03-28 |
| 5. Recherche et etats interactifs | v8.0 | 2/2 | Complete | 2026-03-29 |
| 6. Modal configurateur placeholder | v8.0 | 1/1 | Complete | 2026-03-29 |
| 7. Fetch donnees + cablage props | v9.0 | 1/1 | Complete | 2026-03-29 |
| 8. Configurateur core | v9.0 | 1/1 | Complete | 2026-03-29 |
| 9. Navigation angles | v9.0 | 1/1 | Complete | 2026-03-30 |
| 10. Dette technique v9.0 | v10.0 | 0/0 | Complete (pre-resolved) | 2026-04-07 |

---

## v10.0 Simulation IA Salon (Phases 10-12)

### Phase 10: Dette technique v9.0

**Goal:** Corriger la dette technique v9.0 : VERIFICATION.md Phase 8, test D-15 useRef, ProductCard.onConfigure required, getPrimaryImage/formatPrice dupliques.
**Requirements:** TBD
**Plans:** 0 plans -- pre-resolved by commit edf5080
*Promoted from backlog 999.1*
**Status:** Complete -- all items resolved prior to phase start (2026-04-07)

| Item | Resolution |
|------|-----------|
| VERIFICATION.md Phase 8 | Created, 7/7 passed |
| test D-15 useRef | Implemented + test green |
| ProductCard.onConfigure | Correct, always passed |
| getPrimaryImage/formatPrice | Extracted to utils.ts |

### Phase 11: Simulation IA -- Upload et traitement

**Goal:** Upload photo salon par l'utilisateur, envoi au service IA pour simulation du canape configure dans l'environnement.
**Requirements:** SIM-01
**Plans:** 2/2 plans complete

Plans:
- [x] 11-01-PLAN.md -- API simulate: fabric_id optionnel + MAX_FILE_SIZE 15 Mo + HEIC error handling
- [x] 11-02-PLAN.md -- Client: etape simulation dans ConfiguratorModal (DnD, preview, progression, abort)

### Phase 12: Simulation IA -- Affichage resultat et partage

**Goal:** Affichage du rendu simulation IA dans le modal, options de telechargement/partage.
**Depends on:** Phase 11
**Requirements:** SIM-01
**Plans:** 1/1 plans complete

Plans:
- [x] 12-01-PLAN.md -- Affichage resultat IA + boutons telecharger/partager/commander/relancer

---

## Backlog

_(vide)_

---
*Roadmap created: 2026-03-26*
*v7.0 shipped: 2026-03-27*
*v8.0 shipped: 2026-03-29*
*v9.0 shipped: 2026-03-30*
*v10.0 started: 2026-04-07*
