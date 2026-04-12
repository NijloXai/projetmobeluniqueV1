'use client'

import { useState, useRef, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import type { PlacementRect } from './types'
import styles from './SofaPlacer.module.css'

interface SofaPlacerProps {
  imageUrl: string
  sofaWidth: number
  sofaDepth: number
  onLaunch: (rect: PlacementRect) => void
  onChangePhoto: () => void
}

const MIN_SCALE = 20
const MAX_SCALE = 80
const DEFAULT_SCALE = 45
const DEFAULT_Y = 55

export function SofaPlacer({
  imageUrl,
  sofaWidth,
  sofaDepth,
  onLaunch,
  onChangePhoto,
}: SofaPlacerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const aspectRatio = sofaWidth / sofaDepth

  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [hasDragged, setHasDragged] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const rectW = scale
  const rectH = Math.min(scale / aspectRatio, 90)

  const [pos, setPos] = useState({ x: (100 - rectW) / 2, y: DEFAULT_Y - rectH / 2 })
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

  const handleReset = useCallback(() => {
    setScale(DEFAULT_SCALE)
    const resetW = DEFAULT_SCALE
    const resetH = Math.min(DEFAULT_SCALE / aspectRatio, 90)
    setPos({
      x: (100 - resetW) / 2,
      y: DEFAULT_Y - resetH / 2,
    })
  }, [aspectRatio])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    setIsDragging(true)
    if (!hasDragged) setHasDragged(true)
    const container = containerRef.current
    if (!container) return
    dragStart.current = {
      px: e.clientX,
      py: e.clientY,
      startX: pos.x,
      startY: pos.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos.x, pos.y, hasDragged])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragStart.current.px) / rect.width) * 100
    const dy = ((e.clientY - dragStart.current.py) / rect.height) * 100
    setPos(clamp(
      dragStart.current.startX + dx,
      dragStart.current.startY + dy,
      rectW,
      rectH,
    ))
  }, [clamp, rectW, rectH])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
    setIsDragging(false)
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

        {/* Guide lines */}
        <div className={styles.guideLine} style={{ top: '33%' }} />
        <div className={styles.guideLine} style={{ top: '66%' }} />

        {/* Reset button */}
        <button
          type="button"
          className={styles.resetButton}
          onClick={handleReset}
        >
          <RotateCcw size={12} />
          Reset
        </button>

        {/* Draggable placement rectangle */}
        <div
          className={`${styles.placementRect}${isDragging ? ` ${styles.rectDragging}` : ''}`}
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

        {/* Instruction label */}
        <span
          className={`${styles.instructionLabel}${hasDragged ? ` ${styles.instructionLabelHidden}` : ''}`}
        >
          Deplacez le rectangle pour positionner votre canape
        </span>
      </div>

      <div className={styles.sliderRow}>
        <label htmlFor="sofa-scale" className={styles.sliderLabel}>
          Taille du canape
        </label>
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

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.launchButton}
          onClick={handleLaunch}
        >
          Lancer la simulation
        </button>
        <button
          type="button"
          className={styles.changePhotoButton}
          onClick={onChangePhoto}
        >
          Changer la photo
        </button>
      </div>
    </div>
  )
}
