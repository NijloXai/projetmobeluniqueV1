---
id: M004
title: "CRUD Produits"
status: complete
started_at: 2026-03-24
completed_at: 2026-03-24
duration_estimate: "72m cumulative across 4 slices"
slices_planned: 4
slices_completed: 4
verification_result: passed
requirement_outcomes:
  - id: R007
    from_status: active
    to_status: validated
    proof: "API CRUD complète (POST/PUT/DELETE models + images + visuals), tableau admin /admin/produits, formulaire création/édition avec infos + photos multi-angles + mode classique. tsc --noEmit clean, 16 files +2512 lines in git diff."
  - id: R015
    from_status: validated
    to_status: validated
    proof: "M004 extended R015 coverage — photos produits max 5MB (S03 ImageUpload maxSizeMB={5}), rendus classiques max 5MB (S04 ImageUpload maxSizeMB={5}). Already validated in M003, now covers all upload types."
provides:
  - Complete admin CRUD for models (canapés) — list, create, edit, delete
  - Multi-angle photo management — upload, view labeling, sort_order reorder, delete
  - Mode Classique — upload rendered visuals with fabric + angle selection, bypassing AI
  - Admin visuals CRUD API for generated_visuals table
  - Shared extractStoragePath utility in src/lib/utils.ts
  - Public API GET /api/models with model_images already served active models with images (pre-existing from M001)
affects:
  - M005 (IA generation will insert into the same generated_visuals table with different is_validated/is_published states)
  - M006 (Export ZIP will read from generated_visuals table populated by mode classique and future IA)
---

# M004: CRUD Produits — Milestone Summary

**Complete admin product management: CRUD API for models + images + visuals, list page with toggle/delete, creation/edit form with info fields + multi-angle photo management + mode classique (upload rendered visuals without AI).**

## Outcome

All 4 slices delivered, all success criteria met. The admin can now fully manage the product catalog — create models with 7 info fields, upload multi-angle photos with view labeling and reorder, and upload rendered visuals via mode classique (choosing a fabric + angle → insert into generated_visuals with is_validated=true, is_published=true). The list page at `/admin/produits` provides a table with toggle active/inactive, delete with confirmation, and navigation to create/edit forms.

**Code impact:** 16 files changed, +2,512 lines (net). `tsc --noEmit` passes with zero errors.

## Success Criteria Verification

| # | Criterion | Met? | Evidence |
|---|-----------|------|----------|
| 1 | L'admin peut créer un canapé (nom, slug, description, prix, dimensions, lien Shopify) | ✅ | ModelForm.tsx with 7 fields + Zod validation, POST /api/admin/models, /admin/produits/new page |
| 2 | Upload multi-angles avec choix de vue et réordonnement | ✅ | Photo section in ModelForm: ImageUpload maxSizeMB={5}, view_type input, sort_order swap reorder via PUT, delete via DELETE |
| 3 | Mode classique : upload photo finale + choix angle + choix tissu → rendu publié | ✅ | S04 "Mode Classique — Rendus" section: fabric/angle selects, 5MB upload → POST /api/admin/models/[id]/visuals → generated_visuals with is_validated=true, is_published=true |
| 4 | Tableau /admin/produits avec toggle actif/inactif | ✅ | ModelList.tsx: 5-column table (Nom, Prix, Photos, Actif via ToggleSwitch, Actions), PUT /api/admin/models/:id for toggle |
| 5 | Un canapé désactivé n'apparaît plus via API publique | ✅ | GET /api/models filters with `.eq('is_active', true)` + RLS policies (validated in M001) |
| 6 | Le canapé créé apparaît dans GET /api/models avec ses images | ✅ | GET /api/models returns `*, model_images(*)` for active models, sorted by created_at desc, images sorted by sort_order |

## Slice Recap

| Slice | Title | Duration | Result |
|-------|-------|----------|--------|
| S01 | API Admin Produits + Images | 18m | ✅ passed |
| S02 | Page Liste Produits | 15m | ✅ passed |
| S03 | Formulaire Produit + Photos Multi-Angles | 25m | ✅ passed |
| S04 | Mode Classique (upload rendus sans IA) | 14m | ✅ passed |

## Architecture Delivered

### API Routes (6 new files)
- `POST/GET /api/admin/models` — list all + create with Zod validation, slug auto-gen
- `GET/PUT/DELETE /api/admin/models/[id]` — single model CRUD with cascade storage cleanup
- `GET/POST /api/admin/models/[id]/images` — image list + upload (5MB, model-photos bucket)
- `PUT/DELETE /api/admin/models/[id]/images/[imageId]` — image metadata update + delete
- `GET/POST /api/admin/models/[id]/visuals` — visuals list + mode classique upload (generated-visuals bucket)
- `DELETE /api/admin/models/[id]/visuals/[visualId]` — visual delete with storage cleanup

### Admin UI (5 new files)
- `/admin/produits` — server page + ModelList client component (table, toggle, delete)
- `/admin/produits/new` — server page rendering ModelForm for creation
- `/admin/produits/[id]/edit` — server page fetching model with images, rendering ModelForm for editing
- `ModelForm.tsx` (721 lines) — info section (7 fields, auto-slug, zod) + photo section (upload, grid, reorder, delete) + mode classique section (fabric/angle selects, upload, visuals grid)
- `form.module.css` (522 lines) + `page.module.css` (150 lines)

### Shared Utilities
- `src/lib/utils.ts` — `extractStoragePath` extracted from fabrics route, now shared by fabrics + models delete handlers

## Patterns Established

1. **Models CRUD mirrors fabrics CRUD** — identical structure: requireAdmin → parse → validate → Supabase op → error mapping. Any future admin entity can follow this exact template.
2. **Cascade-delete with storage cleanup** — fetch child URLs → best-effort remove from storage buckets → delete parent row (FK cascade handles DB).
3. **Two-step upload** — ImageUpload onChange sets File state, separate action button triggers the actual upload after metadata input (view_type).
4. **Sort_order swap reorder** — adjacent items swap sort_order via Promise.all of two PUTs, then full refresh from server.
5. **Mode classique insert convention** — `is_validated=true, is_published=true` for manually uploaded visuals (no AI validation needed).
6. **Info form (JSON body) + photo management (FormData)** — clean separation within a single form component.

## Decisions Made

| # | Decision | Choice |
|---|----------|--------|
| D017 | Shared extractStoragePath utility location | Extracted to src/lib/utils.ts — shared by fabrics and models |
| D018 | Storage path for generated visuals | `{slug}/{fabric_id}-{model_image_id}.{ext}` in generated-visuals bucket with upsert |

## Known Limitations

- **Photo section edit-only** — admin must create the product first, then add photos on the edit page (needs model ID for API path)
- **No drag-and-drop reorder** — up/down arrows only, per plan
- **Silent toggle/delete failures** — consistent with tissus list behavior, no toast UI
- **No pagination** — all models fetched at once (acceptable for <100 models)
- **Slug rename orphans storage files** — old bucket paths remain valid via absolute URLs but are orphaned (K009)
- **No runtime integration tests** — verification is structural (tsc + grep). Full CRUD flow requires a running Supabase instance.

## Requirement Status Changes

| Req | From | To | Proof |
|-----|------|----|-------|
| R007 | active | validated | API CRUD complète + tableau admin + formulaire création/édition + mode classique. 4 slices, 16 files, tsc clean. |
| R015 | validated | validated | Extended coverage: product photos 5MB (S03) + classic mode visuals 5MB (S04). No status change needed — already validated in M003. |

## Forward Intelligence for M005

### What M005 needs to know
- **generated_visuals table** is already populated by mode classique (S04) with `is_validated=true, is_published=true`. M005's IA generation should insert with `is_validated=false, is_published=false` and add a validate/publish workflow.
- **The visuals API** at `/api/admin/models/[id]/visuals` supports GET (list) and DELETE — M005 can extend this or add new routes for AI-specific operations.
- **ModelForm.tsx** has a "Mode Classique" section. M005 should add an "IA Generation" section alongside it, following the same gated-by-edit-mode pattern.
- **refreshVisuals callback** in ModelForm manages the visuals state independently from images. M005 can reuse this pattern.
- **Storage path** for generated visuals: `{slug}/{fabric_id}-{model_image_id}.{ext}` in `generated-visuals` bucket.

### What's fragile
- **Edit page select query** uses `models.select('*, model_images(*)')` — M005 may need to extend this to include generated_visuals for displaying AI results alongside classic ones.
- **refreshVisuals** fetches all visuals for a model — if the count grows large (many fabrics × many angles), this could become slow.

### Authoritative diagnostics
- `npx tsc --noEmit` — catches all type regressions across the full codebase
- Network tab on `/admin/produits/*` — all API calls visible with request/response bodies
- Supabase dashboard: `models`, `model_images`, `generated_visuals` tables + `model-photos`, `generated-visuals` storage buckets
