# Phase 14: Audit Code - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 14-audit-code
**Areas discussed:** Outillage audit, Format du rapport, Périmètre et priorité, Actions correctives

---

## Approche générale

| Option | Description | Selected |
|--------|-------------|----------|
| Audit GSD intégré | /gsd-code-review agent reviewer + /gsd-code-review-fix pour corriger | |
| Script d'audit custom | Script TypeScript vérifiant programmatiquement dead code, imports, types | |
| Audit mixte | GSD code-review pour sécurité/qualité + script custom pour dead code/imports | ✓ |

**User's choice:** Audit mixte
**Notes:** Complémentarité entre review humain-like (GSD) et vérification programmatique (script)

---

## Outillage audit

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal | Pas d'ESLint — audit one-shot seulement | |
| ESLint basique | eslint + @typescript-eslint recommandées | |
| ESLint + knip | ESLint pour qualité + knip pour dead code/exports inutilisés | ✓ |

**User's choice:** ESLint + knip
**Notes:** Deux outils permanents qui restent après l'audit

### Couverture script custom

| Option | Description | Selected |
|--------|-------------|----------|
| Dead code & imports | Imports inutilisés, fichiers orphelins, exports morts | ✓ |
| Violations TypeScript | any implicites, error handling manquant | ✓ |
| Sécurité patterns | Validation inputs, XSS, auth bypass, env vars | ✓ |
| Performance | Requêtes N+1, images, bundles, re-renders | ✓ |

**User's choice:** Tous les 4 axes
**Notes:** Audit exhaustif sur tous les critères de succès

---

## Format du rapport

| Option | Description | Selected |
|--------|-------------|----------|
| 3 niveaux | Critical / Warning / Info | ✓ |
| 4 niveaux | Critical / High / Medium / Low | |
| 2 niveaux | Must-fix / Nice-to-have | |

**User's choice:** 3 niveaux (Critical / Warning / Info)

| Option | Description | Selected |
|--------|-------------|----------|
| Fichier unique AUDIT.md | Sections par catégorie, findings fichier:ligne | ✓ |
| Multi-fichiers | Un fichier par catégorie | |
| REVIEW.md GSD | GSD review + AUDIT.md séparé | |

**User's choice:** Fichier unique AUDIT.md

---

## Périmètre et priorité

| Option | Description | Selected |
|--------|-------------|----------|
| Tout src/ | Audit exhaustif 77 fichiers TS/TSX + 20 CSS modules | ✓ |
| Prioriser routes API + lib/ | Focus sécurité et logique métier | |
| Phase 13 + routes critiques | Prioriser code récent NanoBananaService | |

**User's choice:** Tout src/

### Fichiers extra

| Option | Description | Selected |
|--------|-------------|----------|
| Config (tsconfig, next.config) | Settings build et sécurité | ✓ |
| CSS Modules | Classes inutilisées, incohérences globals.css | ✓ |
| Scripts existants | audit-full.ts et verify-*.ts | ✓ |

**User's choice:** Tous les extras

---

## Actions correctives

| Option | Description | Selected |
|--------|-------------|----------|
| Corriger immédiatement | Audit + fix dans la même phase | |
| Documenter seulement | Rapport seul, corrections Phase 16 | ✓ |
| Fix auto + rapport manuel | Fix triviaux auto, fix complexes documentés | |

**User's choice:** Documenter seulement

| Option | Description | Selected |
|--------|-------------|----------|
| Tout reporter | Aucun seuil, même les Info | ✓ |
| Warning+ seulement | Ignorer les Info | |
| Critical seulement | Focus failles et bugs | |

**User's choice:** Tout reporter

---

## Claude's Discretion

- Configuration ESLint spécifique
- Configuration knip
- Structure interne du script d'audit
- Ordre et format détaillé du rapport
