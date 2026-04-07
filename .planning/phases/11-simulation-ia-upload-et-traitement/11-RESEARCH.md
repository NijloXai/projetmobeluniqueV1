# Phase 11: Simulation IA — Upload et traitement - Research

**Researched:** 2026-04-07
**Domain:** React file upload (DnD + input), AbortController, progress simulée, HEIC côté serveur, Next.js body size
**Confidence:** HIGH (domaines core vérifiés sur codebase réelle + docs officielles)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Simulation = nouvelle étape dans ConfiguratorModal existant (pas section séparée)
- D-02: CTA "Visualiser chez moi" (style outline) sous le CTA Shopify, visible même sans tissu
- D-03: Bouton retour "Modifier la configuration" vers étape tissu
- D-04: Layout 2 colonnes conservé — zone upload remplace image canapé à gauche
- D-05: Bandeau compact rappel config en haut : mini swatch 24px + nom tissu + lien "Modifier"
- D-06: Texte court au-dessus de la zone upload (pas d'exemple avant/après en images)
- D-07: Mobile 1 colonne : upload en haut, rappel config + CTA en bas
- D-08: Zone drag & drop desktop + input unique accept=image/* (camera native mobile)
- D-09: Après sélection : preview image + bouton "Lancer la simulation" + lien "Changer de photo"
- D-10: Formats acceptés : JPEG, PNG, HEIC/HEIF. Taille max : 15 Mo (API à mettre à jour de 10 Mo)
- D-11: Validation client avant envoi : file.size <= 15 Mo + file.type whitelist. Erreurs en français
- D-12: Feedback : photo fond + overlay sombre + barre progression + 3 étapes détaillées
- D-13: Progression simulée (timer) : 0-30% rapide (1s), 30-70% lent (3-5s), 70-100% à réception
- D-14: 3 étapes : "Analyse de la pièce" / "Intégration du canapé" / "Finition et éclairage"
- D-15: Bouton "Annuler" + AbortController fetch. Retour à l'état preview photo
- D-16: Tissu optionnel — si aucun tissu, utiliser photo originale du canapé comme référence IA
- D-17: Erreurs inline : zone upload (fichier trop gros, format invalide) + zone progression (erreur IA) + bouton "Réessayer"
- D-18: Pas de retry automatique — bouton "Réessayer" manuel
- D-19: useState local dans ConfiguratorModal. États : 'idle' | 'preview' | 'generating' | 'done' | 'error'

### Claude's Discretion
- Style exact de la zone drag & drop (bordure dashed vs tonal layering)
- Padding, espacement et taille de la zone upload
- Animation/transition entre étape tissu et étape simulation
- Timing exact de la progression simulée
- Icône dans la zone upload (camera, image, upload)
- Conversion HEIC côté serveur si nécessaire (Sharp peut lire HEIC)

### Deferred Ideas (OUT OF SCOPE — Phase 12)
- Affichage du résultat simulation
- Téléchargement de l'image résultat
- Partage WhatsApp
- CTA "Commander sur Shopify" post-simulation
- Lien "Réessayer avec une autre photo"
- Streaming/SSE pour progression réelle
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SIM-01 | Upload photo salon (drag & drop) | Section DnD Pattern + File Validation |
| SIM-02 | Génération IA via POST /api/simulate | Section API Route Modifications + AbortController Pattern |
</phase_requirements>

---

## Summary

La Phase 11 étend `ConfiguratorModal` avec une étape simulation : upload photo salon → envoi `/api/simulate` → réception JPEG → transmission au state `done` (affichage Phase 12). La route API existe déjà et est fonctionnelle. Les modifications requises sont : (1) rendre `fabric_id` optionnel, (2) relever `MAX_FILE_SIZE` de 10 Mo à 15 Mo, (3) adapter `buildSimulatePrompt` pour le cas sans tissu.

Côté client, les patterns sont tous natifs (pas de bibliothèque externe) : DnD HTML5, `URL.createObjectURL`, `AbortController`, `setInterval` pour la progression simulée. Le risque principal est la **gestion HEIC en production Linux** : le binaire prebuilt Sharp ne supporte pas HEIC sur Linux (contrainte de licence Nokia HEVC). La stratégie est d'accepter HEIC côté client mais d'intercepter l'erreur serveur avec un message spécifique.

**Primary recommendation:** Étendre ConfiguratorModal avec un state machine 5-états (`idle/preview/generating/done/error`) en useState local. Toutes les primitives sont natives (pas de lib upload externe). Gérer HEIC avec try/catch spécifique côté serveur.

---

## Standard Stack

### Core (déjà installé — aucune installation requise)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (useState, useRef, useEffect, useCallback) | 19.2.4 | State machine + side effects | Déjà utilisé dans ConfiguratorModal |
| Sharp | 0.34.5 | Traitement image côté serveur (watermark mock) | Déjà installé, libheif 1.20.2 vendorisé sur macOS |
| HTML5 Drag & Drop API | Native | Zone upload DnD | Zero dépendance, suffisant pour single file |
| AbortController | Native (Web API) | Annulation fetch en cours | Standard moderne, typé TypeScript nativement |
| URL.createObjectURL / revokeObjectURL | Native (Web API) | Preview image locale avant envoi | Plus rapide que FileReader, pas de base64 overhead |
| FormData | Native (Web API) | Envoi multipart vers /api/simulate | Déjà utilisé dans la route existante |

### Aucune bibliothèque supplémentaire requise

Le projet interdit Tailwind et shadcn. Toutes les fonctionnalités nécessaires (DnD, upload, preview, progress bar, abort) sont disponibles en natif. Les bibliothèques de drag & drop (react-dropzone, react-drag-drop-files) ne sont **pas** nécessaires — elles ajoutent 50-80KB pour une zone single-file. [VERIFIED: codebase + Web API MDN]

**Installation:** Aucune — toutes les dépendances sont déjà présentes.

**Version verification:** [VERIFIED: npm registry + node_modules]
- `sharp@0.34.5` — installé, libheif 1.20.2 vendorisé
- `react@19.2.4` — installé
- `next@16.2.1` — installé

---

## Architecture Patterns

### Recommended Project Structure

Aucun nouveau fichier de composant requis. L'étape simulation s'intègre dans les fichiers existants :

```
src/
  components/public/Catalogue/
    ConfiguratorModal.tsx          — étendre avec SimulationStep (état + handlers)
    ConfiguratorModal.module.css   — ajouter classes simulation (upload zone, progress bar)
  app/api/simulate/
    route.ts                       — modifier MAX_FILE_SIZE + rendre fabric_id optionnel
  lib/ai/
    prompts.ts                     — adapter buildSimulatePrompt pour fabric optionnel
```

**Aucun nouveau composant autonome.** La zone upload et la barre de progression sont rendues inline dans ConfiguratorModal, conditionnellement selon `simulationStep`. [VERIFIED: décisions CONTEXT.md D-01, D-04, D-19]

### Pattern 1 : State Machine 5-états avec useState

**What:** Le state de simulation vit dans ConfiguratorModal en tant que state local.

**When to use:** Toujours — Zustand est réservé pour v10.0+ (D-19 lockée).

```typescript
// Source: ConfiguratorModal.tsx existant + pattern React local state
type SimulationState = 'idle' | 'preview' | 'generating' | 'done' | 'error'

// Dans ConfiguratorModal :
const [modalStep, setModalStep] = useState<'configurator' | 'simulation'>('configurator')
const [simulationState, setSimulationState] = useState<SimulationState>('idle')
const [selectedFile, setSelectedFile] = useState<File | null>(null)
const [previewUrl, setPreviewUrl] = useState<string | null>(null)
const [progress, setProgress] = useState(0)
const [errorMessage, setErrorMessage] = useState<string | null>(null)
const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null)
const abortControllerRef = useRef<AbortController | null>(null)
const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
```

### Pattern 2 : Zone Drag & Drop HTML5 native

**What:** DnD avec compteur dragEnter/dragLeave pour éviter le flicker.

**Critical pitfall:** Quand la souris passe sur un enfant de la drop zone, `dragLeave` se déclenche sur le parent, puis `dragEnter` sur l'enfant. Sans compteur, `isDragging` flicke false→true continuellement. [VERIFIED: MDN HTML Drag and Drop API]

```typescript
// Source: MDN HTML Drag and Drop API + pattern issu de recherche WebSearch
const dragCounterRef = useRef(0)
const [isDragging, setIsDragging] = useState(false)

const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
  dragCounterRef.current++
  if (dragCounterRef.current === 1) setIsDragging(true)
}, [])

const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
  dragCounterRef.current--
  if (dragCounterRef.current === 0) setIsDragging(false)
}, [])

const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault() // OBLIGATOIRE pour autoriser le drop
}, [])

const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
  dragCounterRef.current = 0
  setIsDragging(false)
  const file = e.dataTransfer.files[0]
  if (file) handleFileSelected(file)
}, [])
```

**Alternative CSS :** Ajouter `pointer-events: none` sur les enfants directs de la drop zone. Plus simple mais réduit l'accessibilité des éléments enfants.

### Pattern 3 : Preview image avec URL.createObjectURL

**What:** Créer une URL blob locale pour afficher l'aperçu immédiat sans FileReader.

**Why createObjectURL et pas FileReader :** `URL.createObjectURL` est synchrone et renvoie directement une URL blob — pas d'encodage base64, pas de callback asynchrone. [VERIFIED: LogRocket + react.wiki]

**Cleanup obligatoire :** La mémoire n'est libérée que par `revokeObjectURL()` — sans cleanup, la mémoire ne se libère pas avant la fermeture de l'onglet.

```typescript
// Source: react.wiki/hooks/file-upload-hook + LogRocket FileReader guide
const handleFileSelected = useCallback((file: File) => {
  const error = validateFile(file)
  if (error) {
    setErrorMessage(error)
    return
  }
  // Révoquer l'ancienne URL avant d'en créer une nouvelle
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  const url = URL.createObjectURL(file)
  setSelectedFile(file)
  setPreviewUrl(url)
  setSimulationState('preview')
  setErrorMessage(null)
}, [previewUrl])

// Cleanup dans useEffect
useEffect(() => {
  return () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
  }
}, [previewUrl, resultBlobUrl])
```

### Pattern 4 : AbortController pour annulation fetch

**What:** AbortController natif pour couper le fetch en cours (bouton "Annuler").

**Error detection :** L'annulation génère une `AbortError` — `err.name === 'AbortError'` permet de distinguer annulation et erreur réseau. Ne pas afficher de message d'erreur en cas d'annulation (retour silencieux à l'état preview). [VERIFIED: MDN AbortController + DEV.to]

```typescript
// Source: MDN AbortController.abort() + carlrippon.com TypeScript guide
const handleLancerSimulation = useCallback(async () => {
  if (!selectedFile) return
  
  // Annuler toute requête précédente
  if (abortControllerRef.current) abortControllerRef.current.abort()
  
  const controller = new AbortController()
  abortControllerRef.current = controller
  
  setSimulationState('generating')
  startProgressTimer()
  
  try {
    const formData = new FormData()
    formData.append('image', selectedFile)
    formData.append('model_id', model.id)
    if (selectedFabricId) formData.append('fabric_id', selectedFabricId)
    
    const response = await fetch('/api/simulate', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error ?? 'Erreur lors de la simulation.')
    }
    
    // Réception image binaire JPEG
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    
    stopProgressTimer()
    setProgress(100)
    setResultBlobUrl(url)
    setSimulationState('done')
    
  } catch (err) {
    stopProgressTimer()
    if (err instanceof Error && err.name === 'AbortError') {
      // Annulation volontaire — retour silencieux à preview
      setSimulationState('preview')
      setProgress(0)
    } else {
      const message = err instanceof Error ? err.message : 'Erreur lors de la simulation.'
      setErrorMessage(message)
      setSimulationState('error')
    }
  }
}, [selectedFile, model?.id, selectedFabricId])

const handleAnnuler = useCallback(() => {
  if (abortControllerRef.current) abortControllerRef.current.abort()
}, [])
```

### Pattern 5 : Barre de progression simulée (timer)

**What:** setInterval pour simuler la progression pendant un appel API bloquant (pas de streaming).

**Timing D-13 :** Phase rapide 0-30% en 1s (30 steps × 33ms), phase lente 30-70% en 4s (40 steps × 100ms), complétion instantanée à réception. [ASSUMED: timings exacts à ajuster selon perception utilisateur]

```typescript
// Source: pattern timer React + décision D-13
const startProgressTimer = useCallback(() => {
  let current = 0
  progressTimerRef.current = setInterval(() => {
    current++
    if (current <= 30) {
      // Phase rapide : 0→30% en ~1s (intervalles de 33ms)
      setProgress(current)
    } else if (current <= 70) {
      // Phase lente : 30→70% en ~4s (intervalles de 100ms)
      setProgress(current)
    } else {
      // Plafonner à 70% — la réception du résultat passe à 100%
      clearInterval(progressTimerRef.current!)
    }
  }, current <= 30 ? 33 : 100)
}, [])

// Note: l'implémentation réelle utilise un ref séparé pour l'intervalle
// car setInterval ne supporte pas les intervalles variables nativement.
// Voir pattern à deux intervalles dans Code Examples.

const stopProgressTimer = useCallback(() => {
  if (progressTimerRef.current) {
    clearInterval(progressTimerRef.current)
    progressTimerRef.current = null
  }
}, [])
```

### Pattern 6 : Validation fichier côté client

**What:** Valider MIME type + taille avant envoi.

**Cas HEIC :** iOS Safari peut retourner `image/heic`, `image/heif`, ou même `image/jpeg` pour des fichiers HEIC transcodés. Fallback sur l'extension du fichier si le type MIME est vide ou générique. [VERIFIED: caniuse.com HEIF + xjavascript.com blog]

```typescript
// Source: décision D-11 + recherche HEIC browser compat
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif'])
const MAX_SIZE_BYTES = 15 * 1024 * 1024 // 15 Mo (D-10)

function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return `Fichier trop volumineux (max 15 Mo). Votre fichier fait ${(file.size / 1024 / 1024).toFixed(1)} Mo.`
  }
  
  // MIME type check avec fallback extension (iOS Safari edge case)
  const isAcceptedType = ACCEPTED_TYPES.has(file.type)
  const isHeicByExtension = /\.(heic|heif)$/i.test(file.name)
  
  if (!isAcceptedType && !isHeicByExtension) {
    return 'Format non supporté. Utilisez une photo JPEG, PNG ou HEIC.'
  }
  
  return null // Valide
}
```

### Pattern 7 : Modifications API `/api/simulate`

**What:** Rendre `fabric_id` optionnel + relever MAX_FILE_SIZE à 15 Mo + adapter le prompt.

**Logique sans tissu (D-16) :** Si `fabric_id` absent, utiliser `"tissu original"` comme `fabricName` dans le prompt. L'IA génère une simulation avec le canapé dans son aspect d'origine.

```typescript
// Source: src/app/api/simulate/route.ts existant — modifications requises

// 1. Relever la limite
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 Mo (était 10 Mo)

// 2. Rendre fabric_id optionnel — supprimer le bloc if (!fabricId) { return 400 }

// 3. Récupérer le tissu conditionnellement
let fabricName = 'tissu original'
if (fabricId) {
  const { data: fabric, error: fabricError } = await supabase
    .from('fabrics')
    .select('id, name')
    .eq('id', fabricId)
    .single()
  
  if (fabricError || !fabric) {
    return NextResponse.json({ error: 'Tissu introuvable.' }, { status: 404 })
  }
  fabricName = fabric.name
}

// 4. buildSimulatePrompt reçoit fabricName (déjà une string) — pas de changement de signature
```

**Adapter buildSimulatePrompt :** La signature `buildSimulatePrompt(modelName, fabricName)` reste inchangée. Le prompt existant fonctionne avec `"tissu original"` comme fabricName. [VERIFIED: src/lib/ai/prompts.ts lu]

### Anti-Patterns to Avoid

- **Ne pas utiliser react-dropzone ou react-drag-drop-files :** Ces bibliothèques font 50-80KB pour une zone single-file. HTML5 natif est suffisant.
- **Ne pas utiliser FileReader pour le preview :** `URL.createObjectURL` est synchrone et plus rapide. FileReader est async et encode en base64 (overhead mémoire).
- **Ne pas oublier `e.preventDefault()` dans `onDragOver` :** Sans ça, le drop est ignoré par le navigateur (comportement par défaut = ouvrir le fichier).
- **Ne pas oublier de révoquer les Object URLs :** `URL.revokeObjectURL()` est obligatoire dans le cleanup, sinon fuite mémoire jusqu'à fermeture d'onglet.
- **Ne pas utiliser `dragEnter/dragLeave` sans compteur :** Les enfants de la drop zone déclenchent des faux positifs — utiliser `dragCounterRef`.
- **Ne pas distinguer AbortError des vraies erreurs :** `err.name === 'AbortError'` doit retourner silencieusement à `preview`, pas afficher un message d'erreur.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Barre de progression non-streaming | Vraie progression XHR XMLHttpRequest | setInterval + timer simulé | L'API retourne un blob JPEG — pas de streaming progressif |
| Détection HEIC | Parser magic bytes HEIC manuellement | MIME type + fallback extension | Suffisant pour validation client, Sharp gère le reste côté serveur |
| Preview image avant envoi | Lire le fichier en base64 (FileReader) | URL.createObjectURL | Synchrone, pas d'overhead base64, cleanup simple |
| Annulation requête | Timeout via setTimeout + abort manuel | AbortController natif | Standard W3C, déjà typé TypeScript, supporté partout |
| Zone DnD avec animations complexes | React DnD Library (react-dnd) | HTML5 drag & drop events | Single file, pas de liste, pas de réordonnancement |

**Key insight:** Dans ce domaine (upload + preview + cancel), les Web APIs natives couvrent 100% des besoins. Les bibliothèques d'upload ajoutent de la complexité pour des features (multi-file, progress XHR) non nécessaires ici.

---

## Common Pitfalls

### Pitfall 1 : dragLeave flicker sur les enfants de la drop zone
**What goes wrong:** `isDragging` passe à false puis true rapidement quand la souris survole un élément enfant, causant un clignotement visuel de la zone upload.
**Why it happens:** `dragLeave` se déclenche sur le parent quand la souris entre sur un enfant, avant que `dragEnter` enfant ne se déclenche. Le state passe brièvement à `false`.
**How to avoid:** Utiliser un `useRef` compteur (`dragCounterRef`) incrémenté sur `dragEnter` et décrémenté sur `dragLeave`. Mettre `isDragging` à `false` seulement quand le compteur atteint 0.
**Warning signs:** Zone DnD clignote quand on déplace le fichier au-dessus des icônes/textes à l'intérieur.

### Pitfall 2 : Fuite mémoire Object URLs
**What goes wrong:** Les URLs créées par `URL.createObjectURL` persistent en mémoire même après unmount du composant ou sélection d'un nouveau fichier.
**Why it happens:** `createObjectURL` crée une référence maintenant le blob en mémoire. Seul `revokeObjectURL` libère cette référence.
**How to avoid:** (1) Révoquer l'ancienne URL avant d'en créer une nouvelle dans `handleFileSelected`. (2) Révoquer dans le cleanup `useEffect` du composant.
**Warning signs:** `performance.memory.usedJSHeapSize` augmente à chaque changement de fichier sans jamais diminuer.

### Pitfall 3 : AbortError masquée comme erreur IA
**What goes wrong:** L'utilisateur clique "Annuler" et voit "Erreur lors de la simulation." au lieu de retourner silencieusement à l'état preview.
**Why it happens:** Le catch bloc ne distingue pas `AbortError` des erreurs réseau/serveur.
**How to avoid:** Vérifier `err.name === 'AbortError'` avant d'afficher un message d'erreur. En cas d'abort, revenir à `simulationState('preview')` avec `setProgress(0)`.
**Warning signs:** Bouton "Annuler" → message d'erreur rouge au lieu de retour zone upload.

### Pitfall 4 : HEIC refusé sur Linux en production
**What goes wrong:** Les fichiers `.heic` uploadés depuis iOS Safari passent la validation client mais échouent sur le serveur avec "Support for this compression format has not been built in".
**Why it happens:** Sharp prebuilt pour Linux n'inclut pas le codec HEVC/HEIC (contrainte de licence Nokia). [VERIFIED: GitHub issue #4472 lovell/sharp]
**How to avoid:** Entourer l'appel `iaService.generate()` d'un try/catch qui intercepte les erreurs contenant "compression format" et retourne un message explicite : `"Votre fichier HEIC n'est pas supporté sur ce serveur. Convertissez votre photo en JPEG avant l'envoi."` Côté macOS dev, Sharp 0.34.5 inclut libheif 1.20.2 — HEIC fonctionne.
**Warning signs:** Fonctionne en `npm run dev` sur macOS, échoue en production Linux.

### Pitfall 5 : timer progressTimerRef non nettoyé
**What goes wrong:** Le timer `setInterval` continue de tourner après annulation ou unmount du modal, causant des appels `setState` sur un composant démonté.
**Why it happens:** `clearInterval` n'est pas appelé dans tous les chemins de sortie (cancel, error, success, unmount).
**How to avoid:** Créer une fonction `stopProgressTimer` appelée dans (1) le catch AbortError, (2) le catch erreur, (3) le succès, (4) le cleanup useEffect. Utiliser `useRef` pour le timer ID afin de ne pas créer de stale closure.
**Warning signs:** Console Next.js : "Warning: Can't perform a React state update on an unmounted component."

### Pitfall 6 : body size limit pour 15 Mo sur route handler Next.js
**What goes wrong:** Uploads > 4MB ou 10MB refusés avec 413 Entity Too Large.
**Why it happens:** Les Route Handlers App Router ont une limite de body gérée au niveau transport. [CITED: github.com/vercel/next.js/discussions/70621]
**How to avoid:** En développement local (Node.js), la limite par défaut est généralement 10-50MB — le fichier de 15Mo passe. Sur Vercel Pro, la limite est 100MB pour les Route Handlers. Sur Vercel Hobby, la limite est 4.5MB — incompatible avec 15Mo. **Vérifier le plan Vercel du projet.** Pour augmenter via config, utiliser `serverActions.bodySizeLimit` uniquement pour Server Actions (pas applicable ici). [ASSUMED: plan Vercel non identifié dans la codebase]
**Warning signs:** 413 en production uniquement, fonctionne en dev local.

### Pitfall 7 : iOS camera — type MIME image/jpeg pour fichier HEIC transcodé
**What goes wrong:** La validation client refuse les photos iOS car `file.type` retourne `image/jpeg` pour un fichier `.heic` transcodé par Safari.
**Why it happens:** iOS Safari peut transcoder automatiquement les HEIC en JPEG lors de la sélection via `<input type="file">`. [VERIFIED: xjavascript.com HEIC detection guide + caniuse.com HEIF]
**How to avoid:** La validation actuelle accepte `image/jpeg` — ce cas est donc transparent. Le fichier arrivera en JPEG côté serveur (Sharp le lit sans problème). Pas d'action requise.
**Warning signs:** N/A — ce cas est géré automatiquement.

---

## Code Examples

### Zone upload complète (DnD + input + preview)

```typescript
// Source: MDN HTML Drag and Drop API + React.DragEvent TypeScript types
// Composant inline dans ConfiguratorModal — pas un composant séparé (D-04)

const dragCounterRef = useRef(0)
const [isDragging, setIsDragging] = useState(false)
const fileInputRef = useRef<HTMLInputElement>(null)

const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
  dragCounterRef.current++
  if (dragCounterRef.current === 1) setIsDragging(true)
}, [])

const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
  dragCounterRef.current--
  if (dragCounterRef.current === 0) setIsDragging(false)
}, [])

const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
}, [])

const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
  dragCounterRef.current = 0
  setIsDragging(false)
  const file = e.dataTransfer.files[0]
  if (file) handleFileSelected(file)
}, [handleFileSelected])

// Rendu JSX
<div
  className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDragging : ''}`}
  onDragEnter={handleDragEnter}
  onDragLeave={handleDragLeave}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
  role="button"
  tabIndex={0}
  aria-label="Zone d'upload photo — glissez votre photo ou cliquez pour sélectionner"
  onClick={() => fileInputRef.current?.click()}
  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
>
  {/* Icône upload + texte */}
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"  // "image/*" = camera native iOS (D-08)
    style={{ display: 'none' }}
    onChange={(e) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelected(file)
      // Reset input pour permettre re-sélection du même fichier
      e.target.value = ''
    }}
  />
</div>
```

**Note `accept="image/*"` :** Sur mobile iOS/Android, `accept="image/*"` déclenche le sélecteur natif qui propose Camera + Galerie. `accept=".heic,.heif,.jpg,.jpeg,.png"` peut limiter les options sur certains appareils. `image/*` est la valeur correcte pour D-08. [VERIFIED: caniuse.com + MDN input accept]

### Timer progression simulée (deux phases)

```typescript
// Source: pattern setInterval React avec deux phases distinctes (D-13)
const startProgressTimer = useCallback(() => {
  setProgress(0)
  
  let fastCount = 0
  let slowCount = 0
  
  // Phase 1 : 0→30% en 1s (30 incréments × 33ms)
  const fastTimer = setInterval(() => {
    fastCount++
    setProgress(fastCount)
    if (fastCount >= 30) {
      clearInterval(fastTimer)
      
      // Phase 2 : 30→70% en 4s (40 incréments × 100ms)
      const slowTimer = setInterval(() => {
        slowCount++
        setProgress(30 + slowCount)
        if (slowCount >= 40) {
          clearInterval(slowTimer)
          // Plafonné à 70% — réception résultat passe à 100%
        }
      }, 100)
      
      // Stocker ref pour cleanup
      progressTimerRef.current = slowTimer
    }
  }, 33)
  
  progressTimerRef.current = fastTimer
}, [])
```

### Affichage 3 étapes progression

```typescript
// Source: décision D-14
type ProgressStepStatus = 'pending' | 'active' | 'done'

function getStepStatus(stepIndex: number, progress: number): ProgressStepStatus {
  // Étape 0 (Analyse) : active 0-33%, done 33-100%
  // Étape 1 (Intégration) : active 33-66%, done 66-100%
  // Étape 2 (Finition) : active 66-100%, done à 100%
  const threshold = (stepIndex + 1) * 33
  if (progress >= 100) return 'done'
  if (progress >= threshold) return 'done'
  if (progress >= threshold - 33) return 'active'
  return 'pending'
}

const steps = [
  'Analyse de la pièce',
  'Intégration du canapé',
  'Finition et éclairage',
]
```

### Réception et stockage résultat binaire

```typescript
// Source: Fetch API + Blob + URL.createObjectURL — pattern standard
// La route retourne directement un JPEG binaire (pas de JSON wrapper)

const response = await fetch('/api/simulate', {
  method: 'POST',
  body: formData,
  signal: controller.signal,
})

if (!response.ok) {
  // L'API retourne du JSON pour les erreurs
  const data = await response.json()
  throw new Error(data.error ?? 'Erreur lors de la simulation.')
}

// Réponse 200 = JPEG binaire
const blob = await response.blob()
const url = URL.createObjectURL(blob)
setResultBlobUrl(url)  // URL transmise à Phase 12 pour affichage
setSimulationState('done')
```

### Reset état simulation lors de la fermeture du modal

```typescript
// Source: pattern existant ConfiguratorModal.tsx useEffect sur model?.id
// Il faut aussi resetter l'état simulation lors du changement de modèle ou fermeture

useEffect(() => {
  if (!model) {
    // Fermeture modal — nettoyer les ressources
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
    stopProgressTimer()
    abortControllerRef.current?.abort()
    return
  }
  // Reset simulation à chaque nouveau modèle
  setModalStep('configurator')
  setSimulationState('idle')
  setSelectedFile(null)
  setPreviewUrl(null)
  setProgress(0)
  setErrorMessage(null)
  setResultBlobUrl(null)
}, [model?.id])
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| XMLHttpRequest avec `onprogress` pour upload | `fetch` + `AbortController` | 2017-2020 | Pas de vraie progression avec fetch (stream upload non supporté universellement) — progress bar simulée est le standard |
| FileReader pour preview image | `URL.createObjectURL` | 2015+ | Synchrone, zéro overhead base64, mais cleanup manuel requis |
| `jquery.fileupload` ou `dropzone.js` | HTML5 DnD API native | 2019+ | Pour single-file upload sans queue, les bibliothèques sont surplus |
| `image/heic` acceptance universelle | Conversion côté serveur ou rejet explicite | 2023-2025 | Sharp prebuilt Linux ne supporte pas HEIC — message d'erreur spécifique requis |

**Deprecated/outdated:**
- `FileReader.readAsDataURL` pour preview : toujours fonctionnel mais inutilement lent vs `createObjectURL`
- `XMLHttpRequest` avec `onprogress` : supporté mais la progression est celle du _upload_, pas du _traitement_ IA — la progress bar simulée reste nécessaire dans tous les cas

---

## HEIC Deep Dive

### Situation actuelle

| Environnement | Sharp HEIC Input | Status |
|---------------|-----------------|--------|
| macOS dev (darwin-arm64) | libheif 1.20.2 vendorisé | Fonctionne |
| Linux prod (prebuilt) | Pas de libheif | Echoue avec "compression format not built in" |

[VERIFIED: test direct node_modules/@img/sharp-libvips-darwin-arm64/versions.json + GitHub issue #4472]

### Stratégie recommandée

1. **Accepter HEIC côté client** (validation D-11) — ne pas rejeter `image/heic`
2. **Côté serveur, entourer `iaService.generate()` d'un try/catch** qui intercepte l'erreur Sharp HEIC et retourne un message explicite en français
3. **Ne pas ajouter `heic-convert`** — dépendance lourde pour un cas rare (iOS uniquement, et iOS Safari transcorde souvent en JPEG automatiquement)
4. **Alternative future** : si HEIC devient fréquent, convertir HEIC→JPEG avant Sharp avec `heic-decode` (pur JS, pas de binaire natif). Hors scope Phase 11.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Timings exacts de la progression simulée (33ms/100ms) semblent naturels | Pattern 5 | Progression trop rapide ou trop lente — ajustable visuellement sans impact fonctionnel |
| A2 | Le plan Vercel du projet supporte les uploads 15Mo (Hobby=4.5MB, Pro=100MB) | Pitfall 6 | 413 en production sur Vercel Hobby — nécessite upgrade plan ou compression client |
| A3 | buildSimulatePrompt avec fabricName="tissu original" génère un résultat acceptable pour le mock | Pattern 7 | Le mock Sharp ignore le prompt — aucun risque en dev. En production Nano Banana, le prompt pourrait ne pas être optimal sans tissu |

---

## Open Questions

1. **Plan Vercel du projet**
   - What we know: Limite Hobby = 4.5MB par request, Limite Pro = 100MB
   - What's unclear: Le plan actuel du projet n'est pas identifiable dans la codebase
   - Recommendation: Vérifier `vercel.json` ou dashboard Vercel avant déploiement. En dev local et en test, 15Mo passe sans problème.

2. **HEIC en production Linux réelle**
   - What we know: Sharp prebuilt Linux ne supporte pas HEIC. MacOS vendorisé inclut libheif 1.20.2.
   - What's unclear: L'environnement de déploiement final (Vercel utilise Linux x64)
   - Recommendation: Implémenter le try/catch HEIC côté serveur avec message spécifique. Ne pas bloquer le déploiement pour ce cas.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime Next.js | ✓ | v22.22.1 | — |
| npm | Install dépendances | ✓ | 10.9.4 | — |
| Sharp | Traitement image server | ✓ | 0.34.5 | — |
| libheif (macOS dev) | HEIC input Sharp | ✓ | 1.20.2 (vendorisé) | Message d'erreur spécifique en production |
| libheif (Linux prod) | HEIC input Sharp | ✗ | — | Try/catch + message explicite |
| HTML5 DnD API | Zone upload | ✓ | Native browser | — |
| AbortController | Annulation fetch | ✓ | Native browser | — |
| URL.createObjectURL | Preview image | ✓ | Native browser | — |

**Missing dependencies with no fallback:**
Aucune — toutes les dépendances critiques sont disponibles.

**Missing dependencies with fallback:**
- libheif Linux prod : try/catch côté serveur avec message "Convertissez votre photo en JPEG"

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + Testing Library + happy-dom |
| Config file | vitest.config.ts |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SIM-01 | Validation fichier (taille, type) | unit | `npm test -- src/__tests__/SimulationStep.test.tsx` | ❌ Wave 0 |
| SIM-01 | DnD drop déclenche handleFileSelected | unit | `npm test -- src/__tests__/SimulationStep.test.tsx` | ❌ Wave 0 |
| SIM-01 | State machine : idle → preview → generating → done | unit | `npm test -- src/__tests__/ConfiguratorModal.simulation.test.tsx` | ❌ Wave 0 |
| SIM-01 | AbortController : annulation retourne à preview | unit | `npm test -- src/__tests__/ConfiguratorModal.simulation.test.tsx` | ❌ Wave 0 |
| SIM-02 | /api/simulate avec fabric_id optionnel | unit | `npm test -- src/__tests__/simulate.route.test.ts` | ❌ Wave 0 |
| SIM-02 | /api/simulate rejet fichier > 15 Mo | unit | `npm test -- src/__tests__/simulate.route.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green avant `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/ConfiguratorModal.simulation.test.tsx` — couvre SIM-01 (state machine, DnD, abort)
- [ ] `src/__tests__/simulate.route.test.ts` — couvre SIM-02 (fabric optionnel, limite 15Mo)

*(Tests existants : ConfiguratorModal.test.tsx couvre l'étape configurateur — pas la simulation)*

---

## Security Domain

> security_enforcement absent de config.json — traité comme activé.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | non | Route publique (/api/simulate) |
| V3 Session Management | non | Résultat éphémère, pas de session |
| V4 Access Control | non | Route publique intentionnelle |
| V5 Input Validation | oui | file.type whitelist + file.size + Zod si JSON |
| V6 Cryptography | non | Pas de crypto requise |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Upload de fichier malveillant (déguisé en image) | Tampering | Sharp tente de décoder — erreur si non-image → 500 avec message générique. Pas d'exécution du fichier. |
| DoS par uploads répétés de fichiers 15Mo | DoS | Validation client 15Mo + MAX_FILE_SIZE serveur. Rate limiting non implémenté (hors scope). |
| Path traversal via filename | Tampering | Fichier uploadé traité uniquement via `file.arrayBuffer()` — jamais écrit sur disque. Pas de risque. |
| XSS via error message | XSS | Messages d'erreur proviennent du serveur en français — affichés via React (pas `dangerouslySetInnerHTML`). |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: node_modules/@img/sharp-libvips-darwin-arm64/versions.json] — libheif 1.20.2 vendorisé sur macOS
- [VERIFIED: GitHub issue #4472 lovell/sharp] — Sharp prebuilt Linux ne supporte pas HEIC
- [VERIFIED: src/app/api/simulate/route.ts] — Route existante, MAX_FILE_SIZE actuel, fabric_id obligatoire
- [VERIFIED: src/components/public/Catalogue/ConfiguratorModal.tsx] — Patterns état existants
- [VERIFIED: MDN HTML Drag and Drop API] — Events DnD natifs React
- [VERIFIED: MDN AbortController.abort()] — Pattern annulation fetch

### Secondary (MEDIUM confidence)
- [CITED: github.com/vercel/next.js/discussions/70621] — Route Handler body size limit App Router
- [CITED: react.wiki/hooks/file-upload-hook] — URL.createObjectURL vs FileReader
- [CITED: caniuse.com/heif] — HEIF/HEIC browser support (Safari only)
- [CITED: xjavascript.com/blog — HEIC detection iOS11] — iOS Safari MIME type edge cases

### Tertiary (LOW confidence)
- WebSearch: timings progression simulée (33ms/100ms) — non vérifié empiriquement

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — vérifié directement dans node_modules
- Architecture Patterns: HIGH — basé sur code existant + MDN
- HEIC Pitfall: HIGH — vérifié GitHub issues lovell/sharp + binaire local
- DnD Pitfall dragLeave: HIGH — comportement HTML5 documenté MDN
- Timings progression simulée: LOW — valeurs estimées, à ajuster visuellement

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stack stable — Sharp, React, Next.js)
