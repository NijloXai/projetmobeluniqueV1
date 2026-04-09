---
phase: 14
slug: audit-code
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-09
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 (existing — regression only) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | AUDIT-01..04 | — | N/A | manual-only | N/A | N/A | pending |

*Status: pending*

**Note:** This phase produces a report (AUDIT.md), not functional code. Automated tests do not apply to the deliverable itself. Existing 161 Vitest tests serve as a regression net to verify audit tooling (ESLint, knip) does not break the codebase.

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AUDIT.md contains Security section with findings | AUDIT-01 | Report output, not code | Verify `grep "## Securite\|## Sécurité" AUDIT.md` returns match |
| AUDIT.md contains Performance section | AUDIT-02 | Report output, not code | Verify `grep "## Performance" AUDIT.md` returns match |
| AUDIT.md contains Dead Code section | AUDIT-03 | Report output, not code | Verify `grep "## Dead Code" AUDIT.md` returns match |
| AUDIT.md contains TypeScript section | AUDIT-04 | Report output, not code | Verify `grep "## TypeScript" AUDIT.md` returns match |
| All findings have fichier:ligne format | AUDIT-01..04 | Format validation | Verify findings match pattern `src/.*:\d+` |
| All findings have severity level | AUDIT-01..04 | Format validation | Verify each finding has Critical/Warning/Info |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
