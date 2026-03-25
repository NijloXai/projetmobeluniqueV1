# M002: Auth Admin — Summary

**Completed:** 2026-03-24

## What Was Built

Authentication admin complète avec layout back-office pour Möbel Unique.

### S01: Auth & Middleware
- `src/proxy.ts` — proxy Next.js 16 (remplace middleware.ts, D016) qui protège /admin/* et rafraîchit les tokens
- `src/lib/supabase/middleware.ts` — helper updateSession pour refresh token côté serveur
- `src/app/admin/login/page.tsx` — page login avec react-hook-form + zod + signInWithPassword
- Route groups: `/admin/login` séparé de `/admin/(protected)/*` (D015) pour éviter boucle redirect
- Compte admin créé via Supabase Auth Admin API (admin@mobelunique.fr)

### S02: Layout Admin & Dashboard
- `src/app/admin/(protected)/layout.tsx` — layout admin avec vérification getUser() + redirect
- `src/components/admin/AdminHeader.tsx` — header (logo MU, email admin, bouton Déconnexion)
- `src/components/admin/AdminSidebar.tsx` — sidebar (Dashboard, Produits, Tissus) avec active state
- `src/app/admin/(protected)/page.tsx` — dashboard avec stats (canapés, tissus, rendus IA) depuis Supabase
- Déconnexion → signOut() + redirect vers /admin/login

## Corruption Recovery
Session précédente a corrompu des fichiers (sparse files, null bytes). Fichiers recréés :
- 3 API routes (models, [slug], visuals) — réécrites via bash heredoc
- CSS modules (AdminHeader, AdminSidebar) — réécrites
- favicon.ico supprimé (corrompu, non essentiel)
- Git repo réinitialisé (objets corrompus)
- Compte admin recréé via Auth Admin API (l'ancien, créé par INSERT SQL, causait "Database error querying schema" car email_change était NULL)

## Key Decisions
- D015: Route groups — /admin/login séparé de /admin/(protected)/*
- D016: proxy.ts au lieu de middleware.ts pour Next.js 16

## Flow Vérifié
Login (email/password) → redirect /admin → Dashboard (header + sidebar + 3 stats cards) → Déconnexion → redirect /admin/login ✓

## Patterns
- Route groups pour séparer login (sans layout admin) du reste (avec layout admin)
- proxy.ts avec matcher pour Next.js 16 (export default async function proxy)
- getUser() dans layout serveur pour vérifier l'auth + récupérer l'email
- signOut() côté client puis router.push + router.refresh pour la déconnexion
