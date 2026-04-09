---
phase: 15-tests-unitaires-vitest
reviewed: 2026-04-09T14:30:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/__tests__/generate-all-route.test.ts
  - src/__tests__/generate-route.test.ts
  - src/__tests__/nano-banana.test.ts
  - src/__tests__/require-admin.test.ts
  - src/__tests__/utils.test.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 15 : Code Review Report

**Reviewed:** 2026-04-09T14:30:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Les cinq fichiers de tests unitaires Vitest couvrent bien les cas critiques : fonctions utilitaires pures (`utils.test.ts`), authentification admin (`require-admin.test.ts`), service IA NanoBanana (`nano-banana.test.ts`), et les deux routes de generation (`generate-route.test.ts`, `generate-all-route.test.ts`). La structure globale est solide : les mocks sont declares avant les imports dynamiques, `vi.clearAllMocks()` est appele dans chaque `beforeEach`, et les assertions verifient les codes HTTP, les messages en francais, et les structures de reponse.

Trois warnings concernent la fiabilite des tests (mock fragile par chainage sequentiel, `fetch` global non restaure, `as never` pour contourner les types). Trois items informationnels signalent des axes d'amelioration sans risque immediat.

## Warnings

### WR-01 : fetch global stubbe sans restauration systematique

**File:** `src/__tests__/nano-banana.test.ts:110`
**Issue:** `vi.stubGlobal('fetch', ...)` est appele dans plusieurs tests individuels mais jamais restaure dans un `afterEach`. Comme `vi.clearAllMocks()` dans `beforeEach` efface les compteurs d'appels mais ne restaure pas les globaux stubbes, un test qui stubbe `fetch` avec un mock retournant `{ ok: false }` peut contaminer un test suivant si l'ordre d'execution change ou si un nouveau test est ajoute sans stub explicite.

**Fix:** Ajouter une restauration explicite de `fetch` dans le `afterEach` du `describe('NanoBananaService')` :
```typescript
afterEach(() => {
  vi.unstubAllGlobals()
  if (originalEnv === undefined) {
    delete process.env.NANO_BANANA_API_KEY
  } else {
    process.env.NANO_BANANA_API_KEY = originalEnv
  }
})
```

### WR-02 : Chaine de mocks sequentielle fragile dans generate-all-route.test.ts

**File:** `src/__tests__/generate-all-route.test.ts:103-124`
**Issue:** Le test "retourne errors array quand un angle echoue" utilise `mockSingle` pour les deux appels de lookup (model, fabric) ET pour l'insert du premier angle (ligne 124). Cela fonctionne uniquement parce que les appels `mockResolvedValueOnce` sont consommes dans un ordre sequentiel precis. Toute refactorisation de la route qui modifierait l'ordre des appels Supabase casserait silencieusement le test (faux positif ou faux negatif) sans message d'erreur clair. Le meme pattern apparait aux lignes 143-159 pour le test de structure.

**Fix:** Envisager des mocks plus specifiques par table, par exemple en rendant `from()` sensible au nom de la table :
```typescript
mockSupabase.from.mockImplementation((table: string) => {
  if (table === 'models') return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockModelSingle })) })) }
  if (table === 'fabrics') return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockFabricSingle })) })) }
  // ...
})
```
Cela decouple les assertions de l'ordre interne des appels.

### WR-03 : Cast `as never` sur les parametres Request des handlers

**File:** `src/__tests__/generate-route.test.ts:85` (et lignes 121, 153, 172)
**File:** `src/__tests__/generate-all-route.test.ts:88` (et lignes 95, 131, 161, 183)
**Issue:** Les handlers de route Next.js acceptent `NextRequest`, mais les tests passent un `Request` standard caste en `never` pour contourner le type. Cela masque toute incompatibilite de type entre `Request` et `NextRequest` (par exemple, `NextRequest` expose `.nextUrl`, `.cookies`, etc.). Si la route commence a utiliser ces proprietes specifiques, le test ne detectera pas l'erreur de type -- il plantera a l'execution au lieu de la compilation.

**Fix:** Construire un `NextRequest` au lieu d'un `Request` brut :
```typescript
import { NextRequest } from 'next/server'

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
```

## Info

### IN-01 : Import de NextResponse non utilise dans generate-all-route.test.ts

**File:** `src/__tests__/generate-all-route.test.ts:9`
**Issue:** `NextResponse` est importe en haut du fichier et utilise uniquement dans le dernier test (ligne 177). L'import n'est pas inutile en soi, mais il est declare au niveau module alors qu'il pourrait etre importe localement dans le test qui en a besoin, pour plus de clarte. Pas un bug, mais un point de lisibilite.

**Fix:** Deplacer l'import `NextResponse` dans le test "retourne 401 si non authentifie" via un `import()` dynamique, ou laisser tel quel -- c'est mineur.

### IN-02 : Absence de test pour le cas model/fabric introuvable (404) dans generate-all-route

**File:** `src/__tests__/generate-all-route.test.ts`
**Issue:** La route `generate-all` retourne 404 si le modele, le tissu ou les images modele sont introuvables (lignes 44-79 de la route). Aucun test ne couvre ces trois chemins 404. Les tests couvrent 400 (validation), 401 (auth) et 200 (succes/partiel), mais pas les cas d'entites manquantes.

**Fix:** Ajouter des tests pour les cas 404 :
```typescript
it('retourne 404 si modele introuvable', async () => {
  mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
  const response = await POST(makeRequest({ model_id: 'bad', fabric_id: 'f1' }) as never)
  expect(response.status).toBe(404)
})
```

### IN-03 : console.log dans le constructeur NanoBananaService pollue la sortie de tests

**File:** `src/__tests__/nano-banana.test.ts` (via `src/lib/ai/nano-banana.ts:82`)
**Issue:** Le constructeur de `NanoBananaService` appelle `console.log(...)` a chaque instanciation. Comme les tests creent une nouvelle instance dans presque chaque `it()`, la sortie de tests est polluee par des messages `[IA] NanoBananaService initialise`. Ce n'est pas un bug dans le test mais le source ; les tests pourraient spy/mock `console.log` pour garder une sortie propre.

**Fix:** Ajouter dans le `beforeEach` :
```typescript
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
```

---

_Reviewed: 2026-04-09T14:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
