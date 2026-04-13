'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, CheckCircle, Circle, Loader } from 'lucide-react'
import type { StepSimulationProps, PlacementRect } from './types'
import { ACCEPTED_TYPES, MAX_SIZE_BYTES } from './types'
import { parseDimensions } from '@/lib/utils'
import { SofaPlacer } from './SofaPlacer'
import PhotoGuidance from './PhotoGuidance'
import PresetRooms from './PresetRooms'
import styles from './StepSimulation.module.css'

const GENERATION_STEPS = [
  'Analyse de votre photo...',
  'Placement du canape...',
  'Application des textures...',
  'Finalisation du rendu...',
]

export default function StepSimulation({
  model,
  previewUrl,
  simulationStatus,
  errorMessage,
  progress,
  progressStage,
  onFileSelected,
  onPresetSelected,
  onLaunch,
  onChangePhoto,
  onCancel,
}: StepSimulationProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [presetId, setPresetId] = useState<string | null>(null)
  const dragCounterRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // -----------------------------------------------------------------------
  // Derived
  // -----------------------------------------------------------------------

  const dims = model.dimensions ? parseDimensions(model.dimensions) : null
  const sofaWidth = dims?.width ?? 250
  const sofaDepth = dims?.depth ?? 160

  // -----------------------------------------------------------------------
  // Upload helpers
  // -----------------------------------------------------------------------

  const handleFileChange = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.has(file.type)) return
      if (file.size > MAX_SIZE_BYTES) return
      onFileSelected(file)
    },
    [onFileSelected],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileChange(file)
    },
    [handleFileChange],
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (dragCounterRef.current === 1) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current = 0
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileChange(file)
    },
    [handleFileChange],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }, [])

  const handlePresetSelect = useCallback(
    (id: string) => {
      setPresetId(id)
      onPresetSelected(id)
    },
    [onPresetSelected],
  )

  const handleLaunch = useCallback(
    (rect: PlacementRect) => {
      onLaunch(rect)
    },
    [onLaunch],
  )

  // -----------------------------------------------------------------------
  // Determine active generation step index from progressStage
  // -----------------------------------------------------------------------

  const activeStepIndex = (() => {
    if (!progressStage) return 0
    const idx = GENERATION_STEPS.findIndex((s) => s === progressStage)
    return idx >= 0 ? idx : Math.min(Math.floor((progress / 100) * GENERATION_STEPS.length), GENERATION_STEPS.length - 1)
  })()

  // -----------------------------------------------------------------------
  // Render: done → null
  // -----------------------------------------------------------------------

  if (simulationStatus === 'done') return null

  // -----------------------------------------------------------------------
  // Render: generating
  // -----------------------------------------------------------------------

  if (simulationStatus === 'generating' && previewUrl) {
    return (
      <div className={styles.container}>
        <div className={styles.generatingContainer}>
          <img
            src={previewUrl}
            alt="Photo en cours de traitement"
            className={styles.generatingImage}
          />
          <div className={styles.generatingOverlay}>
            <div className={styles.stepList}>
              {GENERATION_STEPS.map((label, i) => {
                const isDone = i < activeStepIndex
                const isActive = i === activeStepIndex
                return (
                  <div
                    key={label}
                    className={`${styles.stepItem}${isActive ? ` ${styles.stepItemActive}` : ''}${isDone ? ` ${styles.stepItemDone}` : ''}`}
                  >
                    {isDone && (
                      <CheckCircle size={16} className={styles.stepIcon} aria-hidden="true" />
                    )}
                    {isActive && (
                      <Loader size={16} className={`${styles.stepIcon} ${styles.spinner}`} aria-hidden="true" />
                    )}
                    {!isDone && !isActive && (
                      <Circle size={16} className={styles.stepIcon} aria-hidden="true" />
                    )}
                    <span>{label}</span>
                  </div>
                )
              })}
            </div>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render: placing or error (previewUrl exists)
  // -----------------------------------------------------------------------

  if ((simulationStatus === 'placing' || simulationStatus === 'error') && previewUrl) {
    return (
      <div className={styles.container}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className={styles.hiddenInput}
          onChange={handleInputChange}
        />
        <SofaPlacer
          imageUrl={previewUrl}
          sofaWidth={sofaWidth}
          sofaDepth={sofaDepth}
          onLaunch={handleLaunch}
          onChangePhoto={onChangePhoto}
        />
        {simulationStatus === 'error' && errorMessage && (
          <p className={styles.errorMessage}>{errorMessage}</p>
        )}
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render: idle (no previewUrl)
  // -----------------------------------------------------------------------

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className={styles.hiddenInput}
        onChange={handleInputChange}
      />

      <div
        className={`${styles.uploadZone}${isDragging ? ` ${styles.uploadZoneDragging}` : ''}`}
        role="button"
        tabIndex={0}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={styles.uploadIcon} aria-hidden="true" />
        <span className={styles.uploadText}>Glissez votre photo ici</span>
        <span className={styles.uploadOr}>ou</span>
        <button
          type="button"
          className={styles.uploadButton}
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
        >
          Choisir une photo
        </button>
        <span className={styles.uploadFormats}>JPEG, PNG, WebP ou HEIC — 15 Mo max</span>
      </div>

      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

      <PhotoGuidance />
      <PresetRooms selectedId={presetId} onSelect={handlePresetSelect} />
    </div>
  )
}
