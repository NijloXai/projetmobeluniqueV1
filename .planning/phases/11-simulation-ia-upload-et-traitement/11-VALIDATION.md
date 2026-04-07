---
phase: 11
slug: simulation-ia-upload-et-traitement
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existant) ou tests manuels |
| **Config file** | vitest.config.ts (si existant) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | SIM-01 | — | File size <= 15Mo validated client-side | manual | Browser test | N/A | ⬜ pending |
| 11-01-02 | 01 | 1 | SIM-01 | — | MIME type validated client-side | manual | Browser test | N/A | ⬜ pending |
| 11-01-03 | 01 | 1 | SIM-01 | — | FormData sent with AbortController | integration | `npx tsc --noEmit` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework needed — TypeScript strict compilation + build validation is the primary automated check. Visual/interaction behaviors require manual browser testing.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag & drop zone highlights on dragover | SIM-01 | Visual interaction | Drag a file over the zone, verify highlight |
| Preview image displays after file selection | SIM-01 | Visual rendering | Select an image, verify preview appears |
| Progress bar animates during generation | SIM-01 | Animation timing | Click "Lancer", verify progress and steps |
| Cancel button aborts fetch | SIM-01 | Network behavior | Click "Annuler" during generation, verify abort |
| Error messages display inline | SIM-01 | Visual + UX | Upload a 20Mo file, verify error message |
| Mobile camera access | SIM-01 | Device-specific | Test on mobile, verify camera option appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
