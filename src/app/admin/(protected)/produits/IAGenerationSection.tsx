'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import type { ModelImage, Fabric, GeneratedVisual } from '@/types/database'
import styles from './form.module.css'

/** Visuel avec les données tissu jointes, tel que retourné par l'API admin visuals */
type VisualWithFabric = GeneratedVisual & { fabric: Fabric }

interface IAGenerationSectionProps {
  modelId: string
  images: ModelImage[]
  fabrics: Fabric[]
  visuals: VisualWithFabric[]
  onVisualsChange: () => void
}

export function IAGenerationSection({
  modelId,
  images,
  fabrics,
  visuals,
  onVisualsChange,
}: IAGenerationSectionProps) {
  const [selectedFabricId, setSelectedFabricId] = useState('')
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Visuels filtrés par tissu sélectionné
  const filteredVisuals = useMemo(() => {
    if (!selectedFabricId) return []
    return visuals.filter((v) => v.fabric_id === selectedFabricId)
  }, [visuals, selectedFabricId])

  // Map rapide : model_image_id → visuel (pour le tissu sélectionné)
  const visualByImageId = useMemo(() => {
    const map = new Map<string, VisualWithFabric>()
    for (const v of filteredVisuals) {
      map.set(v.model_image_id, v)
    }
    return map
  }, [filteredVisuals])

  // --- Actions unitaires ---

  const handleGenerate = useCallback(async (modelImageId: string) => {
    setError(null)
    setGeneratingIds((prev) => new Set(prev).add(modelImageId))
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: modelId,
          model_image_id: modelImageId,
          fabric_id: selectedFabricId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la génération.')
        return
      }
      onVisualsChange()
    } catch {
      setError('Erreur de connexion.')
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev)
        next.delete(modelImageId)
        return next
      })
    }
  }, [modelId, selectedFabricId, onVisualsChange])

  const handleValidate = useCallback(async (visualId: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/visuals/${visualId}/validate`, {
        method: 'PUT',
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la validation.')
        return
      }
      onVisualsChange()
    } catch {
      setError('Erreur de connexion.')
    }
  }, [onVisualsChange])

  const handlePublish = useCallback(async (visualId: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/visuals/${visualId}/publish`, {
        method: 'PUT',
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la publication.')
        return
      }
      onVisualsChange()
    } catch {
      setError('Erreur de connexion.')
    }
  }, [onVisualsChange])

  // --- Actions bulk ---

  const handleGenerateAll = useCallback(async () => {
    setError(null)
    setBulkAction('generating')
    try {
      const res = await fetch('/api/admin/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: modelId,
          fabric_id: selectedFabricId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la génération.')
        return
      }
      onVisualsChange()
    } catch {
      setError('Erreur de connexion.')
    } finally {
      setBulkAction(null)
    }
  }, [modelId, selectedFabricId, onVisualsChange])

  const handleBulkValidate = useCallback(async () => {
    const toValidate = filteredVisuals
      .filter((v) => !v.is_validated)
      .map((v) => v.id)
    if (toValidate.length === 0) return

    setError(null)
    setBulkAction('validating')
    try {
      const res = await fetch('/api/admin/visuals/bulk-validate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visual_ids: toValidate }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la validation en lot.')
        return
      }
      onVisualsChange()
    } catch {
      setError('Erreur de connexion.')
    } finally {
      setBulkAction(null)
    }
  }, [filteredVisuals, onVisualsChange])

  const handleBulkPublish = useCallback(async () => {
    const toPublish = filteredVisuals
      .filter((v) => v.is_validated && !v.is_published)
      .map((v) => v.id)
    if (toPublish.length === 0) return

    setError(null)
    setBulkAction('publishing')
    try {
      const res = await fetch('/api/admin/visuals/bulk-publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visual_ids: toPublish }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la publication en lot.')
        return
      }
      onVisualsChange()
    } catch {
      setError('Erreur de connexion.')
    } finally {
      setBulkAction(null)
    }
  }, [filteredVisuals, onVisualsChange])

  // --- Compteurs pour les boutons bulk ---
  const countUnvalidated = filteredVisuals.filter((v) => !v.is_validated).length
  const countUnpublished = filteredVisuals.filter(
    (v) => v.is_validated && !v.is_published
  ).length

  return (
    <div className={styles.iaSection}>
      <div className={styles.iaHeader}>
        <h2 className={styles.iaTitle}>Génération IA</h2>
        <span className={styles.iaCount}>
          {visuals.length} visuel{visuals.length !== 1 ? 's' : ''} au total
        </span>
      </div>

      {/* Sélecteur de tissu */}
      <div className={styles.iaFabricRow}>
        <div className={styles.field}>
          <label htmlFor="ia_fabric" className={styles.label}>
            Tissu pour la génération
          </label>
          <select
            id="ia_fabric"
            className={styles.classiqueSelect}
            value={selectedFabricId}
            onChange={(e) => {
              setSelectedFabricId(e.target.value)
              setError(null)
            }}
          >
            <option value="">— Choisir un tissu —</option>
            {fabrics.map((fabric) => (
              <option key={fabric.id} value={fabric.id}>
                {fabric.name}
                {fabric.category ? ` (${fabric.category})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className={styles.iaError}>{error}</p>}

      {/* Matrice d'angles — visible quand un tissu est sélectionné */}
      {selectedFabricId && (
        <>
          {/* Barre d'actions bulk */}
          <div className={styles.iaBulkBar}>
            <button
              type="button"
              className={styles.iaBulkBtn}
              onClick={handleGenerateAll}
              disabled={!!bulkAction}
            >
              {bulkAction === 'generating'
                ? 'Génération...'
                : `Générer tout (${images.length})`}
            </button>
            <button
              type="button"
              className={`${styles.iaBulkBtn} ${styles.iaBulkValidate}`}
              onClick={handleBulkValidate}
              disabled={!!bulkAction || countUnvalidated === 0}
            >
              {bulkAction === 'validating'
                ? 'Validation...'
                : `Valider tout (${countUnvalidated})`}
            </button>
            <button
              type="button"
              className={`${styles.iaBulkBtn} ${styles.iaBulkPublish}`}
              onClick={handleBulkPublish}
              disabled={!!bulkAction || countUnpublished === 0}
            >
              {bulkAction === 'publishing'
                ? 'Publication...'
                : `Publier tout (${countUnpublished})`}
            </button>
          </div>

          {/* Grille d'angles */}
          <div className={styles.iaMatrix}>
            {images.map((image) => {
              const visual = visualByImageId.get(image.id)
              const isGenerating = generatingIds.has(image.id)

              return (
                <div key={image.id} className={styles.iaCard}>
                  <div className={styles.iaCardImageWrap}>
                    {visual ? (
                      <Image
                        src={visual.generated_image_url}
                        alt={`Rendu IA — ${image.view_type}`}
                        width={200}
                        height={150}
                        className={styles.iaCardImage}
                      />
                    ) : (
                      <div className={styles.iaCardPlaceholder}>
                        {isGenerating ? (
                          <span className={styles.iaSpinner}>⏳</span>
                        ) : (
                          <span className={styles.iaPlaceholderText}>
                            Pas de rendu
                          </span>
                        )}
                      </div>
                    )}
                    {/* Badge de statut */}
                    {visual && (
                      <span
                        className={`${styles.iaBadge} ${
                          visual.is_published
                            ? styles.iaBadgePublished
                            : visual.is_validated
                              ? styles.iaBadgeValidated
                              : styles.iaBadgeGenerated
                        }`}
                      >
                        {visual.is_published
                          ? 'Publié'
                          : visual.is_validated
                            ? 'Validé'
                            : 'Généré'}
                      </span>
                    )}
                  </div>

                  <div className={styles.iaCardInfo}>
                    <span className={styles.iaCardAngle}>
                      {image.view_type}
                    </span>
                  </div>

                  <div className={styles.iaCardActions}>
                    {/* Générer / Régénérer */}
                    <button
                      type="button"
                      className={styles.iaActionBtn}
                      onClick={() => handleGenerate(image.id)}
                      disabled={isGenerating || !!bulkAction}
                    >
                      {isGenerating
                        ? '⏳'
                        : visual
                          ? 'Régénérer'
                          : 'Générer'}
                    </button>

                    {/* Valider */}
                    {visual && !visual.is_validated && (
                      <button
                        type="button"
                        className={`${styles.iaActionBtn} ${styles.iaActionValidate}`}
                        onClick={() => handleValidate(visual.id)}
                        disabled={!!bulkAction}
                      >
                        Valider
                      </button>
                    )}

                    {/* Publier */}
                    {visual && visual.is_validated && !visual.is_published && (
                      <button
                        type="button"
                        className={`${styles.iaActionBtn} ${styles.iaActionPublish}`}
                        onClick={() => handlePublish(visual.id)}
                        disabled={!!bulkAction}
                      >
                        Publier
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Résumé */}
          {filteredVisuals.length > 0 && (
            <p className={styles.iaStats}>
              {filteredVisuals.length} généré{filteredVisuals.length !== 1 ? 's' : ''}
              {' · '}
              {filteredVisuals.filter((v) => v.is_validated).length} validé{filteredVisuals.filter((v) => v.is_validated).length !== 1 ? 's' : ''}
              {' · '}
              {filteredVisuals.filter((v) => v.is_published).length} publié{filteredVisuals.filter((v) => v.is_published).length !== 1 ? 's' : ''}
            </p>
          )}
        </>
      )}

      {!selectedFabricId && fabrics.length > 0 && (
        <p className={styles.iaHint}>
          Sélectionnez un tissu pour voir et générer les rendus IA.
        </p>
      )}

      {fabrics.length === 0 && (
        <p className={styles.iaNoFabrics}>
          Aucun tissu disponible. Ajoutez des tissus dans la section Tissus pour
          utiliser la génération IA.
        </p>
      )}
    </div>
  )
}
