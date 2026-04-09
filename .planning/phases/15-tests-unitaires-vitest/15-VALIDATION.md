---
phase: 15
slug: tests-unitaires-vitest
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | TEST-01 | — | N/A | unit | `npm test` | ✅ | ⬜ pending |
| 15-01-02 | 01 | 1 | TEST-02 | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |
| 15-01-03 | 01 | 1 | TEST-03 | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |
| 15-01-04 | 01 | 1 | TEST-04 | — | N/A | unit | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/utils.test.ts` — stubs for TEST-02
- [ ] `src/__tests__/require-admin.test.ts` — stubs for TEST-03

*Existing infrastructure (vitest.config.ts, setup.ts) covers all phase requirements.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
