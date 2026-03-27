'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './Header.module.css'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.6
      const isScrolled = window.scrollY > heroHeight
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
        <Link href="/" className={styles.brand} aria-label="Mobel Unique — Accueil">
          <Image
            src={scrolled ? '/brand/logo-black.png' : '/brand/logo-white.png'}
            alt="Mobel Unique"
            width={144}
            height={144}
            className={styles.logoImage}
            priority
          />
        </Link>
        <a
          href="https://www.mobelunique.fr/"
          className={styles.shopifyLink}
          rel="noopener"
          aria-label="Retourner a la boutique Mobel Unique"
        >
          Retour a la boutique
        </a>
      </header>
    </>
  )
}
