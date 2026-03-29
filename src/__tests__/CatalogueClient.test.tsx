import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CatalogueClient } from '@/components/public/Catalogue/CatalogueClient'
import type { ModelWithImages, Fabric, VisualWithFabricAndImage } from '@/types/database'

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

const mockFabrics: Fabric[] = [
  {
    id: 'fabric-001',
    name: 'Velours Bleu',
    slug: 'velours-bleu',
    category: 'velours',
    is_active: true,
    is_premium: false,
    swatch_url: 'https://test.supabase.co/storage/v1/object/public/fabric-swatches/velours-bleu.jpg',
    reference_image_url: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'fabric-002',
    name: 'Cuir Premium',
    slug: 'cuir-premium',
    category: 'cuir',
    is_active: true,
    is_premium: true,
    swatch_url: 'https://test.supabase.co/storage/v1/object/public/fabric-swatches/cuir-premium.jpg',
    reference_image_url: null,
    created_at: '2026-01-02T00:00:00Z',
  },
]

const mockVisuals: VisualWithFabricAndImage[] = [
  {
    id: 'visual-001',
    model_id: 'test-uuid-001',
    model_image_id: 'img-001',
    fabric_id: 'fabric-001',
    generated_image_url: 'https://test.supabase.co/storage/v1/object/public/generated-visuals/v001.jpg',
    is_validated: true,
    is_published: true,
    created_at: '2026-01-03T00:00:00Z',
    fabric: mockFabrics[0],
    model_image: {
      id: 'img-001',
      model_id: 'test-uuid-001',
      image_url: 'https://test.supabase.co/storage/v1/object/public/model-photos/milano.jpg',
      view_type: '3/4',
      sort_order: 0,
    },
  },
]

describe('CatalogueClient', () => {
  it('affiche la grille de ProductCards quand models non vide', () => {
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Nos Canapes')
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('affiche le message etat vide quand models est vide', () => {
    render(<CatalogueClient models={[]} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(screen.getByText(/canapes arrivent bientot/i)).toBeInTheDocument()
  })

  it('a id catalogue sur la section', () => {
    const { container } = render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(container.querySelector('#catalogue')).toBeInTheDocument()
  })

  it('a aria-labelledby pointant vers le titre', () => {
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    const section = screen.getByRole('region', { name: /nos canapes/i })
      || document.getElementById('catalogue')
    expect(section).toBeInTheDocument()
  })

  it('affiche le sous-titre de section', () => {
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(screen.getByText(/commencer la configuration/i)).toBeInTheDocument()
  })

  it('a id catalogue sur la section en etat vide aussi', () => {
    const { container } = render(<CatalogueClient models={[]} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(container.querySelector('#catalogue')).toBeInTheDocument()
  })

  it('rend exactement 1 article pour un seul modele', () => {
    render(<CatalogueClient models={[mockModels[0]]} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })
})

describe('CatalogueClient — recherche et filtrage', () => {
  it('[SRCH-01] saisir "mil" filtre et affiche seulement Milano', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    const input = screen.getByLabelText(/rechercher un canapé par nom/i)
    await user.type(input, 'mil')
    expect(screen.getByText(/milano/i)).toBeInTheDocument()
    expect(screen.queryByText(/oslo/i)).not.toBeInTheDocument()
  })

  it('[SRCH-01] saisir "canape" sans accent trouve Canapé Milano (normalisation)', async () => {
    const user = userEvent.setup()
    const modelsWithAccent: ModelWithImages[] = [
      { ...mockModels[0], name: 'Canapé Milano' },
    ]
    render(<CatalogueClient models={modelsWithAccent} fabrics={mockFabrics} visuals={mockVisuals} />)
    const input = screen.getByLabelText(/rechercher un canapé par nom/i)
    await user.type(input, 'canape')
    expect(screen.getByText(/canapé milano/i)).toBeInTheDocument()
  })

  it('[SRCH-02] saisir "zzz" affiche letat vide avec le terme', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    const input = screen.getByLabelText(/rechercher un canapé par nom/i)
    await user.type(input, 'zzz')
    expect(screen.getByText(/aucun canapé ne correspond/i)).toBeInTheDocument()
    expect(screen.getByText(/zzz/i)).toBeInTheDocument()
  })

  it('[SRCH-02] cliquer Effacer la recherche remet toutes les cards', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    const input = screen.getByLabelText(/rechercher un canapé par nom/i)
    await user.type(input, 'zzz')
    const resetBtn = screen.getByRole('button', { name: /effacer la recherche/i })
    await user.click(resetBtn)
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('[CAT-04] compteur affiche "2 canapés" avec 2 modeles', () => {
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(screen.getByText('2 canapés')).toBeInTheDocument()
  })

  it('[CAT-04] compteur affiche "1 canapé" (singulier) avec 1 modele', () => {
    render(<CatalogueClient models={[mockModels[0]]} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(screen.getByText('1 canapé')).toBeInTheDocument()
  })
})

describe('CatalogueClient — integration modal configurateur', () => {
  it('cliquer "Configurer ce modele" ouvre le modal avec le bon modele', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    const cta = screen.getByRole('button', { name: /configurer le modele milano/i })
    await user.click(cta)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /milano/i })).toBeInTheDocument()
  })

  it('le modal affiche le prix du modele selectionne', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    await user.click(screen.getByRole('button', { name: /configurer le modele oslo/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toMatch(/1\s?490/)
  })

  it('cliquer le bouton X ferme le modal', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    await user.click(screen.getByRole('button', { name: /configurer le modele milano/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Fermer le configurateur'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('le modal affiche le configurateur avec le nom du modele', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    await user.click(screen.getByRole('button', { name: /configurer le modele milano/i }))
    expect(screen.getByRole('heading', { level: 2, name: /milano/i })).toBeInTheDocument()
  })
})

describe('CatalogueClient — edge cases recherche', () => {
  it('bouton clear X visible quand query non vide', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    const input = screen.getByLabelText(/rechercher un canapé par nom/i)
    await user.type(input, 'mil')
    expect(screen.getByRole('button', { name: /vider le champ/i })).toBeInTheDocument()
  })

  it('bouton clear X absent quand query vide', () => {
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    expect(screen.queryByRole('button', { name: /vider le champ/i })).not.toBeInTheDocument()
  })

  it('cliquer le bouton clear X vide le champ et reaffiche toutes les cards', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    const input = screen.getByLabelText(/rechercher un canapé par nom/i)
    await user.type(input, 'mil')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    const clearBtn = screen.getByRole('button', { name: /vider le champ/i })
    await user.click(clearBtn)
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('compteur affiche "0 canapés" quand recherche ne matche rien', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    const input = screen.getByLabelText(/rechercher un canapé par nom/i)
    await user.type(input, 'zzz')
    expect(screen.getByText('0 canapés')).toBeInTheDocument()
  })

  it('recherche insensible a la casse (OSLO en majuscules)', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    const input = screen.getByLabelText(/rechercher un canapé par nom/i)
    await user.type(input, 'OSLO')
    expect(screen.getByText(/oslo/i)).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })
})

describe('CatalogueClient — forwarding props fabrics et visuals', () => {
  it('[D-04] forwarde fabrics et visuals au ConfiguratorModal a louverture', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={mockFabrics} visuals={mockVisuals} />)
    await user.click(screen.getByRole('button', { name: /configurer le modele milano/i }))
    // Le modal souvre sans crash — preuve que les props obligatoires sont transmises
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /milano/i })).toBeInTheDocument()
  })

  it('[D-04] fonctionne avec des tableaux fabrics et visuals vides', async () => {
    const user = userEvent.setup()
    render(<CatalogueClient models={mockModels} fabrics={[]} visuals={[]} />)
    await user.click(screen.getByRole('button', { name: /configurer le modele milano/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
