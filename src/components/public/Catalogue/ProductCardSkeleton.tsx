import styles from './ProductCardSkeleton.module.css'

export function ProductCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.imageZone} ${styles.shimmer}`} />
      <div className={styles.body}>
        <div className={styles.row}>
          <div className={`${styles.lineName} ${styles.shimmer}`} />
          <div className={`${styles.linePrice} ${styles.shimmer}`} />
        </div>
        <div className={`${styles.lineDesc} ${styles.shimmer}`} />
        <div className={`${styles.lineCta} ${styles.shimmer}`} />
      </div>
    </div>
  )
}

export function CatalogueSkeletonGrid() {
  return (
    <section id="catalogue" aria-label="Chargement du catalogue" aria-busy="true" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      </div>
    </section>
  )
}
