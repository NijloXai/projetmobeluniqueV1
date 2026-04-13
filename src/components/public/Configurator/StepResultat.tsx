'use client'

import { Download, Share2, ExternalLink, RotateCcw } from 'lucide-react'
import type { StepResultatProps } from './types'
import BeforeAfterSlider from './BeforeAfterSlider'
import styles from './StepResultat.module.css'

export default function StepResultat({
  model,
  previewUrl,
  resultBlobUrl,
  fabricName,
  onDownload,
  onShare,
  onRetry,
  shopifyUrl,
}: StepResultatProps) {
  if (!resultBlobUrl || !previewUrl) return null

  const subtitle = fabricName
    ? `${model.name} × ${fabricName} dans votre salon`
    : model.name

  return (
    <div className={styles.container}>
      <div>
        <h3 className={styles.title}>Votre simulation</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <BeforeAfterSlider
        beforeSrc={previewUrl}
        afterSrc={resultBlobUrl}
        beforeAlt="Photo originale de votre salon"
        afterAlt={`Simulation avec le canapé ${model.name}`}
      />

      <p className={styles.disclaimer}>
        Aperçu généré par IA — le rendu réel peut varier
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.downloadButton}
          onClick={onDownload}
        >
          <Download size={16} aria-hidden="true" />
          Télécharger
        </button>

        <button
          type="button"
          className={styles.shareButton}
          onClick={onShare}
        >
          <Share2 size={16} aria-hidden="true" />
          Partager
        </button>

        {shopifyUrl && (
          <a
            href={shopifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.orderButton}
          >
            <ExternalLink size={16} aria-hidden="true" />
            Commander
          </a>
        )}

        <button
          type="button"
          className={styles.retryButton}
          onClick={onRetry}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Réessayer
        </button>
      </div>
    </div>
  )
}
