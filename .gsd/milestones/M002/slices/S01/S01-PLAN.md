# S01: Auth & Middleware

**Goal:** Login email/password + middleware qui protège /admin/* + refresh token.
**Demo:** Un utilisateur non connecté est redirigé vers /admin/login. Un admin peut se connecter et accéder à /admin.

## Must-Haves
- Accès à /admin/* sans session → redirect vers /admin/login
- Login email/password fonctionne avec Supabase Auth
- Session persiste après refresh navigateur (refresh token dans middleware)
- Identifiants incorrects → message d'erreur en français

## Tasks

- [ ] **T01: Middleware + helper Supabase middleware**
  Créer src/middleware.ts et src/lib/supabase/middleware.ts. Le middleware intercepte /admin/*, vérifie la session, redirige vers /admin/login si non connecté, rafraîchit le token.

- [ ] **T02: Page login**
  Créer src/app/admin/login/page.tsx. Formulaire email/password avec react-hook-form + zod. Appel Supabase Auth signInWithPassword. Gestion erreurs en français. Style CSS Module + design tokens.

## Files Likely Touched
- src/middleware.ts (nouveau)
- src/lib/supabase/middleware.ts (nouveau)
- src/app/admin/login/page.tsx (nouveau)
- src/app/admin/login/page.module.css (nouveau)
