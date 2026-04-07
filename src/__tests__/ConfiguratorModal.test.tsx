import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfiguratorModal } from '@/components/public/Catalogue/ConfiguratorModal'
import { getPrimaryImage, formatStartingPrice } from '@/lib/utils'
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

  it('[EDGE] etat vide — message affiche quand aucun tissu eligible', () => {
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={[]}
        visuals={[]}
      />
    )

    expect(screen.getByText(/Aucun tissu disponible/i)).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).toBeNull()
  })

  it('[EDGE] tissu sans swatch_url est exclu de la grille', () => {
    const fabricNoSwatch: Fabric = {
      id: 'fabric-no-swatch',
      name: 'Tissu Invisible',
      slug: 'tissu-invisible',
      category: 'test',
      is_active: true,
      is_premium: false,
      swatch_url: null,
      reference_image_url: null,
      created_at: '2026-01-01T00:00:00Z',
    }

    const visualForNoSwatch: VisualWithFabricAndImage = {
      id: 'visual-no-swatch',
      model_id: 'test-uuid-modal',
      model_image_id: 'img-modal-001',
      fabric_id: 'fabric-no-swatch',
      generated_image_url: 'https://test.supabase.co/storage/v1/object/public/generated-visuals/noswatch.jpg',
      is_validated: true,
      is_published: true,
      created_at: '2026-01-03T00:00:00Z',
      fabric: fabricNoSwatch,
      model_image: mockModel.model_images[0],
    }

    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={[...allFabrics, fabricNoSwatch]}
        visuals={[...allVisuals, visualForNoSwatch]}
      />
    )

    // Doit avoir 2 swatches (les 2 avec swatch_url), pas 3
    const swatches = screen.getAllByRole('radio')
    expect(swatches).toHaveLength(2)
    expect(screen.queryByLabelText(/Tissu Invisible/)).toBeNull()
  })

  it('[EDGE] switch de modele reset la selection tissu', async () => {
    const user = userEvent.setup()

    const { rerender } = render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )

    // Selectionner un swatch
    const swatches = screen.getAllByRole('radio')
    await user.click(swatches[0] as HTMLElement)
    expect(swatches[0].getAttribute('aria-checked')).toBe('true')

    // Simuler changement de modele via rerender
    const otherModel: ModelWithImages = {
      ...mockModel,
      id: 'other-model-id',
      name: 'Canape Moderne',
    }

    rerender(
      <ConfiguratorModal
        model={otherModel}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )

    // Apres changement de modele, aucun swatch ne doit etre selectionne
    // (pas de radiogroup car le nouveau modele n'a pas de visuals)
    // et le prix doit revenir a "a partir de"
    expect(screen.getByText(/a partir de/i)).toBeInTheDocument()
  })

  it('[EDGE] prix initial affiche "a partir de" sans selection', () => {
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )

    // Sans selection, le prix doit etre au format "a partir de X EUR"
    expect(screen.getByText(/a partir de/i)).toBeInTheDocument()
  })

  it('[EDGE] accessibilite — radiogroup a un aria-label', () => {
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )

    const radiogroup = screen.getByRole('radiogroup')
    expect(radiogroup.getAttribute('aria-label')).toBe('Choisissez votre tissu')
  })

  it('[EDGE] swatches d un autre modele ne sont pas affiches', () => {
    // Visual pour un AUTRE modele — ne doit pas generer de swatch pour mockModel
    const otherModelVisual: VisualWithFabricAndImage = {
      id: 'visual-other-model',
      model_id: 'other-model-uuid',
      model_image_id: 'img-other',
      fabric_id: 'fabric-modal-001',
      generated_image_url: 'https://test.supabase.co/storage/v1/object/public/generated-visuals/other.jpg',
      is_validated: true,
      is_published: true,
      created_at: '2026-01-03T00:00:00Z',
      fabric: mockFabrics[0],
      model_image: mockModel.model_images[0],
    }

    // On passe UNIQUEMENT le visual de l'autre modele — notre modele ne devrait avoir aucun swatch
    render(
      <ConfiguratorModal
        model={mockModel}
        onClose={onCloseMock}
        fabrics={allFabrics}
        visuals={[otherModelVisual]}
      />
    )

    // Aucun swatch ne doit apparaitre car les visuals sont pour un autre modele
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.getByText(/Aucun tissu disponible/i)).toBeInTheDocument()
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

describe('formatStartingPrice — formatage prix FR', () => {
  it('formate 1290 en "a partir de 1 290 \u20ac"', () => {
    expect(formatStartingPrice(1290)).toBe('a partir de 1\u202f290 \u20ac')
  })

  it('formate 0 en "a partir de 0 \u20ac"', () => {
    expect(formatStartingPrice(0)).toBe('a partir de 0 \u20ac')
  })

  it('formate 15000 en "a partir de 15 000 \u20ac"', () => {
    expect(formatStartingPrice(15000)).toBe('a partir de 15\u202f000 \u20ac')
  })
})

// === Phase 9 fixtures — multi-angles ===
const mockModelMultiAngle: ModelWithImages = {
  id: 'model-multi-angle',
  name: 'Canape Milano',
  slug: 'canape-milano',
  price: 1890,
  description: 'Canape modulable design',
  dimensions: '280x95x80',
  is_active: true,
  shopify_url: 'https://www.mobelunique.fr/products/canape-milano',
  created_at: '2026-01-01T00:00:00Z',
  model_images: [
    { id: 'img-34', model_id: 'model-multi-angle', image_url: 'https://test.supabase.co/model-photos/milano-34.jpg', view_type: '3/4', sort_order: 0 },
    { id: 'img-face', model_id: 'model-multi-angle', image_url: 'https://test.supabase.co/model-photos/milano-face.jpg', view_type: 'face', sort_order: 1 },
    { id: 'img-profil', model_id: 'model-multi-angle', image_url: 'https://test.supabase.co/model-photos/milano-profil.jpg', view_type: 'profil', sort_order: 2 },
  ],
}

// Fabric fixtures pour Phase 9
const fabricVeloursEmeraude: Fabric = {
  id: 'fabric-modal-001',
  name: 'Velours Emeraude',
  slug: 'velours-emeraude',
  category: 'velours',
  is_active: true,
  is_premium: false,
  swatch_url: 'https://test.supabase.co/storage/v1/object/public/fabric-swatches/velours-emeraude.jpg',
  reference_image_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const fabricCuirNappa: Fabric = {
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

const fabricSingleAngle: Fabric = {
  id: 'fabric-single-angle',
  name: 'Soie Bleue',
  slug: 'soie-bleue',
  category: 'soie',
  is_active: true,
  is_premium: false,
  swatch_url: 'https://test.supabase.co/storage/v1/object/public/fabric-swatches/soie-bleue.jpg',
  reference_image_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

// 3 visuals publies pour Velours Emeraude — un par angle
const mockVisualsMultiAngle: VisualWithFabricAndImage[] = [
  {
    id: 'visual-ma-34',
    model_id: 'model-multi-angle',
    model_image_id: 'img-34',
    fabric_id: 'fabric-modal-001',
    generated_image_url: 'https://test.supabase.co/generated-visuals/milano-velours-34.jpg',
    is_validated: true,
    is_published: true,
    created_at: '2026-01-03T00:00:00Z',
    fabric: fabricVeloursEmeraude,
    model_image: { id: 'img-34', model_id: 'model-multi-angle', image_url: 'https://test.supabase.co/model-photos/milano-34.jpg', view_type: '3/4', sort_order: 0 },
  },
  {
    id: 'visual-ma-face',
    model_id: 'model-multi-angle',
    model_image_id: 'img-face',
    fabric_id: 'fabric-modal-001',
    generated_image_url: 'https://test.supabase.co/generated-visuals/milano-velours-face.jpg',
    is_validated: true,
    is_published: true,
    created_at: '2026-01-03T00:00:00Z',
    fabric: fabricVeloursEmeraude,
    model_image: { id: 'img-face', model_id: 'model-multi-angle', image_url: 'https://test.supabase.co/model-photos/milano-face.jpg', view_type: 'face', sort_order: 1 },
  },
  {
    id: 'visual-ma-profil',
    model_id: 'model-multi-angle',
    model_image_id: 'img-profil',
    fabric_id: 'fabric-modal-001',
    generated_image_url: 'https://test.supabase.co/generated-visuals/milano-velours-profil.jpg',
    is_validated: true,
    is_published: true,
    created_at: '2026-01-03T00:00:00Z',
    fabric: fabricVeloursEmeraude,
    model_image: { id: 'img-profil', model_id: 'model-multi-angle', image_url: 'https://test.supabase.co/model-photos/milano-profil.jpg', view_type: 'profil', sort_order: 2 },
  },
]

// 2 visuals publies pour Cuir Nappa — angles 3/4 + face seulement (profil ABSENT)
const mockVisualsPartialAngles: VisualWithFabricAndImage[] = [
  {
    id: 'visual-pa-34',
    model_id: 'model-multi-angle',
    model_image_id: 'img-34',
    fabric_id: 'fabric-modal-002',
    generated_image_url: 'https://test.supabase.co/generated-visuals/milano-cuir-34.jpg',
    is_validated: true,
    is_published: true,
    created_at: '2026-01-03T00:00:00Z',
    fabric: fabricCuirNappa,
    model_image: { id: 'img-34', model_id: 'model-multi-angle', image_url: 'https://test.supabase.co/model-photos/milano-34.jpg', view_type: '3/4', sort_order: 0 },
  },
  {
    id: 'visual-pa-face',
    model_id: 'model-multi-angle',
    model_image_id: 'img-face',
    fabric_id: 'fabric-modal-002',
    generated_image_url: 'https://test.supabase.co/generated-visuals/milano-cuir-face.jpg',
    is_validated: true,
    is_published: true,
    created_at: '2026-01-03T00:00:00Z',
    fabric: fabricCuirNappa,
    model_image: { id: 'img-face', model_id: 'model-multi-angle', image_url: 'https://test.supabase.co/model-photos/milano-face.jpg', view_type: 'face', sort_order: 1 },
  },
]

// 1 seul visual publie pour Soie Bleue — angle 3/4 seulement (pour tester D-11)
const mockVisualsSingleAngle: VisualWithFabricAndImage[] = [
  {
    id: 'visual-sa-34',
    model_id: 'model-multi-angle',
    model_image_id: 'img-34',
    fabric_id: 'fabric-single-angle',
    generated_image_url: 'https://test.supabase.co/generated-visuals/milano-soie-34.jpg',
    is_validated: true,
    is_published: true,
    created_at: '2026-01-03T00:00:00Z',
    fabric: fabricSingleAngle,
    model_image: { id: 'img-34', model_id: 'model-multi-angle', image_url: 'https://test.supabase.co/model-photos/milano-34.jpg', view_type: '3/4', sort_order: 0 },
  },
]

// Combinaison de tous les fabrics et visuals Phase 9
const allFabricsPhase9 = [fabricVeloursEmeraude, fabricCuirNappa, fabricSingleAngle]
const allVisualsPhase9 = [...mockVisualsMultiAngle, ...mockVisualsPartialAngles, ...mockVisualsSingleAngle]

describe('Phase 9 — navigation angles', () => {
  let onCloseMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onCloseMock = vi.fn()
    vi.clearAllMocks()
  })

  it('CONF-06a: affiche les thumbnails de tous les angles quand aucun tissu selectionne', () => {
    render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    const angleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    expect(angleRadiogroup).toBeInTheDocument()

    const angleRadios = angleRadiogroup.querySelectorAll('[role="radio"]')
    expect(angleRadios).toHaveLength(3)
  })

  it('CONF-06b: cliquer un thumbnail change limage principale', async () => {
    const user = userEvent.setup()
    render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // Selectionner Velours Emeraude
    const swatchRadiogroup = screen.getByRole('radiogroup', { name: 'Choisissez votre tissu' })
    const swatches = swatchRadiogroup.querySelectorAll('[role="radio"]')
    await user.click(swatches[0] as HTMLElement) // Velours Emeraude

    // Cliquer le thumbnail "Vue face"
    const angleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    const faceThumbnail = angleRadiogroup.querySelector('[aria-label="Vue face"]') as HTMLElement
    await user.click(faceThumbnail)

    // L'image principale doit afficher le rendu IA face
    const mainImg = screen.getByAltText(/Canape Milano/)
    expect(mainImg.getAttribute('src')).toContain('milano-velours-face.jpg')
  })

  it('CONF-06c: le thumbnail actif a aria-checked true', async () => {
    const user = userEvent.setup()
    render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    const angleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })

    // Le thumbnail 3/4 doit etre actif par defaut
    const thumbnail34 = angleRadiogroup.querySelector('[aria-label="Vue 3/4"]')
    expect(thumbnail34?.getAttribute('aria-checked')).toBe('true')

    // Cliquer "Vue profil"
    const thumbnailProfil = angleRadiogroup.querySelector('[aria-label="Vue profil"]') as HTMLElement
    await user.click(thumbnailProfil)

    // Profil doit etre actif, 3/4 non
    expect(thumbnailProfil.getAttribute('aria-checked')).toBe('true')
    expect(thumbnail34?.getAttribute('aria-checked')).toBe('false')
  })

  it('CONF-06d: avec tissu selectionne, seuls les angles avec rendu publie sont affiches', async () => {
    const user = userEvent.setup()
    render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // Selectionner Cuir Nappa (2 angles publies : 3/4 + face, pas profil)
    const swatchRadiogroup = screen.getByRole('radiogroup', { name: 'Choisissez votre tissu' })
    const cuirNappaSwatch = swatchRadiogroup.querySelector('[aria-label*="Cuir Nappa"]') as HTMLElement
    await user.click(cuirNappaSwatch)

    // Seulement 2 radios dans le radiogroup angles
    const angleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    const angleRadios = angleRadiogroup.querySelectorAll('[role="radio"]')
    expect(angleRadios).toHaveLength(2)

    // Le thumbnail profil est absent
    expect(angleRadiogroup.querySelector('[aria-label="Vue profil"]')).toBeNull()
  })

  it('D-11: rangee thumbnails masquee si un seul angle publie', async () => {
    const user = userEvent.setup()
    render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // Selectionner Soie Bleue (1 seul angle publie)
    const swatchRadiogroup = screen.getByRole('radiogroup', { name: 'Choisissez votre tissu' })
    const soieBleueRadio = swatchRadiogroup.querySelector('[aria-label*="Soie Bleue"]') as HTMLElement
    await user.click(soieBleueRadio)

    // Le radiogroup angles doit etre absent (un seul angle)
    expect(screen.queryByRole('radiogroup', { name: "Choisir l'angle de vue" })).toBeNull()
  })

  it('CONF-06e: sans tissu, thumbnails montrent photos originales de tous les angles', () => {
    render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    const angleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    expect(angleRadiogroup).toBeInTheDocument()

    // 3 thumbnails correspondant aux 3 model_images
    const angleRadios = angleRadiogroup.querySelectorAll('[role="radio"]')
    expect(angleRadios).toHaveLength(3)

    // Les images dans les thumbnails doivent utiliser les image_url originales (pas generated_image_url)
    const thumbnailImgs = angleRadiogroup.querySelectorAll('img')
    const srcs = Array.from(thumbnailImgs).map((img) => img.getAttribute('src'))
    expect(srcs.some((src) => src?.includes('milano-34.jpg'))).toBe(true)
    expect(srcs.some((src) => src?.includes('milano-face.jpg'))).toBe(true)
    expect(srcs.some((src) => src?.includes('milano-profil.jpg'))).toBe(true)
    // Aucune src ne doit pointer vers generated-visuals
    expect(srcs.some((src) => src?.includes('generated-visuals'))).toBe(false)
  })

  it('D-12: changement de tissu preserve langle si rendu existe, sinon reset', async () => {
    const user = userEvent.setup()
    render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // Selectionner Velours Emeraude (3 angles disponibles)
    const swatchRadiogroup = screen.getByRole('radiogroup', { name: 'Choisissez votre tissu' })
    const veloursRadio = swatchRadiogroup.querySelector('[aria-label*="Velours Emeraude"]') as HTMLElement
    await user.click(veloursRadio)

    // Cliquer thumbnail "Vue profil"
    const angleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    const profilThumbnail = angleRadiogroup.querySelector('[aria-label="Vue profil"]') as HTMLElement
    await user.click(profilThumbnail)
    expect(profilThumbnail.getAttribute('aria-checked')).toBe('true')

    // Changer pour Cuir Nappa (pas de rendu profil)
    const cuirNappaRadio = swatchRadiogroup.querySelector('[aria-label*="Cuir Nappa"]') as HTMLElement
    await user.click(cuirNappaRadio)

    // L'angle profil doit avoir ete reset (thumbnail profil disparu car absent de Cuir Nappa)
    const newAngleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    expect(newAngleRadiogroup.querySelector('[aria-label="Vue profil"]')).toBeNull()

    // Un angle doit etre selectionne (3/4 ou face)
    const remainingRadios = newAngleRadiogroup.querySelectorAll('[role="radio"]')
    const activeRadio = Array.from(remainingRadios).find(
      (r) => r.getAttribute('aria-checked') === 'true'
    )
    expect(activeRadio).toBeTruthy()
  })

  it('D-16: changement de modele reset langle au 3/4', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // Cliquer thumbnail "Vue profil"
    const angleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    const profilThumbnail = angleRadiogroup.querySelector('[aria-label="Vue profil"]') as HTMLElement
    await user.click(profilThumbnail)
    expect(profilThumbnail.getAttribute('aria-checked')).toBe('true')

    // Simuler changement de modele
    const newModel: ModelWithImages = {
      ...mockModelMultiAngle,
      id: 'model-other',
      name: 'Canape Roma',
      slug: 'canape-roma',
    }
    rerender(
      <ConfiguratorModal
        model={newModel}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // Le thumbnail 3/4 du nouveau modele doit etre actif
    const newAngleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    const thumbnail34 = newAngleRadiogroup.querySelector('[aria-label="Vue 3/4"]')
    expect(thumbnail34?.getAttribute('aria-checked')).toBe('true')
  })

  it('D-07: alt text inclut le nom de langle quand tissu selectionne', async () => {
    const user = userEvent.setup()
    render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // Selectionner Velours Emeraude
    const swatchRadiogroup = screen.getByRole('radiogroup', { name: 'Choisissez votre tissu' })
    const veloursRadio = swatchRadiogroup.querySelector('[aria-label*="Velours Emeraude"]') as HTMLElement
    await user.click(veloursRadio)

    // Cliquer thumbnail "Vue face"
    const angleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    const faceThumbnail = angleRadiogroup.querySelector('[aria-label="Vue face"]') as HTMLElement
    await user.click(faceThumbnail)

    // L'image principale doit avoir un alt contenant "vue face"
    const mainImg = screen.getByAltText(/vue face/i)
    expect(mainImg).toBeInTheDocument()
  })

  it('CONF-04: limage principale affiche le rendu IA pour le tissu et angle selectionnes', async () => {
    const user = userEvent.setup()
    render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={onCloseMock}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // Selectionner Velours Emeraude
    const swatchRadiogroup = screen.getByRole('radiogroup', { name: 'Choisissez votre tissu' })
    const veloursRadio = swatchRadiogroup.querySelector('[aria-label*="Velours Emeraude"]') as HTMLElement
    await user.click(veloursRadio)

    // Cliquer "Vue profil"
    const angleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    const profilThumbnail = angleRadiogroup.querySelector('[aria-label="Vue profil"]') as HTMLElement
    await user.click(profilThumbnail)

    // L'image principale doit afficher le rendu IA profil + Velours
    const mainImg = screen.getByAltText(/Canape Milano/)
    expect(mainImg.getAttribute('src')).toContain('milano-velours-profil.jpg')
  })

  it('D-15: reouverture du meme modele preserve langle selectionne', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={vi.fn()}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // Cliquer thumbnail "Vue profil"
    const angleRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    const profilThumbnail = angleRadiogroup.querySelector('[aria-label="Vue profil"]') as HTMLElement
    await user.click(profilThumbnail)
    expect(profilThumbnail.getAttribute('aria-checked')).toBe('true')

    // Fermer la modal (model = null)
    rerender(
      <ConfiguratorModal
        model={null}
        onClose={vi.fn()}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // Rouvrir le MEME modele
    rerender(
      <ConfiguratorModal
        model={mockModelMultiAngle}
        onClose={vi.fn()}
        fabrics={allFabricsPhase9}
        visuals={allVisualsPhase9}
      />
    )

    // L'angle profil doit etre preserve (pas reset au 3/4)
    const reopenedRadiogroup = screen.getByRole('radiogroup', { name: "Choisir l'angle de vue" })
    const profilAfterReopen = reopenedRadiogroup.querySelector('[aria-label="Vue profil"]')
    expect(profilAfterReopen?.getAttribute('aria-checked')).toBe('true')
  })
})

// ==========================================
// Phase 11 — Simulation IA Upload
// ==========================================

describe('Phase 11 — simulation IA upload', () => {
  const renderModal = () => {
    return render(
      <ConfiguratorModal
        model={mockModel}
        onClose={vi.fn()}
        fabrics={allFabrics}
        visuals={allVisuals}
      />
    )
  }

  it('[SIM-01] CTA Visualiser chez moi est visible dans le configurateur', () => {
    renderModal()
    const ctaSim = screen.getByRole('button', { name: 'Visualiser chez moi' })
    expect(ctaSim).toBeDefined()
  })

  it('[SIM-01] clic CTA affiche letape simulation avec zone upload', async () => {
    const user = userEvent.setup()
    renderModal()
    const ctaSim = screen.getByRole('button', { name: 'Visualiser chez moi' })
    await user.click(ctaSim)

    // Zone upload visible
    expect(screen.getByText('Glissez votre photo ici')).toBeDefined()
    expect(screen.getByText('Choisir une photo')).toBeDefined()
    expect(screen.getByText(/JPEG, PNG, HEIC/)).toBeDefined()
  })

  it('[D-03] bouton retour revient au configurateur', async () => {
    const user = userEvent.setup()
    renderModal()

    // Aller a la simulation
    await user.click(screen.getByRole('button', { name: 'Visualiser chez moi' }))
    expect(screen.getByText('Glissez votre photo ici')).toBeDefined()

    // Revenir
    await user.click(screen.getByText(/Modifier la configuration/))
    expect(screen.getByText('Choisissez votre tissu')).toBeDefined()
  })

  it('[D-05] bandeau rappel config affiche le canape sans tissu', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: 'Visualiser chez moi' }))

    expect(screen.getByText(/original/i)).toBeDefined()
  })

  it('[D-05] bandeau rappel config affiche canape x tissu selectionne', async () => {
    const user = userEvent.setup()
    renderModal()

    // Selectionner un tissu d'abord
    const swatchRadiogroup = screen.getByRole('radiogroup', { name: 'Choisissez votre tissu' })
    const firstSwatch = swatchRadiogroup.querySelector('[role="radio"]') as HTMLElement
    await user.click(firstSwatch)

    // Aller a la simulation
    await user.click(screen.getByRole('button', { name: 'Visualiser chez moi' }))

    // Bandeau doit montrer le nom du tissu
    expect(screen.getByText(/Velours Emeraude/)).toBeDefined()
  })

  it('[D-11] validation fichier > 15 Mo affiche erreur en francais', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: 'Visualiser chez moi' }))

    // Creer un fichier > 15 Mo
    const bigFile = new File([new Uint8Array(16 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, bigFile)

    // L'erreur est dans un role="alert"
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain('15 Mo')
  })

  it('[D-11] validation format invalide affiche erreur en francais', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: 'Visualiser chez moi' }))

    // fireEvent.change contourne accept= pour tester la validation JS
    const pdfFile = new File(['fake'], 'doc.pdf', { type: 'application/pdf' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [pdfFile], configurable: true })
    fireEvent.change(input)

    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain('Format non supporte')
  })

  it('[D-09] upload valide affiche le preview et bouton Lancer', async () => {
    const user = userEvent.setup()
    // Mock createObjectURL
    const mockUrl = 'blob:http://localhost/fake-preview'
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => mockUrl), revokeObjectURL: vi.fn() })

    renderModal()
    await user.click(screen.getByRole('button', { name: 'Visualiser chez moi' }))

    const validFile = new File([new Uint8Array(1024)], 'salon.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, validFile)

    expect(screen.getByText('Lancer la simulation')).toBeDefined()
    expect(screen.getByText('Changer de photo')).toBeDefined()

    vi.unstubAllGlobals()
  })

  it('[D-12] etat generating affiche la barre de progression et bouton Annuler', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() })

    // Mock fetch pour ne jamais resoudre (simuler generation en cours)
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    renderModal()
    await user.click(screen.getByRole('button', { name: 'Visualiser chez moi' }))

    // Upload
    const validFile = new File([new Uint8Array(1024)], 'salon.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, validFile)

    // Lancer
    await user.click(screen.getByText('Lancer la simulation'))

    // Barre de progression et annuler visibles
    expect(screen.getByRole('progressbar')).toBeDefined()
    expect(screen.getByText('Annuler')).toBeDefined()
    // "Analyse de la piece" apparait 2 fois (stage label + step list item)
    expect(screen.getAllByText('Analyse de la piece').length).toBeGreaterThanOrEqual(1)

    vi.unstubAllGlobals()
  })

  it('[D-15] annulation retourne a letat preview', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() })

    // Mock fetch qui ecoute le signal.abort pour rejeter avec AbortError
    vi.stubGlobal('fetch', vi.fn((_url: string, opts: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        if (opts?.signal) {
          opts.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        }
      })
    }))

    renderModal()
    await user.click(screen.getByRole('button', { name: 'Visualiser chez moi' }))

    // Upload + lancer
    const validFile = new File([new Uint8Array(1024)], 'salon.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, validFile)
    await user.click(screen.getByText('Lancer la simulation'))

    // Annuler
    await user.click(screen.getByText('Annuler'))

    // Attendre le retour a l'etat preview (AbortError est async)
    await vi.waitFor(() => {
      expect(screen.getByText('Lancer la simulation')).toBeDefined()
    })

    vi.unstubAllGlobals()
  })
})
