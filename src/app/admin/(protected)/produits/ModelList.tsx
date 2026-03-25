'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Model } from '@/types/database'
import { ToggleSwitch } from '@/components/admin/ToggleSwitch'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import styles from './page.module.css'

type ModelWithCount = Model & { image_count: number }

interface ModelListProps {
  initialModels: ModelWithCount[]
}

const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export function ModelList({ initialModels }: ModelListProps) {
  const router = useRouter()
  const [models, setModels] = useState(initialModels)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ModelWithCount | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle(model: ModelWithCount) {
    setTogglingId(model.id)
    try {
      const res = await fetch(`/api/admin/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !model.is_active }),
      })
      if (res.ok) {
        const updated: Model = await res.json()
        setModels((prev) =>
          prev.map((m) =>
            m.id === model.id ? { ...updated, image_count: m.image_count } : m
          )
        )
      }
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/models/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setModels((prev) => prev.filter((m) => m.id !== deleteTarget.id))
        router.refresh()
      }
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Produits</h1>
          <p className={styles.subtitle}>
            {models.length} produit{models.length !== 1 ? 's' : ''} dans le
            catalogue
          </p>
        </div>
        <Link href="/admin/produits/new" className={styles.addBtn}>
          + Nouveau produit
        </Link>
      </div>

      {models.length === 0 ? (
        <div className={styles.empty}>
          <p>Aucun produit dans le catalogue.</p>
          <Link href="/admin/produits/new" className={styles.addBtn}>
            Créer le premier produit
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prix (€)</th>
                <th>Photos</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <span className={styles.modelName}>{model.name}</span>
                      <span className={styles.modelSlug}>{model.slug}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.price}>
                      {priceFormatter.format(model.price)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.photoCount}>
                      {model.image_count}
                    </span>
                  </td>
                  <td>
                    <ToggleSwitch
                      checked={model.is_active}
                      onChange={() => handleToggle(model)}
                      disabled={togglingId === model.id}
                      label={`${model.is_active ? 'Désactiver' : 'Activer'} ${model.name}`}
                    />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/admin/produits/${model.id}/edit`}
                        className={styles.editBtn}
                      >
                        Modifier
                      </Link>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => setDeleteTarget(model)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer ce produit ?"
        message={`Le produit « ${deleteTarget?.name} » sera définitivement supprimé, ainsi que ses images. Cette action est irréversible.`}
        confirmLabel={deleting ? 'Suppression...' : 'Supprimer'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </div>
  )
}
