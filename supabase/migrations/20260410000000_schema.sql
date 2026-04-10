-- Migration initiale Mobel Unique
-- Tables, RLS policies, et buckets Storage

-- Tables
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL,
  dimensions TEXT,
  shopify_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS model_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  view_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  swatch_url TEXT,
  reference_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generated_visuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  model_image_id UUID NOT NULL REFERENCES model_images(id) ON DELETE CASCADE,
  fabric_id UUID NOT NULL REFERENCES fabrics(id) ON DELETE CASCADE,
  generated_image_url TEXT NOT NULL,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (model_image_id, fabric_id)
);

-- RLS Policies (simplified for local testing)
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_visuals ENABLE ROW LEVEL SECURITY;

-- Public read access for active models/fabrics
CREATE POLICY "models_public_read" ON models FOR SELECT USING (true);
CREATE POLICY "model_images_public_read" ON model_images FOR SELECT USING (true);
CREATE POLICY "fabrics_public_read" ON fabrics FOR SELECT USING (true);
CREATE POLICY "generated_visuals_public_read" ON generated_visuals FOR SELECT USING (true);

-- Service role bypass (for admin operations via service_role key)
CREATE POLICY "models_service_all" ON models FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "model_images_service_all" ON model_images FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "fabrics_service_all" ON fabrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "generated_visuals_service_all" ON generated_visuals FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can CRUD (admin routes use auth token)
CREATE POLICY "models_auth_all" ON models FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "model_images_auth_all" ON model_images FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "fabrics_auth_all" ON fabrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "generated_visuals_auth_all" ON generated_visuals FOR ALL USING (auth.role() = 'authenticated');

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('model-photos', 'model-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('fabric-swatches', 'fabric-swatches', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('fabric-references', 'fabric-references', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-visuals', 'generated-visuals', true) ON CONFLICT DO NOTHING;

-- Storage policies (public buckets: anyone can read, authenticated can write)
CREATE POLICY "model_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'model-photos');
CREATE POLICY "model_photos_auth_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'model-photos' AND auth.role() = 'authenticated');
CREATE POLICY "model_photos_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'model-photos' AND auth.role() = 'authenticated');
CREATE POLICY "model_photos_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'model-photos' AND auth.role() = 'authenticated');

CREATE POLICY "fabric_swatches_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'fabric-swatches');
CREATE POLICY "fabric_swatches_auth_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fabric-swatches' AND auth.role() = 'authenticated');
CREATE POLICY "fabric_swatches_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'fabric-swatches' AND auth.role() = 'authenticated');
CREATE POLICY "fabric_swatches_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'fabric-swatches' AND auth.role() = 'authenticated');

CREATE POLICY "fabric_refs_auth_read" ON storage.objects FOR SELECT USING (bucket_id = 'fabric-references' AND auth.role() = 'authenticated');
CREATE POLICY "fabric_refs_auth_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fabric-references' AND auth.role() = 'authenticated');
CREATE POLICY "fabric_refs_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'fabric-references' AND auth.role() = 'authenticated');
CREATE POLICY "fabric_refs_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'fabric-references' AND auth.role() = 'authenticated');

CREATE POLICY "gen_visuals_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'generated-visuals');
CREATE POLICY "gen_visuals_auth_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generated-visuals' AND auth.role() = 'authenticated');
CREATE POLICY "gen_visuals_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'generated-visuals' AND auth.role() = 'authenticated');
CREATE POLICY "gen_visuals_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'generated-visuals' AND auth.role() = 'authenticated');
