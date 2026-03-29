---
status: complete
phase: 08-configurateur-core
source: [08-01-SUMMARY.md]
started: 2026-03-30T00:00:00Z
updated: 2026-03-30T00:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Grille de swatches filtree par modele
expected: Ouvrir le modal configurateur sur un produit. Seuls les swatches des tissus ayant un rendu IA publie pour CE modele apparaissent. Les swatches sont des miniatures cliquables. Aucun swatch n'est pre-selectionne a l'ouverture.
result: pass

### 2. Selection swatch et rendu IA
expected: Cliquer un swatch — il recoit une bordure orange (#E49400) distincte. L'image principale change pour afficher le rendu IA du tissu selectionne. Le changement est immediat sans saut de layout.
result: pass

### 3. Badge Premium sur swatches
expected: Les swatches des tissus premium affichent un petit badge "Premium" visible. Les swatches de tissus standard n'ont pas de badge.
result: pass

### 4. Fallback photo originale avec badge
expected: Si un tissu selectionne n'a pas de rendu IA publie, l'image principale reste la photo originale du modele avec un badge "Photo originale" visible sur l'image.
result: skipped
reason: Pas de tissu sans rendu publie en BDD pour tester ce cas. Couvert par 35 tests unitaires (CONF-05 dans ConfiguratorModal.test.tsx).

### 5. Prix dynamique standard
expected: Sans selection : le prix affiche "a partir de X EUR". Apres selection d'un tissu standard (non premium) : le prix affiche le montant exact sans "a partir de".
result: pass

### 6. Prix dynamique premium avec detail
expected: Selectionner un tissu premium — le prix affiche le montant exact (base + 80 EUR) et une ligne de detail "+ 80 EUR · tissu premium" est visible sous le prix.
result: pass

### 7. CTA Acheter sur Shopify
expected: Si le modele a un shopify_url : un bouton "Acheter sur Shopify" est visible. Cliquer ouvre le lien Shopify dans un nouvel onglet. Si le modele n'a PAS de shopify_url : le bouton est absent.
result: pass

## Summary

total: 7
passed: 6
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps

