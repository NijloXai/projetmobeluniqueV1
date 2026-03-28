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

const mockModelMultiImages: ModelWithImages = {
  ...mockModel,
  id: 'test-uuid-003',
  name: 'Berlin',
  slug: 'berlin',
  model_images: [
    {
      id: 'img-010',
      model_id: 'test-uuid-003',
      image_url: 'https://test.supabase.co/storage/v1/object/public/model-photos/berlin-face.jpg',
      view_type: 'face',
      sort_order: 0,
    },
    {
      id: 'img-011',
      model_id: 'test-uuid-003',
      image_url: 'https://test.supabase.co/storage/v1/object/public/model-photos/berlin-3-4.jpg',
      view_type: '3/4',
      sort_order: 1,
    },
  ],
}

const mockModelNoThreeQuarter: ModelWithImages = {
  ...mockModel,
  id: 'test-uuid-004',
  name: 'Stockholm',
  slug: 'stockholm',
  model_images: [
    {
      id: 'img-020',
      model_id: 'test-uuid-004',
      image_url: 'https://test.supabase.co/storage/v1/object/public/model-photos/stockholm-face.jpg',
      view_type: 'face',
      sort_order: 0,
    },
    {
      id: 'img-021',
      model_id: 'test-uuid-004',
      image_url: 'https://test.supabase.co/storage/v1/object/public/model-photos/stockholm-profil.jpg',
      view_type: 'profil',
      sort_order: 1,
    },
  ],
}

const mockModelNoDesc: ModelWithImages = {
  ...mockModel,
  id: 'test-uuid-005',
  name: 'Lisbonne',
  slug: 'lisbonne',
  description: null,
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

  it('selectionne l image 3/4 meme si pas en premiere position', () => {
    render(<ProductCard model={mockModelMultiImages} />)
    const img = screen.getByAltText('Canape Berlin')
    expect(img).toHaveAttribute('src', mockModelMultiImages.model_images[1].image_url)
  })

  it('fallback sur la premiere image quand aucune 3/4', () => {
    render(<ProductCard model={mockModelNoThreeQuarter} />)
    const img = screen.getByAltText('Canape Stockholm')
    expect(img).toHaveAttribute('src', mockModelNoThreeQuarter.model_images[0].image_url)
  })

  it('appelle onConfigure avec le modele au click CTA', () => {
    const handleConfigure = vi.fn()
    render(<ProductCard model={mockModel} onConfigure={handleConfigure} />)
    screen.getByRole('button', { name: /configurer le modele milano/i }).click()
    expect(handleConfigure).toHaveBeenCalledOnce()
    expect(handleConfigure).toHaveBeenCalledWith(mockModel)
  })

  it('ne rend pas de description quand elle est null', () => {
    render(<ProductCard model={mockModelNoDesc} />)
    expect(screen.queryByText('Canape 3 places design italien')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Lisbonne')
  })
})
