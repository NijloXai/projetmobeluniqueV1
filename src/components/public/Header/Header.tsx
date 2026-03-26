'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './Header.module.css'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 80
      setScrolled(prev => prev !== isScrolled ? isScrolled : prev)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <a href="#main-content" className={styles.skipLink}>
        Aller au contenu
      </a>
      <header
        className={`${styles.header}${scrolled ? ` ${styles.scrolled}` : ''}`}
        role="banner"
      >
        <Link href="/" className={styles.brand} aria-label="Möbel Unique — Accueil">
          <div className={styles.logo} aria-hidden="true">MU</div>
          <span className={styles.brandName}>Möbel Unique</span>
        </Link>
        <a
          href="#"
          className={styles.shopifyLink}
          rel="noopener noreferrer"
          aria-label="Retourner à la boutique Shopify"
        >
          Retour à la boutique
        </a>
      </header>
    </>
  )
}
