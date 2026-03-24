'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { slugify } from '@/lib/utils'
import { ImageUpload } from '@/components/admin/ImageUpload'
import type { Fabric } from '@/types/database'
import styles from './form.module.css'

const fabricFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  category: z.string().optional(),
  is_premium: z.boolean(),
  is_active: z.boolean(),
})

type FabricFormData = z.infer<typeof fabricFormSchema>

interface FabricFormProps {
  fabric?: Fabric | null
  categories: string[]
}

export function FabricForm({ fabric, categories }: FabricFormProps) {
  const router = useRouter()
  const isEdit = !!fabric
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [swatchFile, setSwatchFile] = useState<File | null>(null)
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FabricFormData>({
    resolver: zodResolver(fabricFormSchema),
    defaultValues: {
      name: fabric?.name ?? '',
      slug: fabric?.slug ?? '',
      category: fabric?.category ?? '',
      is_premium: fabric?.is_premium ?? false,
      is_active: fabric?.is_active ?? true,
    },
  })

  const nameValue = watch('name')

  // Auto-générer le slug depuis le nom (sauf si édité manuellement)
  useEffect(() => {
    if (!slugManuallyEdited && nameValue) {
      setValue('slug', slugify(nameValue))
    }
  }, [nameValue, slugManuallyEdited, setValue])

  const handleSwatchChange = useCallback((file: File | null) => {
    setSwatchFile(file)
  }, [])

  const handleReferenceChange = useCallback((file: File | null) => {
    setReferenceFile(file)
  }, [])

  async function onSubmit(data: FabricFormData) {
    setSubmitting(true)
    setServerError(null)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('slug', data.slug)
      formData.append('category', data.category || '')
      formData.append('is_premium', String(data.is_premium))
      formData.append('is_active', String(data.is_active))

      if (swatchFile) formData.append('swatch', swatchFile)
      if (referenceFile) formData.append('reference_image', referenceFile)

      const url = isEdit
        ? `/api/admin/fabrics/${fabric.id}`
        : '/api/admin/fabrics'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, { method, body: formData })
      const result = await res.json()

      if (!res.ok) {
        setServerError(result.error || 'Erreur inconnue.')
        return
      }

      router.push('/admin/tissus')
      router.refresh()
    } catch {
      setServerError('Erreur de connexion.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <h1 className={styles.title}>
        {isEdit ? `Modifier : ${fabric.name}` : 'Nouveau tissu'}
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
              placeholder="Velours Bleu"
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
              placeholder="velours-bleu"
            />
            {errors.slug && <p className={styles.error}>{errors.slug.message}</p>}
          </div>

          {/* Catégorie — combobox */}
          <div className={styles.field}>
            <label htmlFor="category" className={styles.label}>Catégorie</label>
            <input
              id="category"
              type="text"
              list="category-list"
              {...register('category')}
              className={styles.input}
              placeholder="Velours, Lin, Cuir..."
            />
            <datalist id="category-list">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          {/* Type et Actif */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input type="checkbox" {...register('is_premium')} className={styles.checkbox} />
                Premium (+80 €)
              </label>
            </div>
            <div className={styles.field}>
              <label className={styles.checkLabel}>
                <input type="checkbox" {...register('is_active')} className={styles.checkbox} />
                Actif (visible côté client)
              </label>
            </div>
          </div>
        </div>

        {/* Colonne images */}
        <div className={styles.sideCol}>
          <ImageUpload
            label="Swatch (échantillon)"
            name="swatch"
            maxSizeMB={2}
            currentUrl={fabric?.swatch_url}
            onChange={handleSwatchChange}
          />
          <ImageUpload
            label="Photo de référence"
            name="reference_image"
            maxSizeMB={5}
            currentUrl={fabric?.reference_image_url}
            onChange={handleReferenceChange}
          />
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push('/admin/tissus')}
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
              : 'Créer le tissu'}
        </button>
      </div>
    </form>
  )
}
