# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v10.0 — Simulation IA Salon

**Shipped:** 2026-04-07
**Phases:** 3 | **Plans:** 3 | **Tasks:** 4

### What Was Built
- Upload photo salon drag & drop avec preview blob, barre de progression animee, abort controller
- API /api/simulate : validation taille/format, fabric_id optionnel, watermark automatique, gestion HEIC
- Affichage resultat IA dans le modal avec fondu 400ms et disclaimer "Apercu genere par IA"
- 4 boutons action : telecharger JPEG (createElement a.download), partager Web Share API/WhatsApp, commander Shopify (conditionnel), relancer simulation
- Layout responsive mobile/desktop avec boutons dupliques par breakpoint CSS
- Dette technique v9.0 pre-resolue (VERIFICATION Phase 8, useRef, utils extraits)

### What Worked
- State machine explicite (idle → preview → generating → done → error) : transitions previsibles, debug facile
- Phase 11 (upload) et Phase 12 (affichage) bien decoupees : aucune interference, execution parallele possible
- Web Share API avec fallback WhatsApp : couverture maximale sans complexite
- Tests MCP visuels sur Chrome DevTools : validation E2E complete en 5 minutes (375px + 1280px)
- Plan Phase 12 tres detaille (code inline dans les actions) : executeur autonome sans deviation

### What Was Inefficient
- Code review Phase 11 CR-01 ("done state never rendered") etait un faux positif — le finding etait attendu car Phase 12 le resout. Les reviews devraient considerer le scope multi-phase.
- REQUIREMENTS.md tracabilite desynchronisee (v8.0 reqs "Pending", v10.0 reqs absents) — a maintenir incrementalement
- 3 HUMAN-UAT files avec status "partial" accumules sans resolution formelle

### Patterns Established
- Dual-render mobile/desktop (CSS hide/show par breakpoint) plutot que JS resize listener
- createElement('a') + download attribute pour telecharger des blobs
- navigator.canShare({files}) feature detection + fallback URL scheme (wa.me)
- URL.revokeObjectURL systematique sur chaque chemin de sortie (reset, back, close)

### Key Lessons
1. Les plans avec code inline dans les actions produisent une execution autonome parfaite — zero deviation
2. La state machine explicite simplifie le debug et la verification (grep des transitions)
3. Web Share API est disponible sur Chrome desktop — le fallback WhatsApp ne se declenche que sur les navigateurs sans support fichiers

### Cost Observations
- Model mix: ~30% opus (planner), ~70% sonnet (executor, reviewer, verifier, checker)
- Timeline: 1 jour (7 avril)
- Notable: Phase 12 planifiee + executee + verifiee en une seule session

---

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
| v9.0 | 3 | 3 | Configurateur tissu complet, navigation angles |
| v10.0 | 3 | 3 | Simulation IA E2E, plans ultra-detailles, state machine |

### Cumulative Quality

| Milestone | Tests | Zero-Dep Additions |
|-----------|-------|-------------------|
| v7.0 | ~30 | motion/react, lucide-react |
| v8.0 | 74 | @testing-library/user-event (dev only) |
| v9.0 | 74 | aucune |
| v10.0 | 74 | aucune |

### Top Lessons (Verified Across Milestones)

1. CSS Modules + variables custom = suffisant pour tout le design system (confirme v7.0 → v10.0)
2. Server Components async + Suspense = pattern optimal pour les sections data-driven (confirme v8.0)
3. Les plans avec code inline dans les actions produisent zero deviation a l'execution (confirme v10.0)
4. State machines explicites simplifient debug et verification (confirme v9.0 + v10.0)
