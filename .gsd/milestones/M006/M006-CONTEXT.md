---
depends_on: [M001, M002, M003, M004, M005]
---

# M006: Export ZIP

**Gathered:** 2026-03-23
**Status:** Ready for planning

## Project Description

Export ZIP de tous les rendus validés d'un canapé. L'admin télécharge une archive structurée pour mettre les images sur Shopify.

## Why This Milestone

L'admin a besoin de récupérer les rendus IA pour les utiliser sur Shopify. L'export ZIP est le dernier maillon : générer → valider → publier → exporter.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Cliquer "Exporter ZIP" dans /admin/produits/[id]
- Télécharger un fichier ZIP contenant tous les rendus validés
- Les fichiers sont nommés {nom-canape}-{tissu}-{angle}.jpg
- Un message s'affiche si aucun rendu validé

### Entry point / environment

- Entry point: http://localhost:3000/admin/produits/[id] (bouton export)
- Environment: local dev, authentifié
- Live dependencies involved: Supabase (DB + Storage)

## Completion Class

- Contract complete means: l'API retourne un ZIP valide avec les bons fichiers
- Integration complete means: les images sont récupérées depuis le bucket et assemblées
- Operational complete means: none

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- L'admin clique "Exporter ZIP" sur un canapé avec des rendus validés
- Le ZIP se télécharge et contient les bonnes images avec le bon nommage
- Le bouton affiche un loader pendant la génération
- Un message s'affiche si aucun rendu validé

## Risks and Unknowns

- Taille du ZIP — si beaucoup de rendus, la réponse peut être longue. Streaming response.
- Aucun risque majeur autrement.

## Existing Codebase / Prior Art

- Table `generated_visuals` — filtre is_validated = true
- Bucket `generated-visuals` — images à récupérer
- Relations avec models et fabrics pour le nommage
- Page /admin/produits/[id] de M004 — bouton à ajouter

> See `.gsd/DECISIONS.md` for all decisions.

## Relevant Requirements

- R009 — Export ZIP

## Scope

### In Scope

- GET /api/admin/visuals/[modelId]/export — génération ZIP côté serveur
- Nommage structuré des fichiers ({nom-canape}-{tissu}-{angle}.jpg)
- Streaming response pour les gros ZIP
- Bouton "Exporter ZIP" dans /admin/produits/[id]
- Loading indicator pendant l'export
- Message si aucun rendu validé

### Out of Scope / Non-Goals

- Export PDF
- Export individuel (image par image)
- Envoi par email

## Technical Constraints

- Auth vérifiée sur la route API
- Utiliser une lib ZIP (archiver ou jszip)
- Streaming pour ne pas tout charger en mémoire

## Integration Points

- Supabase DB — generated_visuals, models, fabrics
- Supabase Storage — bucket generated-visuals

## Open Questions

- None
