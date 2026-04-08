---
phase: 13-nanobananaservice
type: code-review-fix
status: all_fixed
findings_in_scope: 6
fixed: 6
skipped: 0
iteration: 1
fixed_at: 2026-04-08T15:45:00Z
review_path: .planning/phases/13-nanobananaservice/13-REVIEW.md
---

# Phase 13 : Code Review Fix Report

**Fixed at:** 2026-04-08T15:45:00Z
**Source review:** .planning/phases/13-nanobananaservice/13-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### WR-01: isRetryableError -- substring matching trop large

**Files modified:** `src/lib/ai/nano-banana.ts`
**Commit:** b28817f
**Applied fix:** Remplacement de `msg.includes('429')`, `msg.includes('500')`, etc. par des regex avec word boundaries (`/\b429\b/`, `/\b50[023]\b/`) pour eviter les faux positifs sur des chaines contenant ces chiffres dans un autre contexte.

### WR-02: generate-all -- catch externe ImageSafetyError unreachable (code mort)

**Files modified:** `src/app/api/admin/generate-all/route.ts`
**Commit:** 15ad3fd
**Applied fix:** Suppression du check `err instanceof ImageSafetyError` dans le catch externe (code mort car toutes les erreurs sont capturees dans la boucle interne). Suppression de l'import `ImageSafetyError` devenu inutilise.

### WR-03: rateMap sans eviction -- croissance memoire illimitee

**Files modified:** `src/app/api/simulate/route.ts`
**Commit:** aebeca2
**Applied fix:** Ajout d'une eviction periodique des entrees expirees dans `checkRateLimit()`. Quand `rateMap.size > 1000`, les entrees dont `resetAt` est depasse sont supprimees avant de traiter la requete courante.

### WR-04: Rate-limit consomme un slot AVANT la validation du body

**Files modified:** `src/app/api/simulate/route.ts`
**Commit:** 6db2722
**Applied fix:** Deplace le check `checkRateLimit(ip)` apres le parsing FormData et la validation des champs requis (image, model_id). Les requetes invalides (FormData vide, image manquante, model_id absent) ne consomment plus de slot rate-limit.

### WR-05: resolveImagePart -- crash sur data URI malformee (sans virgule)

**Files modified:** `src/lib/ai/nano-banana.ts`
**Commit:** 05631cc
**Applied fix:** Remplacement du `split(',')` destructure par un `indexOf(',')` avec guard clause explicite. Si la virgule est absente, une erreur claire est levee au lieu d'envoyer `undefined` au SDK Gemini. Ajout d'optional chaining sur l'extraction du mimeType avec fallback `image/jpeg`.

### WR-06: Default watermark text inconsistant entre NanoBanana et Mock

**Files modified:** `src/lib/ai/nano-banana.ts`
**Commit:** 2beaf36
**Applied fix:** Alignement du texte par defaut du watermark de `'MOBEL UNIQUE -- Apercu'` (ASCII) vers `'MOBEL UNIQUE \u2014 Apercu'` (Unicode : o trema, tiret cadratin, c cedille) pour correspondre exactement au MockIAService et respecter le contrat factory.

## Skipped Issues

Aucun finding skip.

---

_Fixed: 2026-04-08T15:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
