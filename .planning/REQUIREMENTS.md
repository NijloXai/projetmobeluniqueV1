# Requirements: Möbel Unique — v11.0 Intégration IA Réelle + Audit Qualité

**Defined:** 2026-04-08
**Core Value:** Le client peut visualiser un canapé dans le tissu de son choix et le simuler dans son salon avant d'acheter.

## v11.0 Requirements

Requirements pour ce milestone. Chaque requirement mappe à une phase du roadmap.

### Intégration IA Réelle

- [ ] **IA-01**: NanoBananaService.generate() implémenté via @google/genai avec retry exponentiel (1s/2s/4s + jitter) et timeout 30s
- [ ] **IA-02**: NanoBananaService.addWatermark() implémenté via Sharp SVG (réutilise pattern MockIAService)
- [ ] **IA-03**: Vérification finishReason === 'STOP' avant parsing réponse Gemini (gère IMAGE_SAFETY)
- [ ] **IA-04**: Resize systématique image simulate avant envoi Gemini (max 1024px via Sharp)
- [ ] **IA-05**: Conversion PNG→JPEG des résultats Gemini (compatibilité Storage existant)
- [ ] **IA-06**: export maxDuration = 300 dans generate-all/route.ts (évite timeout Vercel)
- [ ] **IA-07**: Deux chemins d'entrée image : URL Supabase → fetch+base64 (admin) / data URI → split (simulate)

### Tests Unitaires + Intégration

- [ ] **TEST-01**: Tests Vitest NanoBananaService avec vi.mock('@google/genai')
- [ ] **TEST-02**: Tests Vitest utils (slugify, calculatePrice, extractStoragePath)
- [ ] **TEST-03**: Tests Vitest routes admin generate + requireAdmin()
- [ ] **TEST-04**: Tests Vitest route simulate avec mock provider

### Tests E2E Playwright

- [ ] **E2E-01**: Setup Playwright (install, config, globalSetup auth admin)
- [ ] **E2E-02**: Parcours public catalogue → configurateur → simulation (mock provider)
- [ ] **E2E-03**: Parcours admin generate → validate → publish

### Audit + Corrections

- [ ] **AUDIT-01**: Audit sécurité (injection, XSS, auth bypass, validation inputs)
- [ ] **AUDIT-02**: Audit performance (N+1 queries, bundles, images non-optimisées)
- [ ] **AUDIT-03**: Audit dead code (imports inutilisés, fichiers orphelins, exports morts)
- [ ] **AUDIT-04**: Audit bonnes pratiques (TypeScript strict, error handling, accessibilité)
- [ ] **FIX-01**: Corrections des problèmes identifiés par l'audit

## v12+ Requirements

Reportés aux milestones suivants.

### Polish UX
- **POLISH-01**: Produits similaires dans le configurateur
- **POLISH-02**: Footer complet avec liens légaux
- **POLISH-03**: Sticky bar mobile CTA
- **POLISH-04**: Deep link ?produit=slug

### IA Avancée
- **IA-ADV-01**: Queue asynchrone pour génération batch
- **IA-ADV-02**: Multi-providers IA (fallback)
- **IA-ADV-03**: Cache Redis résultats génération

## Out of Scope

| Feature | Reason |
|---------|--------|
| Nouvelles features UX (footer, sticky bar) | Focus qualité, pas de nouvelles features ce milestone |
| Intégration Nano Banana réelle en CI | Tests mockent le provider, pas de clé API en CI |
| Queue asynchrone batch | Complexité sans valeur pour le volume actuel |
| Multi-providers IA | Un seul provider suffit pour v11 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IA-01 | Phase 13 | Pending |
| IA-02 | Phase 13 | Pending |
| IA-03 | Phase 13 | Pending |
| IA-04 | Phase 13 | Pending |
| IA-05 | Phase 13 | Pending |
| IA-06 | Phase 13 | Pending |
| IA-07 | Phase 13 | Pending |
| AUDIT-01 | Phase 14 | Pending |
| AUDIT-02 | Phase 14 | Pending |
| AUDIT-03 | Phase 14 | Pending |
| AUDIT-04 | Phase 14 | Pending |
| TEST-01 | Phase 15 | Pending |
| TEST-02 | Phase 15 | Pending |
| TEST-03 | Phase 15 | Pending |
| TEST-04 | Phase 15 | Pending |
| E2E-01 | Phase 16 | Pending |
| E2E-02 | Phase 16 | Pending |
| E2E-03 | Phase 16 | Pending |
| FIX-01 | Phase 16 | Pending |

**Coverage:**
- v11.0 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after roadmap creation*
