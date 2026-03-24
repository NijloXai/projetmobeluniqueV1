import { createClient } from '@/lib/supabase/server'
import styles from './page.module.css'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [modelsRes, fabricsRes, visualsRes] = await Promise.all([
    supabase.from('models').select('id', { count: 'exact', head: true }),
    supabase.from('fabrics').select('id', { count: 'exact', head: true }),
    supabase.from('generated_visuals').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Canapés', value: modelsRes.count ?? 0, icon: '🛋️' },
    { label: 'Tissus', value: fabricsRes.count ?? 0, icon: '🧵' },
    { label: 'Rendus IA', value: visualsRes.count ?? 0, icon: '🎨' },
  ]

  return (
    <div>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Vue d&apos;ensemble du catalogue</p>

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <span className={styles.statIcon}>{stat.icon}</span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
