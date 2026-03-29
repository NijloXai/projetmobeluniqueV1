# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v8.0 — Catalogue Produits

**Shipped:** 2026-03-29
**Phases:** 3 | **Plans:** 5 | **Tasks:** 12

### What Was Built
- Catalogue produits responsive avec images Supabase, skeleton loading et Suspense
- Barre de recherche accent-insensitive avec compteur et etat vide
- ConfiguratorModal dialog natif accessible (focus trap, Escape, backdrop, retour focus)
- 74 tests unitaires couvrant toute la chaine catalogue

### What Worked
- TDD RED-GREEN : les tests ecrits avant implementation ont attrape un conflit aria-label en Phase 05
- Server/Client boundary claire : CatalogueSection (async Server) + CatalogueClient (state) evite le waterfall
- Dialog natif au lieu de Radix Dialog : zero dependance, focus trap gratuit via showModal()
- UAT automatisee via Chrome DevTools MCP : 3 tests valides en 2 minutes sans intervention humaine

### What Was Inefficient
- getPrimaryImage et formatPrice dupliques entre ProductCard et ConfiguratorModal — a extraire en v9.0
- Le placeholder modal est intentionnel mais ajoute un composant qui sera entierement reecrit en v9.0

### Patterns Established
- Architecture Server Component (fetch) → Client Component (state) pour toutes les sections data-driven
- CSS Modules + dialog natif + CSS custom properties : zero dependance UI externe
- Normalisation accents via NFD decomposition + regex pour recherche francaise

### Key Lessons
1. Le dialog natif HTML couvre 95% des besoins modaux sans librairie — showModal() gere focus trap et inert
2. Les tests RED avant implementation forcent a definir le contrat comportemental proprement
3. La barre de recherche doit normaliser les accents des le depart pour le francais

### Cost Observations
- Model mix: ~20% opus, ~80% sonnet (executors et verifiers en sonnet)
- Timeline: 2 jours (28 mars → 29 mars)
- Notable: 3 phases executees en une session avec verification UAT automatisee

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v7.0 | 3 | 3 | Fondation visuelle, pattern Server Component etabli |
| v8.0 | 3 | 5 | TDD systematique, UAT automatisee via MCP |

### Cumulative Quality

| Milestone | Tests | Zero-Dep Additions |
|-----------|-------|-------------------|
| v7.0 | ~30 | motion/react, lucide-react |
| v8.0 | 74 | @testing-library/user-event (dev only) |

### Top Lessons (Verified Across Milestones)

1. CSS Modules + variables custom = suffisant pour tout le design system (confirme v7.0 + v8.0)
2. Server Components async + Suspense = pattern optimal pour les sections data-driven (confirme v8.0)
