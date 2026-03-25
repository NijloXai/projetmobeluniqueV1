# Möbel Unique — KNOWLEDGE

## K001 — Catégories tissus : champ libre
Les catégories de tissus ne sont pas une liste fixe. L'admin les crée au fur et à mesure. L'UI doit proposer un select avec les catégories existantes (SELECT DISTINCT category FROM fabrics) + possibilité d'en saisir une nouvelle (combobox).

## K002 — Mode classique sans IA
L'admin peut upload des photos finales directement sans passer par la génération IA. Le flow : upload photo + choix angle (view_type) + choix tissu → insert dans `generated_visuals` avec `is_validated=true` et `is_published=true`. La photo va dans le bucket `generated-visuals`.

## K003 — Slugs auto-générés + éditables
Les slugs (tissus et canapés) sont auto-générés à partir du nom (ex: "Velours Bleu" → `velours-bleu`) mais l'admin peut les modifier manuellement avant de sauvegarder.

## K004 — Deux niveaux de contrôle tissus
- `fabrics.is_active = false` → le tissu disparaît de TOUS les canapés côté client (contrôle global B3)
- `generated_visuals.is_published = false` → le tissu disparaît de CE canapé uniquement (contrôle par canapé B2)

## K005 — Prompt engineering Nano Banana 2
La qualité des rendus IA dépend d'un système de prompts bien construit. Prévoir une architecture de prompts configurable (pas de prompts hardcodés). La feuille A4 dans la photo salon sert de référence de taille pour l'IA dans le mode simulation F3.

## K006 — Front fusionné plus tard
Le client fait le frontend public (F1, F2, F3) avec Google Stitch séparément. Il sera fusionné dans le même projet Next.js plus tard. Pas de CORS à gérer — tout sera dans la même app.

## K007 — Le client gère son catalogue
On seed quelques canapés et tissus au lancement, mais c'est le client qui complète son catalogue lui-même via le back-office. L'UX admin doit être simple et autonome.

## K008 — Fichiers cachés macOS
Le dossier `.gsd/`, `.env`, `.mcp.json` sont cachés par défaut sur macOS. Pour les voir dans le Finder : Cmd + Shift + . (point).

## K009 — Chemins storage model-photos et slug rename
Les images modèles sont stockées dans le bucket `model-photos` au chemin `{slug}/{view_type}-{sort_order}.{ext}`. Si le slug change via PUT (renommage du modèle), les fichiers existants gardent l'ancien chemin dans le bucket — l'URL absolue en base reste valide, mais le bucket contient des fichiers orphelins sous l'ancien slug. Pas de problème fonctionnel, mais à garder en tête pour le nettoyage.

## K010 — model_images(count) dans GET /api/admin/models
La route GET list utilise `model_images(count)` pour récupérer le nombre d'images par modèle. La réponse contient `model_images: [{ count: number }]` — extraire avec `model.model_images[0]?.count ?? 0`. Cette relation nécessite que PostgREST reconnaisse la FK entre models et model_images.

## K011 — Zod v4 coerce breaks react-hook-form zodResolver
`z.coerce.number()` in Zod v4 infers `unknown` input type, which makes `zodResolver<Schema>` fail with a type mismatch against react-hook-form's `Resolver` generic. Fix: use `z.number().positive()` and pass `{ valueAsNumber: true }` in the `register()` options for the HTML number input instead.

## K012 — Admin CRUD entity template (established pattern)
Both fabrics and models follow the exact same admin CRUD template:
- **API:** requireAdmin → parse body → Zod validation → slug auto-gen → Supabase op → error mapping (409/404/500)
- **List page:** Server component fetches with relation data → client component handles table + toggle + delete + empty state
- **Form page:** react-hook-form + zodResolver, auto-slug with manual override, JSON body for info fields, FormData for file uploads in separate section
- **Delete cascade:** fetch child storage URLs → best-effort remove from buckets → delete parent (FK cascade for DB)
Any future admin entity (e.g. collections, categories) should follow this template for consistency.

## K013 — generated_visuals dual-insert convention
Mode classique inserts with `is_validated=true, is_published=true` (no AI review needed). Future IA generation (M005) should insert with `is_validated=false, is_published=false` and require explicit admin validate → publish flow. Same table, same storage bucket, different initial states.

## K014 — image_count preservation during toggle
The PUT response from admin model routes returns a flat Model without computed counts (like image_count). The list page must preserve the locally computed count when merging the PUT response into state. Same pattern applies to fabrics. If the API ever changes to include counts, simplify the merge logic.

## K015 — Staleness detection for generated visuals (D017)
When a fabric's reference image changes, generated visuals become visually stale. Detection is **derived, not stored**: compare `visual.created_at < fabric.reference_image_updated_at`. The `reference_image_updated_at` column on `fabrics` is set only when the reference image file actually changes (not on every PUT). This avoids cascade writes to `generated_visuals`. The GET visuals endpoint already joins `fabric:fabrics(*)`, so the comparison data is free. UI shows "Périmé" badge + banner with "Régénérer les périmés" bulk action — admin controls when to regenerate.

## K016 — Use npx tsx for runtime IA service checks, not node -e require()
`node -e "require('./src/lib/ai')"` does NOT work for TypeScript source files — CJS require cannot load `.ts` directly. Use `npx tsx -e "import { getIAService } from './src/lib/ai'; ..."` instead. This applies to any runtime check against TypeScript modules (factory verification, prompt template testing, etc.).

## K017 — IA visual lifecycle state machine
Generated visuals follow a strict state machine: `generate` (is_validated=false, is_published=false) → `validate` (is_validated=true) → `publish` (is_published=true). Publishing requires validation — the API returns 403 if attempted on an unvalidated visual. Bulk-publish silently skips unvalidated visuals. Regeneration resets to initial state (delete old + create new). This is enforced at the API level, not just the UI.

## K018 — Next.js 16 blocks concurrent dev servers in same project directory
Next.js 16 prevents running multiple dev servers in the same project directory simultaneously. E2E verification scripts must detect an existing server on port 3000 and reuse it rather than spawning a new one on a different port. Use `fetch('http://localhost:3000')` as a liveness check before attempting to start a new server.

## K019 — process.loadEnvFile() available in Node 24
Node 24 provides `process.loadEnvFile('.env.local')` natively — no need to install dotenv as a dependency. Use this in standalone scripts (e.g. verification/test scripts) that need env vars. Production Next.js code handles env vars automatically.
