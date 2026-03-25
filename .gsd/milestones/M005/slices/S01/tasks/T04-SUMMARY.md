---
id: T04
parent: S01
milestone: M005
provides:
  - Composant IAGenerationSection avec sélection tissu, matrice d'angles, génération/validation/publication
  - Actions bulk (Générer tout, Valider tout, Publier tout)
  - Badges de statut (Généré/Validé/Publié) avec code couleur
  - Intégration dans ModelForm.tsx comme Section 3
  - 39 classes CSS .ia* dans form.module.css
key_files:
  - src/app/admin/(protected)/produits/IAGenerationSection.tsx
  - src/app/admin/(protected)/produits/ModelForm.tsx
  - src/app/admin/(protected)/produits/form.module.css
key_decisions:
  - State locale au composant (selectedFabricId, generatingIds, bulkAction) — pas de store global
  - Map visualByImageId pour lookup O(1) par angle
  - Bulk actions désactivent tous les boutons individuels pendant l'opération
patterns_established:
  - Section extraite dans composant dédié, intégrée via props dans ModelForm
  - Badges statut avec couleurs sémantiques (orange=généré, vert=validé, bleu=publié)
observability_surfaces:
  - Erreurs affichées dans la section IA via état error
  - Résumé statistiques en bas de la matrice (X générés · Y validés · Z publiés)
  - Onglet réseau sur /admin/produits/[id]/edit — tous les appels API visibles
duration: 8m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T04: Composant IAGenerationSection + intégration ModelForm

**Créé IAGenerationSection avec sélection tissu, matrice d'angles, badges statut, actions unitaires et bulk, intégré dans ModelForm section 3**

## What Happened

Composant `IAGenerationSection.tsx` créé avec :
- Sélecteur de tissu (dropdown avec catégorie)
- Matrice d'angles : une carte par model_image avec thumbnail, badge statut, boutons d'action
- Badges : Généré (orange), Validé (vert), Publié (bleu)
- Actions unitaires : Générer, Régénérer, Valider, Publier par carte
- Actions bulk : Générer tout, Valider tout, Publier tout avec compteurs
- États de chargement : spinner par carte pendant génération, boutons désactivés pendant bulk
- Gestion d'erreur : affichage d'erreur dans la section, auto-nettoyage au changement de tissu

Intégré dans ModelForm.tsx après la section Mode Classique, visible en mode édition quand des photos existent.

39 classes CSS `.ia*` ajoutées dans form.module.css, suivant le pattern existant des classes `.classique*`.

## Verification

- `IAGenerationSection.tsx` existe
- Importé dans ModelForm.tsx
- 39 classes CSS .ia dans form.module.css
- `npx tsc --noEmit` passe sans erreur

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| V01 | `npx tsc --noEmit` | 0 | ✅ pass | 12s |
| struct | `test -f IAGenerationSection.tsx` | 0 | ✅ pass | 0.1s |
| struct | `grep IAGenerationSection ModelForm.tsx` | 0 | ✅ pass | 0.1s |
| struct | `grep -c '\.ia' form.module.css` → 39 | 0 | ✅ pass | 0.1s |

## Diagnostics

- Erreurs de l'API surfacées dans l'UI via l'état `error`
- Stats en bas de matrice : "X générés · Y validés · Z publiés"
- Onglet réseau du navigateur sur `/admin/produits/[id]/edit` montre tous les appels

## Deviations

Aucune.

## Known Issues

Aucun.

## Files Created/Modified

- `src/app/admin/(protected)/produits/IAGenerationSection.tsx` — Composant section IA complet
- `src/app/admin/(protected)/produits/ModelForm.tsx` — Import + intégration de IAGenerationSection
- `src/app/admin/(protected)/produits/form.module.css` — 39 classes .ia* ajoutées
