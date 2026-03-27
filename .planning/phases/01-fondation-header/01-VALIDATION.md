# Validation — Phase 1 : Fondation + Header

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/components/public/Header/__tests__/Header.test.tsx` |
| **Full suite command** | `npx tsc --noEmit && npx vitest run && npm run build` |
| **Estimated runtime** | ~15 seconds |

## Validations automatisees

| Commande | Ce qu'elle verifie | Quand |
|----------|--------------------|-------|
| `npx tsc --noEmit` | TypeScript compile sans erreur | Apres chaque fichier .tsx modifie |
| `npm run build` | Build production reussit (imports, metadata, CSS Modules) | Fin de phase |
| `npx vitest run Header.test.tsx` | 10 tests Header (logo, swap, scroll, skip link, Shopify) | Apres modification Header |

## Per-Task Verification Map

| Requirement | Test | Command | Status |
|-------------|------|---------|--------|
| HEAD-01 | Logo next/image alt="Mobel Unique", src=/brand/logo-white.png initial | `npx vitest run Header.test.tsx` | ✅ green |
| HEAD-01 | Lien Shopify "Retour a la boutique" href=mobelunique.fr | `npx vitest run Header.test.tsx` | ✅ green |
| HEAD-01 | Logo swap /brand/logo-black.png apres scroll | `npx vitest run Header.test.tsx` | ✅ green |
| HEAD-02 | Seuil scroll = innerHeight * 0.6, classe scrolled | `npx vitest run Header.test.tsx` | ✅ green |
| HEAD-02 | scrollY=100 ne declenche PAS scrolled | `npx vitest run Header.test.tsx` | ✅ green |
| HEAD-04 | Skip link "Aller au contenu" href="#main-content" | `npx vitest run Header.test.tsx` | ✅ green |
| HEAD-04 | Header role="banner" | `npx vitest run Header.test.tsx` | ✅ green |
| FOND-01 | Build passe sans template Next.js | `npm run build` | ✅ green |
| FOND-02 | Metadata SEO | `npx tsc --noEmit` | ✅ green |
| FOND-03 | Breakpoints CSS | `grep '1024px' src/app/globals.css` | ✅ green |
| FOND-04 | scroll-padding-top | `grep 'scroll-padding-top' src/app/globals.css` | ✅ green |

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swap logo blanc/noir visible | HEAD-01 | Rendu visuel navigateur | Ouvrir localhost:3000, scroller, verifier logo change |
| Fond beige subtil au scroll | HEAD-02 | Rendu visuel | Scroller, verifier fond semi-transparent |
| Responsive 4 breakpoints | FOND-03 | Layout visuel | DevTools responsive : 375px, 640px, 1024px, 1280px |
| Favicon dans onglet | D-04 | Rendu navigateur | Verifier icone onglet navigateur |

## Validation Audit 2026-03-27

| Metric | Count |
|--------|-------|
| Gaps found | 3 |
| Resolved | 3 |
| Escalated | 0 |

## Validation Sign-Off

- [x] All tasks have automated verify or manual-only justification
- [x] No 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-03-27
