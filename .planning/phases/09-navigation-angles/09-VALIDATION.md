---
phase: 9
slug: navigation-angles
status: approved
nyquist_compliant: true
wave_0_complete: true
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Test ID | Status |
|---------|------|------|-------------|-----------|-------------------|---------|--------|
| 09-01-01 | 01 | 1 | CONF-06 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | CONF-06a | ✅ green |
| 09-01-02 | 01 | 1 | CONF-06 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | CONF-06b | ✅ green |
| 09-01-03 | 01 | 1 | CONF-06 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | CONF-06c | ✅ green |
| 09-01-04 | 01 | 1 | CONF-04 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | CONF-04 | ✅ green |
| 09-01-05 | 01 | 1 | CONF-06 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | CONF-06d, CONF-06e | ✅ green |
| 09-01-06 | 01 | 1 | CONF-06 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | D-11, D-12, D-16 | ✅ green |
| 09-01-07 | 01 | 1 | D-07 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | D-07 | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Requirement Coverage

| Requirement | Test IDs | Status |
|-------------|----------|--------|
| CONF-04 | CONF-04 | COVERED |
| CONF-06 | CONF-06a, CONF-06b, CONF-06c, CONF-06d, CONF-06e | COVERED |
| D-07 | D-07 | COVERED |
| D-11 | D-11 | COVERED |
| D-12 | D-12 | COVERED |
| D-16 | D-16 | COVERED |

---

## Wave 0 Requirements

- [x] `describe('Phase 9 — navigation angles', ...)` dans `src/__tests__/ConfiguratorModal.test.tsx`
- [x] Fixtures: `mockModelMultiAngle` (3 model_images : 3/4, face, profil) + visuals correspondants

*Wave 0 complete — all test stubs created during execution.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Crossfade animation ~200ms | D-06 | Animation visuelle non testable en JSDOM | Ouvrir le modal, selectionner un tissu, cliquer un thumbnail — verifier le fondu enchaine |
| Scroll horizontal thumbnails mobile | D-03 | Necessite viewport reel | Ouvrir en responsive 375px, verifier que les thumbnails scrollent horizontalement |
| Aspect-ratio 4/3 sans saut de layout | SC-2 | Layout visuel | Cliquer rapidement entre thumbnails — verifier que l'image ne saute pas |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-30

---

## Validation Audit 2026-03-30

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Manual-only | 3 |
| Total tests | 10 (Phase 9 describe) |
| Suite total | 45 (all phases) |
