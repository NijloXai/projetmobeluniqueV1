import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hero } from '../Hero'

// Mock motion/react — rendu simple sans animations
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }: {
      children: React.ReactNode
      initial?: Record<string, unknown>
      animate?: Record<string, unknown>
      transition?: Record<string, unknown>
      [key: string]: unknown
    }) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => false,
}))

describe('Hero', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
  })

  it('rend le badge "Visualisation par IA"', () => {
    render(<Hero />)
    expect(screen.getByText('Visualisation par IA')).toBeInTheDocument()
  })

  it('rend le H1 "Visualisez votre canapé chez vous"', () => {
    render(<Hero />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Visualisez votre canapé chez vous')
  })

  it('rend le sous-titre avec le contenu attendu', () => {
    render(<Hero />)
    expect(screen.getByText(/Choisissez votre tissu/)).toBeInTheDocument()
    expect(screen.getByText(/avant même de commander/)).toBeInTheDocument()
  })

  it('rend le CTA avec href="#catalogue" et texte "Découvrir nos canapés"', () => {
    render(<Hero />)
    const cta = screen.getByText('Découvrir nos canapés')
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '#catalogue')
  })

  it('rend l\'indicateur "Défiler" avec chevron aria-hidden', () => {
    render(<Hero />)
    expect(screen.getByText('Défiler')).toBeInTheDocument()
    const svg = document.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeInTheDocument()
  })

  it('état initial : indicateur scroll visible (pas de classe hidden)', () => {
    render(<Hero />)
    const indicator = screen.getByText('Défiler').closest('div')
    expect(indicator?.className).not.toMatch(/Hidden/)
  })

  it('après scroll > 0 : indicateur masqué', () => {
    render(<Hero />)
    const indicator = screen.getByText('Défiler').closest('div')

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 1, writable: true })
      fireEvent.scroll(window)
    })

    expect(indicator?.className).toMatch(/Hidden/)
  })
})
