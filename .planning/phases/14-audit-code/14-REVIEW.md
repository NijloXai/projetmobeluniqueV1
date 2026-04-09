---
phase: 14-audit-code
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - eslint.config.mjs
  - knip.json
  - package.json
  - scripts/audit-code.ts
findings:
  critical: 0
  warning: 5
  info: 5
  total: 10
status: issues_found
---

# Phase 14 : Rapport de revue de code

**Reviewed:** 2026-04-09
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Revue des 4 fichiers de configuration et du script d'audit statique introduits en phase 14.
Aucun problème critique de sécurité. Cinq avertissements identifiés, dont deux bugs logiques
dans `scripts/audit-code.ts` (fenêtre de détection trop étroite, faux positifs/négatifs) et
une mauvaise catégorisation de dépendance dans `package.json`. Cinq items informatifs couvrent
des incohérences mineures de configuration et des redondances.

---

## Warnings

### WR-01: `@types/archiver` mal placé dans `dependencies` (production)

**File:** `package.json:41`
**Issue:** `@types/archiver` est déclaré dans `dependencies` au lieu de `devDependencies`.
Les packages `@types/*` sont des déclarations TypeScript utilisées uniquement à la compilation.
Les inclure dans `dependencies` les embarque dans le bundle de production et gonfle inutilement
`node_modules` côté serveur.
**Fix:**
```json
// Déplacer de "dependencies" vers "devDependencies"
"devDependencies": {
  "@types/archiver": "^7.0.0",
  // ...autres devDeps
}
```

---

### WR-02: `@types/node` épinglé sur `^20` alors que le projet cible Node 22

**File:** `package.json:44`
**Issue:** Le projet exige Node v22 (mentionné dans CLAUDE.md via `.nvmrc`), mais
`@types/node` est à `"^20"`. Les API Node.js disponibles depuis la v21/v22
(ex. nouvelles méthodes `fs`, API natives) ne seront pas typées correctement.
Cela peut masquer des erreurs de type au moment de la compilation.
**Fix:**
```json
"@types/node": "^22"
```

---

### WR-03: Fenêtre de détection trop petite dans `checkRouteHandlerTryCatch`

**File:** `scripts/audit-code.ts:342`
**Issue:** La détection du `try {` se limite aux 10 lignes suivant la signature du handler
(`lines.slice(i + 1, i + 10)`). Un handler qui commence par plusieurs déclarations de variables,
la récupération des params, ou des early returns avant le `try` dépassera cette fenêtre et sera
signalé à tort comme "sans try/catch" (faux positif). En pratique, un handler bien structuré
avec `requireAdmin()` + `request.json()` + `safeParse()` peut facilement placer le `try` après
la ligne 10.
**Fix:**
```typescript
// Agrandir la fenêtre à 20 lignes, ou rechercher dans tout le corps de la fonction
const bodyLines = lines.slice(i + 1, i + 20)
const hasTryCatch = bodyLines.some((bl) => /try\s*\{/.test(bl))
```

---

### WR-04: Regex `checkInlineStyles` produit des faux positifs et mélange deux concerns

**File:** `scripts/audit-code.ts:207-208`
**Issue:** La condition `hasDynamicValue` a deux problèmes :
1. La vérification d'exclusion `!/style=\{\{[^}]*:\s*['"\`]/.test(stylePart.substring(0, 50))`
   ne porte que sur les 50 premiers caractères de `stylePart`. Si le style commence plus loin
   dans la ligne (ligne longue), des valeurs littérales seront classées comme "dynamiques".
2. La regex principale matchera `style={{ objectFit: cover }}` où `cover` est un mot-clé CSS
   valide (pas une variable JS). Le check vise le XSS potentiel mais signalera des styles CSS
   entièrement valides et inoffensifs.
**Fix:**
```typescript
// Option 1 : tronquer le stylePart plutôt que la ligne entière
const styleContent = stylePart.replace(/^style=\{\{/, '').replace(/\}\}.*$/, '')
const hasDynamicValue =
  /:\s*[a-zA-Z_$][a-zA-Z0-9_$.]*\s*[,}]/.test(styleContent) &&
  !/:\s*['"`]/.test(styleContent)

// Option 2 : limiter la check à des patterns clairement dangereux
// ex. style={{ __html: ... }} ou injection via dangerouslySetInnerHTML
```

---

### WR-05: `lucide-react` version `^1.7.0` suspecte — version probablement invalide

**File:** `package.json:29`
**Issue:** `lucide-react` n'a pas de version `1.x` publiée sur npm. Le package a migré
vers un schéma de versioning `0.x` (ex. `0.468.0`). La version `^1.7.0` provoquera une
erreur `npm install` ("No matching version found") dans un environnement propre, bloquant
le build CI et l'onboarding de nouveaux développeurs.
**Fix:** Vérifier la version installée en local et l'épingler correctement :
```bash
npm ls lucide-react  # voir la version réelle installée
```
Puis dans `package.json` :
```json
"lucide-react": "^0.468.0"  // adapter à la version réelle
```

---

## Info

### IN-01: `"ignoreDependencies": []` superflu dans `knip.json`

**File:** `knip.json:9`
**Issue:** Le tableau vide `"ignoreDependencies": []` est la valeur par défaut de Knip.
Le déclarer explicitement n'apporte rien et crée du bruit dans la config.
**Fix:** Supprimer la ligne ou la laisser commentée pour référence future.

---

### IN-02: Absence de `entry` dans `knip.json` — risque de faux positifs

**File:** `knip.json`
**Issue:** Knip n'a pas de configuration `entry` explicite pour un projet Next.js App Router.
Sans points d'entrée définis, Knip essaie de les déduire depuis `package.json`. Pour Next.js,
les fichiers `page.tsx`, `layout.tsx` et `route.ts` sont des points d'entrée implicites que
Knip peut ne pas détecter correctement, générant des faux positifs sur des exports utilisés
par le framework.
**Fix:**
```json
{
  "entry": [
    "src/app/**/{page,layout,route,loading,error,not-found}.{ts,tsx}",
    "src/app/layout.tsx",
    "scripts/**/*.ts"
  ]
}
```

---

### IN-03: Règle `no-console` en `warn` alors que le projet interdit les `console.log`

**File:** `eslint.config.mjs:14`
**Issue:** La règle est configurée en `warn` au lieu d'`error`. `audit-code.ts` détecte
les `console.log` comme finding, mais ESLint ne bloque pas le commit/build. Incohérence
entre la politique documentée (zéro code mort) et la configuration ESLint effective.
**Fix:**
```js
"no-console": ["error", { allow: ["error", "warn"] }],
```

---

### IN-04: Regex `checkCatchTyping` trop étroite — faux négatifs silencieux

**File:** `scripts/audit-code.ts:300`
**Issue:** Le pattern `/catch\s*\(\s*(err|error|e|ex|exception)\s*\)/` ne couvre qu'une
liste fixe de noms de variable. Des noms courants comme `caught`, `failure`, `reason`,
`cause`, ou des noms métier (`supabaseError`, `aiError`) ne seront jamais analysés,
produisant des faux négatifs silencieux — des catch mal typés passeront inaperçus.
**Fix:**
```typescript
// Capturer n'importe quel catch avec une variable nommée
const catchMatch = /catch\s*\(\s*(\w+)\s*\)/.exec(line)
```

---

### IN-05: Condition redondante dans `checkRequireAdmin`

**File:** `scripts/audit-code.ts:67`
**Issue:** La condition
`content.includes('requireAdmin()') || content.includes('requireAdmin(')`
est redondante : `'requireAdmin('` est un sous-ensemble strict de `'requireAdmin()'`.
La première condition ne sera jamais vraie indépendamment de la seconde.
**Fix:**
```typescript
const hasRequireAdmin = content.includes('requireAdmin(')
```

---

_Reviewed: 2026-04-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
