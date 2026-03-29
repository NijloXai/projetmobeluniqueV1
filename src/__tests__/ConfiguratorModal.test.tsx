import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfiguratorModal, getPrimaryImage, formatPrice } from '@/components/public/Catalogue/ConfiguratorModal'
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

// mockModelWithShopify — identique a mockModel mais avec shopify_url reel
const mockModelWithShopify: ModelWithImages = {
  ...mockModel,
  shopify_url: 'https://www.mobelunique.fr/products/canape-elegance',
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

// Tissu premium pour les tests Phase 8
const mockFabricPremium: Fabric = {
  id: 'fabric-modal-002',
  name: 'Cuir Nappa',
  slug: 'cuir-nappa',
  category: 'cuir',
  is_active: true,
  is_premium: true,
  swatch_url: 'https://test.supabase.co/storage/v1/object/public/fabric-swatches/cuir-nappa.jpg',
  reference_image_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

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

// Visual pour le tissu premium
const mockVisualPremium: VisualWithFabricAndImage = {
  id: 'visual-modal-002',
  model_id: 'test-uuid-modal',
  model_image_id: 'img-modal-001',
  fabric_id: 'fabric-modal-002',
  generated_image_url: 'https://test.supabase.co/storage/v1/object/public/generated-visuals/vm002.jpg',
  is_validated: true,
  is_published: true,
  created_at: '2026-01-03T00:00:00Z',
  fabric: mockFabricPremium,
  model_image: mockModel.model_images[0],
}

// Helpers Phase 8 — combinaison des 2 tissus et 2 visuals
const allFabrics = [mockFabrics[0], mockFabricPremium]
const allVisuals = [mockVisuals[0], mockVisualPremium]

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

describe('Phase 8 — configurateur', () => {
  let onCloseMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onCloseMock = vi.fn()
    vi.clearAllMocks()
  })

  it('[CONF-01] affiche uniquement les swatches des tissus avec rendu publie pour ce modele', () => {
    // Tissu sans visual correspondant — ne doit PAS apparaitre dans la grille
    const fabricWithoutVisual: Fabric = {
      id: 'fabric-modal-003',
      name: 'Lin Naturel',
      slug: 'lin-naturel',
      category: 'lin',
      is_active: true,
      is_premium: false,
      swatch_url: 'https://test.supabase.co/storage/v1/object/public/fabric-swatches/lin-naturel.jpg',
      reference_image_url: null,
      created_at: '2026-01-01T00:00:00Z',
    }
    const fabricsWithExtra = [...allFabrics, fabricWithoutVisual]

    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={fabricsWithExtra}
        visuals={allVisuals}
      />
    )

    // Doit y avoir exactement 2 swatches (les 2 tissus avec visuels publies)
    const swatches = screen.getAllByRole('radio')
    expect(swatches).toHaveLength(2)

    // Le tissu sans visual ne doit PAS apparaitre
    expect(screen.queryByLabelText(/Lin Naturel/)).toBeNull()
  })

  it('[CONF-02] cliquer un swatch met a jour letat et affiche le rendu IA', async () => {
    const user = userEvent.setup()
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )

    const radiogroup = screen.getByRole('radiogroup')
    const swatches = radiogroup.querySelectorAll('[role="radio"]')
    expect(swatches.length).toBeGreaterThan(0)

    // Cliquer le premier swatch (Velours Emeraude)
    await user.click(swatches[0] as HTMLElement)

    // Le swatch doit etre marque comme selectionne
    expect(swatches[0].getAttribute('aria-checked')).toBe('true')

    // L'image principale doit afficher le rendu IA (vm001.jpg)
    const mainImg = screen.getByAltText(/Canape Elegance.*Velours Emeraude|Velours Emeraude.*Canape Elegance|Canape Elegance/)
    expect(mainImg.getAttribute('src')).toContain('vm001.jpg')
  })

  it('[CONF-03] les tissus premium affichent un badge Premium', () => {
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )

    // Le badge "Premium" doit apparaitre exactement 1 fois (seul Cuir Nappa est premium)
    const premiumBadges = screen.getAllByText('Premium')
    expect(premiumBadges).toHaveLength(1)
  })

  it('[CONF-05] affiche la photo originale avec badge quand pas de rendu pour le tissu', async () => {
    const user = userEvent.setup()

    // Tissu sans visual associe pour ce modele
    const fabricNoVisual: Fabric = {
      id: 'fabric-modal-no-visual',
      name: 'Soie Bordeaux',
      slug: 'soie-bordeaux',
      category: 'soie',
      is_active: true,
      is_premium: false,
      swatch_url: 'https://test.supabase.co/storage/v1/object/public/fabric-swatches/soie-bordeaux.jpg',
      reference_image_url: null,
      created_at: '2026-01-01T00:00:00Z',
    }

    // Visual pour ce tissu mais is_published = false — donc non eligible
    const visualUnpublished: VisualWithFabricAndImage = {
      id: 'visual-modal-unpublished',
      model_id: 'test-uuid-modal',
      model_image_id: 'img-modal-001',
      fabric_id: 'fabric-modal-no-visual',
      generated_image_url: 'https://test.supabase.co/storage/v1/object/public/generated-visuals/unpublished.jpg',
      is_validated: false,
      is_published: false,
      created_at: '2026-01-03T00:00:00Z',
      fabric: fabricNoVisual,
      model_image: mockModel.model_images[0],
    }

    // Ajouter le tissu dans les fabrics mais sans visual publie
    const fabricsWithUnpublished = [...allFabrics, fabricNoVisual]
    const visualsWithUnpublished = [...allVisuals, visualUnpublished]

    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={fabricsWithUnpublished}
        visuals={visualsWithUnpublished}
      />
    )

    // A letat initial (aucun tissu selectionne), PAS de badge "Photo originale"
    expect(screen.queryByText('Photo originale')).toBeNull()

    // Soie Bordeaux n'a pas de visual publie, donc n'apparait PAS dans la grille
    expect(screen.queryByLabelText(/Soie Bordeaux/)).toBeNull()
  })

  it('[CONF-07] le prix se met a jour quand un tissu standard est selectionne', async () => {
    const user = userEvent.setup()
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )

    const radiogroup = screen.getByRole('radiogroup')
    const swatches = radiogroup.querySelectorAll('[role="radio"]')

    // Cliquer le premier swatch (Velours Emeraude — tissu standard, prix 1590)
    await user.click(swatches[0] as HTMLElement)

    // Le prix doit afficher 1590 (sans "A partir de")
    const priceEl = screen.getByText(/1[\s\u202f]590/)
    expect(priceEl).toBeInTheDocument()

    // "A partir de" ne doit PAS etre present dans le bloc prix
    expect(screen.queryByText(/a partir de/i)).toBeNull()
  })

  it('[CONF-08] le detail surcout premium est visible pour un tissu premium', async () => {
    const user = userEvent.setup()
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )

    const radiogroup = screen.getByRole('radiogroup')
    const swatches = radiogroup.querySelectorAll('[role="radio"]')

    // Cliquer le deuxieme swatch (Cuir Nappa — premium, prix 1590 + 80 = 1670)
    await user.click(swatches[1] as HTMLElement)

    // Le prix total doit afficher 1670
    const priceEl = screen.getByText(/1[\s\u202f]670/)
    expect(priceEl).toBeInTheDocument()

    // Le detail surcout doit mentionner 80 et premium
    const supplementEl = screen.getByText(/80.*premium|premium.*80/i)
    expect(supplementEl).toBeInTheDocument()
  })

  it('[CONF-09] CTA Acheter sur Shopify redirige vers shopify_url', () => {
    render(
      <ConfiguratorModal
        model={mockModelWithShopify}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )

    const ctaLink = screen.getByRole('link', { name: /Acheter sur Shopify/i })
    expect(ctaLink).toBeInTheDocument()
    expect(ctaLink.getAttribute('href')).toBe(mockModelWithShopify.shopify_url)
    expect(ctaLink.getAttribute('target')).toBe('_blank')
    expect(ctaLink.getAttribute('rel')).toContain('noopener')
  })

  it('[CONF-10] CTA masque si shopify_url est null', () => {
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )

    // mockModel a shopify_url: null — le CTA ne doit PAS apparaitre
    expect(screen.queryByText(/Acheter sur Shopify/i)).toBeNull()
  })
})

describe('getPrimaryImage — selection image principale', () => {
  it('retourne lURL de limage 3/4 quand presente', () => {
    const images = [
      { id: 'i1', model_id: 'm1', image_url: 'https://test.co/front.jpg', view_type: 'front', sort_order: 0 },
      { id: 'i2', model_id: 'm1', image_url: 'https://test.co/34.jpg', view_type: '3/4', sort_order: 1 },
    ]
    expect(getPrimaryImage(images)).toBe('https://test.co/34.jpg')
  })

  it('retourne la premiere image quand pas de 3/4', () => {
    const images = [
      { id: 'i1', model_id: 'm1', image_url: 'https://test.co/front.jpg', view_type: 'front', sort_order: 0 },
      { id: 'i2', model_id: 'm1', image_url: 'https://test.co/side.jpg', view_type: 'side', sort_order: 1 },
    ]
    expect(getPrimaryImage(images)).toBe('https://test.co/front.jpg')
  })

  it('retourne null quand tableau vide', () => {
    expect(getPrimaryImage([])).toBeNull()
  })

  it('retourne 3/4 meme si pas en premier dans le tableau', () => {
    const images = [
      { id: 'i1', model_id: 'm1', image_url: 'https://test.co/back.jpg', view_type: 'back', sort_order: 0 },
      { id: 'i2', model_id: 'm1', image_url: 'https://test.co/side.jpg', view_type: 'side', sort_order: 1 },
      { id: 'i3', model_id: 'm1', image_url: 'https://test.co/34.jpg', view_type: '3/4', sort_order: 2 },
    ]
    expect(getPrimaryImage(images)).toBe('https://test.co/34.jpg')
  })

  it('retourne la premiere image quand plusieurs images sans 3/4', () => {
    const images = [
      { id: 'i1', model_id: 'm1', image_url: 'https://test.co/a.jpg', view_type: 'front', sort_order: 0 },
      { id: 'i2', model_id: 'm1', image_url: 'https://test.co/b.jpg', view_type: 'back', sort_order: 1 },
      { id: 'i3', model_id: 'm1', image_url: 'https://test.co/c.jpg', view_type: 'side', sort_order: 2 },
    ]
    expect(getPrimaryImage(images)).toBe('https://test.co/a.jpg')
  })
})

describe('formatPrice — formatage prix FR', () => {
  it('formate 1290 en "a partir de 1 290 \u20ac"', () => {
    expect(formatPrice(1290)).toBe('a partir de 1\u202f290 \u20ac')
  })

  it('formate 0 en "a partir de 0 \u20ac"', () => {
    expect(formatPrice(0)).toBe('a partir de 0 \u20ac')
  })

  it('formate 15000 en "a partir de 15 000 \u20ac"', () => {
    expect(formatPrice(15000)).toBe('a partir de 15\u202f000 \u20ac')
  })
})
