'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Sofa } from 'lucide-react'
import type { ModelWithImages } from '@/types/database'
import { getPrimaryImage, formatStartingPrice } from '@/lib/utils'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  model: ModelWithImages
  onConfigure: (model: ModelWithImages) => void
  index: number
}

export function ProductCard({ model, onConfigure, index }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const primaryImage = getPrimaryImage(model.model_images)

  // Chercher une seconde image avec une URL differente de la principale
  const secondImage =
    model.model_images.length > 1
      ? model.model_images.find((img) => img.image_url !== primaryImage)
          ?.image_url ?? null
      : null

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.imageWrapper}>
        {primaryImage ? (
          <>
            <Image
              src={primaryImage}
              alt={`Canape ${model.name}`}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`${styles.image} ${isHovered && secondImage ? styles.imageHidden : ''}`}
            />
            {secondImage && (
              <Image
                src={secondImage}
                alt={`Canape ${model.name} — vue alternative`}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`${styles.imageSecond} ${isHovered ? styles.imageSecondVisible : ''}`}
              />
            )}
          </>
        ) : (
          <div className={styles.imagePlaceholder}>
            <Sofa size={48} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{model.name}</h3>
        {model.description && (
          <p className={styles.description}>{model.description}</p>
        )}
        <span className={styles.price}>{formatStartingPrice(model.price)}</span>
        <button
          type="button"
          className={styles.cta}
          onClick={() => onConfigure(model)}
          aria-label={`Personnaliser le canape ${model.name}`}
        >
          Personnaliser
        </button>
      </div>
    </motion.article>
  )
}
