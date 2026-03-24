import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import styles from './layout.module.css'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div className={styles.layout}>
      <AdminHeader userEmail={user.email ?? 'Admin'} />
      <div className={styles.body}>
        <AdminSidebar />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}
