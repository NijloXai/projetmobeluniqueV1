---
phase: 11-simulation-ia-upload-et-traitement
verified: 2026-04-07T16:30:00Z
status: human_needed
score: 14/14 must-haves verified
overrides_applied: 0
deferred:
  - truth: "Apres generation reussie, le resultat IA s'affiche dans le modal"
    addressed_in: "Phase 12"
    evidence: "Phase 12 goal: 'Affichage du rendu simulation IA dans le modal, options de telechargement/partage'"
human_verification:
  - test: "Zone drag & drop met en evidence la cible quand un fichier est survole"
    expected: "La zone change de bordure (couleur primaire ambre) et le fond vire legrement orange au dragover"
    why_human: "Interaction visuelle avec la souris — non testable par grep"
  - test: "Apres selection d'une photo valide, l'apercu s'affiche"
    expected: "L'image selectionnee apparait dans le previewContainer avec le lien 'Changer de photo' visible"
    why_human: "Rendu visuel dynamique dependant de URL.createObjectURL"
  - test: "La barre de progression anime pendant la generation"
    expected: "0-30% rapide (~1s), 30-70% lent (~4s), etapes Analyse/Integration/Finition avancent en sequence"
    why_human: "Timing et animation — non verifiable statiquement"
  - test: "Le bouton 'Annuler' coupe reellement la requete reseau"
    expected: "Clic sur Annuler retourne a l'etat preview (photo affichee, bouton Lancer visible), aucun resultat charge"
    why_human: "Comportement reseau AbortController — necessite test navigateur avec devtools"
  - test: "Messages d'erreur validation fichier affiches en francais inline"
    expected: "Photo > 15 Mo : 'Ce fichier depasse 15 Mo. Choisissez une photo plus legere.' / Format invalide : 'Format non supporte. Utilisez JPEG, PNG ou HEIC.'"
    why_human: "Rendu conditionnel dependant de la validation d'un fichier reel"
  - test: "Acces camera sur mobile (iOS / Android)"
    expected: "Le selecteur natif propose 'Prendre une photo' ou 'Choisir depuis la galerie' en plus des fichiers"
    why_human: "Comportement specifique au systeme mobile — necessite un appareil reel"
---

# Phase 11: Simulation IA — Upload et traitement — Rapport de verification

**Objectif phase :** Upload photo salon par l'utilisateur, envoi au service IA pour simulation du canape configure dans l'environnement.
**Verifie le :** 2026-04-07
**Statut :** human_needed
**Re-verification :** Non — verification initiale

---

## Synthese

La phase 11 a atteint son objectif fonctionnel : l'utilisateur peut uploader une photo, lancer la simulation et voir la progression. L'API est correctement adaptee (15 Mo, fabric_id optionnel, HEIC 422). La machine a etats et le DnD sont implementes avec soin (anti-flicker, cleanup memoire, AbortController). Toutes les truths verifiables automatiquement passent. L'etat `done` sans rendu est intentionnel et deleguee a Phase 12.

---

## Truths observables

### Plan 01 — API /api/simulate

| #  | Truth | Statut | Evidence |
|----|-------|--------|----------|
| 1  | L'API accepte des fichiers jusqu'a 15 Mo sans erreur 400 | VERIFIED | `MAX_FILE_SIZE = 15 * 1024 * 1024` (route.ts ligne 5), message "15 Mo" (ligne 38) |
| 2  | L'API fonctionne sans fabric_id (tissu optionnel) et retourne un JPEG | VERIFIED | `let fabricName = 'tissu original'` + conditionnel `if (fabricId)` (lignes 68-83) |
| 3  | L'API retourne un message HEIC specifique si le codec n'est pas supporte | VERIFIED | try/catch interne sur `iaService.generate()` avec `status: 422` (lignes 103-117) |
| 4  | Le message d'erreur taille mentionne 15 Mo (pas 10 Mo) | VERIFIED | "L'image ne doit pas depasser 15 Mo." (route.ts ligne 38) |

### Plan 02 — Composant ConfiguratorModal

| #  | Truth | Statut | Evidence |
|----|-------|--------|----------|
| 5  | L'utilisateur voit un CTA 'Visualiser chez moi' sous le bouton Shopify | VERIFIED | `<button className={styles.ctaSimulation}>Visualiser chez moi</button>` (ligne 566-572), style outline defini |
| 6  | Le CTA ouvre une etape simulation avec zone upload drag & drop | VERIFIED | `handleGoToSimulation` → `setModalStep('simulation')`, rendu conditionnel avec `uploadZone` et handlers DnD |
| 7  | L'utilisateur peut glisser ou choisir une photo JPEG/PNG/HEIC de maximum 15 Mo | VERIFIED | `ACCEPTED_TYPES`, fallback extension `.heic/.heif` regex, `MAX_SIZE_BYTES = 15 * 1024 * 1024`, input `accept="image/jpeg,image/png,image/heic,image/heif"` |
| 8  | L'erreur s'affiche en francais si le fichier est trop gros ou au mauvais format | VERIFIED | `validateFile()` retourne messages fr : "Ce fichier depasse 15 Mo..." / "Format non supporte..." |
| 9  | Apres selection, un apercu s'affiche avec bouton 'Lancer la simulation' | VERIFIED | `simulationState === 'preview'` → `previewContainer` + `<img src={previewUrl}>` + `launchButton` |
| 10 | Pendant la generation, une barre de progression simulee avec 3 etapes s'affiche | VERIFIED | `progressBarFill` avec `width: progress%`, `stepList` avec 3 items (Analyse/Integration/Finition), timer 2 phases |
| 11 | L'utilisateur peut annuler la generation en cours | VERIFIED | `handleAnnuler` → `abortControllerRef.current.abort()`, catch sur `AbortError` → retour etat `preview` |
| 12 | En cas d'erreur IA, un message inline et un bouton 'Reessayer' s'affichent | VERIFIED | `simulationState === 'error'` → `errorMessage` (role="alert") + `retryButton` → `handleReessayer` |
| 13 | Le bouton retour ramene a l'etape tissu sans perdre la selection | VERIFIED | `handleBackToConfigurator` → `setModalStep('configurator')`, `selectedFabricId` non reinitialise |
| 14 | Le bandeau rappel config affiche le mini swatch et nom du tissu | VERIFIED | `configRecap` avec `configRecapSwatch` (24px) + texte `{model.name} x {selectedFabric.name}` ou fallback |

**Score : 14/14 truths verifiees**

---

## Items differes (Phase 12)

Items non couverts par Phase 11 car explicitement assignes a Phase 12.

| # | Item | Couvert par | Evidence |
|---|------|-------------|----------|
| 1 | Affichage du resultat simulation (image generee) dans le modal | Phase 12 | Objectif Phase 12 : "Affichage du rendu simulation IA dans le modal" ; PLAN 02 objective: "tous etats sauf 'done' qui est Phase 12" |
| 2 | Telechargement / partage WhatsApp / CTA Shopify post-simulation | Phase 12 | Phase 12 goal mentionne "options de telechargement/partage" |

Note : `resultBlobUrl` est correctement stocke en state et revoque au unmount — pret pour Phase 12.

---

## Artefacts requis

| Artefact | Fourni | Statut | Details |
|----------|--------|--------|---------|
| `src/app/api/simulate/route.ts` | Route POST avec MAX_FILE_SIZE=15Mo, fabric_id optionnel, HEIC 422 | VERIFIED | 137 lignes, commit e2fe727, tsc clean |
| `src/lib/ai/prompts.ts` | buildSimulatePrompt compatible avec "tissu original" | VERIFIED | Signature `(modelName: string, fabricName: string): string`, aucune validation enum interne |
| `src/components/public/Catalogue/ConfiguratorModal.tsx` | Etape simulation avec state machine 5 etats, DnD, fetch AbortController | VERIFIED | +501 lignes, commit 35d9e1d, `simulationState` present |
| `src/components/public/Catalogue/ConfiguratorModal.module.css` | Styles zone upload, barre progression, etats | VERIFIED | +433 lignes, commit f772b76, `uploadZone` et toutes classes planifiees presentes |

---

## Verification liens cles

| De | Vers | Via | Statut | Details |
|----|------|-----|--------|---------|
| `ConfiguratorModal.tsx` | `/api/simulate` | `fetch('/api/simulate', { method: 'POST', body: formData, signal })` | WIRED | Ligne 332, signal AbortController connecte |
| `ConfiguratorModal.tsx` | `ConfiguratorModal.module.css` | CSS Modules `styles.uploadZone` | WIRED | 14+ classes Phase 11 utilisees dans le JSX |
| `route.ts` | `prompts.ts` via `buildSimulatePrompt` | Appel direct non present | DEVIATED | `fabricName` passe directement a `iaService.generate()` ; `buildSimulatePrompt` defini et reexporte mais non consomme par route.ts. Comportement equivalent. |

---

## Trace flux de donnees (Niveau 4)

| Artefact | Variable | Source | Donnees reelles | Statut |
|----------|----------|--------|-----------------|--------|
| `ConfiguratorModal.tsx` | `previewUrl` | `URL.createObjectURL(file)` apres selection | Fichier utilisateur reel | FLOWING |
| `ConfiguratorModal.tsx` | `progress` | Timer 2 phases (setInterval) | Simule (intentionnel, D-13) | FLOWING (simule) |
| `ConfiguratorModal.tsx` | `resultBlobUrl` | `URL.createObjectURL(blob)` depuis fetch `/api/simulate` | Blob JPEG genere par le service IA | FLOWING (stocke, rendu Phase 12) |
| `route.ts` | Response JPEG | `iaService.generate()` + `addWatermark()` | Sharp mock ou NanaBanana | FLOWING |

---

## Verifications comportementales (Niveau 7b)

| Comportement | Commande | Resultat | Statut |
|-------------|----------|----------|--------|
| TypeScript compile sans erreur | `npx tsc --noEmit` | EXIT_CODE:0, aucune erreur | PASS |
| Module exports `ConfiguratorModal` | `grep -n "export function ConfiguratorModal"` | Trouve (ligne 19) | PASS |
| Route POST /api/simulate existe | `grep -n "export async function POST"` | Trouve (ligne 13) | PASS |
| Commits declares existent dans git | `git show --stat e2fe727 35d9e1d f772b76` | 3 commits valides, modifications attendues | PASS |

---

## Couverture des requirements

| Requirement | Plan | Description | Statut | Evidence |
|-------------|------|-------------|--------|----------|
| SIM-01 | 11-01, 11-02 | Upload photo salon (drag & drop) | SATISFAIT | Zone DnD implementee, validation fichier, preview, fetch /api/simulate avec signal |

**Note documentaire :** SIM-01 apparait dans la section "Future Requirements" de REQUIREMENTS.md sans entree dans la table de traceability. Ce requirement est implement en Phase 11 mais REQUIREMENTS.md n'a pas ete mis a jour pour refleter son implementation. Ce n'est pas un blocage fonctionnel.

---

## Anti-patterns detectes

| Fichier | Ligne | Pattern | Severite | Impact |
|---------|-------|---------|----------|--------|
| `ConfiguratorModal.tsx` | 216-217 | `ACCEPTED_TYPES` / `MAX_SIZE_BYTES` declares dans le corps du composant | Info | Recreees a chaque render ; deplacement en constantes module recommande (cf. REVIEW.md IN-01) |
| `ConfiguratorModal.tsx` | 493, 688 | `id="modal-title"` duplique dans deux branches | Info | Un seul rendu a la fois, pas de bug, mais fragile (cf. REVIEW.md IN-02) |
| `route.ts` | 130-134 | `err.message` expose dans la reponse JSON publique (500) | Avertissement | Divulgation potentielle d'informations systeme (cf. REVIEW.md WR-03, flag pre-existant) |
| `route.ts` | 24 | Pas de validation MIME cote serveur | Avertissement | Appel API direct bypass la validation client (cf. REVIEW.md WR-01) |
| `route.ts` | 54 | Modele non filtre par `is_active` | Avertissement | Simulation possible sur modeles inactifs/brouillons (cf. REVIEW.md WR-02) |
| `src/lib/ai/prompts.ts` | 28 | `buildSimulatePrompt` defini et reexporte mais non consomme | Info | Code non utilise actuellement ; sera necessaire quand NanaBanana sera integre |

Les avertissements WR-01/WR-02/WR-03 sont des pre-occupations de securite identifiees par le code review mais ne bloquent pas le fonctionnement de Phase 11 (route publique, mock IA).

---

## Verification humaine requise

### 1. Mise en evidence de la zone drag & drop

**Test :** Faire glisser un fichier image sur la zone "Glissez votre photo ici" sans le deposer.
**Attendu :** La bordure passe de `--outline-variant` (beige) a `--color-primary` (ambre #E49400), le fond devient legrement orange (rgba(228,148,0,0.05)).
**Pourquoi humain :** Interaction visuelle avec la souris — non testable par analyse statique.

### 2. Apercu photo apres selection

**Test :** Selectionner une photo JPEG valide (< 15 Mo) via "Choisir une photo" ou en glissant-deposant.
**Attendu :** L'image s'affiche dans le previewContainer (ratio 4:3 ou min-height 300px desktop), le lien "Changer de photo" est visible en superposition, le bouton "Lancer la simulation" apparait.
**Pourquoi humain :** Rendu dynamique via URL.createObjectURL — non testable sans navigateur.

### 3. Barre de progression et etapes

**Test :** Cliquer "Lancer la simulation" avec le mock IA actif (sans NANO_BANANA_API_KEY).
**Attendu :** Etape 1 "Analyse de la piece" active avec spinner, barre monte 0→30% rapidement (~1s), puis 30→70% lentement (~4s), puis completion instantanee a reception.
**Pourquoi humain :** Timing et animation de progression — necessite observation en temps reel.

### 4. Annulation via AbortController

**Test :** Cliquer "Lancer la simulation", puis cliquer "Annuler" immediatement pendant la progression.
**Attendu :** La requete fetch est annulee (visible dans devtools Network : status "cancelled"), l'etat revient a "preview" avec la photo et le bouton "Lancer la simulation", aucune erreur affichee.
**Pourquoi humain :** Comportement reseau — necessite devtools navigateur.

### 5. Messages d'erreur validation en francais

**Test A (taille) :** Tenter d'uploader un fichier > 15 Mo.
**Attendu :** Message inline rouge : "Ce fichier depasse 15 Mo. Choisissez une photo plus legere."
**Test B (format) :** Tenter d'uploader un fichier .pdf ou .gif.
**Attendu :** Message inline rouge : "Format non supporte. Utilisez JPEG, PNG ou HEIC."
**Pourquoi humain :** Validation en temps reel avec fichier reel.

### 6. Acces camera sur mobile

**Test :** Ouvrir le configurateur sur iOS ou Android, cliquer "Choisir une photo".
**Attendu :** Le selecteur systeme propose l'option de prendre une photo avec la camera et/ou choisir depuis la galerie (comportement natif de `accept="image/*"` sur mobile).
**Pourquoi humain :** Specifique au systeme mobile — necessite un appareil reel.

---

## Resume global

**Phase 11 — Objectif atteint** : L'upload photo salon, la validation client, l'envoi au service IA et le feedback de progression sont implemente et fonctionnels. L'adaptation de l'API (15 Mo, fabric optionnel, HEIC 422) est correcte. La machine a etats du modal est propre avec cleanup memoire rigoureux.

**État `done` sans rendu** : intentionnel et documente (PLAN 02 objective, SUMMARY Known Stubs). Phase 12 prend le relais pour l'affichage du resultat.

**Avertissements securite** (WR-01/WR-02/WR-03) : identifies par le code review, non bloquants pour Phase 11, a adresser avant mise en production.

---

_Verifie le : 2026-04-07T16:30:00Z_
_Verificateur : Claude (gsd-verifier)_
