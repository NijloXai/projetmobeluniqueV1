# Phase 13: NanoBananaService - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 13-NanoBananaService
**Areas discussed:** Gestion d'erreurs Gemini, Stratégie generate-all, Logging et observabilité, Sécurité clé API

---

## Gestion d'erreurs Gemini

### IMAGE_SAFETY handling

| Option | Description | Selected |
|--------|-------------|----------|
| Erreur explicite français | "Cette image n'a pas pu être traitée (contenu non autorisé). Essayez une autre photo." — HTTP 422 | ✓ |
| Erreur générique | "La génération a échoué, veuillez réessayer." — pas de détail | |
| Skip silencieux (admin) | En admin skip l'angle refusé, en simulate erreur explicite | |

**User's choice:** Erreur explicite français
**Notes:** Message clair pour l'utilisateur final, HTTP 422

### Fallback après retries

| Option | Description | Selected |
|--------|-------------|----------|
| Pas de fallback | Erreur franche — pas de confusion mock/réel | ✓ |
| Fallback mock avec badge | Retombe sur MockIAService avec marqueur "Aperçu provisoire" | |
| Fallback mock silencieux | Bascule sur le mock sans prévenir | |

**User's choice:** Pas de fallback
**Notes:** Le client doit savoir que l'IA réelle a échoué

### Retry 5xx

| Option | Description | Selected |
|--------|-------------|----------|
| Même stratégie que 429 | 429 et 5xx retryés identiquement (1s/2s/4s + jitter) | |
| 429 uniquement | 5xx = erreur immédiate | |
| Tu décides | Claude choisit selon bonnes pratiques SDK Google | ✓ |

**User's choice:** Tu décides
**Notes:** Claude's discretion sur la stratégie 5xx

### Rate-limit /api/simulate

| Option | Description | Selected |
|--------|-------------|----------|
| Pas pour v11 | Rate-limit Gemini + retry suffit | |
| Limite simple par IP | Max N appels/minute via compteur mémoire (Map) | ✓ |
| Limite via Supabase | Stocker en base — persistant mais complexe | |

**User's choice:** Limite simple par IP — 5 appels/min
**Notes:** Confirmé avec message incluant le délai d'attente + header Retry-After

### Validation buffer retour

| Option | Description | Selected |
|--------|-------------|----------|
| Validation stricte | Vérifier buffer > 0 et format PNG/JPEG valide | ✓ |
| Tu décides | Claude implémente selon la doc @google/genai | |

**User's choice:** Validation stricte

### Message timeout

| Option | Description | Selected |
|--------|-------------|----------|
| Message explicite | "La génération a pris trop de temps. Veuillez réessayer." — HTTP 504 | ✓ |
| Erreur générique | Même message que les autres erreurs, status 500 | |
| Tu décides | | |

**User's choice:** Message explicite — HTTP 504

### Message rate-limit

| Option | Description | Selected |
|--------|-------------|----------|
| Avec délai | "Trop de demandes. Réessayez dans X secondes." + header Retry-After | ✓ |
| Message simple | "Trop de demandes, veuillez patienter." sans timing | |
| Tu décides | | |

**User's choice:** Avec délai et Retry-After

### Resize format

| Option | Description | Selected |
|--------|-------------|----------|
| Fit 1024×1024 | sharp.resize(1024, 1024, { fit: 'inside' }) | |
| Largeur fixe 1024 | Resize sur largeur, hauteur proportionnelle | |
| Tu décides | Claude choisit selon recommandations Gemini | ✓ |

**User's choice:** Tu décides

---

## Stratégie generate-all

### Séquentiel vs parallèle

| Option | Description | Selected |
|--------|-------------|----------|
| Parallèle (Promise.all) | 4 angles en ~30s au lieu de ~2min | |
| Parallèle limité (2) | Max 2 appels simultanés | |
| Séquentiel (actuel) | for...of — plus lent mais zéro risque 429 | ✓ |

**User's choice:** Séquentiel (actuel)
**Notes:** Préfère la simplicité et la prévisibilité

### Angle en erreur

| Option | Description | Selected |
|--------|-------------|----------|
| Continuer les autres | Skip l'angle en erreur, indique success/total | ✓ |
| Tout ou rien | Si un angle échoue, annuler tout | |

**User's choice:** Continuer les autres (comportement actuel conservé)

### Détail erreurs par angle

| Option | Description | Selected |
|--------|-------------|----------|
| Détail par angle | Tableau errors: [{view_type, reason}] dans la réponse | ✓ |
| Compteur seulement | Format actuel (generated, total, success) | |
| Tu décides | | |

**User's choice:** Détail par angle

### Progression SSE

| Option | Description | Selected |
|--------|-------------|----------|
| Non, pas pour v11 | L'admin attend le résultat complet | ✓ |
| Oui, SSE basique | Event par angle terminé | |

**User's choice:** Non, pas pour v11

### maxDuration

| Option | Description | Selected |
|--------|-------------|----------|
| 300s (5 min) | 4 angles × 30s max + retries — couvre largement | ✓ |
| 120s (2 min) | Risque timeout sur retries | |
| 600s (10 min) | Très conservateur | |

**User's choice:** 300s (5 min) pour generate-all

### maxDuration toutes routes

| Option | Description | Selected |
|--------|-------------|----------|
| Les 3 routes | generate: 60s, generate-all: 300s, simulate: 60s | ✓ |
| generate-all uniquement | | |
| Tu décides | | |

**User's choice:** Les 3 routes

---

## Logging et observabilité

### Niveau de logging

| Option | Description | Selected |
|--------|-------------|----------|
| Console structuré | Préfixe [IA] + durée + taille buffer + statut | ✓ |
| Console minimal | Juste succès/erreur | |
| Logger structuré (pino) | Dépendance logger avec niveaux, JSON, timestamps | |

**User's choice:** Console structuré

### Log retries

| Option | Description | Selected |
|--------|-------------|----------|
| Chaque retry | "[IA] Retry 2/3 après 429 (attente 2.1s)" | |
| Résumé après coup | "[IA] Succès après 2 retries (total: 6.3s)" | |
| Tu décides | Claude choisit la verbosité optimale | ✓ |

**User's choice:** Tu décides

### Détails log (modèle, payload)

| Option | Description | Selected |
|--------|-------------|----------|
| Log complet | Modèle + payload size + réponse size + durée | |
| Modèle seulement | | |
| Tu décides | Claude inclut les infos pertinentes | ✓ |

**User's choice:** Tu décides

### Succès vs erreurs

| Option | Description | Selected |
|--------|-------------|----------|
| Succès + erreurs | Chaque appel loggé avec durée | ✓ |
| Erreurs uniquement | Moins verbeux | |

**User's choice:** Succès + erreurs

### Masquage clé API

| Option | Description | Selected |
|--------|-------------|----------|
| Masquer | 4 premiers caractères seulement | |
| Pas de log de clé | Juste "Using NanoBanana provider" (actuel) | |
| Tu décides | Claude choisit le bon niveau | ✓ |

**User's choice:** Tu décides

### Métriques agrégées

| Option | Description | Selected |
|--------|-------------|----------|
| Pas de métriques v11 | Logs console suffisent | |
| Compteurs en mémoire | Total/success/error, endpoint /api/admin/stats | |
| Tu décides | Claude évalue si ça vaut l'effort | ✓ |

**User's choice:** Tu décides

---

## Sécurité clé API

### Validation format clé

| Option | Description | Selected |
|--------|-------------|----------|
| Juste présence | Factory vérifie déjà si définie. Gemini retourne 401 si invalide | |
| Format basique | Vérifier "AIza" + >30 caractères — fail-fast | |
| Tu décides | Claude décide si un check basique vaut le coup | ✓ |

**User's choice:** Tu décides

### Clé invalide (401)

| Option | Description | Selected |
|--------|-------------|----------|
| Erreur standard | 500 "Configuration IA invalide" — pas de fallback | ✓ |
| Fallback mock | Basculer sur MockIAService | |
| Erreur + log critique | 500 + "CRITICAL: NANO_BANANA_API_KEY invalide" | |

**User's choice:** Erreur standard

### Instanciation client

| Option | Description | Selected |
|--------|-------------|----------|
| Singleton | Client créé une fois dans le constructeur | ✓ |
| Par appel | Nouveau client à chaque generate() | |
| Tu décides | | |

**User's choice:** Singleton

### Clé scope

| Option | Description | Selected |
|--------|-------------|----------|
| Serveur-only | Sans NEXT_PUBLIC — déjà le cas | |
| Tu décides | Claude vérifie que jamais exposée côté client | ✓ |

**User's choice:** Tu décides

### Rate-limit admin

| Option | Description | Selected |
|--------|-------------|----------|
| Non, auth suffit | requireAdmin() protège déjà les routes admin | ✓ |
| Oui, rate-limit admin | Même protection par IP | |
| Tu décides | | |

**User's choice:** Non, auth suffit

---

## Claude's Discretion

- Stratégie retry 5xx (même que 429 ou différente)
- Format resize image simulate (fit inside vs largeur fixe)
- Verbosité logs retry (chaque retry vs résumé)
- Détails logging (modèle, payload, taille)
- Masquage clé API dans les logs
- Métriques agrégées en mémoire
- Validation format clé API au démarrage
- Scope exposure clé API (vérification serveur-only)

## Deferred Ideas

- SSE/progression generate-all — v12+
- Queue asynchrone batch — v12+
- Multi-providers IA — v12+
- Logger structuré pino/winston — v12+
- Métriques Prometheus/Datadog — v12+
- Rate-limit persistant Redis/Supabase — v12+
