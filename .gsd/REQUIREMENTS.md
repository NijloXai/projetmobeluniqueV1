# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R009 — GET /api/admin/visuals/[modelId]/export génère un ZIP de tous les rendus validés avec nommage {nom-canape}-{tissu}-{angle}.jpg.
- Class: admin/support
- Status: active
- Description: GET /api/admin/visuals/[modelId]/export génère un ZIP de tous les rendus validés avec nommage {nom-canape}-{tissu}-{angle}.jpg.
- Why it matters: L'admin a besoin de récupérer les rendus pour les mettre sur Shopify.
- Source: user
- Primary owning slice: M006/S01
- Supporting slices: M006/S02
- Validation: unmapped
- Notes: —

### R010 — Visibilité client (is_active + rendu validé+publié), pricing standard/premium (+80€ fixe), liens Shopify bidirectionnels, fallback catalogue. Deux niveaux contrôle tissus (global B3 / par canapé B2).
- Class: primary-user-loop
- Status: active
- Description: Visibilité client (is_active + rendu validé+publié), pricing standard/premium (+80€ fixe), liens Shopify bidirectionnels, fallback catalogue. Deux niveaux contrôle tissus (global B3 / par canapé B2).
- Why it matters: Logique métier transversale à tout le projet.
- Source: user
- Primary owning slice: M001
- Supporting slices: M003, M004, M005
- Validation: partial
- Notes: RLS implémente la visibilité. Pricing et Shopify seront validés dans les milestones suivants.

## Validated

### R001 — Tables models, model_images, fabrics, generated_visuals avec colonnes, FK, index, contrainte UNIQUE(model_image_id, fabric_id).
- Class: core-capability
- Status: validated
- Description: Tables models, model_images, fabrics, generated_visuals avec colonnes, FK, index, contrainte UNIQUE(model_image_id, fabric_id).
- Why it matters: Fondation de toute la donnée du projet.
- Source: user
- Primary owning slice: M001/S02
- Supporting slices: none
- Validation: validated
- Notes: 4 tables créées via MCP Supabase, vérifiées avec list_tables verbose.

### R002 — Policies RLS — lecture publique filtrée (is_active, is_validated+is_published), écriture réservée aux admins authentifiés.
- Class: compliance/security
- Status: validated
- Description: Policies RLS — lecture publique filtrée (is_active, is_validated+is_published), écriture réservée aux admins authentifiés.
- Why it matters: Sécurité des données. Le client anon ne voit que ce qui est publié.
- Source: user
- Primary owning slice: M001/S03
- Supporting slices: none
- Validation: validated
- Notes: 8 policies en place, vérifiées via pg_policies.

### R003 — model-photos (public), fabric-swatches (public), fabric-references (privé), generated-visuals (public).
- Class: core-capability
- Status: validated
- Description: model-photos (public), fabric-swatches (public), fabric-references (privé), generated-visuals (public).
- Why it matters: Stockage des images uploadées et générées.
- Source: user
- Primary owning slice: M001/S04
- Supporting slices: none
- Validation: validated
- Notes: 4 buckets créés avec policies lecture/écriture.

### R004 — GET /api/models, GET /api/models/[slug] avec fallback catalogue, GET /api/models/[slug]/visuals.
- Class: primary-user-loop
- Status: validated
- Description: GET /api/models, GET /api/models/[slug] avec fallback catalogue, GET /api/models/[slug]/visuals.
- Why it matters: Le frontend public consomme ces API.
- Source: user
- Primary owning slice: M001/S05
- Supporting slices: none
- Validation: validated
- Notes: 3 routes fonctionnelles, testées avec curl.

### R005 — Login email/password via Supabase Auth, middleware Next.js protège /admin/*, page login, déconnexion, redirect si non authentifié.
- Class: compliance/security
- Status: validated
- Description: Login email/password via Supabase Auth, middleware Next.js protège /admin/*, page login, déconnexion, redirect si non authentifié.
- Why it matters: Protège le back-office. Pas de création de compte UI — admin créé manuellement dans Supabase.
- Source: user
- Primary owning slice: M002/S01
- Supporting slices: M002/S02
- Validation: Login email/password fonctionne, proxy protège /admin/*, redirect vers login si non auth, déconnexion redirige vers login. Vérifié en navigateur le 2026-03-24.
- Notes: —

### R006 — API POST/PUT/DELETE + pages admin (tableau + formulaire). Upload swatch (max 2MB) + photo ref (max 5MB). Catégorie standard/premium. Validation zod.
- Class: core-capability
- Status: validated
- Description: API POST/PUT/DELETE + pages admin (tableau + formulaire). Upload swatch (max 2MB) + photo ref (max 5MB). Catégorie standard/premium. Validation zod.
- Why it matters: L'admin doit pouvoir gérer son catalogue de tissus en autonomie.
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: M003/S02, M003/S03
- Validation: CRUD complet (GET/POST/PUT/DELETE) + tableau admin + formulaire création/édition + toggle actif/inactif + suppression avec confirmation. Upload swatch et photo ref via FormData. Vérifié en navigateur le 2026-03-24.
- Notes: Désactivation globale masque le tissu de tous les canapés côté client.

### R007 — API POST/PUT/DELETE + pages admin. 3 sections : infos, photos multi-angles (drag&drop), génération IA. Deux modes d'ajout : classique (upload photos finales sans IA) et génération IA.
- Class: core-capability
- Status: validated
- Description: API POST/PUT/DELETE + pages admin. 3 sections : infos, photos multi-angles (drag&drop), génération IA. Deux modes d'ajout : classique (upload photos finales sans IA) et génération IA.
- Why it matters: L'admin doit pouvoir gérer son catalogue de canapés en autonomie.
- Source: user
- Primary owning slice: M004/S01
- Supporting slices: M004/S02, M004/S03, M004/S04
- Validation: API CRUD complète (POST/PUT/DELETE models + images + visuals), tableau admin /admin/produits, formulaire création/édition avec infos + photos multi-angles + mode classique (upload rendus sans IA avec choix tissu + angle → generated_visuals is_validated=true is_published=true). Vérifié structurellement le 2026-03-24 (tsc --noEmit + 10 grep checks).
- Notes: All 4 slices complete: S01 (API), S02 (list page), S03 (form + photos), S04 (mode classique). Seul le mode IA (M005) reste pour la section génération IA du formulaire.

### R008 — Intégration Nano Banana 2. Deux contextes : back-office (pré-généré, stocké, validé, publié) et simulation client F3 (temps réel, éphémère, watermark). Mock en attendant la clé API.
- Class: differentiator
- Status: validated
- Description: Intégration Nano Banana 2. Deux contextes : back-office (pré-généré, stocké, validé, publié) et simulation client F3 (temps réel, éphémère, watermark). Mock en attendant la clé API.
- Why it matters: Cœur de la valeur produit — visualiser un canapé dans un tissu donné.
- Source: user
- Primary owning slice: M005/S01
- Supporting slices: M005/S02, M005/S03, M005/S04
- Validation: M005 S03 verified: MockIAService generates valid JPEG buffers (8/8 checks in verify-ia-mock.ts), all 6 admin routes auth-guarded (401 without auth), factory returns mock when NANO_BANANA_API_KEY absent, generate/validate/publish lifecycle enforced at API level. 15/15 E2E checks pass in verify-e2e-m005.ts.
- Notes: S01 delivers back-office generate/validate/publish workflow with mock IA service. Simulation client (S02) and e2e verification (S03) remain.

### R011 — POST /api/simulate — upload photo salon, l'IA place le canapé configuré dans la scène. Résultat éphémère (pas stocké), watermark texte. Route publique.
- Class: differentiator
- Status: validated
- Description: POST /api/simulate — upload photo salon, l'IA place le canapé configuré dans la scène. Résultat éphémère (pas stocké), watermark texte. Route publique.
- Why it matters: Feature wow — le client voit le canapé chez lui.
- Source: user
- Primary owning slice: M005/S03
- Supporting slices: none
- Validation: M005 S03 verified: POST /api/simulate missing model_id → 400, missing image → 400, valid FormData → 200 image/jpeg body >0 bytes, no generated_visuals row created (ephemeral), no requireAdmin guard (public). Watermark via iaService.addWatermark("MÖBEL UNIQUE — Aperçu"). 6/6 E2E checks pass in scripts/verify-e2e-m005.ts.
- Notes: Mock en attendant la clé API. Watermark texte simple pour l'instant. Live E2E verified against running dev server 2026-03-25.

### R012 — Layout /admin avec header (logo, nom admin, déconnexion), sidebar navigation (Produits, Tissus), page dashboard avec stats basiques.
- Class: launchability
- Status: validated
- Description: Layout /admin avec header (logo, nom admin, déconnexion), sidebar navigation (Produits, Tissus), page dashboard avec stats basiques.
- Why it matters: Navigation cohérente dans le back-office.
- Source: inferred
- Primary owning slice: M002/S02
- Supporting slices: none
- Validation: Layout admin avec header (logo MU, email, déconnexion), sidebar (Dashboard, Produits, Tissus avec active state), dashboard avec 3 stats cards depuis Supabase. Vérifié en navigateur le 2026-03-24.
- Notes: —

### R013 — Les catégories ne sont pas une liste fixe. Select avec catégories existantes (SELECT DISTINCT) + possibilité d'en saisir une nouvelle (combobox).
- Class: core-capability
- Status: validated
- Description: Les catégories ne sont pas une liste fixe. Select avec catégories existantes (SELECT DISTINCT) + possibilité d'en saisir une nouvelle (combobox).
- Why it matters: L'admin doit être autonome pour organiser son catalogue.
- Source: user
- Primary owning slice: M003/S02
- Supporting slices: none
- Validation: Combobox catégorie via datalist HTML natif — propose les catégories existantes (GET /api/admin/fabrics/categories) + saisie libre. Vérifié le 2026-03-24.
- Notes: —

### R014 — Slugs auto-générés à partir du nom ("Velours Bleu" → velours-bleu) mais modifiables manuellement avant sauvegarde.
- Class: core-capability
- Status: validated
- Description: Slugs auto-générés à partir du nom ("Velours Bleu" → velours-bleu) mais modifiables manuellement avant sauvegarde.
- Why it matters: UX admin simple + URLs propres pour Shopify.
- Source: user
- Primary owning slice: M003/S01
- Supporting slices: M004/S01
- Validation: Slug auto-généré via slugify() quand le nom change, bascule en mode manuel si l'admin modifie le slug directement. Accents strippés (Tweed Gris Chiné → tweed-gris-chine). Vérifié le 2026-03-24.
- Notes: Fonction slugify déjà dans src/lib/utils.ts.

### R015 — Upload avec preview, validation taille (swatch max 2MB, photo ref max 5MB, photos produits max 5MB).
- Class: quality-attribute
- Status: validated
- Description: Upload avec preview, validation taille (swatch max 2MB, photo ref max 5MB, photos produits max 5MB).
- Why it matters: L'admin doit voir ce qu'il uploade et ne pas envoyer des fichiers trop lourds.
- Source: inferred
- Primary owning slice: M003/S02
- Supporting slices: M004/S03, M004/S04
- Validation: Upload avec preview et validation taille : swatch max 2MB (M003), photo ref max 5MB (M003), photos produits max 5MB (M004/S03 ImageUpload maxSizeMB={5}), rendus classiques max 5MB (M004/S04 ImageUpload maxSizeMB={5}). Vérifié structurellement via grep sur maxSizeMB dans ModelForm.tsx et FabricForm.tsx.
- Notes: —

### R016 — Architecture de prompts configurable (pas de prompts hardcodés). Templates modifiables pour la génération back-office et la simulation salon.
- Class: differentiator
- Status: validated
- Description: Architecture de prompts configurable (pas de prompts hardcodés). Templates modifiables pour la génération back-office et la simulation salon.
- Why it matters: La qualité des rendus IA dépend entièrement de la qualité des prompts.
- Source: user
- Primary owning slice: M005/S01
- Supporting slices: none
- Validation: Prompt templates exported as functions from `src/lib/ai/prompts.ts`: `buildBackOfficePrompt(modelName, fabricName, viewType)` and `buildSimulatePrompt(modelName, fabricName)`. No hardcoded prompts in any API route — all routes call prompt functions. Architecture is configurable: edit template strings in prompts.ts to change IA output. Vérifié structurellement le 2026-03-25.
- Notes: La feuille A4 dans la photo salon sert de référence de taille pour l'IA.

## Deferred

### R020 — Quelques canapés et tissus de démo au lancement.
- Class: launchability
- Status: deferred
- Description: Quelques canapés et tissus de démo au lancement.
- Why it matters: Le client a besoin de données pour tester le back-office.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Le client complète son catalogue seul via le back-office.

### R021 — Déploiement de l'app sur Vercel.
- Class: operability
- Status: deferred
- Description: Déploiement de l'app sur Vercel.
- Why it matters: Mise en production.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: unmapped
- Notes: Après que le backend soit stable.

## Out of Scope

### R030 — Hero, catalogue, configurateur, simulation salon côté client.
- Class: constraint
- Status: out-of-scope
- Description: Hero, catalogue, configurateur, simulation salon côté client.
- Why it matters: Empêche la confusion de scope — c'est fait par le client avec Google Stitch.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: Sera fusionné dans le même projet Next.js plus tard.

### R031 — Intégration CRM — retiré en V4.
- Class: anti-feature
- Status: out-of-scope
- Description: Intégration CRM — retiré en V4.
- Why it matters: Scope réduit en V4.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: —

### R032 — Envoi d'emails — retiré en V4.
- Class: anti-feature
- Status: out-of-scope
- Description: Envoi d'emails — retiré en V4.
- Why it matters: Scope réduit en V4.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: —

### R033 — Français uniquement. Pas de multi-langue.
- Class: constraint
- Status: out-of-scope
- Description: Français uniquement. Pas de multi-langue.
- Why it matters: Simplifie le développement.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: —

### R034 — Pas de formulaire de création de compte. Admin créé manuellement dans Supabase.
- Class: constraint
- Status: out-of-scope
- Description: Pas de formulaire de création de compte. Admin créé manuellement dans Supabase.
- Why it matters: Un seul admin, pas besoin de gestion utilisateurs.
- Source: user
- Primary owning slice: none
- Supporting slices: none
- Validation: n/a
- Notes: —

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | core-capability | validated | M001/S02 | none | validated |
| R002 | compliance/security | validated | M001/S03 | none | validated |
| R003 | core-capability | validated | M001/S04 | none | validated |
| R004 | primary-user-loop | validated | M001/S05 | none | validated |
| R005 | compliance/security | validated | M002/S01 | M002/S02 | Login email/password fonctionne, proxy protège /admin/*, redirect vers login si non auth, déconnexion redirige vers login. Vérifié en navigateur le 2026-03-24. |
| R006 | core-capability | validated | M003/S01 | M003/S02, M003/S03 | CRUD complet (GET/POST/PUT/DELETE) + tableau admin + formulaire création/édition + toggle actif/inactif + suppression avec confirmation. Upload swatch et photo ref via FormData. Vérifié en navigateur le 2026-03-24. |
| R007 | core-capability | validated | M004/S01 | M004/S02, M004/S03, M004/S04 | API CRUD complète (POST/PUT/DELETE models + images + visuals), tableau admin /admin/produits, formulaire création/édition avec infos + photos multi-angles + mode classique (upload rendus sans IA avec choix tissu + angle → generated_visuals is_validated=true is_published=true). Vérifié structurellement le 2026-03-24 (tsc --noEmit + 10 grep checks). |
| R008 | differentiator | validated | M005/S01 | M005/S02, M005/S03, M005/S04 | M005 S03 verified: MockIAService generates valid JPEG buffers (8/8 checks in verify-ia-mock.ts), all 6 admin routes auth-guarded (401 without auth), factory returns mock when NANO_BANANA_API_KEY absent, generate/validate/publish lifecycle enforced at API level. 15/15 E2E checks pass in verify-e2e-m005.ts. |
| R009 | admin/support | active | M006/S01 | M006/S02 | unmapped |
| R010 | primary-user-loop | active | M001 | M003, M004, M005 | partial |
| R011 | differentiator | validated | M005/S03 | none | M005 S03 verified: POST /api/simulate missing model_id → 400, missing image → 400, valid FormData → 200 image/jpeg body >0 bytes, no generated_visuals row created (ephemeral), no requireAdmin guard (public). Watermark via iaService.addWatermark("MÖBEL UNIQUE — Aperçu"). 6/6 E2E checks pass in scripts/verify-e2e-m005.ts. |
| R012 | launchability | validated | M002/S02 | none | Layout admin avec header (logo MU, email, déconnexion), sidebar (Dashboard, Produits, Tissus avec active state), dashboard avec 3 stats cards depuis Supabase. Vérifié en navigateur le 2026-03-24. |
| R013 | core-capability | validated | M003/S02 | none | Combobox catégorie via datalist HTML natif — propose les catégories existantes (GET /api/admin/fabrics/categories) + saisie libre. Vérifié le 2026-03-24. |
| R014 | core-capability | validated | M003/S01 | M004/S01 | Slug auto-généré via slugify() quand le nom change, bascule en mode manuel si l'admin modifie le slug directement. Accents strippés (Tweed Gris Chiné → tweed-gris-chine). Vérifié le 2026-03-24. |
| R015 | quality-attribute | validated | M003/S02 | M004/S03, M004/S04 | Upload avec preview et validation taille : swatch max 2MB (M003), photo ref max 5MB (M003), photos produits max 5MB (M004/S03 ImageUpload maxSizeMB={5}), rendus classiques max 5MB (M004/S04 ImageUpload maxSizeMB={5}). Vérifié structurellement via grep sur maxSizeMB dans ModelForm.tsx et FabricForm.tsx. |
| R016 | differentiator | validated | M005/S01 | none | Prompt templates exported as functions from `src/lib/ai/prompts.ts`: `buildBackOfficePrompt(modelName, fabricName, viewType)` and `buildSimulatePrompt(modelName, fabricName)`. No hardcoded prompts in any API route — all routes call prompt functions. Architecture is configurable: edit template strings in prompts.ts to change IA output. Vérifié structurellement le 2026-03-25. |
| R020 | launchability | deferred | none | none | unmapped |
| R021 | operability | deferred | none | none | unmapped |
| R030 | constraint | out-of-scope | none | none | n/a |
| R031 | anti-feature | out-of-scope | none | none | n/a |
| R032 | anti-feature | out-of-scope | none | none | n/a |
| R033 | constraint | out-of-scope | none | none | n/a |
| R034 | constraint | out-of-scope | none | none | n/a |

## Coverage Summary

- Active requirements: 2
- Mapped to slices: 2
- Validated: 14 (R001, R002, R003, R004, R005, R006, R007, R008, R011, R012, R013, R014, R015, R016)
- Unmapped active requirements: 0
