---
phase: 13-nanobananaservice
type: code-review
depth: standard
reviewed: 2026-04-08T15:30:00Z
status: issues_found
files_reviewed: 4
files_reviewed_list:
  - src/lib/ai/nano-banana.ts
  - src/app/api/admin/generate/route.ts
  - src/app/api/admin/generate-all/route.ts
  - src/app/api/simulate/route.ts
findings:
  critical: 0
  warning: 6
  info: 2
  total: 8
---

# Phase 13 : Code Review Report

**Reviewed:** 2026-04-08T15:30:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

La phase 13 implemente le NanoBananaService (Gemini via @google/genai) et adapte 3 routes API. Le code est globalement solide : retry exponentiel avec jitter, gestion IMAGE_SAFETY, timeout par tentative, validation des entrees, et rate-limiting sur la route publique. L'architecture suit bien les patterns etablis (factory pattern, upsert, watermark).

Cependant, 6 warnings ont ete identifies : du code mort dans generate-all (catch unreachable), une detection de retry trop permissive par substring matching, un rate-limiter sans eviction d'entrees expirees, une consommation de quota sur requetes invalides, un risque de crash sur data URI malformee, et une inconsistance du default watermark text entre les deux services.

Aucune issue critique. Pas de fuite de cle API, pas d'injection, pas de bypass d'auth.

## Warnings

### WR-01: isRetryableError -- substring matching trop large

**File:** `src/lib/ai/nano-banana.ts:44-54`
**Issue:** `msg.includes('500')` matche toute chaine contenant "500" (ex: "image de 15000 pixels", "code 1500"). Meme risque pour '429', '502', '503'. Cela pourrait classer une erreur non-retryable comme retryable et declencher des retries inutiles, allongeant la latence de 7s+ avant de remonter l'erreur reelle.
**Fix:**
```typescript
function isRetryableError(err: Error): boolean {
  const msg = err.message
  return (
    /\b429\b/.test(msg) ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    /\b50[023]\b/.test(msg) ||
    err.name === 'AbortError'
  )
}
```

### WR-02: generate-all -- catch externe ImageSafetyError unreachable (code mort)

**File:** `src/app/api/admin/generate-all/route.ts:187-191`
**Issue:** Le `catch` externe (ligne 187) teste `err instanceof ImageSafetyError`, mais cette erreur ne peut jamais remonter jusqu'ici. Chaque appel `iaService.generate()` est dans le `try/catch` interne de la boucle `for` (ligne 88-173), qui capture TOUTES les erreurs (y compris ImageSafetyError) et les pousse dans le tableau `errors`. Le check externe est du code mort qui donne une fausse impression de gestion.
**Fix:** Supprimer le check `ImageSafetyError` du catch externe :
```typescript
} catch (err) {
  const message = err instanceof Error ? err.message : 'Erreur inconnue'
  console.error('[POST /api/admin/generate-all] Erreur:', message)
  return NextResponse.json(
    { error: `Erreur lors de la generation : ${message}` },
    { status: 500 }
  )
}
```

### WR-03: rateMap sans eviction -- croissance memoire illimitee

**File:** `src/app/api/simulate/route.ts:13`
**Issue:** `rateMap` est un `Map<string, ...>` module-level. Les entrees expirees ne sont jamais supprimees (`set` ecrase mais seulement si la meme IP revient). Un attaquant envoyant des requetes depuis N IPs distinctes (proxies, botnets) ajoute N entrees qui restent en memoire indefiniment jusqu'au cold start Vercel. Avec des milliers d'IPs, cela represente une fuite memoire lente.
**Fix:** Ajouter une eviction periodique des entrees expirees :
```typescript
function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now()

  // Eviction periodique (tous les 100 appels ou 1000 entrees)
  if (rateMap.size > 1000) {
    for (const [key, val] of rateMap) {
      if (now > val.resetAt) rateMap.delete(key)
    }
  }

  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }
  entry.count++
  return { allowed: true, retryAfter: 0 }
}
```

### WR-04: Rate-limit consomme un slot AVANT la validation du body

**File:** `src/app/api/simulate/route.ts:44-60`
**Issue:** Le rate-limit est applique a la ligne 44, avant le parsing FormData (ligne 54) et la validation des champs (lignes 67-86). Un client qui envoie des requetes invalides (FormData vide, image manquante, model_id absent) consomme quand meme un slot de rate-limit. Apres 5 requetes malformees en 1 minute, un utilisateur legitime se retrouve bloque pendant 60s. Cela cree un vecteur de denial-of-service contre soi-meme (client bugge) ou un outil de griefing (un attaquant force le rate-limit d'une IP partagee avec des requetes invalides peu couteuses).
**Fix:** Deplacer le check de rate-limit apres la validation minimale (au moins apres le parsing FormData et la verification que `image` et `model_id` sont presents). Alternativement, ne compter que les requetes qui arrivent jusqu'a l'appel IA :
```typescript
// Validation d'abord...
if (!image || image.size === 0) { ... }
if (!modelId) { ... }

// Rate-limit seulement sur les requetes valides qui vont couter de l'IA
const { allowed, retryAfter } = checkRateLimit(ip)
if (!allowed) { ... }
```

### WR-05: resolveImagePart -- crash sur data URI malformee (sans virgule)

**File:** `src/lib/ai/nano-banana.ts:205`
**Issue:** `sourceImageUrl.split(',')` sur un data URI sans virgule retourne un tableau a 1 element. La destructuration `const [meta, data] = ...` assigne `undefined` a `data`. Le SDK recevrait `{ inlineData: { mimeType: '...', data: undefined } }` ce qui causerait une erreur opaque du SDK Gemini plutot qu'un message d'erreur clair. En pratique, le chemin `data:` n'est atteint que depuis la route simulate qui construit elle-meme le data URI (ligne 129), donc le risque est faible, mais la fonction est `private` et pourrait etre reutilisee.
**Fix:**
```typescript
if (sourceImageUrl.startsWith('data:')) {
  const commaIdx = sourceImageUrl.indexOf(',')
  if (commaIdx === -1) {
    throw new Error('Data URI malformee : separateur virgule manquant.')
  }
  const meta = sourceImageUrl.slice(0, commaIdx)
  const data = sourceImageUrl.slice(commaIdx + 1)
  const mimeType = meta.split(':')[1]?.split(';')[0] || 'image/jpeg'
  return { inlineData: { mimeType, data } }
}
```

### WR-06: Default watermark text inconsistant entre NanoBanana et Mock

**File:** `src/lib/ai/nano-banana.ts:229`
**Issue:** Le parametre par defaut de `addWatermark` dans NanoBananaService est `'MOBEL UNIQUE -- Apercu'` (ASCII, double tiret) alors que MockIAService utilise `'MOBEL UNIQUE -- Apercu'` (Unicode : o trema, tiret cadratin, c cedille). Si `addWatermark` est appele sans argument explicite (ce qui n'est pas le cas actuellement -- la route simulate passe toujours le texte), le filigrane serait different entre les deux providers. Cela brise le contrat d'interchangeabilite du pattern factory.
**Fix:**
```typescript
async addWatermark(
  imageBuffer: Buffer,
  text = 'MOBEL UNIQUE \u2014 Aper\u00e7u'
): Promise<Buffer> {
```

## Info

### IR-01: console.log dans le constructeur et la factory -- bruit en production

**File:** `src/lib/ai/nano-banana.ts:84` et `src/lib/ai/index.ts:14,18`
**Issue:** `console.log('[IA] NanoBananaService initialise ...')` et `console.log('[IA] Using NanoBanana provider')` sont emis a chaque instanciation du service, c'est-a-dire a chaque requete API (generate, generate-all, simulate). En production sous charge, cela genere du bruit dans les logs Vercel. Le projet specifie "zero code mort" -- ces logs de debug sont acceptables en dev mais pas ideaux pour la prod.
**Fix:** Remplacer par un pattern de log conditionnel ou supprimer les logs de la factory. Garder les logs de timing (ligne 155) qui ont une valeur en production.

### IR-02: Cast non-securise de FormData.get('image')

**File:** `src/app/api/simulate/route.ts:62`
**Issue:** `formData.get('image') as File | null` est un cast TypeScript. Si un client envoie `image` comme champ texte (et non comme fichier), le runtime recevrait un `string` qui passerait les validations (`!image` est `false` sur string non-vide, `image.size` est `undefined` donc `!== 0`), puis `image.arrayBuffer()` crasherait a la ligne 124 avec une erreur opaque. Le catch externe retournerait un 500 generique au lieu d'un 400 clair.
**Fix:**
```typescript
const image = formData.get('image')
if (!image || typeof image === 'string' || image.size === 0) {
  return NextResponse.json(
    { error: "L'image du salon est requise (fichier attendu)." },
    { status: 400 }
  )
}
```

---

_Reviewed: 2026-04-08T15:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
