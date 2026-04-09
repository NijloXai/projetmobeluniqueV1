# Phase 15: Tests Unitaires Vitest - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 15-tests-unitaires-vitest
**Areas discussed:** Stratégie requireAdmin 401, Profondeur utils, Organisation fichiers test, Couverture timeout NanoBanana

---

## Stratégie requireAdmin 401

| Option | Description | Selected |
|--------|-------------|----------|
| Mock requireAdmin en erreur | Mocker requireAdmin() pour retourner { error } sur les routes admin. Rapide, isolé. | |
| Test unitaire requireAdmin direct | Tester requireAdmin() en isolation en mockant Supabase auth. Plus profond. | |
| Les deux | Test unitaire requireAdmin + test route 401. Couverture maximale. | ✓ |

**User's choice:** Les deux — test unitaire requireAdmin direct ET mock en erreur sur les routes admin.
**Notes:** Couverture maximale préférée.

---

## Profondeur utils

| Option | Description | Selected |
|--------|-------------|----------|
| Exhaustif | slugify accents rares, calculatePrice négatif, extractStoragePath malformé. ~15-20 tests. | |
| Basique | 2-3 cas par fonction. ~8-10 tests. | |
| Claude décide | Claude choisit les cas limites pertinents selon le code. | ✓ |

**User's choice:** Claude décide — flexibilité sur le nombre et les cas choisis.

---

## Organisation fichiers test

| Option | Description | Selected |
|--------|-------------|----------|
| Garder src/__tests__/ | Nouveaux tests dans src/__tests__/ comme les existants. Cohérent. | ✓ |
| Colocated avec le code source | Tests à côté du fichier testé (src/lib/utils.test.ts). | |
| Mixte | Utils et admin dans src/lib/, routes dans src/__tests__/. | |

**User's choice:** Garder src/__tests__/ — cohérence avec les 14 fichiers existants.

---

## Couverture timeout NanoBanana

| Option | Description | Selected |
|--------|-------------|----------|
| Oui, test dédié | Test timeout 30s dans nano-banana.test.ts. Le service lui-même non testé. | ✓ |
| Non, couverture suffisante | Déjà testé via les routes (504 sur AbortError). Redondant. | |

**User's choice:** Oui, test dédié — tester le timeout au niveau du service, pas seulement via les routes.

---

## Claude's Discretion

- Nombre exact de cas limites par fonction utils
- Détails d'implémentation des mocks Supabase auth
- Structure interne des describe/it
- Gestion des timers Vitest pour le test timeout
