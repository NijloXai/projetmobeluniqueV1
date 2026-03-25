---
id: T01
parent: S02
milestone: M005
provides:
  - POST /api/simulate — route publique retournant un JPEG filigrané
key_files:
  - src/app/api/simulate/route.ts
key_decisions:
  - Buffer converti en Uint8Array pour compatibilité NextResponse
  - Limite 10 Mo pour les photos salon (plus grandes que les photos produit)
  - Cache-Control no-store car résultat éphémère
patterns_established: []
observability_surfaces:
  - "[POST /api/simulate] Erreur: ..." logué en cas d'échec
duration: 3m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Route POST /api/simulate

**Créé la route publique POST /api/simulate retournant un JPEG filigrané sans auth ni ligne en base**

## What Happened

Route `POST /api/simulate` créée :
- Accepte FormData : image (File, max 10 Mo), model_id, fabric_id
- Pas d'auth (route publique) — utilise `createClient` directement au lieu de `requireAdmin`
- Récupère nom du modèle et tissu en base pour le prompt
- Génère le visuel via `iaService.generate()`
- Ajoute le filigrane via `iaService.addWatermark()`
- Retourne le JPEG binaire avec `Content-Type: image/jpeg` et `Cache-Control: no-store`
- Aucune ligne créée dans generated_visuals

## Verification

- Fichier route existe
- Pas de requireAdmin (route publique)
- Content-Type image/jpeg dans la réponse
- `tsc --noEmit` passe

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| V01 | `npx tsc --noEmit` | 0 | ✅ pass | 12s |
| struct | Route existe | 0 | ✅ pass | 0.1s |
| struct | Pas de requireAdmin | 0 | ✅ pass | 0.1s |
| struct | Content-Type image/jpeg | 0 | ✅ pass | 0.1s |

## Diagnostics

- `[POST /api/simulate] Erreur: ...` logué en cas d'échec avec message descriptif

## Deviations

Buffer converti en `new Uint8Array(watermarked)` car NextResponse n'accepte pas un Buffer Node.js directement (erreur TS2345).

## Known Issues

Aucun.

## Files Created/Modified

- `src/app/api/simulate/route.ts` — Route publique simulation avec filigrane
