import Image from 'next/image'
import { Sofa } from 'lucide-react'
import type { ModelWithImages, ModelImage } from '@/types/database'
import styles from './ProductCard.module.css'

function getPrimaryImage(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const image34 = model_images.find((img) => img.view_type === '3/4')
  if (image34) return image34.image_url
  return model_images[0].image_url
}

function formatPrice(price: number): string {
  return 'a partir de ' + new Intl.NumberFormat('fr-FR').format(price) + ' \u20ac'
}

interface ProductCardProps {
  model: ModelWithImages
  onConfigure?: (model: ModelWithImages) => void
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
          <span className={styles.price}>{formatPrice(model.price)}</span>
        </div>
        <button
          type="button"
          className={styles.cta}
          onClick={() => onConfigure?.(model)}
          aria-label={`Configurer le modele ${model.name}`}
        >
          Configurer ce modele
        </button>
      </div>
    </article>
  )
}
