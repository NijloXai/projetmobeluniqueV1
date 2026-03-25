# S02: Layout Admin & Dashboard

**Goal:** Layout admin complet (header + sidebar + zone contenu), dashboard avec stats, déconnexion.
**Demo:** Le back-office a un layout cohérent, le dashboard affiche les stats, la déconnexion fonctionne.

## Must-Haves
- Layout admin avec header (logo + nom admin + bouton déconnexion) et sidebar (Produits, Tissus)
- Page /admin affiche les stats (nb canapés, nb tissus, nb rendus)
- Déconnexion redirige vers /admin/login
- Navigation sidebar fonctionne

## Tasks

- [x] **T01: Layout admin + composants header/sidebar**
  Créer layout.tsx, AdminHeader, AdminSidebar avec CSS Modules.

- [x] **T02: Dashboard + déconnexion**
  Créer page /admin avec stats depuis Supabase. Action de déconnexion.

## Files Likely Touched
- src/app/admin/layout.tsx (nouveau)
- src/app/admin/page.tsx (nouveau)
- src/components/admin/AdminHeader.tsx (nouveau)
- src/components/admin/AdminHeader.module.css (nouveau)
- src/components/admin/AdminSidebar.tsx (nouveau)
- src/components/admin/AdminSidebar.module.css (nouveau)
- src/app/admin/page.module.css (nouveau)
