import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfiguratorModal } from '@/components/public/Catalogue/ConfiguratorModal'
import type { ModelWithImages } from '@/types/database'

// Mock next/image avec le meme pattern que CatalogueClient.test.tsx
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props
    return <img {...rest} data-fill={fill ? 'true' : undefined} />
  },
}))

const mockModel: ModelWithImages = {
  id: 'test-uuid-modal',
  name: 'Canape Elegance',
  slug: 'canape-elegance',
  price: 1590,
  description: 'Canape design contemporain',
  dimensions: '230x90x85',
  is_active: true,
  shopify_url: null,
  created_at: '2026-01-01T00:00:00Z',
  model_images: [
    {
      id: 'img-modal-001',
      model_id: 'test-uuid-modal',
      image_url: 'https://test.supabase.co/storage/v1/object/public/model-photos/elegance.jpg',
      view_type: '3/4',
      sort_order: 0,
    },
  ],
}

const mockModelNoImage: ModelWithImages = {
  id: 'test-uuid-modal-noimgc',
  name: 'Canape Elegance',
  slug: 'canape-elegance-no-img',
  price: 1590,
  description: 'Canape design contemporain',
  dimensions: '230x90x85',
  is_active: true,
  shopify_url: null,
  created_at: '2026-01-01T00:00:00Z',
  model_images: [],
}

describe('ConfiguratorModal', () => {
  let onCloseMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onCloseMock = vi.fn()
    vi.clearAllMocks()
  })

  it('ne rend rien quand model est null', () => {
    render(<ConfiguratorModal model={null} onClose={onCloseMock} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('[MODAL-01] appelle showModal quand model est fourni', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} />)
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
  })

  it('[MODAL-02] a les attributs aria-modal et role dialog', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('[MODAL-02] a aria-labelledby pointant vers le titre', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-labelledby')).toBe('modal-title')
    expect(document.getElementById('modal-title')).toBeInTheDocument()
  })

  it('[MODAL-02] cliquer le bouton X appelle onClose', async () => {
    const user = userEvent.setup()
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} />)
    await user.click(screen.getByLabelText('Fermer le configurateur'))
    expect(onCloseMock).toHaveBeenCalled()
  })

  it('[MODAL-02] evenement close du dialog appelle onClose', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} />)
    const dialog = screen.getByRole('dialog')
    fireEvent(dialog, new Event('close'))
    expect(onCloseMock).toHaveBeenCalled()
  })

  it('[MODAL-03] affiche le nom du modele dans un h2', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Canape Elegance')
  })

  it('[MODAL-03] affiche le prix formate', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} />)
    const priceEl = screen.getByText(/1\s?590/)
    expect(priceEl).toBeInTheDocument()
    expect(priceEl.textContent).toMatch(/€|EUR/)
  })

  it('[MODAL-03] affiche le message Configurateur a venir', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} />)
    expect(screen.getByText(/configurateur a venir/i)).toBeInTheDocument()
  })

  it('[MODAL-03] affiche le texte explicatif placeholder', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} />)
    expect(screen.getByText(/personnalisez tissu et couleur/i)).toBeInTheDocument()
  })

  it('affiche limage du canape quand disponible', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} />)
    const img = screen.getByAltText(/Canape Elegance/)
    expect(img).toBeInTheDocument()
  })

  it('ne rend pas dimage quand model_images est vide', () => {
    render(<ConfiguratorModal model={mockModelNoImage} onClose={onCloseMock} />)
    const img = screen.queryByAltText(/canape/i)
    expect(img).toBeNull()
  })
})
