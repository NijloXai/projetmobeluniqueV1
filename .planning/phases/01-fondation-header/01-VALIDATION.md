# Validation — Phase 1 : Fondation + Header

## Validations automatisees

| Commande | Ce qu'elle verifie | Quand |
|----------|--------------------|-------|
| `npx tsc --noEmit` | TypeScript compile sans erreur | Apres chaque fichier .tsx modifie |
| `npm run build` | Build production reussit (imports, metadata, CSS Modules) | Fin de phase |

## Validations manuelles (checkpoint Tache 4)

| Req | Verification | Methode |
|-----|-------------|---------|
| FOND-01 | Page publique sans template Next.js | Ouvrir localhost:3000 — pas de logo Next.js |
| FOND-02 | Onglet affiche "Accueil \| Mobel Unique" | Verifier titre onglet navigateur |
| FOND-03 | Responsive 4 breakpoints | DevTools responsive : 375px, 640px, 1024px, 1280px |
| FOND-04 | scroll-padding-top actif | Clic sur ancre — contenu pas masque par header |
| HEAD-01 | Header visible fixed avec logo MU + lien Shopify | Navigation visuelle |
| HEAD-02 | Transition transparent → blanc au scroll 80px | Scroll lent > 80px |
| HEAD-03 | Glassmorphism actif | Verifier backdrop-blur dans DevTools |
| HEAD-04 | Skip link visible au focus Tab | Appuyer Tab sur la page |

## Gaps

Aucun framework de test unitaire configure. Phase 1 est 100% visuelle — les validations manuelles sont suffisantes.
