---
phase: 15
slug: tests-unitaires-vitest
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-09
---

# Phase 15 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| N/A | Phase test-only — aucun code de production modifie, aucune surface d'attaque creee | Aucune donnee sensible |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-15-01 | I (Information Disclosure) | utils.test.ts | accept | URLs fictives (xxx.supabase.co), aucun secret reel | closed |
| T-15-02 | T (Tampering) | nano-banana.test.ts | accept | Mock @google/genai, aucune API reelle appelee | closed |
| T-15-03 | I (Information Disclosure) | require-admin.test.ts | accept | Mock client Supabase, aucune connexion BDD reelle | closed |
| T-15-04 | E (Elevation of Privilege) | generate-route 401 test | accept | Test de securite defensive — verifie que 401 bloque l'acces non authentifie | closed |

*Status: open / closed*
*Disposition: mitigate (implementation required) / accept (documented risk) / transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-15-01 | T-15-01 | Tests utilisent uniquement des URLs fictives, aucun secret reel expose | Claude (gsd-secure-phase) | 2026-04-09 |
| AR-15-02 | T-15-02 | Mock complet de @google/genai, aucun appel API reel | Claude (gsd-secure-phase) | 2026-04-09 |
| AR-15-03 | T-15-03 | Mock Supabase server, aucune connexion BDD reelle | Claude (gsd-secure-phase) | 2026-04-09 |
| AR-15-04 | T-15-04 | Test defensif verifiant le blocage d'acces — pas un risque | Claude (gsd-secure-phase) | 2026-04-09 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-09 | 4 | 4 | 0 | Claude (gsd-secure-phase) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-09
