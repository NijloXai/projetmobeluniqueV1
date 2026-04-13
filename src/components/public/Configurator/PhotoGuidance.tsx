'use client'

import { Check, X as XIcon } from 'lucide-react'
import styles from './StepSimulation.module.css'

export default function PhotoGuidance() {
  return (
    <div className={styles.guidance}>
      <p className={styles.guidanceTitle}>Conseils pour une bonne photo</p>
      <div className={styles.guidanceGrid}>
        <div className={styles.guidanceItem}>
          <Check size={14} className={styles.guidanceGood} aria-hidden="true" />
          <span>Bonne luminosité, sol visible</span>
        </div>
        <div className={styles.guidanceItem}>
          <XIcon size={14} className={styles.guidanceBad} aria-hidden="true" />
          <span>Trop sombre ou trop près</span>
        </div>
        <div className={styles.guidanceItem}>
          <Check size={14} className={styles.guidanceGood} aria-hidden="true" />
          <span>Vue large de la pièce</span>
        </div>
        <div className={styles.guidanceItem}>
          <XIcon size={14} className={styles.guidanceBad} aria-hidden="true" />
          <span>Photo floue ou en angle</span>
        </div>
      </div>
    </div>
  )
}
