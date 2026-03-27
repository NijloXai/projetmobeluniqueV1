---
status: complete
phase: 01-fondation-header
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md]
started: 2026-03-27T03:10:00Z
updated: 2026-03-27T03:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Logo blanc sur hero sombre
expected: Le header affiche le logo Mobel Unique en blanc sur le fond sombre du hero. Le logo est net et lisible.
result: pass

### 2. Logo noir apres scroll
expected: Apres avoir scrolle suffisamment (passe le hero), le logo passe au noir avec un fond beige subtil semi-transparent sur le header. Le texte "Retour a la boutique" est sombre et lisible.
result: pass

### 3. Lien Shopify
expected: Cliquer sur "Retour a la boutique" ouvre https://www.mobelunique.fr/ dans le meme onglet.
result: pass

### 4. Favicon dans l'onglet
expected: L'onglet du navigateur affiche le monogramme Mobel Unique (pas le triangle Next.js par defaut).
result: pass

### 5. Skip link accessibilite
expected: Appuyer sur Tab fait apparaitre un lien "Aller au contenu" en haut de la page (fond ambre). Appuyer Entree scrolle vers le contenu principal.
result: pass

### 6. Titre SEO dans l'onglet
expected: L'onglet affiche "Accueil | Mobel Unique" (ou similaire avec le nom de la marque).
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
