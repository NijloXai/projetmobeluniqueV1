# Phase 7: Fetch donnees + cablage props - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 07-fetch-donnees-cablage-props
**Areas discussed:** Granularite fetch visuels, Contrat de props du modal, Pre-filtrage tissus par modele

---

## Granularite fetch visuels

| Option | Description | Selected |
|--------|-------------|----------|
| Fetch global en bloc | Une seule requete Supabase pour TOUS les visuels publies, puis distribution cote JS par model_id. 3 queries en Promise.all (models + fabrics + visuals) | ✓ |
| Fetch par modele en parallele | Apres avoir fetche les modeles, lancer un Promise.all de N requetes (une par modele). Plus cible mais N+1 queries | |
| Enrichir la requete models | Une seule query Supabase avec select imbriquee — tout en une requete. Utilise le type ModelWithImagesAndVisuals | |

**User's choice:** Fetch global en bloc (Recommande)
**Notes:** 3 queries paralleles dans Promise.all — simple, pas de N+1

---

## Contrat de props du modal

| Option | Description | Selected |
|--------|-------------|----------|
| Props plates | ConfiguratorModal recoit model + fabrics[] + visuals[] separement. Phase 8 filtre et associe cote UI. Simple, explicite | ✓ |
| Props pre-filtrees par modele | CatalogueClient filtre fabrics/visuals pour le modele selectionne AVANT de les passer au modal | |
| Objet enrichi ModelWithImagesAndVisuals | Utiliser le type existant qui imbrique visuals+fabric dans le modele. Moins de props mais structure plus complexe | |

**User's choice:** Props plates (Recommande)
**Notes:** Chaque prop a un role clair, separation des responsabilites

---

## Pre-filtrage tissus par modele

| Option | Description | Selected |
|--------|-------------|----------|
| Passer tout, Phase 8 filtre | Phase 7 passe TOUS les tissus actifs + TOUS les visuels publies. Phase 8 croise fabrics/visuals cote UI | ✓ |
| Pre-filtrer dans CatalogueClient | CatalogueClient filtre les fabrics par modele selectionne avant de les passer au modal | |
| Pre-filtrer dans CatalogueSection | Le Server Component cree une map model_id → fabric_ids et passe cette structure | |

**User's choice:** Passer tout, Phase 8 filtre (Recommande)
**Notes:** Separation claire : Phase 7 = donnees brutes, Phase 8 = logique UI

---

## Claude's Discretion

- Types TypeScript (structure exacte VisualWithFabricAndImage)
- Gestion erreur fetch (degradation gracieuse)
- Source donnees tissus (Supabase direct vs API publique)

## Deferred Ideas

- Extraction getPrimaryImage/formatPrice en utilitaires partages
- API publique GET /api/fabrics
- Cache/revalidate des donnees
