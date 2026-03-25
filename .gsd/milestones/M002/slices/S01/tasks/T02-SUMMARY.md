---
id: T02
parent: S01
milestone: M002
provides:
  - Page login /admin/login avec formulaire email/password
  - Validation zod + react-hook-form
  - Gestion erreurs en français
  - Style CSS Module design tokens Möbel Unique
requires:
  - slice: M001
    provides: Client Supabase navigateur, design tokens
affects: [S02]
key_files:
  - src/app/admin/(auth)/login/page.tsx
  - src/app/admin/(auth)/login/page.module.css
key_decisions:
  - "D015: Route group (auth) séparé de (dashboard) pour éviter la boucle de redirect"
patterns_established:
  - "Formulaire react-hook-form + zod + Supabase Auth signInWithPassword"
  - "Route groups pour séparer auth de l'admin layout"
drill_down_paths:
  - .gsd/milestones/M002/slices/S01/tasks/T02-PLAN.md
duration: 10min
verification_result: pass
completed_at: 2026-03-23T22:10:00Z
---

# T02: Page login

**Page /admin/login avec formulaire email/password, validation zod, signInWithPassword, messages français**

## What Happened

Créé la page login dans un route group (auth) séparé du layout admin. Formulaire avec react-hook-form + zod resolver. Appel Supabase Auth signInWithPassword, message d'erreur "Email ou mot de passe incorrect". Style avec les design tokens (card centrée, couleur ambre).

## Deviations
La page login a été déplacée dans /admin/(auth)/login/ au lieu de /admin/login/ pour éviter la boucle de redirect avec le layout admin qui vérifie l'auth.

## Files Created/Modified
- `src/app/admin/(auth)/login/page.tsx` — formulaire login client component
- `src/app/admin/(auth)/login/page.module.css` — styles carte centrée, design tokens
