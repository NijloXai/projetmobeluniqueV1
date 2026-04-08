# Phase 13: NanoBananaService - Research

**Researched:** 2026-04-08
**Domain:** Intégration SDK @google/genai (Gemini) — remplacement stub IA + rate-limit IP + maxDuration Vercel
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `IMAGE_SAFETY` retourne HTTP 422 avec message français explicite
- **D-02:** Pas de fallback vers le mock après 3 retries échoués — erreur franche
- **D-03:** Validation stricte du buffer retourné (> 0 bytes, format PNG/JPEG valide) avant conversion
- **D-04:** Rate-limit par IP sur `/api/simulate` : max 5 appels/minute, compteur en mémoire (Map), HTTP 429 avec header `Retry-After`
- **D-05:** Timeout 30s — HTTP 504 avec message explicite
- **D-06:** Retry exponentiel 1s/2s/4s + jitter sur 429 et 5xx
- **D-07:** Traitement séquentiel `for...of` dans generate-all
- **D-08:** Si un angle échoue dans generate-all, skip et continuer
- **D-09:** Réponse generate-all inclut `errors: [{view_type, reason}]` en plus de `generated/total/success`
- **D-10:** Pas de SSE/progression pour v11
- **D-11:** `maxDuration = 300` (5 min) pour generate-all
- **D-12:** `maxDuration` sur les 3 routes IA : generate: 60s, generate-all: 300s, simulate: 60s
- **D-13:** Console structuré avec préfixe `[IA]` + durée + taille buffer + statut
- **D-14:** Logger tous les appels (succès + erreurs)
- **D-15:** Erreur 401 Gemini → 500 "Configuration IA invalide"
- **D-16:** Client `@google/genai` instancié une seule fois dans le constructeur (singleton)
- **D-17:** `NANO_BANANA_API_KEY` reste serveur-only (sans préfixe `NEXT_PUBLIC_`)
- **D-18:** Pas de rate-limit sur les routes admin — `requireAdmin()` suffit

### Claude's Discretion

- Stratégie retry 5xx : Claude choisit l'approche optimale selon les bonnes pratiques SDK Google
- Format de resize image simulate : Claude choisit `fit: 'inside'` vs largeur fixe selon les recommandations Gemini
- Verbosité des logs retry : résumé ou détaillé selon le contexte
- Détails de logging (modèle Gemini, taille payload) : Claude inclut les infos pertinentes pour le debug production
- Masquage clé API dans les logs : Claude choisit le bon niveau de sécurité
- Métriques agrégées : Claude évalue si des compteurs simples valent l'effort
- Validation format clé API au démarrage : Claude décide si un check basique vaut le coup

### Deferred Ideas (OUT OF SCOPE)

- SSE/progression pour generate-all
- Queue asynchrone pour génération batch (v12+)
- Multi-providers IA (v12+)
- Logger structuré pino/winston (v12+)
- Métriques Prometheus/Datadog (v12+)
- Rate-limit persistant Supabase/Redis (v12+)

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IA-01 | NanoBananaService.generate() via @google/genai avec retry exponentiel (1s/2s/4s + jitter) et timeout 30s | SDK pattern ci-dessous, AbortSignal.timeout(30000), retry manuel avec `error.message.includes('429')` |
| IA-02 | NanoBananaService.addWatermark() via Sharp SVG | Pattern identique MockIAService — réutiliser directement |
| IA-03 | Vérification finishReason === 'STOP' avant parsing réponse Gemini (gère IMAGE_SAFETY) | Accès `candidates[0].finishReason`, parts vides si IMAGE_SAFETY |
| IA-04 | Resize systématique image simulate avant envoi Gemini (max 1024px via Sharp) | `sharp(buf).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()` |
| IA-05 | Conversion PNG→JPEG des résultats Gemini (compatibilité Storage existant) | `sharp(buf).jpeg({ quality: 85 }).toBuffer()` — Gemini retourne PNG par défaut |
| IA-06 | export maxDuration = 300 dans generate-all/route.ts | `export const maxDuration = 300` en tête de fichier route App Router |
| IA-07 | Deux chemins d'entrée image : URL Supabase → fetch+base64 (admin) / data URI → split (simulate) | Patterns vérifiés, split sur `,` pour data URI |

</phase_requirements>

---

## Summary

La Phase 13 remplace le stub `NanoBananaService` (18 lignes, throw Error) par une implémentation réelle via le SDK `@google/genai` v1.48.0 (modèle `gemini-3.1-flash-image-preview`). Le périmètre est délibérément chirurgical : **un seul fichier** (`src/lib/ai/nano-banana.ts`) est modifié côté IA. Les 3 routes consommatrices ne changent pas structurellement — seuls `maxDuration` et le rate-limit IP (`/api/simulate`) sont ajoutés.

Les cinq risques techniques sont tous documentés et couverts : timeout Vercel sur generate-all (→ `maxDuration = 300`), 429 sans retry (→ backoff 1s/2s/4s + jitter), IMAGE_SAFETY crash (→ vérification `finishReason` avant accès `parts`), payload > 20 Mo (→ resize Sharp à 1024px pour simulate, URL directe pour admin), et conversion format (Gemini retourne PNG → Sharp JPEG pour compatibilité Storage).

**Recommandation principale :** Implémenter `NanoBananaService` avec le pattern `ai.models.generateContent()` + `AbortSignal.timeout(30000)` + retry manuel sur 429/5xx, puis ajouter `maxDuration` sur les 3 routes et le rate-limiter Map sur `/api/simulate`.

---

## Standard Stack

### Core

| Bibliothèque | Version | Rôle | Pourquoi |
|-------------|---------|------|----------|
| `@google/genai` | 1.48.0 (latest) | SDK officiel Gemini — seul moyen d'appeler `gemini-3.1-flash-image-preview` | SDK officiel Google, unique provider supporté |
| `sharp` | déjà installé (^0.34.5) | Resize avant envoi + conversion PNG→JPEG + watermark | Déjà utilisé dans le mock, pattern éprouvé |

[VERIFIED: npm registry] `@google/genai` version 1.48.0 confirmée via `npm view @google/genai version` le 2026-04-08.

### Pas de nouvelles dépendances devDependencies pour cette phase

Le test Vitest de `NanoBananaService` est dans la Phase 15 — cette phase ne crée pas de fichiers de test.

### Installation

```bash
npm install @google/genai@1.48.0
```

---

## Architecture Patterns

### Structure fichier unique modifié

```
src/lib/ai/
  nano-banana.ts   ← SEUL fichier modifié (18 lignes → ~120 lignes)
  types.ts         ← inchangé
  index.ts         ← inchangé (factory)
  mock.ts          ← inchangé (référence pour addWatermark)
  prompts.ts       ← inchangé

src/app/api/admin/
  generate/route.ts      ← ajouter maxDuration = 60
  generate-all/route.ts  ← ajouter maxDuration = 300 + erreurs tableau
  simulate/route.ts      ← ajouter maxDuration = 60 + rate-limit IP
```

### Pattern 1 : NanoBananaService.generate() — structure principale

```typescript
// Source: [CITED: ai.google.dev/gemini-api/docs/image-generation] + [VERIFIED: sdk types googleapis.github.io/js-genai]
import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import type { IAService, GenerateRequest, GenerateResult } from './types'

const MODEL = 'gemini-3.1-flash-image-preview'
const TIMEOUT_MS = 30_000
const MAX_RETRIES = 3
const BASE_DELAY_MS = 1_000

export class NanoBananaService implements IAService {
  private readonly ai: GoogleGenAI

  constructor() {
    const apiKey = process.env.NANO_BANANA_API_KEY
    if (!apiKey) {
      throw new Error('NANO_BANANA_API_KEY manquante — service IA non configuré.')
    }
    this.ai = new GoogleGenAI({ apiKey })
  }

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const { modelName, fabricName, viewType, sourceImageUrl } = request

    // Préparer les parts de la requête
    const imagePart = await this.resolveImagePart(sourceImageUrl)
    const prompt = buildBackOfficePrompt(modelName, fabricName, viewType)
    // Pour simulate (viewType === 'simulation') → buildSimulatePrompt

    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: MODEL,
          contents: [{ text: prompt }, imagePart],
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
            abortSignal: AbortSignal.timeout(TIMEOUT_MS),
          },
        })

        const candidate = response.candidates?.[0]
        if (!candidate) {
          throw new Error('Aucune réponse du modèle IA.')
        }

        // Vérifier finishReason AVANT d'accéder aux parts (IA-03)
        if (candidate.finishReason !== 'STOP') {
          if (candidate.finishReason === 'IMAGE_SAFETY') {
            throw new ImageSafetyError()
          }
          throw new Error(`Génération refusée (${candidate.finishReason}).`)
        }

        // Extraire l'image depuis les parts
        const imagePart = candidate.content?.parts?.find(p => p.inlineData?.data)
        if (!imagePart?.inlineData?.data) {
          throw new Error('Réponse Gemini sans données image.')
        }

        const rawBuffer = Buffer.from(imagePart.inlineData.data, 'base64')

        // Validation stricte (D-03)
        if (rawBuffer.length === 0) {
          throw new Error('Buffer image vide retourné par le modèle.')
        }

        // Conversion PNG→JPEG (IA-05) — Gemini retourne PNG
        const imageBuffer = await sharp(rawBuffer)
          .jpeg({ quality: 85 })
          .toBuffer()

        console.log(`[IA] generate OK — attempt=${attempt + 1} duration=... size=${imageBuffer.length}b`)

        return { imageBuffer, mimeType: 'image/jpeg', extension: 'jpg' }

      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        if (err instanceof ImageSafetyError) throw err  // Non-retryable

        const isRetryable = isRetryableError(lastError)
        const isLastAttempt = attempt === MAX_RETRIES - 1

        if (!isRetryable || isLastAttempt) throw lastError

        const delay = BASE_DELAY_MS * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4)
        console.warn(`[IA] Retry ${attempt + 1}/${MAX_RETRIES} dans ${Math.round(delay)}ms — ${lastError.message}`)
        await sleep(delay)
      }
    }

    throw lastError!
  }
}
```

### Pattern 2 : Résolution du chemin d'image — IA-07

Deux chemins d'entrée selon `sourceImageUrl` :

```typescript
// Source: [VERIFIED: code existant src/app/api/simulate/route.ts + CITED: ai.google.dev docs]
private async resolveImagePart(sourceImageUrl: string) {
  if (sourceImageUrl.startsWith('data:')) {
    // Chemin simulate : data URI déjà base64 — split sur la virgule
    const [meta, data] = sourceImageUrl.split(',')
    const mimeType = meta.split(':')[1].split(';')[0]
    // Resize avant envoi (IA-04) — la route simulate a déjà redimensionné
    return { inlineData: { mimeType, data } }
  } else {
    // Chemin admin : URL Supabase publique → fetch + base64
    const res = await fetch(sourceImageUrl)
    if (!res.ok) throw new Error(`Impossible de récupérer l'image source (${res.status}).`)
    const buffer = await res.arrayBuffer()
    const data = Buffer.from(buffer).toString('base64')
    const mimeType = res.headers.get('content-type') || 'image/jpeg'
    return { inlineData: { mimeType, data } }
  }
}
```

### Pattern 3 : Retry sur erreurs temporaires

```typescript
// Source: [CITED: cloud.google.com/vertex-ai/generative-ai/docs/retry-strategy]
function isRetryableError(err: Error): boolean {
  const msg = err.message
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.name === 'AbortError'  // timeout → retryable
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

class ImageSafetyError extends Error {
  constructor() {
    super("Cette image n'a pas pu être traitée (contenu non autorisé). Essayez une autre photo.")
    this.name = 'ImageSafetyError'
  }
}
```

### Pattern 4 : Resize image dans `/api/simulate` (IA-04)

À ajouter dans `/api/simulate/route.ts` avant la construction de `sourceImageUrl` :

```typescript
// Source: [CITED: sharp.pixelplumbing.com/api-resize]
// Resize systématique avant envoi Gemini — évite payload > 20 Mo
const rawBuffer = Buffer.from(await image.arrayBuffer())
const resizedBuffer = await sharp(rawBuffer)
  .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 80 })
  .toBuffer()
const sourceImageUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`
```

### Pattern 5 : Rate-limit IP en mémoire — `/api/simulate`

```typescript
// Source: [CITED: freecodecamp.org/news/how-to-build-an-in-memory-rate-limiter-in-nextjs]
// En dehors de la fonction POST (module-level) — persiste entre requêtes serverless
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_WINDOW_MS = 60_000

function getRateLimitEntry(ip: string) {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    const next = { count: 1, resetAt: now + RATE_WINDOW_MS }
    rateMap.set(ip, next)
    return { allowed: true, retryAfter: 0 }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count++
  return { allowed: true, retryAfter: 0 }
}

// Dans POST :
const ip =
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  '127.0.0.1'
const { allowed, retryAfter } = getRateLimitEntry(ip)
if (!allowed) {
  return NextResponse.json(
    { error: `Trop de demandes. Réessayez dans ${retryAfter} secondes.` },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  )
}
```

### Pattern 6 : maxDuration Vercel (IA-06, D-11, D-12)

```typescript
// Source: [CITED: vercel.com/docs/functions/configuring-functions/duration]
// À ajouter EN TÊTE de chaque route.ts, avant tout import
export const maxDuration = 60   // generate/route.ts et simulate/route.ts
export const maxDuration = 300  // generate-all/route.ts
```

### Pattern 7 : Tableau d'erreurs dans generate-all (D-09)

```typescript
// Modification de la structure de retour de generate-all/route.ts
const errors: Array<{ view_type: string; reason: string }> = []

// Dans la boucle for...of, remplacer continue par :
errors.push({ view_type: modelImage.view_type, reason: err.message })
continue

// Réponse finale :
return NextResponse.json({
  generated: results,
  total: modelImages.length,
  success: results.length,
  errors,
})
```

### Anti-Patterns à éviter

- **Ne pas accéder à `parts[0].inlineData.data` sans vérifier `finishReason`** — TypeError silencieuse si IMAGE_SAFETY
- **Ne pas instancier `GoogleGenAI` à chaque appel** — singleton dans le constructeur (D-16)
- **Ne pas logger `process.env.NANO_BANANA_API_KEY`** — fuite clé API dans logs Vercel
- **Ne pas appeler `AbortSignal.timeout()` depuis un try déjà expiré** — créer le signal avant la boucle retry ou dans chaque tentative
- **Ne pas passer l'URL Supabase directement pour simulate** — toujours convertir en base64 après resize (le SDK JS ne supporte pas les URLs arbitraires en `fileUri`)
- **Ne pas oublier `withoutEnlargement: true` dans le resize** — évite d'upscaler des petites images

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser plutôt | Pourquoi |
|----------|------------------|-----------------|----------|
| Conversion PNG→JPEG | Décodeur PNG manuel | `sharp(buf).jpeg({quality:85}).toBuffer()` | Sharp gère tous les cas edge (profil ICC, métadonnées EXIF, formats transparents) |
| Watermark SVG | Canvas / compositing manuel | `sharp(buf).composite([{input: svgBuf}])` | Pattern déjà validé dans MockIAService |
| Resize proportionnel | Calcul width/height manuels | `sharp().resize(1024,1024,{fit:'inside'})` | `fit:'inside'` garantit les deux dimensions ≤ 1024 sans distorsion |
| Retry avec backoff | setTimeout récursif | Pattern `for...of attempts` avec `sleep()` | Simple, lisible, TypeScript strict, sans dépendance |
| Timeout requête Gemini | wrapping Promise.race manuel | `AbortSignal.timeout(30_000)` dans config | Native Node.js 18+, standard, levée d'AbortError identifiable |
| Rate-limit IP simulate | Middleware externe | Map module-level + compteur fenêtre glissante | Scope phase 13 : D-04 spécifie Map en mémoire, Redis déféré v12+ |

---

## Common Pitfalls

### Pitfall 1 : AbortError n'est pas catchable avec `err instanceof Error` seul

**Ce qui se passe :** `AbortSignal.timeout()` lève une `DOMException` de type `AbortError`. Dans certains contextes Node.js, `err.name === 'AbortError'` mais `err instanceof Error` est `true`. La confusion vient du message qui dit "This operation was aborted" sans mention du timeout.

**Pourquoi :** Le SDK @google/genai encapsule parfois l'AbortError dans une `GoogleGenerativeAIError` — le message original est préservé mais le type change.

**Comment éviter :** Vérifier `err.name === 'AbortError'` OU `err.message?.includes('aborted')` en plus du statut HTTP. Considérer l'AbortError comme timeout et retourner HTTP 504.

**Signes d'alerte :** Erreur 500 générique après 30s d'attente (au lieu de 504 avec message explicite).

[MEDIUM confidence — vérification sur comportement exact SDK v1.48.0 non testée en local]

---

### Pitfall 2 : finishReason STOP mais parts vide ou sans inlineData

**Ce qui se passe :** Gemini peut retourner `finishReason: 'STOP'` avec `content.parts` contenant uniquement un part texte (pas d'image). Cela se produit quand le modèle refuse discrètement de générer une image sans déclencher IMAGE_SAFETY.

**Pourquoi :** Le modèle répond en texte expliquant pourquoi il ne peut pas générer l'image, sans flag safety explicite.

**Comment éviter :** Après le check `finishReason`, chercher le part image avec `.find(p => p.inlineData?.data)` — si absent, lever une erreur explicite plutôt qu'un undefined silencieux.

**Signes d'alerte :** TypeError "Cannot read properties of undefined (reading 'data')" dans les logs après finishReason STOP.

[CITED: discuss.ai.google.dev/t/finishreason-stop-but-parts-is-missing-inside-candidate/99331]

---

### Pitfall 3 : Rate-limit Map perdu entre cold starts Vercel

**Ce qui se passe :** Sur Vercel (fonctions serverless), chaque cold start réinitialise la Map. Un utilisateur peut donc dépasser le rate-limit de 5/minute si les requêtes tombent sur des instances distinctes.

**Pourquoi :** Le scope module-level ne persiste que dans la même instance serverless. Vercel peut scaler horizontalement.

**Comment éviter :** Ce comportement est **acceptable pour v11** selon D-04 (Map en mémoire, Redis déféré v12+). Documenter la limitation dans le code avec un commentaire.

**Signes d'alerte :** Rate-limit contournable en production à fort trafic — non critique pour le volume actuel.

[ASSUMED — comportement Vercel cold start, non testé]

---

### Pitfall 4 : maxDuration ignoré en développement local

**Ce qui se passe :** `export const maxDuration = 300` n'a aucun effet sur `npm run dev` (Turbopack). Les timeouts ne sont appliqués que sur Vercel déployé.

**Pourquoi :** Turbopack/Next.js dev ne simule pas les timeouts Vercel.

**Comment éviter :** Tester `generate-all` avec la vraie clé uniquement sur l'environnement Vercel (staging ou preview). Ne pas conclure que le timeout est résolu parce que ça fonctionne en local.

**Signes d'alerte :** generate-all fonctionne en dev mais 504 en prod.

[CITED: vercel.com/docs/functions/configuring-functions/duration]

---

### Pitfall 5 : responseModalities sans 'IMAGE' → réponse texte seulement

**Ce qui se passe :** Si `responseModalities` est omis ou ne contient que `['TEXT']`, Gemini répond en texte — pas d'image dans les parts. Aucune erreur levée, juste des parts sans `inlineData`.

**Pourquoi :** `responseModalities` doit inclure `'IMAGE'` explicitement pour les modèles d'image génération.

**Comment éviter :** Toujours passer `config: { responseModalities: ['TEXT', 'IMAGE'] }`.

[CITED: ai.google.dev/gemini-api/docs/image-generation]

---

## Code Examples

### Exemple complet : appel Gemini avec gestion IMAGE_SAFETY

```typescript
// Source: [CITED: ai.google.dev/gemini-api/docs/image-generation]
const response = await this.ai.models.generateContent({
  model: 'gemini-3.1-flash-image-preview',
  contents: [
    { text: prompt },
    { inlineData: { mimeType: 'image/jpeg', data: base64 } },
  ],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    abortSignal: AbortSignal.timeout(30_000),
  },
})

const candidate = response.candidates?.[0]
if (!candidate) throw new Error('Aucune réponse du modèle IA.')

if (candidate.finishReason !== 'STOP') {
  if (candidate.finishReason === 'IMAGE_SAFETY') throw new ImageSafetyError()
  throw new Error(`Génération refusée (${candidate.finishReason}).`)
}

const imgPart = candidate.content?.parts?.find(p => p.inlineData?.data)
if (!imgPart?.inlineData?.data) throw new Error('Réponse Gemini sans données image.')

const rawBuffer = Buffer.from(imgPart.inlineData.data, 'base64')
if (rawBuffer.length === 0) throw new Error('Buffer image vide.')

// Conversion PNG→JPEG
const imageBuffer = await sharp(rawBuffer).jpeg({ quality: 85 }).toBuffer()
```

### Exemple : resize image simulate avant envoi

```typescript
// Source: [CITED: sharp.pixelplumbing.com/api-resize]
const rawBuffer = Buffer.from(await image.arrayBuffer())
const resizedBuffer = await sharp(rawBuffer)
  .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 80 })
  .toBuffer()
const sourceImageUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`
```

### Exemple : maxDuration en tête de route App Router

```typescript
// Source: [CITED: vercel.com/docs/functions/configuring-functions/duration]
// Ligne 1 du fichier — avant les imports
export const maxDuration = 300
```

### Exemple : erreur 422 IMAGE_SAFETY dans la route

```typescript
// Pattern cohérent avec D-01 et le pattern HEIC existant dans simulate/route.ts
} catch (genErr) {
  const genMessage = genErr instanceof Error ? genErr.message : ''
  if (genErr instanceof ImageSafetyError || genMessage.includes('contenu non autorisé')) {
    return NextResponse.json({ error: genMessage }, { status: 422 })
  }
  if (genMessage.includes('trop de temps') || genErr?.name === 'AbortError') {
    return NextResponse.json(
      { error: 'La génération a pris trop de temps. Veuillez réessayer.' },
      { status: 504 }
    )
  }
  throw genErr
}
```

---

## State of the Art

| Ancienne approche | Approche actuelle | Changement | Impact |
|-------------------|-------------------|------------|--------|
| Stub throw Error | `ai.models.generateContent()` avec retry | 2024→2026 | NanoBananaService fonctionnel |
| `@google/generative-ai` (deprecated) | `@google/genai` (SDK unifié) | 2024 | Nouveau package npm, nouvelle API |
| `gemini-2.0-flash-exp` | `gemini-3.1-flash-image-preview` | 2025→2026 | Modèle actuel pour image gen |
| `Promise.race()` pour timeout | `AbortSignal.timeout(ms)` | Node 18+ | Pattern natif, moins de boilerplate |

**Deprecated/obsolète :**
- `@google/generative-ai` : ancien SDK, remplacé par `@google/genai` [CITED: npmjs.com/package/@google/genai]
- `gemini-2.0-flash-exp-image-generation` : nom expérimental, remplacé par des noms GA [ASSUMED — basé sur historique des modèles]

---

## Assumptions Log

| # | Claim | Section | Risque si faux |
|---|-------|---------|----------------|
| A1 | `AbortSignal.timeout()` déclenche un AbortError catchable par `err.name === 'AbortError'` dans @google/genai v1.48.0 | Architecture Patterns Pitfall 1 | Timeout non détecté → 500 générique au lieu de 504 |
| A2 | Vercel Pro plan accepte `maxDuration = 300` dans App Router route.ts | Architecture Patterns Pattern 6 | 504 sur generate-all si limite Pro < 300s |
| A3 | `gemini-2.0-flash-exp-image-generation` est deprecated au profit de noms GA | State of the Art | Modèle renommé ou disparu, mais CONTEXT.md fixe `gemini-3.1-flash-image-preview` donc sans impact |
| A4 | Map module-level persiste entre requêtes Vercel dans la même instance (warm) | Common Pitfalls Pitfall 3 | Rate-limit moins fiable mais comportement acceptable selon D-04 |
| A5 | Le SDK `@google/genai` v1.48.0 expose `response.candidates[0].finishReason` directement (pas `response.candidates[0].finishReason?.finishReason`) | Architecture Patterns Pattern 1 | TypeError à l'accès — à vérifier au premier test intégration |

---

## Open Questions

1. **Type exact de l'erreur 401 Gemini (clé invalide)**
   - Ce qu'on sait : D-15 spécifie "retourner 500 Configuration IA invalide"
   - Ce qui est flou : le message exact de l'erreur levée par @google/genai pour une clé invalide (401 ? 403 ? message `UNAUTHENTICATED` ?)
   - Recommandation : Vérifier `err.message.includes('API_KEY_INVALID')` OU `err.message.includes('401')` OU `err.message.includes('UNAUTHENTICATED')` — les trois cas couvrent les variantes documentées

2. **Compatibilité TypeScript strict `any` sur les types Gemini**
   - Ce qu'on sait : Le projet est TypeScript strict (aucun `any`)
   - Ce qui est flou : Les types retournés par `@google/genai` v1.48.0 pour `candidates[0].content.parts` — nullable ou non ?
   - Recommandation : Utiliser optional chaining `candidate.content?.parts?.find(...)` — protège contre les types nullable sans `any`

---

## Environment Availability

| Dépendance | Requise par | Disponible | Version | Fallback |
|------------|------------|------------|---------|----------|
| Node.js ≥ 18 (AbortSignal.timeout) | IA-01 timeout | ✓ | v22 (.nvmrc) | — |
| Sharp | IA-02, IA-04, IA-05 | ✓ | ^0.34.5 (installé) | — |
| @google/genai | IA-01 | ✗ | non installé → npm install | Aucun (must install) |
| NANO_BANANA_API_KEY | Tests intégration réelle | N/A | env var serveur uniquement | Mock (factory pattern déjà en place) |

**Dépendances bloquantes sans fallback :**
- `@google/genai` doit être installé avant l'implémentation : `npm install @google/genai@1.48.0`

**Dépendances avec fallback :**
- `NANO_BANANA_API_KEY` absente → `getIAService()` retourne le mock — le code peut être testé sans clé

---

## Validation Architecture

> `workflow.nyquist_validation` absent de config.json — traité comme activé.

### Test Framework

| Propriété | Valeur |
|-----------|--------|
| Framework | Vitest ^3.2.4 (installé) |
| Config | `vitest.config.ts` à la racine |
| Commande rapide | `npx vitest run --reporter=verbose` |
| Suite complète | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Comportement | Type test | Commande automatisée | Fichier |
|--------|-------------|-----------|---------------------|---------|
| IA-01 | generate() appelle Gemini avec retry sur 429 | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ Wave 0 |
| IA-02 | addWatermark() retourne buffer JPEG avec overlay | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ Wave 0 |
| IA-03 | IMAGE_SAFETY → erreur explicite (pas TypeError) | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ Wave 0 |
| IA-04 | Image simulate redimensionnée avant envoi | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ Wave 0 |
| IA-05 | Résultat Gemini converti en JPEG | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ Wave 0 |
| IA-06 | maxDuration exporté dans les routes | smoke | `npx tsc --noEmit` | ✅ (vérif. TypeScript) |
| IA-07 | Deux chemins image (URL Supabase + data URI) | unit | `npx vitest run src/__tests__/nano-banana.test.ts` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `src/__tests__/nano-banana.test.ts` — couvre IA-01 à IA-07 avec `vi.mock('@google/genai')`

*(Pas de nouveau fichier de config ni de fixtures — infrastructure Vitest existante est suffisante)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applicable | Contrôle standard |
|---------------|-----------|-------------------|
| V2 Authentication | non | Hors scope (Supabase Auth géré) |
| V3 Session Management | non | Hors scope |
| V4 Access Control | partiel | `requireAdmin()` sur routes admin — déjà en place |
| V5 Input Validation | oui | Validation taille image déjà présente (15 Mo MAX), resize comme défense supplémentaire |
| V6 Cryptography | non | Pas de chiffrement côté IA |

### Menaces spécifiques au stack IA

| Menace | STRIDE | Mitigation standard |
|--------|--------|---------------------|
| Fuite clé API dans les logs | Information disclosure | Ne jamais logger `process.env.*` — vérifier tous les `console.*` |
| Injection de prompt (sourceImageUrl malformé) | Tampering | Validation URL ou data URI avant traitement — `url.startsWith('data:')` vs URL valide |
| DoS via images lourdes sur `/api/simulate` | DoS | Limite 15 Mo déjà en place + resize à 1024px réduit davantage le vecteur |
| Rate-limit bypass sur `/api/simulate` | DoS | Map en mémoire (acceptable v11, Redis en v12+) |
| `x-forwarded-for` spoofing | Spoofing | Risque limité : la route n'est pas auth-protégée par design — taux 5/min par IP de toute façon |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] `@google/genai` v1.48.0 — `npm view @google/genai version` (2026-04-08)
- [CITED: ai.google.dev/gemini-api/docs/image-generation] — modèles, responseModalities, finishReason IMAGE_SAFETY, pattern Node.js
- [CITED: googleapis.github.io/js-genai/release_docs/interfaces/types.GenerateContentConfig.html] — abortSignal, responseModalities, httpOptions
- [CITED: sharp.pixelplumbing.com/api-resize] — `fit: 'inside'`, `withoutEnlargement`
- [CITED: vercel.com/docs/functions/configuring-functions/duration] — maxDuration, limites par plan
- [VERIFIED: code existant src/lib/ai/] — mock, types, factory, stub, routes — observation directe

### Secondary (MEDIUM confidence)
- [CITED: freecodecamp.org/news/how-to-build-an-in-memory-rate-limiter-in-nextjs/] — pattern Map rate-limit Next.js
- [CITED: discuss.ai.google.dev/t/finishreason-stop-but-parts-is-missing-inside-candidate/99331] — pitfall parts vide avec finishReason STOP
- [CITED: cloud.google.com/vertex-ai/generative-ai/docs/retry-strategy] — stratégie retry Google recommandée

### Tertiary (LOW confidence)
- Comportement AbortError dans @google/genai v1.48.0 — non testé en local (voir Assumptions Log A1)

---

## Metadata

**Confidence breakdown :**
- Standard stack : HIGH — version npm vérifiée, SDK confirmé via docs officielles
- Architecture : HIGH — patterns extraits des docs officielles + code existant analysé
- Pitfalls : HIGH — combinaison docs officielles + forums Google Developers + code existant
- Security : MEDIUM — ASVS appliqué au contexte, contrôles existants vérifiés dans le code

**Date de recherche :** 2026-04-08
**Valide jusqu'au :** 2026-05-08 (SDK stable, modèle en preview — vérifier si nom modèle change)
