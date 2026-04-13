'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import type { StepTissuProps } from './types'
import { calculatePrice, formatPrice } from '@/lib/utils'
import styles from './StepTissu.module.css'

export default function StepTissu({
  model,
  fabrics,
  visuals,
  selectedFabricId,
  selectedAngle,
  onSelectFabric,
  onSelectAngle,
  onNext,
}: StepTissuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const eligibleFabricIds = useMemo(() => {
    const ids = visuals
      .filter((v) => v.model_id === model.id && v.is_published)
      .map((v) => v.fabric_id)
    return new Set(ids)
  }, [visuals, model.id])

  const eligibleFabrics = useMemo(
    () => fabrics.filter((f) => eligibleFabricIds.has(f.id) && f.swatch_url !== null),
    [fabrics, eligibleFabricIds],
  )

  const categories = useMemo(() => {
    const cats = eligibleFabrics
      .map((f) => f.category)
      .filter((c): c is string => c !== null)
    return [...new Set(cats)].sort()
  }, [eligibleFabrics])

  const filteredFabrics = activeCategory
    ? eligibleFabrics.filter((f) => f.category === activeCategory)
    : eligibleFabrics

  const selectedFabric = eligibleFabrics.find((f) => f.id === selectedFabricId) ?? null

  function handleFabricSelect(fabricId: string) {
    onSelectFabric(fabricId)

    // Check if current selectedAngle has a published render for this fabric
    const hasCurrentAngle = selectedAngle
      ? visuals.some(
          (v) =>
            v.model_id === model.id &&
            v.fabric_id === fabricId &&
            v.model_image_id === selectedAngle &&
            v.is_published,
        )
      : false

    if (!hasCurrentAngle) {
      // Find angles that have published renders for this fabric
      const availableVisuals = visuals.filter(
        (v) => v.model_id === model.id && v.fabric_id === fabricId && v.is_published,
      )

      if (availableVisuals.length > 0) {
        // Prefer 3/4 view_type
        const preferred = availableVisuals.find((v) => {
          const img = model.model_images.find((mi) => mi.id === v.model_image_id)
          return img?.view_type === '3/4'
        })
        const fallback = availableVisuals[0]
        onSelectAngle((preferred ?? fallback).model_image_id)
      }
    }
  }

  const totalPrice = selectedFabric
    ? calculatePrice(model.price, selectedFabric.is_premium)
    : model.price

  return (
    <div className={styles.container}>
      {categories.length > 1 && (
        <div className={styles.categoryTabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeCategory === null}
            className={`${styles.categoryPill} ${activeCategory === null ? styles.categoryPillActive : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`${styles.categoryPill} ${activeCategory === cat ? styles.categoryPillActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filteredFabrics.length === 0 ? (
        <p className={styles.emptyMessage}>Aucun tissu disponible pour ce modele.</p>
      ) : (
        <div className={styles.swatchGrid} role="radiogroup" aria-label="Selection du tissu">
          {filteredFabrics.map((fabric) => (
            <button
              key={fabric.id}
              role="radio"
              aria-checked={selectedFabricId === fabric.id}
              aria-label={`${fabric.name}${fabric.is_premium ? ' — tissu premium (+80 €)' : ''}`}
              className={`${styles.swatch} ${selectedFabricId === fabric.id ? styles.swatchSelected : ''}`}
              onClick={() => handleFabricSelect(fabric.id)}
            >
              <Image
                src={fabric.swatch_url!}
                alt={fabric.name}
                fill
                sizes="48px"
                className={styles.swatchImage}
              />
            </button>
          ))}
        </div>
      )}

      {selectedFabric && (
        <p className={styles.fabricInfo}>
          {selectedFabric.name}
          {selectedFabric.is_premium && (
            <span className={styles.fabricInfoPremium}> — Premium (+80 €)</span>
          )}
        </p>
      )}

      <div className={styles.priceBlock}>
        <p className={styles.totalLabel}>Total</p>
        <p className={styles.totalPrice}>{formatPrice(totalPrice)}</p>
        <button
          className={styles.ctaNext}
          disabled={!selectedFabricId}
          onClick={onNext}
        >
          Suivant — Apercu des angles
        </button>
      </div>
    </div>
  )
}
