'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import type { StepApercuProps } from './types';
import { formatPrice } from '@/lib/utils';
import styles from './StepApercu.module.css';

export default function StepApercu({
  model,
  visuals,
  selectedFabricId,
  selectedAngle,
  onSelectAngle,
  onSimulate,
  fabricName,
  isPremium,
  totalPrice,
}: StepApercuProps) {
  const availableAngles = useMemo(() => {
    if (!selectedFabricId) return model.model_images;

    const publishedImageIds = new Set(
      visuals
        .filter((v) => v.fabric_id === selectedFabricId && v.is_published)
        .map((v) => v.model_image_id),
    );

    return model.model_images.filter((img) => publishedImageIds.has(img.id));
  }, [model.model_images, visuals, selectedFabricId]);

  return (
    <div className={styles.container}>
      <div>
        <h3 className={styles.title}>{model.name}</h3>
        {fabricName && (
          <p className={styles.subtitle}>
            Tissu : {fabricName}
            {isPremium ? ' (Premium)' : ''}
          </p>
        )}
      </div>

      {availableAngles.length > 1 && (
        <div
          className={styles.thumbnailRow}
          role="radiogroup"
          aria-label="Angles de vue disponibles"
        >
          {availableAngles.map((img) => (
            <button
              key={img.id}
              type="button"
              role="radio"
              aria-checked={selectedAngle === img.id}
              aria-label={`Vue ${img.view_type}`}
              className={`${styles.thumbnail}${selectedAngle === img.id ? ` ${styles.thumbnailActive}` : ''}`}
              onClick={() => onSelectAngle(img.id)}
            >
              <Image
                src={img.image_url}
                alt={`Vue ${img.view_type}`}
                fill
                sizes="72px"
                className={styles.thumbnailImage}
              />
            </button>
          ))}
        </div>
      )}

      <div className={styles.priceRow}>
        <span className={styles.priceLabel}>Prix total</span>
        <span className={styles.priceValue}>{formatPrice(totalPrice)}</span>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.ctaPrimary}
          onClick={onSimulate}
        >
          Simuler chez moi
        </button>
        {model.shopify_url && (
          <a
            href={model.shopify_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaSecondary}
          >
            Voir sur la boutique
          </a>
        )}
      </div>
    </div>
  );
}
