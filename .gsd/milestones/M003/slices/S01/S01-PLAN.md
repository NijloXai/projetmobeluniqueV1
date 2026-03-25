# S01: API Admin Tissus

**Goal:** Routes CRUD admin pour les tissus avec validation Zod, upload images vers Storage, et auth vérifiée.
**Demo:** curl POST/PUT/DELETE fonctionnent, images uploadées dans les bons buckets.

## Tasks

- [ ] **T01: Routes GET/POST /api/admin/fabrics + GET catégories** `est:30min`
  GET liste tous les tissus (pas de filtre is_active pour l'admin). POST crée un tissu avec validation Zod. GET /categories retourne les catégories distinctes. Auth vérifiée sur chaque route.

- [ ] **T02: Routes GET/PUT/DELETE /api/admin/fabrics/[id]** `est:30min`
  GET détail d'un tissu. PUT met à jour avec validation Zod partielle. DELETE supprime le tissu + ses images du storage. Auth vérifiée.

- [ ] **T03: Upload images (swatch + photo ref)** `est:20min`
  Intégrer l'upload dans POST et PUT. Swatch → bucket fabric-swatches (max 2MB). Photo ref → bucket fabric-references (max 5MB). Retourner les URLs publiques/signées.

## Files Likely Touched
- src/app/api/admin/fabrics/route.ts (nouveau)
- src/app/api/admin/fabrics/[id]/route.ts (nouveau)
- src/app/api/admin/fabrics/categories/route.ts (nouveau)
- src/lib/supabase/admin.ts (nouveau — helper vérification auth admin)
