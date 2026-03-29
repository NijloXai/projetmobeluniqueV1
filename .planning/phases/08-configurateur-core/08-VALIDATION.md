---
phase: 8
slug: configurateur-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + @testing-library/react |
| **Config file** | `vitest.config.ts` (racine projet) |
| **Setup file** | `src/__tests__/setup.ts` |
| **Quick run command** | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/ConfiguratorModal.test.tsx`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green + `npx tsc --noEmit` propre
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 0 | CONF-02, CONF-03, CONF-05, CONF-07, CONF-08, CONF-09, CONF-10 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | CONF-01 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (enrichir) | ⬜ pending |
| 08-01-03 | 01 | 1 | CONF-02 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | CONF-03 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-05 | 01 | 1 | CONF-05 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-06 | 01 | 1 | CONF-07, CONF-08 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-07 | 01 | 1 | CONF-09, CONF-10 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending / ✅ green / ❌ red / ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/ConfiguratorModal.test.tsx` — ajouter describe "Phase 8 — configurateur" avec stubs pour CONF-02, CONF-03, CONF-05, CONF-07, CONF-08, CONF-09, CONF-10
- [ ] Mettre a jour les tests placeholder existants (MODAL-03) qui seront remplaces

*Existing infrastructure (Vitest + testing-library) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swatch visuellement distinct (bordure primary) | CONF-02 | CSS visual feedback | Ouvrir modal, cliquer swatch, verifier bordure orange |
| Badge "Premium" visible et positionne | CONF-03 | CSS positionnement | Ouvrir modal avec tissu premium, verifier badge en bas a droite du swatch |
| Badge "Photo originale" visible | CONF-05 | CSS positionnement | Ouvrir modal, selectionner tissu sans rendu, verifier badge sur image |
| Transition image instantanee sans saut | CONF-02 | Layout visual | Cliquer plusieurs swatches rapidement, verifier absence de layout shift |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
