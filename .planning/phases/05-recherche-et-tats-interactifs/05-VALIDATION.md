---
phase: 5
slug: recherche-et-tats-interactifs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react |
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
| 05-01-01 | 01 | 1 | SRCH-01 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ (new cases) | ⬜ pending |
| 05-01-02 | 01 | 1 | SRCH-01 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ (new cases) | ⬜ pending |
| 05-01-03 | 01 | 1 | SRCH-02 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ (new cases) | ⬜ pending |
| 05-01-04 | 01 | 1 | SRCH-02 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ (new cases) | ⬜ pending |
| 05-01-05 | 01 | 1 | CAT-04 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ (new cases) | ⬜ pending |
| 05-01-06 | 01 | 1 | CAT-04 | unit | `npx vitest run src/__tests__/CatalogueClient.test.tsx` | ✅ (new cases) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/CatalogueClient.test.tsx` — add SRCH-01, SRCH-02, CAT-04 test cases
- [ ] Verify `@testing-library/user-event` is available for input interactions

*Existing infrastructure covers framework and config — only new test cases needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Focus ring visible on search input | D-02 (UI-SPEC) | Visual CSS verification | Tab to search field, verify amber ring visible |
| Tonal layering on search field | D-02 (UI-SPEC) | Visual CSS verification | Verify #F6F3EF background, no borders |
| Responsive search field width | Claude's Discretion | Layout verification | Resize browser 320px-1280px, verify field adapts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
