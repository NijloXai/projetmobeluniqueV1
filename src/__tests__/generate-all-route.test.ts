/**
 * Tests Phase 13 : route POST /api/admin/generate-all
 *
 * Couvre : maxDuration export, validation body, errors array,
 * succes partiel, structure reponse {generated, total, success, errors}.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

// Mock requireAdmin
const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()
const mockOrder = vi.fn()
const mockDelete = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({}) }))
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }))

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        eq: vi.fn(() => ({
          single: mockSingle,
          maybeSingle: mockMaybeSingle,
          order: mockOrder,
        })),
        order: mockOrder,
      })),
    })),
    insert: mockInsert,
    delete: mockDelete,
  })),
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

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/admin/generate-all', {
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
    const req = new Request('http://localhost:3000/api/admin/generate-all', {
      method: 'POST',
      body: 'not-json',
    })
    const response = await POST(req as never)
    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.error).toContain('JSON invalide')
  })

  it('retourne 400 si champs requis manquants', async () => {
    const response = await POST(makeRequest({ model_id: 'abc' }) as never)
    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.error).toContain('requis')
  })

  it('retourne errors array quand un angle echoue', async () => {
    // Setup : model OK, fabric OK, 2 modelImages
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'm1', slug: 'milano', name: 'Milano' }, error: null }) // model
      .mockResolvedValueOnce({ data: { id: 'f1', name: 'Velours' }, error: null }) // fabric

    mockOrder.mockResolvedValueOnce({
      data: [
        { id: 'mi1', view_type: 'front', image_url: 'https://ex.com/front.jpg' },
        { id: 'mi2', view_type: 'side', image_url: 'https://ex.com/side.jpg' },
      ],
      error: null,
    })

    // Premier angle : pas d'existant
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    // Premier angle : generate OK
    mockGenerate.mockResolvedValueOnce({
      imageBuffer: Buffer.from('img1'),
      mimeType: 'image/jpeg',
      extension: 'jpg',
    })
    // Premier angle : insert OK
    mockSingle.mockResolvedValueOnce({ data: { id: 'gv1' }, error: null })

    // Deuxieme angle : pas d'existant
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    // Deuxieme angle : generate ECHOUE
    mockGenerate.mockRejectedValueOnce(new Error('503 Service Unavailable'))

    const response = await POST(makeRequest({ model_id: 'm1', fabric_id: 'f1' }) as never)
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
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'm1', slug: 'milano', name: 'Milano' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'f1', name: 'Velours' }, error: null })

    mockOrder.mockResolvedValueOnce({
      data: [{ id: 'mi1', view_type: 'front', image_url: 'https://ex.com/front.jpg' }],
      error: null,
    })

    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    mockGenerate.mockResolvedValueOnce({
      imageBuffer: Buffer.from('img'),
      mimeType: 'image/jpeg',
      extension: 'jpg',
    })
    mockSingle.mockResolvedValueOnce({ data: { id: 'gv1' }, error: null })

    const response = await POST(makeRequest({ model_id: 'm1', fabric_id: 'f1' }) as never)
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

    const response = await POST(makeRequest({ model_id: 'm1', fabric_id: 'f1' }) as never)
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toContain('authentifi')
  })
})
