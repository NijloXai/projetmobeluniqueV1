'use client'

import type { ModelWithImages } from '@/types/database'
import { ProductCard } from './ProductCard'
import styles from './CatalogueSection.module.css'

interface CatalogueClientProps {
  models: ModelWithImages[]
}

export function CatalogueClient({ models }: CatalogueClientProps) {
  if (models.length === 0) {
    return (
      <section id="catalogue" className={styles.section}>
        <div className={styles.container}>
          <p className={styles.emptyMessage}>Nos canapes arrivent bientot.</p>
        </div>
      </section>
    )
  }

  return (
    <section
      id="catalogue"
      className={styles.section}
      aria-labelledby="catalogue-title"
    >
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 id="catalogue-title" className={styles.sectionTitle}>
            Nos Canapes
          </h2>
          <p className={styles.sectionSubtitle}>
            Selectionnez une base pour commencer la configuration.
          </p>
        </div>
        <div className={styles.grid}>
          {models.map((model) => (
            <ProductCard
              key={model.id}
              model={model}
              onConfigure={undefined}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
