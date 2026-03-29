import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfiguratorModal } from '@/components/public/Catalogue/ConfiguratorModal'
import type { ModelWithImages, Fabric, VisualWithFabricAndImage } from '@/types/database'

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

const mockFabrics: Fabric[] = [
  {
    id: 'fabric-modal-001',
    name: 'Velours Emeraude',
    slug: 'velours-emeraude',
    category: 'velours',
    is_active: true,
    is_premium: false,
    swatch_url: 'https://test.supabase.co/storage/v1/object/public/fabric-swatches/velours-emeraude.jpg',
    reference_image_url: null,
    created_at: '2026-01-01T00:00:00Z',
  },
]

const mockVisuals: VisualWithFabricAndImage[] = [
  {
    id: 'visual-modal-001',
    model_id: 'test-uuid-modal',
    model_image_id: 'img-modal-001',
    fabric_id: 'fabric-modal-001',
    generated_image_url: 'https://test.supabase.co/storage/v1/object/public/generated-visuals/vm001.jpg',
    is_validated: true,
    is_published: true,
    created_at: '2026-01-03T00:00:00Z',
    fabric: {
      id: 'fabric-modal-001',
      name: 'Velours Emeraude',
      slug: 'velours-emeraude',
      category: 'velours',
      is_active: true,
      is_premium: false,
      swatch_url: 'https://test.supabase.co/storage/v1/object/public/fabric-swatches/velours-emeraude.jpg',
      reference_image_url: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    model_image: {
      id: 'img-modal-001',
      model_id: 'test-uuid-modal',
      image_url: 'https://test.supabase.co/storage/v1/object/public/model-photos/elegance.jpg',
      view_type: '3/4',
      sort_order: 0,
    },
  },
]

describe('ConfiguratorModal', () => {
  let onCloseMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onCloseMock = vi.fn()
    vi.clearAllMocks()
  })

  it('ne rend rien quand model est null', () => {
    render(<ConfiguratorModal model={null} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('[MODAL-01] appelle showModal quand model est fourni', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
  })

  it('[MODAL-02] a les attributs aria-modal et role dialog', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('[MODAL-02] a aria-labelledby pointant vers le titre', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-labelledby')).toBe('modal-title')
    expect(document.getElementById('modal-title')).toBeInTheDocument()
  })

  it('[MODAL-02] cliquer le bouton X appelle onClose', async () => {
    const user = userEvent.setup()
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    await user.click(screen.getByLabelText('Fermer le configurateur'))
    expect(onCloseMock).toHaveBeenCalled()
  })

  it('[MODAL-02] evenement close du dialog appelle onClose', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    const dialog = screen.getByRole('dialog')
    fireEvent(dialog, new Event('close'))
    expect(onCloseMock).toHaveBeenCalled()
  })

  it('[MODAL-03] affiche le nom du modele dans un h2', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Canape Elegance')
  })

  it('[MODAL-03] affiche le prix formate', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    const priceEl = screen.getByText(/1\s?590/)
    expect(priceEl).toBeInTheDocument()
    expect(priceEl.textContent).toMatch(/€|EUR/)
  })

  it('[MODAL-03] affiche le message Configurateur a venir', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(screen.getByText(/configurateur a venir/i)).toBeInTheDocument()
  })

  it('[MODAL-03] affiche le texte explicatif placeholder', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(screen.getByText(/personnalisez tissu et couleur/i)).toBeInTheDocument()
  })

  it('affiche limage du canape quand disponible', () => {
    render(<ConfiguratorModal model={mockModel} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    const img = screen.getByAltText(/Canape Elegance/)
    expect(img).toBeInTheDocument()
  })

  it('ne rend pas dimage quand model_images est vide', () => {
    render(<ConfiguratorModal model={mockModelNoImage} onClose={onCloseMock} fabrics={mockFabrics} visuals={mockVisuals} />)
    const img = screen.queryByAltText(/canape/i)
    expect(img).toBeNull()
  })
})

describe('ConfiguratorModal — props fabrics et visuals', () => {
  let onCloseMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onCloseMock = vi.fn()
    vi.clearAllMocks()
  })

  it('[D-05] accepte fabrics et visuals en props obligatoires sans crash', () => {
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={mockFabrics}
        visuals={mockVisuals}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Canape Elegance')
  })

  it('[D-05] fonctionne avec des tableaux vides fabrics et visuals', () => {
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={[]}
        visuals={[]}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('[CONF-01] fabrics contenant is_premium est accessible dans les props', () => {
    const premiumFabric: Fabric[] = [{
      id: 'fabric-premium',
      name: 'Cuir Nappa',
      slug: 'cuir-nappa',
      category: 'cuir',
      is_active: true,
      is_premium: true,
      swatch_url: null,
      reference_image_url: null,
      created_at: '2026-01-01T00:00:00Z',
    }]
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={premiumFabric}
        visuals={mockVisuals}
      />
    )
    // Le modal rend sans crash avec un tissu premium — la donnee is_premium est disponible pour Phase 8
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
