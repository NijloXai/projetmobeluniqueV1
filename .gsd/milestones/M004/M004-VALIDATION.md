---
verdict: pass
remediation_round: 0
---

# Milestone Validation: M004

## Success Criteria Checklist

- [x] **L'admin peut créer un canapé (nom, slug, description, prix, dimensions, lien Shopify)** — evidence: S01 delivers POST /api/admin/models with Zod validation and auto-slug. S03 delivers ModelForm with all 7 info fields (name, slug, description, price, dimensions, shopify_url, is_active), react-hook-form + zodResolver, JSON create flow at /admin/produits/new that POSTs to the API and redirects to edit page.
- [x] **Upload multi-angles avec choix de vue et réordonnement** — evidence: S03 T02 delivers photo management section in ModelForm: ImageUpload with maxSizeMB={5}, view_type text input per image, upload to /api/admin/models/[id]/images as FormData, responsive CSS grid display, sort_order swap reorder via up/down arrows using Promise.all of two PUTs, delete with confirmation. S01 T02 provides the backing API routes.
- [x] **Mode classique : upload photo finale + choix angle + choix tissu → rendu publié** — evidence: S04 delivers Mode Classique section in ModelForm with fabric select (fetched from /api/admin/fabrics), angle select (from model's existing images), ImageUpload for the rendered visual, and upload handler that POSTs FormData to /api/admin/models/[id]/visuals. API route inserts into generated_visuals with is_validated=true and is_published=true. Visuals grid with delete.
- [x] **Tableau /admin/produits avec toggle actif/inactif** — evidence: S02 delivers /admin/produits with ModelList client component rendering a 5-column table (Nom, Prix €, Photos, Actif toggle via ToggleSwitch, Actions). Toggle calls PUT /api/admin/models/:id with `{ is_active: !model.is_active }`. Delete with ConfirmDialog. Empty state with link to create first product.
- [x] **Un canapé désactivé n'apparaît plus via API publique (déjà couvert par RLS)** — evidence: GET /api/models (public route at src/app/api/models/route.ts) applies `.eq('is_active', true)` filter on the query, confirmed by code inspection. RLS provides a second layer of defense at the DB level.
- [x] **Le canapé créé apparaît dans GET /api/models avec ses images** — evidence: GET /api/models selects `*, model_images(*)`, orders models by created_at desc, and sorts nested images by sort_order. Route file exists at src/app/api/models/route.ts and returns the full model list with nested image arrays.

## Slice Delivery Audit

| Slice | Claimed | Delivered | Status |
|-------|---------|-----------|--------|
| S01 | CRUD API /api/admin/models + /api/admin/models/[id]/images, shared extractStoragePath | 4 route files (models, models/[id], images, images/[imageId]), extractStoragePath in src/lib/utils.ts, fabrics import updated. tsc passes. | ✅ pass |
| S02 | /admin/produits table with toggle, delete, empty state | page.tsx (server), ModelList.tsx (client), page.module.css. Table with 5 columns, ToggleSwitch, ConfirmDialog, "+ Nouveau produit" link, empty state. tsc passes. | ✅ pass |
| S03 | ModelForm with 7 info fields + multi-angle photo management at /new and /[id]/edit | ModelForm.tsx (react-hook-form + zod, 7 fields, auto-slug, photo section with upload/reorder/delete), form.module.css, new/page.tsx, [id]/edit/page.tsx. tsc passes. | ✅ pass |
| S04 | Mode Classique UI + visuals CRUD API | visuals/route.ts (GET+POST), visuals/[visualId]/route.ts (DELETE), Mode Classique section in ModelForm with fabric/angle selects + upload + visuals grid. tsc passes. | ✅ pass |

## Cross-Slice Integration

All boundary contracts are satisfied:

- **S01 → S02:** S02's ModelList calls GET /api/admin/models (with model_images count), PUT /api/admin/models/:id (toggle), DELETE /api/admin/models/:id — all provided by S01. ✓
- **S01 → S03:** S03's ModelForm calls POST /api/admin/models (create), PUT /api/admin/models/:id (edit), GET /api/admin/models/:id (fetch with images), and the full images CRUD endpoints — all provided by S01. ✓
- **S01 + S03 → S04:** S04 reuses S01's extractStoragePath, the requireAdmin pattern, and FormData upload pattern. S04 extends S03's ModelForm component directly, reuses ImageUpload and the photo section CSS classes. ✓
- **S02 → S03:** S02's "Modifier" links point to /admin/produits/${id}/edit, and "+ Nouveau produit" links to /admin/produits/new — both routes created by S03. ✓

No boundary mismatches found.

## Requirement Coverage

| Req | Description | Covered By | Status |
|-----|-------------|------------|--------|
| R007 | Admin can create and edit products via form UI | S01 (API), S02 (list), S03 (form) | ✅ covered |
| R015 | Upload with 5MB client-side limit | S01 (server 5MB check), S03 (ImageUpload maxSizeMB={5}) | ✅ covered |
| R014 | Partial — already validated for fabrics in M003, partial coverage extended here | S04 (reuses ImageUpload pattern) | ✅ partial as planned |

Requirements explicitly left for later milestones (R008, R009, R010, R011, R016) are not in scope for M004. No gaps.

## Verdict Rationale

All 6 success criteria are met with concrete evidence from slice summaries, code inspection, and TypeScript compilation. All 4 slices delivered their claimed outputs and passed verification. Cross-slice integration points are correctly wired. Both active requirements (R007, R015) are addressed. No regressions or missing deliverables found.

The public API route GET /api/models correctly filters by is_active=true and returns models with nested images — confirming the last two success criteria that bridge admin CRUD to public consumption.

Known limitations (no drag-and-drop reorder, no pagination, silent toggle failures, no bulk upload) are all documented in slice summaries and are acceptable for the current scope.

## Remediation Plan

None — verdict is pass.
