/**
 * Tests D-09 : filtrage JS visuels avec tissu inactif
 *
 * Contexte : PostgREST ne filtre pas les colonnes de jointures imbriquees
 * via `.eq()` standard. Le filtre `v.fabric.is_active === true` doit etre
 * applique cote JS apres reception des donnees (CatalogueSection.tsx).
 *
 * Ce fichier teste la logique pure du filtre, independamment du Server Component.
 */

import { describe, it, expect } from 'vitest'
import type { Fabric, GeneratedVisual, ModelImage, VisualWithFabricAndImage } from '@/types/database'

// Reproduction exacte de la logique de filtrage de CatalogueSection.tsx (READ-ONLY)
// Source : src/components/public/Catalogue/CatalogueSection.tsx ligne 53-56
function filterActiveVisuals(
  rawVisuals: (GeneratedVisual & { fabric: Fabric | null; model_image: ModelImage | null })[]
): VisualWithFabricAndImage[] {
  return rawVisuals.filter(
    (v): v is VisualWithFabricAndImage =>
      v.fabric !== null && (v.fabric as Fabric).is_active === true
  )
}

// --- Fixtures ---

const activeFabric: Fabric = {
  id: 'fabric-active',
  name: 'Velours Bleu',
  slug: 'velours-bleu',
  category: 'velours',
  is_active: true,
  is_premium: false,
  swatch_url: null,
  reference_image_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const inactiveFabric: Fabric = {
  id: 'fabric-inactive',
  name: 'Ancien Velours',
  slug: 'ancien-velours',
  category: 'velours',
  is_active: false,
  is_premium: false,
  swatch_url: null,
  reference_image_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

const modelImage: ModelImage = {
  id: 'img-001',
  model_id: 'model-001',
  image_url: 'https://test.supabase.co/storage/v1/object/public/model-photos/test.jpg',
  view_type: '3/4',
  sort_order: 0,
}

const baseVisual: GeneratedVisual = {
  id: 'visual-001',
  model_id: 'model-001',
  model_image_id: 'img-001',
  fabric_id: 'fabric-active',
  generated_image_url: 'https://test.supabase.co/storage/v1/object/public/generated-visuals/v001.jpg',
  is_validated: true,
  is_published: true,
  created_at: '2026-01-03T00:00:00Z',
}

// --- Tests ---

describe('[D-09] filtrage JS visuels avec tissu inactif', () => {
  it('conserve les visuels dont le tissu est actif (is_active: true)', () => {
    const input = [{ ...baseVisual, fabric: activeFabric, model_image: modelImage }]
    const result = filterActiveVisuals(input)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('visual-001')
  })

  it('exclut les visuels dont le tissu est inactif (is_active: false)', () => {
    const input = [
      {
        ...baseVisual,
        id: 'visual-inactive',
        fabric_id: 'fabric-inactive',
        fabric: inactiveFabric,
        model_image: modelImage,
      },
    ]
    const result = filterActiveVisuals(input)
    expect(result).toHaveLength(0)
  })

  it('exclut les visuels dont fabric est null', () => {
    const input = [{ ...baseVisual, fabric: null, model_image: modelImage }]
    const result = filterActiveVisuals(input)
    expect(result).toHaveLength(0)
  })

  it('filtre correctement un melange de visuels actifs et inactifs', () => {
    const input = [
      { ...baseVisual, id: 'v-actif-1', fabric: activeFabric, model_image: modelImage },
      {
        ...baseVisual,
        id: 'v-inactif',
        fabric_id: 'fabric-inactive',
        fabric: inactiveFabric,
        model_image: modelImage,
      },
      { ...baseVisual, id: 'v-null-fabric', fabric: null, model_image: modelImage },
      { ...baseVisual, id: 'v-actif-2', fabric: { ...activeFabric, id: 'fabric-active-2' }, model_image: modelImage },
    ]
    const result = filterActiveVisuals(input)
    expect(result).toHaveLength(2)
    expect(result.map((v) => v.id)).toEqual(['v-actif-1', 'v-actif-2'])
  })

  it('retourne un tableau vide quand tous les tissus sont inactifs', () => {
    const input = [
      { ...baseVisual, id: 'v1', fabric: inactiveFabric, model_image: modelImage },
      { ...baseVisual, id: 'v2', fabric: { ...inactiveFabric, id: 'f2' }, model_image: modelImage },
    ]
    const result = filterActiveVisuals(input)
    expect(result).toHaveLength(0)
  })

  it('retourne un tableau vide quand le tableau source est vide', () => {
    const result = filterActiveVisuals([])
    expect(result).toHaveLength(0)
  })

  it('le type guard garantit que les elements filtres ont fabric non-null', () => {
    const input = [
      { ...baseVisual, id: 'v-actif', fabric: activeFabric, model_image: modelImage },
      { ...baseVisual, id: 'v-null', fabric: null, model_image: modelImage },
    ]
    const result = filterActiveVisuals(input)
    // Chaque element du resultat a fabric non-null (type guard v is VisualWithFabricAndImage)
    result.forEach((v) => {
      expect(v.fabric).not.toBeNull()
      expect(v.fabric.is_active).toBe(true)
    })
  })
})
