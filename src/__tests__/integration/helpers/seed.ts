import { adminClient } from './supabase-admin'

const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'admin@test.mobelunique.fr'
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'test-admin-secure-2024!'

/**
 * Cree le user admin pour les tests (idempotent).
 * Utilise adminClient.auth.admin.createUser() au lieu de SQL raw (recommandation RESEARCH.md).
 */
export async function seedAdminUser(): Promise<string> {
  const { data: existing } = await adminClient.auth.admin.listUsers()
  const found = existing?.users?.find(u => u.email === TEST_ADMIN_EMAIL)
  if (found) return found.id

  const { data, error } = await adminClient.auth.admin.createUser({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
    email_confirm: true,
  })
  if (error) throw new Error(`seedAdminUser failed: ${error.message}`)
  return data.user.id
}

/**
 * Insere les donnees de test de base (modeles, tissus, images, visuels).
 * Idempotent — utilise upsert sur les IDs fixes.
 */
export async function seedTestData(): Promise<void> {
  // Modeles
  await adminClient.from('models').upsert([
    { id: 'b0000000-0000-0000-0000-000000000001', name: 'Milano Test', slug: 'milano-test', price: 1200, is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000002', name: 'Roma Inactif', slug: 'roma-inactif', price: 900, is_active: false },
  ])

  // Images modele
  await adminClient.from('model_images').upsert([
    { id: 'd0000000-0000-0000-0000-000000000001', model_id: 'b0000000-0000-0000-0000-000000000001', image_url: 'http://127.0.0.1:54321/storage/v1/object/public/model-photos/milano-test/face-0.jpg', view_type: 'face', sort_order: 0 },
    { id: 'd0000000-0000-0000-0000-000000000002', model_id: 'b0000000-0000-0000-0000-000000000001', image_url: 'http://127.0.0.1:54321/storage/v1/object/public/model-photos/milano-test/3-4-1.jpg', view_type: '3/4', sort_order: 1 },
  ])

  // Tissus
  await adminClient.from('fabrics').upsert([
    { id: 'c0000000-0000-0000-0000-000000000001', name: 'Velours Bleu', slug: 'velours-bleu', category: 'velours', is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000002', name: 'Lin Inactif', slug: 'lin-inactif', category: 'lin', is_active: false },
  ])

  // Visuel genere (valide + publie pour tests publics)
  await adminClient.from('generated_visuals').upsert([
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      model_id: 'b0000000-0000-0000-0000-000000000001',
      model_image_id: 'd0000000-0000-0000-0000-000000000001',
      fabric_id: 'c0000000-0000-0000-0000-000000000001',
      generated_image_url: 'http://127.0.0.1:54321/storage/v1/object/public/generated-visuals/milano-test/face-velours-bleu.jpg',
      is_validated: true,
      is_published: true,
    },
  ])
}
