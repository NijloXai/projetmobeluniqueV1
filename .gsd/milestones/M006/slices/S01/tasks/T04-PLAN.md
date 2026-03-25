---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T04: End-to-end verification

1. Run npx tsc --noEmit — zero errors\n2. Start dev server (or reuse existing on port 3000)\n3. Test API route: curl without auth → 401, curl with nonexistent model → 404 or empty\n4. If test data exists: curl with auth + valid modelId → verify Content-Type application/zip, save to file, unzip -t to verify structure\n5. Verify file naming pattern in ZIP matches {slug}-{fabric-slug}-{view_type}.jpg\n6. Verify ModelForm.tsx has the export button with loader state\n7. Run scripts/verify-e2e-m005.ts to confirm no regression on M005 functionality

## Inputs

- `All files from T01-T03`

## Expected Output

- `Verification evidence confirming all success criteria met`

## Verification

npx tsc --noEmit exits 0; curl -I returns 401 without auth; curl with auth returns application/zip or appropriate JSON error; unzip -t shows correctly named files (if test data available); grep ModelForm.tsx confirms Exporter ZIP button exists
