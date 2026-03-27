import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Header } from '../Header'

// Mock next/link — rendu comme une balise <a>
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock next/image — rendu comme une balise <img> standard (GAP 1)
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('Header', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true, configurable: true })
  })

  it('rend le skip link "Aller au contenu" avec href="#main-content"', () => {
    render(<Header />)
    const skipLink = screen.getByText('Aller au contenu')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  // GAP 1 — logo remplace par next/image : verifier via alt text
  it('rend le logo Mobel Unique via next/image avec alt "Mobel Unique"', () => {
    render(<Header />)
    const logo = screen.getByAltText('Mobel Unique')
    expect(logo).toBeInTheDocument()
    expect(logo.tagName).toBe('IMG')
  })

  // GAP 1 — etat initial : logo blanc (header transparent, pas encore scrolle)
  it('en etat initial le logo pointe vers /brand/logo-white.png', () => {
    render(<Header />)
    const logo = screen.getByAltText('Mobel Unique')
    expect(logo).toHaveAttribute('src', '/brand/logo-white.png')
  })

  // GAP 1 — lien home contient le logo, pointe vers /
  it('le logo est enveloppe dans un lien vers la page d accueil', () => {
    render(<Header />)
    const logo = screen.getByAltText('Mobel Unique')
    const brandLink = logo.closest('a')
    expect(brandLink).not.toBeNull()
    expect(brandLink).toHaveAttribute('href', '/')
  })

  // GAP 3 — texte sans accent et URL Shopify correcte
  it('rend le lien "Retour a la boutique" pointant vers https://www.mobelunique.fr/', () => {
    render(<Header />)
    const shopLink = screen.getByText('Retour a la boutique')
    expect(shopLink).toBeInTheDocument()
    expect(shopLink.tagName).toBe('A')
    expect(shopLink).toHaveAttribute('href', 'https://www.mobelunique.fr/')
  })

  it('le header a role="banner"', () => {
    render(<Header />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('etat initial : pas de classe scrolled', () => {
    render(<Header />)
    const header = screen.getByRole('banner')
    expect(header.className).not.toMatch(/scrolled/)
  })

  // GAP 2 — seuil = window.innerHeight * 0.6 = 768 * 0.6 = 460.8px
  // scrollY=500 > 460.8 => classe scrolled appliquee
  it('apres scroll au-dela de 60% de la hauteur viewport : classe scrolled appliquee', () => {
    render(<Header />)
    const header = screen.getByRole('banner')

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
      fireEvent.scroll(window)
    })

    expect(header.className).toMatch(/scrolled/)
  })

  // GAP 2 — verifier qu'un scroll insuffisant ne declenche pas scrolled
  it('apres scroll en dessous du seuil 60% viewport : pas de classe scrolled', () => {
    render(<Header />)
    const header = screen.getByRole('banner')

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true })
      fireEvent.scroll(window)
    })

    expect(header.className).not.toMatch(/scrolled/)
  })

  // GAP 1 — apres scroll suffisant : logo bascule sur logo-black.png
  it('apres scroll suffisant le logo bascule sur /brand/logo-black.png', () => {
    render(<Header />)
    const logo = screen.getByAltText('Mobel Unique')

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true })
      fireEvent.scroll(window)
    })

    expect(logo).toHaveAttribute('src', '/brand/logo-black.png')
  })
})
