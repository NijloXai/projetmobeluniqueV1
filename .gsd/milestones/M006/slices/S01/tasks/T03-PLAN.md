---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T03: Export ZIP button in ModelForm UI

1. In ModelForm.tsx, add an 'Exporter ZIP' button after the IA generation section (or in a dedicated export section)\n2. Button visible only in edit mode when model exists\n3. On click: set exporting state, fetch GET /api/admin/visuals/{model.id}/export\n4. If response is application/zip: create Blob, trigger download via URL.createObjectURL + anchor click\n5. If response is JSON (error case): show alert/message with the error text\n6. Reset exporting state after completion\n7. Button shows loader/disabled state while exporting\n8. Add CSS styles to form.module.css for the export button and section\n9. tsc --noEmit must pass

## Inputs

- `src/app/admin/(protected)/produits/ModelForm.tsx (existing)`
- `src/app/admin/(protected)/produits/form.module.css (existing)`

## Expected Output

- `Modified ModelForm.tsx with export button`
- `Modified form.module.css with export styles`

## Verification

npx tsc --noEmit passes; visual inspection of button in browser (manual); grep confirms exporting state + fetch + blob download logic in ModelForm.tsx
