---
phase: 6
slug: modal-configurateur-placeholder
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react 16.3.2 |
| **Config file** | `vitest.config.ts` (racine projet) |
| **Quick run command** | `npm test -- --reporter=verbose src/__tests__/ConfiguratorModal.test.tsx` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose src/__tests__/ConfiguratorModal.test.tsx`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 0 | MODAL-01, MODAL-02, MODAL-03 | unit | `npm test -- src/__tests__/ConfiguratorModal.test.tsx` | Non — Wave 0 | pending |
| 06-01-02 | 01 | 0 | MODAL-02 | unit | idem | Non — Wave 0 | pending |
| 06-01-03 | 01 | 1 | MODAL-01 | unit | idem | pending | pending |
| 06-01-04 | 01 | 1 | MODAL-02, MODAL-03 | unit | idem | pending | pending |
| 06-01-05 | 01 | 1 | MODAL-01 | unit | idem | pending | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/ConfiguratorModal.test.tsx` — stubs for MODAL-01, MODAL-02, MODAL-03
- [ ] Mock `HTMLDialogElement.showModal` / `close` dans `src/__tests__/setup.ts` (happy-dom ne supporte pas les methodes de dialog nativement)

```typescript
// Dans src/__tests__/setup.ts — a ajouter
HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) {
  this.setAttribute('open', '')
})
HTMLDialogElement.prototype.close = vi.fn(function(this: HTMLDialogElement) {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
})
```

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| iOS Safari scroll lock | MODAL-01 | Requiert appareil physique | Ouvrir modal sur iPhone, verifier que le body ne scroll pas |
| Focus trap avec lecteur ecran | MODAL-02 | Necessite VoiceOver/NVDA | Tab a travers les elements, verifier le cycle de focus |
| Rendu visuel 90vw / plein ecran | MODAL-01 | Verification visuelle | Ouvrir modal desktop (90vw) et mobile (plein ecran), verifier dimensions |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
