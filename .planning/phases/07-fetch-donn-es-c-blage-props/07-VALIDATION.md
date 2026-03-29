---
phase: 7
slug: fetch-donn-es-c-blage-props
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-29
audited: 2026-03-29
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react 16.3.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/CatalogueClient.test.tsx src/__tests__/ConfiguratorModal.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/CatalogueClient.test.tsx src/__tests__/ConfiguratorModal.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | D-09 | unit | `npx vitest run src/__tests__/isActiveFilter.test.ts` | ✅ | ✅ green |
| 07-01-02 | 01 | 1 | CONF-01 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ | ✅ green |
| 07-01-03 | 01 | 1 | CONF-02 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ | ✅ green |
| 07-01-04 | 01 | 1 | CONF-04 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ | ✅ green |
| 07-01-05 | 01 | 1 | CONF-05 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ | ✅ green |
| 07-01-06 | 01 | 1 | CONF-07 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ | ✅ green |
| 07-01-07 | 01 | 1 | CONF-08 | unit | `npx vitest run src/__tests__/ConfiguratorModal.test.tsx` | ✅ | ✅ green |
| 07-01-08 | 01 | 1 | CONF-09 | unit | `npx vitest run` | ✅ | ✅ green |
| 07-01-09 | 01 | 1 | CONF-10 | unit | `npx vitest run` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/__tests__/isActiveFilter.test.ts` — test unitaire dedie : logique pure filtrage is_active (7 tests)
- [x] `src/__tests__/CatalogueClient.test.tsx` — etendu avec fabrics/visuals props (24 tests)
- [x] `src/__tests__/ConfiguratorModal.test.tsx` — etendu avec fabrics/visuals props acceptance (23 tests)

*Existing infrastructure covers most phase requirements — Wave 0 extends existing test files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Promise.all parallelisme | SC-1 | Server Component fetch non testable en unit | Verifier via `npx tsc --noEmit` que CatalogueSection utilise Promise.all |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-03-29 — 94/94 tests verts (suite complete)
