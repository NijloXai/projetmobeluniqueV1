'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './AdminHeader.module.css'

interface AdminHeaderProps {
  userEmail: string
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo}>MU</span>
        <span className={styles.brandName}>Möbel Unique</span>
      </div>
      <div className={styles.right}>
        <span className={styles.email}>{userEmail}</span>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Déconnexion
        </button>
      </div>
    </header>
  )
}
