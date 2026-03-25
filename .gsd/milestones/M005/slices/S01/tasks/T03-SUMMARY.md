---
id: T03
parent: S01
milestone: M005
provides:
  - POST /api/admin/generate — génère un visuel IA pour un (modèle, angle, tissu)
  - POST /api/admin/generate-all — génère tous les angles pour un modèle + tissu
  - PUT /api/admin/visuals/[id]/validate — valide un visuel
  - PUT /api/admin/visuals/[id]/publish — publie un visuel (doit être validé)
  - PUT /api/admin/visuals/bulk-validate — validation en lot
  - PUT /api/admin/visuals/bulk-publish — publication en lot (seuls les validés)
key_files:
  - src/app/api/admin/generate/route.ts
  - src/app/api/admin/generate-all/route.ts
  - src/app/api/admin/visuals/[id]/validate/route.ts
  - src/app/api/admin/visuals/[id]/publish/route.ts
  - src/app/api/admin/visuals/bulk-validate/route.ts
  - src/app/api/admin/visuals/bulk-publish/route.ts
key_decisions:
  - Upsert dans generate : supprime l'ancien visuel (DB + storage) avant de recréer
  - generate-all continue si un angle échoue — les autres angles sont quand même générés
  - Publish vérifie is_validated avant publication (403 sinon)
  - bulk-publish filtre avec eq('is_validated', true) — ignore silencieusement les non-validés
patterns_established:
  - Toutes les routes suivent requireAdmin → validation body → Supabase → error mapping
  - Logs préfixés [POST /api/admin/generate] avec durée et taille pour tracking perf
observability_surfaces:
  - "[POST /api/admin/generate] Généré en Xms, Y octets — modèle / tissu / angle"
  - "[POST /api/admin/generate-all] X/Y visuels générés en Xms"
  - "[PUT /api/admin/visuals/bulk-validate] X/Y visuels validés"
  - "[PUT /api/admin/visuals/bulk-publish] X/Y visuels publiés"
duration: 5m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T03: Routes API admin generate/validate/publish

**Créé 6 routes API admin pour le workflow IA : generate, generate-all, validate, publish, bulk-validate, bulk-publish — toutes avec requireAdmin et logs préfixés**

## What Happened

6 fichiers route créés :
- **generate** — Génère un visuel via IAService, upload vers generated-visuals, insert avec is_validated=false, is_published=false. Gère l'upsert (supprime l'ancien si existant).
- **generate-all** — Boucle sur tous les model_images, génère chaque angle. Continue si un angle échoue.
- **validate** — Met is_validated=true.
- **publish** — Vérifie is_validated=true (403 sinon), puis met is_published=true.
- **bulk-validate** — Valide un tableau de visual_ids.
- **bulk-publish** — Publie uniquement les visuels déjà validés (filtre SQL).

## Verification

- 6 fichiers existent aux chemins prévus
- Toutes les routes utilisent requireAdmin
- `npx tsc --noEmit` passe sans erreur

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| V01 | `npx tsc --noEmit` | 0 | ✅ pass | 23s |
| V04 | `ls src/app/api/admin/generate/route.ts src/app/api/admin/generate-all/route.ts` | 0 | ✅ pass | 0.1s |
| auth | `grep requireAdmin` sur les 6 routes | 0 | ✅ pass | 0.1s |

## Diagnostics

- Chaque route logue les erreurs avec préfixe `[POST /api/admin/generate]`, `[PUT /api/admin/visuals/:id/publish]`, etc.
- generate logue durée + taille du buffer généré
- generate-all logue le ratio succès/total

## Deviations

Aucune.

## Known Issues

Aucun.

## Files Created/Modified

- `src/app/api/admin/generate/route.ts` — Génération unitaire avec upsert
- `src/app/api/admin/generate-all/route.ts` — Génération tous angles
- `src/app/api/admin/visuals/[id]/validate/route.ts` — Validation unitaire
- `src/app/api/admin/visuals/[id]/publish/route.ts` — Publication avec vérification validation
- `src/app/api/admin/visuals/bulk-validate/route.ts` — Validation en lot
- `src/app/api/admin/visuals/bulk-publish/route.ts` — Publication en lot (validés uniquement)
