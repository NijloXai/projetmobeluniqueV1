---
id: T01
parent: S01
milestone: M002
provides:
  - Proxy Next.js 16 protégeant /admin/*
  - Helper Supabase middleware avec refresh token
  - Redirect vers /admin/login si non authentifié
requires:
  - slice: M001
    provides: Client Supabase serveur (src/lib/supabase/server.ts)
affects: [S02]
key_files:
  - src/proxy.ts
  - src/lib/supabase/middleware.ts
key_decisions:
  - "D016: proxy.ts au lieu de middleware.ts — Next.js 16 a renommé la convention"
patterns_established:
  - "Proxy pattern avec @supabase/ssr pour refresh token"
drill_down_paths:
  - .gsd/milestones/M002/slices/S01/tasks/T01-PLAN.md
duration: 10min
verification_result: pass
completed_at: 2026-03-23T22:00:00Z
---

# T01: Proxy + helper Supabase middleware

**Proxy Next.js 16 avec @supabase/ssr : vérifie la session, rafraîchit le token, redirige vers /admin/login**

## What Happened

Créé src/proxy.ts (anciennement middleware.ts — renommé pour Next.js 16) et src/lib/supabase/middleware.ts. Le helper updateSession crée un client Supabase dans le contexte proxy, appelle getUser() pour rafraîchir le token, et redirige si pas d'utilisateur. Découverte en cours de route que Next.js 16 a déprécié middleware.ts en faveur de proxy.ts.

## Deviations
Fichier renommé middleware.ts → proxy.ts et fonction middleware() → proxy() suite à la migration Next.js 16.

## Files Created/Modified
- `src/proxy.ts` — proxy Next.js, matcher pour toutes les routes sauf statiques
- `src/lib/supabase/middleware.ts` — helper updateSession avec gestion cookies request/response
