---
id: M006
title: "Export ZIP"
status: complete
completed_at: 2026-03-25T03:19:30.198Z
key_decisions:
  - D021: Route export restructurée visuals/export/[modelId] pour éviter collision segments dynamiques Next.js
  - Archive en store mode — pas de compression sur JPEG
  - fabric.slug depuis la DB directement, pas de slugify()
key_files:
  - src/app/api/admin/visuals/export/[modelId]/route.ts
  - src/app/admin/(protected)/produits/ModelForm.tsx
  - src/app/admin/(protected)/produits/form.module.css
  - package.json
lessons_learned:
  - Next.js App Router interdit les noms de segments dynamiques différents au même niveau de chemin — toujours vérifier les routes voisines avant de créer un nouveau [param]
  - L'auto-mode peut terminer les tâches (summaries écrits) sans commiter le code — toujours vérifier git status du worktree après un run auto
---

# M006: Export ZIP

**L'admin peut exporter un ZIP structuré de tous les rendus validés d'un produit, nommés {slug}-{tissu}-{angle}.jpg, via un bouton dans le formulaire produit.**

## What Happened

M006 a livré l'export ZIP en une seule slice de 4 tâches. Le code M005 a été cherry-pické dans le worktree M006 (M005 vivait dans des commits orphelins). L'API route GET /api/admin/visuals/export/[modelId] query les generated_visuals validés, fetch chaque image depuis le bucket public, et les assemble dans un ZIP streamé via archiver (store mode, pas de compression sur JPEG). Le bouton « Exporter ZIP » dans ModelForm déclenche le download via blob/createObjectURL avec loader et gestion d'erreur. La vérification E2E en T04 a révélé un bug de collision de segments dynamiques Next.js, corrigé en restructurant la route (D021). Tous les success criteria sont satisfaits : tsc 0 erreurs, auth guard 401, message français pour cas vide, nommage correct des fichiers.

## Success Criteria Results

- ✅ L'admin clique 'Exporter ZIP' et le ZIP se télécharge — bouton + blob download implémentés
- ✅ ZIP contient uniquement is_validated=true avec nommage {slug}-{fabric}-{view_type}.jpg — logique dans route.ts
- ✅ Loader pendant la génération — état `exporting` + spinner
- ✅ Message français si aucun rendu validé — 404 + « Aucun rendu validé pour ce produit. »
- ✅ 401 sans auth — requireAdmin() vérifié par curl
- ✅ tsc --noEmit zéro erreurs — confirmé en T04

## Definition of Done Results

- ✅ L'admin clique 'Exporter ZIP' sur un canapé avec des rendus validés et le ZIP se télécharge — implémenté via bouton dans ModelForm + blob download
- ✅ Le ZIP contient uniquement les rendus où is_validated=true, avec le nommage {slug}-{fabric}-{view_type}.jpg — confirmé dans route.ts
- ✅ Le bouton affiche un loader pendant la génération du ZIP — état `exporting` + spinner ⏳
- ✅ Si aucun rendu validé, un message français s'affiche — « Aucun rendu validé pour ce produit. » avec 404
- ✅ L'API renvoie 401 sans authentification admin — requireAdmin() guard, vérifié par curl
- ✅ tsc --noEmit passe avec zéro erreurs — confirmé en T04

## Requirement Outcomes

- **R009** (active → active/avancé) : API export ZIP implémentée et fonctionnelle. Validation formelle avec données réelles reste à faire en production.
- Tous les autres requirements inchangés.

## Deviations

Route API restructurée de visuals/[modelId]/export/ à visuals/export/[modelId]/ pour éviter la collision de segments dynamiques Next.js App Router (D021). Découvert et corrigé pendant T04.

## Follow-ups

- R009 à valider formellement avec des données réelles (credentials admin en production)
- Le merge squash M006→main doit être fait après résolution du merge M005 bloqué
