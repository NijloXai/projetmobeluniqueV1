import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from '@/components/public/Catalogue/ProductCard'
import type { ModelWithImages } from '@/types/database'

// Mock next/image pour eviter erreur dans happy-dom
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props
    return <img {...rest} data-fill={fill ? 'true' : undefined} />
  },
}))

const mockModel: ModelWithImages = {
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
      image_url: 'https://test.supabase.co/storage/v1/object/public/model-photos/milano-3-4.jpg',
      view_type: '3/4',
      sort_order: 0,
    },
  ],
}

const mockModelNoImage: ModelWithImages = {
  ...mockModel,
  id: 'test-uuid-002',
  name: 'Oslo',
  slug: 'oslo',
  model_images: [],
}

describe('ProductCard', () => {
  it('affiche le nom du modele en uppercase', () => {
    render(<ProductCard model={mockModel} />)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Milano')
  })

  it('affiche le prix formate avec prefixe', () => {
    render(<ProductCard model={mockModel} />)
    expect(screen.getByText(/1\s?290\s?€/)).toBeInTheDocument()
    expect(screen.getByText(/partir de/i)).toBeInTheDocument()
  })

  it('affiche l image avec alt correct quand model_images non vide', () => {
    render(<ProductCard model={mockModel} />)
    const img = screen.getByAltText('Canape Milano')
    expect(img).toBeInTheDocument()
  })

  it('affiche le placeholder Sofa quand aucune image', () => {
    render(<ProductCard model={mockModelNoImage} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('affiche le CTA Configurer ce modele', () => {
    render(<ProductCard model={mockModel} />)
    const btn = screen.getByRole('button', { name: /configurer le modele milano/i })
    expect(btn).toBeInTheDocument()
  })

  it('affiche la description si presente', () => {
    render(<ProductCard model={mockModel} />)
    expect(screen.getByText('Canape 3 places design italien')).toBeInTheDocument()
  })
})
