'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type {
  ConfiguratorProps,
  ConfiguratorStep,
  SimulationStatus,
  PlacementRect,
} from './types'
import { ACCEPTED_TYPES, MAX_SIZE_BYTES } from './types'
import { getPrimaryImage, getPrimaryImageId, calculatePrice, formatPrice } from '@/lib/utils'
import ConfiguratorStepper from './ConfiguratorStepper'
import StepTissu from './StepTissu'
import StepApercu from './StepApercu'
import StepSimulation from './StepSimulation'
import StepResultat from './StepResultat'
import Toast from './Toast'
import styles from './configurator.module.css'

// ---------------------------------------------------------------------------
// Progress timer stages
// ---------------------------------------------------------------------------

const STAGE_LABELS = [
  'Analyse de votre photo...',
  'Placement du canape...',
  'Application des textures...',
  'Finalisation du rendu...',
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Configurator({ model, onClose, fabrics, visuals }: ConfiguratorProps) {
  const open = model !== null

  // ---- State ---------------------------------------------------------------
  const [step, setStep] = useState<ConfiguratorStep>('tissu')
  const [completedSteps, setCompletedSteps] = useState<Set<ConfiguratorStep>>(new Set())
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null)
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null)
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  // ---- Refs ----------------------------------------------------------------
  const dialogRef = useRef<HTMLDialogElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressPhase2TimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const resultBlobUrlRef = useRef<string | null>(null)
  const previousModelIdRef = useRef<string | undefined>(undefined)

  // Sync refs with state for cleanup
  useEffect(() => { previewUrlRef.current = previewUrl }, [previewUrl])
  useEffect(() => { resultBlobUrlRef.current = resultBlobUrl }, [resultBlobUrl])

  // ---- Scroll lock (iOS-safe position:fixed) -------------------------------
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

  // ---- Dialog sync ---------------------------------------------------------
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  // ---- Reset on model change -----------------------------------------------
  useEffect(() => {
    if (!model) return

    setStep('tissu')
    setCompletedSteps(new Set())
    setSelectedFabricId(null)
    setSimulationStatus('idle')
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    setPreviewUrl(null)
    if (resultBlobUrlRef.current) URL.revokeObjectURL(resultBlobUrlRef.current)
    setResultBlobUrl(null)
    setProgress(0)
    setProgressStage(null)
    setErrorMessage(null)

    const currentId = model.id
    const previousId = previousModelIdRef.current
    if (currentId !== previousId) {
      setSelectedAngle(getPrimaryImageId(model.model_images))
    }
    previousModelIdRef.current = currentId
  }, [model?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Cleanup on unmount --------------------------------------------------
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (resultBlobUrlRef.current) URL.revokeObjectURL(resultBlobUrlRef.current)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      if (progressPhase2TimerRef.current) clearInterval(progressPhase2TimerRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  // ---- Progress timer ------------------------------------------------------
  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
    if (progressPhase2TimerRef.current) { clearInterval(progressPhase2TimerRef.current); progressPhase2TimerRef.current = null }
  }, [])

  const startProgressTimer = useCallback(() => {
    stopProgressTimer()
    let current = 0
    setProgress(0)
    setProgressStage(STAGE_LABELS[0])

    // Phase 1: 0 -> 30% in ~1s (50ms, +1.5/tick)
    progressTimerRef.current = setInterval(() => {
      current += 1.5
      if (current >= 30) {
        current = 30
        if (progressTimerRef.current) clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
        setProgressStage(STAGE_LABELS[1])

        // Phase 2: 30 -> 70% in ~4s (200ms, +1/tick)
        progressPhase2TimerRef.current = setInterval(() => {
          current += 1
          if (current >= 70) {
            current = 70
            if (progressPhase2TimerRef.current) clearInterval(progressPhase2TimerRef.current)
            progressPhase2TimerRef.current = null
            setProgressStage(STAGE_LABELS[2])
          }
          setProgress(Math.round(current))
        }, 200)
      }
      setProgress(Math.round(current))
    }, 50)
  }, [stopProgressTimer])

  // ---- Navigation ----------------------------------------------------------
  const navigateToStep = useCallback((target: ConfiguratorStep) => {
    setStep(target)
  }, [])

  const goToApercu = useCallback(() => {
    setCompletedSteps((prev) => new Set(prev).add('tissu'))
    setStep('apercu')
  }, [])

  const goToSimulation = useCallback(() => {
    setCompletedSteps((prev) => new Set(prev).add('apercu'))
    setStep('simulation')
    setSimulationStatus('idle')
    setErrorMessage(null)
  }, [])

  // ---- File / Preset handling ----------------------------------------------
  const handleFileSelected = useCallback((file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage('Ce fichier depasse 15 Mo. Choisissez une photo plus legere.')
      setSimulationStatus('idle')
      return
    }
    const isAccepted = ACCEPTED_TYPES.has(file.type) || /\.(heic|heif)$/i.test(file.name)
    if (!isAccepted) {
      setErrorMessage('Format non supporte. Utilisez JPEG, PNG, WebP ou HEIC.')
      setSimulationStatus('idle')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setSimulationStatus('placing')
    setErrorMessage(null)
  }, [previewUrl])

  const handlePresetSelected = useCallback((presetId: string) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(`/presets/${presetId}.webp`)
    setSimulationStatus('placing')
    setErrorMessage(null)
  }, [previewUrl])

  const handleChangePhoto = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSimulationStatus('idle')
    setErrorMessage(null)
  }, [previewUrl])

  // ---- Launch simulation ---------------------------------------------------
  const handleLaunch = useCallback(async (rect: PlacementRect) => {
    if (!model || !previewUrl) return

    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setSimulationStatus('generating')
    setErrorMessage(null)
    startProgressTimer()

    try {
      // Fetch previewUrl blob (needed for presets which are not File objects)
      const imageResponse = await fetch(previewUrl, { signal: controller.signal })
      const imageBlob = await imageResponse.blob()

      const formData = new FormData()
      formData.append('image', imageBlob, 'room.jpg')
      formData.append('model_id', model.id)
      if (selectedFabricId) formData.append('fabric_id', selectedFabricId)
      formData.append('rect', JSON.stringify(rect))

      const response = await fetch('/api/simulate', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({
          error: 'La simulation a echoue. Verifiez votre connexion et reessayez.',
        })) as { error?: string }
        throw new Error(data.error ?? 'La simulation a echoue. Verifiez votre connexion et reessayez.')
      }

      const blob = await response.blob()
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      const url = URL.createObjectURL(blob)

      stopProgressTimer()
      setProgress(100)
      setProgressStage(STAGE_LABELS[3])
      setResultBlobUrl(url)
      setSimulationStatus('done')
      setCompletedSteps((prev) => new Set(prev).add('simulation'))
      setStep('resultat')
    } catch (err) {
      stopProgressTimer()
      if (err instanceof Error && err.name === 'AbortError') {
        setSimulationStatus('placing')
        setProgress(0)
        setProgressStage(null)
      } else {
        const message = err instanceof Error
          ? err.message
          : 'La simulation a echoue. Verifiez votre connexion et reessayez.'
        setErrorMessage(message)
        setSimulationStatus('error')
      }
    }
  }, [model, previewUrl, selectedFabricId, startProgressTimer, stopProgressTimer, resultBlobUrl])

  // ---- Result actions ------------------------------------------------------
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setToastVisible(true)
  }, [])

  const handleDownload = useCallback(() => {
    if (!resultBlobUrl) return
    const a = document.createElement('a')
    a.href = resultBlobUrl
    a.download = 'mobel-unique-simulation.jpg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showToast('Image telechargee')
  }, [resultBlobUrl, showToast])

  const handleShare = useCallback(async () => {
    if (!resultBlobUrl || !model) return

    const shopifyUrl = model.shopify_url ?? 'https://mobelunique.fr'
    const message = `Regardez comment ce canape s'integre dans mon salon ! Visualise avec Mobel Unique \u2014 ${shopifyUrl}`

    if (typeof navigator?.canShare === 'function') {
      try {
        const response = await fetch(resultBlobUrl)
        const blob = await response.blob()
        const file = new File([blob], 'mobel-unique-simulation.jpg', { type: 'image/jpeg' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Ma simulation M\u00f6bel Unique' })
          showToast('Image partagee')
          return
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
    showToast('Lien WhatsApp ouvert')
  }, [resultBlobUrl, model, showToast])

  const handleRetry = useCallback(() => {
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
    setResultBlobUrl(null)
    setStep('simulation')
    setSimulationStatus('placing')
    setProgress(0)
    setProgressStage(null)
    setErrorMessage(null)
  }, [resultBlobUrl])

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
  }, [])

  // ---- MUST return null AFTER all hooks (React rules of hooks) -------------
  if (!model) return null

  // ---- Derived values ------------------------------------------------------
  const selectedFabric = fabrics.find((f) => f.id === selectedFabricId) ?? null
  const currentVisual = selectedFabricId && selectedAngle
    ? visuals.find(
        (v) =>
          v.model_id === model.id &&
          v.fabric_id === selectedFabricId &&
          v.model_image_id === selectedAngle &&
          v.is_published,
      ) ?? null
    : null

  const selectedAngleImage = model.model_images.find((img) => img.id === selectedAngle)
  const displayImageUrl =
    currentVisual?.generated_image_url ??
    selectedAngleImage?.image_url ??
    getPrimaryImage(model.model_images)
  const isOriginalFallback = selectedFabricId !== null && currentVisual === null
  const totalPrice = selectedFabric
    ? calculatePrice(model.price, selectedFabric.is_premium)
    : model.price

  // ---- Render --------------------------------------------------------------
  const showImagePreview = step === 'tissu' || step === 'apercu'

  return (
    <>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-modal="true"
        role="dialog"
        aria-labelledby="configurator-title"
        onClose={onClose}
      >
        <div className={styles.layout}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer le configurateur"
          >
            <X size={20} aria-hidden="true" />
          </button>

          <ConfiguratorStepper
            currentStep={step}
            completedSteps={completedSteps}
            onNavigate={navigateToStep}
          />

          <div className={styles.content}>
            {/* ---- Left column ---- */}
            <div className={styles.leftColumn}>
              {showImagePreview && displayImageUrl && (
                <div className={styles.imageWrapper}>
                  <Image
                    key={displayImageUrl}
                    src={displayImageUrl}
                    alt={`Canape ${model.name}`}
                    fill
                    sizes="(max-width: 1023px) 100vw, 60vw"
                    className={styles.imageMain}
                  />
                  {isOriginalFallback && (
                    <span className={styles.badgeOriginal}>Photo originale</span>
                  )}
                </div>
              )}

              {step === 'simulation' && (
                <StepSimulation
                  model={model}
                  previewUrl={previewUrl}
                  simulationStatus={simulationStatus}
                  errorMessage={errorMessage}
                  progress={progress}
                  progressStage={progressStage}
                  onFileSelected={handleFileSelected}
                  onPresetSelected={handlePresetSelected}
                  onLaunch={handleLaunch}
                  onChangePhoto={handleChangePhoto}
                  onCancel={handleCancel}
                  fabricName={selectedFabric?.name ?? ''}
                  selectedFabricId={selectedFabricId}
                />
              )}

              {step === 'resultat' && (
                <StepResultat
                  model={model}
                  previewUrl={previewUrl}
                  resultBlobUrl={resultBlobUrl}
                  fabricName={selectedFabric?.name ?? ''}
                  onDownload={handleDownload}
                  onShare={handleShare}
                  onRetry={handleRetry}
                  shopifyUrl={model.shopify_url}
                />
              )}
            </div>

            {/* ---- Right column ---- */}
            <div className={styles.rightColumn}>
              <h2 id="configurator-title" className={styles.srOnly}>
                Configurateur {model.name}
              </h2>

              {step === 'tissu' && (
                <StepTissu
                  model={model}
                  fabrics={fabrics}
                  visuals={visuals}
                  selectedFabricId={selectedFabricId}
                  selectedAngle={selectedAngle}
                  onSelectFabric={setSelectedFabricId}
                  onSelectAngle={setSelectedAngle}
                  onNext={goToApercu}
                />
              )}

              {step === 'apercu' && (
                <StepApercu
                  model={model}
                  visuals={visuals}
                  selectedFabricId={selectedFabricId}
                  selectedAngle={selectedAngle}
                  onSelectAngle={setSelectedAngle}
                  onSimulate={goToSimulation}
                  fabricName={selectedFabric?.name ?? ''}
                  isPremium={selectedFabric?.is_premium ?? false}
                  totalPrice={totalPrice}
                />
              )}
            </div>
          </div>

          {/* ---- Sticky bar mobile ---- */}
          {(step === 'tissu' || step === 'apercu') && (
            <div className={styles.stickyBar}>
              <span className={styles.stickyPrice}>{formatPrice(totalPrice)}</span>
              <button
                type="button"
                className={styles.stickyCta}
                disabled={!selectedFabricId}
                onClick={step === 'tissu' ? goToApercu : goToSimulation}
              >
                {step === 'tissu' ? 'Suivant' : 'Simuler'}
              </button>
            </div>
          )}
        </div>
      </dialog>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </>
  )
}
