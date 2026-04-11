import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HowItWorks } from '../HowItWorks'

// Mock lucide-react — icones rendues comme svg testables
vi.mock('lucide-react', () => ({
  Sofa: (props: Record<string, unknown>) => <svg data-testid="icon-sofa" aria-hidden="true" {...props} />,
  Palette: (props: Record<string, unknown>) => <svg data-testid="icon-palette" aria-hidden="true" {...props} />,
  Home: (props: Record<string, unknown>) => <svg data-testid="icon-home" aria-hidden="true" {...props} />,
}))

// Mock motion/react — rendu simple sans animations
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { initial, animate, transition, ...rest } = props
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
  },
  useInView: () => true,
  useReducedMotion: () => false,
}))

describe('HowItWorks', () => {

  // STEP-01 — contenu cards

  it('rend le titre H2 "Comment ça marche"', () => {
    render(<HowItWorks />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Comment ça marche')
  })

  it('rend 3 titres H3 des etapes', () => {
    render(<HowItWorks />)
    const h3s = screen.getAllByRole('heading', { level: 3 })
    expect(h3s).toHaveLength(3)
    expect(h3s[0]).toHaveTextContent('Choisissez votre modèle')
    expect(h3s[1]).toHaveTextContent('Personnalisez avec votre tissu')
    expect(h3s[2]).toHaveTextContent('Visualisez chez vous')
  })

  it('rend les numeros 01, 02, 03', () => {
    render(<HowItWorks />)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
  })

  it('rend les 3 icones Lucide', () => {
    render(<HowItWorks />)
    expect(screen.getByTestId('icon-sofa')).toBeInTheDocument()
    expect(screen.getByTestId('icon-palette')).toBeInTheDocument()
    expect(screen.getByTestId('icon-home')).toBeInTheDocument()
  })

  it('rend le sous-titre de section', () => {
    render(<HowItWorks />)
    expect(screen.getByText(/En quelques clics/)).toBeInTheDocument()
  })

  it('rend les descriptions sous chaque etape', () => {
    render(<HowItWorks />)
    expect(screen.getByText(/Parcourez notre collection/)).toBeInTheDocument()
    expect(screen.getByText(/Choisissez parmi nos tissus/)).toBeInTheDocument()
    expect(screen.getByText(/Uploadez une photo/)).toBeInTheDocument()
  })

  // STEP-02 — structure section

  it('la section a l\'id "comment-ca-marche"', () => {
    render(<HowItWorks />)
    const section = document.getElementById('comment-ca-marche')
    expect(section).not.toBeNull()
  })

  it('les icones ont aria-hidden="true"', () => {
    render(<HowItWorks />)
    expect(screen.getByTestId('icon-sofa')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('icon-palette')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('icon-home')).toHaveAttribute('aria-hidden', 'true')
  })

  // STEP-03 — animation (mock)

  it('avec useInView mocke a true, les cards sont rendues', () => {
    render(<HowItWorks />)
    const h3s = screen.getAllByRole('heading', { level: 3 })
    expect(h3s).toHaveLength(3)
  })
})
