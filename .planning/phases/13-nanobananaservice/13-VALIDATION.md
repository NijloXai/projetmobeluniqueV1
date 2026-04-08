---
phase: 13
slug: nanobananaservice
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | IA-01 | — | Gemini called with retry on 429 | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | IA-02 | — | addWatermark returns JPEG buffer with overlay | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | IA-03 | — | IMAGE_SAFETY returns explicit error | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-04 | 01 | 1 | IA-05 | — | PNG→JPEG conversion | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ W0 | ⬜ pending |
| 13-01-05 | 01 | 1 | IA-07 | — | Two image paths (URL + data URI) | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | IA-04 | — | Simulate image resized to max 1024px | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 1 | IA-06 | — | maxDuration exported on all 3 routes | smoke | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/nano-banana.test.ts` — stubs for IA-01 to IA-07 with `vi.mock('@google/genai')`

*Existing Vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| maxDuration effective on Vercel | IA-06 | Only enforced in deployed environment, not dev | Deploy to Vercel preview, run generate-all with 4+ angles |
| Rate-limit Map persistence | D-04 | Depends on serverless warm instance | Send 6 requests in 60s to /api/simulate on deployed env |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
