---
phase: 03
slug: howitworks-assemblage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --reporter=verbose src/components/public/HowItWorks` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/components/public/HowItWorks`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | STEP-01, STEP-02, STEP-03 | unit | `npm test -- src/components/public/HowItWorks` | Wave 0 | pending |
| 03-01-02 | 01 | 1 | STEP-01 | unit | `npm test -- src/components/public/HowItWorks` | Wave 0 | pending |
| 03-01-03 | 01 | 1 | STEP-02 | unit | `npm test -- src/components/public/HowItWorks` | Wave 0 | pending |
| 03-01-04 | 01 | 1 | STEP-03 | unit | `npm test -- src/components/public/HowItWorks` | Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/components/public/HowItWorks/__tests__/HowItWorks.test.tsx` — stubs for STEP-01, STEP-02, STEP-03

*Existing infrastructure covers framework needs — vitest + testing-library + happy-dom already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Animation stagger au scroll | STEP-03 | IntersectionObserver mock limité — animation visuelle nécessite vérification visuelle | Scroller la page, vérifier que les 3 cards apparaissent avec 100ms de décalage |
| Responsive 1 col → 3 col | STEP-02 | CSS media queries non testables dans happy-dom | Redimensionner le navigateur entre mobile et desktop |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
