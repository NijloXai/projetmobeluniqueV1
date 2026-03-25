# T02: IA service abstraction (src/lib/ai/)

**Slice:** S01 — Admin IA Generation
**Type:** Backend implementation
**Risk:** Medium (sharp image generation is the uncertain path)

## What

Create the IA service abstraction layer — a clean TypeScript interface with a mock implementation using `sharp` for placeholder image generation, a stub for future Nano Banana 2, a factory that switches based on `NANO_BANANA_API_KEY`, and configurable prompt templates.

## Files to Create

### `src/lib/ai/types.ts`
```typescript
export interface GenerateRequest {
  modelName: string
  fabricName: string
  viewType: string
  sourceImageUrl: string // model_image URL (the angle photo)
}

export interface GenerateResult {
  imageBuffer: Buffer
  mimeType: 'image/jpeg' | 'image/png'
  extension: 'jpg' | 'png'
}

export interface IAService {
  /** Generate a visual of a model in a given fabric for a given angle */
  generate(request: GenerateRequest): Promise<GenerateResult>
  
  /** Add watermark text overlay to an image buffer */
  addWatermark(imageBuffer: Buffer, text?: string): Promise<Buffer>
}
```

### `src/lib/ai/prompts.ts`
Template functions accepting model/fabric/angle params. Two contexts:
- `buildBackOfficePrompt(modelName, fabricName, viewType)` — for admin generation
- `buildSimulatePrompt(modelName, fabricName)` — for public simulation
Not hardcoded strings — configurable templates with interpolation.

### `src/lib/ai/mock.ts`
Mock implementation of `IAService`:
- `generate()`: use `sharp` to create a 800×600 JPEG with a solid color background (derived from fabric name hash for visual variety) and SVG text overlay showing "{modelName} — {fabricName} — {viewType}"
- `addWatermark()`: use `sharp` to composite SVG text "MOBEL UNIQUE — Aperçu" diagonally on the image

### `src/lib/ai/nano-banana.ts`
Stub that implements `IAService` but throws on all methods with "Service Nano Banana 2 non configuré. Contactez l'administrateur."

### `src/lib/ai/index.ts`
Factory function `getIAService(): IAService`:
- If `process.env.NANO_BANANA_API_KEY` is set → return NanaBananaService (stub, will error on use)
- Otherwise → return MockIAService

## Verification

```bash
# All files exist
ls src/lib/ai/{types,mock,nano-banana,prompts,index}.ts

# Type check
npx tsc --noEmit

# Quick smoke test: mock generates a real image
node -e "
const { getIAService } = require('./src/lib/ai');
const svc = getIAService();
svc.generate({ modelName: 'Test', fabricName: 'Velours', viewType: 'face', sourceImageUrl: 'http://example.com/test.jpg' })
  .then(r => console.log('OK:', r.mimeType, r.imageBuffer.length, 'bytes'))
  .catch(e => console.error('FAIL:', e.message));
"
```

## Exit Criteria

- 5 files in `src/lib/ai/` with correct exports
- Mock generates real JPEG buffers (>1KB) with visible text
- Mock watermark produces a different buffer with text overlay
- Factory returns mock by default, nano-banana when env var set
- Prompts are template functions, not hardcoded strings
- `tsc --noEmit` passes
