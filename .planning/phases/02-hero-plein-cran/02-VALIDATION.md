---
phase: 02
slug: hero-plein-cran
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if installed) / manual verification |
| **Config file** | none — Phase 02 is UI-only, no unit test infra needed |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | HERO-01 | build | `npm run build` | ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | HERO-02 | build+type | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 02-01-03 | 01 | 1 | HERO-03 | build | `npm run build` | ✅ | ⬜ pending |
| 02-01-04 | 01 | 1 | HERO-04 | build+type | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install motion` — Framer Motion v12 for HERO-04 animation
- [ ] Verify `motion/react` import works with Next.js 16

*Existing TypeScript + build infrastructure covers all other requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero occupe 100svh | HERO-01 | Visual viewport check | Open browser, verify hero fills entire viewport height |
| Badge, H1, sous-titre, CTA visibles et centrés | HERO-02 | Visual layout check | Verify all elements are visible and centered in hero |
| Fade-in animation au chargement | HERO-04 | Visual animation check | Hard reload page, observe fade-in of hero content |
| Scroll indicator animé visible | HERO-03 | Visual animation check | Verify chevron bounce animation at bottom of hero |
| Scroll indicator fade-out | HERO-03 | Interaction check | Scroll down, verify indicator fades out |
| Responsive mobile | HERO-01/02 | Visual check | Resize to 375px, verify layout adapts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
