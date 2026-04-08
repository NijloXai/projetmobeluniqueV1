# Phase 14: Audit Code - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Auditer l'ensemble du codebase (~77 fichiers TS/TSX, 20 CSS modules, configs, scripts) pour identifier et documenter les problèmes de sécurité, performance, dead code et bonnes pratiques. Livrable : un rapport AUDIT.md structuré. Aucune correction n'est faite dans cette phase — les fixes sont prévus en Phase 16.

</domain>

<decisions>
## Implementation Decisions

### Outillage permanent
- **D-01:** Installer ESLint + @typescript-eslint avec règles recommandées — pas de config actuellement, cet outil reste après l'audit pour prévenir les régressions
- **D-02:** Installer knip pour détecter dead code, exports inutilisés, fichiers orphelins — outil permanent complémentaire à ESLint
- **D-03:** Les outils sont installés et configurés dans cette phase, puis utilisés pour alimenter le rapport d'audit

### Approche mixte
- **D-04:** GSD code-review (agent reviewer dédié) pour sécurité et qualité de code — produit un REVIEW.md structuré
- **D-05:** Script custom TypeScript pour dead code, imports inutilisés, violations TypeScript, patterns de sécurité, performance — complémentaire au review GSD
- **D-06:** Les deux livrables sont consolidés dans un AUDIT.md unique

### Format du rapport
- **D-07:** Fichier unique AUDIT.md avec sections par catégorie : Sécurité, Performance, Dead Code, TypeScript
- **D-08:** Sévérité 3 niveaux : Critical (faille sécurité ou bug) / Warning (à corriger) / Info (amélioration)
- **D-09:** Chaque finding formaté `fichier:ligne` + sévérité + description — navigable directement dans l'IDE
- **D-10:** Tout reporter sans seuil minimum — même les Info sont listés, on filtre ensuite pour les corrections

### Périmètre
- **D-11:** Audit exhaustif de tout `src/` — les 77 fichiers TS/TSX + 20 CSS modules
- **D-12:** Aussi auditer : tsconfig.json, next.config.ts (configs), CSS modules (classes inutilisées, incohérences globals.css), scripts/ (audit-full.ts, verify-*.ts)
- **D-13:** Aucune exclusion — le codebase est assez petit pour un audit complet

### Actions correctives
- **D-14:** Cette phase documente seulement — aucune correction de code. Les fixes sont prévus en Phase 16 (Tests E2E + Corrections Audit)
- **D-15:** Le rapport doit être assez détaillé pour que Phase 16 puisse corriger sans re-analyser

### Claude's Discretion
- Configuration ESLint : choix des règles spécifiques au-delà des recommandées
- Configuration knip : patterns d'exclusion si nécessaire
- Structure interne du script custom d'audit
- Ordre des sections dans AUDIT.md
- Niveau de détail des descriptions par finding

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Codebase existant
- `src/lib/ai/nano-banana.ts` — Service IA récent (Phase 13), code frais à auditer en priorité
- `src/lib/ai/types.ts` — Interface IAService
- `src/lib/ai/mock.ts` — Service mock Sharp
- `src/proxy.ts` — Middleware Next.js 16 (pattern auth critique)
- `src/lib/schemas.ts` — Schémas Zod partagés front/back

### Scripts existants
- `scripts/audit-full.ts` — Audit runtime existant (44 checks API) — à auditer aussi

### Configuration
- `tsconfig.json` — TypeScript strict: true, à vérifier pour completeness
- `next.config.ts` — Config Next.js 16

### Projet
- `.planning/ROADMAP.md` — Success criteria Phase 14 (4 critères)
- `.planning/PROJECT.md` — Conventions strictes (CSS Modules, pas Tailwind, français)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/audit-full.ts` — Pattern de script d'audit existant (check/result/summary), réutilisable comme base pour le script custom
- TypeScript `strict: true` déjà activé — la baseline est bonne

### Established Patterns
- Auth via `requireAdmin()` dans chaque route admin — pattern à vérifier systématiquement
- Supabase client direct (pas de Prisma) — vérifier les requêtes pour N+1
- Factory pattern IA (`getIAService()`) — vérifier que le pattern est respecté partout
- CSS Modules uniquement — vérifier qu'aucun style inline ou className string n'a fuité

### Integration Points
- ESLint s'intègre dans `package.json` scripts (`npm run lint`)
- knip s'intègre via `npx knip` ou script dédié
- Le rapport AUDIT.md sera lu par Phase 16 pour les corrections

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-audit-code*
*Context gathered: 2026-04-08*
