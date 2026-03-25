---
id: T02
parent: S01
milestone: M005
provides:
  - Interface IAService avec generate() et addWatermark()
  - MockIAService produisant de vrais JPEG via sharp avec fonds colorés et texte superposé
  - NanoBananaService stub qui lance une erreur descriptive
  - Factory getIAService() basculant selon NANO_BANANA_API_KEY
  - Templates de prompts configurables pour back-office et simulation salon
key_files:
  - src/lib/ai/types.ts
  - src/lib/ai/mock.ts
  - src/lib/ai/nano-banana.ts
  - src/lib/ai/prompts.ts
  - src/lib/ai/index.ts
key_decisions:
  - Le mock génère des JPEG 800x600 avec teinte HSL dérivée du nom de tissu pour variété visuelle
  - Le filigrane utilise un SVG semi-transparent rotatif composité via sharp
patterns_established:
  - Abstraction service IA : interface dans types.ts, implémentations séparées, factory dans index.ts
  - Pipeline SVG→sharp pour générer des images placeholder sans dépendances externes
observability_surfaces:
  - "[IA] Using mock provider" / "[IA] Using NanoBanana provider" logué à chaque appel factory
duration: 5m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T02: Abstraction service IA (src/lib/ai/)

**Créé la couche d'abstraction IA avec mock sharp générant de vrais JPEG 10KB+, stub NanoBanana, factory et templates de prompts — commentaires en français**

## What Happened

5 fichiers créés dans `src/lib/ai/` :
- **types.ts** — Interface `IAService` avec `generate()` et `addWatermark()`, types `GenerateRequest`/`GenerateResult`
- **mock.ts** — `MockIAService` via sharp : JPEG 800×600 avec fond HSL dérivé du hash du nom tissu + overlay SVG texte
- **nano-banana.ts** — `NanoBananaService` stub qui lance "Service Nano Banana 2 non configuré"
- **prompts.ts** — `buildBackOfficePrompt()` et `buildSimulatePrompt()` fonctions template
- **index.ts** — Factory `getIAService()` + ré-exports

## Verification

- 5 fichiers existent aux chemins prévus
- `npx tsc --noEmit` passe sans erreur
- Mock generate() produit 8808+ octets JPEG
- Mock addWatermark() produit un buffer plus grand que l'entrée
- Stub NanoBanana lance l'erreur attendue
- Fonctions prompt retournent des chaînes interpolées

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| V01 | `npx tsc --noEmit` | 0 | ✅ pass | 12s |
| V03 | `ls src/lib/ai/types.ts src/lib/ai/mock.ts src/lib/ai/index.ts` | 0 | ✅ pass | 0.1s |
| V05 | `node -e "require('sharp').versions.sharp"` | 0 | ✅ pass | 0.2s |
| V07 | `node -e "require('sharp')('nonexistent.png')..."` | 0 | ✅ pass | 0.2s |
| smoke | mock generate → 8808 octets JPEG | 0 | ✅ pass | 0.8s |
| smoke | NanoBanana lance erreur attendue | 0 | ✅ pass | 0.1s |

## Diagnostics

- Factory logue `[IA] Using mock provider` ou `[IA] Using NanoBanana provider` à chaque appel
- Sortie mock déterministe par nom de tissu (même hash → même teinte)

## Deviations

Aucune.

## Known Issues

Aucun.

## Files Created/Modified

- `src/lib/ai/types.ts` — Interface IAService + types GenerateRequest/GenerateResult
- `src/lib/ai/mock.ts` — MockIAService via sharp pour génération JPEG placeholder
- `src/lib/ai/nano-banana.ts` — NanoBananaService stub (erreur sur toutes les méthodes)
- `src/lib/ai/prompts.ts` — buildBackOfficePrompt + buildSimulatePrompt
- `src/lib/ai/index.ts` — Factory getIAService + ré-exports
