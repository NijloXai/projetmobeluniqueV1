'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import styles from './Hero.module.css'

export function Hero() {
  const [scrolled, setScrolled] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 0
      setScrolled(prev => prev !== isScrolled ? isScrolled : prev)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className={styles.hero}>
      <motion.div
        className={styles.heroContent}
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeInOut' }}
      >
        <span className={styles.badge}>Visualisation par IA</span>
        <h1 className={styles.title}>Visualisez votre canapé chez vous</h1>
        <p className={styles.subtitle}>
          Choisissez votre tissu, configurez votre modèle et visualisez le résultat
          directement dans votre salon&nbsp;&mdash; avant même de commander.
        </p>
        <a href="#catalogue" className={styles.cta}>
          Découvrir nos canapés
        </a>
      </motion.div>

      <div
        className={`${styles.scrollIndicator}${scrolled ? ` ${styles.scrollIndicatorHidden}` : ''}`}
      >
        <svg
          className={styles.chevron}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.scrollText}>Défiler</span>
      </div>
    </section>
  )
}
