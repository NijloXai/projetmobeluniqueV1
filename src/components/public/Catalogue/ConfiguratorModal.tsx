'use client'

import { useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { ModelWithImages, ModelImage, Fabric, VisualWithFabricAndImage } from '@/types/database'
import styles from './ConfiguratorModal.module.css'

export function getPrimaryImage(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const image34 = model_images.find((img) => img.view_type === '3/4')
  if (image34) return image34.image_url
  return model_images[0].image_url
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

export function ConfiguratorModal({ model, onClose, fabrics: _fabrics, visuals: _visuals }: ConfiguratorModalProps) {
  // _fabrics et _visuals : Props utilisees en Phase 8 (swatches, rendu IA, prix)
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

  // IMPORTANT : return null APRES tous les hooks (React rules of hooks)
  if (!model) return null

  const imageUrl = getPrimaryImage(model.model_images)

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
          {imageUrl && (
            <div className={styles.imageWrapper}>
              <Image
                src={imageUrl}
                alt={`Canape ${model.name}`}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
          )}

          <div className={styles.body}>
            <h2 id="modal-title" className={styles.modelName}>{model.name}</h2>
            <p className={styles.price}>{formatPrice(model.price)}</p>
            {model.description && (
              <p className={styles.description}>{model.description}</p>
            )}
            <hr className={styles.separator} />
            <div className={styles.placeholder}>
              <p className={styles.placeholderTitle}>Configurateur a venir</p>
              <p className={styles.placeholderText}>
                Bientot, personnalisez tissu et couleur depuis cette page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
