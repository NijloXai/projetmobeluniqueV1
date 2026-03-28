import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CatalogueClient } from '@/components/public/Catalogue/CatalogueClient'
import type { ModelWithImages } from '@/types/database'

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props
    return <img {...rest} data-fill={fill ? 'true' : undefined} />
  },
}))

const mockModels: ModelWithImages[] = [
  {
    id: 'test-uuid-001',
    name: 'Milano',
    slug: 'milano',
    price: 1290,
    description: 'Canape 3 places design italien',
    dimensions: '220x90x85',
    is_active: true,
    shopify_url: null,
    created_at: '2026-01-01T00:00:00Z',
    model_images: [
      {
        id: 'img-001',
        model_id: 'test-uuid-001',
        image_url: 'https://test.supabase.co/storage/v1/object/public/model-photos/milano.jpg',
        view_type: '3/4',
        sort_order: 0,
      },
    ],
  },
  {
    id: 'test-uuid-002',
    name: 'Oslo',
    slug: 'oslo',
    price: 1490,
    description: 'Canape scandinave',
    dimensions: '200x85x80',
    is_active: true,
    shopify_url: null,
    created_at: '2026-01-02T00:00:00Z',
    model_images: [],
  },
]

describe('CatalogueClient', () => {
  it('affiche la grille de ProductCards quand models non vide', () => {
    render(<CatalogueClient models={mockModels} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Nos Canapes')
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('affiche le message etat vide quand models est vide', () => {
    render(<CatalogueClient models={[]} />)
    expect(screen.getByText(/canapes arrivent bientot/i)).toBeInTheDocument()
  })

  it('a id catalogue sur la section', () => {
    const { container } = render(<CatalogueClient models={mockModels} />)
    expect(container.querySelector('#catalogue')).toBeInTheDocument()
  })

  it('a aria-labelledby pointant vers le titre', () => {
    render(<CatalogueClient models={mockModels} />)
    const section = screen.getByRole('region', { name: /nos canapes/i })
      || document.getElementById('catalogue')
    expect(section).toBeInTheDocument()
  })

  it('affiche le sous-titre de section', () => {
    render(<CatalogueClient models={mockModels} />)
    expect(screen.getByText(/commencer la configuration/i)).toBeInTheDocument()
  })
})
