# Phase 16: Tests E2E + Corrections Audit — Research

**Researched:** 2026-04-11
**Domain:** Playwright E2E, @axe-core/playwright, TypeScript strict fixes, Next.js security headers
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Corriger les 74 findings de AUDIT.md — P1 (1 critical), P2 (15 warnings), P3 (26 qualité). Aucun finding reporté.
- **D-02:** Supprimer toutes les dépendances inutilisées : 8 packages Radix UI + zustand + immer. Réinstaller si besoin en v12+.
- **D-03:** Remplacer `<img>` natif par `<Image>` next/image uniquement pour les URLs Supabase définitives. Garder `<img>` pour les blob URLs de preview (upload en cours).
- **D-04:** Ajouter des schemas Zod dans `src/lib/schemas.ts` pour les routes POST admin sans validation formelle (generate, generate-all, bulk-validate, bulk-publish, images, visuals, validate, publish).
- **D-05:** Remplacer `console.log` par `console.info` dans les routes et services IA.
- **D-06:** Supabase CLI local (Docker) pour les données de test E2E — réutilise le pattern Phase 15.1 (supabase start, seed SQL, env vars locales).
- **D-07:** Mock Sharp comme provider IA en E2E — NANO_BANANA_API_KEY non définie dans l'environnement de test.
- **D-08:** webServer auto dans `playwright.config.ts` — Playwright lance `npm run dev` automatiquement.
- **D-09:** globalSetup + storageState pour l'auth admin — sauvegarde dans `.auth/admin.json`.
- **D-10:** Chromium seul comme navigateur de test.
- **D-11:** Couverture complète : happy path + cas d'erreur + responsive + accessibilité.
- **D-12:** Deux viewports : desktop (1280x720) + mobile (375x667).
- **D-13:** Audit accessibilité via @axe-core/playwright (WCAG automatisé sur chaque page).

### Claude's Discretion
- Structure des fichiers E2E (e2e/ à la racine, organisation par parcours)
- Détails du seed SQL (nombre de modèles/tissus/images de test)
- Sélecteurs Playwright (data-testid vs rôles ARIA vs texte)
- Ordre d'exécution des corrections audit (P1 → P2 → P3 ou regroupé par fichier)
- Script npm pour orchestrer Supabase start + Playwright

### Deferred Ideas (OUT OF SCOPE)
Aucune — la discussion est restée dans le scope de la phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| E2E-01 | Setup Playwright (install, config, globalSetup auth admin) | Stack + Architecture Pattern (project dependencies) + Environment availability |
| E2E-02 | Parcours public catalogue → configurateur → simulation (mock provider) | Architecture Pattern (sélecteurs, webServer, seed data) + Code Examples |
| E2E-03 | Parcours admin generate → validate → publish | Architecture Pattern (storageState auth, admin routes) + Code Examples |
| FIX-01 | Corrections des problèmes identifiés par l'audit (74 findings) | Don't Hand-Roll (next/image), Common Pitfalls (tsc/ESLint status), Code Examples (security headers, Zod, CookieOptions) |
</phase_requirements>

---

## Summary

Cette phase couvre deux domaines orthogonaux : (1) mise en place de tests Playwright E2E sur les parcours utilisateur critiques, et (2) correction des 74 findings identifiés dans l'audit Phase 14.

Pour Playwright, le pattern moderne recommandé (v1.50+) remplace `globalSetup` par un **setup project** dans `playwright.config.ts` avec `dependencies`. Ce pattern est mieux intégré : le rapport HTML inclut le setup, les traces sont enregistrées, les fixtures sont disponibles. L'auth admin se fait via la page `/admin/login` réelle (UI login) ou via l'API Supabase directement — le résultat est sauvegardé dans `.auth/admin.json` et réutilisé via `storageState`.

Pour les corrections audit, la vérification `npx tsc --noEmit` retourne actuellement **0 erreur** (confirmé en session). Les problèmes TypeScript du rapport AUDIT.md Phase 14 ont été partiellement résolus par les phases intermédiaires (15, 15.1). Les problèmes restants sont ESLint (32 issues : 8 errors + 24 warnings) et knip (10 dépendances inutilisées + 6 exports/types morts). La correction principale se concentre sur les ESLint errors (bloquants pour le build strict), les security headers (SEC-01, critique), et le nettoyage des dépendances.

**Recommandation primaire :** Utiliser le pattern Playwright project dependencies (setup project + chromium project) avec `storageState`, `webServer` pointant sur `npm run dev`, et `@axe-core/playwright` intégré comme fixture partagée. Corriger les 74 findings dans l'ordre P1 → P2 → P3, en commençant par SEC-01 (security headers) et DEAD-10/DEAD-11 (ESLint errors bloquants).

---

## State of Current Codebase (Audit Delta)

**Vérification effectuée en session (2026-04-11) :**

| Outil | Status actuel | Rapport Phase 14 |
|-------|--------------|-----------------|
| `npx tsc --noEmit` | **0 erreur** (exit 0) | 28 erreurs TS |
| `npx eslint src/` | 32 problems (8 errors, 24 warnings) | 32 problems |
| `npx knip` | 10 deps inutiles, 6 exports/types morts | idem |

**Conséquence critique :** Les 28 erreurs TypeScript du rapport d'audit (TS-01 à TS-08) sont **déjà corrigées** dans le codebase actuel. Les phases 13/15/15.1 ont résolu ces problèmes. Le planner ne doit PAS créer de tâches pour corriger des erreurs tsc — elles n'existent plus.

Les ESLint errors (8 erreurs bloquantes pour le build strict) restent à corriger : DEAD-10 (`countUngenerated` non utilisé), DEAD-11 (vars mock `initial/animate/transition` non préfixées `_`).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | 1.59.1 | Framework E2E, test runner, assertions | Standard industrie Next.js E2E [VERIFIED: npm registry] |
| @axe-core/playwright | 4.11.1 | Audit WCAG automatisé dans les tests Playwright | Seule bibliothèque officielle pour accessibilité avec Playwright [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| playwright (browsers) | 1.59.1 | Navigateurs Chromium/Firefox/WebKit | Inclus avec @playwright/test, `npx playwright install chromium` |
| dotenv | 17.4.1 | Lecture des env vars dans playwright.config.ts | Déjà en devDependencies, réutilisé pour .env.test.local [VERIFIED: package.json] |

### Not Needed
| Instead of | Could Use | Reason NOT to Use |
|------------|-----------|-------------------|
| @playwright/test globalSetup | project dependencies | Pattern obsolète — project dependencies = HTML report inclus, fixtures disponibles, traçabilité meilleure [CITED: playwright.dev/docs/auth] |
| globalSetup.ts séparé | setup project + auth.setup.ts | Même raison — le setup project est le pattern moderne Playwright 1.42+ |

**Installation :**
```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium
```

**Vérification versions :**
```bash
npm view @playwright/test version   # 1.59.1 [VERIFIED: npm registry 2026-04-11]
npm view @axe-core/playwright version  # 4.11.1 [VERIFIED: npm registry 2026-04-11]
```

---

## Architecture Patterns

### Structure des fichiers E2E recommandée
```
e2e/
  auth.setup.ts           # Setup project — login admin une fois, save .auth/admin.json
  public.spec.ts          # Parcours public : catalogue → configurateur → simulation
  admin.spec.ts           # Parcours admin : generate → validate → publish
  fixtures/
    axe.ts                # Fixture partagée @axe-core/playwright
playwright.config.ts      # Config principale
playwright/.auth/         # Fichiers storageState (gitignored)
  admin.json
```

### Pattern 1: Project Dependencies pour l'auth (remplace globalSetup)

Le pattern moderne Playwright 1.42+ utilise un projet "setup" avec `testMatch` qui s'exécute avant les projets qui en dépendent. Mieux que `globalSetup` : inclus dans le rapport HTML, traces disponibles. [CITED: playwright.dev/docs/auth]

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/admin.json')

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Supabase local — évite les conflits de connexion
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // Next.js + Turbopack premier démarrage peut prendre > 60s
  },

  projects: [
    // Projet setup — s'exécute en premier, produit admin.json
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Projet chromium — dépend du setup, réutilise storageState pour les tests admin
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
  ],
})
```

**Note importante : `workers: 1`** — Supabase local a des limites de connexions. Avec plusieurs workers en parallèle, les tests d'intégration E2E peuvent échouer par saturation de pool PostgreSQL. Forcer `workers: 1` évite ce problème. [MEDIUM confidence — pattern observé pour Supabase + Playwright]

### Pattern 2: auth.setup.ts — Login admin via UI réelle

```typescript
// e2e/auth.setup.ts
// Source: playwright.dev/docs/auth
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../playwright/.auth/admin.json')

setup('authenticate admin', async ({ page }) => {
  await page.goto('/admin/login')

  // Remplir le formulaire (react-hook-form + Zod)
  await page.getByLabel('Email').fill(process.env.TEST_ADMIN_EMAIL ?? 'admin@test.mobelunique.fr')
  await page.getByLabel('Mot de passe').fill(process.env.TEST_ADMIN_PASSWORD ?? 'test-admin-secure-2024!')
  await page.getByRole('button', { name: /connexion/i }).click()

  // Attendre la redirection vers /admin
  await page.waitForURL('/admin', { timeout: 10_000 })

  // Sauvegarder les cookies Supabase JWT
  await page.context().storageState({ path: authFile })
})
```

**Pourquoi UI login plutôt qu'API directe :** La page `/admin/login` utilise `createClient()` browser → `signInWithPassword()` → cookies Supabase SSR (`sb-127-auth-token`). Simuler ce flow via UI garantit que les cookies sont exactement ceux que l'app produit. L'approche API directe (comme dans les tests d'intégration) bypasse le flow cookie Supabase et peut rater des refresh token flows. [ASSUMED — recommendation basée sur le pattern Playwright officiel]

### Pattern 3: Test admin avec storageState

```typescript
// e2e/admin.spec.ts
import { test, expect } from '@playwright/test'
import path from 'path'

// Utiliser le storageState admin pour ce fichier de test
test.use({ storageState: path.join(__dirname, '../playwright/.auth/admin.json') })

test('generate → validate → publish', async ({ page }) => {
  // Page admin produits
  await page.goto('/admin/produits')
  await expect(page.getByRole('heading', { name: /produits/i })).toBeVisible()

  // Naviguer vers un produit de test
  await page.getByRole('link', { name: /milano test/i }).click()
  // ... suite du parcours
})
```

### Pattern 4: Fixture @axe-core/playwright partagée

```typescript
// e2e/fixtures/axe.ts
// Source: playwright.dev/docs/accessibility-testing
import { test as base } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

type AxeFixture = { makeAxeBuilder: () => AxeBuilder }

export const test = base.extend<AxeFixture>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    await use(makeAxeBuilder)
  },
})

export { expect } from '@playwright/test'
```

**Usage dans les tests :**
```typescript
// e2e/public.spec.ts
import { test, expect } from './fixtures/axe'

test('accessibilité page accueil', async ({ page, makeAxeBuilder }) => {
  await page.goto('/')
  const results = await makeAxeBuilder().analyze()
  expect(results.violations).toEqual([])
})
```

### Pattern 5: Security headers dans next.config.ts (SEC-01 + SEC-10 + SEC-11)

```typescript
// next.config.ts — correction SEC-01, SEC-10, SEC-11
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval requis en dev Next.js
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' https://*.supabase.co data: blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

**Note CSP :** `'unsafe-eval'` est requis en développement Next.js (React DevTools). En production, Vercel peut utiliser des nonces pour plus de sécurité — mais pour v11.0, cette CSP sans nonce est acceptable. [CITED: nextjs.org/docs/app/guides/content-security-policy]

### Pattern 6: CookieOptions pour TS-07/TS-08 (@supabase/ssr)

```typescript
// src/lib/supabase/middleware.ts — correction TS-07
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Dans setAll :
setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    request.cookies.set(name, value)
    supabaseResponse.cookies.set(name, value, options)
  })
}
```

**Note :** `CookieOptions` est exporté directement depuis `@supabase/ssr`. [VERIFIED: WebSearch + @supabase/ssr 0.6.1 installé]

### Pattern 7: Viewport mobile dans les tests E2E

```typescript
// e2e/public.spec.ts — test responsive
const viewports = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 375, height: 667 },
]

for (const viewport of viewports) {
  test(`catalogue responsive — ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/')
    await expect(page.locator('[data-testid="catalogue-section"]')).toBeVisible()
  })
}
```

### Anti-Patterns à Éviter

- **`globalSetup: './e2e/global-setup.ts'`** : Pattern obsolète. Utiliser project dependencies à la place. Le global setup ne s'affiche pas dans le rapport HTML et les fixtures ne sont pas disponibles.
- **`page.waitForTimeout(2000)`** : Ne jamais utiliser des sleeps dans les tests Playwright. Utiliser `page.waitForURL()`, `page.waitForSelector()`, ou `expect(locator).toBeVisible()` qui attendent automatiquement.
- **Sélecteurs CSS fragiles** : Ne pas utiliser `.module-css-class`. Préférer `getByRole()`, `getByLabel()`, `getByText()`, ou `data-testid` comme dernier recours.
- **Tests qui modifient la même donnée en parallèle** : Avec `workers: 1`, ce risque est éliminé, mais garder en tête qu'un test admin qui génère un visuel peut affecter un autre test.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser à la place | Pourquoi |
|----------|-------------------|---------------------|----------|
| Audit WCAG automatisé | Scanner HTML custom | @axe-core/playwright | 57% des violations WCAG détectées automatiquement, règles WCAG 2.1 maintenues par Deque [CITED: playwright.dev/docs/accessibility-testing] |
| Gestion auth cookie dans les tests | Extraction manuelle des tokens JWT | page.context().storageState() | Playwright capture cookies + localStorage + IndexedDB — complet et résilient [CITED: playwright.dev/docs/auth] |
| Attente démarrage serveur | sleep(5000) en setup | webServer.url avec timeout | Playwright poll le serveur jusqu'à réponse HTTP 2xx/3xx — pas de sleep fragile [CITED: playwright.dev/docs/test-webserver] |
| Validation UUID custom | regex home-made dans les routes | z.string().uuid() dans le schema Zod | Zod valide le format UUID v4 correctement, intégré au pattern safeParse existant |
| Validation MIME custom | vérification extension fichier | image.type check + allowlist MIME | `image.type` est fourni par le browser/FormData, vérifier contre une allowlist suffit |

---

## Common Pitfalls

### Pitfall 1: Timeout webServer avec Turbopack (npm run dev)
**What goes wrong:** Playwright attend 60s (défaut) que le serveur réponde. Next.js + Turbopack prend parfois 30-90s au premier démarrage (compilation initiale).
**Why it happens:** Le `timeout` par défaut de `webServer` est 60_000ms. Turbopack compile les routes en lazy — la première requête peut prendre plus longtemps.
**How to avoid:** Mettre `timeout: 120_000` dans `webServer`. Ajouter `reuseExistingServer: !process.env.CI` pour réutiliser le serveur déjà démarré en local.
**Warning signs:** `Error: Timed out waiting 60000ms from config.webServer` dans les logs Playwright.

### Pitfall 2: storageState invalide (session Supabase expirée)
**What goes wrong:** Les tests admin échouent avec des redirections vers `/admin/login` alors que le setup a fonctionné.
**Why it happens:** Le fichier `.auth/admin.json` contient des cookies JWT Supabase avec une expiration (1h par défaut). Si les tests s'exécutent > 1h après le setup, les cookies sont expirés.
**How to avoid:** Le setup project re-exécute `auth.setup.ts` à chaque run `npx playwright test`. Le fichier est recréé à chaque run — pas de session stale. Ne pas committer `.auth/` dans git (ajouter à `.gitignore`).
**Warning signs:** Tests admin avec `page.url()` qui pointe sur `/admin/login` au lieu de `/admin/...`.

### Pitfall 3: Supabase local non démarré avant les tests E2E
**What goes wrong:** Le serveur Next.js démarre (webServer ok) mais les appels API échouent avec des erreurs réseau vers `http://127.0.0.1:54321`.
**Why it happens:** `npm run dev` démarre Next.js mais pas Supabase local. Les routes API appellent Supabase via les env vars locales.
**How to avoid:** Supabase local doit être démarré **avant** `npx playwright test`. Soit manuellement (`npx supabase start`), soit via un script npm orchestrateur. Documenter dans le README E2E.
**Warning signs:** Erreurs `ECONNREFUSED 127.0.0.1:54321` dans les logs des routes API pendant les tests.

### Pitfall 4: Cookie name Supabase différent en local vs prod
**What goes wrong:** L'auth admin storageState fonctionne localement mais pas dans d'autres environnements.
**Why it happens:** Le cookie Supabase SSR se nomme `sb-{project-ref}-auth-token`. En local, le project ref est `127` (port Supabase local) → cookie = `sb-127-auth-token`. En prod, c'est le project ref Supabase (`sb-{ref}-auth-token`).
**How to avoid:** L'auth.setup.ts fait un login UI réel — le browser reçoit les cookies natifs de l'app, peu importe le nom. Pas de manipulation manuelle des cookies dans les tests E2E.
**Warning signs:** Utiliser directement `adminClient.auth.signInWithPassword()` dans le setup E2E (bypass UI = bypass cookies réels).

### Pitfall 5: Violations @axe-core bloquantes sur les pages avec framer-motion
**What goes wrong:** Les tests axe échouent avec des violations ARIA dues aux attributs de framer-motion (motion.div avec `aria-hidden` dynamique).
**Why it happens:** framer-motion ajoute des attributs aria pendant les animations. axe peut les détecter comme violations.
**How to avoid:** Attendre la fin des animations avant de lancer l'audit : `await page.waitForLoadState('networkidle')` avant `makeAxeBuilder().analyze()`. Ou utiliser `.disableRules(['aria-hidden-focus'])` si les violations sont des faux positifs connus.
**Warning signs:** Violations axe avec `ruleId: 'aria-hidden-focus'` ou `'aria-required-children'` dans les résultats.

### Pitfall 6: `<img>` vs `<Image>` — blob URL bloquée par next/image
**What goes wrong:** Remplacer `<img>` par `<Image>` pour les previews d'upload cause des erreurs Next.js.
**Why it happens:** `next/image` ne supporte pas les blob URLs (`blob:http://...`) — elles ne passent pas par l'optimiseur d'images Next.js qui attend une URL HTTP ou un chemin statique.
**How to avoid (décision D-03) :** Garder `<img>` pour les blob URLs de preview temporaires (upload en cours). Utiliser `<Image>` uniquement pour les URLs Supabase définitives (format `https://*.supabase.co/...`). [VERIFIED: github.com/vercel/next.js/discussions/19732]

### Pitfall 7: knip signale `supabase` (package) comme devDependency inutile
**What goes wrong:** `npx knip` signale `supabase` (le CLI) comme devDependency inutile.
**Why it happens:** knip ne détecte pas l'utilisation CLI du package — `npx supabase start` n'est pas un import.
**How to avoid:** C'est un faux positif. Ajouter `"supabase"` dans `ignoreDependencies` de `knip.json`. Ne pas supprimer ce package — il est nécessaire pour `supabase start/stop` en local.

### Pitfall 8: ESLint errors actuellement bloquants dans le CI
**What goes wrong:** Le build peut être configuré pour échouer sur les ESLint errors.
**Why it happens:** DEAD-10 (`countUngenerated` unused var = ESLint error), DEAD-11 (vars framer-motion mock non préfixées `_` = ESLint errors dans les fichiers de test).
**How to avoid:** Corriger DEAD-10 et DEAD-11 en premier — ce sont des **ESLint errors** (pas warnings), détectés via `@typescript-eslint/no-unused-vars`. Ces 8 errors constituent le blocage principal du lint clean.

---

## Code Examples

### Exemple complet playwright.config.ts

```typescript
// playwright.config.ts
// Source: playwright.dev/docs/test-webserver + playwright.dev/docs/auth
import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { config } from 'dotenv'

config({ path: '.env.test.local' })

const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/admin.json')

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      // PAS de NANO_BANANA_API_KEY — active automatiquement le Mock Sharp (D-07)
    },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    // Tests publics (pas d'auth)
    {
      name: 'chromium-public',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: /public\.spec\.ts/,
      dependencies: ['setup'], // setup doit tourner d'abord pour seed data
    },
  ],
})
```

### Schémas Zod pour les routes admin POST (SEC-09, D-04)

```typescript
// src/lib/schemas.ts — ajouts pour SEC-09
export const generateSchema = z.object({
  model_id: z.string().uuid('model_id doit être un UUID valide'),
  fabric_id: z.string().uuid('fabric_id doit être un UUID valide'),
})

export const generateAllSchema = z.object({
  model_id: z.string().uuid('model_id doit être un UUID valide'),
})

export const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Au moins un ID requis'),
})

export const imagesUploadBodySchema = z.object({
  view_type: z.enum(['face', '3/4', 'profil', 'dos']),
  sort_order: z.number().int().min(0).optional(),
})

export const visualActionSchema = z.object({
  // validate + publish n'ont pas de body — validation par params uniquement
  // Schéma vide mais formalisé pour la cohérence
})
```

### Validation UUID dans les routes admin (SEC-05)

```typescript
// Pattern à appliquer dans chaque route admin avec :id
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }
  // ... suite de la route
}
```

### Correction DEAD-11 (vars framer-motion non utilisées)

```typescript
// Avant (ESLint error)
vi.mock('framer-motion', () => ({
  motion: { div: ({ initial, animate, transition, ...props }) => <div {...props} /> },
}))

// Après (correct)
vi.mock('framer-motion', () => ({
  motion: { div: ({ _initial, _animate, _transition, ...props }: {
    _initial?: unknown; _animate?: unknown; _transition?: unknown;
    [key: string]: unknown
  }) => <div {...props as React.HTMLAttributes<HTMLDivElement>} /> },
}))
// Ou plus simple :
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, className, style, onClick, id }: React.HTMLAttributes<HTMLDivElement>) =>
    <div className={className} style={style} onClick={onClick} id={id}>{children}</div> },
}))
```

### Correction MIME validation (SEC-02)

```typescript
// src/app/api/simulate/route.ts — après la vérification de taille
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
if (!ALLOWED_MIME.includes(image.type)) {
  return NextResponse.json(
    { error: 'Format non supporté. Formats acceptés : JPEG, PNG, WebP, GIF.' },
    { status: 422 }
  )
}
```

### Correction IP extraction (SEC-08)

```typescript
// src/app/api/simulate/route.ts — prendre la DERNIÈRE IP (ajoutée par le proxy Vercel)
const ip =
  request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ??
  request.headers.get('x-real-ip') ??
  '127.0.0.1'
```

### Correction eviction rateMap (SEC-04)

```typescript
// Réduire le seuil de 1000 à 100 ou appliquer sans condition
if (rateMap.size > 100) {
  for (const [key, val] of rateMap) {
    if (now > val.resetAt) rateMap.delete(key)
  }
}
```

### Correction console.log → console.info (PERF-03/04/05/08)

```typescript
// Partout où console.log est utilisé dans les services IA et routes admin
console.info('[IA] Using NanaBanana provider')  // src/lib/ai/index.ts:14
console.info('[IA] Using mock provider')         // src/lib/ai/index.ts:18
console.info(`[IA] NanoBananaService initialise (modele: ${MODEL})`)  // nano-banana.ts:82
console.info(`[IA] generate OK -- ...`)          // nano-banana.ts:153
// Dans les routes : idem pour les logs de métriques
```

### Correction throw lastError! (TS-13)

```typescript
// src/lib/ai/nano-banana.ts — remplacer la non-null assertion
throw lastError ?? new Error('Échec de la génération après tous les essais')
```

---

## Runtime State Inventory

> Phase principalement code/config — pas de renommage, migration ou refactor de données.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Aucun — les corrections ne touchent pas les structures BDD | Aucun |
| Live service config | Supabase local (Docker) — déjà configuré via Phase 15.1 | Vérifier que `supabase start` tourne avant les tests E2E |
| OS-registered state | Aucun — pas de renommage de services | Aucun |
| Secrets/env vars | `.auth/admin.json` — fichier temporaire Playwright (non git) | Ajouter `playwright/.auth/` à `.gitignore` |
| Build artifacts | `playwright-report/` et `test-results/` créés par `npx playwright test` | Ajouter à `.gitignore` |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | @playwright/test | ✓ | v24.11.1 | — |
| npm | Installation packages | ✓ | 11.6.2 | — |
| Docker | Supabase CLI local | ✓ | 29.3.1 | — |
| Supabase CLI (npx) | supabase start (BDD E2E) | ✓ | 2.89.0 | — |
| Playwright (npx) | E2E tests | ✓ | 1.59.1 (global) | — |
| @playwright/test | À installer en devDep | ✗ (pas dans package.json) | — | Installer : `npm install -D @playwright/test @axe-core/playwright` |
| @axe-core/playwright | Audit WCAG | ✗ (pas dans package.json) | — | Installer en même temps |
| Chromium browser | Tests E2E | Vérifier après install | — | `npx playwright install chromium` |

**Dépendances manquantes bloquantes :**
- `@playwright/test` — non installé, requis pour E2E-01
- `@axe-core/playwright` — non installé, requis pour D-13 (audit accessibilité)
- Navigateur Chromium — à installer via `npx playwright install chromium` après install du package

**Note :** Playwright est disponible globalement (`npx playwright --version` = 1.59.1) mais n'est pas dans `package.json`. Il doit être ajouté comme devDependency pour que les tests soient reproductibles en CI.

---

## Validation Architecture

> `workflow.nyquist_validation` non défini dans `.planning/config.json` → traité comme activé.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 (E2E) + Vitest 3.2.4 (unit/integration existants) |
| Config file E2E | `playwright.config.ts` (à créer — Wave 0) |
| Quick run command | `npx playwright test --project=chromium-public public.spec.ts` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| E2E-01 | Setup Playwright installé + config valide | smoke | `npx playwright test --list` | ❌ Wave 0 |
| E2E-02 | Parcours public catalogue → configurateur → simulation | e2e | `npx playwright test e2e/public.spec.ts` | ❌ Wave 0 |
| E2E-03 | Parcours admin generate → validate → publish | e2e | `npx playwright test e2e/admin.spec.ts` | ❌ Wave 0 |
| FIX-01 | Build propre + lint clean après corrections | smoke | `npm run build && npx eslint src/ --max-warnings 0` | N/A (corrections de code) |

### Sampling Rate
- **Par commit :** `npx tsc --noEmit && npx eslint src/ --max-warnings 0`
- **Par wave :** `npm run build` + `npx playwright test`
- **Phase gate :** `npm run build && npx tsc --noEmit && npx playwright test` tous verts

### Wave 0 Gaps

- [ ] `playwright.config.ts` — configuration principale
- [ ] `e2e/auth.setup.ts` — setup project auth admin
- [ ] `e2e/public.spec.ts` — parcours public
- [ ] `e2e/admin.spec.ts` — parcours admin
- [ ] `e2e/fixtures/axe.ts` — fixture @axe-core/playwright
- [ ] `playwright/.auth/` — répertoire (avec `.gitkeep`)
- [ ] Install : `npm install -D @playwright/test @axe-core/playwright && npx playwright install chromium`

---

## Security Domain

> `security_enforcement` non défini dans config → traité comme activé.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Oui | Supabase Auth JWT (existant) + test E2E auth flow |
| V3 Session Management | Oui | Cookies Supabase SSR httpOnly (existant) |
| V4 Access Control | Oui | requireAdmin() dans chaque route admin (existant) + test E2E 401 |
| V5 Input Validation | Oui | Zod 4 + ajout schemas SEC-09 (D-04) |
| V6 Cryptography | Non | Supabase gère le chiffrement, pas de crypto custom |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via injection de contenu | Spoofing/Tampering | CSP header + React escaping natif (correction SEC-01/SEC-10) |
| Clickjacking | Elevation of Privilege | X-Frame-Options: SAMEORIGIN (correction SEC-01) |
| MIME confusion (upload fichier non-image) | Tampering | Validation image.type allowlist (correction SEC-02) |
| Rate-limit bypass via IP spoofing | Denial of Service | Extraction dernière IP x-forwarded-for (correction SEC-08) |
| Injection sur :id malformé | Tampering | Validation UUID regex avant requête Supabase (correction SEC-05) |
| Requêtes admin sans validation body | Tampering | Schemas Zod .safeParse() dans routes POST (correction SEC-09, D-04) |

---

## Open Questions

1. **Seed data E2E — fichiers images réels dans Supabase Storage local**
   - Ce qu'on sait : Le seed SQL insère des URLs pointant vers `http://127.0.0.1:54321/storage/v1/object/public/model-photos/...` mais il n'y a pas de vraies images dans le bucket Supabase local.
   - Ce qui est flou : Est-ce que les composants Next.js (`<Image>`, `<img>`) échouent silencieusement sur une URL d'image 404 (broken image), ou est-ce que ça fait planter le test E2E ?
   - Recommandation : Utiliser `page.route()` de Playwright pour intercepter les requêtes vers `http://127.0.0.1:54321/storage/**` et retourner une image placeholder (1x1 px JPEG), OU uploader une vraie image 1x1 dans Supabase local via le seed.

2. **Admin page structure — point d'entrée `/admin` vs `/admin/produits`**
   - Ce qu'on sait : La page `/admin/login` redirige vers `/admin` (route.push('/admin')).
   - Ce qui est flou : Existe-t-il une page `/admin` qui redirige vers `/admin/produits`, ou les tests admin doivent-ils aller directement sur `/admin/produits` ?
   - Recommandation : Lire `src/app/admin/(protected)/page.tsx` ou `layout.tsx` avant de coder le parcours admin dans `admin.spec.ts`.

3. **ConfiguratorModal — trigger data-testid manquants**
   - Ce qu'on sait : Le parcours public passe par CatalogueSection → ConfiguratorModal. Le modal s'ouvre via un click sur une ProductCard.
   - Ce qui est flou : Y a-t-il des `data-testid` existants sur les ProductCard et le modal pour les sélecteurs Playwright ? ou faut-il les ajouter ?
   - Recommandation : Lire CatalogueClient.tsx, ProductCard.tsx et ConfiguratorModal.tsx avant de coder les sélecteurs. Utiliser `getByRole('button')` ou `getByText()` en premier recours, ajouter `data-testid` uniquement si les rôles ARIA ne suffisent pas.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Le setup project (project dependencies) est préférable à globalSetup pour ce projet | Architecture Patterns | Faible — les deux fonctionnent, project dependencies est juste plus intégré dans le rapport HTML |
| A2 | `workers: 1` est nécessaire pour éviter les conflits Supabase local | Architecture Patterns | Moyen — si les tests E2E ne partagent pas d'état mutable, workers: 2 pourrait fonctionner |
| A3 | L'auth admin via login UI réelle est plus fiable que via API directe pour les cookies SSR | Pattern 2 | Faible — l'approche API est valide si on injecte manuellement les cookies SSR |
| A4 | framer-motion peut causer des faux positifs axe-core | Common Pitfalls 5 | Faible — à valider lors de l'exécution des tests |
| A5 | Les 28 erreurs TypeScript du rapport Phase 14 sont toutes résolues | State of Current Codebase | CRITIQUE — vérifier avec `npx tsc --noEmit` avant de commencer les corrections TS |

---

## Sources

### Primary (HIGH confidence)
- [playwright.dev/docs/auth](https://playwright.dev/docs/auth) — Pattern project dependencies + storageState, auth.setup.ts
- [playwright.dev/docs/test-webserver](https://playwright.dev/docs/test-webserver) — webServer config, timeout, reuseExistingServer
- [playwright.dev/docs/accessibility-testing](https://playwright.dev/docs/accessibility-testing) — @axe-core/playwright, AxeBuilder, withTags, fixtures
- npm registry — @playwright/test@1.59.1, @axe-core/playwright@4.11.1 (vérifié 2026-04-11)
- package.json projet — dépendances actuelles (supabase 2.89.0, zod 4.3.6, @supabase/ssr 0.6.1)
- `.planning/phases/14-audit-code/AUDIT.md` — 74 findings, priorités P1/P2/P3
- `npx tsc --noEmit` en session → 0 erreur (confirme que les 28 erreurs TS sont résolues)
- `npx eslint src/` en session → 32 problems (8 errors, 24 warnings) — status actuel réel
- `npx knip` en session → 10 deps inutiles, 6 exports/types morts — status actuel réel

### Secondary (MEDIUM confidence)
- [nextjs.org/docs/app/guides/content-security-policy](https://nextjs.org/docs/app/guides/content-security-policy) — CSP pour Next.js, 'unsafe-eval' en dev
- [github.com/vercel/next.js/discussions/19732](https://github.com/vercel/next.js/discussions/19732) — Confirmation blob URL non supporté par next/image
- Supabase GitHub issue #41933 — CookieOptions type depuis @supabase/ssr pour TS-07/TS-08
- [nextjs.org examples/with-playwright](https://github.com/vercel/next.js/blob/canary/examples/with-playwright/playwright.config.ts) — Config Playwright officielle Next.js

### Tertiary (LOW confidence)
- Pattern `workers: 1` pour Supabase local — observé dans des projets communautaires, non documenté officiellement

---

## Metadata

**Confidence breakdown:**
- Standard Stack : HIGH — versions vérifiées sur npm registry en session
- Architecture Playwright : HIGH — documenté officiellement, patterns vérifiés
- Corrections audit : HIGH — basé sur le code réel du projet + vérification tsc/eslint/knip en session
- Security headers CSP : MEDIUM — pattern Next.js officiel, valeurs CSP adaptées au projet (à ajuster si des sources manquent)
- Pitfalls : MEDIUM-HIGH — combinaison de patterns officiels + expérience commune Supabase+Playwright

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (bibliothèques stables, 30 jours)
