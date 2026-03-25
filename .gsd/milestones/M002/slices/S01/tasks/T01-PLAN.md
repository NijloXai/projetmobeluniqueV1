# T01: Middleware + helper Supabase middleware

**Slice:** S01
**Milestone:** M002

## Goal
Protéger toutes les routes /admin/* sauf /admin/login via un middleware Next.js qui vérifie la session Supabase et rafraîchit le token.

## Must-Haves

### Truths
- GET /admin → redirect 302 vers /admin/login (sans session)
- GET /admin/produits → redirect 302 vers /admin/login (sans session)
- GET /admin/login → accessible sans session (pas de redirect)
- GET / → pas intercepté par le middleware
- Après login, la session survit à un refresh navigateur

### Artifacts
- `src/middleware.ts` — middleware Next.js, matcher sur /admin/*, exclut /admin/login
- `src/lib/supabase/middleware.ts` — createServerClient adapté au middleware (request cookies + response cookies)

### Key Links
- `src/middleware.ts` → `src/lib/supabase/middleware.ts` via import de updateSession
- `src/lib/supabase/middleware.ts` → `@supabase/ssr` via createServerClient

## Steps
1. Créer src/lib/supabase/middleware.ts — helper updateSession qui crée un client Supabase dans le contexte middleware, appelle getUser() pour rafraîchir le token, redirige si pas de user
2. Créer src/middleware.ts — exporte la fonction middleware, appelle updateSession, configure le matcher pour /admin/* sauf login et fichiers statiques
3. Vérifier que le middleware compile (tsc --noEmit)

## Context
- Pattern officiel @supabase/ssr : le middleware est le seul endroit fiable pour rafraîchir les tokens
- Le middleware doit manipuler request.cookies ET response.cookies pour que le refresh fonctionne
- /admin/login doit rester accessible sans session
