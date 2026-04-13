# Sofa Placer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guided bounding-box placement step to "Visualiser chez moi" so the user positions a pre-proportioned rectangle on their room photo, and the server generates an inpainting mask + textual coordinates for Gemini.

**Architecture:** New `SofaPlacer` component (div overlay with Pointer Events drag + range slider) renders during the `placing` simulation state. On launch, client sends rectangle coordinates (percentages) in FormData. Server generates a black/white PNG mask with Sharp, encodes it as data URI, and passes it alongside the room photo to Gemini with a mask-aware prompt.

**Tech Stack:** React (CSS Modules, Pointer Events), Sharp (SVG-to-PNG mask), Zod (rect validation), Gemini API (inpainting via mask image)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/utils.ts` | Modify | Add `parseDimensions()` |
| `src/lib/ai/masking.ts` | Create | `generatePlacementMask()` — SVG→PNG via Sharp |
| `src/lib/ai/types.ts` | Modify | Add `maskDataUrl?: string` to `GenerateRequest` |
| `src/lib/ai/prompts.ts` | Modify | Add `buildSimulateWithMaskPrompt()` |
| `src/lib/ai/nano-banana.ts` | Modify | Route mask to Gemini contents when present |
| `src/app/api/simulate/route.ts` | Modify | Parse rect, generate mask, pass to IA service |
| `src/components/public/Catalogue/SofaPlacer.tsx` | Create | Draggable rectangle + slider UI |
| `src/components/public/Catalogue/SofaPlacer.module.css` | Create | Styles (amber theme from design tokens) |
| `src/components/public/Catalogue/ConfiguratorModal.tsx` | Modify | Replace `preview` state with `placing`, wire SofaPlacer |

---

### Task 1: Add `parseDimensions()` to utils

**Files:**
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Add parseDimensions function**

Add at the end of `src/lib/utils.ts`:

```typescript
/**
 * Parse une chaine de dimensions "L 280 × P 180 × H 85 cm" en {width, depth}.
 * Retourne null si le format n'est pas reconnu.
 */
export function parseDimensions(str: string): { width: number; depth: number } | null {
  const match = str.match(/L\s*(\d+)\s*[×x]\s*P\s*(\d+)/i)
  if (!match) return null
  const width = parseInt(match[1], 10)
  const depth = parseInt(match[2], 10)
  if (isNaN(width) || isNaN(depth) || width <= 0 || depth <= 0) return null
  return { width, depth }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat(utils): add parseDimensions for sofa placer"
```

---

### Task 2: Create `masking.ts` — mask generation

**Files:**
- Create: `src/lib/ai/masking.ts`

- [ ] **Step 1: Create the masking module**

Create `src/lib/ai/masking.ts`:

```typescript
/**
 * Generation de masques d'inpainting pour le placement guide.
 * Produit un PNG noir/blanc : blanc = zone de placement, noir = preserver.
 */
import sharp from 'sharp'

export interface PlacementRect {
  x: number      // pourcentage 0-100
  y: number
  width: number
  height: number
}

/**
 * Genere un masque PNG noir/blanc pour l'inpainting Gemini.
 * Le rectangle blanc est dilate de 10px pour un blend naturel.
 */
export async function generatePlacementMask(
  imageWidth: number,
  imageHeight: number,
  rect: PlacementRect
): Promise<Buffer> {
  const dilate = 10

  // Convertir pourcentages en pixels avec dilatation
  const px = {
    x: Math.max(0, Math.round((rect.x / 100) * imageWidth) - dilate),
    y: Math.max(0, Math.round((rect.y / 100) * imageHeight) - dilate),
    w: Math.min(imageWidth, Math.round((rect.width / 100) * imageWidth) + dilate * 2),
    h: Math.min(imageHeight, Math.round((rect.height / 100) * imageHeight) + dilate * 2),
  }

  // Clamp pour ne pas deborder
  if (px.x + px.w > imageWidth) px.w = imageWidth - px.x
  if (px.y + px.h > imageHeight) px.h = imageHeight - px.y

  const svg = `
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="black" />
      <rect x="${px.x}" y="${px.y}" width="${px.w}" height="${px.h}" fill="white" />
    </svg>
  `

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer()
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/masking.ts
git commit -m "feat(ai): add generatePlacementMask for inpainting"
```

---

### Task 3: Add `maskDataUrl` to types + mask-aware prompt

**Files:**
- Modify: `src/lib/ai/types.ts`
- Modify: `src/lib/ai/prompts.ts`

- [ ] **Step 1: Add maskDataUrl to GenerateRequest**

In `src/lib/ai/types.ts`, add after the `dimensions` field:

```typescript
  /** Data URI du masque d'inpainting PNG (blanc = zone de placement) */
  maskDataUrl?: string
```

- [ ] **Step 2: Add buildSimulateWithMaskPrompt to prompts.ts**

Add at the end of `src/lib/ai/prompts.ts`:

```typescript
// ---------------------------------------------------------------------------
// Simulation avec masque d'inpainting
// ---------------------------------------------------------------------------

/**
 * Prompt simulation avec masque — guide Gemini via zone blanche + coordonnees.
 * Utilise dans POST /api/simulate quand l'utilisateur a place le rectangle.
 */
export function buildSimulateWithMaskPrompt(
  modelName: string,
  fabricName: string,
  rect: { x: number; y: number; width: number; height: number },
  dimensions?: string
): string {
  const dimLine = dimensions ? `The sofa measures ${dimensions}.` : ''

  return [
    `The first image is a photograph of a customer's room.`,
    `The second image is a binary mask: the white region indicates exactly where the sofa must be placed.`,
    `The black region must be preserved unchanged.`,
    ``,
    `Place the "${modelName}" sofa, upholstered in "${fabricName}" fabric, precisely within the white masked area.`,
    `${dimLine}`,
    `The sofa occupies approximately ${Math.round(rect.x)}%-${Math.round(rect.x + rect.width)}% horizontally`,
    `and ${Math.round(rect.y)}%-${Math.round(rect.y + rect.height)}% vertically in the image.`,
    ``,
    `Scale and positioning:`,
    `- The sofa must rest firmly on the floor with realistic contact shadows where the legs meet the floor.`,
    `- The sofa must not overlap with any existing furniture or walls.`,
    `- Respect the room's perspective — the sofa's vanishing lines must match the room's.`,
    ``,
    `Lighting and integration:`,
    `- Analyze the room's existing light sources, shadow directions, and color temperature.`,
    `- Match the sofa's illumination to the room's ambient lighting.`,
    `- Generate shadows beneath and behind the sofa consistent with the existing shadow direction.`,
    ``,
    `Preservation:`,
    `- Preserve all architectural elements exactly as in the original photograph.`,
    `- Only add the sofa — do not modify or remove any existing elements.`,
  ].join('\n')
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/types.ts src/lib/ai/prompts.ts
git commit -m "feat(ai): add maskDataUrl type and mask-aware simulation prompt"
```

---

### Task 4: Wire mask into NanoBananaService

**Files:**
- Modify: `src/lib/ai/nano-banana.ts`

- [ ] **Step 1: Add import for the new prompt function**

In `src/lib/ai/nano-banana.ts`, update the import from prompts:

```typescript
import {
  buildBackOfficePrompt,
  buildBackOfficePromptNoSwatch,
  buildSimulatePrompt,
  buildSimulateWithMaskPrompt,
} from './prompts'
```

- [ ] **Step 2: Update the simulation branch in generate()**

In the `generate()` method, replace the `if (viewType === 'simulation')` block (lines 108-110):

```typescript
    if (viewType === 'simulation') {
      prompt = buildSimulatePrompt(modelName, fabricName, dimensions)
      contents.push(prompt, sourcePart)
    }
```

with:

```typescript
    if (viewType === 'simulation') {
      if (request.maskDataUrl) {
        const maskPart = await this.resolveImagePart(request.maskDataUrl)
        const rect = request.placementRect ?? { x: 0, y: 0, width: 100, height: 100 }
        prompt = buildSimulateWithMaskPrompt(modelName, fabricName, rect, dimensions)
        contents.push(prompt, sourcePart, maskPart)
      } else {
        prompt = buildSimulatePrompt(modelName, fabricName, dimensions)
        contents.push(prompt, sourcePart)
      }
    }
```

- [ ] **Step 3: Add placementRect to GenerateRequest in types.ts**

In `src/lib/ai/types.ts`, add after `maskDataUrl`:

```typescript
  /** Coordonnees du rectangle de placement (pourcentages 0-100) */
  placementRect?: { x: number; y: number; width: number; height: number }
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/nano-banana.ts src/lib/ai/types.ts
git commit -m "feat(ai): wire placement mask into NanoBananaService"
```

---

### Task 5: Update simulate route — parse rect, generate mask

**Files:**
- Modify: `src/app/api/simulate/route.ts`

- [ ] **Step 1: Add imports and Zod schema**

At the top of `src/app/api/simulate/route.ts`, add to imports:

```typescript
import { z } from 'zod'
import { generatePlacementMask } from '@/lib/ai/masking'
```

Add after the `RATE_WINDOW_MS` constant:

```typescript
const placementRectSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(5).max(100),
  height: z.number().min(5).max(100),
})
```

- [ ] **Step 2: Parse rect from FormData**

After the line `const fabricId = (formData.get('fabric_id') as string | null)?.trim()` (line 68), add:

```typescript
  const rectRaw = formData.get('rect') as string | null
```

- [ ] **Step 3: Validate and generate mask before IA call**

Replace the resize + generate block (lines 144-162) with:

```typescript
    // Resize systematique avant envoi Gemini — evite payload > 20 Mo (per IA-04)
    const rawImageBuffer = Buffer.from(await image.arrayBuffer())
    const resizedImage = sharp(rawImageBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
    const resizedBuffer = await resizedImage.toBuffer()
    const resizedMeta = await sharp(resizedBuffer).metadata()
    const sourceImageUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`

    // Parse et valider le rectangle de placement
    let maskDataUrl: string | undefined
    let placementRect: { x: number; y: number; width: number; height: number } | undefined

    if (rectRaw) {
      try {
        const parsed = placementRectSchema.parse(JSON.parse(rectRaw))
        // Clamp pour securite
        const rect = {
          x: Math.min(parsed.x, 100 - parsed.width),
          y: Math.min(parsed.y, 100 - parsed.height),
          width: parsed.width,
          height: parsed.height,
        }
        placementRect = rect
        const maskBuffer = await generatePlacementMask(
          resizedMeta.width!,
          resizedMeta.height!,
          rect
        )
        maskDataUrl = `data:image/png;base64,${maskBuffer.toString('base64')}`
      } catch (maskErr) {
        // Fallback : continuer sans masque si generation echoue
        console.warn('[POST /api/simulate] Masque ignore:', maskErr instanceof Error ? maskErr.message : maskErr)
      }
    }

    // Generer le visuel via le service IA
    const iaService = getIAService()
    let resultBuffer: Buffer
    try {
      const result = await iaService.generate({
        modelName: model.name,
        fabricName,
        viewType: 'simulation',
        sourceImageUrl,
        dimensions: model.dimensions ?? undefined,
        maskDataUrl,
        placementRect,
      })
      resultBuffer = await iaService.addWatermark(
        result.imageBuffer,
        'MOBEL UNIQUE \u2014 Apercu'
      )
    } catch (genErr) {
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/api/simulate/route.ts
git commit -m "feat(simulate): parse placement rect and generate inpainting mask"
```

---

### Task 6: Create SofaPlacer component

**Files:**
- Create: `src/components/public/Catalogue/SofaPlacer.tsx`
- Create: `src/components/public/Catalogue/SofaPlacer.module.css`

- [ ] **Step 1: Create SofaPlacer.tsx**

Create `src/components/public/Catalogue/SofaPlacer.tsx`:

```typescript
'use client'

import { useState, useRef, useCallback } from 'react'
import styles from './SofaPlacer.module.css'

export interface PlacementRect {
  x: number
  y: number
  width: number
  height: number
}

interface SofaPlacerProps {
  imageUrl: string
  sofaName: string
  sofaWidth: number
  sofaDepth: number
  onLaunch: (rect: PlacementRect) => void
  onChangePhoto: () => void
}

const MIN_SCALE = 20
const MAX_SCALE = 80
const DEFAULT_SCALE = 45

export function SofaPlacer({
  imageUrl,
  sofaName,
  sofaWidth,
  sofaDepth,
  onLaunch,
  onChangePhoto,
}: SofaPlacerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const aspectRatio = sofaWidth / sofaDepth

  // Scale = pourcentage de la largeur image occupe par le rectangle
  const [scale, setScale] = useState(DEFAULT_SCALE)

  // Dimensions du rectangle en pourcentages
  const rectW = scale
  const rectH = Math.min(scale / aspectRatio, 90)

  // Position initiale : centre horizontal, moitie basse
  const [pos, setPos] = useState({ x: (100 - rectW) / 2, y: 55 - rectH / 2 })
  const dragging = useRef(false)
  const dragStart = useRef({ px: 0, py: 0, startX: 0, startY: 0 })

  // Clamp la position pour que le rectangle reste dans l'image
  const clamp = useCallback((x: number, y: number, w: number, h: number) => ({
    x: Math.max(0, Math.min(x, 100 - w)),
    y: Math.max(0, Math.min(y, 100 - h)),
  }), [])

  // Recalculer la position quand le scale change
  const handleScaleChange = useCallback((newScale: number) => {
    setScale(newScale)
    const newW = newScale
    const newH = Math.min(newScale / aspectRatio, 90)
    setPos(prev => clamp(prev.x, prev.y, newW, newH))
  }, [aspectRatio, clamp])

  // Drag handlers via Pointer Events
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    dragStart.current = {
      px: e.clientX,
      py: e.clientY,
      startX: pos.x,
      startY: pos.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos.x, pos.y])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragStart.current.px) / rect.width) * 100
    const dy = ((e.clientY - dragStart.current.py) / rect.height) * 100
    setPos(clamp(
      dragStart.current.startX + dx,
      dragStart.current.startY + dy,
      rectW,
      rectH
    ))
  }, [clamp, rectW, rectH])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const handleLaunch = useCallback(() => {
    onLaunch({ x: pos.x, y: pos.y, width: rectW, height: rectH })
  }, [onLaunch, pos.x, pos.y, rectW, rectH])

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.container}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <img
          src={imageUrl}
          alt="Votre salon"
          className={styles.roomImage}
          draggable={false}
        />

        {/* Rectangle de placement */}
        <div
          className={styles.placementRect}
          role="application"
          aria-label="Zone de placement du canape — deplacer avec le doigt ou la souris"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: `${rectW}%`,
            height: `${rectH}%`,
          }}
          onPointerDown={handlePointerDown}
        >
          {/* Badge dimensions au-dessus */}
          <span className={styles.dimensionBadge}>
            {sofaWidth} &times; {sofaDepth} cm
          </span>
        </div>

        {/* Bouton changer de photo */}
        <button
          type="button"
          className={styles.changePhotoButton}
          onClick={onChangePhoto}
        >
          Changer de photo
        </button>
      </div>

      {/* Slider de taille */}
      <div className={styles.sliderRow}>
        <label htmlFor="sofa-scale" className={styles.sliderLabel}>Taille</label>
        <input
          id="sofa-scale"
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          value={scale}
          onChange={e => handleScaleChange(Number(e.target.value))}
          className={styles.slider}
          aria-label="Taille apparente du canape"
        />
      </div>

      {/* CTA Lancer */}
      <button
        type="button"
        className={styles.launchButton}
        onClick={handleLaunch}
      >
        Lancer la simulation
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create SofaPlacer.module.css**

Create `src/components/public/Catalogue/SofaPlacer.module.css`:

```css
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--radius-md);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  background: var(--surface-alt);
}

.roomImage {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

/* Rectangle de placement */
.placementRect {
  position: absolute;
  border: 2px solid var(--primary);
  background: rgba(228, 148, 0, 0.15);
  border-radius: var(--radius-sm);
  cursor: grab;
  z-index: 2;
}

.placementRect:active {
  cursor: grabbing;
}

/* Badge dimensions au-dessus du rectangle */
.dimensionBadge {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  pointer-events: none;
}

/* Bouton changer de photo */
.changePhotoButton {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-size: 0.8rem;
  font-family: var(--font-heading);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.changePhotoButton:hover {
  background: rgba(0, 0, 0, 0.75);
}

/* Slider de taille */
.sliderRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 4px;
}

.sliderLabel {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
}

.slider {
  flex: 1;
  height: 4px;
  appearance: none;
  -webkit-appearance: none;
  background: var(--surface-container);
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

/* Bouton lancer */
.launchButton {
  width: 100%;
  padding: 14px 24px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.15s;
}

.launchButton:hover {
  background: var(--primary-dark);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Catalogue/SofaPlacer.tsx src/components/public/Catalogue/SofaPlacer.module.css
git commit -m "feat(ui): add SofaPlacer component with drag and slider"
```

---

### Task 7: Wire SofaPlacer into ConfiguratorModal

**Files:**
- Modify: `src/components/public/Catalogue/ConfiguratorModal.tsx`

- [ ] **Step 1: Add imports**

At the top of `ConfiguratorModal.tsx`, add:

```typescript
import { SofaPlacer, type PlacementRect } from './SofaPlacer'
import { parseDimensions } from '@/lib/utils'
```

- [ ] **Step 2: Update SimulationState type**

Replace line 10:

```typescript
type SimulationState = 'idle' | 'preview' | 'generating' | 'done' | 'error'
```

with:

```typescript
type SimulationState = 'idle' | 'placing' | 'generating' | 'done' | 'error'
```

- [ ] **Step 3: Add placementRect ref**

After `const [isDragging, setIsDragging] = useState(false)` (line 79), add:

```typescript
  const placementRectRef = useRef<PlacementRect | null>(null)
```

- [ ] **Step 4: Update handleFileSelected**

In `handleFileSelected` callback (~line 152), change `setSimulationState('preview')` to:

```typescript
    setSimulationState('placing')
```

- [ ] **Step 5: Update handleLancerSimulation to accept rect**

Replace the `handleLancerSimulation` callback signature and FormData section. Change:

```typescript
  const handleLancerSimulation = useCallback(async () => {
    if (!selectedFile || !model) return
```

to:

```typescript
  const handleLancerSimulation = useCallback(async (rect?: PlacementRect) => {
    if (!selectedFile || !model) return
    if (rect) placementRectRef.current = rect
```

And in the FormData construction, after `if (selectedFabricId) formData.append('fabric_id', selectedFabricId)`, add:

```typescript
      if (placementRectRef.current) {
        formData.append('rect', JSON.stringify(placementRectRef.current))
      }
```

- [ ] **Step 6: Update abort handler to go back to placing**

In the catch block of handleLancerSimulation, change:

```typescript
        setSimulationState('preview')
```

to:

```typescript
        setSimulationState('placing')
```

- [ ] **Step 7: Replace preview UI block with SofaPlacer**

Replace the entire block for `simulationState === 'preview' || simulationState === 'error'` (lines 684-708) with:

```typescript
                {/* Etat placing : SofaPlacer avec rectangle draggable */}
                {(simulationState === 'placing' || simulationState === 'error') && previewUrl && (
                  <>
                    {(() => {
                      const dims = model.dimensions ? parseDimensions(model.dimensions) : null
                      return (
                        <SofaPlacer
                          imageUrl={previewUrl}
                          sofaName={model.name}
                          sofaWidth={dims?.width ?? 250}
                          sofaDepth={dims?.depth ?? 160}
                          onLaunch={handleLancerSimulation}
                          onChangePhoto={() => fileInputRef.current?.click()}
                        />
                      )
                    })()}
                    {simulationState === 'error' && errorMessage && (
                      <p className={styles.errorMessage} role="alert" aria-live="assertive">{errorMessage}</p>
                    )}
                  </>
                )}
```

- [ ] **Step 8: Update handleReessayer**

Change:

```typescript
  const handleReessayer = useCallback(() => {
    handleLancerSimulation()
  }, [handleLancerSimulation])
```

to:

```typescript
  const handleReessayer = useCallback(() => {
    handleLancerSimulation(placementRectRef.current ?? undefined)
  }, [handleLancerSimulation])
```

- [ ] **Step 9: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add src/components/public/Catalogue/ConfiguratorModal.tsx
git commit -m "feat(modal): wire SofaPlacer into simulation flow, replace preview with placing state"
```

---

### Task 8: Verify full build and lint

**Files:** none (verification only)

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit 2>&1`
Expected: no errors

- [ ] **Step 2: ESLint check**

Run: `npm run lint 2>&1 | tail -5`
Expected: 0 errors (warnings OK)

- [ ] **Step 3: Dev server smoke test**

Run: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000`
Expected: `200`

- [ ] **Step 4: Final commit with all changes if any fixups needed**

```bash
git add -A
git status
# Only commit if there are changes from fixups
```
