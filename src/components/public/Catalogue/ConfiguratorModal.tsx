'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Download, Share2, ExternalLink, RefreshCw } from 'lucide-react'
import type { ModelWithImages, ModelImage, Fabric, VisualWithFabricAndImage } from '@/types/database'
import { getPrimaryImage, getPrimaryImageId, formatStartingPrice, calculatePrice, formatPrice } from '@/lib/utils'
import styles from './ConfiguratorModal.module.css'

type SimulationState = 'idle' | 'preview' | 'generating' | 'done' | 'error'

// Module-level constants (IN-01 code review)
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif'])
const MAX_SIZE_BYTES = 15 * 1024 * 1024

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

  // Phase 11 — Simulation state machine
  const [modalStep, setModalStep] = useState<'configurator' | 'simulation'>('configurator')
  const [simulationState, setSimulationState] = useState<SimulationState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressPhase2TimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dragCounterRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Refs pour tracker les Object URLs courantes (eviter fuite memoire — WR-03)
  const previewUrlRef = useRef<string | null>(null)
  const resultBlobUrlRef = useRef<string | null>(null)

  // Track previous model ID to distinguish reopen (null→sameID) from model change (D-15 vs D-16)
  const previousModelIdRef = useRef<string | undefined>(undefined)

  // Synchroniser les refs Object URL avec le state (WR-03)
  useEffect(() => { previewUrlRef.current = previewUrl }, [previewUrl])
  useEffect(() => { resultBlobUrlRef.current = resultBlobUrl }, [resultBlobUrl])

  // Reset selection quand le modele change (RESEARCH.md Pattern 2) — Phase 8 + Phase 9 (D-16)
  useEffect(() => {
    if (!model) return // Fermeture modal — ne rien toucher (D-15)

    // Always reset fabric on open (Phase 8 D-09)
    setSelectedFabricId(null)

    // Phase 11 — reset simulation state quand le modele change
    setModalStep('configurator')
    setSimulationState('idle')
    setSelectedFile(null)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    setPreviewUrl(null)
    if (resultBlobUrlRef.current) URL.revokeObjectURL(resultBlobUrlRef.current)
    setResultBlobUrl(null)
    setProgress(0)
    setProgressStage(0)
    setErrorMessage(null)

    const currentId = model.id
    const previousId = previousModelIdRef.current

    // Reset angle uniquement si modele different ou premier open (D-16)
    if (currentId !== previousId) {
      setSelectedAngle(getPrimaryImageId(model.model_images))
    }
    // Meme modele reouvert — angle preserve (D-15)

    previousModelIdRef.current = currentId
  }, [model?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 11 — Validation fichier (D-10, D-11)
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_SIZE_BYTES) {
      return 'Ce fichier depasse 15 Mo. Choisissez une photo plus legere.'
    }
    const isAcceptedType = ACCEPTED_TYPES.has(file.type)
    const isHeicByExtension = /\.(heic|heif)$/i.test(file.name)
    if (!isAcceptedType && !isHeicByExtension) {
      return 'Format non supporte. Utilisez JPEG, PNG ou HEIC.'
    }
    return null
  }, [])

  const handleFileSelected = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setErrorMessage(error)
      setSimulationState('idle')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(url)
    setSimulationState('preview')
    setErrorMessage(null)
  }, [previewUrl, validateFile])

  // Phase 11 — Drag & drop avec compteur anti-flicker (RESEARCH.md Pattern 2)
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelected(file)
  }, [handleFileSelected])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelected(file)
    e.target.value = ''
  }, [handleFileSelected])

  // Phase 11 — Progress timer 2 phases (D-13)
  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
    if (progressPhase2TimerRef.current) { clearInterval(progressPhase2TimerRef.current); progressPhase2TimerRef.current = null }
  }, [])

  const startProgressTimer = useCallback(() => {
    stopProgressTimer()
    let current = 0
    setProgress(0)
    setProgressStage(0)

    // Phase rapide : 0-30% en ~1s (intervalle 50ms, +1.5 par tick)
    progressTimerRef.current = setInterval(() => {
      current += 1.5
      if (current >= 30) {
        current = 30
        if (progressTimerRef.current) clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
        setProgressStage(1)

        // Phase lente : 30-70% en ~4s (intervalle 200ms, +1 par tick)
        progressPhase2TimerRef.current = setInterval(() => {
          current += 1
          if (current >= 70) {
            current = 70
            if (progressPhase2TimerRef.current) clearInterval(progressPhase2TimerRef.current)
            progressPhase2TimerRef.current = null
            setProgressStage(2)
          }
          setProgress(Math.round(current))
        }, 200)
      }
      setProgress(Math.round(current))
    }, 50)
  }, [stopProgressTimer])

  // Phase 11 — Fetch simulation avec AbortController (D-15, D-16, D-17, D-18)
  const handleLancerSimulation = useCallback(async () => {
    if (!selectedFile || !model) return
    if (abortControllerRef.current) abortControllerRef.current.abort()

    const controller = new AbortController()
    abortControllerRef.current = controller

    setSimulationState('generating')
    setErrorMessage(null)
    startProgressTimer()

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('model_id', model.id)
      if (selectedFabricId) formData.append('fabric_id', selectedFabricId)

      const response = await fetch('/api/simulate', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'La simulation a echoue. Verifiez votre connexion et reessayez.' })) as { error?: string }
        throw new Error(data.error ?? 'La simulation a echoue. Verifiez votre connexion et reessayez.')
      }

      const blob = await response.blob()
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      const url = URL.createObjectURL(blob)

      stopProgressTimer()
      setProgress(100)
      setProgressStage(2)
      setResultBlobUrl(url)
      setSimulationState('done')
    } catch (err) {
      stopProgressTimer()
      if (err instanceof Error && err.name === 'AbortError') {
        setSimulationState('preview')
        setProgress(0)
        setProgressStage(0)
      } else {
        const message = err instanceof Error ? err.message : 'La simulation a echoue. Verifiez votre connexion et reessayez.'
        setErrorMessage(message)
        setSimulationState('error')
      }
    }
  }, [selectedFile, model, selectedFabricId, startProgressTimer, stopProgressTimer, resultBlobUrl])

  const handleAnnuler = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
  }, [])

  const handleReessayer = useCallback(() => {
    handleLancerSimulation()
  }, [handleLancerSimulation])

  // Phase 12 — Download resultat JPEG (D-06)
  const handleDownload = useCallback(() => {
    if (!resultBlobUrl) return
    const a = document.createElement('a')
    a.href = resultBlobUrl
    a.download = 'mobel-unique-simulation.jpg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [resultBlobUrl])

  // Phase 12 — Partage Web Share API avec fallback WhatsApp (D-07)
  const handlePartager = useCallback(async () => {
    if (!resultBlobUrl || !model) return

    const shopifyUrl = model.shopify_url ?? 'https://mobelunique.fr'
    const message = `Regardez comment ce canape s'integre dans mon salon ! Visualise avec Mobel Unique \u2014 ${shopifyUrl}`

    // Tenter Web Share API avec fichier (mobile)
    if (typeof navigator?.canShare === 'function') {
      try {
        const response = await fetch(resultBlobUrl)
        const blob = await response.blob()
        const file = new File([blob], 'mobel-unique-simulation.jpg', { type: 'image/jpeg' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Ma simulation M\u00f6bel Unique' })
          return
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        // Fall through to WhatsApp
      }
    }

    // Fallback WhatsApp (desktop ou navigateur sans support fichiers)
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }, [resultBlobUrl, model])

  // Phase 12 — Reset vers idle pour essayer une autre photo (D-09)
  const handleEssayerAutrePhoto = useCallback(() => {
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
    setResultBlobUrl(null)
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSimulationState('idle')
    setProgress(0)
    setProgressStage(0)
    setErrorMessage(null)
    // selectedFabricId et selectedAngle intentionnellement preserves (D-09)
  }, [resultBlobUrl, previewUrl])

  // Phase 11 — Step switching (D-01, D-02, D-03)
  const handleGoToSimulation = useCallback(() => {
    setModalStep('simulation')
    setSimulationState('idle')
    setErrorMessage(null)
  }, [])

  const handleBackToConfigurator = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    stopProgressTimer()
    setModalStep('configurator')
    setSimulationState(selectedFile ? 'preview' : 'idle')
    setProgress(0)
    setProgressStage(0)
    setErrorMessage(null)
  }, [stopProgressTimer, selectedFile])

  // Phase 11 — Cleanup Object URLs et timers au unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      if (progressPhase2TimerRef.current) clearInterval(progressPhase2TimerRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Phase 11 — SVG inline icons (pas de nouvelle dependance)
  const UploadIcon = (
    <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )

  const CheckIcon = (
    <svg className={styles.stepIcon} viewBox="0 0 16 16" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <polyline points="3 8 6.5 11.5 13 5" />
    </svg>
  )

  const SpinnerIcon = (
    <svg className={`${styles.stepIcon} ${styles.spinner}`} viewBox="0 0 16 16" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M8 2a6 6 0 1 1-5.2 3" />
    </svg>
  )

  const PendingIcon = (
    <svg className={styles.stepIcon} viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="8" r="5" />
    </svg>
  )

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

          {/* === Etape configurateur === */}
          {modalStep === 'configurator' && (
            <>
              <div className={styles.leftColumn}>
                {displayImageUrl && (
                  <div className={styles.imageWrapper}>
                    <Image
                      key={displayImageUrl}
                      src={displayImageUrl}
                      alt={imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className={`${styles.imageMain} ${styles.coverImage}`}
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
                          sizes="72px"
                          className={styles.coverImage}
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
                      {formatPrice(calculatePrice(model.price, selectedFabric.is_premium))}
                    </p>
                    {selectedFabric.is_premium && (
                      <p className={styles.priceSupplement}>+ 80&nbsp;EUR &middot; tissu premium</p>
                    )}
                  </div>
                ) : (
                  <p className={styles.price}>{formatStartingPrice(model.price)}</p>
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
                            sizes="56px"
                            className={styles.coverImage}
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

                {/* Phase 11 — CTA "Visualiser chez moi" (D-02) */}
                <button
                  type="button"
                  className={styles.ctaSimulation}
                  onClick={handleGoToSimulation}
                >
                  Visualiser chez moi
                </button>
              </div>
            </>
          )}

          {/* === Etape simulation === */}
          {modalStep === 'simulation' && (
            <div className={styles.simulationStep}>
              <div className={styles.leftColumn}>

                {/* Etat idle : zone upload DnD */}
                {simulationState === 'idle' && (
                  <div
                    className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDragging : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
                    aria-label="Zone de depot de fichier"
                  >
                    {UploadIcon}
                    <span className={styles.uploadText}>Glissez votre photo ici</span>
                    <span className={styles.uploadOr}>ou</span>
                    <button type="button" className={styles.uploadButton} onClick={() => fileInputRef.current?.click()}>
                      Choisir une photo
                    </button>
                    <span className={styles.uploadFormats} id="upload-formats">JPEG, PNG, HEIC — max 15 Mo</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/heic,image/heif"
                      className={styles.uploadHiddenInput}
                      onChange={handleInputChange}
                      aria-label="Selectionner une photo de votre salon"
                      aria-describedby="upload-formats"
                    />
                  </div>
                )}

                {/* Etat idle : message d'erreur validation fichier */}
                {simulationState === 'idle' && errorMessage && (
                  <p className={styles.errorMessage} role="alert" aria-live="assertive">{errorMessage}</p>
                )}

                {/* Etat preview ou error : apercu image */}
                {(simulationState === 'preview' || simulationState === 'error') && previewUrl && (
                  <>
                    <div className={styles.previewContainer}>
                      <img src={previewUrl} alt="Apercu de votre salon" className={styles.previewImage} />
                      <div className={styles.previewOverlay}>
                        <button type="button" className={styles.changePhotoLink} onClick={() => fileInputRef.current?.click()}>
                          Changer de photo
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/heic,image/heif"
                        className={styles.uploadHiddenInput}
                        onChange={handleInputChange}
                        aria-label="Selectionner une autre photo"
                      />
                    </div>
                    {simulationState === 'error' && errorMessage && (
                      <p className={styles.errorMessage} role="alert" aria-live="assertive">{errorMessage}</p>
                    )}
                    {simulationState === 'error' ? (
                      <button type="button" className={styles.retryButton} onClick={handleReessayer}>
                        Reessayer
                      </button>
                    ) : (
                      <button type="button" className={styles.launchButton} onClick={handleLancerSimulation}>
                        Lancer la simulation
                      </button>
                    )}
                  </>
                )}

                {/* Etat generating : photo fond + overlay progression */}
                {simulationState === 'generating' && previewUrl && (
                  <div className={styles.generatingContainer}>
                    <img src={previewUrl} alt="" className={styles.previewImage} />
                    <div className={styles.generatingOverlay}>
                      <span className={styles.stepActive}>
                        {progressStage === 0 ? 'Analyse de la piece' : progressStage === 1 ? 'Integration du canape' : 'Finition et eclairage'}
                      </span>
                      <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                        <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
                      </div>
                      <span className={styles.progressPercent}>{progress} %</span>
                      <div className={styles.stepList} aria-live="polite">
                        {(['Analyse de la piece', 'Integration du canape', 'Finition et eclairage'] as const).map((label, i) => (
                          <div key={label} className={`${styles.stepItem} ${i < progressStage ? styles.stepDone : i === progressStage ? styles.stepActive : styles.stepPending}`}>
                            {i < progressStage ? CheckIcon : i === progressStage ? SpinnerIcon : PendingIcon}
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                      <button type="button" className={styles.cancelButton} onClick={handleAnnuler}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Phase 12 — Etat done : resultat simulation (D-01) */}
                {simulationState === 'done' && resultBlobUrl && (
                  <>
                    <div
                      className={styles.resultContainer}
                      aria-live="polite"
                      aria-label="Simulation generee"
                    >
                      <img
                        src={resultBlobUrl}
                        alt={`Simulation IA de votre salon avec le canape ${model.name}`}
                        className={styles.resultImage}
                      />
                    </div>
                    <p className={styles.resultDisclaimer}>
                      Apercu genere par IA &mdash; le rendu reel peut varier
                    </p>
                    {/* Boutons d'action mobile uniquement (< 640px) — D-08 */}
                    <div className={styles.actionButtonsMobile} aria-hidden="false">
                      <button type="button" className={styles.downloadButton} onClick={handleDownload} aria-label="Telecharger la simulation en JPEG">
                        <Download size={16} aria-hidden="true" />
                        Telecharger
                      </button>
                      <button type="button" className={styles.shareButton} onClick={handlePartager} aria-label="Partager l'image">
                        <Share2 size={16} aria-hidden="true" />
                        Partager
                      </button>
                      {model.shopify_url && (
                        <a href={model.shopify_url} target="_blank" rel="noopener noreferrer" className={styles.orderButton} aria-label={`Commander le canape ${model.name} sur Shopify`}>
                          <ExternalLink size={16} aria-hidden="true" />
                          Commander sur Shopify
                        </a>
                      )}
                      <button type="button" className={styles.retryPhotoButton} onClick={handleEssayerAutrePhoto} aria-label="Essayer avec une autre photo de salon">
                        <RefreshCw size={14} aria-hidden="true" />
                        Essayer une autre photo
                      </button>
                    </div>
                  </>
                )}

              </div>

              {/* Colonne droite simulation */}
              <div className={styles.body}>
                <button type="button" className={styles.backButton} onClick={handleBackToConfigurator}>
                  &larr; Modifier la configuration
                </button>

                {simulationState === 'done' ? (
                  <>
                    <h2 id="modal-title" className={styles.simulationTitle}>Votre simulation</h2>
                    <p className={styles.resultSubtitle}>
                      {selectedFabric
                        ? `${model.name} \u00d7 ${selectedFabric.name} dans votre salon`
                        : 'Canape original dans votre salon'}
                    </p>

                    {/* Boutons d'action desktop uniquement (>= 640px) */}
                    <div className={styles.actionButtonsDesktop} aria-hidden="false">
                      <button type="button" className={styles.downloadButton} onClick={handleDownload} aria-label="Telecharger la simulation en JPEG">
                        <Download size={16} aria-hidden="true" />
                        Telecharger
                      </button>
                      <button type="button" className={styles.shareButton} onClick={handlePartager} aria-label="Partager l'image">
                        <Share2 size={16} aria-hidden="true" />
                        Partager
                      </button>
                      {model.shopify_url && (
                        <a href={model.shopify_url} target="_blank" rel="noopener noreferrer" className={styles.orderButton} aria-label={`Commander le canape ${model.name} sur Shopify`}>
                          <ExternalLink size={16} aria-hidden="true" />
                          Commander sur Shopify
                        </a>
                      )}
                      <button type="button" className={styles.retryPhotoButton} onClick={handleEssayerAutrePhoto} aria-label="Essayer avec une autre photo de salon">
                        <RefreshCw size={14} aria-hidden="true" />
                        Essayer une autre photo
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 id="modal-title" className={styles.simulationTitle}>Simulation</h2>

                    <p className={styles.uploadExplainer}>
                      Prenez votre salon en photo, on y place votre canap&eacute;
                    </p>

                    {/* Bandeau rappel config (D-05) */}
                    <div className={styles.configRecap}>
                      {selectedFabric?.swatch_url ? (
                        <Image src={selectedFabric.swatch_url} alt="" width={24} height={24} className={styles.configRecapSwatch} />
                      ) : (
                        <div className={styles.configRecapSwatch} style={{ background: 'var(--surface-container)' }} />
                      )}
                      <span className={styles.configRecapText}>
                        {selectedFabric ? `${model.name} \u00d7 ${selectedFabric.name}` : `Canap\u00e9 original \u00b7 Aucun tissu s\u00e9lectionn\u00e9`}
                      </span>
                      <button type="button" className={styles.configRecapLink} onClick={handleBackToConfigurator}>
                        Modifier
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </dialog>
  )
}
