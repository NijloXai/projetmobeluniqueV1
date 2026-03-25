---
id: T03
parent: S01
milestone: M006
key_files:
  - src/app/admin/(protected)/produits/ModelForm.tsx
  - src/app/admin/(protected)/produits/form.module.css
key_decisions:
  - Placed export section after IA generation section — it's logically the last step (generate → validate → export)
  - Used content-type header check (application/zip vs JSON) to distinguish success from error, matching the API route's response format
  - Dark button (#1e293b) differentiates the export action from the primary gold-colored CRUD buttons
duration: ""
verification_result: passed
completed_at: 2026-03-25T02:58:30.326Z
blocker_discovered: false
---

# T03: Add Export ZIP button to ModelForm UI with loader state, blob download, and error handling

**Add Export ZIP button to ModelForm UI with loader state, blob download, and error handling**

## What Happened

Added the "Exporter ZIP" button to ModelForm.tsx with full client-side logic:

1. **State management** — Added `exporting` (boolean) and `exportError` (string|null) state variables to track export progress and surface errors.

2. **handleExportZip handler** — On click, fetches `GET /api/admin/visuals/{model.id}/export`. Checks the `content-type` response header:
   - If `application/zip`: creates a Blob, generates an object URL, triggers download via an anchor element click with `download` attribute set to `{model.slug}-visuels.zip`, then cleans up the anchor and revokes the URL.
   - If JSON (error case): parses the error message and displays it via `exportError` state.
   - On network failure: shows a French connection error message.
   - Always resets `exporting` to false in the `finally` block.

3. **JSX section** — Placed the export section after the IA generation section and before the Actions bar. The section is visible only in edit mode (`isEdit && model`). Includes a description paragraph, error display, and the button with disabled/spinner state during export.

4. **CSS styles** — Added `.exportSection`, `.exportHeader`, `.exportTitle`, `.exportDescription`, `.exportError`, `.exportBtn`, and `.exportSpinner` classes in form.module.css, following the same design patterns as existing sections (consistent spacing, colors, border-top separator).

## Verification

- `npx tsc --noEmit` passes with zero errors (exit code 0)
- grep confirms `exporting` state, fetch to export API endpoint, blob/createObjectURL download logic all present in ModelForm.tsx
- grep confirms all 9 export CSS classes present in form.module.css
- Button is only rendered when `isEdit && model` (edit mode guard)
- Button disabled state tied to `exporting` boolean
- Error display tied to `exportError` state with French messages

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 3400ms |
| 2 | `grep -n 'exporting' src/app/admin/(protected)/produits/ModelForm.tsx` | 0 | ✅ pass | 10ms |
| 3 | `grep -n 'api/admin/visuals.*export' src/app/admin/(protected)/produits/ModelForm.tsx` | 0 | ✅ pass | 10ms |
| 4 | `grep -n 'createObjectURL|blob|Blob' src/app/admin/(protected)/produits/ModelForm.tsx` | 0 | ✅ pass | 10ms |
| 5 | `grep -n '.export' src/app/admin/(protected)/produits/form.module.css` | 0 | ✅ pass | 10ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/app/admin/(protected)/produits/ModelForm.tsx`
- `src/app/admin/(protected)/produits/form.module.css`
