---
phase: 16
slug: tests-e2e-corrections-audit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.59.x (E2E) + Vitest 3.x (unit/integration) |
| **Config file** | `playwright.config.ts` (Wave 0 installs) + `vitest.config.ts` (exists) |
| **Quick run command** | `npx playwright test --reporter=list` |
| **Full suite command** | `npx playwright test && npm test && npx tsc --noEmit` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (type check corrections)
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| *Populated after plans are created* | | | | | | | | | |

---

## Wave 0 Requirements

- [ ] `playwright.config.ts` — Playwright config with webServer, projects, viewports
- [ ] `e2e/auth.setup.ts` — Auth setup project (admin login → storageState)
- [ ] `@playwright/test` + `@axe-core/playwright` — Install dependencies
- [ ] `.auth/` directory — For storageState files (gitignored)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual rendering quality | — | CSS changes require visual inspection | Review `<img>` → `<Image>` renders correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
