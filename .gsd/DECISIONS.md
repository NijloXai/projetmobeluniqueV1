# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 | M001 | arch | Framework principal | Next.js 16.2.1 (App Router, Turbopack) | Dernière version, choix du client | No | collaborative |
| D002 | M001 | arch | Backend / BDD | Supabase (PostgreSQL + Auth + Storage) | BaaS complet, transfert projet possible vers le client | No | human |
| D003 | M001 | library | UI Framework | Radix UI (headless) + CSS Modules. PAS Tailwind, PAS shadcn/ui | Choix du client, contrôle total du style | No | human |
| D004 | M001 | library | State management | Zustand + Immer | Léger, simple, bon support TypeScript | Yes | human |
| D005 | M001 | arch | Génération IA | Nano Banana 2 (Gemini) — mock/stub pour l'instant | Clé API pas encore disponible | Yes | collaborative |
| D006 | M001 | scope | Frontend public | Séparé, fait avec Google Stitch, fusionné plus tard | Choix du client | No | human |
| D007 | M001 | arch | Hosting | Vercel | Intégration native Next.js | Yes | human |
| D008 | M001 | convention | Langue | Français uniquement (UI, erreurs, contenu) | Client et marché français | Yes | human |
| D009 | M001 | arch | Supabase MCP | CLI @supabase/mcp-server-supabase avec PAT | Gestion BDD directe depuis l'agent | Yes | collaborative |
| D010 | M001 | convention | Slugs | Auto-générés depuis le nom + éditables par l'admin | UX simple + URLs propres | No | collaborative |
| D011 | M001 | arch | Catégories tissus | Champ libre — combobox avec catégories existantes + saisie nouvelle | L'admin organise son catalogue en autonomie | No | collaborative |
| D012 | M001 | pattern | Mode classique sans IA | Upload photo → generated_visuals avec is_validated=true et is_published=true | L'admin peut bypass la génération IA | No | collaborative |
| D013 | M001 | arch | Deux niveaux contrôle tissus | is_active sur fabrics = global, is_published sur generated_visuals = par canapé | Flexibilité de gestion catalogue | No | collaborative |
| D014 | M001 | arch | Prompts IA | Système configurable, pas de prompts hardcodés | Qualité des rendus dépend des prompts | No | collaborative |
| D015 | M002/S02 | pattern | Route groups admin | /admin/(auth)/login séparé de /admin/(dashboard)/* | Évite la boucle de redirect — le layout admin (qui vérifie l'auth) ne doit pas englober la page login | No | agent |
| D016 | M002/S01 | arch | Proxy au lieu de Middleware | proxy.ts + export function proxy() | Next.js 16 a renommé middleware.ts → proxy.ts. Même fonctionnalité, runtime nodejs par défaut | No | agent |
| D017 | M004/S01 | pattern | Shared extractStoragePath utility location | Extracted from fabrics route to src/lib/utils.ts — shared by fabrics and models routes | Eliminates duplication between fabrics and models delete handlers. Both need to extract file paths from Supabase Storage URLs for cleanup. Single source of truth in shared utils. | Yes | agent |
| D018 | M004/S04 | pattern | Storage path convention for generated visuals in mode classique | Path: `{slug}/{fabric_id}-{model_image_id}.{ext}` in the `generated-visuals` bucket, with upsert:true — re-uploading the same fabric+angle combo overwrites the previous file | Mirrors the model-photos path convention (`{slug}/{view_type}-{sort_order}.{ext}`). Using fabric_id and model_image_id as path components ensures uniqueness per combination. Upsert allows the admin to replace a visual without deleting first. The slug prefix groups all visuals for a model together in storage. | Yes | agent |
| D019 | M005/S01/T01 | architecture | How to recover M004 code into M005 worktree when milestone/M004 branch doesn't exist | Recovered orphaned commits via git fsck --unreachable and merged final M004 commit (f0e9c32) directly into milestone/M005 | The M004 worktree was removed without preserving its branch, orphaning 12 commits. git fsck found them, git log reconstructed the commit chain, and merging the final commit brought in all 29 M004 files conflict-free. This avoids recreating M004 code from scratch. | Yes | agent |
| D020 | M005/S01 | architecture | Staleness detection for generated visuals when fabric reference image changes | Timestamp-based derived detection via `fabrics.reference_image_updated_at`. Visual is stale when `visual.created_at < fabric.reference_image_updated_at`. UI shows "Périmé" badge + banner with "Régénérer les périmés" bulk action. Zero cascade writes. | Simplest reliable approach: one column, zero cascade writes, zero triggers, zero new tables. Detection is a timestamp comparison on data already joined. Admin controls when to regenerate. Alternatives rejected: cascade UPDATE (fragile), stored is_stale flag (requires sync), background job (overengineered). | Yes | collaborative |
| D021 | M006/S01/T04 | architecture | Export API route path structure under /api/admin/visuals/ | Use /api/admin/visuals/export/[modelId] instead of /api/admin/visuals/[modelId]/export | Next.js App Router prohibits different dynamic segment names at the same path level. Existing routes use [id] (visual ID) under visuals/, so [modelId] at the same level causes 'You cannot use different slug names for the same dynamic path' error. Moving 'export' before the dynamic segment avoids the collision while keeping the URL semantically clear. | Yes | agent |
