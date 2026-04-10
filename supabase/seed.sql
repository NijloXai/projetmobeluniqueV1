-- Donnees de test pour les tests d'integration
-- Le user admin est cree via adminClient.auth.admin.createUser() dans le seed TS, pas ici.

-- 1 modele actif + 1 modele inactif
INSERT INTO models (id, name, slug, price, is_active, created_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Milano Test', 'milano-test', 1200, true, now()),
  ('b0000000-0000-0000-0000-000000000002', 'Roma Inactif', 'roma-inactif', 900, false, now());

-- 2 images pour Milano Test
INSERT INTO model_images (id, model_id, image_url, view_type, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'http://127.0.0.1:54321/storage/v1/object/public/model-photos/milano-test/face-0.jpg', 'face', 0),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'http://127.0.0.1:54321/storage/v1/object/public/model-photos/milano-test/3-4-1.jpg', '3/4', 1);

-- 1 tissu actif + 1 tissu inactif
INSERT INTO fabrics (id, name, slug, category, is_active, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Velours Bleu', 'velours-bleu', 'velours', true, now()),
  ('c0000000-0000-0000-0000-000000000002', 'Lin Inactif', 'lin-inactif', 'lin', false, now());

-- 1 visuel genere (valide + publie)
INSERT INTO generated_visuals (id, model_id, model_image_id, fabric_id, generated_image_url, is_validated, is_published) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'http://127.0.0.1:54321/storage/v1/object/public/generated-visuals/milano-test/face-velours-bleu.jpg', true, true);
