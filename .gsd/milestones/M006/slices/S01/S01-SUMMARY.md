---
id: S01
parent: M006
milestone: M006
provides:
  - GET /api/admin/visuals/export/[modelId] — ZIP download des rendus validés
  - Bouton Exporter ZIP dans ModelForm
requires:
  []
affects:
  []
key_files:
  - src/app/api/admin/visuals/export/[modelId]/route.ts
  - src/app/admin/(protected)/produits/ModelForm.tsx
  - src/app/admin/(protected)/produits/form.module.css
key_decisions:
  - D021: Route export restructurée visuals/export/[modelId] pour éviter collision Next.js
  - Archive en store mode (pas de compression) car JPEG déjà compressés
  - fabric.slug utilisé directement depuis la DB au lieu de slugify(fabric.name)
patterns_established:
  - Streaming ZIP via archiver avec store mode pour images
  - Blob download côté client via createObjectURL + anchor click
observability_surfaces:
  - console.warn pour images non récupérables lors de l'export (skip graceful)
drill_down_paths:
  - .gsd/milestones/M006/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M006/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M006/slices/S01/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-25T03:19:03.239Z
blocker_discovered: false
---

# S01: Export ZIP — API + UI

**L'admin peut télécharger un ZIP structuré de tous les rendus validés d'un canapé via un bouton dans le formulaire produit.**

## What Happened

Slice livrée en 4 tâches : T01 cherry-pick du code M005 et installation d'archiver, T02 création de la route API GET /api/admin/visuals/export/[modelId] avec auth guard + streaming ZIP via archiver (store mode, pas de compression sur JPEG), T03 ajout du bouton Exporter ZIP dans ModelForm avec loader, blob download et gestion d'erreur, T04 vérification E2E qui a révélé et corrigé un bug de collision de segments dynamiques Next.js (D021). Le ZIP contient les fichiers nommés {model.slug}-{fabric.slug}-{view_type}.jpg. L'API renvoie 401 sans auth et 404 avec message français si aucun rendu validé.

## Verification

tsc --noEmit 0 erreurs, curl 401 sans auth, route restructurée visuals/export/[modelId] sans collision, bouton UI avec loader et blob download confirmés par grep, 9 classes CSS export, nommage fichiers {slug}-{fabric.slug}-{view_type}.jpg.

## Requirements Advanced

- R009 — API route GET /api/admin/visuals/export/[modelId] génère un ZIP avec nommage {slug}-{fabric}-{angle}.jpg, auth guard, message français si vide. Bouton UI avec loader.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Route restructurée de visuals/[modelId]/export/ à visuals/export/[modelId]/ pour éviter la collision de segments dynamiques Next.js (D021).

## Known Limitations

Export avec données réelles non testé — pas de credentials admin dans le worktree. À tester manuellement au déploiement.

## Follow-ups

None.

## Files Created/Modified

- `src/app/api/admin/visuals/export/[modelId]/route.ts` — API route export ZIP — auth, query validated visuals, archiver stream, file naming
- `src/app/admin/(protected)/produits/ModelForm.tsx` — Bouton Exporter ZIP avec loader, blob download, gestion erreur
- `src/app/admin/(protected)/produits/form.module.css` — 9 classes CSS pour la section export
- `package.json` — archiver + @types/archiver ajoutés
