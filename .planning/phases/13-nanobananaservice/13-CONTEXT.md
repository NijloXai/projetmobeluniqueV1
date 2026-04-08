# Phase 13: NanoBananaService - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Remplacer le stub `NanoBananaService` (18 lignes, throw Error) par une implémentation réelle via `@google/genai` (Gemini `gemini-3.1-flash-image-preview`). Le factory pattern `getIAService()` reste inchangé — les 3 routes consommatrices (`/api/admin/generate`, `/api/admin/generate-all`, `/api/simulate`) ne sont pas modifiées structurellement. Ajout d'un rate-limit par IP sur la route publique `/api/simulate`.

</domain>

<decisions>
## Implementation Decisions

### Gestion d'erreurs Gemini
- **D-01:** `IMAGE_SAFETY` retourne une erreur explicite en français : "Cette image n'a pas pu être traitée (contenu non autorisé). Essayez une autre photo." — HTTP 422
- **D-02:** Pas de fallback vers le mock Sharp après 3 retries échoués — erreur franche. Le client sait que l'IA réelle a échoué.
- **D-03:** Validation stricte du buffer retourné par Gemini — vérifier > 0 bytes et format PNG/JPEG valide avant conversion. Erreur explicite sinon.
- **D-04:** Rate-limit par IP sur `/api/simulate` : max 5 appels/minute via compteur en mémoire (Map). Message avec délai : "Trop de demandes. Réessayez dans X secondes." — HTTP 429 avec header Retry-After.
- **D-05:** Timeout 30s — message explicite : "La génération a pris trop de temps. Veuillez réessayer." — HTTP 504
- **D-06:** Retry exponentiel 1s/2s/4s + jitter sur 429 et 5xx (erreurs serveur Google)

### Stratégie generate-all
- **D-07:** Traitement séquentiel conservé (for...of) — zéro risque de rate-limit Gemini, simple et prévisible
- **D-08:** Si un angle échoue, skip et continuer les autres (comportement actuel conservé)
- **D-09:** Réponse inclut un tableau `errors: [{view_type, reason}]` en plus de `generated/total/success` — détail par angle
- **D-10:** Pas de SSE/progression pour v11 — l'admin attend le résultat complet
- **D-11:** `maxDuration = 300` (5 min) pour generate-all — couvre 4 angles × 30s max + retries
- **D-12:** `maxDuration` sur les 3 routes IA : generate: 60s, generate-all: 300s, simulate: 60s

### Logging et observabilité
- **D-13:** Console structuré avec préfixe `[IA]` + durée + taille buffer + statut — même pattern que les routes actuelles mais enrichi
- **D-14:** Logger tous les appels (succès + erreurs) — permet d'identifier les ralentissements avant qu'ils deviennent des problèmes
- **D-15:** Erreur 401 Gemini (clé invalide) retournée comme erreur 500 "Configuration IA invalide" — pas de fallback mock

### Sécurité clé API
- **D-16:** Client `@google/genai` instancié une seule fois dans le constructeur (singleton) — plus performant, pattern standard
- **D-17:** `NANO_BANANA_API_KEY` reste serveur-only (sans préfixe `NEXT_PUBLIC`) — déjà le cas, confirmé
- **D-18:** Pas de rate-limit sur les routes admin — `requireAdmin()` suffit comme protection

### Claude's Discretion
- Stratégie retry 5xx : Claude choisit l'approche optimale selon les bonnes pratiques SDK Google
- Format de resize image simulate : Claude choisit `fit: 'inside'` vs largeur fixe selon les recommandations Gemini
- Verbosité des logs retry : résumé ou détaillé selon le contexte
- Détails de logging (modèle Gemini, taille payload) : Claude inclut les infos pertinentes pour le debug production
- Masquage clé API dans les logs : Claude choisit le bon niveau de sécurité
- Métriques agrégées : Claude évalue si des compteurs simples valent l'effort pour cette phase
- Validation format clé API au démarrage : Claude décide si un check basique vaut le coup

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Service IA existant
- `src/lib/ai/nano-banana.ts` — Stub actuel à remplacer (18 lignes)
- `src/lib/ai/types.ts` — Interface IAService (generate + addWatermark)
- `src/lib/ai/index.ts` — Factory getIAService() et exports
- `src/lib/ai/mock.ts` — MockIAService avec pattern watermark Sharp à réutiliser
- `src/lib/ai/prompts.ts` — Templates de prompts (buildBackOfficePrompt, buildSimulatePrompt)

### Routes consommatrices
- `src/app/api/admin/generate/route.ts` — Génération single (model_image + fabric)
- `src/app/api/admin/generate-all/route.ts` — Génération tous angles d'un modèle (séquentiel, continue on error)
- `src/app/api/simulate/route.ts` — Simulation publique (FormData image + model_id, retourne JPEG binaire avec watermark)

### Requirements
- `.planning/REQUIREMENTS.md` — Requirements IA-01 à IA-07 (spécifications techniques détaillées)

### Research
- `.planning/research/SUMMARY.md` — Résumé recherche v11.0 (SDK @google/genai, pitfalls, architecture)
- `.planning/research/PITFALLS.md` — Risques identifiés (timeout, 429, IMAGE_SAFETY, payload > 20Mo)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MockIAService.addWatermark()` : pattern Sharp SVG overlay réutilisable directement pour `NanoBananaService.addWatermark()`
- `extractStoragePath()` dans `src/lib/utils.ts` : extraction chemin storage depuis URL publique
- `buildBackOfficePrompt()` et `buildSimulatePrompt()` : templates prompts prêts à l'emploi

### Established Patterns
- Factory pattern Strategy : `getIAService()` sélectionne le provider via env var — NanoBanana respecte la même interface
- Routes admin : `requireAdmin()` en guard, Supabase queries, upload storage, insert BDD
- Route simulate : FormData parsing, data URI base64, retourne binary JPEG (pas JSON)
- Upsert pattern : suppression ancien fichier storage + ancien row BDD avant recréation
- Console logging : préfixe `[POST /api/admin/generate]` + durée + taille — à étendre avec `[IA]`

### Integration Points
- `getIAService()` dans `src/lib/ai/index.ts` — point d'entrée unique, aucune route ne change
- `GenerateRequest.sourceImageUrl` : URL Supabase publique (admin) ou data URI base64 (simulate) — deux chemins d'entrée à gérer
- `GenerateResult` : doit retourner `{ imageBuffer, mimeType, extension }` — Gemini retourne PNG, conversion JPEG nécessaire
- `process.env.NANO_BANANA_API_KEY` : clé env déjà référencée dans le factory

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- SSE/progression pour generate-all — complexité sans valeur pour v11 séquentiel
- Queue asynchrone pour génération batch — v12+
- Multi-providers IA (fallback) — v12+
- Logger structuré (pino/winston) — v12+ si besoin
- Métriques Prometheus/Datadog — v12+ si besoin
- Rate-limit persistant (Supabase/Redis) — v12+ si le Map en mémoire ne suffit pas

</deferred>

---

*Phase: 13-nanobananaservice*
*Context gathered: 2026-04-08*
