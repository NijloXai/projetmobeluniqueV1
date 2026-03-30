---
status: complete
phase: 09-navigation-angles
source: [09-01-SUMMARY.md]
started: 2026-03-30T03:15:00Z
updated: 2026-03-30T03:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Thumbnails angles visibles sans tissu selectionne
expected: A l'ouverture du modal, les thumbnails montrent les photos originales du modele par angle. L'angle par defaut est 3/4.
result: pass
notes: radiogroup "Choisir l'angle de vue" avec 3 thumbnails (3/4, face, profil). Vue 3/4 checked par defaut. Alt text "Canape Canapé Milano — vue 3/4".

### 2. Cliquer un thumbnail change l'image principale
expected: Cliquer un thumbnail d'angle change l'image principale affichee. L'image montre la photo de l'angle choisi.
result: pass
notes: Clic sur "Vue face" → alt "Canape Canapé Milano — vue face". Clic sur "Vue profil" → alt "Canape Canapé Milano — vue profil". Navigation fluide entre les 3 angles.

### 3. Thumbnail actif visuellement distinct
expected: Le thumbnail de l'angle selectionne a aria-checked="true" et est visuellement distinct.
result: pass
notes: aria-checked="true" sur le thumbnail actif confirme via Playwright. Le CSS .thumbnailActive applique bordure primary.

### 4. Thumbnails avec tissu selectionne — rendus IA
expected: Quand un tissu est selectionne, les thumbnails montrent uniquement les angles ayant un rendu IA publie. L'image principale affiche le rendu IA.
result: pass
notes: Selection Lin Naturel → 3 thumbnails (3 angles avec rendu). Alt "Canape Canapé Milano en tissu Lin Naturel — vue profil". Selection Cuir Cognac → 3 thumbnails, alt "...en tissu Cuir Cognac — vue profil".

### 5. Changement de tissu preserve l'angle
expected: Quand on change de tissu, l'angle selectionne est conserve si le nouveau tissu a un rendu pour cet angle.
result: pass
notes: Angle "profil" selectionne avec Lin Naturel. Changement vers Cuir Cognac → angle reste "profil". Alt confirme "...en tissu Cuir Cognac — vue profil".

### 6. Rangee masquee si un seul angle
expected: Si le modele n'a qu'un seul angle ou le tissu n'a qu'un seul rendu, la rangee de thumbnails est masquee.
result: pass
notes: Teste precedemment avec donnees 1 angle — thumbnailRow absent du DOM. Confirme D-11.

### 7. Prix dynamique avec tissu premium
expected: Le prix se met a jour correctement avec le supplement premium (+80 EUR).
result: pass
notes: Lin Naturel (standard) → "1 890,00 EUR". Cuir Cognac (premium) → "1 970,00 EUR" + detail "+ 80 EUR · tissu premium".

### 8. Preservation angle a la reouverture (D-15)
expected: A la reouverture du modal sur le meme modele, l'angle selectionne est preserve.
result: issue
reported: "L'angle reset au 3/4 a chaque fermeture/reouverture du modal, meme sur le meme modele. useEffect([model?.id]) fire quand model passe de null a l'ID (fermeture/reouverture)."
severity: minor

### 9. Reset angle au changement de modele (D-16)
expected: Quand on ouvre un autre modele, l'angle reset au 3/4.
result: pass
notes: Ouverture Oslo apres Milano — modal Oslo affiche correctement sans thumbnails (aucun rendu). Modele different = reset total.

### 10. Recherche catalogue
expected: La barre de recherche filtre les canapes par nom.
result: pass
notes: Recherche "milano" → 1 canape affiche, compteur "1 canape", bouton "Vider le champ" present.

### 11. CTA Shopify
expected: Le lien "Acheter sur Shopify" redirige vers le produit.
result: pass
notes: Lien present avec href "https://www.mobelunique.fr/products/canape-milano", target="_blank".

## Summary

total: 11
passed: 10
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "A la reouverture du modal sur le meme modele, l'angle selectionne est preserve (D-15)"
  status: failed
  reason: "L'angle reset au 3/4 a chaque fermeture/reouverture. useEffect([model?.id]) fire quand model passe de null a meme ID."
  severity: minor
  test: 8
  root_cause: "useEffect sur model?.id ne distingue pas reouverture du meme modele vs changement de modele. Quand le modal ferme, model=null puis reouverture model=memeID, l'effet se declenche et reset selectedAngle."
  artifacts:
    - path: "src/components/public/Catalogue/ConfiguratorModal.tsx"
      issue: "useEffect([model?.id]) reset selectedAngle sans verifier si c'est le meme modele qu'avant"
  missing:
    - "Utiliser useRef pour tracker le previousModelId et ne reset l'angle que si le model change vraiment (previousId !== currentId, pas null → memeId)"
  debug_session: ""
