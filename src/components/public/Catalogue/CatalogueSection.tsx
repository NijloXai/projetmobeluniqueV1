import { createClient } from '@/lib/supabase/server'
import { CatalogueClient } from './CatalogueClient'
import type { ModelWithImages, Fabric, VisualWithFabricAndImage } from '@/types/database'
import styles from './CatalogueSection.module.css'

export async function CatalogueSection() {
  const supabase = await createClient()

  const [modelsResult, fabricsResult, visualsResult] = await Promise.all([
    supabase
      .from('models')
      .select('*, model_images(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),

    supabase
      .from('fabrics')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }),

    supabase
      .from('generated_visuals')
      .select('*, fabric:fabrics(*), model_image:model_images(*)')
      .eq('is_validated', true)
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ])

  if (modelsResult.error || fabricsResult.error || visualsResult.error) {
    return (
      <section id="catalogue" className={styles.section}>
        <div className={styles.container}>
          <p className={styles.errorMessage}>
            Impossible de charger les produits. Veuillez rafraichir la page.
          </p>
        </div>
      </section>
    )
  }

  const models: ModelWithImages[] = (modelsResult.data ?? []).map((model) => ({
    ...model,
    model_images: (model.model_images ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    ),
  }))

  const fabrics: Fabric[] = fabricsResult.data ?? []

  // Filtrage JS obligatoire : PostgREST ne filtre pas les colonnes de jointures imbriquees (D-09)
  const visuals: VisualWithFabricAndImage[] = (visualsResult.data ?? []).filter(
    (v): v is VisualWithFabricAndImage =>
      v.fabric !== null && (v.fabric as Fabric).is_active === true
  )

  return <CatalogueClient models={models} fabrics={fabrics} visuals={visuals} />
}
