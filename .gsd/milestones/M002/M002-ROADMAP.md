# M002: Auth Admin

**Vision:** Authentification admin sécurisée et layout back-office pour Möbel Unique. L'admin peut se connecter, naviguer dans le back-office, et se déconnecter. Les routes /admin/* sont protégées par middleware.

## Success Criteria

- Un utilisateur non connecté est redirigé vers /admin/login sur tout accès à /admin/*
- L'admin peut se connecter avec email/password via Supabase Auth
- L'admin voit un layout cohérent : header (logo, déconnexion), sidebar (Produits, Tissus)
- Le dashboard /admin affiche les stats du catalogue (nb canapés, tissus, rendus)
- La déconnexion fonctionne et redirige vers /admin/login

## Key Risks / Unknowns

- Refresh token — le middleware doit rafraîchir la session sans perdre l'utilisateur
- Next.js 16 middleware — vérifier la compatibilité avec @supabase/ssr

## Proof Strategy

- Refresh token → retire in S01 by proving que la session persiste après refresh navigateur
- Next.js 16 compat → retire in S01 by proving que le middleware intercepte correctement les requêtes

## Verification Classes

- Contract verification: middleware bloque les requêtes anon, login/logout fonctionnent
- Integration verification: Supabase Auth email/password avec un vrai compte admin
- Operational verification: none
- UAT / human verification: flow complet login → dashboard → navigation → logout → redirect

## Milestone Definition of Done

This milestone is complete only when all are true:

- S01 et S02 sont terminés
- Le middleware protège effectivement /admin/* (vérifié par accès direct)
- Login/logout fonctionnent avec un vrai compte Supabase Auth
- Le layout admin est visible et la navigation fonctionne
- Le dashboard affiche des données réelles depuis Supabase

## Requirement Coverage

- Covers: R005, R012
- Partially covers: none
- Leaves for later: R006, R007, R008, R009, R010, R011, R013-R016
- Orphan risks: none

## Slices

- [x] **S01: Auth & Middleware** `risk:medium` `depends:[]`
  > After this: un utilisateur non connecté est redirigé vers /admin/login. Un admin peut se connecter avec email/password et accéder à /admin.

- [x] **S02: Layout Admin & Dashboard** `risk:low` `depends:[S01]`
  > After this: le back-office a un layout complet (header + sidebar + zone contenu), le dashboard affiche les stats du catalogue, la déconnexion fonctionne depuis le header.

## Boundary Map

### S01 → S02

Produces:
- `src/middleware.ts` — middleware Next.js qui vérifie la session et redirige vers /admin/login
- `src/lib/supabase/middleware.ts` — helper pour créer un client Supabase dans le middleware (refresh token)
- `src/app/admin/login/page.tsx` — page login avec formulaire email/password
- `src/lib/supabase/server.ts` — (existant, réutilisé) client serveur pour vérifier l'auth

Consumes:
- `src/lib/supabase/server.ts` (M001) — client Supabase serveur
- `src/lib/supabase/client.ts` (M001) — client Supabase navigateur
- `src/app/globals.css` (M001) — design tokens

### S02 → M003

Produces:
- `src/app/admin/layout.tsx` — layout admin avec header + sidebar
- `src/app/admin/page.tsx` — dashboard avec stats
- `src/components/admin/AdminHeader.tsx` — header avec logo + nom admin + bouton déconnexion
- `src/components/admin/AdminSidebar.tsx` — sidebar navigation (Produits, Tissus)
- Action de déconnexion (server action ou client-side)

Consumes from S01:
- `src/middleware.ts` — protection des routes (session vérifiée)
- `src/lib/supabase/server.ts` — récupérer l'utilisateur connecté pour afficher le nom
