---
depends_on: [M001, M002, M003, M004]
---

# M005: Génération IA

**Gathered:** 2026-03-23
**Status:** Ready for planning

## Project Description

Intégration du service de génération d'images IA (Nano Banana 2 / Gemini). Deux contextes : back-office (rendus pré-générés, stockés, validés, publiés) et simulation client "chez moi" (temps réel, éphémère, watermark). Mock en attendant la clé API. Système de prompts configurable.

## Why This Milestone

La génération IA est le cœur de la valeur produit. Ce milestone livre la section 3 du formulaire produit (génération/validation/publication des rendus) et l'API publique de simulation salon. L'architecture mock permet de tout câbler sans attendre la clé API.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Dans /admin/produits/[id], sélectionner un tissu et voir le tableau des rendus par angle
- Générer un rendu IA par angle ou "Générer tout" pour tous les angles
- Voir le résultat (image placeholder en mock)
- Valider / Régénérer un rendu
- Publier un rendu validé (le rend visible côté client)
- Boutons bulk : Valider tout, Publier tout
- POST /api/simulate accepte une image + identifiants et retourne un résultat avec watermark

### Entry point / environment

- Entry point: http://localhost:3000/admin/produits/[id] (section 3) et POST /api/simulate
- Environment: local dev, authentifié pour admin, public pour simulate
- Live dependencies involved: Supabase (DB + Storage), Nano Banana 2 (mockable)

## Completion Class

- Contract complete means: flow generate → validate → publish fonctionne en mock, API simulate retourne un résultat
- Integration complete means: images stockées dans generated-visuals bucket, generated_visuals table peuplée
- Operational complete means: none (intégration réelle Nano Banana quand clé dispo)

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- L'admin sélectionne un tissu, clique "Générer tout", voit les rendus apparaître (mock)
- L'admin valide un rendu puis le publie
- Le rendu publié apparaît dans GET /api/models/[slug]/visuals
- La régénération écrase le rendu précédent (UNIQUE constraint respectée)
- POST /api/simulate retourne une image avec watermark texte
- Le service IA est switchable mock/réel via NANO_BANANA_API_KEY env var

## Risks and Unknowns

- Nano Banana 2 API — pas de clé, pas d'expérience avec le service. On mock tout.
- Qualité des prompts — dépend du prompt engineering. Architecture configurable préparée.
- Simulation F3 temps réel — latence IA potentielle. À optimiser quand le vrai service sera branché.

## Existing Codebase / Prior Art

- `src/types/database.ts` — types GeneratedVisual, GeneratedVisualInsert déjà générés
- `src/lib/schemas.ts` — generatedVisualSchema déjà défini
- Table `generated_visuals` avec UNIQUE(model_image_id, fabric_id)
- Bucket `generated-visuals` (public) déjà créé
- Composants admin de M003/M004 réutilisables
- Section 1 et 2 du formulaire produit (M004) — section 3 s'y greffe

> See `.gsd/DECISIONS.md` — D005 (mock IA), D012 (mode classique), D014 (prompts configurables).

## Relevant Requirements

- R008 — Génération IA rendus
- R011 — API Simulation F3
- R016 — Système de prompts IA configurable

## Scope

### In Scope

- Service IA abstrait (interface TypeScript + mock + implémentation Nano Banana prête)
- Config switch mock/réel via env var
- Système de prompts configurable (templates, pas hardcodé)
- API POST /api/admin/generate (un rendu)
- API POST /api/admin/generate-all (tous les angles)
- API PUT /api/admin/visuals/[id]/validate
- API PUT /api/admin/visuals/[id]/publish
- Actions bulk (valider tout, publier tout)
- Section 3 de /admin/produits/[id] (UI génération)
- API POST /api/simulate (publique, éphémère, watermark texte)

### Out of Scope / Non-Goals

- Intégration réelle Nano Banana 2 (pas de clé API)
- Prompt engineering avancé (sera fait quand le service réel sera branché)
- Watermark logo (texte simple pour l'instant)
- Optimisation latence IA

## Technical Constraints

- UNIQUE(model_image_id, fabric_id) — régénération = upsert
- Mock doit être réaliste (image placeholder avec overlay du nom tissu + angle)
- Le service IA doit avoir une interface claire pour brancher Nano Banana plus tard
- L'API /api/simulate est publique (pas d'auth admin)

## Integration Points

- Supabase DB — table generated_visuals
- Supabase Storage — bucket generated-visuals
- Nano Banana 2 / Gemini API (futur)

## Open Questions

- None (on mock et on branchera plus tard)
