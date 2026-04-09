---
phase: 14-audit-code
plan: "01"
subsystem: outillage-audit
tags: [eslint, knip, audit, typescript, securite]
dependency_graph:
  requires: []
  provides:
    - eslint-renforce
    - knip-configure
    - audit-code-script
  affects:
    - .planning/phases/14-audit-code/14-02
tech_stack:
  added:
    - knip 6.3.1 (devDependency)
  patterns:
    - Script analyse statique avec tinyglobby + node:fs (pattern audit-full.ts reutilise)
    - Interface Finding avec severity/category/file/line
key_files:
  created:
    - knip.json
    - scripts/audit-code.ts
  modified:
    - eslint.config.mjs
    - package.json
    - package-lock.json
decisions:
  - ESLint renforcee avec regles no-explicit-any, no-eval, no-console (sans type-aware linting pour eviter Pitfall 2)
  - knip.json sans surcharge entry (plugin Next.js gere les entrees App Router nativement)
  - Script audit-code.ts en lecture seule (per D-14) - aucun fix automatique
metrics:
  duration: "30 minutes"
  completed: "2026-04-09"
  tasks_completed: 2
  files_changed: 5
---

# Phase 14 Plan 01: Outillage Audit (knip + ESLint + script custom) Summary

**One-liner:** knip 6.3.1 installe + ESLint renforce (no-explicit-any/no-eval/no-console) + script audit-code.ts 425 lignes detectant 10 categories de patterns securite/performance/TypeScript

## What Was Built

Outillage d'audit permanent pour Möbel Unique : trois outils complementaires qui alimenteront le rapport AUDIT.md en Plan 02.

1. **ESLint renforce** (`eslint.config.mjs`) : ajout d'un bloc de regles supplementaires apres les spreads `nextVitals` et `nextTs`. Nouvelles regles : `@typescript-eslint/no-explicit-any` (error), `@typescript-eslint/no-unused-vars` (error, argsIgnorePattern `^_`), `no-console` (warn, allow error/warn), `no-eval` (error), `no-implied-eval` (error). ESLint detecte maintenant 32 problemes (8 errors, 24 warnings) sur le codebase.

2. **knip 6.3.1** (`knip.json`) : configure pour Next.js App Router avec `ignoreExportsUsedInFile: true` pour eviter les faux positifs. Detecte 6 unused dependencies/devDependencies, 2 unused exports, 6 unused exported types.

3. **Script `scripts/audit-code.ts`** (425 lignes) : analyse statique ciblee sur les patterns metier non couverts par ESLint et knip. Produit du JSON sur stdout et un resume `Critical/Warning/Info` sur stderr.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Installer knip + renforcer ESLint config + creer knip.json | 63000ef |
| 2 | Creer scripts/audit-code.ts (analyse statique 10 categories) | 09344ff |

## Verification Results

- `npx eslint src/ --max-warnings 9999` : tourne sans crash, 32 problemes detectes
- `npx knip` : tourne sans crash, rapport complet (deps inutilisees, exports morts)
- `npx tsx scripts/audit-code.ts` : JSON valide, 0 Critical, 35 Warning, 17 Info
- `npx vitest run` : 161/161 tests passent (regression OK)
- `git diff src/` : 0 octets modifies (aucun fichier source touche, per D-14)

## Script Audit — Categories et Resultats

| Categorie | Check | Resultats |
|-----------|-------|-----------|
| Securite | Routes admin sans requireAdmin() | 0 Critical (toutes les routes OK) |
| Securite | Routes POST/PUT sans Zod | 1 Warning (simulate route - faux positif probable) |
| Securite | Security headers next.config.ts | 4 warnings (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP absents) |
| Securite | Inline styles dynamiques | 17 Info (style={{}} dans ConfiguratorModal) |
| Performance | await dans boucle N+1 | 0 Warning (aucun N+1 detecte) |
| Performance | console.log en production | 10 Info (dans lib/ai/) |
| TypeScript | catch sans typage | 3 Info |
| TypeScript | Handlers sans try/catch | 20 Warning |
| Config | remotePatterns trop large | 0 Warning (hostname: '**.supabase.co' OK) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocage] Correction node_modules corrompus (has-property-descriptors + object-keys)**
- **Trouve pendant:** Task 1
- **Probleme:** Deux packages avec fichiers manquants : `has-property-descriptors/index.js` et `object-keys/isArguments.js`. ESLint crashait avec "Cannot find module".
- **Fix:** Suppression complete de `node_modules` + `package-lock.json`, puis `npm install` propre. Corriger `object-keys` separement via `npm install object-keys --force`, puis retirer la dependance directe avec `npm uninstall object-keys`.
- **Note:** La suppression de `node_modules` a pris ~10 minutes a cause de repertoires avec des espaces dans les noms (`.next 2-NKm3uxJr`, `@testing-library 2`, etc.) issus d'une installation concurrente corrompue.
- **Fichiers modifies:** `package.json`, `package-lock.json`
- **Commits:** 63000ef

## Known Stubs

Aucun stub — ce plan produit uniquement de l'outillage, pas d'interface utilisateur.

## Threat Flags

Aucune nouvelle surface de securite introduite. Les outils sont en lecture seule et n'exposent rien sur le reseau.

## Self-Check: PASSED

- eslint.config.mjs : FOUND
- knip.json : FOUND
- scripts/audit-code.ts : FOUND
- Commit 63000ef (Task 1) : FOUND
- Commit 09344ff (Task 2) : FOUND
