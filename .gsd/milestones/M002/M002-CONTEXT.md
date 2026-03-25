---
depends_on: [M001]
---

# M002: Auth Admin

**Gathered:** 2026-03-23
**Status:** Ready for planning

## Project Description

Authentification admin pour le back-office Möbel Unique. Login email/password, protection des routes /admin/*, layout admin avec navigation.

## Why This Milestone

Sans auth, le back-office est ouvert à tout le monde. C'est le verrou de sécurité avant de construire les CRUD (M003, M004). Le layout admin pose aussi la structure de navigation pour toutes les pages admin suivantes.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Se connecter avec email/password sur /admin/login
- Être redirigé vers /admin/login si il accède à /admin/* sans être connecté
- Voir le layout admin (header avec logo + déconnexion, sidebar avec Produits et Tissus)
- Se déconnecter via le bouton dans le header
- Voir une page dashboard /admin avec des stats basiques (nb canapés, nb tissus, nb rendus)

### Entry point / environment

- Entry point: http://localhost:3000/admin/login
- Environment: local dev (navigateur)
- Live dependencies involved: Supabase Auth

## Completion Class

- Contract complete means: middleware bloque les requêtes non authentifiées, login/logout fonctionnent
- Integration complete means: Supabase Auth email/password fonctionne avec un vrai compte admin
- Operational complete means: none pour l'instant

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Un utilisateur non connecté qui accède à /admin/produits est redirigé vers /admin/login
- Un admin peut se connecter, voir le dashboard, naviguer via la sidebar, et se déconnecter
- Après déconnexion, l'accès à /admin/* redirige à nouveau vers login

## Risks and Unknowns

- Aucun risque majeur — Supabase Auth email/password est bien documenté
- Le refresh token doit être géré proprement dans le middleware

## Existing Codebase / Prior Art

- `src/lib/supabase/server.ts` — Server Supabase client déjà configuré avec cookie handling
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/app/globals.css` — Design tokens déjà en place
- `src/app/layout.tsx` — Root layout avec Montserrat

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions.

## Relevant Requirements

- R005 — Auth admin (login, middleware, logout)
- R012 — Layout admin (sidebar, header, dashboard)

## Scope

### In Scope

- Page /admin/login (formulaire email/password)
- Middleware Next.js protégeant /admin/*
- Refresh token dans le middleware
- Layout admin (header + sidebar + zone contenu)
- Page /admin (dashboard avec stats)
- Déconnexion dans le header
- Style CSS Modules + design tokens

### Out of Scope / Non-Goals

- Création de compte dans l'UI (admin créé manuellement dans Supabase)
- OAuth / login social
- Gestion multi-utilisateurs
- Rôles / permissions (un seul admin)

## Technical Constraints

- @supabase/ssr pour la gestion des sessions (déjà installé)
- Middleware Next.js App Router (middleware.ts à la racine de src/)
- Radix UI + CSS Modules pour les composants UI
- Messages d'erreur en français

## Integration Points

- Supabase Auth — email/password sign in
- Supabase cookies — session management via @supabase/ssr

## Open Questions

- None
