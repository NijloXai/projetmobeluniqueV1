# S01: Export ZIP — API + UI — UAT

**Milestone:** M006
**Written:** 2026-03-25T03:19:03.240Z

## UAT — S01: Export ZIP — API + UI

### Scénario 1 : Export ZIP d'un produit avec rendus validés
1. Se connecter en admin
2. Aller sur /admin/produits/[id]/edit d'un produit ayant des rendus validés
3. Cliquer sur « 📦 Exporter ZIP »
4. **Attendu :** le bouton affiche « ⏳ Export en cours… », puis un fichier .zip se télécharge
5. **Attendu :** le ZIP contient des fichiers nommés {slug}-{tissu}-{angle}.jpg

### Scénario 2 : Export ZIP sans rendus validés
1. Aller sur /admin/produits/[id]/edit d'un produit SANS rendus validés
2. Cliquer sur « 📦 Exporter ZIP »
3. **Attendu :** message « Aucun rendu validé pour ce produit. » affiché en rouge

### Scénario 3 : Export sans authentification
1. En navigation privée, accéder directement à /api/admin/visuals/export/{modelId}
2. **Attendu :** HTTP 401

### Scénario 4 : Bouton visible uniquement en édition
1. Aller sur /admin/produits/new
2. **Attendu :** pas de section Export visible
