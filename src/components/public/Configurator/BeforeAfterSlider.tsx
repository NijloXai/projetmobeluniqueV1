'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import styles from './BeforeAfterSlider.module.css'

interface BeforeAfterSliderProps {
  beforeSrc: string
  afterSrc: string
  beforeAlt: string
  afterAlt: string
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50)
  const [mobileView, setMobileView] = useState<'before' | 'after'>('after')
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 480)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const relative = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, relative)))
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      updatePosition(e.clientX)
    },
    [updatePosition],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      updatePosition(e.clientX)
    },
    [updatePosition],
  )

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPosition((prev) => Math.max(0, prev - 5))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setPosition((prev) => Math.min(100, prev + 5))
    }
  }, [])

  return (
    <div>
      <div
        ref={containerRef}
        className={styles.container}
        style={{ '--slider-pos': `${position}%` } as React.CSSProperties}
        aria-label="Comparaison avant et apres la simulation"
      >
        {isMobile ? (
          <img
            className={styles.imageLayer}
            src={mobileView === 'before' ? beforeSrc : afterSrc}
            alt={mobileView === 'before' ? beforeAlt : afterAlt}
          />
        ) : (
          <>
            <img
              className={`${styles.imageLayer} ${styles.afterClip}`}
              src={afterSrc}
              alt={afterAlt}
            />
            <img
              className={`${styles.imageLayer} ${styles.beforeClip}`}
              src={beforeSrc}
              alt={beforeAlt}
            />
            <div className={styles.divider} />
            <button
              className={styles.handle}
              role="slider"
              aria-label="Curseur de comparaison avant apres"
              aria-valuenow={position}
              aria-valuemin={0}
              aria-valuemax={100}
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onKeyDown={handleKeyDown}
            >
              <ChevronsLeftRight className={styles.handleIcon} />
            </button>
            <span className={styles.labelBefore}>Avant</span>
            <span className={styles.labelAfter}>Après</span>
          </>
        )}
      </div>

      {isMobile && (
        <div className={styles.toggleBar}>
          <button
            type="button"
            className={`${styles.toggleButton} ${mobileView === 'before' ? styles.toggleButtonActive : ''}`}
            onClick={() => setMobileView('before')}
          >
            Avant
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${mobileView === 'after' ? styles.toggleButtonActive : ''}`}
            onClick={() => setMobileView('after')}
          >
            Après
          </button>
        </div>
      )}
    </div>
  )
}
