---
phase: 9
slug: navigation-angles
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react 16.3.2 |
| **Config file** | `vitest.config.ts` (racine projet) |
| **Quick run command** | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~1 seconde |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/ConfiguratorModal.test.tsx`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green + `npx tsc --noEmit`
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | CONF-06 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) | ⬜ pending |
| 09-01-02 | 01 | 1 | CONF-06 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) | ⬜ pending |
| 09-01-03 | 01 | 1 | CONF-06 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) | ⬜ pending |
| 09-01-04 | 01 | 1 | CONF-04 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) | ⬜ pending |
| 09-01-05 | 01 | 1 | CONF-06 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) | ⬜ pending |
| 09-01-06 | 01 | 1 | CONF-06 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) | ⬜ pending |
| 09-01-07 | 01 | 1 | D-07 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ (a enrichir) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Ajouter `describe('Phase 9 — navigation angles', ...)` dans `src/__tests__/ConfiguratorModal.test.tsx` avec fixtures multi-angles
- [ ] Ajouter fixtures: `mockModelMultiAngle` (3 model_images : 3/4, face, profil) + visuals correspondants

*Existing infrastructure covers framework — only test stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Crossfade animation ~200ms | D-06 | Animation visuelle non testable en JSDOM | Ouvrir le modal, selectionner un tissu, cliquer un thumbnail — verifier le fondu enchaine |
| Scroll horizontal thumbnails mobile | D-03 | Necessite viewport reel | Ouvrir en responsive 375px, verifier que les thumbnails scrollent horizontalement |
| Aspect-ratio 4/3 sans saut de layout | SC-2 | Layout visuel | Cliquer rapidement entre thumbnails — verifier que l'image ne saute pas |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
