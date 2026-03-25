'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { slugify } from '@/lib/utils'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { IAGenerationSection } from './IAGenerationSection'
import type { ModelWithImages, ModelImage, Fabric, GeneratedVisual } from '@/types/database'

/** Visual with joined fabric data, as returned by the admin visuals API */
type VisualWithFabric = GeneratedVisual & { fabric: Fabric }
import styles from './form.module.css'

const modelFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  description: z.string().optional().nullable(),
  price: z.number().positive('Le prix doit être positif'),
  dimensions: z.string().optional().nullable(),
  shopify_url: z.string().url('URL Shopify invalide').or(z.literal('')).optional().nullable(),
  is_active: z.boolean(),
})

type ModelFormData = z.infer<typeof modelFormSchema>

interface ModelFormProps {
  model?: ModelWithImages | null
}

export function ModelForm({ model }: ModelFormProps) {
  const router = useRouter()
  const isEdit = !!model
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // --- Photo management state ---
  const [images, setImages] = useState<ModelImage[]>(
    model?.model_images ?? []
  )
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [newViewType, setNewViewType] = useState('')
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // --- Mode Classique state ---
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [visuals, setVisuals] = useState<VisualWithFabric[]>([])
  const [classiqueFile, setClassiqueFile] = useState<File | null>(null)
  const [selectedFabricId, setSelectedFabricId] = useState('')
  const [selectedModelImageId, setSelectedModelImageId] = useState('')
  const [uploadingClassique, setUploadingClassique] = useState(false)
  const [classiqueError, setClassiqueError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      name: model?.name ?? '',
      slug: model?.slug ?? '',
      description: model?.description ?? '',
      price: model?.price ?? 0,
      dimensions: model?.dimensions ?? '',
      shopify_url: model?.shopify_url ?? '',
      is_active: model?.is_active ?? true,
    },
  })

  const nameValue = watch('name')

  // Auto-générer le slug depuis le nom (sauf si édité manuellement)
  useEffect(() => {
    if (!slugManuallyEdited && nameValue) {
      setValue('slug', slugify(nameValue))
    }
  }, [nameValue, slugManuallyEdited, setValue])

  // --- Photo management helpers ---

  /** Re-fetch images list from API and update state */
  const refreshImages = useCallback(async () => {
    if (!model) return
    try {
      const res = await fetch(`/api/admin/models/${model.id}/images`)
      if (res.ok) {
        const data: ModelImage[] = await res.json()
        setImages(data)
      }
    } catch {
      // Silent — image list will stay stale until next action
    }
  }, [model])

  /** Re-fetch visuals list from API and update state */
  const refreshVisuals = useCallback(async () => {
    if (!model) return
    try {
      const res = await fetch(`/api/admin/models/${model.id}/visuals`)
      if (res.ok) {
        const data: VisualWithFabric[] = await res.json()
        setVisuals(data)
      }
    } catch {
      // Silent — visuals list will stay stale until next action
    }
  }, [model])

  // Fetch fabrics and visuals on mount in edit mode
  useEffect(() => {
    if (!model) return
    // Fetch fabrics list
    fetch('/api/admin/fabrics')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Fabric[]) => setFabrics(data))
      .catch(() => {
        /* empty — UI handles zero-fabrics state */
      })
    // Fetch existing visuals
    refreshVisuals()
  }, [model, refreshVisuals])

  /** Upload a new photo with view_type label */
  async function handlePhotoUpload() {
    if (!model) return
    setPhotoError(null)

    if (!newPhotoFile) {
      setPhotoError('Sélectionnez un fichier image.')
      return
    }
    if (!newViewType.trim()) {
      setPhotoError('Le type de vue est requis (ex: face, profil, dos).')
      return
    }

    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('image', newPhotoFile)
      fd.append('view_type', newViewType.trim())
      fd.append('sort_order', String(images.length))

      const res = await fetch(`/api/admin/models/${model.id}/images`, {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const result = await res.json()
        setPhotoError(result.error || "Erreur lors de l'upload.")
        return
      }

      // Clear inputs and refresh image list
      setNewPhotoFile(null)
      setNewViewType('')
      await refreshImages()
    } catch {
      setPhotoError('Erreur de connexion.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  /** Swap sort_order between two adjacent images */
  async function handleMoveUp(index: number) {
    if (!model || index <= 0) return
    const current = images[index]
    const neighbor = images[index - 1]
    setReorderingId(current.id)

    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/admin/models/${model.id}/images/${current.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: neighbor.sort_order }),
        }),
        fetch(`/api/admin/models/${model.id}/images/${neighbor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: current.sort_order }),
        }),
      ])

      if (!resA.ok || !resB.ok) {
        alert('Erreur lors du réordonnement.')
        return
      }

      await refreshImages()
    } catch {
      alert('Erreur de connexion.')
    } finally {
      setReorderingId(null)
    }
  }

  async function handleMoveDown(index: number) {
    if (!model || index >= images.length - 1) return
    const current = images[index]
    const neighbor = images[index + 1]
    setReorderingId(current.id)

    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/admin/models/${model.id}/images/${current.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: neighbor.sort_order }),
        }),
        fetch(`/api/admin/models/${model.id}/images/${neighbor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: current.sort_order }),
        }),
      ])

      if (!resA.ok || !resB.ok) {
        alert('Erreur lors du réordonnement.')
        return
      }

      await refreshImages()
    } catch {
      alert('Erreur de connexion.')
    } finally {
      setReorderingId(null)
    }
  }

  /** Delete a photo after confirmation */
  async function handleDeletePhoto(imageId: string) {
    if (!model) return
    if (!window.confirm('Supprimer cette photo ?')) return

    try {
      const res = await fetch(
        `/api/admin/models/${model.id}/images/${imageId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const result = await res.json()
        alert(result.error || "Erreur lors de la suppression.")
        return
      }
      await refreshImages()
    } catch {
      alert('Erreur de connexion.')
    }
  }

  // --- Mode Classique handlers ---

  /** Upload a rendered visual (mode classique) */
  async function handleClassiqueUpload() {
    if (!model) return
    setClassiqueError(null)

    if (!classiqueFile) {
      setClassiqueError('Sélectionnez un fichier image.')
      return
    }
    if (!selectedFabricId) {
      setClassiqueError('Veuillez choisir un tissu.')
      return
    }
    if (!selectedModelImageId) {
      setClassiqueError('Veuillez choisir un angle.')
      return
    }

    setUploadingClassique(true)
    try {
      const fd = new FormData()
      fd.append('image', classiqueFile)
      fd.append('fabric_id', selectedFabricId)
      fd.append('model_image_id', selectedModelImageId)

      const res = await fetch(`/api/admin/models/${model.id}/visuals`, {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const result = await res.json()
        setClassiqueError(result.error || "Erreur lors de l'upload.")
        return
      }

      // Clear inputs and refresh
      setClassiqueFile(null)
      setSelectedFabricId('')
      setSelectedModelImageId('')
      await refreshVisuals()
    } catch {
      setClassiqueError('Erreur de connexion.')
    } finally {
      setUploadingClassique(false)
    }
  }

  /** Delete a generated visual after confirmation */
  async function handleDeleteVisual(visualId: string) {
    if (!model) return
    if (!window.confirm('Supprimer ce rendu ?')) return

    try {
      const res = await fetch(
        `/api/admin/models/${model.id}/visuals/${visualId}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const result = await res.json()
        alert(result.error || 'Erreur lors de la suppression.')
        return
      }
      await refreshVisuals()
    } catch {
      alert('Erreur de connexion.')
    }
  }

  async function onSubmit(data: ModelFormData) {
    setSubmitting(true)
    setServerError(null)

    try {
      const body = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price: data.price,
        dimensions: data.dimensions || null,
        shopify_url: data.shopify_url || null,
        is_active: data.is_active,
      }

      const url = isEdit
        ? `/api/admin/models/${model.id}`
        : '/api/admin/models'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()

      if (!res.ok) {
        setServerError(result.error || 'Erreur inconnue.')
        return
      }

      if (isEdit) {
        router.push('/admin/produits')
        router.refresh()
      } else {
        // Redirect to edit page to allow photo uploads
        const newId = result.data?.id ?? result.id
        router.push(`/admin/produits/${newId}/edit`)
      }
    } catch {
      setServerError('Erreur de connexion.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <h1 className={styles.title}>
        {isEdit ? `Modifier : ${model.name}` : 'Nouveau produit'}
      </h1>

      {serverError && (
        <div className={styles.serverError}>{serverError}</div>
      )}

      <div className={styles.grid}>
        <div className={styles.mainCol}>
          {/* Nom */}
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>Nom</label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="Canapé Oslo"
            />
            {errors.name && <p className={styles.error}>{errors.name.message}</p>}
          </div>

          {/* Slug */}
          <div className={styles.field}>
            <label htmlFor="slug" className={styles.label}>
              Slug
              <span className={styles.hint}> — auto-généré, modifiable</span>
            </label>
            <input
              id="slug"
              type="text"
              {...register('slug', {
                onChange: () => setSlugManuallyEdited(true),
              })}
              className={`${styles.input} ${styles.mono} ${errors.slug ? styles.inputError : ''}`}
              placeholder="canape-oslo"
            />
            {errors.slug && <p className={styles.error}>{errors.slug.message}</p>}
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>Description</label>
            <textarea
              id="description"
              {...register('description')}
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              placeholder="Description du modèle..."
              rows={4}
            />
            {errors.description && <p className={styles.error}>{errors.description.message}</p>}
          </div>

          {/* Prix + Dimensions */}
          <div className={styles.priceRow}>
            <div className={styles.field}>
              <label htmlFor="price" className={styles.label}>Prix (€)</label>
              <input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className={`${styles.input} ${errors.price ? styles.inputError : ''}`}
                placeholder="1290.00"
              />
              {errors.price && <p className={styles.error}>{errors.price.message}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="dimensions" className={styles.label}>Dimensions</label>
              <input
                id="dimensions"
                type="text"
                {...register('dimensions')}
                className={styles.input}
                placeholder="L 220 × P 95 × H 80 cm"
              />
            </div>
          </div>

          {/* URL Shopify */}
          <div className={styles.field}>
            <label htmlFor="shopify_url" className={styles.label}>URL Shopify</label>
            <input
              id="shopify_url"
              type="url"
              {...register('shopify_url')}
              className={`${styles.input} ${styles.urlInput} ${errors.shopify_url ? styles.inputError : ''}`}
              placeholder="https://votre-boutique.myshopify.com/products/..."
            />
            {errors.shopify_url && <p className={styles.error}>{errors.shopify_url.message}</p>}
          </div>

          {/* Actif */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input type="checkbox" {...register('is_active')} className={styles.checkbox} />
                Actif (visible côté client)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section Photos — visible uniquement en mode édition */}
      {isEdit && model && (
        <div className={styles.photoSection}>
          <div className={styles.photoHeader}>
            <h2 className={styles.photoTitle}>Photos du produit</h2>
            <span className={styles.photoCount}>
              {images.length} photo{images.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Upload area */}
          <div className={styles.photoUploadRow}>
            <ImageUpload
              label="Photo"
              name="photo"
              maxSizeMB={5}
              onChange={(file) => setNewPhotoFile(file)}
            />
            <div className={styles.photoUploadFields}>
              <div className={styles.field}>
                <label htmlFor="view_type" className={styles.label}>
                  Type de vue
                </label>
                <input
                  id="view_type"
                  type="text"
                  value={newViewType}
                  onChange={(e) => setNewViewType(e.target.value)}
                  className={styles.input}
                  placeholder="face, profil, dos, 3/4..."
                />
              </div>
              <button
                type="button"
                className={styles.addPhotoBtn}
                onClick={handlePhotoUpload}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? 'Upload en cours...' : 'Ajouter la photo'}
              </button>
            </div>
          </div>
          {photoError && (
            <p className={styles.photoError}>{photoError}</p>
          )}

          {/* Photo grid or empty state */}
          {images.length === 0 ? (
            <p className={styles.photoEmpty}>
              Aucune photo. Ajoutez des photos du produit.
            </p>
          ) : (
            <div className={styles.photoGrid}>
              {images.map((image, index) => (
                <div key={image.id} className={styles.photoCard}>
                  <div className={styles.photoCardImageWrap}>
                    <img
                      src={image.image_url}
                      alt={`${image.view_type} — ordre ${image.sort_order}`}
                      className={styles.photoCardImage}
                    />
                  </div>
                  <div className={styles.photoCardInfo}>
                    <span className={styles.photoViewType}>{image.view_type}</span>
                    <span className={styles.photoSortOrder}>#{image.sort_order}</span>
                  </div>
                  <div className={styles.photoCardControls}>
                    <button
                      type="button"
                      className={styles.moveBtn}
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || reorderingId === image.id}
                      title="Monter"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.moveBtn}
                      onClick={() => handleMoveDown(index)}
                      disabled={
                        index === images.length - 1 || reorderingId === image.id
                      }
                      title="Descendre"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={styles.deletePhotoBtn}
                      onClick={() => handleDeletePhoto(image.id)}
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section Mode Classique — visible en édition quand des photos existent */}
      {isEdit && model && images.length > 0 && (
        <div className={styles.classiqueSection}>
          <div className={styles.classiqueHeader}>
            <h2 className={styles.classiqueTitle}>Mode Classique — Rendus</h2>
            <span className={styles.classiqueCount}>
              {visuals.length} rendu{visuals.length !== 1 ? 's' : ''}
            </span>
          </div>

          {fabrics.length === 0 ? (
            <p className={styles.classiqueNoFabrics}>
              Aucun tissu disponible. Ajoutez des tissus dans la section Tissus pour utiliser le mode classique.
            </p>
          ) : (
            <div className={styles.classiqueUploadArea}>
              <div className={styles.classiqueSelects}>
                <div className={styles.field}>
                  <label htmlFor="classique_fabric" className={styles.label}>Tissu</label>
                  <select
                    id="classique_fabric"
                    className={styles.classiqueSelect}
                    value={selectedFabricId}
                    onChange={(e) => setSelectedFabricId(e.target.value)}
                  >
                    <option value="">— Choisir un tissu —</option>
                    {fabrics.map((fabric) => (
                      <option key={fabric.id} value={fabric.id}>
                        {fabric.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="classique_angle" className={styles.label}>Angle</label>
                  <select
                    id="classique_angle"
                    className={styles.classiqueSelect}
                    value={selectedModelImageId}
                    onChange={(e) => setSelectedModelImageId(e.target.value)}
                  >
                    <option value="">— Choisir un angle —</option>
                    {images.map((image) => (
                      <option key={image.id} value={image.id}>
                        {image.view_type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ImageUpload
                label="Rendu"
                name="classique"
                maxSizeMB={5}
                onChange={(file) => setClassiqueFile(file)}
              />
              <button
                type="button"
                className={styles.publishBtn}
                onClick={handleClassiqueUpload}
                disabled={uploadingClassique}
              >
                {uploadingClassique ? 'Publication...' : 'Publier le rendu'}
              </button>
            </div>
          )}

          {classiqueError && (
            <p className={styles.classiqueError}>{classiqueError}</p>
          )}

          {/* Visuals grid */}
          {visuals.length > 0 ? (
            <div className={styles.classiqueGrid}>
              {visuals.map((visual) => (
                <div key={visual.id} className={styles.classiqueCard}>
                  <div className={styles.classiqueCardImageWrap}>
                    <img
                      src={visual.generated_image_url}
                      alt={`Rendu — ${visual.fabric.name}`}
                      className={styles.classiqueCardImage}
                    />
                  </div>
                  <div className={styles.classiqueCardInfo}>
                    <span>{visual.fabric.name}</span>
                  </div>
                  <div className={styles.photoCardControls}>
                    <button
                      type="button"
                      className={styles.deletePhotoBtn}
                      onClick={() => handleDeleteVisual(visual.id)}
                      title="Supprimer"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            fabrics.length > 0 && (
              <p className={styles.classiqueEmpty}>
                Aucun rendu classique pour ce produit.
              </p>
            )
          )}
        </div>
      )}

      {/* Section Génération IA — visible en édition quand des photos existent */}
      {isEdit && model && images.length > 0 && (
        <IAGenerationSection
          modelId={model.id}
          images={images}
          fabrics={fabrics}
          visuals={visuals}
          onVisualsChange={refreshVisuals}
        />
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push('/admin/produits')}
        >
          Annuler
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={submitting}
        >
          {submitting
            ? 'Enregistrement...'
            : isEdit
              ? 'Enregistrer les modifications'
              : 'Créer le produit'}
        </button>
      </div>
    </form>
  )
}
