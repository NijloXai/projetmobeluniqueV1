# Phase 15: Tests Unitaires Vitest - Research

**Researched:** 2026-04-09
**Domain:** Vitest 3.x unit/integration testing — Next.js 16 App Router, Supabase Auth mocking, fake timers
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Tester requireAdmin() en unitaire en mockant le client Supabase auth — vérifier 3 cas : token absent, token expiré, token valide
- **D-02:** Tester aussi les routes admin (generate, generate-all) avec requireAdmin mocké pour retourner une erreur — vérifier que les routes retournent 401 avec message français
- **D-03:** Créer `src/__tests__/utils.test.ts` avec tests pour slugify, calculatePrice, extractStoragePath
- **D-04:** Cas limites choisis par Claude selon pertinence du code existant (accents français/allemands pour slugify, prix 0/négatif/premium pour calculatePrice, URLs valides/signées/malformées/null pour extractStoragePath)
- **D-05:** Tous les nouveaux tests dans `src/__tests__/` — cohérent avec les 14 fichiers existants, pas de refactoring d'organisation
- **D-06:** Convention de nommage existante conservée : `{sujet}.test.ts`
- **D-07:** Ajouter un test timeout dédié dans `src/__tests__/nano-banana.test.ts` vérifiant que le service produit une erreur explicite sur timeout 30s (pas seulement testé via les routes)

### Claude's Discretion

- Nombre exact de cas limites par fonction utils (entre basique et exhaustif, selon pertinence)
- Détails d'implémentation des mocks Supabase auth pour requireAdmin
- Structure interne des describe/it pour les nouveaux tests
- Gestion des timers Vitest pour le test timeout (vi.useFakeTimers vs AbortController mock)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Tests Vitest NanoBananaService avec vi.mock('@google/genai') — ajouter test timeout dédié | D-07: vi.useFakeTimers() + mockGenerateContent rejetant AbortError après avance du timer |
| TEST-02 | Tests Vitest utils (slugify, calculatePrice, extractStoragePath) | D-03/D-04: src/__tests__/utils.test.ts, fonctions pures — aucun mock requis |
| TEST-03 | Tests Vitest routes admin generate + requireAdmin() | D-01/D-02: mock @/lib/supabase/server pour requireAdmin unitaire; mock @/lib/supabase/admin pour routes 401 |
| TEST-04 | Tests Vitest route simulate avec mock provider | Déjà couvert — simulate-route.test.ts a HEIC 422 et taille 400. Aucun nouveau fichier nécessaire. |
</phase_requirements>

---

## Summary

Le projet a déjà une infrastructure de test solide : Vitest 3.2.4 installé, happy-dom configuré, 161 tests passants dans 13 fichiers. Cette phase comble trois gaps précis sans modifier la configuration existante.

Le premier gap (TEST-01) est le test timeout dédié dans NanoBanana. La difficulté principale : `AbortError` est traité comme **retryable** dans `isRetryableError()` (ligne 52 de nano-banana.ts), ce qui signifie qu'un test naïf attendrait 3 tentatives avec backoff réel (1s + 2s = 3s+ réels). La solution est `vi.useFakeTimers()` avec `vi.runAllTimersAsync()` pour court-circuiter le `sleep()` module-privé.

Le second gap (TEST-02) est trivial : `slugify`, `calculatePrice`, `extractStoragePath` sont des fonctions pures sans dépendances externes. Le fichier `src/__tests__/utils.test.ts` ne nécessite aucun mock.

Le troisième gap (TEST-03) est le test requireAdmin() avec 401. Le pattern existant dans generate-route.test.ts mock `@/lib/supabase/admin` (requireAdmin complet), ce qui ne teste pas la logique interne de requireAdmin. Pour tester requireAdmin elle-même (D-01), il faut mocker `@/lib/supabase/server` et contrôler ce que `supabase.auth.getUser()` retourne. Pour D-02 (routes retournent 401), on utilise le pattern existant : mocker `requireAdmin` pour retourner `{ error: NextResponse 401 }`.

**Primary recommendation:** Trois tâches distinctes — (1) vi.useFakeTimers timeout dans nano-banana.test.ts, (2) utils.test.ts pur, (3) src/__tests__/require-admin.test.ts pour D-01 + compléter generate-route.test.ts pour D-02.

---

## Standard Stack

### Core (déjà installé — aucune installation requise)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 3.2.4 | Framework de test | Déjà configuré, 161 tests passants |
| happy-dom | 20.8.9 | DOM environment | Déjà configuré dans vitest.config.ts |
| @testing-library/react | 16.3.2 | Composants React | Déjà installé, utilisé dans setup.ts |
| @testing-library/jest-dom | 6.9.1 | Matchers DOM | Déjà chargé dans setup.ts |

[VERIFIED: node_modules/vitest/package.json, npm view vitest version → 4.1.4 en registry mais 3.2.4 installé et fonctionnel]

### Aucune installation requise

Cette phase n'introduit aucune nouvelle dépendance. Toutes les API utilisées (`vi.useFakeTimers`, `vi.runAllTimersAsync`) sont intégrées à Vitest 3.x.

**Installation:** Rien à installer.

**Version verification:** `npm test` passe en vert avec 161 tests à baseline. [VERIFIED: npm test run 2026-04-09]

---

## Architecture Patterns

### Structure fichiers (inchangée)

```
src/__tests__/
├── setup.ts                      # Global setup existant — NE PAS MODIFIER
├── nano-banana.test.ts           # MODIFIER — ajouter describe('timeout')
├── generate-route.test.ts        # MODIFIER — ajouter test 401
├── generate-all-route.test.ts    # MODIFIER — ajouter test 401
├── simulate-route.test.ts        # NE PAS MODIFIER — HEIC et taille déjà couverts
├── utils.test.ts                 # CRÉER
└── require-admin.test.ts         # CRÉER
```

### Pattern 1 : Test de fonction pure (utils.test.ts)

**Quand utiliser :** Fonctions sans dépendances extérieures (`slugify`, `calculatePrice`, `extractStoragePath`).

**Caractéristiques :** Aucun `vi.mock()`, aucun import dynamique. Import direct.

```typescript
// Source: pattern établi dans isActiveFilter.test.ts (codebase existant)
import { describe, it, expect } from 'vitest'
import { slugify, calculatePrice, extractStoragePath } from '@/lib/utils'

describe('slugify', () => {
  it('supprime les accents francais', () => {
    expect(slugify('Véloürs Blëu')).toBe('velours-bleu')
  })
  it('supprime les accents allemands', () => {
    expect(slugify('Möbel Unique')).toBe('mobel-unique')
  })
  it('gere les tirets multiples en debut et fin', () => {
    expect(slugify('  --Canapé--  ')).toBe('canape')
  })
})
```

[VERIFIED: src/lib/utils.ts lu — slugify utilise normalize('NFD') + replace diacritiques]

### Pattern 2 : Test requireAdmin unitaire (require-admin.test.ts)

**Quand utiliser :** Tester la logique interne de requireAdmin() — mock `@/lib/supabase/server` (pas `@/lib/supabase/admin`).

**Piège critique :** `requireAdmin` est dans `src/lib/supabase/admin.ts` et importe `createClient` depuis `@/lib/supabase/server`. Pour tester requireAdmin elle-même, il faut mocker `@/lib/supabase/server`, PAS `@/lib/supabase/admin`.

```typescript
// Source: pattern simulate-route.test.ts (codebase existant) adapté pour auth
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock du client server — controle ce que auth.getUser() retourne
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
  })),
}))

// Import APRES les mocks (pattern établi)
const { requireAdmin } = await import('@/lib/supabase/admin')

describe('requireAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne error 401 si token absent (user null)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await requireAdmin()
    expect(result.error).not.toBeNull()
    expect(result.supabase).toBeNull()
    // Verifier que c'est bien une NextResponse 401
    expect((result.error as Response).status).toBe(401)
  })

  it('retourne error 401 si getUser retourne une erreur (token expire)', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired' },
    })
    const result = await requireAdmin()
    expect(result.error).not.toBeNull()
    expect((result.error as Response).status).toBe(401)
  })

  it('retourne supabase valide si user authentifie', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-user-id', email: 'admin@example.com' } },
      error: null,
    })
    const result = await requireAdmin()
    expect(result.error).toBeNull()
    expect(result.supabase).not.toBeNull()
    expect(result.user).toBeDefined()
  })
})
```

[VERIFIED: src/lib/supabase/admin.ts lu — requireAdmin() appelle createClient() puis supabase.auth.getUser()]

### Pattern 3 : Test 401 dans routes admin (ajout à generate-route.test.ts)

**Quand utiliser :** Tester que les routes admin retournent 401 quand requireAdmin échoue — mock `@/lib/supabase/admin` avec `error` non-null.

```typescript
// Source: generate-route.test.ts existant — extension du describe existant
// requireAdmin est déjà mocké globalement. Surcharger pour ce test :
it('retourne 401 si non authentifie', async () => {
  const { requireAdmin } = await import('@/lib/supabase/admin')
  vi.mocked(requireAdmin).mockResolvedValueOnce({
    supabase: null,
    user: null,
    error: NextResponse.json(
      { error: 'Non authentifie. Connectez-vous pour acceder a cette ressource.' },
      { status: 401 }
    ),
  })

  const response = await POST(makeRequest({ model_id: 'm1', model_image_id: 'mi1', fabric_id: 'f1' }))
  expect(response.status).toBe(401)
  const json = await response.json()
  expect(json.error).toContain('authentifie')
})
```

[VERIFIED: generate-route.test.ts lu — pattern vi.mock('@/lib/supabase/admin') déjà en place]

### Pattern 4 : Test timeout avec vi.useFakeTimers (nano-banana.test.ts)

**Quand utiliser :** Tester le comportement timeout sans attendre les vrais délais. `AbortError` est retryable dans nano-banana — sans fake timers, 3 tentatives avec backoff réel prennent 3+ secondes supplémentaires.

**Approche retenue :** `vi.useFakeTimers()` / `vi.useRealTimers()` dans beforeEach/afterEach, + `vi.runAllTimersAsync()` pour avancer le temps pendant `await service.generate()`.

```typescript
// Source: Vitest 3.x docs — vi.useFakeTimers() avec async
// ATTENTION : nécessite fakeTimers: { shouldAdvanceTime: true } OU utilisation de
// runAllTimersAsync() dans une Promise.race concurrent

describe('timeout (D-07)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('produit AbortError apres timeout 30s (retryable 3 fois)', async () => {
    // Simuler fetch OK mais generateContent qui ne resout jamais
    // → AbortSignal.timeout(30_000) est natif, pas lie aux fakeTimers
    // Alternative : mocker generateContent pour rejeter AbortError directement

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: new Headers({ 'content-type': 'image/jpeg' }),
    }))

    // AbortError retryable : 3 echecs attendus
    const abortErr = new Error('signal timed out')
    abortErr.name = 'AbortError'
    mockGenerateContent.mockRejectedValue(abortErr)

    const service = new NanoBananaService()
    // Avec fake timers : avancer le temps pour bypass sleep() dans retry loop
    const generatePromise = service.generate(baseRequest)
    await vi.runAllTimersAsync()

    await expect(generatePromise).rejects.toThrow('AbortError')  // ou le message du lastError
    expect(mockGenerateContent).toHaveBeenCalledTimes(3)
  })
})
```

[ASSUMED] — L'interaction précise entre `vi.useFakeTimers()` et `AbortSignal.timeout()` dans happy-dom n'est pas documentée avec certitude. Voir section Pitfall 2 pour la stratégie de fallback.

### Anti-Patterns à Éviter

- **Mock `@/lib/supabase/admin` pour tester requireAdmin() :** mock complet court-circuite la logique qu'on teste. Mocker uniquement `@/lib/supabase/server`.
- **Test timeout sans fake timers :** 3 retries AbortError avec sleep réel = 3s+ de délai. Toujours utiliser `vi.useFakeTimers()`.
- **Import avant vi.mock() :** Les imports statiques avant `vi.mock()` ignorent les mocks. Le pattern établi (`await import()` après `vi.mock()`) est obligatoire.
- **Modifier vitest.config.ts :** Aucune modification nécessaire — le pattern `src/**/*.test.{ts,tsx}` couvre déjà les nouveaux fichiers.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser | Pourquoi |
|----------|-------------------|----------|----------|
| Fake timers | Un wrapper `sleep()` mocké manuellement | `vi.useFakeTimers()` + `vi.runAllTimersAsync()` | Intégré à Vitest, patch `setTimeout` globalement, compatible avec async/await |
| Mock Supabase auth | Un stub complet du client Supabase | `vi.mock('@/lib/supabase/server', ...)` avec `mockGetUser` contrôlé | Pattern déjà établi dans le projet (simulate-route.test.ts) |
| Assertions de réponse HTTP | Parser manuellement la réponse | `response.status` + `response.json()` | Pattern Next.js route handler standard dans tout le projet |

**Key insight :** Le projet a déjà tous les patterns nécessaires dans les 10 fichiers de test existants. La valeur est dans l'application correcte des patterns existants aux cas manquants.

---

## Runtime State Inventory

Non applicable — phase greenfield de création de tests. Aucune migration ou renommage.

---

## Common Pitfalls

### Pitfall 1 : Confondre la cible du mock pour requireAdmin

**Ce qui dysfonctionne :** Mocker `@/lib/supabase/admin` pour tester requireAdmin() — ce mock court-circuite la fonction elle-même, donc on ne teste rien.

**Pourquoi :** `vi.mock('@/lib/supabase/admin', () => ({ requireAdmin: vi.fn(...) }))` remplace la fonction complète. Pour tester la logique interne de requireAdmin, il faut mocker sa dépendance : `@/lib/supabase/server`.

**Comment éviter :** Pour TEST-03 D-01 (test requireAdmin unitaire) : mocker `@/lib/supabase/server`. Pour TEST-03 D-02 (test routes avec 401) : mocker `@/lib/supabase/admin` (pattern déjà dans generate-route.test.ts).

**Signe d'alerte :** Si le test requireAdmin() passe sans jamais appeler `mockGetUser`, le mauvais module est mocké.

### Pitfall 2 : AbortSignal.timeout() et fake timers dans happy-dom

**Ce qui dysfonctionne :** `AbortSignal.timeout(30_000)` est une API native Web Platform. Dans happy-dom, elle peut ne pas être contrôlée par `vi.useFakeTimers()` (qui patche `setTimeout`/`setInterval`, pas les timers natifs WebAPI).

**Pourquoi :** `AbortSignal.timeout()` utilise l'implémentation du runtime (happy-dom), pas forcément `setTimeout`. Le comportement dépend de la version de happy-dom.

**Stratégie recommandée :** Le test timeout ne doit PAS attendre que le vrai AbortSignal se déclenche. Au lieu de ça, `mockGenerateContent` rejette directement avec un `AbortError` (nom='AbortError'). Ceci simule le résultat observable du timeout sans dépendre du mécanisme interne. `vi.useFakeTimers()` reste utile pour avancer le `sleep()` du retry loop.

**Stratégie fallback si vi.runAllTimersAsync() ne suffit pas :** Tester avec 3 appels `mockRejectedValue(abortErr)` et vérifier `expect(mockGenerateContent).toHaveBeenCalledTimes(3)` + que l'erreur finale est bien l'AbortError. Le test prend alors 3s réels (identique au test "3 echecs consecutifs retryables" existant qui prend 3.4s).

**Signe d'alerte :** Test timeout dure > 10s → les fake timers ne patchent pas le sleep.

[ASSUMED] sur le comportement exact de happy-dom 20.8.9 avec AbortSignal.timeout et vi.useFakeTimers — à vérifier à l'exécution.

### Pitfall 3 : NextResponse dans l'environnement happy-dom

**Ce qui dysfonctionne :** `requireAdmin()` retourne un `NextResponse` (objet Next.js), pas un `Response` natif. Tenter `result.error.status` peut échouer si le type n'est pas correctement casté.

**Pourquoi :** `NextResponse.json({}, { status: 401 })` retourne une `NextResponse` qui étend `Response`. Le `.status` est accessible, mais TypeScript peut se plaindre sans cast.

**Comment éviter :** Cast `result.error as Response` pour accéder à `.status`, ou utiliser `(result.error as NextResponse).status`. L'import `NextResponse` depuis `next/server` n'est pas nécessaire dans le test — le résultat est une Response standard.

**Signe d'alerte :** TypeScript error sur `.status` de `result.error` — ajouter le cast.

### Pitfall 4 : extractStoragePath avec URLs signées

**Ce qui dysfonctionne :** Tester uniquement les URLs publiques Supabase (`/storage/v1/object/public/...`) et oublier le chemin signé (`/storage/v1/object/sign/...`).

**Pourquoi :** La regex dans `extractStoragePath` couvre les deux patterns : `(?:public|sign)`. Les deux doivent être testés pour valider la regex complète.

**Comment éviter :** Inclure un cas de test pour URL signée (`/sign/`) dans utils.test.ts.

[VERIFIED: src/lib/utils.ts lu — regex `(?:public|sign)` explicite à la ligne 72]

---

## Code Examples

Patterns vérifiés depuis le code source existant :

### slugify — cas limites pertinents

```typescript
// Source: src/lib/utils.ts lu — normalize('NFD') + remove \u0300-\u036f
// Cas pertinents pour cette fonction :
slugify('Véloürs Blëu')        // → 'velours-bleu'  (accents français)
slugify('Möbel Unique')         // → 'mobel-unique'  (tréma allemand)
slugify('Canapé Milano 3 Pl')   // → 'canape-milano-3-pl'  (chiffres conservés)
slugify('  --test--  ')         // → 'test'  (tirets en debut/fin strips)
slugify('')                     // → ''  (chaine vide)
slugify('abc')                  // → 'abc'  (cas nominal sans transformation)
```

### calculatePrice — cas limites pertinents

```typescript
// Source: src/lib/utils.ts lu — PREMIUM_SUPPLEMENT = 80 (fixe, CLAUDE.md confirme)
calculatePrice(1000, false)     // → 1000  (standard)
calculatePrice(1000, true)      // → 1080  (premium +80€)
calculatePrice(0, false)        // → 0  (prix zéro)
calculatePrice(0, true)         // → 80  (prix zéro premium)
calculatePrice(1200, true)      // → 1280  (prix typique catalogue)
```

### extractStoragePath — cas limites pertinents

```typescript
// Source: src/lib/utils.ts lu — regex + decodeURIComponent
// URL publique standard
extractStoragePath(
  'https://xxx.supabase.co/storage/v1/object/public/fabric-swatches/velours-bleu.jpg'
)  // → 'velours-bleu.jpg'

// URL signée (chemin /sign/)
extractStoragePath(
  'https://xxx.supabase.co/storage/v1/object/sign/generated-visuals/img.jpg?token=abc'
)  // → 'img.jpg'

// URL avec sous-dossier
extractStoragePath(
  'https://xxx.supabase.co/storage/v1/object/public/model-photos/models/img.jpg'
)  // → 'models/img.jpg'

// URL malformée (pas de pattern storage)
extractStoragePath('https://example.com/image.jpg')  // → null

// Chaîne vide / non-URL → null (try/catch dans la fonction)
extractStoragePath('not-a-url')  // → null
```

### Pattern import-après-mock (rappel obligatoire)

```typescript
// Source: nano-banana.test.ts, generate-route.test.ts, simulate-route.test.ts
// TOUJOURS : vi.mock() en haut, await import() APRES

vi.mock('@/lib/supabase/server', () => ({ ... }))
// ... autres mocks ...

// Import dynamique APRES tous les vi.mock()
const { requireAdmin } = await import('@/lib/supabase/admin')
```

---

## State of the Art

| Ancienne approche | Approche actuelle (Vitest 3.x) | Impact |
|-------------------|-------------------------------|--------|
| `jest.useFakeTimers()` | `vi.useFakeTimers()` | API identique, fonctionne avec async/await |
| `jest.runAllTimers()` | `vi.runAllTimersAsync()` | Version async requise pour Promises dans le callback timer |
| `jest.mock()` hoisting manuel | `vi.mock()` auto-hoisted | Les mocks sont automatiquement hoistés avant les imports |
| `jest.fn().mockReturnValue()` | `vi.fn().mockResolvedValueOnce()` | Pattern identique, API Vitest |

**Deprecated/outdated :**
- `vi.runAllTimers()` (synchrone) : ne flush pas les Promises async dans les callbacks. Utiliser `vi.runAllTimersAsync()` en Vitest 3.x.

[VERIFIED: vitest 3.2.4 installé et fonctionnel — npm test baseline 161 tests]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `vi.useFakeTimers()` contrôle le `sleep()` (setTimeout) dans nano-banana mais pas nécessairement `AbortSignal.timeout()` dans happy-dom | Pitfall 2, Pattern 4 | Test timeout peut soit passer sans avancer le vrai AbortSignal (OK, car on mock generateContent directement), soit nécessiter un fallback sans fake timers |
| A2 | `NextResponse.status` est accessible via cast `as Response` dans l'environnement de test happy-dom | Pattern 2, Pitfall 3 | TypeScript pourrait refuser le cast — solution: utiliser `(result.error as { status: number }).status` |

**Risque global :** FAIBLE. Dans les deux cas, un fallback simple existe et le comportement observable (le test passe ou échoue avec message clair) guide la correction.

---

## Open Questions (RESOLVED)

1. **vi.useFakeTimers() + AbortSignal.timeout() dans happy-dom 20.8.9**
   - Ce qu'on sait : `sleep()` dans nano-banana utilise `setTimeout` — contrôlé par fake timers. `AbortSignal.timeout()` utilise l'implémentation WebAPI de happy-dom.
   - Ce qui est flou : est-ce que happy-dom 20.x implémente AbortSignal.timeout() via setTimeout (patchable) ou via un mécanisme interne ?
   - Recommandation : Le test timeout mocke `generateContent` pour rejeter directement avec AbortError. Le fake timer n'est nécessaire que pour court-circuiter le `sleep()` du retry loop. Si `vi.runAllTimersAsync()` ne suffit pas, utiliser le fallback (3 rejets réels ≈ 3.4s comme le test retry existant).

2. **Test 401 : generate-route.test.ts vs nouveau fichier**
   - Ce qu'on sait : generate-route.test.ts a un `vi.mock('@/lib/supabase/admin')` global avec `requireAdmin` mocké en succès.
   - Ce qui est flou : est-ce que `vi.mocked(requireAdmin).mockResolvedValueOnce(...)` fonctionne pour surcharger le mock global dans un seul test, ou faut-il restructurer ?
   - Recommandation : `vi.mocked(requireAdmin).mockResolvedValueOnce({ error: ..., supabase: null, user: null })` est le pattern standard Vitest pour surcharger ponctuellement. Ceci fonctionne dans beforeEach/test scope.

---

## Environment Availability

Phase code-only — uniquement des fichiers TypeScript dans `src/__tests__/`. Aucune dépendance externe au-delà de l'infrastructure Vitest déjà en place.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| vitest | npm test | oui | 3.2.4 | — |
| happy-dom | vitest env | oui | 20.8.9 | — |
| @testing-library/react | setup.ts | oui | 16.3.2 | — |
| Node.js | runtime | oui | 24.11.1 | — |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` (racine projet) |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | NanoBanana timeout 30s produit AbortError après 3 retries | unit | `npm test -- nano-banana` | Partiel (nano-banana.test.ts existe, describe timeout à ajouter) |
| TEST-02 | slugify, calculatePrice, extractStoragePath cas limites | unit | `npm test -- utils` | Non — Wave 0 créer utils.test.ts |
| TEST-03 | requireAdmin() retourne 401 sur token absent/expiré | unit | `npm test -- require-admin` | Non — Wave 0 créer require-admin.test.ts |
| TEST-03 | generate route retourne 401 si requireAdmin échoue | integration | `npm test -- generate-route` | Partiel (generate-route.test.ts existe, cas 401 à ajouter) |
| TEST-04 | simulate route HEIC 422 et taille > 15Mo 400 | integration | `npm test -- simulate-route` | Oui (simulate-route.test.ts complet) |

### Sampling Rate

- **Par tâche :** `npm test`
- **Phase gate :** `npm test -- --reporter=verbose` vert complet avant validation

### Wave 0 Gaps

- [ ] `src/__tests__/utils.test.ts` — couvre TEST-02 (slugify, calculatePrice, extractStoragePath)
- [ ] `src/__tests__/require-admin.test.ts` — couvre TEST-03 D-01 (requireAdmin unitaire)

*(Les fichiers nano-banana.test.ts, generate-route.test.ts, generate-all-route.test.ts existent et sont à étendre — pas de nouveau fichier à créer pour ces cas)*

---

## Security Domain

Non applicable pour cette phase — ajout de tests uniquement, aucun code de production modifié, aucune surface d'attaque créée ou étendue.

---

## Sources

### Primary (HIGH confidence)

- `src/__tests__/nano-banana.test.ts` (codebase) — pattern vi.mock, import dynamique, mockGenerateContent
- `src/__tests__/simulate-route.test.ts` (codebase) — pattern mock Supabase server createClient
- `src/__tests__/generate-route.test.ts` (codebase) — pattern mock requireAdmin + routes admin
- `src/__tests__/generate-all-route.test.ts` (codebase) — pattern similaire generate-route
- `src/lib/utils.ts` (codebase) — fonctions cibles + implémentation slugify/calculatePrice/extractStoragePath
- `src/lib/supabase/admin.ts` (codebase) — implémentation requireAdmin()
- `src/lib/ai/nano-banana.ts` (codebase) — isRetryableError, AbortSignal.timeout, sleep, MAX_RETRIES
- `vitest.config.ts` (codebase) — configuration, include pattern, environment
- `src/__tests__/setup.ts` (codebase) — setup global

### Secondary (MEDIUM confidence)

- npm test run (2026-04-09) — 161 tests passants, Vitest 3.2.4 confirmé fonctionnel [VERIFIED]
- `node_modules/vitest/package.json` — version 3.2.4 installée [VERIFIED]

### Tertiary (LOW confidence)

- [ASSUMED] Interaction vi.useFakeTimers() + AbortSignal.timeout() dans happy-dom — non vérifié avec Context7 (hors scope, comportement observable suffisant)

---

## Metadata

**Confidence breakdown:**
- Standard stack : HIGH — versions vérifiées, 161 tests confirment l'infra existante
- Architecture : HIGH — patterns lus directement depuis les fichiers de test existants
- Pitfalls : HIGH pour pitfalls 1/3/4 (vérifiés par lecture code), MEDIUM pour pitfall 2 (AbortSignal/fake timers — partie assumed)

**Research date:** 2026-04-09
**Valid until:** 30 jours (stack stable)
