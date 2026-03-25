# T02: Page login

**Slice:** S01
**Milestone:** M002

## Goal
Page /admin/login avec formulaire email/password, validation zod, appel Supabase Auth, gestion erreurs en français, style CSS Module.

## Must-Haves

### Truths
- La page /admin/login affiche un formulaire email + password
- Identifiants corrects → redirect vers /admin
- Identifiants incorrects → message "Email ou mot de passe incorrect"
- Champs vides → messages de validation en français
- Le formulaire est stylé avec les design tokens Möbel Unique

### Artifacts
- `src/app/admin/login/page.tsx` — page login (client component, react-hook-form + zod)
- `src/app/admin/login/page.module.css` — styles CSS Module

### Key Links
- `src/app/admin/login/page.tsx` → `src/lib/supabase/client.ts` via import createClient
- `src/app/admin/login/page.tsx` → `src/lib/schemas.ts` si schema login ajouté, sinon zod inline

## Steps
1. Créer le schema zod de login (email + password)
2. Créer src/app/admin/login/page.tsx — 'use client', formulaire avec react-hook-form, appel supabase.auth.signInWithPassword, gestion erreurs, redirect via router.push('/admin')
3. Créer src/app/admin/login/page.module.css — centré verticalement, carte blanche, design tokens
4. Vérifier le build (tsc --noEmit)

## Context
- C'est un client component ('use client') car il utilise react-hook-form et des handlers
- Pas de création de compte — l'admin est créé manuellement dans Supabase
- Le redirect après login utilise router.push('/admin') puis router.refresh() pour que le middleware détecte la session
