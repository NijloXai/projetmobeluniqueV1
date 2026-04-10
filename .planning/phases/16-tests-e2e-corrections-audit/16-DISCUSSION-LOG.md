# Phase 16: Tests E2E + Corrections Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 16-tests-e2e-corrections-audit
**Areas discussed:** Périmètre corrections, Données E2E, Config Playwright, Profondeur E2E

---

## Périmètre corrections

| Option | Description | Selected |
|--------|-------------|----------|
| P1 + P2 complet | 1 critical + 15 warnings corrigés. Couvre SC-4 + sécurité + qualité. P3 reporté. | |
| P1 + P2 + P3 (tout) | Les 74 findings corrigés. Codebase 100% propre en fin de v11.0. | ✓ |
| P1 + tsc seulement | Minimum pour SC-4 : security headers + 28 erreurs tsc. | |

**User's choice:** P1 + P2 + P3 — tout corriger
**Notes:** L'utilisateur veut un codebase propre pour la fin du milestone v11.0.

### Dépendances inutilisées

| Option | Description | Selected |
|--------|-------------|----------|
| Supprimer tout | 8 Radix UI + zustand + immer. Réinstalle si besoin en v12+. | ✓ |
| Garder Radix UI, supprimer zustand/immer | Radix dans le stack déclaré. | |
| Tout garder | Pas de changement dans package.json. | |

**User's choice:** Supprimer tout

### Images <img> vs next/image

| Option | Description | Selected |
|--------|-------------|----------|
| URLs définitives seulement | <Image> pour URLs Supabase. <img> pour blob/preview. | ✓ |
| Tout remplacer | next/image partout (peut nécessiter unoptimized). | |
| Claude décide | Évaluer au cas par cas. | |

**User's choice:** URLs définitives seulement

### Schemas Zod routes admin

| Option | Description | Selected |
|--------|-------------|----------|
| Ajouter Zod | Schemas dans schemas.ts pour routes POST admin. Plus robuste. | ✓ |
| Garder validation manuelle | Validation if/else existante correcte. | |
| Claude décide | Évaluer effort vs gain. | |

**User's choice:** Ajouter Zod

### Console.log → remplacement

| Option | Description | Selected |
|--------|-------------|----------|
| console.info | Garde métriques, satisfait ESLint. | ✓ |
| Supprimer | Pas de logs en prod. | |
| Claude décide | Évaluer au cas par cas. | |

**User's choice:** console.info

---

## Données E2E

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase CLI local | Pattern Phase 15.1 (Docker, seed SQL, env vars locales). | ✓ |
| Mock API routes | Intercepter fetch avec Playwright route.fulfill(). | |
| Env de staging dédié | Supabase branch ou projet de test distant. | |

**User's choice:** Supabase CLI local

### Provider IA en E2E

| Option | Description | Selected |
|--------|-------------|----------|
| Mock Sharp | NANO_BANANA_API_KEY non définie. Rapide, gratuit, déterministe. | ✓ |
| Vrai Gemini | NANO_BANANA_API_KEY définie. Réaliste mais lent et coûteux. | |

**User's choice:** Mock Sharp
**Notes:** L'utilisateur a d'abord demandé si l'API key était définie. Après explication du trade-off (5ms mock vs 5-30s réel), a choisi le mock.

---

## Config Playwright

### Serveur

| Option | Description | Selected |
|--------|-------------|----------|
| webServer auto | Playwright lance npm run dev automatiquement. | ✓ |
| Build + start | npm run build && npm start. Plus proche de la prod. | |
| Serveur externe | Dev server tourne séparément. | |

**User's choice:** webServer auto

### Auth admin

| Option | Description | Selected |
|--------|-------------|----------|
| globalSetup + storageState | Login une fois, cookies sauvegardés. Chaque test réutilise. | ✓ |
| Login par test | Chaque test commence par /admin/login. Plus isolé. | |
| Claude décide | Meilleure approche au jugement. | |

**User's choice:** globalSetup + storageState

### Navigateurs

| Option | Description | Selected |
|--------|-------------|----------|
| Chromium seul | Plus rapide, suffisant pour v11.0. | ✓ |
| Chromium + Firefox + WebKit | Cross-browser complet. 3x plus lent. | |

**User's choice:** Chromium seul

---

## Profondeur E2E

### Couverture

| Option | Description | Selected |
|--------|-------------|----------|
| Happy path + erreurs clés | 2 parcours + cas d'erreur critiques. | |
| Happy path strict | Seulement les success criteria. Minimum viable. | |
| Couverture complète | Happy path + erreurs + responsive + accessibilité. | ✓ |

**User's choice:** Couverture complète

### Responsive

| Option | Description | Selected |
|--------|-------------|----------|
| Desktop seulement | Un seul viewport 1280x720. | |
| Desktop + mobile | Deux viewports (1280x720 + 375x667). | ✓ |
| Claude décide | Évaluer selon l'effort. | |

**User's choice:** Desktop + mobile

### Accessibilité

| Option | Description | Selected |
|--------|-------------|----------|
| Basique | aria-labels, focus trap, navigation clavier. | |
| Audit axe-core | @axe-core/playwright WCAG automatisé. | ✓ |
| Claude décide | Évaluer le bon niveau. | |

**User's choice:** Audit axe-core

---

## Claude's Discretion

- Structure des fichiers E2E
- Détails du seed SQL
- Sélecteurs Playwright
- Ordre d'exécution des corrections
- Script npm d'orchestration

## Deferred Ideas

None — discussion stayed within phase scope
