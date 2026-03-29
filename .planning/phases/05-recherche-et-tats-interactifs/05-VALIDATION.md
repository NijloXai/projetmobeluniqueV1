---
phase: 5
slug: recherche-et-tats-interactifs
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-29
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react + @testing-library/user-event |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SRCH-01 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ | ✅ green |
| 05-01-02 | 01 | 1 | SRCH-01 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ | ✅ green |
| 05-01-03 | 01 | 1 | SRCH-02 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ | ✅ green |
| 05-01-04 | 01 | 1 | SRCH-02 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ | ✅ green |
| 05-01-05 | 01 | 1 | CAT-04 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ | ✅ green |
| 05-01-06 | 01 | 1 | CAT-04 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/__tests__/CatalogueClient.test.tsx` — SRCH-01, SRCH-02, CAT-04 test cases added (6 core + 5 edge cases = 11 new tests)
- [x] `@testing-library/user-event@14.6.1` installed and verified

*All Wave 0 requirements complete.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Focus ring visible on search input | D-02 (UI-SPEC) | Visual CSS verification | Tab to search field, verify amber ring visible |
| Tonal layering on search field | D-02 (UI-SPEC) | Visual CSS verification | Verify #F6F3EF background, no borders |
| Responsive search field width | Claude's Discretion | Layout verification | Resize browser 320px-1280px, verify field adapts |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-29

---

## Validation Audit 2026-03-29

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Test coverage:** 18/18 tests green in `CatalogueClient.test.tsx` (58/58 suite complete)
**Requirements:** SRCH-01 (2 core + 2 edge), SRCH-02 (2 core), CAT-04 (2 core + 1 edge) — all COVERED
