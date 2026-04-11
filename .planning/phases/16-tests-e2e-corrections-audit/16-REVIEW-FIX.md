---
phase: 16-tests-e2e-corrections-audit
fixed_at: 2026-04-11T14:45:00Z
review_path: .planning/phases/16-tests-e2e-corrections-audit/16-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 16 : Code Review Fix Report

**Fixed at:** 2026-04-11T14:45:00Z
**Source review:** .planning/phases/16-tests-e2e-corrections-audit/16-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: CSP `unsafe-eval` et `unsafe-inline` dans script-src

**Files modified:** `next.config.ts`
**Commit:** 410fc67
**Applied fix:** Conditionne `unsafe-eval` et `unsafe-inline` dans `script-src` au mode development uniquement (requis par Turbopack HMR). En production, `script-src` se limite a `'self'`. La variable `isDev` est calculee a partir de `process.env.NODE_ENV` et utilisee pour construire la directive CSP dynamiquement. `style-src 'unsafe-inline'` est conserve car requis par Next.js (next/font inline styles).

### WR-01: Rate-limit IP extraction utilise le dernier element de x-forwarded-for

**Files modified:** `src/app/api/simulate/route.ts`
**Commit:** 4ca96ee
**Applied fix:** Remplace `.split(',').at(-1)` par `.split(',')[0]` pour extraire le premier element de `x-forwarded-for` (IP client originale) au lieu du dernier (proxy le plus proche du serveur). Le fallback `x-real-ip` et `127.0.0.1` sont conserves.

### WR-02: Credentials de fallback en dur dans auth.setup.ts

**Files modified:** `e2e/auth.setup.ts`
**Commit:** 7430eec
**Applied fix:** Supprime les credentials de fallback en dur (`admin@test.mobelunique.fr` / `test-admin-secure-2024!`). Les variables d'environnement `TEST_ADMIN_EMAIL` et `TEST_ADMIN_PASSWORD` sont desormais obligatoires avec un throw explicite et un message d'erreur clair si elles ne sont pas definies.

### WR-03: Fuite potentielle d'Object URLs dans ConfiguratorModal

**Files modified:** `src/components/public/Catalogue/ConfiguratorModal.tsx`
**Commit:** abd36b1
**Applied fix:** Ajoute `previewUrlRef` et `resultBlobUrlRef` (useRef) pour tracker les valeurs courantes des Object URLs. Deux useEffect de synchronisation maintiennent les refs a jour quand les states changent. Le cleanup dans le useEffect `[model?.id]` utilise desormais les refs (valeurs fraiches) au lieu des variables de closure (potentiellement perimes), eliminant la fuite memoire lors de changements rapides de modele.

### WR-04: Duplicate fileInputRef dans ConfiguratorModal

**Files modified:** `src/components/public/Catalogue/ConfiguratorModal.tsx`
**Commit:** c3ff8d5
**Applied fix:** Remplace les deux `<input type="file">` dupliques (un dans le bloc `idle`, un dans le bloc `preview/error`) par un seul element place en dehors des blocs conditionnels, directement dans `leftColumn`. Le `fileInputRef` est desormais toujours monte quand l'etape simulation est visible, independamment du `simulationState`.

## Skipped Issues

Aucun finding n'a ete ignore.

---

_Fixed: 2026-04-11T14:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
