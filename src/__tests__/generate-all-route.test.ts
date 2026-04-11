/**
 * Tests Phase 13 : route POST /api/admin/generate-all
 *
 * Couvre : maxDuration export, validation body, errors array,
 * succes partiel, structure reponse {generated, total, success, errors}.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock requireAdmin — mocks par table pour eviter le chainage sequentiel fragile
const mockModelSingle = vi.fn()
const mockFabricSingle = vi.fn()
const mockImageOrder = vi.fn()
const mockVisualMaybeSingle = vi.fn()
const mockVisualInsertSingle = vi.fn()
const mockVisualDelete = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({}) }))

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'models') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockModelSingle })),
        })),
      }
    }
    if (table === 'fabrics') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: mockFabricSingle })),
        })),
      }
    }
    if (table === 'model_images') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: mockImageOrder,
          })),
        })),
      }
    }
    if (table === 'generated_visuals') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mockVisualMaybeSingle,
            })),
          })),
        })),
        insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockVisualInsertSingle })) })),
        delete: mockVisualDelete,
      }
    }
    // Fallback
    return { select: vi.fn(), insert: vi.fn(), delete: vi.fn() }
  }),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/gen.jpg' } })),
      remove: vi.fn().mockResolvedValue({}),
    })),
  },
}

vi.mock('@/lib/supabase/admin', () => ({
  requireAdmin: vi.fn(() => Promise.resolve({ supabase: mockSupabase, error: null })),
}))

// Mock IA service
const mockGenerate = vi.fn()

vi.mock('@/lib/ai', () => ({
  getIAService: vi.fn(() => ({
    generate: mockGenerate,
    addWatermark: vi.fn(),
  })),
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  extractStoragePath: vi.fn(() => 'some/path.jpg'),
}))

// Import apres mocks
const { POST, maxDuration } = await import('@/app/api/admin/generate-all/route')

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/generate-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/generate-all', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exporte maxDuration = 300', () => {
    expect(maxDuration).toBe(300)
  })

  it('retourne 400 si body JSON invalide', async () => {
    const response = await POST(new NextRequest('http://localhost:3000/api/admin/generate-all', {
      method: 'POST',
      body: 'not-json',
    }))
    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.error).toContain('JSON invalide')
  })

  it('retourne 400 si champs requis manquants', async () => {
    const response = await POST(makeRequest({ model_id: 'abc' }))
    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.error).toBeTruthy()
  })

  it('retourne errors array quand un angle echoue', async () => {
    // Setup : model OK, fabric OK, 2 modelImages
    mockModelSingle.mockResolvedValueOnce({ data: { id: '00000000-0000-4000-8000-000000000001', slug: 'milano', name: 'Milano' }, error: null })
    mockFabricSingle.mockResolvedValueOnce({ data: { id: '00000000-0000-4000-8000-000000000003', name: 'Velours' }, error: null })

    mockImageOrder.mockResolvedValueOnce({
      data: [
        { id: 'mi1', view_type: 'front', image_url: 'https://ex.com/front.jpg' },
        { id: 'mi2', view_type: 'side', image_url: 'https://ex.com/side.jpg' },
      ],
      error: null,
    })

    // Premier angle : pas d'existant
    mockVisualMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    // Premier angle : generate OK
    mockGenerate.mockResolvedValueOnce({
      imageBuffer: Buffer.from('img1'),
      mimeType: 'image/jpeg',
      extension: 'jpg',
    })
    // Premier angle : insert OK
    mockVisualInsertSingle.mockResolvedValueOnce({ data: { id: 'gv1' }, error: null })

    // Deuxieme angle : pas d'existant
    mockVisualMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    // Deuxieme angle : generate ECHOUE
    mockGenerate.mockRejectedValueOnce(new Error('503 Service Unavailable'))

    const response = await POST(makeRequest({ model_id: '00000000-0000-4000-8000-000000000001', fabric_id: '00000000-0000-4000-8000-000000000003' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.total).toBe(2)
    expect(json.success).toBe(1)
    expect(json.errors).toHaveLength(1)
    expect(json.errors[0].view_type).toBe('side')
    expect(json.errors[0].reason).toContain('503')
  })

  it('retourne la structure {generated, total, success, errors}', async () => {
    // Setup : model OK, fabric OK, 1 modelImage OK
    mockModelSingle.mockResolvedValueOnce({ data: { id: '00000000-0000-4000-8000-000000000001', slug: 'milano', name: 'Milano' }, error: null })
    mockFabricSingle.mockResolvedValueOnce({ data: { id: '00000000-0000-4000-8000-000000000003', name: 'Velours' }, error: null })

    mockImageOrder.mockResolvedValueOnce({
      data: [{ id: 'mi1', view_type: 'front', image_url: 'https://ex.com/front.jpg' }],
      error: null,
    })

    mockVisualMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    mockGenerate.mockResolvedValueOnce({
      imageBuffer: Buffer.from('img'),
      mimeType: 'image/jpeg',
      extension: 'jpg',
    })
    mockVisualInsertSingle.mockResolvedValueOnce({ data: { id: 'gv1' }, error: null })

    const response = await POST(makeRequest({ model_id: '00000000-0000-4000-8000-000000000001', fabric_id: '00000000-0000-4000-8000-000000000003' }))
    const json = await response.json()

    expect(json).toHaveProperty('generated')
    expect(json).toHaveProperty('total')
    expect(json).toHaveProperty('success')
    expect(json).toHaveProperty('errors')
    expect(Array.isArray(json.generated)).toBe(true)
    expect(Array.isArray(json.errors)).toBe(true)
  })

  it('retourne 401 si non authentifie', async () => {
    const { requireAdmin } = await import('@/lib/supabase/admin')
    vi.mocked(requireAdmin).mockResolvedValueOnce({
      supabase: null,
      user: null,
      error: NextResponse.json(
        { error: 'Non authentifie. Connectez-vous pour acceder a cette ressource.' },
        { status: 401 }
      ),
    })

    const response = await POST(makeRequest({ model_id: '00000000-0000-4000-8000-000000000001', fabric_id: '00000000-0000-4000-8000-000000000003' }))
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toContain('authentifi')
  })
})
