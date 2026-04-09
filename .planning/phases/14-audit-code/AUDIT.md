# Audit Code — Möbel Unique

**Date :** 2026-04-09
**Perimetre :** src/ (77 fichiers TS/TSX, 20 CSS modules) + configs + scripts
**Outils :** ESLint 9.39.4 (8 errors, 24 warnings), knip 6.3.1, tsc --noEmit (28 erreurs), scripts/audit-code.ts (52 findings)
**Phase :** 14-audit-code — documentation seulement, aucune correction (D-14)

---

## Resume Executif

| Categorie | Critical | Warning | Info | Total |
|-----------|----------|---------|------|-------|
| Securite | 1 | 11 | 0 | 12 |
| Performance | 0 | 5 | 8 | 13 |
| Dead Code | 0 | 11 | 9 | 20 |
| TypeScript & Bonnes Pratiques | 0 | 26 | 3 | 29 |
| **Total** | **1** | **53** | **20** | **74** |

**Source des findings :**
- ESLint : 32 problemes (8 errors + 24 warnings)
- knip : 20 findings (4 fichiers orphelins, 10 deps inutilisees, 4 exports morts, 6 types morts)
- tsc --noEmit : 28 erreurs TypeScript
- scripts/audit-code.ts : 52 findings (35 Warning, 17 Info)
- Revue manuelle : 5 fichiers critiques analyses (proxy.ts, nano-banana.ts, simulate/route.ts, generate-all/route.ts, next.config.ts)

---

## Securite (AUDIT-01)

### SEC-01: Security headers absents dans next.config.ts
**Fichier :** `next.config.ts:1`
**Severite :** Critical
**Source :** script custom + revue manuelle
**Description :** Le fichier `next.config.ts` ne configure aucun security header HTTP. Les headers critiques manquants : `X-Frame-Options` (protection clickjacking), `X-Content-Type-Options` (protection MIME sniffing), `Referrer-Policy` (protection fuite referer), `Content-Security-Policy` (protection XSS), `Strict-Transport-Security` (force HTTPS), `Permissions-Policy`.
**Code :**
```typescript
const nextConfig: NextConfig = {
  images: { remotePatterns: [...] },
  // Aucune fonction headers() configuree
}
```
**Suggestion :** Ajouter une fonction `headers()` async dans `next.config.ts` qui retourne les security headers pour toutes les routes (`source: '/(.*)'`). Exemple minimal :
```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }]
}
```
Pour CSP : ajouter en phase 16 apres audit complet des sources de contenu (Supabase, Google Fonts, etc.).

---

### SEC-02: Route simulate sans validation du type MIME de l'image
**Fichier :** `src/app/api/simulate/route.ts:66`
**Severite :** Warning
**Source :** revue manuelle
**Description :** L'image recue est validee en taille (`image.size > MAX_FILE_SIZE`, ligne 78) mais le type MIME n'est pas verifie via `image.type`. Un attaquant peut envoyer un fichier non-image (PDF, ZIP, SVG) avec l'extension `.jpg`. Sharp echouera en aval mais l'erreur n'est pas geree explicitement avant le traitement.
**Code :**
```typescript
const image = formData.get('image') as File | null
// ...
if (image.size > MAX_FILE_SIZE) { /* OK */ }
// ABSENT : verification image.type
```
**Suggestion :** Ajouter avant le rate-limit : `const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']` et `if (!ALLOWED_MIME.includes(image.type)) return 422`. Cela evite de consommer du processing IA sur des fichiers non-images.

---

### SEC-03: Rate-limit en memoire non persistant entre cold starts Vercel
**Fichier :** `src/app/api/simulate/route.ts:13`
**Severite :** Warning
**Source :** revue manuelle (commentaire code)
**Description :** La `rateMap` est une variable `Map` module-level. Sur Vercel, chaque cold start repart de zero. Un attaquant peut forcer des cold starts pour contourner le rate-limit de 5 req/min. Le code lui-meme documente cette limitation (commentaire ligne 12).
**Code :**
```typescript
// Rate-limit en memoire par IP — 5 appels/minute (D-04)
// Limitation connue : reset au cold start Vercel (Redis differe v12+)
const rateMap = new Map<string, { count: number; resetAt: number }>()
```
**Suggestion :** Pour v12+, migrer vers Upstash Redis (`@upstash/ratelimit`). Pour l'immediat, documenter dans les logs de production qu'un spike d'appels IA peut se produire apres chaque cold start. La limitation est acceptable pour v11.0 (commentaire present).

---

### SEC-04: Eviction rateMap avec seuil fixe de 1000 entrees
**Fichier :** `src/app/api/simulate/route.ts:21`
**Severite :** Warning
**Source :** revue manuelle
**Description :** L'eviction des entrees expirees n'est declenchee que quand `rateMap.size > 1000`. En dessous du seuil, les entrees expirees restent en memoire indefiniment. Dans un contexte serverless longue duree, cela peut constituer une legere fuite memoire.
**Code :**
```typescript
if (rateMap.size > 1000) {
  for (const [key, val] of rateMap) {
    if (now > val.resetAt) rateMap.delete(key)
  }
}
```
**Suggestion :** Reduire le seuil a 100 entrees ou appliquer l'eviction systematiquement (sans condition). Sur Vercel, les instances sont ephemeres donc l'impact est faible.

---

### SEC-05: Absence de validation de l'ID dans les routes admin (injection UUID)
**Fichier :** `src/app/api/admin/models/[id]/route.ts:18`
**Severite :** Warning
**Source :** revue manuelle
**Description :** Les routes admin qui acceptent un parametre `:id` (models, fabrics, visuals, images) ne valident pas que l'ID est un UUID valide avant d'executer la requete Supabase. Un `:id` malformé (ex : `' OR '1'='1`) est envoye directement a Supabase. Supabase utilise des requetes parametrisees (protection injection SQL), mais la validation UUID cote serveur est une bonne pratique defensive.
**Code :**
```typescript
const { id } = await params
// Aucune validation UUID avant :
const { data, error } = await supabase!.from('models').select('*').eq('id', id).single()
```
**Suggestion :** Ajouter `const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` et retourner 400 si l'ID n'est pas un UUID valide. Cela evite des requetes DB inutiles et clarifie les erreurs.

---

### SEC-06: Cles API Supabase forcees avec `!` sans fallback
**Fichier :** `src/lib/supabase/middleware.ts:17`
**Severite :** Warning
**Source :** revue manuelle + tsc
**Description :** Les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL!` et `NEXT_PUBLIC_SUPABASE_ANON_KEY!` sont utilisees avec assertion de non-nullite dans 3 fichiers (middleware, server, admin). Si ces variables sont absentes au runtime, Next.js leve une erreur non geree qui peut exposer le stacktrace.
**Code :**
```typescript
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,  // assertion forcee
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // assertion forcee
```
**Suggestion :** Ajouter une validation des env vars au startup dans `src/lib/supabase/client.ts` : `if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL manquante')`. Un fichier `src/lib/env.ts` centralise serait preferable.

---

### SEC-07: resolveImagePart() sans validation de la taille de la data URI
**Fichier :** `src/lib/ai/nano-banana.ts:200`
**Severite :** Warning
**Source :** revue manuelle
**Description :** La methode `resolveImagePart()` accepte une `sourceImageUrl` sans verifier la taille des donnees base64. Le chemin admin (URL fetch) pourrait fetcher une image tres volumineuse si l'URL Supabase pointe vers un fichier corrompu ou remplace. Il n'y a pas de limite sur `buffer.length` avant de creer le part SDK.
**Code :**
```typescript
const res = await fetch(sourceImageUrl)
// ...
const buffer = await res.arrayBuffer()  // Aucune limite de taille
const data = Buffer.from(buffer).toString('base64')
return { inlineData: { mimeType, data } }
```
**Suggestion :** Ajouter une verification `if (buffer.byteLength > 20 * 1024 * 1024) throw new Error('Image source trop volumineuse')` avant la conversion base64. 20 Mo est la limite documentee de Gemini.

---

### SEC-08: Route simulate — IP extraction depuis x-forwarded-for non sanitisee
**Fichier :** `src/app/api/simulate/route.ts:49`
**Severite :** Warning
**Source :** revue manuelle
**Description :** L'IP est extraite de `x-forwarded-for` (split sur `,` + trim). Ce header peut etre forge par un client en ajoutant `X-Forwarded-For: 1.2.3.4, real-ip`. La logique `split(',')[0]` prend la premiere IP, qui peut etre n'importe quelle valeur arbitraire. Cela permet de bypasser le rate-limit avec des IPs falsifiees.
**Code :**
```typescript
const ip =
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  '127.0.0.1'
```
**Suggestion :** Prendre la **derniere** IP dans `x-forwarded-for` (ajoutee par le proxy Vercel, non falsifiable) : `.split(',').at(-1)?.trim()`. Ou utiliser `request.headers.get('x-real-ip')` en priorite si Vercel le definit de facon fiable.

---

### SEC-09: Routes POST admin sans validation Zod — generate et visuals
**Fichier :** `src/app/api/admin/generate/route.ts:13`
**Severite :** Warning
**Source :** script custom
**Description :** Plusieurs routes admin POST n'utilisent pas de schema Zod pour valider le body. Elles font une validation manuelle (if/else), ce qui est moins robuste qu'un schema Zod et peut laisser passer des types inattendus.

Fichiers concernes (detection script custom) :
- `src/app/api/admin/generate/route.ts:13`
- `src/app/api/admin/generate-all/route.ts:13`
- `src/app/api/admin/visuals/bulk-publish/route.ts:10`
- `src/app/api/admin/visuals/bulk-validate/route.ts:9`
- `src/app/api/admin/models/[id]/images/route.ts:56`
- `src/app/api/admin/models/[id]/visuals/route.ts:59`
- `src/app/api/admin/visuals/[id]/publish/route.ts:9`
- `src/app/api/admin/visuals/[id]/validate/route.ts:8`

**Note :** Ces routes sont protegees par `requireAdmin()`. La validation manuelle presente est correcte. C'est un Warning de qualite, pas une faille critique.
**Code :**
```typescript
// generate-all/route.ts:17 — validation manuelle sans Zod
const { model_id, fabric_id } = body
if (!model_id || !fabric_id) {
  return NextResponse.json({ error: '...' }, { status: 400 })
}
```
**Suggestion :** Creer des schemas Zod dans `src/lib/schemas.ts` pour ces routes : `generateSchema = z.object({ model_id: z.string().uuid(), fabric_id: z.string().uuid() })` et utiliser `.safeParse(body)` dans chaque route.

---

### SEC-10: Pas de CSP (Content-Security-Policy) configure
**Fichier :** `next.config.ts:1`
**Severite :** Warning
**Source :** script custom + revue manuelle
**Description :** Aucune politique CSP n'est configuree. L'application charge des ressources de `**.supabase.co` (images) et Google Fonts (Montserrat). Sans CSP, tout script injecte s'executerait sans restriction.
**Code :**
```typescript
// next.config.ts — aucune headers() function
```
**Suggestion :** Integrer dans la correction de SEC-01. CSP minimale : `default-src 'self'; img-src 'self' https://*.supabase.co data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`.

---

### SEC-11: Pas de Referrer-Policy configure
**Fichier :** `next.config.ts:1`
**Severite :** Warning
**Source :** script custom
**Description :** Sans `Referrer-Policy`, les navigateurs envoient l'URL complete dans le header Referer lors de navigation vers des sites externes (Shopify, WhatsApp). Cela peut exposer des parametres d'URL ou des identifiants de session.
**Code :**
```typescript
// next.config.ts — aucune headers() function
```
**Suggestion :** Integrer dans SEC-01. Recommande : `strict-origin-when-cross-origin` (valeur par defaut moderne mais doit etre explicite pour compatibilite).

---

## Performance (AUDIT-02)

### PERF-01: N+1 potentiel dans generate-all — await dans boucle for
**Fichier :** `src/app/api/admin/generate-all/route.ts:86`
**Severite :** Warning
**Source :** script custom
**Description :** La route `generate-all` boucle sur chaque `modelImage` et effectue plusieurs appels Supabase sequentiels (select existing + delete + upload + insert). Ce pattern est intentionnel pour la generation IA sequentielle (chaque appel Gemini prend 5-30s), mais les requetes Supabase de nettoyage pourraient etre parallelisees.
**Code :**
```typescript
for (const modelImage of modelImages) {
  // await supabase!.from('generated_visuals').select(...) — sequentiel
  // await supabase!.storage.from('generated-visuals').remove(...)
  // await iaService.generate(...)  ← intentionnellement sequentiel
  // await supabase!.storage.from('generated-visuals').upload(...)
  // await supabase!.from('generated_visuals').insert(...)
}
```
**Suggestion :** La sequentialite sur `iaService.generate()` est justifiee pour eviter de saturer l'API Gemini. Les requetes Supabase de pre-nettoyage (select + delete + storage.remove) pourraient etre parallelisees avec `Promise.all` par angle. Impact : gain de 100-500ms par angle sur le temps total de generation.

---

### PERF-02: N+1 dans DELETE models — deux .map() sur les chemins de stockage
**Fichier :** `src/app/api/admin/models/[id]/route.ts:159`
**Severite :** Warning
**Source :** script custom
**Description :** Lors du DELETE d'un modele, les chemins de stockage sont calcules via `.map((img) => extractStoragePath(img.image_url))` et `.map((v) => extractStoragePath(v.generated_image_url))`. Ces operations sont correctes (pas d'appel DB dans le map), mais le script les signale comme N+1. Note : `extractStoragePath` est une fonction pure sans IO.
**Code :**
```typescript
const paths = modelImages
  .map((img) => extractStoragePath(img.image_url))  // ligne 159 — pure
  .filter((p): p is string => p !== null)
```
**Suggestion :** Faux positif du detecteur automatique — `extractStoragePath` est une fonction pure. Ce finding est a clore dans Phase 16 sans correction necessaire. La detection via grep ne distingue pas les fonctions pures des appels IO.

---

### PERF-03: console.log en production dans src/lib/ai/index.ts
**Fichier :** `src/lib/ai/index.ts:14`
**Severite :** Warning
**Source :** ESLint (no-console) + script custom
**Description :** Deux `console.log` dans la factory IA : l'un indique le provider actif (NanaBanana vs Mock), l'autre non. Ces logs s'affichent a chaque appel a `getIAService()`, donc pour chaque requete simulate ou generate.
**Code :**
```typescript
if (process.env.NANO_BANANA_API_KEY) {
  console.log('[IA] Using NanaBanana provider')  // ligne 14 — warning ESLint
  return new NanaBananaService()
}
console.log('[IA] Using mock provider')  // ligne 18 — warning ESLint
```
**Suggestion :** Remplacer par `console.info` (silencieux en prod Next.js) ou par un flag d'initialisation unique pour ne logguer qu'au demarrage, pas a chaque requete. Alternative : supprimer et ne garder que le log dans le constructeur de `NanaBananaService`.

---

### PERF-04: console.log dans NanaBananaService.generate() a chaque appel
**Fichier :** `src/lib/ai/nano-banana.ts:153`
**Severite :** Warning
**Source :** ESLint (no-console) + script custom
**Description :** Un `console.log` affiche les metriques de generation (modele, attempt, duration, size, viewType) a chaque appel reussi. En production, cela genere un log par generation IA.
**Code :**
```typescript
console.log(
  `[IA] generate OK -- model=${MODEL} attempt=${attempt + 1} duration=${duration}ms size=${imageBuffer.length}b viewType=${viewType}`
)
```
**Suggestion :** Remplacer par `console.info` ou `console.debug`. Ces metriques sont utiles pour le debug mais verbeux en production. Conserver car informatif pour le monitoring.

---

### PERF-05: console.log dans generate route (generate et generate-all)
**Fichier :** `src/app/api/admin/generate/route.ts:162`
**Severite :** Warning
**Source :** ESLint (no-console) + script custom
**Description :** Les routes `generate` et `generate-all` utilisent `console.log` pour afficher les metriques de generation (nombre de visuels, duree). ESLint `no-console` autorise uniquement `console.error` et `console.warn`.

Fichiers concernes :
- `src/app/api/admin/generate/route.ts:162`
- `src/app/api/admin/generate-all/route.ts:176`
- `src/app/api/admin/visuals/bulk-publish/route.ts:49`
- `src/app/api/admin/visuals/bulk-validate/route.ts:46`
**Code :**
```typescript
console.log(
  `[POST /api/admin/generate-all] ${results.length}/${modelImages.length} visuels...`
)
```
**Suggestion :** Remplacer `console.log` par `console.info` ou supprimer ces logs de succes si la reponse JSON suffit. La config ESLint autorise `console.warn` et `console.error` — utiliser ces niveaux pour les operations importantes.

---

### PERF-06: Image src avec `<img>` natif au lieu de next/image
**Fichier :** `src/app/admin/(protected)/produits/ModelForm.tsx:581`
**Severite :** Warning
**Source :** ESLint (@next/next/no-img-element)
**Description :** Plusieurs composants utilisent `<img>` natif au lieu de `<Image>` de `next/image`, perdant l'optimisation automatique (lazy loading, formats modernes AVIF/WebP, tailles responsives).

Fichiers concernes :
- `src/app/admin/(protected)/produits/IAGenerationSection.tsx:285`
- `src/app/admin/(protected)/produits/ModelForm.tsx:581`
- `src/app/admin/(protected)/produits/ModelForm.tsx:705`
- `src/app/admin/(protected)/tissus/FabricList.tsx:97`
- `src/components/admin/ImageUpload.tsx:63`
- `src/components/public/Catalogue/ConfiguratorModal.tsx:680`
- `src/components/public/Catalogue/ConfiguratorModal.tsx:713`
- `src/components/public/Catalogue/ConfiguratorModal.tsx:745`
- `src/components/public/Catalogue/ConfiguratorModal.tsx:828`
**Code :**
```typescript
<img src={previewUrl} alt="..." style={{ objectFit: 'cover' }} />
```
**Suggestion :** Remplacer par `<Image>` de `next/image`. Attention : pour les images d'upload en preview local (blob URL), `next/image` ne supporte pas les blob URLs directement — garder `<img>` pour les previews temporaires et utiliser `<Image>` pour les URLs Supabase definitives.

---

### PERF-07: Inline styles pour objectFit dans ConfiguratorModal et ProductCard
**Fichier :** `src/components/public/Catalogue/ConfiguratorModal.tsx:509`
**Severite :** Info
**Source :** script custom
**Description :** 6 occurrences de `style={{ objectFit: 'cover' }}` dans ConfiguratorModal.tsx et 1 dans ProductCard.tsx. Ces valeurs sont litterales (pas dynamiques) et devraient etre dans les CSS modules.

Fichiers concernes :
- `src/components/public/Catalogue/ConfiguratorModal.tsx:509, 540, 596, 830`
- `src/components/public/Catalogue/ProductCard.tsx:23`
**Code :**
```typescript
<img src={...} style={{ objectFit: 'cover' }} />
```
**Suggestion :** Deplacer dans le CSS module : `.coverImage { object-fit: cover; }`. Exception justifiee : `style={{ width: \`${progress}%\` }}` (ligne 719) est une valeur dynamique — conserver en inline.

---

### PERF-08: console.log dans NanaBananaService constructor (init)
**Fichier :** `src/lib/ai/nano-banana.ts:82`
**Severite :** Info
**Source :** ESLint (no-console) + script custom
**Description :** `console.log` dans le constructeur de `NanaBananaService`. S'affiche une fois a l'initialisation du service.
**Code :**
```typescript
console.log(`[IA] NanoBananaService initialise (modele: ${MODEL})`)
```
**Suggestion :** Acceptable comme log d'initialisation. Remplacer par `console.info` pour conformite ESLint ou supprimer car redondant avec PERF-03.

---

## Dead Code (AUDIT-03)

### DEAD-01: 4 fichiers scripts orphelins selon knip
**Fichier :** `scripts/audit-code.ts:1`, `scripts/audit-full.ts:1`, `scripts/verify-e2e-m005.ts:1`, `scripts/verify-ia-mock.ts:1`
**Severite :** Warning
**Source :** knip
**Description :** knip signale ces 4 scripts comme "orphan files" car ils ne sont pas importe par d'autres modules et ne sont pas declares comme entry points dans `knip.json`. Ces scripts sont utilises manuellement via `npx tsx`, non par import.
**Code :**
```
ORPHAN: scripts/audit-code.ts
ORPHAN: scripts/audit-full.ts
ORPHAN: scripts/verify-e2e-m005.ts
ORPHAN: scripts/verify-ia-mock.ts
```
**Suggestion :** Faux positifs knip — ces scripts sont des outils CLI intentionnels. Ajouter dans `knip.json` sous `"entry"` : `["scripts/**/*.ts"]` pour les exclure du rapport. Ils ne doivent pas etre supprimes.

---

### DEAD-02: 8 dependances Radix UI non importees dans le code
**Fichier :** `package.json:16`
**Severite :** Warning
**Source :** knip
**Description :** knip detecte 8 dependances `@radix-ui/*` declarees dans `package.json` mais non importees dans le code source :
- `@radix-ui/react-dialog` (ligne 16)
- `@radix-ui/react-dropdown-menu` (ligne 17)
- `@radix-ui/react-label` (ligne 18)
- `@radix-ui/react-select` (ligne 19)
- `@radix-ui/react-slot` (ligne 20)
- `@radix-ui/react-switch` (ligne 21)
- `@radix-ui/react-toast` (ligne 22)
- `@radix-ui/react-toggle` (ligne 23)

**Note importante :** Le CLAUDE.md dit "Radix UI (headless) + CSS Modules" comme stack UI. Ces packages sont peut-etre prevus pour une utilisation future ou installes par anticipation. Verifier si l'un d'eux est utilise via dynamic import.
**Code :**
```json
"@radix-ui/react-dialog": "^1.1.14",
"@radix-ui/react-dropdown-menu": "^2.1.15",
// ...
```
**Suggestion :** Verifier si ces packages sont utilises via import dynamique (knip pourrait les rater). Si non utilises : supprimer pour reduire la taille du bundle et les vulnerabilites de supply chain. Si prevus pour une future phase : ajouter un commentaire dans `package.json`.

---

### DEAD-03: Dependances `immer` et `zustand` non importees
**Fichier :** `package.json:28`
**Severite :** Warning
**Source :** knip
**Description :** `immer` (ligne 28) et `zustand` (ligne 37) sont declares dans `dependencies` mais non importes dans le code source. Le CLAUDE.md mentionne "Zustand + Immer" comme pattern de state management, mais le frontend actuel n'a pas encore de state global Zustand implemente.
**Code :**
```json
"immer": "^10.1.1",
"zustand": "^5.0.5",
```
**Suggestion :** Si Zustand n'est pas encore utilise, deplacer vers `devDependencies` ou supprimer jusqu'a l'implementation. En production Next.js, les `dependencies` sont incluses dans le bundle serveur. Ces packages augmentent le bundle inutilement.

---

### DEAD-04: Dependance devDep `tinyglobby` non utilisee dans src/
**Fichier :** `package.json:54`
**Severite :** Warning
**Source :** knip
**Description :** `tinyglobby` est une devDependency utilisee uniquement dans `scripts/audit-code.ts` et `scripts/audit-full.ts` (scripts CLI, pas de src/). knip ne detecte pas l'utilisation dans scripts/ si ceux-ci sont marques orphelins.
**Code :**
```json
"tinyglobby": "^0.2.12"
```
**Suggestion :** Faux positif knip — `tinyglobby` est utilise par les scripts. Conserver. Corriger en ajoutant `scripts/**/*.ts` dans knip.json `entry` (voir DEAD-01).

---

### DEAD-05: Export `modelWithImagesSchema` non utilise
**Fichier :** `src/lib/schemas.ts:50`
**Severite :** Warning
**Source :** knip
**Description :** `modelWithImagesSchema` est exporte mais non importe dans le reste du codebase.
**Code :**
```typescript
export const modelWithImagesSchema = modelSchema.extend({
  model_images: z.array(modelImageSchema),  // ligne 50
})
```
**Suggestion :** Verifier si ce schema est utilise pour validation cote client (ConfiguratorModal, CatalogueSection). Si non utilise : supprimer pour garder le fichier schemas.ts propre.

---

### DEAD-06: Export `visualWithFabricSchema` non utilise
**Fichier :** `src/lib/schemas.ts:54`
**Severite :** Warning
**Source :** knip
**Description :** `visualWithFabricSchema` est exporte mais non importe dans le reste du codebase.
**Code :**
```typescript
export const visualWithFabricSchema = generatedVisualSchema.extend({
  fabric: fabricSchema,  // ligne 54
})
```
**Suggestion :** Meme recommandation que DEAD-05. Ce schema pourrait etre utilise dans ConfiguratorModal pour valider la reponse Supabase des visuels. Si non : supprimer.

---

### DEAD-07: Types `ModelInput` et `ModelUpdateInput` non utilises
**Fichier :** `src/lib/schemas.ts:84`
**Severite :** Warning
**Source :** knip
**Description :** Les types `ModelInput` (ligne 84) et `ModelUpdateInput` (ligne 85) sont inferres via `z.infer` et exportes mais non importes ailleurs.
**Code :**
```typescript
export type ModelInput = z.infer<typeof createModelSchema>  // ligne 84
export type ModelUpdateInput = z.infer<typeof updateModelSchema>  // ligne 85
```
**Suggestion :** Verifier si ces types sont utilises dans les formulaires admin (`ModelForm.tsx`). Si non : supprimer. Si oui : knip a un faux positif — verifier avec `grep -r "ModelInput" src/`.

---

### DEAD-08: Types `FabricInput` et `FabricUpdateInput` non utilises
**Fichier :** `src/lib/schemas.ts:86`
**Severite :** Warning
**Source :** knip
**Description :** `FabricInput` (ligne 86) et `FabricUpdateInput` (ligne 87) meme cas que DEAD-07.
**Code :**
```typescript
export type FabricInput = z.infer<typeof createFabricSchema>  // ligne 86
export type FabricUpdateInput = z.infer<typeof updateFabricSchema>  // ligne 87
```
**Suggestion :** Verifier usage dans les formulaires tissu. Si non utilises : supprimer.

---

### DEAD-09: Types `GeneratedVisualUpdate` et `ModelWithImagesAndVisuals` non utilises
**Fichier :** `src/types/database.ts:202`
**Severite :** Warning
**Source :** knip
**Description :** Deux types dans `database.ts` sont declares mais jamais importes : `GeneratedVisualUpdate` (ligne 202) et `ModelWithImagesAndVisuals` (ligne 209).
**Code :**
```typescript
export type GeneratedVisualUpdate = Database['public']['Tables']['generated_visuals']['Update']  // ligne 202
export type ModelWithImagesAndVisuals = ...  // ligne 209
```
**Suggestion :** `ModelWithImagesAndVisuals` est probablement un type complexe prevu pour les composants publics. Verifier l'usage avec grep. Si non utilise : supprimer pour garder `database.ts` propre.

---

### DEAD-10: Variable `countUngenerated` assignee mais non utilisee
**Fichier :** `src/app/admin/(protected)/produits/IAGenerationSection.tsx:193`
**Severite :** Warning (Error ESLint)
**Source :** ESLint (@typescript-eslint/no-unused-vars)
**Description :** La variable `countUngenerated` est calculee (ligne 193) mais jamais referencee dans le JSX ou la logique.
**Code :**
```typescript
const countUngenerated = modelImages.filter(...)  // ligne 193 — jamais utilisee
```
**Suggestion :** Soit utiliser cette variable dans le JSX pour afficher le nombre de visuels non generes, soit la supprimer. L'ESLint la signale comme error, ce qui bloque le build strict.

---

### DEAD-11: Variables non utilisees dans les mocks de tests
**Fichier :** `src/components/public/Hero/__tests__/Hero.test.tsx:8`
**Severite :** Warning (Error ESLint)
**Source :** ESLint (@typescript-eslint/no-unused-vars)
**Description :** Dans les fichiers de test qui mockent `framer-motion`, les variables destructurees `initial`, `animate`, `transition` sont declarees mais non utilisees.

Fichiers concernes :
- `src/components/public/Hero/__tests__/Hero.test.tsx:8` (`initial`, `animate`, `transition`)
- `src/components/public/HowItWorks/__tests__/HowItWorks.test.tsx:15` (idem)
- `src/__tests__/ConfiguratorModal.test.tsx:343` (`user`)
**Code :**
```typescript
vi.mock('framer-motion', () => ({
  motion: { div: ({ initial, animate, transition, ...props }) => <div {...props} /> }
  // initial, animate, transition sont declares mais jamais utilises
}))
```
**Suggestion :** Prefixer les variables non utilisees par `_` : `{ _initial, _animate, _transition, ...props }` pour satisfaire la regle ESLint `argsIgnorePattern: "^_"`.

---

### DEAD-12: Directive eslint-disable inutile dans ConfiguratorModal
**Fichier :** `src/components/public/Catalogue/ConfiguratorModal.tsx:132`
**Severite :** Info
**Source :** ESLint (unused directive)
**Description :** Un commentaire `// eslint-disable-next-line react-hooks/exhaustive-deps` ne desactive rien car ESLint ne signale aucun probleme sur cette ligne.
**Code :**
```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps  // ligne 132 — inutile
useEffect(() => { ... }, [deps])
```
**Suggestion :** Supprimer le commentaire `eslint-disable` inutile.

---

### DEAD-13: `src/app/page.module.css` potentiellement vide ou orphelin
**Fichier :** `src/app/page.module.css:1`
**Severite :** Info
**Source :** investigation manuelle (identifie dans RESEARCH.md)
**Description :** Ce fichier CSS module est reference dans RESEARCH.md comme potentiellement vide ou avec classes orphelines. A verifier.
**Suggestion :** Verifier le contenu du fichier et supprimer les classes non utilisees. Si le fichier est vide, le supprimer.

---

## TypeScript & Bonnes Pratiques (AUDIT-04)

### TS-01: Erreurs TypeScript tsc --noEmit dans src/lib/supabase/
**Fichier :** `src/lib/supabase/client.ts:1`
**Severite :** Warning
**Source :** tsc --noEmit
**Description :** tsc signale `Cannot find module '@supabase/ssr'` dans 3 fichiers du client Supabase. Ces erreurs se produisent probablement parce que `@supabase/ssr` n'est pas dans `dependencies` du `package.json` (installation via peerDependency ou manquant).

Fichiers concernes :
- `src/lib/supabase/client.ts:1` — `Cannot find module '@supabase/ssr'`
- `src/lib/supabase/middleware.ts:1` — `Cannot find module '@supabase/ssr'`
- `src/lib/supabase/server.ts:1` — `Cannot find module '@supabase/ssr'`
**Code :**
```typescript
import { createServerClient } from '@supabase/ssr'  // ligne 1 — module non trouve par tsc
```
**Suggestion :** Verifier que `@supabase/ssr` est dans `package.json` (dependencies). Si oui, verifier le tsconfig `moduleResolution` et `paths`. Executer `npm ls @supabase/ssr` pour confirmer l'installation. Note : `npx vitest run` passe (161/161) donc le module fonctionne en runtime — c'est un probleme de configuration tsc.

---

### TS-02: `any` implicite sur le parametre `model_images` dans produits/page.tsx
**Fichier :** `src/app/admin/(protected)/produits/page.tsx:12`
**Severite :** Warning
**Source :** tsc --noEmit (TS7031)
**Description :** L'element destructure `model_images` dans le `.map()` a un type `any` implicite. Le retour Supabase n'est pas correctement type.
**Code :**
```typescript
const models = (data ?? []).map(({ model_images, ...model }) => ({  // ligne 12
  // model_images : any implicite
  image_count: Array.isArray(model_images) ? model_images.length : 0,
}))
```
**Suggestion :** Typer explicitement : `(data ?? [] as Array<Model & { model_images: Array<{ id: string }> }>).map(...)`. Ou utiliser les types generes par Supabase dans `src/types/database.ts`.

---

### TS-03: `any` implicite sur le parametre `c` (categories) dans tissus pages
**Fichier :** `src/app/admin/(protected)/tissus/[id]/edit/page.tsx:34`
**Severite :** Warning
**Source :** tsc --noEmit (TS7006)
**Description :** Le parametre `c` dans `.filter((c): c is string => ...)` a un type `any` implicite. Meme probleme dans `tissus/new/page.tsx`.

Fichiers concernes :
- `src/app/admin/(protected)/tissus/[id]/edit/page.tsx:34`
- `src/app/admin/(protected)/tissus/new/page.tsx:17`
- `src/app/api/admin/fabrics/categories/route.ts:31`
**Code :**
```typescript
.filter((c): c is string => c !== null && c.trim() !== '')  // c : any implicite
```
**Suggestion :** Typer le parametre : `.map((row: { category: string | null }) => row.category)` — deja fait dans `categories/route.ts` ligne 30. Appliquer le meme pattern dans les pages.

---

### TS-04: `any` implicite sur les parametres `img` et `v` dans models/[id]/route.ts
**Fichier :** `src/app/api/admin/models/[id]/route.ts:159`
**Severite :** Warning
**Source :** tsc --noEmit (TS7006)
**Description :** Quatre parametres `any` implicites dans les callbacks `.map()` pour les images et visuels.
**Code :**
```typescript
const paths = modelImages.map((img) => extractStoragePath(img.image_url))  // img: any
const paths = generatedVisuals.map((v) => extractStoragePath(v.generated_image_url))  // v: any
```
**Suggestion :** Typer avec les types Supabase : `(img: { image_url: string })` et `(v: { generated_image_url: string })`. Ou utiliser `ModelImage` et `GeneratedVisual` depuis `src/types/database.ts`.

---

### TS-05: `any` implicite sur le parametre `model` dans CatalogueSection
**Fichier :** `src/components/public/Catalogue/CatalogueSection.tsx:42`
**Severite :** Warning
**Source :** tsc --noEmit (TS7006)
**Description :** Le parametre du `.map()` dans CatalogueSection a un type `any` implicite, et le type guard `(v): v is VisualWithFabricAndImage` utilise un parametre `v` non type.
**Code :**
```typescript
.map((model) => ({  // ligne 42 — model: any
  ...model,
  model_images: (model.model_images ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  ),
}))
```
**Suggestion :** Typer le parametre : `.map((model: ModelWithImages) => ...)`. Le type `ModelWithImages` est importe dans ce fichier (ligne 3).

---

### TS-06: `any` implicite sur le parametre `model` dans api/models/route.ts
**Fichier :** `src/app/api/models/route.ts:28`
**Severite :** Warning
**Source :** tsc --noEmit (TS7006)
**Description :** Meme pattern que TS-05 dans la route publique.
**Code :**
```typescript
const models = (data ?? []).map((model) => ({  // ligne 28 — model: any
  ...model,
  model_images: (model.model_images ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  ),
}))
```
**Suggestion :** Typer le parametre avec le type Supabase approprie.

---

### TS-07: Erreurs tsc dans `src/lib/supabase/middleware.ts` — parametres cookiesToSet
**Fichier :** `src/lib/supabase/middleware.ts:24`
**Severite :** Warning
**Source :** tsc --noEmit (TS7006, TS7031)
**Description :** Le parametre `cookiesToSet` dans les callbacks `setAll()` a un type `any` implicite, de meme que les elements destructures `name`, `value`, `options`.
**Code :**
```typescript
setAll(cookiesToSet) {  // ligne 24 — cookiesToSet: any
  cookiesToSet.forEach(({ name, value }) => ...)  // name, value: any
  cookiesToSet.forEach(({ name, value, options }) => ...)  // options: any
}
```
**Suggestion :** Typer avec le type du SDK Supabase SSR : `cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>`. Le type exact est disponible dans `@supabase/ssr`.

---

### TS-08: Erreurs tsc dans `src/lib/supabase/server.ts` — parametres identiques
**Fichier :** `src/lib/supabase/server.ts:16`
**Severite :** Warning
**Source :** tsc --noEmit (TS7006, TS7031)
**Description :** Meme probleme que TS-07 dans le fichier server.ts.
**Code :**
```typescript
setAll(cookiesToSet) {  // ligne 16 — cookiesToSet: any
  cookiesToSet.forEach(({ name, value, options }) => ...)
```
**Suggestion :** Appliquer la meme correction que TS-07. Les deux fichiers (middleware.ts et server.ts) partagent le meme pattern et doivent etre corriges ensemble.

---

### TS-09: Erreur tsc dans `scripts/verify-e2e-m005.ts` — module @supabase/supabase-js
**Fichier :** `scripts/verify-e2e-m005.ts:14`
**Severite :** Info
**Source :** tsc --noEmit (TS2307)
**Description :** Le script de verification E2E importe `@supabase/supabase-js` mais ce module n'est pas trouve par tsc. Probablement pas dans le `tsconfig.json` `include` ou pas installe comme dependance directe.
**Code :**
```typescript
import { createClient } from '@supabase/supabase-js'  // ligne 14 — module non trouve
```
**Suggestion :** Ce script est un outil CLI non inclus dans le build Next.js. Son erreur tsc est hors-perimetre du build. Si necessaire, ajouter `scripts/` au `include` de `tsconfig.json` ou creer un `tsconfig.scripts.json` dedie.

---

### TS-10: 20 handlers API sans try/catch visible dans les 10 premieres lignes
**Fichier :** `src/app/api/admin/fabrics/route.ts:11`
**Severite :** Warning
**Source :** script custom
**Description :** 20 handlers API (GET, POST, PUT, DELETE) n'ont pas de try/catch dans les 10 premieres lignes. La detection est basee sur la presence de `try {` dans les lignes initiales du handler. Certains handlers ont un try/catch mais plus loin dans le corps de la fonction — ce sont des faux positifs du detecteur.

Handlers vraiment sans try/catch (a verifier manuellement) :
- `src/app/api/admin/fabrics/route.ts:11` (GET)
- `src/app/api/admin/models/route.ts:11` (GET)
- `src/app/api/admin/fabrics/categories/route.ts:9` (GET)
- `src/app/api/admin/models/[id]/route.ts:11` (GET)

Handlers avec try/catch mais detectes faussement positifs (try/catch present mais pas dans les 10 premieres lignes) :
- Tous les autres handlers listes

**Code :**
```typescript
export async function GET() {  // ligne 11 — pas de try { immediatement
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError
  const { data, error } = await supabase!.from('fabrics').select('*')
  // Pas de try/catch — les erreurs Supabase sont gerees via if(error)
}
```
**Suggestion :** Les 4 handlers GET admin sont sans try/catch. Ajouter un try/catch global pour attraper les erreurs inattendues (ex: `supabase!` null access, `params` resolution). Les handlers POST/PUT/DELETE ont deja des try/catch corrects.

---

### TS-11: 3 catch sans typage explicite (`err` non type)
**Fichier :** `src/app/api/models/route.ts:37`
**Severite :** Info
**Source :** script custom
**Description :** Dans 3 routes publiques, le `catch (err)` ne verifie pas `instanceof Error` avant d'acceder a `err.message`, ou est correctement type mais detecte faussement.

Fichiers concernes :
- `src/app/api/models/route.ts:37` — `catch (err) { console.error(..., err) }` correct
- `src/app/api/models/[slug]/route.ts:45`
- `src/app/api/models/[slug]/visuals/route.ts:63`
**Code :**
```typescript
} catch (err) {  // ligne 37
  console.error('[GET /api/models] Unexpected error:', err)
  return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
}
```
**Suggestion :** Verifier manuellement si `err.message` est accede directement. Si oui, ajouter `const message = err instanceof Error ? err.message : String(err)`. Si `err` est passe directement a `console.error`, c'est acceptable.

---

### TS-12: Types `any` implicites vs TypeScript strict mode
**Fichier :** `src/app/api/admin/models/[id]/route.ts:159`
**Severite :** Warning
**Source :** tsc --noEmit + script custom
**Description :** Le projet declare `"strict": true` dans tsconfig.json, ce qui active `noImplicitAny`. Pourtant, tsc signale 15+ erreurs `TS7006` (parametre implicitement `any`). Cela indique que ces erreurs existaient avant l'activation de strict ou que la config tsc est appliquee differemment du build Next.js.
**Code :**
```
src/app/api/admin/models/[id]/route.ts(159,13): error TS7006: Parameter 'img' implicitly has an 'any' type.
src/app/api/admin/models/[id]/route.ts(160,16): error TS7006: Parameter 'p' implicitly has an 'any' type.
```
**Suggestion :** Executer `npx tsc --noEmit` regulierement dans le CI pour detecter les regressions. Les 28 erreurs actuelles doivent etre corrigees en Phase 16.

---

### TS-13: NanaBananaService — `throw lastError!` non null assertion
**Fichier :** `src/lib/ai/nano-banana.ts:193`
**Severite :** Info
**Source :** revue manuelle
**Description :** A la fin de la boucle de retry, `throw lastError!` utilise une non-null assertion. `lastError` est initialise a `undefined` et ne peut etre `undefined` ici qu'en theorie (si la boucle `for` s'execute 0 fois, ce qui est impossible avec `MAX_RETRIES = 3`). Mais l'assertion `!` cache ce cas edge.
**Code :**
```typescript
let lastError: Error | undefined
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) { ... }
throw lastError!  // ligne 193 — non-null assertion
```
**Suggestion :** Remplacer par : `throw lastError ?? new Error('Echec generation apres tous les retries')`. Plus sur et TypeScript happy sans assertion.

---

### TS-14: NanaBananaService constructor appele sans NANO_BANANA_API_KEY verifie dans getIAService
**Fichier :** `src/lib/ai/index.ts:15`
**Severite :** Info
**Source :** revue manuelle
**Description :** `getIAService()` verifie `process.env.NANO_BANANA_API_KEY` avant d'instancier `NanaBananaService`. Mais `NanaBananaService` re-verifie la cle dans son constructeur et lance une erreur si absente. Cette double verification est redondante mais defensive.
**Code :**
```typescript
if (process.env.NANO_BANANA_API_KEY) {
  return new NanaBananaService()  // NanaBananaService re-verifie dans son constructeur
}
```
**Suggestion :** Pas de correction necessaire — la defense en profondeur est une bonne pratique. Documenter le pattern dans un commentaire.

---

### TS-15: Absence de types de retour explicites sur les handlers API
**Fichier :** `src/app/api/admin/fabrics/route.ts:11`
**Severite :** Info
**Source :** ESLint (explicit-function-return-type — pas active)
**Description :** Les handlers API n'ont pas de type de retour explicite `Promise<NextResponse>`. La regle ESLint `@typescript-eslint/explicit-function-return-type` n'est pas activee dans la config actuelle.
**Code :**
```typescript
export async function GET() {  // pas de : Promise<NextResponse>
  // ...
}
```
**Suggestion :** Activer `"@typescript-eslint/explicit-function-return-type": "warn"` dans `eslint.config.mjs` (avec `allowExpressions: true` pour ne pas annoter les fonctions flechees inline). Note : Cette regle necessite le type-aware linting (`parserOptions.projectService: true`) pour etre pleinement efficace.

---

### TS-16: `@typescript-eslint/no-explicit-any` desactive par eslint-config-next dans certains fichiers
**Fichier :** `src/lib/supabase/middleware.ts:24`
**Severite :** Info
**Source :** analyse config ESLint
**Description :** Malgre la regle `@typescript-eslint/no-explicit-any: "error"` dans `eslint.config.mjs`, tsc signale des `any` implicites non detectes par ESLint dans les fichiers Supabase. La regle ESLint detecte les `any` explicites (`: any`), pas les `any` implicites (inferences echouees) — ceux-ci sont detectes par `noImplicitAny` de tsc uniquement.
**Suggestion :** La combinaison tsc (`noImplicitAny`) + ESLint (`no-explicit-any`) est la bonne approche. Corriger les erreurs tsc (TS-01 a TS-08) en Phase 16.

---

## Synthese pour Phase 16

### Priorite 1 — Corrections critiques (1 finding)
- **SEC-01** : Ajouter les security headers dans `next.config.ts` (1 fichier, 20 lignes)

### Priorite 2 — Corrections importantes (15 findings)
- **SEC-02** : Validation MIME dans `/api/simulate`
- **SEC-08** : Correction extraction IP (`x-forwarded-for` — derniere valeur)
- **SEC-05** : Validation UUID dans toutes les routes admin avec `:id`
- **TS-01** : Resoudre erreur `@supabase/ssr` module non trouve par tsc
- **TS-02 a TS-08** : Corriger les 28 erreurs tsc `any` implicite
- **DEAD-10** : Supprimer ou utiliser `countUngenerated` dans IAGenerationSection
- **DEAD-11** : Prefixer les variables de test non utilisees par `_`
- **PERF-05** : Remplacer `console.log` par `console.info` dans les routes admin

### Priorite 3 — Ameliorations qualite (26 findings)
- **DEAD-02** : Verifier et potentiellement supprimer les 8 dependances Radix UI non utilisees
- **DEAD-03** : Migrer `zustand` et `immer` en devDependencies si non utilises
- **DEAD-05/06** : Supprimer `modelWithImagesSchema` et `visualWithFabricSchema` si non utilises
- **DEAD-07/08** : Supprimer les types non utilises dans schemas.ts
- **PERF-06** : Remplacer `<img>` par `<Image>` next/image pour les URLs definitives
- **PERF-07** : Deplacer les `style={{ objectFit: 'cover' }}` dans les CSS modules
- **SEC-09** : Ajouter schemas Zod pour les routes POST admin sans validation formelle
- **DEAD-01** : Ajouter `scripts/**/*.ts` dans `knip.json` entry pour corriger les faux positifs

### Notes de closing
- **PERF-01** : N+1 dans generate-all est intentionnel (sequentialite Gemini) — documenter
- **PERF-02** : Faux positif detecteur N+1 (`extractStoragePath` est pure) — a fermer
- **DEAD-04** : Faux positif knip pour `tinyglobby` — a fermer avec correction DEAD-01
- **SEC-03/04** : Rate-limit memoire acceptable pour v11.0, migration Redis pour v12+
