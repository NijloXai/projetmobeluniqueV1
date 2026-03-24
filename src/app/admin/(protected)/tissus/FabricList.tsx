'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Fabric } from '@/types/database'
import { ToggleSwitch } from '@/components/admin/ToggleSwitch'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import styles from './page.module.css'

interface FabricListProps {
  initialFabrics: Fabric[]
}

export function FabricList({ initialFabrics }: FabricListProps) {
  const router = useRouter()
  const [fabrics, setFabrics] = useState(initialFabrics)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Fabric | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle(fabric: Fabric) {
    setTogglingId(fabric.id)
    try {
      const res = await fetch(`/api/admin/fabrics/${fabric.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !fabric.is_active }),
      })
      if (res.ok) {
        const updated = await res.json()
        setFabrics((prev) =>
          prev.map((f) => (f.id === fabric.id ? updated : f))
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
      const res = await fetch(`/api/admin/fabrics/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setFabrics((prev) => prev.filter((f) => f.id !== deleteTarget.id))
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
          <h1 className={styles.title}>Tissus</h1>
          <p className={styles.subtitle}>
            {fabrics.length} tissu{fabrics.length !== 1 ? 's' : ''} dans le catalogue
          </p>
        </div>
        <Link href="/admin/tissus/new" className={styles.addBtn}>
          + Nouveau tissu
        </Link>
      </div>

      {fabrics.length === 0 ? (
        <div className={styles.empty}>
          <p>Aucun tissu dans le catalogue.</p>
          <Link href="/admin/tissus/new" className={styles.addBtn}>
            Créer le premier tissu
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Swatch</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Type</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fabrics.map((fabric) => (
                <tr key={fabric.id}>
                  <td>
                    {fabric.swatch_url ? (
                      <img
                        src={fabric.swatch_url}
                        alt={`Swatch ${fabric.name}`}
                        className={styles.swatch}
                      />
                    ) : (
                      <div className={styles.swatchPlaceholder} />
                    )}
                  </td>
                  <td>
                    <div className={styles.nameCell}>
                      <span className={styles.fabricName}>{fabric.name}</span>
                      <span className={styles.fabricSlug}>{fabric.slug}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.category}>
                      {fabric.category || '—'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        fabric.is_premium ? styles.premium : styles.standard
                      }`}
                    >
                      {fabric.is_premium ? 'Premium' : 'Standard'}
                    </span>
                  </td>
                  <td>
                    <ToggleSwitch
                      checked={fabric.is_active}
                      onChange={() => handleToggle(fabric)}
                      disabled={togglingId === fabric.id}
                      label={`${fabric.is_active ? 'Désactiver' : 'Activer'} ${fabric.name}`}
                    />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/admin/tissus/${fabric.id}/edit`}
                        className={styles.editBtn}
                      >
                        Modifier
                      </Link>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => setDeleteTarget(fabric)}
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
        title="Supprimer ce tissu ?"
        message={`Le tissu « ${deleteTarget?.name} » sera définitivement supprimé, ainsi que ses images. Cette action est irréversible.`}
        confirmLabel={deleting ? 'Suppression...' : 'Supprimer'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </div>
  )
}
