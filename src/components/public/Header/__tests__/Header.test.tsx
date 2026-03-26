import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Header } from '../Header'

// Mock next/link — rendu comme une balise <a>
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('Header', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
  })

  it('rend le skip link "Aller au contenu" avec href="#main-content"', () => {
    render(<Header />)
    const skipLink = screen.getByText('Aller au contenu')
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('rend le logo "MU"', () => {
    render(<Header />)
    expect(screen.getByText('MU')).toBeInTheDocument()
  })

  it('rend le nom de marque "Möbel Unique"', () => {
    render(<Header />)
    expect(screen.getByText('Möbel Unique')).toBeInTheDocument()
  })

  it('rend le lien "Retour à la boutique"', () => {
    render(<Header />)
    const shopLink = screen.getByText('Retour à la boutique')
    expect(shopLink).toBeInTheDocument()
    expect(shopLink.tagName).toBe('A')
  })

  it('le header a role="banner"', () => {
    render(<Header />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('état initial : pas de classe scrolled', () => {
    render(<Header />)
    const header = screen.getByRole('banner')
    expect(header.className).not.toMatch(/scrolled/)
  })

  it('après scroll > 80px : classe scrolled appliquée', () => {
    render(<Header />)
    const header = screen.getByRole('banner')

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true })
      fireEvent.scroll(window)
    })

    expect(header.className).toMatch(/scrolled/)
  })
})
