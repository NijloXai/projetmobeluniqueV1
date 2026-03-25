# M006: M006: Export ZIP

**Vision:** L'admin peut télécharger un ZIP structuré de tous les rendus validés d'un canapé, nommés {slug}-{tissu}-{angle}.jpg, prêts pour Shopify.

## Success Criteria

- L'admin clique 'Exporter ZIP' sur un canapé avec des rendus validés et le ZIP se télécharge
- Le ZIP contient uniquement les rendus où is_validated=true, avec le nommage {slug}-{fabric}-{view_type}.jpg
- Le bouton affiche un loader pendant la génération du ZIP
- Si aucun rendu validé, un message français s'affiche et aucun téléchargement ne se lance
- L'API renvoie 401 sans authentification admin
- tsc --noEmit passe avec zéro erreurs

## Slices

- [x] **S01: Export ZIP — API + UI** `risk:low` `depends:[]`
  > After this: L'admin clique Exporter ZIP dans /admin/produits/[id]/edit, le ZIP se télécharge avec les bons fichiers nommés {slug}-{fabric}-{angle}.jpg. Message si aucun rendu validé.

## Boundary Map

```
Admin Browser ──[click Exporter ZIP]──▶ ModelForm.tsx
ModelForm.tsx ──[GET /api/admin/visuals/{modelId}/export]──▶ Export API Route
Export API Route ──[requireAdmin()]──▶ Supabase Auth
Export API Route ──[SELECT generated_visuals + fabrics + model_images]──▶ Supabase DB
Export API Route ──[fetch(generated_image_url)]──▶ Supabase Storage (public bucket)
Export API Route ──[archiver stream → ZIP]──▶ Admin Browser (download)
```
