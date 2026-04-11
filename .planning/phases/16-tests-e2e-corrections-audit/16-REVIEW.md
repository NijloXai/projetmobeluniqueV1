---
phase: 16-tests-e2e-corrections-audit
reviewed: 2026-04-11T14:32:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - .gitignore
  - e2e/admin.spec.ts
  - e2e/auth.setup.ts
  - e2e/fixtures/axe.ts
  - e2e/public.spec.ts
  - knip.json
  - next.config.ts
  - package.json
  - playwright.config.ts
  - src/app/admin/(protected)/produits/IAGenerationSection.tsx
  - src/app/api/admin/fabrics/[id]/route.ts
  - src/app/api/admin/generate-all/route.ts
  - src/app/api/admin/generate/route.ts
  - src/app/api/admin/models/[id]/images/route.ts
  - src/app/api/admin/models/[id]/route.ts
  - src/app/api/admin/models/[id]/visuals/route.ts
  - src/app/api/admin/visuals/[id]/publish/route.ts
  - src/app/api/admin/visuals/[id]/validate/route.ts
  - src/app/api/admin/visuals/bulk-publish/route.ts
  - src/app/api/admin/visuals/bulk-validate/route.ts
  - src/app/api/simulate/route.ts
  - src/components/public/Catalogue/ConfiguratorModal.module.css
  - src/components/public/Catalogue/ConfiguratorModal.tsx
  - src/lib/ai/index.ts
  - src/lib/ai/nano-banana.ts
  - src/lib/schemas.ts
  - src/types/database.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 16 : Code Review Report

**Reviewed:** 2026-04-11T14:32:00Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

La review couvre les tests E2E Playwright (4 fichiers), la configuration Playwright, les routes API admin (11 fichiers), le service IA Nano Banana, le composant ConfiguratorModal, les schemas Zod, et les types database.

Points forts : architecture solide avec auth guard systematique (`requireAdmin()`), validation Zod sur tous les endpoints, schemas partages front/back, nettoyage storage avant suppression BDD, gestion d'erreurs exhaustive dans le service IA avec retry exponentiel.

Problemes identifies : une CSP trop permissive avec `unsafe-eval` et `unsafe-inline`, un rate-limit IP qui extrait le mauvais octet de `x-forwarded-for`, des credentials de fallback en dur dans le setup E2E, et un risque de fuite d'Object URLs dans le composant ConfiguratorModal.

## Critical Issues

### CR-01: CSP `unsafe-eval` et `unsafe-inline` dans script-src

**File:** `next.config.ts:30`
**Issue:** La Content-Security-Policy inclut `'unsafe-eval'` et `'unsafe-inline'` dans la directive `script-src`. Cela annule la quasi-totalite de la protection CSP contre les attaques XSS. `unsafe-eval` permet a un attaquant d'executer du code arbitraire via `eval()`, `setTimeout(string)`, etc. `unsafe-inline` permet l'injection de scripts inline.
**Fix:** Remplacer par des nonces dynamiques ou un hash. Si Next.js impose `unsafe-inline` en dev, ne l'appliquer qu'en dev. Pour la production, utiliser les nonces fournis par Next.js 16 :
```typescript
// next.config.ts — production-safe CSP
"script-src 'self' 'nonce-${nonce}'",
// Si Next.js necessite eval en dev seulement :
...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : []),
```
Note : si `unsafe-eval` est requis par Next.js en production (certaines versions le demandent pour les Server Components), documenter cette contrainte explicitement et prevoir une migration vers des nonces quand le support sera complet.

## Warnings

### WR-01: Rate-limit IP extraction utilise le dernier element de x-forwarded-for

**File:** `src/app/api/simulate/route.ts:49`
**Issue:** Le code extrait l'IP via `.split(',').at(-1)` (le dernier element). Or, dans `x-forwarded-for`, le dernier element est le proxy le plus recent (le plus proche du serveur), pas l'IP du client original. Derriere un CDN/reverse proxy (Vercel), le dernier element est souvent le proxy Vercel lui-meme, ce qui signifie que tous les utilisateurs partagent la meme IP pour le rate-limit, rendant celui-ci inefficace.
**Fix:**
```typescript
const ip =
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  '127.0.0.1'
```
Note : sur Vercel, `x-real-ip` est deja l'IP client. L'utiliser en priorite peut etre plus fiable que parser `x-forwarded-for`.

### WR-02: Credentials de fallback en dur dans auth.setup.ts

**File:** `e2e/auth.setup.ts:9-14`
**Issue:** Le fichier de setup contient un email (`admin@test.mobelunique.fr`) et un mot de passe (`test-admin-secure-2024!`) en fallback quand les variables d'environnement ne sont pas definies. Meme si ce sont des credentials de test, leur presence dans le code source commite pose un risque : si ces credentials sont identiques a ceux d'un environnement staging/preview, ils seraient exposes publiquement.
**Fix:** Supprimer les fallbacks et rendre les variables d'environnement obligatoires :
```typescript
const email = process.env.TEST_ADMIN_EMAIL
const password = process.env.TEST_ADMIN_PASSWORD
if (!email || !password) {
  throw new Error('TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD doivent etre definis dans .env.test.local')
}
await page.getByLabel('Email').fill(email)
await page.getByLabel('Mot de passe').fill(password)
```

### WR-03: Fuite potentielle d'Object URLs dans ConfiguratorModal

**File:** `src/components/public/Catalogue/ConfiguratorModal.tsx:100-103`
**Issue:** Dans le `useEffect` qui reset l'etat quand `model.id` change (ligne 91-119), `previewUrl` et `resultBlobUrl` sont utilisees dans le cleanup mais ne sont PAS dans le tableau de dependances (volontairement, via eslint-disable). Cela signifie que les valeurs capturees par la closure sont potentiellement perimees. Si l'utilisateur change rapidement de modele, des Object URLs intermediaires ne seront jamais revoquees, causant une fuite memoire (le blob reste en memoire jusqu'au rechargement de page).
**Fix:** Utiliser des refs pour tracker les URLs a revoquer, ou deplacer le cleanup dans un effet separe :
```typescript
const previewUrlRef = useRef<string | null>(null)
// Mettre a jour la ref quand previewUrl change
useEffect(() => { previewUrlRef.current = previewUrl }, [previewUrl])
// Dans le cleanup du model.id effect :
if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
```

### WR-04: Duplicate fileInputRef dans ConfiguratorModal

**File:** `src/components/public/Catalogue/ConfiguratorModal.tsx:685-692`
**Issue:** Le composant declare un seul `fileInputRef` (ligne 85) mais rend deux `<input type="file">` distincts : un dans le bloc `simulationState === 'idle'` (ligne 658) et un dans le bloc `simulationState === 'preview' || simulationState === 'error'` (ligne 685). La ref sera attachee au dernier rendu, donc dans l'etat `preview`/`error`, cliquer sur "Changer de photo" fonctionne, mais si on revient a `idle`, le `fileInputRef` pointe toujours sur l'ancien input (demonte). En pratique, cela fonctionne car un seul des deux blocs est rendu a la fois, mais c'est fragile.
**Fix:** Utiliser un seul `<input type="file">` place en dehors des blocs conditionnels :
```tsx
{/* Input file unique, hors des blocs conditionnels */}
<input
  ref={fileInputRef}
  type="file"
  accept="image/jpeg,image/png,image/heic,image/heif"
  className={styles.uploadHiddenInput}
  onChange={handleInputChange}
  aria-label="Selectionner une photo de votre salon"
/>
```

## Info

### IN-01: Eviction partielle du rate-limit map dans simulate/route.ts

**File:** `src/app/api/simulate/route.ts:21`
**Issue:** L'eviction des entrees expirees ne se declenche qu'au-dessus de 100 entrees (`rateMap.size > 100`), mais le commentaire mentionne un seuil de 1000. C'est une inconsistance mineure. De plus, sans Redis, cette map est par instance serverless — le rate-limit est inefficace en production Vercel (multi-instance). Le commentaire le mentionne correctement (ligne 12-13).
**Fix:** Harmoniser le commentaire avec le code (seuil 100, pas 1000). Pour un rate-limit efficace en production, migrer vers un store partage (Redis, KV Vercel).

### IN-02: `@types/archiver` dans dependencies au lieu de devDependencies

**File:** `package.json:22`
**Issue:** `@types/archiver` est un package de types TypeScript et devrait etre dans `devDependencies`, pas dans `dependencies`. Cela n'affecte pas le comportement en production (les types ne sont pas inclus dans le bundle), mais c'est une mauvaise categorisation.
**Fix:**
```bash
npm install --save-dev @types/archiver && npm uninstall @types/archiver
```

### IN-03: Tests E2E avec `test.skip(true, ...)` quand la DB est vide

**File:** `e2e/admin.spec.ts:69-71`, `e2e/public.spec.ts:106-108`
**Issue:** Plusieurs tests E2E skippent silencieusement quand la base de donnees est vide (pas de produits, pas de tissus). C'est un pattern acceptable pour des tests contre un environnement reel, mais cela signifie que sur un environment CI fresh, une portion significative des tests (workflow IA, configurateur, simulation) ne sera jamais executee. Cela reduit la couverture effective.
**Fix:** Documenter dans le README ou un fichier de setup CI que les tests E2E requierent un seed de donnees. Alternativement, ajouter un setup fixture Playwright qui cree les donnees necessaires via l'API admin avant les tests.

---

_Reviewed: 2026-04-11T14:32:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
