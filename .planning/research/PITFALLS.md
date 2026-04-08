# Pitfalls Research — v11.0 Intégration IA Réelle + Tests

**Domain:** Passage du mock Sharp au provider Nano Banana 2 (Gemini) + mise en place tests unitaires Vitest + E2E Playwright sur un Next.js 16 App Router + Supabase existant.
**Researched:** 2026-04-08
**Confidence:** HIGH — analyse directe du code existant + sources officielles Gemini + patterns Playwright/Vitest documentés 2025-2026.

---

## Critical Pitfalls

### Pitfall 1 : generate-all bloque la serverless function au-delà du timeout Vercel

**What goes wrong:**
`POST /api/admin/generate-all` itère en boucle séquentielle sur tous les angles d'un modèle. Avec le mock Sharp, chaque appel prend ~5ms. Avec Nano Banana 2 (Gemini), chaque appel prend 5–30 secondes selon la charge serveur. Un modèle avec 4 angles = 20–120 secondes. Vercel Hobby plan : timeout 10s. Vercel Pro plan : timeout 60s. La route répond 504 avant d'avoir généré le premier visuel.

**Why it happens:**
Le mock Sharp a masqué la réalité de la latence IA. L'architecture séquentielle (boucle `for...of` sans parallélisme ni streaming) fonctionne pour des opérations instantanées, mais pas pour des appels réseau lents. La route ne déclare pas de `maxDuration`, donc hérite du défaut Vercel.

**How to avoid:**
1. Déclarer `export const maxDuration = 300` en haut de `generate-all/route.ts` (Vercel Pro/Enterprise) ou restructurer en traitement asynchrone découplé.
2. Paralléliser les appels avec `Promise.all` sur les angles (4 appels simultanés au lieu de séquentiels) — réduit le temps total de 4× mais augmente la consommation de quotas RPM.
3. Si on reste sur Hobby plan : limiter generate-all à 1 angle à la fois côté client, ou basculer sur une queue de traitement (Vercel Cron + statut en base).

**Warning signs:**
- Log `[POST /api/admin/generate-all] Généré en Xms` avec X > 55 000ms.
- Réponse 504 depuis l'UI admin sur la génération multi-angles.
- Le mock ne déclenche jamais ce problème — il apparaît uniquement en prod/staging avec la clé Nano Banana.

**Phase to address:**
Phase IA-REAL-01 (intégration admin) — avant de tester generate-all avec la vraie clé.

---

### Pitfall 2 : Rate limiting Gemini 429 sans retry — génération silencieusement abandonnée

**What goes wrong:**
Nano Banana 2 (Gemini 3.1 Flash Image) impose : Tier 1 (billing activé) = 10 images/minute (IPM) et 1 000/jour (IPD). En generate-all sur un modèle multi-angles avec plusieurs tissus en succession rapide, les appels dépassent le quota IPM. Le service reçoit une 429 `RESOURCE_EXHAUSTED`. Sans retry, l'erreur remonte immédiatement comme 500 dans l'UI admin.

**Why it happens:**
Le `NanoBananaService` stub actuel n'implémente aucune logique de retry. La route wrappée dans `try/catch` générique retourne 500 sans distinguer les erreurs temporaires (429, 503) des erreurs permanentes (400, 401). L'admin voit "Erreur lors de la génération" sans indication que réessayer dans 60 secondes suffirait.

**How to avoid:**
Implémenter dans `NanoBananaService.generate()` une logique de retry avec exponential backoff :
- Retryable : 429, 500, 502, 503
- Non-retryable : 400, 401, 403 (échouer immédiatement)
- Base delay : 2 secondes, facteur × 2, max 60 secondes, max 6 tentatives
- Ajouter du jitter (±20%) pour éviter le thundering herd si plusieurs admins génèrent simultanément
- Dans la réponse 500 de la route, inclure `{ error: ..., retryable: true }` quand c'est une 429 pour que l'UI puisse afficher "Réessayer dans Xs".

**Warning signs:**
- Erreur 500 avec message contenant `RESOURCE_EXHAUSTED` ou `quota` dans les logs serveur.
- Plusieurs génération en rafale (generate-all × plusieurs tissus) après une seule.
- L'erreur n'apparaît jamais avec le mock — uniquement avec la vraie clé.

**Phase to address:**
Phase IA-REAL-01 — écrire le service Nano Banana avec retry avant tout test en conditions réelles.

---

### Pitfall 3 : IMAGE_SAFETY refusal non gérée — prompt bloqué silencieusement

**What goes wrong:**
Gemini image generation retourne `finishReason: "IMAGE_SAFETY"` ou `"OTHER"` pour certains prompts. Le SDK retourne une réponse 200 (pas d'exception) mais avec `candidates[0].finishReason !== "STOP"` et `candidates[0].content.parts` vide. Le code qui tente d'accéder à `parts[0].inlineData.data` obtient une TypeError. Le résultat : 500 générique côté admin, aucune indication que c'est un problème de prompt.

**Why it happens:**
Les prompts actuels dans `buildBackOfficePrompt` sont en anglais et décrivent un canapé en studio neutre — ils ne devraient pas déclencher de safety filter. Mais Gemini peut refuser pour des raisons non documentées (similarité avec du contenu connu, formulations ambiguës). Le NanoBananaService stub actuel ne gère aucun format de réponse Gemini.

**How to avoid:**
Dans `NanoBananaService.generate()`, vérifier `finishReason` avant d'accéder aux données image :
```typescript
if (candidate.finishReason !== 'STOP') {
  throw new Error(`Génération refusée par le modèle : ${candidate.finishReason}`)
}
```
Retourner cette erreur avec un message explicite côté admin (pas 500 générique). Tester les prompts avec plusieurs formulations si des refus surviennent.

**Warning signs:**
- TypeError `Cannot read properties of undefined` dans les logs après appel Gemini.
- Réponse Gemini avec `candidates[0].content.parts` vide ou absent.
- Uniquement avec la vraie clé — le mock ne peut pas déclencher ce cas.

**Phase to address:**
Phase IA-REAL-01 — validation du format de réponse Gemini avant parsing.

---

### Pitfall 4 : Image source trop grande pour l'API inline — dépassement 20 Mo

**What goes wrong:**
`/api/admin/generate` passe `sourceImageUrl` (URL Supabase publique) à `NanoBananaService.generate()`. Si l'implémentation télécharge l'image et l'envoie en base64 inline dans la requête Gemini, la limite totale de la requête est 20 Mo. Une photo de canapé haute résolution depuis Supabase Storage peut dépasser cette limite. L'API Gemini retourne 400 `REQUEST_TOO_LARGE`.

Pour `/api/simulate`, c'est encore plus critique : l'image salon uploadée par l'utilisateur (jusqu'à 15 Mo) est déjà convertie en base64 dans la route actuelle (`sourceImageUrl = data:${type};base64,...`). Un buffer de 15 Mo converti en base64 = ~20 Mo dans la requête.

**Why it happens:**
La limite 20 Mo n'est pas documentée dans le stub actuel. Le mock Sharp ignore complètement `sourceImageUrl` et génère depuis rien. L'incompatibilité n'apparaît que lors de la vraie intégration.

**How to avoid:**
- Pour `/api/admin/generate` : passer l'URL Supabase directement à Gemini (le SDK supporte les URLs accessibles publiquement) au lieu de télécharger + re-encoder.
- Pour `/api/simulate` : redimensionner/compresser l'image salon avant envoi (sharp.resize() à max 1024px + quality 80) pour rester sous 4 Mo inline.
- Vérifier la taille du buffer avant envoi, rejeter avec 413 si trop grand.

**Warning signs:**
- Erreur 400 `REQUEST_TOO_LARGE` dans les logs Gemini.
- Uniquement sur les canapés avec photos haute résolution ou photos salon très lourdes.
- Le mock Sharp ignore complètement ce paramètre.

**Phase to address:**
Phase IA-REAL-01 (admin) et IA-REAL-02 (simulate) — définir la stratégie de passage d'image avant d'implémenter le service.

---

### Pitfall 5 : Tests Vitest — async Server Components non testables dans happy-dom

**What goes wrong:**
Vitest + happy-dom ne supporte pas le rendu des async Server Components (RSC). Un test qui importe et `render()` directement un Server Component async obtient l'erreur : `Error: async/await is not yet supported in Client Components`. Les composants comme `CatalogueSection` (fetch Supabase + rendu JSX) ne peuvent pas être unit-testés avec React Testing Library dans Vitest.

**Why it happens:**
Vitest exécute les tests dans jsdom/happy-dom, un environnement browser. Les Server Components sont des fonctions async qui s'exécutent uniquement côté serveur. React ne sait pas les rendre dans ce contexte.

**How to avoid:**
- Server Components async → tester uniquement via Playwright E2E (ils s'exécutent naturellement dans leur environnement).
- Extraire la logique de fetch en fonctions pures séparées (`fetchActiveFabrics()`, `fetchModels()`) et unit-tester ces fonctions en mockant Supabase — sans jamais renderiser le composant.
- Client Components → Vitest + RTL reste valide.
- Garder l'existant (`CatalogueClient.test.tsx`) tel quel — il teste le composant client, pas le server.

**Warning signs:**
- Erreur `async components` dans la sortie Vitest.
- Tests qui importent des Server Components et appellent `render()` directement.

**Phase to address:**
Phase TEST-01 — délimiter clairement ce qui va dans Vitest vs Playwright dès le début.

---

### Pitfall 6 : Playwright + Supabase auth — re-login à chaque test = lenteur et flakiness

**What goes wrong:**
Si chaque test Playwright navigue vers `/admin/login`, remplit le formulaire, et attend la redirection, la suite E2E prend 3–5 secondes de setup par test. Sur 20 tests admin, c'est 60–100 secondes de login pur. De plus, les tests de login via formulaire sont flaky car ils dépendent du réseau (Supabase Auth distant) et du timing DOM.

**Why it happens:**
Pattern naïf : pas de réutilisation de session. Chaque test repart d'une page blanche sans état auth.

**How to avoid:**
Utiliser le pattern Playwright `storageState` avec `globalSetup` :
1. `global-setup.ts` : login via `fetch` direct sur l'API Supabase Auth (pas via UI), extraire le JWT, sauvegarder dans `playwright/.auth/admin.json`.
2. `playwright.config.ts` : `use: { storageState: 'playwright/.auth/admin.json' }` pour tous les tests admin.
3. Le login réseau direct (REST API Supabase) prend ~200ms, contre 2–4 secondes via formulaire UI.
4. Ajouter `playwright/.auth/` au `.gitignore`.

**Warning signs:**
- Tests admin > 5 secondes chacun en moyenne.
- Flakiness sur les assertions post-login (élément header non trouvé).
- CI qui échoue 1 fois sur 5 à cause d'un timeout sur le formulaire de login.

**Phase to address:**
Phase TEST-02 — setup Playwright en premier, avant d'écrire un seul test E2E.

---

### Pitfall 7 : Mock Supabase trop rigide — chaîne de méthodes cassée au moindre changement de requête

**What goes wrong:**
Le pattern de mock actuel dans `simulate-route.test.ts` construit manuellement la chaîne `.from().select().eq().single()` avec des `vi.fn()` imbriqués. Quand la route ajoute un `.order()` ou change le nombre de `.eq()`, le mock ne correspond plus et retourne `undefined` en silence. Le test passe (faux positif) ou lève une TypeError non informative.

**Why it happens:**
Chaque niveau de la chaîne Supabase est un `vi.fn()` qui retourne le niveau suivant. L'ordre et le nombre d'appels doivent correspondre exactement. Le mock ne valide pas la sémantique, seulement la structure d'appel.

**How to avoid:**
Deux approches selon la complexité :
- **Simple** : utiliser un factory helper `createSupabaseMock()` qui retourne un objet avec toutes les méthodes Supabase simulées et permet de configurer les retours par table (`models`, `fabrics`, etc.) plutôt que par position d'appel.
- **Robuste** : adopter MSW (Mock Service Worker) pour intercepter les requêtes HTTP Supabase au niveau réseau — indépendant de la structure interne du client Supabase. MSW fonctionne en Node.js (serveur) et browser.
- Ne jamais mocker `@supabase/supabase-js` directement — mocker `@/lib/supabase/server` à la granularité du module reste acceptable mais fragile.

**Warning signs:**
- Test qui passe mais route retourne `undefined` ou 500 en vrai.
- Besoin de compter les appels `mockResolvedValueOnce` à la main.
- Un refactor de requête SQL casse 10 tests sans rapport avec le comportement testé.

**Phase to address:**
Phase TEST-01 — définir le pattern de mock Supabase avant d'écrire les tests unitaires des routes admin.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Pas de retry sur les appels Gemini | Implémentation plus simple | 429 = 500 en prod, admin frustrés | Jamais en prod avec vraie clé |
| `maxDuration` non configuré | Pas de configuration Vercel | 504 sur generate-all avec 4+ angles | Jamais — 2 lignes à ajouter |
| Mock Supabase par chaîne manuelle | Rapide à écrire pour 1 test | Fragile, faux positifs, maintenance lourde | Acceptable pour < 3 tests simples |
| Login UI dans les tests E2E | Plus réaliste | Lent + flaky, dépend du réseau | Uniquement pour le test du flux de login lui-même |
| Tests uniquement sur mock Sharp | Pas de dépendance API externe | Aucune couverture des erreurs Gemini réelles | Acceptable en CI sans clé Nano Banana |
| Snapshot tests sur les buffers image générés | Détecte les régressions visuelles | Snapshots obsolètes à chaque mise à jour du prompt | Jamais pour les images IA (non-déterministe) |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Gemini SDK | Accéder à `parts[0].inlineData.data` sans vérifier `finishReason` | Vérifier `finishReason === 'STOP'` avant tout parsing |
| Gemini SDK | Passer un buffer base64 > 20 Mo inline | Passer l'URL publique Supabase directement ou redimensionner avant |
| Gemini SDK | Aucun retry sur 429 | Exponential backoff 2s→60s, max 6 tentatives, jitter ±20% |
| Supabase Storage | Uploader un fichier déjà existant sans `upsert: true` | Déjà correct dans le code existant — maintenir ce pattern |
| Playwright + Supabase | Login via formulaire UI dans globalSetup | Login via REST API Supabase dans globalSetup, stocker `storageState` |
| Vitest + RSC | `render()` d'un Server Component async | Tester les fonctions de fetch isolément, RSC via Playwright uniquement |
| Gemini API | Supposer que le modèle `gemini-2.0-flash` génère des images | Utiliser `gemini-2.0-flash-exp-image-generation` ou le modèle Nano Banana 2 spécifié |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| generate-all séquentiel | Timeout 504 sur 4+ angles | `Promise.all` + `maxDuration` Vercel | Dès le 1er appel Nano Banana en prod |
| Tests Vitest sans mock IA | Suite lente, coûts API en CI | Toujours mocker `getIAService()` dans les tests unitaires | Dès qu'une clé Nano Banana est dans l'env CI |
| E2E Playwright sans storageState | Suite > 10 min en CI | globalSetup avec login API direct | Dès 10+ tests admin |
| Base64 image salon 15 Mo → inline | 400 REQUEST_TOO_LARGE sur Gemini | Sharp resize avant envoi (max 4 Mo) | Dès que l'utilisateur uploade une photo > ~3 Mo non compressée |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Committer `playwright/.auth/admin.json` | JWT admin dans le dépôt git public/historique | Ajouter `playwright/.auth/` au `.gitignore` immédiatement |
| Logger le `NANO_BANANA_API_KEY` dans les erreurs | Fuite de clé API dans les logs Vercel | Ne jamais inclure `process.env.*` dans les messages d'erreur |
| Exposer le coût/quota Gemini dans les réponses API | Information de billing exploitable | Les erreurs 429 ne doivent retourner que "limite atteinte, réessayer plus tard" |
| Utiliser la vraie clé Nano Banana en CI | Coûts API imprévisibles + quota épuisé | Ci doit utiliser le mock (pas de `NANO_BANANA_API_KEY` dans les secrets CI) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Erreur 500 générique sur 429 Gemini | L'admin re-clique frénétiquement, épuise encore plus le quota | Message explicite "Limite IA atteinte, réessayer dans ~60 secondes" + désactiver le bouton temporairement |
| Pas d'indicateur de progression sur generate-all | L'admin croit que ça ne fonctionne pas après 10 secondes | Réponse partielle ou polling du statut par angle — ou au minimum un loader avec "Génération en cours (peut prendre 30-60s)..." |
| Résultats Nano Banana non déterministes vs mock Sharp | L'admin s'attend à des images identiques à chaque régénération | Documenter et accepter la variabilité — c'est une caractéristique, pas un bug |

---

## "Looks Done But Isn't" Checklist

- [ ] **NanoBananaService** : implémenter `generate()` et `addWatermark()` — le stub actuel lève une erreur sur les deux méthodes.
- [ ] **Retry logic** : exponentiel backoff sur 429/503 — sans ça, la première vraie erreur de quota = 500 en prod.
- [ ] **maxDuration Vercel** : déclarer dans `generate-all/route.ts` — sans ça, 504 garanti sur 4+ angles.
- [ ] **finishReason check** : vérifier la réponse Gemini avant de lire `inlineData` — sans ça, TypeError silencieuse.
- [ ] **Image resize avant Gemini** : pour `/api/simulate`, redimensionner l'image salon avant envoi — sans ça, 400 sur photos lourdes.
- [ ] **playwright/.auth/ dans .gitignore** : avant de créer le premier storageState — sans ça, risque de commit JWT.
- [ ] **CI sans clé Nano Banana** : vérifier que `NANO_BANANA_API_KEY` n'est pas dans les secrets CI — sans ça, les tests unitaires appellent l'API réelle et consomment le quota.
- [ ] **Tests RSC** : utiliser Playwright pour les Server Components async — tenter de les tester avec Vitest/RTL ne fonctionne pas.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| generate-all timeout en prod | MEDIUM | Ajouter `maxDuration`, redéployer, régénérer les visuels manquants |
| Quota Gemini épuisé (1000/jour) | LOW | Attendre minuit heure du Pacifique (reset quotidien), planifier les générations hors heures de pointe |
| Mock Supabase cassé après refactor | MEDIUM | Migrer vers MSW ou factory helper, réécrire les assertions |
| storageState commité par erreur | HIGH | `git filter-branch` ou `git-filter-repo` pour supprimer du historique, révoquer le JWT compromis dans Supabase Auth |
| Tests E2E flaky sur login UI | LOW | Migrer vers login API dans globalSetup (30 min de refactoring) |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| generate-all timeout (Pitfall 1) | IA-REAL-01 Phase 1 — architecture service | Tester generate-all avec la vraie clé sur 4 angles, vérifier < 60s |
| Retry 429 manquant (Pitfall 2) | IA-REAL-01 Phase 1 — service Nano Banana | Unit test : simuler une 429, vérifier que le service réessaie |
| IMAGE_SAFETY non géré (Pitfall 3) | IA-REAL-01 Phase 1 — parsing réponse Gemini | Test : mocker une réponse sans `parts`, vérifier erreur explicite |
| Image trop grande (Pitfall 4) | IA-REAL-01 (admin) + IA-REAL-02 (simulate) | Test avec image 12 Mo, vérifier pas de 400 Gemini |
| RSC non testables Vitest (Pitfall 5) | TEST-01 Phase 1 — stratégie tests | Aucun test Vitest qui importe un async Server Component |
| Login E2E flaky (Pitfall 6) | TEST-02 Phase 1 — setup Playwright | globalSetup < 500ms, aucun test admin > 3s de setup |
| Mock Supabase fragile (Pitfall 7) | TEST-01 Phase 1 — définir le pattern mock | Refactor d'un `.eq()` dans la route ne casse pas les tests non-liés |

---

## Sources

- [Nano Banana 2 Limits: Daily Quotas Guide](https://blog.laozhang.ai/en/posts/nano-banana-2-limits-daily-quotas-guide) — quotas IPM/IPD, reset midnight PT
- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits) — documentation officielle Google
- [Fix Every Nano Banana 2 Error: 429, 502, Rate Limits](https://www.aifreeapi.com/en/posts/nano-banana-2-error-429-502-rate-limit) — codes d'erreur et recovery
- [Gemini Image Generation Errors](https://gemilab.net/en/articles/gemini-api/gemini-image-generation-errors-fix-guide) — IMAGE_SAFETY, finishReason
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) — timeout par plan
- [How to solve Next.js timeouts](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts) — maxDuration, Fluid Compute
- [Gemini Image API Guide 2026](https://blog.laozhang.ai/en/posts/gemini-image-api-guide-2026) — inline data limit 20 Mo, modèles disponibles
- [Testing Next.js 14 and Supabase](https://micheleong.com/blog/testing-nextjs-14-and-supabase) — Server Components async non supportés Vitest
- [Playwright Authentication](https://playwright.dev/docs/auth) — storageState, globalSetup
- [Login at Supabase via REST API in Playwright](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test) — login API direct
- [Vitest Guide: Mocking](https://vitest.dev/guide/mocking) — patterns de mock
- [MSW Comparison](https://mswjs.io/docs/comparison/) — MSW vs mocks manuels

---
*Pitfalls research for: Intégration IA Réelle (Nano Banana 2) + Tests (Vitest + Playwright) sur Next.js 16 + Supabase*
*Researched: 2026-04-08*
