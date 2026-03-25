# T04: IAGenerationSection component + ModelForm integration

**Slice:** S01 — Admin IA Generation
**Type:** Frontend implementation
**Risk:** Medium (complex state management for generation/validation/publish per-visual)

## What

Create a dedicated `IAGenerationSection` component that renders Section 3 of the product form — the IA generation workflow. This component handles its own state (generation progress, visual status per angle) and calls the API routes from T03.

## Component: `src/app/admin/(protected)/produits/IAGenerationSection.tsx`

### Props
```typescript
interface IAGenerationSectionProps {
  modelId: string
  images: ModelImage[]           // angles available for generation
  fabrics: Fabric[]              // fabrics available for selection
  visuals: VisualWithFabric[]    // existing generated visuals
  onVisualsChange: () => void    // callback to refresh visuals in parent
}
```

### UI Structure

1. **Header:** "Génération IA" title + visual count badge
2. **Fabric selector:** dropdown to pick a fabric (filters matrix below)
3. **Angle matrix:** grid of cards, one per model_image
   - Each card shows:
     - Angle label (view_type)
     - If visual exists for this (fabric, angle): show thumbnail + status badge
     - Status badges: "Généré" (orange), "Validé" (green), "Publié" (blue)
     - Action buttons: Générer/Régénérer, Valider, Publier
   - If no visual exists: placeholder with "Générer" button
4. **Bulk actions bar** (visible when a fabric is selected):
   - "Générer tout" — generates all missing angles
   - "Valider tout" — validates all unvalidated
   - "Publier tout" — publishes all validated-but-unpublished
5. **Loading states:** per-card spinner during generation, disabled buttons during bulk ops
6. **Error handling:** per-action error display, auto-dismiss

### State Management
- `selectedFabricId` — currently selected fabric
- `generatingIds` — Set of model_image_ids currently being generated
- `bulkAction` — null | 'generating' | 'validating' | 'publishing'
- Derived: filter `visuals` by selectedFabricId to get current matrix state

### API Calls
- Generate one: `POST /api/admin/generate` with `{ model_id, model_image_id, fabric_id }`
- Generate all: `POST /api/admin/generate-all` with `{ model_id, fabric_id }`
- Validate: `PUT /api/admin/visuals/[id]/validate`
- Publish: `PUT /api/admin/visuals/[id]/publish`
- Bulk validate: `PUT /api/admin/visuals/bulk-validate` with `{ visual_ids: [...] }`
- Bulk publish: `PUT /api/admin/visuals/bulk-publish` with `{ visual_ids: [...] }`

## ModelForm Integration

In `ModelForm.tsx`, add after the Mode Classique section:
```tsx
{isEdit && model && images.length > 0 && (
  <IAGenerationSection
    modelId={model.id}
    images={images}
    fabrics={fabrics}
    visuals={visuals}
    onVisualsChange={refreshVisuals}
  />
)}
```

This reuses the existing `fabrics`, `visuals`, and `refreshVisuals` state already managed by ModelForm.

## CSS Styles

Add to `form.module.css` with `ia` prefix (matching the `classique` prefix convention):
- `.iaSection`, `.iaHeader`, `.iaTitle`, `.iaCount`
- `.iaFabricSelect`, `.iaMatrix`, `.iaCard`, `.iaCardImage`, `.iaCardBadge`
- `.iaBulkBar`, `.iaBulkBtn`
- `.iaStatusGenerated`, `.iaStatusValidated`, `.iaStatusPublished`
- `.iaGenerating` (spinner animation)

## Verification

```bash
# Component file exists
ls src/app/admin/\(protected\)/produits/IAGenerationSection.tsx

# Import in ModelForm
grep -n "IAGenerationSection" src/app/admin/\(protected\)/produits/ModelForm.tsx

# CSS classes
grep -c "\.ia" src/app/admin/\(protected\)/produits/form.module.css

# Type check
npx tsc --noEmit
```

## Exit Criteria

- `IAGenerationSection.tsx` renders correctly in ModelForm edit mode
- Fabric selector populates from fabrics prop
- Angle matrix shows one card per model_image
- Generate/validate/publish buttons call correct API routes
- Status badges update after each action
- Bulk actions work for all eligible visuals
- Loading states prevent duplicate submissions
- `tsc --noEmit` passes
