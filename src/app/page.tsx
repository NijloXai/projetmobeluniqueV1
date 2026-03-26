import type { Metadata } from 'next'
import { Header } from '@/components/public/Header/Header'
import { Hero } from '@/components/public/Hero/Hero'
import { HowItWorks } from '@/components/public/HowItWorks/HowItWorks'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Accueil | Möbel Unique',
  description: 'Visualisez votre canapé personnalisé dans le tissu de votre choix grâce à notre configurateur IA. Livraison Paris et Île-de-France.',
}

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Header />
      <main id="main-content" className={styles.main}>
        <Hero />
        <HowItWorks />
      </main>
    </div>
  )
}
