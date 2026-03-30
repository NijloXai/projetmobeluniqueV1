'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { ModelWithImages, ModelImage, Fabric, VisualWithFabricAndImage } from '@/types/database'
import { calculatePrice, formatPrice as formatPriceUtil } from '@/lib/utils'
import styles from './ConfiguratorModal.module.css'

export function getPrimaryImage(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const image34 = model_images.find((img) => img.view_type === '3/4')
  if (image34) return image34.image_url
  return model_images[0].image_url
}

export function getPrimaryImageId(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const image34 = model_images.find((img) => img.view_type === '3/4')
  if (image34) return image34.id
  return model_images[0]?.id ?? null
}

export function formatPrice(price: number): string {
  return 'a partir de ' + new Intl.NumberFormat('fr-FR').format(price) + ' \u20ac'
}

interface ConfiguratorModalProps {
  model: ModelWithImages | null
  onClose: () => void
  fabrics: Fabric[]
  visuals: VisualWithFabricAndImage[]
}

export function ConfiguratorModal({ model, onClose, fabrics, visuals }: ConfiguratorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = model !== null

  // Scroll lock iOS-safe (position:fixed per RESEARCH.md Pattern 4)
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
  }, [open])

  // Synchronisation dialog natif (per ConfirmDialog pattern)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Backdrop click detection (per RESEARCH.md Pattern 3)
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  // State selection tissu — null = aucun tissu selectionne (etat initial)
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null)

  // State selection angle — initialise au 3/4 ou premier angle disponible
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null)

  // Reset selection quand le modele change (RESEARCH.md Pattern 2) — Phase 8 + Phase 9 (D-16)
  useEffect(() => {
    setSelectedFabricId(null)
    if (model) {
      setSelectedAngle(getPrimaryImageId(model.model_images))
    } else {
      setSelectedAngle(null)
    }
  }, [model?.id])

  // IMPORTANT : return null APRES tous les hooks (React rules of hooks)
  if (!model) return null

  // Phase 9 — angles disponibles : tous (sans tissu) ou filtres par rendu publie (avec tissu)
  const availableAngles: ModelImage[] = selectedFabricId
    ? model.model_images.filter((img) =>
        visuals.some(
          (v) =>
            v.model_id === model.id &&
            v.model_image_id === img.id &&
            v.fabric_id === selectedFabricId &&
            v.is_published
        )
      )
    : model.model_images

  // D-01: Filtrage tissus eligibles (ayant au moins un rendu publie pour ce modele)
  const eligibleFabricIds = new Set(
    visuals
      .filter(v => v.model_id === model.id && v.is_published)
      .map(v => v.fabric_id)
  )

  const eligibleFabrics = fabrics.filter(
    f => eligibleFabricIds.has(f.id) && f.swatch_url !== null
  )

  // Lookup du tissu et visual selectionnes
  const selectedFabric = selectedFabricId
    ? eligibleFabrics.find(f => f.id === selectedFabricId) ?? null
    : null

  // Phase 9 — currentVisual filtre aussi par angle selectionne
  const currentVisual = selectedFabricId && selectedAngle
    ? visuals.find(
        (v) =>
          v.model_id === model.id &&
          v.fabric_id === selectedFabricId &&
          v.model_image_id === selectedAngle &&
          v.is_published
      ) ?? null
    : null

  // Image a afficher : rendu IA si disponible, sinon photo de l'angle selectionne
  const selectedAngleImage = model.model_images.find((img) => img.id === selectedAngle)
  const displayImageUrl =
    currentVisual?.generated_image_url ??
    selectedAngleImage?.image_url ??
    getPrimaryImage(model.model_images)
  const isOriginalFallback = selectedFabricId !== null && currentVisual === null

  // Alt text dynamique avec angle (D-07)
  const angleLabel = selectedAngleImage?.view_type ?? ''
  const imageAlt =
    currentVisual && selectedFabric
      ? `Canape ${model.name} en tissu ${selectedFabric.name}${angleLabel ? ` \u2014 vue ${angleLabel}` : ''}`
      : selectedAngleImage
        ? `Canape ${model.name} \u2014 vue ${selectedAngleImage.view_type}`
        : `Canape ${model.name}`

  // Handler selection tissu avec preservation angle (D-12)
  const handleFabricSelect = (fabricId: string) => {
    setSelectedFabricId(fabricId)
    const hasRenderForCurrentAngle =
      selectedAngle !== null &&
      visuals.some(
        (v) =>
          v.model_id === model.id &&
          v.fabric_id === fabricId &&
          v.model_image_id === selectedAngle &&
          v.is_published
      )
    if (!hasRenderForCurrentAngle) {
      const anglesForFabric = model.model_images.filter((img) =>
        visuals.some(
          (v) =>
            v.model_id === model.id &&
            v.model_image_id === img.id &&
            v.fabric_id === fabricId &&
            v.is_published
        )
      )
      const default34 = anglesForFabric.find((img) => img.view_type === '3/4')
      setSelectedAngle(default34?.id ?? anglesForFabric[0]?.id ?? null)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={handleDialogClick}
    >
      <div className={styles.content}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer le configurateur"
          autoFocus
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className={styles.inner}>
          <div className={styles.leftColumn}>
            {displayImageUrl && (
              <div className={styles.imageWrapper}>
                <Image
                  key={displayImageUrl}
                  src={displayImageUrl}
                  alt={imageAlt}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className={styles.imageMain}
                />
                {isOriginalFallback && (
                  <span className={styles.badgeOriginalPhoto}>Photo originale</span>
                )}
              </div>
            )}

            {/* Phase 9 — Rangee thumbnails angles (D-11 : masquee si <= 1 angle disponible) */}
            {availableAngles.length > 1 && (
              <div
                className={styles.thumbnailRow}
                role="radiogroup"
                aria-label="Choisir l'angle de vue"
              >
                {availableAngles.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    role="radio"
                    aria-checked={selectedAngle === img.id}
                    aria-label={`Vue ${img.view_type}`}
                    className={`${styles.thumbnail} ${selectedAngle === img.id ? styles.thumbnailActive : ''}`}
                    onClick={() => setSelectedAngle(img.id)}
                  >
                    <Image
                      src={img.image_url}
                      alt=""
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="72px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.body}>
            <h2 id="modal-title" className={styles.modelName}>{model.name}</h2>

            {/* Prix dynamique — per D-10, D-11, D-12 */}
            {selectedFabric ? (
              <div className={styles.priceBlock}>
                <p className={styles.price}>
                  {formatPriceUtil(calculatePrice(model.price, selectedFabric.is_premium))}
                </p>
                {selectedFabric.is_premium && (
                  <p className={styles.priceSupplement}>+ 80&nbsp;EUR &middot; tissu premium</p>
                )}
              </div>
            ) : (
              <p className={styles.price}>{formatPrice(model.price)}</p>
            )}

            {model.description && (
              <p className={styles.description}>{model.description}</p>
            )}

            <hr className={styles.separator} />

            {/* Grille swatches — per D-04, D-05, D-06, CONF-01 */}
            <div className={styles.configurator}>
              <p className={styles.swatchLabel}>Choisissez votre tissu</p>

              {eligibleFabrics.length > 0 ? (
                <div
                  role="radiogroup"
                  aria-label="Choisissez votre tissu"
                  className={styles.swatchGrid}
                >
                  {eligibleFabrics.map(fabric => (
                    <button
                      key={fabric.id}
                      type="button"
                      role="radio"
                      aria-checked={selectedFabricId === fabric.id}
                      aria-label={`${fabric.name}${fabric.is_premium ? ' \u2014 Premium' : ''}`}
                      className={`${styles.swatch} ${selectedFabricId === fabric.id ? styles.swatchSelected : ''}`}
                      onClick={() => handleFabricSelect(fabric.id)}
                    >
                      <Image
                        src={fabric.swatch_url!}
                        alt=""
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="56px"
                      />
                      {fabric.is_premium && (
                        <span className={styles.badgePremium} aria-hidden="true">Premium</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className={styles.emptySwatches}>Aucun tissu disponible pour ce modele.</p>
              )}
            </div>

            {/* CTA Shopify — per D-14, D-15, CONF-09, CONF-10 */}
            {model.shopify_url && (
              <a
                href={model.shopify_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaShopify}
              >
                Acheter sur Shopify
              </a>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}
