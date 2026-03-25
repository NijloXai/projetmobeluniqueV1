# M003: CRUD Tissus — Summary

**Completed:** 2026-03-24

## What Was Built

CRUD complet des tissus côté admin avec 3 slices.

### S01: API Admin Tissus
- `src/lib/supabase/admin.ts` — helper `requireAdmin()` réutilisable (vérifie auth, retourne client + user ou 401)
- `src/app/api/admin/fabrics/route.ts` — GET (liste admin sans filtre) + POST (création avec FormData/JSON, upload images)
- `src/app/api/admin/fabrics/[id]/route.ts` — GET (détail) + PUT (update partiel) + DELETE (suppression + nettoyage storage)
- `src/app/api/admin/fabrics/categories/route.ts` — GET catégories distinctes (pour combobox)
- Validation Zod, gestion doublons slug (409), upload swatch (2MB) + photo ref (5MB), messages français

### S02: Page Liste + Toggle
- `src/app/admin/(protected)/tissus/page.tsx` + `FabricList.tsx` — tableau admin avec swatch, nom/slug, catégorie, badge Premium/Standard, toggle actif/inactif, boutons Modifier/Supprimer
- `src/components/admin/ToggleSwitch.tsx` — composant toggle accessible (role=switch, aria-checked)
- `src/components/admin/ConfirmDialog.tsx` — dialog natif <dialog> avec backdrop, destructive mode
- Empty state quand aucun tissu

### S03: Formulaire Création/Édition
- `FabricForm.tsx` — formulaire partagé création/édition avec react-hook-form + zod
- Slug auto-généré depuis le nom (K003), bascule en mode manuel si l'admin édite le slug
- Combobox catégorie via `<datalist>` (catégories existantes + saisie libre, K001)
- `src/components/admin/ImageUpload.tsx` — upload avec preview, validation taille, suppression
- Pages `/admin/tissus/new` et `/admin/tissus/[id]/edit`

## Composants Réutilisables Créés
- `ToggleSwitch` — toggle on/off accessible
- `ConfirmDialog` — dialog de confirmation avec <dialog> natif
- `ImageUpload` — upload image avec preview et validation taille
- `requireAdmin()` — helper auth admin pour les routes API

## Flow Vérifié
Création tissu (nom + slug auto + catégorie) → apparaît dans le tableau → édition (nom modifié + slug mis à jour) → toggle actif/inactif → suppression avec confirmation dialog ✓

## Requirements Covered
- R006: CRUD Tissus ✓
- R013: Catégories tissus libres (combobox datalist) ✓
- R014: Slugs auto-générés + éditables ✓
- R015: Upload images avec preview + validation (partiel — swatch OK, ref OK, preview OK)
