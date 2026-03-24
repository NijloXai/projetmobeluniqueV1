'use client'

import { useRef, useState, useCallback } from 'react'
import styles from './ImageUpload.module.css'

interface ImageUploadProps {
  label: string
  name: string
  accept?: string
  maxSizeMB?: number
  currentUrl?: string | null
  onChange: (file: File | null) => void
  error?: string
}

export function ImageUpload({
  label,
  name,
  accept = 'image/*',
  maxSizeMB = 2,
  currentUrl,
  onChange,
  error,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [sizeError, setSizeError] = useState<string | null>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      setSizeError(null)

      if (file) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          setSizeError(`Le fichier ne doit pas dépasser ${maxSizeMB} Mo.`)
          onChange(null)
          return
        }
        const url = URL.createObjectURL(file)
        setPreview(url)
        onChange(file)
      } else {
        setPreview(currentUrl ?? null)
        onChange(null)
      }
    },
    [maxSizeMB, currentUrl, onChange]
  )

  const handleRemove = useCallback(() => {
    setPreview(null)
    setSizeError(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [onChange])

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>{label}</label>
      <div className={styles.dropzone} onClick={() => inputRef.current?.click()}>
        {preview ? (
          <img src={preview} alt="Preview" className={styles.preview} />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon}>📷</span>
            <span className={styles.text}>Cliquer pour sélectionner</span>
            <span className={styles.hint}>Max {maxSizeMB} Mo</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          className={styles.input}
          onChange={handleChange}
        />
      </div>
      {preview && (
        <button type="button" className={styles.removeBtn} onClick={handleRemove}>
          Supprimer l&apos;image
        </button>
      )}
      {(sizeError || error) && (
        <p className={styles.error}>{sizeError || error}</p>
      )}
    </div>
  )
}
