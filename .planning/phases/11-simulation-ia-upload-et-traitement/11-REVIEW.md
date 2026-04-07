---
phase: 11-simulation-ia-upload-et-traitement
reviewed: 2026-04-07T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/app/api/simulate/route.ts
  - src/components/public/Catalogue/ConfiguratorModal.module.css
  - src/components/public/Catalogue/ConfiguratorModal.tsx
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-04-07
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Phase 11 adds IA simulation functionality: a public `/api/simulate` route accepting photo uploads, and a multi-step simulation UI within the existing `ConfiguratorModal` component. The API route is well-structured with proper error handling, size validation, and HEIC-specific error messaging. The component implements a clean state machine (`idle` -> `preview` -> `generating` -> `done` | `error`) with drag-and-drop, progress indication, and abort support.

However, there is one critical bug: the `done` state (simulation result) is never rendered in the JSX -- the user sees nothing after a successful simulation. There are also missing server-side validations and a minor authorization gap.

## Critical Issues

### CR-01: Simulation result (`done` state) is never rendered -- user sees blank after success

**File:** `src/components/public/Catalogue/ConfiguratorModal.tsx:10,74,350-351`
**Issue:** The `SimulationState` type defines a `done` state (line 10), and `handleLancerSimulation` transitions to `simulationState === 'done'` after a successful fetch (line 351). However, the JSX never renders anything for this state. The component only handles `idle`, `preview`, `error`, and `generating` in the left column. When the simulation succeeds, the left column renders nothing (no conditional branch matches `done`), so the user sees an empty area with no result image. The `resultBlobUrl` (line 74) is set but never used in any `<img>` tag.

**Fix:** Add a rendering branch for `simulationState === 'done'` that displays the generated image. For example, after the `generating` block (after line 678):

```tsx
{/* Etat done : resultat de la simulation */}
{simulationState === 'done' && resultBlobUrl && (
  <>
    <div className={styles.previewContainer}>
      <img src={resultBlobUrl} alt={`Simulation ${model.name} dans votre salon`} className={styles.previewImage} />
      <div className={styles.previewOverlay}>
        <button type="button" className={styles.changePhotoLink} onClick={() => {
          setSimulationState('idle')
          setSelectedFile(null)
          if (previewUrl) URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
          if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
          setResultBlobUrl(null)
        }}>
          Nouvelle photo
        </button>
      </div>
    </div>
    <button type="button" className={styles.launchButton} onClick={handleLancerSimulation}>
      Relancer la simulation
    </button>
  </>
)}
```

## Warnings

### WR-01: Server-side route does not validate image MIME type

**File:** `src/app/api/simulate/route.ts:24,87`
**Issue:** The `image` file from FormData is used without validating its MIME type on the server side. Line 87 embeds `image.type` directly into a data URL (`data:${image.type};base64,...`). While the client-side `validateFile` checks accepted types (JPEG, PNG, HEIC), the server accepts any file type. A direct API call bypassing the UI could send arbitrary file types (e.g., SVG with embedded scripts, or non-image files) to the IA service.

**Fix:** Add server-side MIME type validation after the size check:

```typescript
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif'])
if (!ACCEPTED_TYPES.has(image.type) && !/\.(heic|heif)$/i.test(image.name)) {
  return NextResponse.json(
    { error: 'Format non supporte. Utilisez JPEG, PNG ou HEIC.' },
    { status: 400 }
  )
}
```

### WR-02: Simulate route allows simulation on inactive/unpublished models

**File:** `src/app/api/simulate/route.ts:54-58`
**Issue:** The query on `models` table (line 54-58) does not filter by `is_active`. All other public API routes (`/api/models`, `/api/models/[slug]`, `/api/models/[slug]/visuals`) explicitly filter `.eq('is_active', true)`. This means a user who discovers or guesses a `model_id` for an inactive/draft model can still run simulations against it. Similarly, `fabrics` (line 71-74) is not filtered by `is_active`.

**Fix:** Add `is_active` filter to both queries:

```typescript
const { data: model, error: modelError } = await supabase
  .from('models')
  .select('id, name')
  .eq('id', modelId)
  .eq('is_active', true)
  .single()
```

```typescript
const { data: fabric, error: fabricError } = await supabase
  .from('fabrics')
  .select('id, name')
  .eq('id', fabricId)
  .eq('is_active', true)
  .single()
```

### WR-03: Error message leaks internal details to public users

**File:** `src/app/api/simulate/route.ts:130-135`
**Issue:** The catch-all error handler on line 130-134 includes the raw `err.message` in the JSON response returned to the public user (`Erreur lors de la simulation : ${message}`). Since this is a public route (no auth required), internal error messages (database errors, IA service errors, file system paths, etc.) could leak to any external caller. This is an information disclosure risk.

**Fix:** Log the detailed error server-side but return a generic message to the user:

```typescript
} catch (err) {
  const message = err instanceof Error ? err.message : 'Erreur inconnue'
  console.error('[POST /api/simulate] Erreur:', message)
  return NextResponse.json(
    { error: 'La simulation a echoue. Veuillez reessayer.' },
    { status: 500 }
  )
}
```

## Info

### IN-01: `ACCEPTED_TYPES` and `MAX_SIZE_BYTES` are redeclared on every render

**File:** `src/components/public/Catalogue/ConfiguratorModal.tsx:216-217`
**Issue:** `ACCEPTED_TYPES` (a `new Set(...)`) and `MAX_SIZE_BYTES` are declared inside the component body, meaning they are recreated on every render. While not a bug, moving them outside the component as module-level constants would be cleaner and consistent with the route file which declares `MAX_FILE_SIZE` at module level (line 5).

**Fix:** Move these above the component declaration:

```typescript
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif'])
const MAX_SIZE_BYTES = 15 * 1024 * 1024

export function ConfiguratorModal(...) {
```

### IN-02: Duplicate `id="modal-title"` across configurator and simulation steps

**File:** `src/components/public/Catalogue/ConfiguratorModal.tsx:493,688`
**Issue:** Both the configurator step (line 493) and the simulation step (line 688) render an element with `id="modal-title"`. While only one branch renders at a time (due to `modalStep` state), having the same `id` in two code paths is fragile. The `aria-labelledby="modal-title"` on the dialog (line 424) will always find one, but this pattern could cause confusion during maintenance.

**Fix:** Use distinct IDs: `id="modal-title-config"` and `id="modal-title-simulation"`, and update `aria-labelledby` dynamically:

```tsx
aria-labelledby={modalStep === 'configurator' ? 'modal-title-config' : 'modal-title-simulation'}
```

---

_Reviewed: 2026-04-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
