import { adminClient } from './supabase-admin'

/**
 * Supprime les donnees de test creees par un fichier de test specifique.
 * Appeler dans afterAll() de chaque suite de test.
 * Le service_role bypasse RLS et respecte l'ordre FK.
 */
export async function cleanupTestData(options?: {
  modelSlugs?: string[]
  fabricSlugs?: string[]
}): Promise<void> {
  // Supprimer visuels generes d'abord (FK vers model_images et fabrics)
  await adminClient.from('generated_visuals').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Supprimer images modeles (FK vers models)
  await adminClient.from('model_images').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Supprimer tissus
  if (options?.fabricSlugs?.length) {
    await adminClient.from('fabrics').delete().in('slug', options.fabricSlugs)
  }

  // Supprimer modeles
  if (options?.modelSlugs?.length) {
    await adminClient.from('models').delete().in('slug', options.modelSlugs)
  }
}

/**
 * Supprime TOUTES les donnees (pour le globalTeardown ou entre suites).
 */
export async function cleanupAll(): Promise<void> {
  await adminClient.from('generated_visuals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('model_images').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('fabrics').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('models').delete().neq('id', '00000000-0000-0000-0000-000000000000')
}
