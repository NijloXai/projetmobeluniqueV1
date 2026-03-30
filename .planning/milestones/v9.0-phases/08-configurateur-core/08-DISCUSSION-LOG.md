# Phase 8: Configurateur core - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-03-29
**Phase:** 08-configurateur-core
**Mode:** assumptions
**Areas analyzed:** Filtrage tissus, Prix dynamique, Etat de selection, Layout modal

## Assumptions Presented

### Filtrage tissus par modele
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Filtrer en derivant depuis visuals[] et fabrics[] dans ConfiguratorModal | Confident | Phase 7 D-07/D-08, database.ts types |
| Exclure tissus sans swatch_url de la grille | Likely | database.ts Fabric.swatch_url nullable, spec "miniatures swatch_url" |

### Prix dynamique
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Importer calculatePrice + formatPrice de utils.ts, retirer "a partir de" | Likely | utils.ts lignes 16+24, ConfiguratorModal formatPrice local |

### Etat de selection
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| useState<string|null> sans pre-selection, pas de Zustand | Confident | REQUIREMENTS.md Out of Scope, success criteria fallback |

### Layout modal
| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Remplacer placeholder, conserver layout 2 colonnes existant | Confident | ConfiguratorModal.module.css .inner flex, .placeholder zone |

## Corrections Made

No corrections — all assumptions confirmed.

---

*Log generated: 2026-03-29*
