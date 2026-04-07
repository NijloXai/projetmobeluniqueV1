import Image from 'next/image'
import { Sofa } from 'lucide-react'
import type { ModelWithImages } from '@/types/database'
import { getPrimaryImage, formatStartingPrice } from '@/lib/utils'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  model: ModelWithImages
  onConfigure: (model: ModelWithImages) => void
}

export function ProductCard({ model, onConfigure }: ProductCardProps) {
  const imageUrl = getPrimaryImage(model.model_images)

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Canape ${model.name}`}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <Sofa size={48} strokeWidth={1.5} aria-hidden="true" className={styles.placeholderIcon} />
          </div>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.metaRow}>
          <div className={styles.nameGroup}>
            <h3 className={styles.name}>{model.name}</h3>
            {model.description && (
              <p className={styles.description}>{model.description}</p>
            )}
          </div>
          <span className={styles.price}>{formatStartingPrice(model.price)}</span>
        </div>
        <button
          type="button"
          className={styles.cta}
          onClick={() => onConfigure(model)}
          aria-label={`Configurer le modele ${model.name}`}
        >
          Configurer ce modele
        </button>
      </div>
    </article>
  )
}
