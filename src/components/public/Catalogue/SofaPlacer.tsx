'use client'

import { useState, useRef, useCallback } from 'react'
import styles from './SofaPlacer.module.css'

export interface PlacementRect {
  x: number
  y: number
  width: number
  height: number
}

interface SofaPlacerProps {
  imageUrl: string
  sofaName: string
  sofaWidth: number
  sofaDepth: number
  onLaunch: (rect: PlacementRect) => void
  onChangePhoto: () => void
}

const MIN_SCALE = 20
const MAX_SCALE = 80
const DEFAULT_SCALE = 45

export function SofaPlacer({
  imageUrl,
  sofaName,
  sofaWidth,
  sofaDepth,
  onLaunch,
  onChangePhoto,
}: SofaPlacerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const aspectRatio = sofaWidth / sofaDepth

  const [scale, setScale] = useState(DEFAULT_SCALE)

  const rectW = scale
  const rectH = Math.min(scale / aspectRatio, 90)

  const [pos, setPos] = useState({ x: (100 - rectW) / 2, y: 55 - rectH / 2 })
  const dragging = useRef(false)
  const dragStart = useRef({ px: 0, py: 0, startX: 0, startY: 0 })

  const clamp = useCallback((x: number, y: number, w: number, h: number) => ({
    x: Math.max(0, Math.min(x, 100 - w)),
    y: Math.max(0, Math.min(y, 100 - h)),
  }), [])

  const handleScaleChange = useCallback((newScale: number) => {
    setScale(newScale)
    const newW = newScale
    const newH = Math.min(newScale / aspectRatio, 90)
    setPos(prev => clamp(prev.x, prev.y, newW, newH))
  }, [aspectRatio, clamp])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    const container = containerRef.current
    if (!container) return
    dragStart.current = {
      px: e.clientX,
      py: e.clientY,
      startX: pos.x,
      startY: pos.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos.x, pos.y])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragStart.current.px) / rect.width) * 100
    const dy = ((e.clientY - dragStart.current.py) / rect.height) * 100
    setPos(clamp(
      dragStart.current.startX + dx,
      dragStart.current.startY + dy,
      rectW,
      rectH
    ))
  }, [clamp, rectW, rectH])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const handleLaunch = useCallback(() => {
    onLaunch({ x: pos.x, y: pos.y, width: rectW, height: rectH })
  }, [onLaunch, pos.x, pos.y, rectW, rectH])

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.container}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <img
          src={imageUrl}
          alt="Votre salon"
          className={styles.roomImage}
          draggable={false}
        />

        <div
          className={styles.placementRect}
          role="application"
          aria-label="Zone de placement du canape — deplacer avec le doigt ou la souris"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: `${rectW}%`,
            height: `${rectH}%`,
          }}
          onPointerDown={handlePointerDown}
        >
          <span className={styles.dimensionBadge}>
            {sofaWidth} &times; {sofaDepth} cm
          </span>
        </div>

        <button
          type="button"
          className={styles.changePhotoButton}
          onClick={onChangePhoto}
        >
          Changer de photo
        </button>
      </div>

      <div className={styles.sliderRow}>
        <label htmlFor="sofa-scale" className={styles.sliderLabel}>Taille</label>
        <input
          id="sofa-scale"
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          value={scale}
          onChange={e => handleScaleChange(Number(e.target.value))}
          className={styles.slider}
          aria-label="Taille apparente du canape"
        />
      </div>

      <button
        type="button"
        className={styles.launchButton}
        onClick={handleLaunch}
      >
        Lancer la simulation
      </button>
    </div>
  )
}
