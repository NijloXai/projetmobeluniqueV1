import { createClient } from '@/lib/supabase/server'
import { CatalogueClient } from './CatalogueClient'
import type { ModelWithImages } from '@/types/database'
import styles from './CatalogueSection.module.css'

export async function CatalogueSection() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('models')
    .select('*, model_images(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
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

  const models: ModelWithImages[] = (data ?? []).map((model) => ({
    ...model,
    model_images: (model.model_images ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    ),
  }))

  return <CatalogueClient models={models} />
}
