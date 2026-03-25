---
id: S02/T01
parent: S02
milestone: M002
provides:
  - Layout admin avec header + sidebar + zone contenu
  - AdminHeader composant avec logo, email, bouton déconnexion
  - AdminSidebar composant avec navigation (Dashboard, Produits, Tissus)
  - Dashboard /admin avec stats (nb canapés, tissus, rendus)
  - Déconnexion fonctionnelle
requires:
  - slice: S01
    provides: Proxy auth, page login, route groups
affects: [M003, M004]
key_files:
  - src/app/admin/(dashboard)/layout.tsx
  - src/app/admin/(dashboard)/page.tsx
  - src/components/admin/AdminHeader.tsx
  - src/components/admin/AdminSidebar.tsx
key_decisions:
  - "Layout admin dans route group (dashboard) — séparé de (auth)"
patterns_established:
  - "Composants admin avec CSS Modules dans src/components/admin/"
  - "Stats dashboard via count queries Supabase en parallèle"
  - "Active state sidebar via usePathname()"
drill_down_paths:
  - .gsd/milestones/M002/slices/S02/S02-PLAN.md
duration: 15min
verification_result: pass
completed_at: 2026-03-23T22:20:00Z
---

# S02: Layout Admin & Dashboard

**Layout admin complet (header + sidebar) + dashboard stats + déconnexion**

## What Happened

Créé le layout admin dans le route group (dashboard) avec AdminHeader (logo MU, email admin, bouton déconnexion) et AdminSidebar (Dashboard, Produits, Tissus avec active state). Dashboard affiche les stats du catalogue (nb canapés, tissus, rendus) via des count queries en parallèle. Déconnexion via supabase.auth.signOut() côté client.

## Deviations
None.

## Files Created/Modified
- `src/app/admin/(dashboard)/layout.tsx` — vérifie auth, rend header + sidebar + children
- `src/app/admin/(dashboard)/layout.module.css` — flexbox layout
- `src/app/admin/(dashboard)/page.tsx` — dashboard stats server component
- `src/app/admin/(dashboard)/page.module.css` — grid stats cards
- `src/components/admin/AdminHeader.tsx` — header client component
- `src/components/admin/AdminHeader.module.css`
- `src/components/admin/AdminSidebar.tsx` — sidebar client component
- `src/components/admin/AdminSidebar.module.css`
