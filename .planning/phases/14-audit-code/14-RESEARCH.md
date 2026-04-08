# Phase 14: Audit Code - Research

**Researched:** 2026-04-08
**Domain:** Code audit — ESLint, knip, TypeScript static analysis, custom audit script
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Installer ESLint + @typescript-eslint avec règles recommandées — outil permanent, reste après l'audit
- **D-02:** Installer knip pour détecter dead code, exports inutilisés, fichiers orphelins — outil permanent
- **D-03:** Les outils sont installés et configurés dans cette phase, puis utilisés pour alimenter le rapport
- **D-04:** GSD code-review (agent reviewer dédié) pour sécurité et qualité de code — produit un REVIEW.md structuré
- **D-05:** Script custom TypeScript pour dead code, imports inutilisés, violations TypeScript, patterns de sécurité, performance — complémentaire au review GSD
- **D-06:** Les deux livrables sont consolidés dans un AUDIT.md unique
- **D-07:** Fichier unique AUDIT.md avec sections par catégorie : Sécurité, Performance, Dead Code, TypeScript
- **D-08:** Sévérité 3 niveaux : Critical (faille sécurité ou bug) / Warning (à corriger) / Info (amélioration)
- **D-09:** Chaque finding formaté `fichier:ligne` + sévérité + description — navigable directement dans l'IDE
- **D-10:** Tout reporter sans seuil minimum — même les Info sont listés
- **D-11:** Audit exhaustif de tout `src/` — les 77 fichiers TS/TSX + 20 CSS modules
- **D-12:** Aussi auditer : tsconfig.json, next.config.ts, CSS modules, scripts/
- **D-13:** Aucune exclusion — le codebase est assez petit pour un audit complet
- **D-14:** Cette phase documente seulement — aucune correction de code
- **D-15:** Le rapport doit être assez détaillé pour que Phase 16 puisse corriger sans re-analyser

### Claude's Discretion
- Configuration ESLint : choix des règles spécifiques au-delà des recommandées
- Configuration knip : patterns d'exclusion si nécessaire
- Structure interne du script custom d'audit
- Ordre des sections dans AUDIT.md
- Niveau de détail des descriptions par finding

### Deferred Ideas (OUT OF SCOPE)
- Aucune idée reportée — la discussion est restée dans le périmètre de la phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIT-01 | Audit sécurité (injection, XSS, auth bypass, validation inputs) | ESLint security rules + GSD code-review + manual scan patterns identified |
| AUDIT-02 | Audit performance (N+1 queries, bundles, images non-optimisées) | Manual grep patterns for Supabase loop queries + Next.js image audit |
| AUDIT-03 | Audit dead code (imports inutilisés, fichiers orphelins, exports morts) | knip 6.3.1 avec Next.js plugin auto-detect |
| AUDIT-04 | Audit bonnes pratiques (TypeScript strict, error handling, accessibilité) | typescript-eslint via eslint-config-next/typescript (déjà configuré) + tsc --noEmit |
</phase_requirements>

---

## Summary

L'audit repose sur 4 outils combinés, pas un seul. Le codebase a déjà ESLint 9 et `eslint-config-next/typescript` configurés — `@typescript-eslint` est donc **déjà inclus** via `typescript-eslint` (package unifié). La seule installation nécessaire est **knip** (pas encore dans package.json). Un problème bloquant a été identifié : `has-property-descriptors` dans `node_modules` est corrompu (son `index.js` est absent), ce qui empêche ESLint de tourner. L'installation knip via `npm install --save-dev knip` devrait résoudre ce problème en resynchronisant `node_modules`.

L'approche en 4 étapes : (1) corriger node_modules + installer knip, (2) lancer `eslint` + `npx knip` pour collecter les données outillées, (3) écrire un script `scripts/audit-code.ts` de revue statique ciblée (patterns sécurité, N+1, CSS inline, etc.), (4) consolider en `AUDIT.md` par catégorie.

**Recommandation principale :** Ne PAS ajouter `typescript-eslint` en doublon — il est déjà présent via `eslint-config-next/typescript`. Ajouter uniquement `knip` et renforcer l'ESLint config avec les règles strictes déjà disponibles.

---

## Standard Stack

### Core

| Outil | Version | Rôle | Statut |
|-------|---------|------|--------|
| ESLint | 9.39.4 (installé) | Linting JS/TS avec règles Next.js + TypeScript | Déjà installé, config présente |
| eslint-config-next | 16.2.1 (installé) | Règles Next.js core-web-vitals + typescript-eslint recommended | Déjà configuré dans eslint.config.mjs |
| typescript-eslint | 8.57.2 (installé indirect) | Parser TS + règles @typescript-eslint | Inclus via eslint-config-next, ne pas réinstaller |
| knip | 6.3.1 (latest) | Dead code : fichiers orphelins, exports inutilisés, deps inutilisées | À installer |
| TypeScript (tsc) | ~5.x (installé) | Vérification types strict, noEmit | Déjà disponible via `npx tsc --noEmit` |

### Supporting

| Outil | Rôle | Quand utiliser |
|-------|------|----------------|
| `scripts/audit-code.ts` (nouveau) | Script custom grep-style pour patterns non couverts par ESLint (N+1, inline styles, missing env vars) | Complémentaire aux outils statiques |
| `scripts/audit-full.ts` (existant) | Audit runtime : 44 checks API + routes + types | Réutiliser comme modèle de pattern pour `audit-code.ts` |

### Alternatives considérées

| Au lieu de | Pourrait utiliser | Tradeoff |
|------------|-------------------|----------|
| knip | ts-prune, depcheck | knip est la référence actuelle 2025, supporte Next.js App Router nativement, couvre deps+exports+fichiers en un seul outil |
| eslint-config-next/typescript | typescript-eslint direct | eslint-config-next/typescript inclut déjà recommended — doublon inutile |
| Script custom | eslint-plugin-security | eslint-plugin-security est utile mais introduit des faux positifs excessifs sur du code Supabase/Next.js bien écrit |

**Installation (seul ajout nécessaire) :**
```bash
npm install --save-dev knip
```

**Versions vérifiées :**
- `eslint`: 9.39.4 [VERIFIED: node_modules]
- `knip`: 6.3.1 [VERIFIED: npm registry — publié 2026-04-08]
- `typescript-eslint` (indirect via eslint-config-next): 8.57.2 [VERIFIED: node_modules]

---

## Architecture Patterns

### Structure de livraison de la phase

```
scripts/
  audit-code.ts          ← nouveau script custom (patterns non-ESLint)
  audit-full.ts          ← existant, ne pas modifier

.planning/phases/14-audit-code/
  14-RESEARCH.md         ← ce fichier
  14-PLAN.md             ← à créer par le planneur
  AUDIT.md               ← livrable final (consolidation)

eslint.config.mjs        ← à renforcer (règles supplémentaires)
knip.json                ← à créer (config knip)
```

### Pattern 1 : ESLint config renforcée (flat config ESLint 9)

La config actuelle utilise `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`. C'est le niveau `recommended`. Pour l'audit, renforcer avec des règles supplémentaires dans le même fichier plat :

```typescript
// eslint.config.mjs — version renforcée pour l'audit
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // TypeScript strict supplémentaires
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      // Qualité code
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "no-unused-vars": "off",                    // désactivé, remplacé par TS version
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Sécurité basique
      "no-eval": "error",
      "no-implied-eval": "error",
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

**Attention :** `@typescript-eslint/explicit-function-return-type` et `@typescript-eslint/no-floating-promises` nécessitent `parserOptions.project` (typed linting). Activer seulement si la performance reste acceptable. Alternativement, utiliser `"warn"` pour commencer.

[VERIFIED: eslint-config-next/dist/typescript.js — source vue directement, utilise tseslint.configs.recommended]

### Pattern 2 : Configuration knip pour Next.js App Router

knip détecte automatiquement Next.js via `package.json` (clé `next`). Le plugin Next.js inclut nativement les App Router entry points (`layout`, `page`, `route`, `error`, etc.).

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "project": ["src/**/*.{ts,tsx}", "scripts/**/*.ts"],
  "ignore": [
    "src/__tests__/**",
    "**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}"
  ],
  "ignoreDependencies": [],
  "ignoreExportsUsedInFile": true
}
```

**Note importante :** Ne pas surcharger `entry` — le plugin Next.js gère déjà les entrées App Router. Surcharger `entry` écrase les defaults.

[VERIFIED: knip.dev/reference/plugins/next — Next.js plugin auto-activé si `next` dans dependencies]
[CITED: https://knip.dev/reference/plugins/next]

### Pattern 3 : Script custom `scripts/audit-code.ts`

Modèle basé sur `audit-full.ts` existant (pattern `check(group, name, passed, detail)`). Le script custom couvre ce qu'ESLint et knip ne voient pas :

```typescript
// Pattern établi dans audit-full.ts — réutiliser tel quel
interface CheckResult {
  group: string
  name: string
  passed: boolean
  detail: string
}

// Catégories à couvrir dans audit-code.ts :
// 1. SÉCURITÉ : inline styles avec données utilisateur, missing Zod validation sur routes
// 2. PERFORMANCE : boucles for/forEach contenant des appels await supabase (N+1)
// 3. CSS : classes module.css non utilisées, variables --custom non définies dans globals.css
// 4. TYPESCRIPT : catch (err) sans `instanceof Error`, fonctions async sans try/catch
// 5. CONFIG : security headers absents dans next.config.ts, remotePatterns trop larges
```

[VERIFIED: scripts/audit-full.ts — lu directement, 291 lignes, pattern réutilisable]

### Pattern 4 : Format AUDIT.md

```markdown
# Audit Code — Möbel Unique
**Date :** 2026-04-08
**Périmètre :** src/ (77 TS/TSX, 20 CSS modules) + configs + scripts

## Résumé Exécutif
| Catégorie | Critical | Warning | Info |
...

## Sécurité (AUDIT-01)
### CRIT-SEC-01
**Fichier :** `src/app/api/simulate/route.ts:XX`
**Sévérité :** Critical
**Description :** ...

## Performance (AUDIT-02)
...

## Dead Code (AUDIT-03)
...

## TypeScript & Bonnes Pratiques (AUDIT-04)
...
```

### Anti-patterns à éviter

- **Ne PAS réinstaller `@typescript-eslint/eslint-plugin`** — il est déjà présent via `eslint-config-next` comme dépendance indirecte. Double installation créerait des conflits de versions.
- **Ne PAS lancer `knip --fix` dans cette phase** — D-14 interdit les corrections. `knip` en lecture seule uniquement.
- **Ne PAS utiliser `eslint --fix`** — même raison.
- **Ne PAS ignorer les faux positifs knip sans documentation** — noter chaque exclusion dans `knip.json` avec un commentaire.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser à la place | Pourquoi |
|----------|-------------------|---------------------|----------|
| Détection imports inutilisés | Grep `import.*from` + analyse manuelle | `npx knip` | knip construit un module graph complet, le grep rate les re-exports et dynamic imports |
| Détection exports morts | Grep `export` + comptage manuel | `npx knip` | knip suit les références cross-fichiers, impossible à faire manuellement sur 77 fichiers |
| Détection deps npm inutilisées | Manuel, `npm ls` | `npx knip` | knip inspecte les imports dans tout le code, y compris les imports dynamiques |
| Violations TypeScript | Script AST custom | `npx tsc --noEmit` + ESLint | Le compilateur TS et ESLint avec typescript-eslint sont les sources de vérité |
| Parsing AST pour règles custom | ts-morph, compiler API | Règles ESLint standard + script grep | Sur 77 fichiers, grep ciblé suffit ; l'AST custom est surdimensionné |

**Insight clé :** Les outils statiques (ESLint, knip, tsc) trouvent les problèmes structurels. Le script custom cible les patterns métier spécifiques à ce projet (requireAdmin, Supabase loops, CSS Modules violations) que les outils génériques ne voient pas.

---

## Problème Bloquant Identifié

### ESLint ne tourne pas — `has-property-descriptors` corrompu

**Symptôme :** `npm run lint` (ou `npx eslint src/`) échoue avec :
```
Error: Cannot find module '/Users/.../node_modules/has-property-descriptors/index.js'
```

**Cause :** Le package `has-property-descriptors@1.0.2` est dans `node_modules` mais son `index.js` est absent (installation incomplète ou corrompue). Le package declare `"main": "index.js"` mais le fichier n'existe pas physiquement.

**Solution :** Lancer `npm install` (sans flags) resynchronise `node_modules` avec `package-lock.json`. La commande `npm install --save-dev knip` effectue la même opération tout en ajoutant knip.

**Important :** `npm install --dry-run` affiche "removed 210 packages" — c'est normal, ces packages sont des dépendances transitives installées manuellement dans `node_modules` mais absentes de `package-lock.json`. Après `npm install`, les packages déclarés dans `package.json` (y compris leurs transitives) seront correctement installés.

[VERIFIED: node_modules directement — has-property-descriptors/index.js absent physiquement, confirmé par test Node.js require()]

---

## Common Pitfalls

### Pitfall 1 : knip signale tout comme orphelin dans App Router
**Ce qui se passe :** knip détecte des "unused files" pour les composants server/client Next.js parce qu'ils sont importés dynamiquement ou via des conventions (page.tsx, layout.tsx, route.ts) plutôt que par des imports explicites.
**Cause :** knip utilise les entry points du plugin Next.js, mais les composants imbriqués non réexportés peuvent sembler orphelins.
**Comment éviter :** Vérifier chaque fichier "orphan" reporté par knip manuellement avant de conclure qu'il est mort. Utiliser `ignoreExportsUsedInFile: true` dans knip.json.
**Signes précurseurs :** knip signale des fichiers dans `src/components/` qui ont clairement des imports dans d'autres fichiers.

### Pitfall 2 : typescript-eslint typed rules sans projectService
**Ce qui se passe :** Les règles `@typescript-eslint/no-floating-promises` et `@typescript-eslint/no-misused-promises` nécessitent le type checker. Sans `parserOptions.projectService: true`, elles ne s'activent pas ou crashent.
**Cause :** `eslint-config-next/typescript` n'active pas le type-aware linting par défaut (trop lent pour le CI Next.js).
**Comment éviter :** Si on veut les règles type-aware, ajouter explicitement `parserOptions: { projectService: true }` dans `eslint.config.mjs`. Sinon, se limiter aux règles recommended non-type-aware.
**Signes précurseurs :** ESLint prend > 30 secondes sur le projet ou crashe avec "project not found".

### Pitfall 3 : ESLint flat config incompatible avec anciens plugins
**Ce qui se passe :** Certains plugins ESLint anciens ne supportent pas le format flat config (ESLint 9). Importer un plugin legacy dans `eslint.config.mjs` cause une erreur de configuration.
**Cause :** ESLint 9 a changé le format de config. Les plugins doivent exporter un objet compatible flat config.
**Comment éviter :** N'ajouter que des plugins connus compatibles ESLint 9. `eslint-config-next` l'est depuis Next.js 15. Vérifier la compatibilité avant tout ajout.
**Signes précurseurs :** Erreur "The 'plugins' option must be an object".

### Pitfall 4 : Rapport AUDIT.md trop vague pour Phase 16
**Ce qui se passe :** Phase 16 doit corriger les problèmes sans re-analyser. Si AUDIT.md dit "la route X a un problème de sécurité" sans `fichier:ligne` + code snippet, Phase 16 perd du temps à retrouver le contexte.
**Cause :** Rapport généré trop rapidement, sans précision.
**Comment éviter :** Pour chaque finding, inclure : fichier:ligne, code source exact incriminé (1-3 lignes), description du problème, correction suggérée. Respecter D-09 et D-15.

### Pitfall 5 : `console.error` dans les routes API — Warning ou Info ?
**Ce qui se passe :** Toutes les routes admin utilisent `console.error('[route] message', error.message)`. C'est un pattern intentionnel (logging serveur), pas un bug.
**Cause :** La règle ESLint `no-console` signalerait tout ça comme warning si pas configurée correctement.
**Comment éviter :** Configurer `"no-console": ["warn", { allow: ["error", "warn"] }]` — les `console.error` sont autorisés. Ce finding doit être classé Info (pas Warning) dans AUDIT.md.

---

## Code Examples

### Lancer ESLint après correction node_modules

```bash
# Source: eslint.config.mjs existant + correction node_modules
npm install --save-dev knip      # installe knip ET corrige has-property-descriptors
npm run lint                     # = npx eslint src/ (via package.json scripts)
# Pour voir tout sans bloquer sur erreurs
npx eslint src/ --max-warnings 9999 2>&1 | tee /tmp/eslint-report.txt
```

### Lancer knip

```bash
# Source: knip.dev — Next.js plugin auto-detect
npx knip                         # rapport standard (fichiers, exports, deps)
npx knip --reporter json         # format JSON pour parsing
npx knip --include files,exports,dependencies  # les 3 catégories explicitement
```

### TypeScript check complet

```bash
# Source: tsconfig.json existant — strict: true déjà activé
npx tsc --noEmit                 # 0 erreurs actuellement (vérifié)
npx tsc --noEmit --strict        # idem, strict est déjà dans tsconfig
```

### Pattern du script custom (basé sur audit-full.ts)

```typescript
// Source: scripts/audit-full.ts — pattern check() réutilisable
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { glob } from 'tinyglobby'  // déjà dans devDependencies

const results: Array<{
  severity: 'Critical' | 'Warning' | 'Info'
  category: string
  file: string
  line: number
  description: string
  suggestion: string
}> = []

function finding(
  severity: 'Critical' | 'Warning' | 'Info',
  category: string,
  file: string,
  line: number,
  description: string,
  suggestion: string,
) {
  results.push({ severity, category, file, line, description, suggestion })
}

// Exemple : détecter await dans boucle (N+1 potential)
const tsFiles = await glob('src/**/*.{ts,tsx}', { cwd: process.cwd() })
for (const file of tsFiles) {
  const lines = readFileSync(resolve(file), 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (/for\s*\(|forEach|\.map\(/.test(line) && /await\s+supabase/.test(lines[i+1] ?? '')) {
      finding('Warning', 'Performance', file, i+1, 
        'await supabase dans boucle — potentiel N+1', 
        'Remplacer par une requête unique avec .in() ou .select() avec jointure')
    }
  })
}
```

[VERIFIED: tinyglobby déjà dans devDependencies (package.json vérifié)]
[VERIFIED: scripts/audit-full.ts — pattern lu directement]

---

## État du Codebase — Préparer l'Audit

### Ce qui est déjà propre (ne pas perdre de temps)

| Aspect | État | Preuve |
|--------|------|--------|
| TypeScript strict | OK | `npx tsc --noEmit` → 0 erreurs [VERIFIED] |
| Tests passants | OK | `npx vitest run` → 161/161 [VERIFIED] |
| `requireAdmin()` sur toutes routes admin | OK | 16/16 routes admin vérifiées [VERIFIED: grep] |
| Zéro `any` explicite dans src/ | OK | `grep ": any\|as any" src/` → 0 résultats [VERIFIED] |
| Zéro `@ts-ignore` / `@ts-expect-error` | OK | 0 occurrences [VERIFIED] |
| Zéro `eval` ou `innerHTML` | OK | 0 occurrences [VERIFIED] |
| `dangerouslySetInnerHTML` | OK | 0 occurrences [VERIFIED] |

### Zones à inspecter en priorité

| Zone | Problème potentiel | Outil recommandé |
|------|--------------------|------------------|
| `next.config.ts` | Absence de security headers (CSP, X-Frame-Options, Referrer-Policy) | Script custom + revue manuelle |
| `src/components/public/Catalogue/ConfiguratorModal.tsx` | 6 occurrences `style={{}}` (objectFit + progress bar) | ESLint `react/forbid-component-props` ou note Info |
| `src/app/api/admin/**` (boucles) | Potentiel N+1 si boucles Supabase présentes | Script custom + revue |
| `scripts/` | audit-full.ts, verify-*.ts — ces scripts ont-ils du dead code ? | knip |
| CSS modules (20 fichiers) | Classes définies mais non utilisées | knip (CSS classes) ou stylelint |
| `src/app/page.module.css` | Vide ou classes orphelines ? | knip |
| `console.log` dans src/ (8 occurrences) | Log debug en production (routes API — `console.error` OK) | ESLint `no-console` |

[VERIFIED: toutes les vérifications ci-dessus effectuées par grep direct sur le codebase]

---

## State of the Art

| Ancienne approche | Approche actuelle (2025) | Impact |
|-------------------|--------------------------|--------|
| `.eslintrc.json` (legacy config) | `eslint.config.mjs` (flat config) | ESLint 9+ required, Next.js 16 compatible |
| `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` séparés | `typescript-eslint` (package unifié) | Déjà inclus via eslint-config-next, ne pas dupliquer |
| `ts-prune` pour exports morts | `knip` | knip couvre fichiers + exports + deps en un seul outil, supporte App Router |
| `depcheck` pour deps npm | `knip` | idem |
| `eslint-config-next` avec `.eslintrc` | `eslint-config-next` avec flat config | Support flat config ajouté dans Next.js 15+ |

**Déprécié / obsolète :**
- `.eslintrc.json` : déprécié ESLint 9, supprimé ESLint 10 — ce projet utilise correctement flat config
- `ts-prune` : abandonné, remplacé par knip
- `@typescript-eslint` packages séparés (parser + plugin) : toujours fonctionnels mais la recommandation 2025 est le package unifié `typescript-eslint`

[CITED: https://typescript-eslint.io/users/configs/]
[CITED: https://nextjs.org/docs/app/api-reference/config/eslint]

---

## Assumptions Log

| # | Claim | Section | Risk si faux |
|---|-------|---------|--------------|
| A1 | `npm install --save-dev knip` suffira à corriger `has-property-descriptors` (resync node_modules) | Problème Bloquant | ESLint restera cassé — fallback : `npm ci` ou supprimer node_modules + reinstaller |
| A2 | knip trouvera peu de fichiers orphelins (codebase bien structuré) | ASSUMED | Pourrait y avoir des exports morts dans les composants admin |
| A3 | `@typescript-eslint/no-floating-promises` ne nécessite pas de config supplémentaire au-delà de ce que eslint-config-next fournit | ASSUMED | La règle pourrait nécessiter `parserOptions.project` explicite |

---

## Open Questions

1. **ESLint typed linting (parserOptions.project)**
   - Ce qu'on sait : eslint-config-next/typescript inclut recommended sans type-aware. Les règles `no-floating-promises` sont plus riches mais demandent plus de config.
   - Ce qui est flou : est-ce que le gain justifie la complexité additionnelle pour un audit one-shot ?
   - Recommandation : Commencer sans. Si ESLint passe en < 30 secondes après `npm install`, activer `parserOptions: { projectService: true }` et ajouter les règles type-aware en bonus.

2. **CSS modules : classes inutilisées**
   - Ce qu'on sait : knip supporte les CSS modules dans certaines configurations mais c'est expérimental.
   - Ce qui est flou : knip 6.x détecte-t-il fiablement les classes CSS modules non utilisées ?
   - Recommandation : Pour les 20 CSS modules, un grep manuel sur les class names (ou stylelint-no-unused-selectors) sera plus fiable que knip pour ce cas précis.

---

## Environment Availability

| Dépendance | Requise par | Disponible | Version | Fallback |
|------------|------------|------------|---------|---------|
| Node.js v22 | npm install, npx tsx | ✓ | 24.11.1 (> 22) | — |
| npm | Installation knip | ✓ | via node | — |
| ESLint | Audit TypeScript/JS | ✓ (installé, cassé) | 9.39.4 | Correction via npm install |
| knip | Dead code audit | Installable | 6.3.1 | npx knip (auto-install) |
| TypeScript (tsc) | Type checking | ✓ | via devDependencies | — |
| tinyglobby | Script custom (glob files) | ✓ | dans devDependencies | — |
| tsx | Exécution scripts TS | Disponible via npx | npx tsx | — |

**Dépendance bloquante :**
- `has-property-descriptors` corrompu bloque ESLint. Solution : `npm install` resynchronise.

**Aucune dépendance externe (API, DB, service) requise.** L'audit est entièrement statique — pas besoin du serveur dev.

---

## Validation Architecture

> `workflow.nyquist_validation` absent de `.planning/config.json` → traité comme activé.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIT-01..04 | L'audit produit un AUDIT.md avec findings | manual-only | N/A | ❌ |

**Note :** Cette phase ne produit pas de nouveau code fonctionnel — elle produit un rapport. Les tests automatisés ne s'appliquent pas. La validation se fait en vérifiant que AUDIT.md contient les 4 catégories requises et que tous les findings ont le format `fichier:ligne + sévérité + description`.

### Wave 0 Gaps
Aucun test à écrire pour cette phase. Les 161 tests existants (`npx vitest run`) restent verts et servent de filet de régression pour vérifier que les outils d'audit (ESLint, knip, tsc) n'ont pas cassé quoi que ce soit.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | S'applique | Contrôle standard |
|---------------|-----------|-------------------|
| V2 Authentication | Partiel — vérifier requireAdmin() | Pattern requireAdmin() déjà en place sur 16/16 routes admin |
| V3 Session Management | Partiel — token refresh via proxy.ts | Supabase SSR + middleware proxy.ts (pattern établi) |
| V4 Access Control | Oui — RLS Supabase + requireAdmin() | Vérifier que les routes publiques n'exposent pas de données admin |
| V5 Input Validation | Oui | Zod 4 sur toutes les routes — vérifier completeness |
| V6 Cryptography | Non applicable | Pas de crypto custom — Supabase gère |

### Threat Patterns Connus pour Next.js App Router

| Pattern | STRIDE | Mitigation standard |
|---------|--------|---------------------|
| Route admin sans requireAdmin() | Élévation de privilèges | requireAdmin() sur chaque route — déjà vérifié OK |
| Input utilisateur non validé avant Supabase | Injection/Tampering | Zod validation avant toute requête DB |
| N+1 queries en boucle | Performance DoS | .in() ou jointure Supabase plutôt que loop |
| Secrets côté client (NEXT_PUBLIC_) | Divulgation | `NANO_BANANA_API_KEY` est serveur-only — OK |
| Security headers absents (CSP, X-Frame-Options) | XSS, Clickjacking | `headers()` dans next.config.ts |
| Inline styles avec données utilisateur | XSS (mineur) | Les 6 occurrences style={{}} sont des valeurs fixes — vérifier |

---

## Sources

### Primary (HIGH confidence)
- `node_modules/` direct — versions installées, état corruption has-property-descriptors
- `package.json` + `package-lock.json` — dépendances déclarées et lockfile
- `eslint.config.mjs` existant — config ESLint actuelle
- `node_modules/eslint-config-next/dist/typescript.js` — règles @typescript-eslint incluses
- `scripts/audit-full.ts` — pattern de script d'audit réutilisable
- npm registry (`npm view`) — knip 6.3.1, typescript-eslint 8.58.1

### Secondary (MEDIUM confidence)
- [knip.dev/reference/plugins/next](https://knip.dev/reference/plugins/next) — Next.js plugin, entrées App Router auto-détectées
- [typescript-eslint.io/users/configs/](https://typescript-eslint.io/users/configs/) — configs disponibles (recommended vs strictTypeChecked)
- [nextjs.org/docs/app/api-reference/config/eslint](https://nextjs.org/docs/app/api-reference/config/eslint) — ESLint config Next.js 16

### Tertiary (LOW confidence)
- Aucun

---

## Metadata

**Confidence breakdown :**
- Standard Stack : HIGH — versions vérifiées via npm et node_modules
- Architecture : HIGH — basée sur fichiers existants lus directement
- Pitfalls : HIGH — basée sur analyse directe du code + comportement ESLint observé
- Problème bloquant : HIGH — confirmé par test Node.js require() direct

**Research date :** 2026-04-08
**Valid until :** 2026-05-08 (knip et ESLint sont stables, 30 jours suffisants)
