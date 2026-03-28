---
phase: 4
slug: prerequis-catalogue-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react 16.3.2 + happy-dom |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | TECH-01 | config | `npx vitest run` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | CAT-01 | component | `npx vitest run` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | CAT-02 | component | `npx vitest run` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | CAT-03 | component | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for ProductCard component
- [ ] Test stubs for CatalogueClient component
- [ ] Test stubs for ProductCardSkeleton component
- [ ] Test for next.config.ts remotePatterns configuration

*Existing Vitest infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive grid 1/2/3 cols | CAT-02 | CSS Grid breakpoints need visual check | Resize browser at 640/1024px breakpoints |
| Skeleton shimmer animation | CAT-03 | CSS animation needs visual check | Add loading delay, verify shimmer visible |
| Image display from Supabase | TECH-01 | External URL rendering | Check images load in browser devtools |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
