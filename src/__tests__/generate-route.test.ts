/**
 * Tests Phase 13 : route POST /api/admin/generate
 *
 * Couvre : maxDuration export, validation body, ImageSafetyError 422, timeout 504.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock requireAdmin
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/img.jpg' } })),
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

// Mock ImageSafetyError — re-export the real class
vi.mock('@/lib/ai/nano-banana', async () => {
  class ImageSafetyError extends Error {
    constructor() {
      super("Cette image n'a pas pu etre traitee (contenu non autorise). Essayez une autre photo.")
      this.name = 'ImageSafetyError'
    }
  }
  return { ImageSafetyError }
})

// Mock utils
vi.mock('@/lib/utils', () => ({
  extractStoragePath: vi.fn(() => 'some/path.jpg'),
}))

// Import apres mocks
const { POST, maxDuration } = await import('@/app/api/admin/generate/route')
const { ImageSafetyError } = await import('@/lib/ai/nano-banana')

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/admin/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exporte maxDuration = 60', () => {
    expect(maxDuration).toBe(60)
  })

  it('retourne 400 si body JSON invalide', async () => {
    const req = new Request('http://localhost:3000/api/admin/generate', {
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

  it('retourne 422 sur ImageSafetyError', async () => {
    // Mock Supabase pour trouver model, modelImage, fabric
    const mockSingle = vi.fn()
    const mockMaybeSingle = vi.fn()
    const mockEq = vi.fn(() => ({
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      eq: vi.fn(() => ({
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
      })),
    }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    mockSingle
      .mockResolvedValueOnce({ data: { id: 'm1', slug: 'milano', name: 'Milano' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'mi1', view_type: 'front', image_url: 'https://ex.com/img.jpg' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'f1', name: 'Velours' }, error: null })
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    mockGenerate.mockRejectedValueOnce(new ImageSafetyError())

    const response = await POST(
      makeRequest({ model_id: 'm1', model_image_id: 'mi1', fabric_id: 'f1' }) as never
    )
    const json = await response.json()
    expect(response.status).toBe(422)
    expect(json.error).toContain('contenu non autorise')
  })

  it('retourne 504 sur timeout AbortError', async () => {
    const mockSingle = vi.fn()
    const mockMaybeSingle = vi.fn()
    const mockEq = vi.fn(() => ({
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      eq: vi.fn(() => ({
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
      })),
    }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    mockSingle
      .mockResolvedValueOnce({ data: { id: 'm1', slug: 'milano', name: 'Milano' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'mi1', view_type: 'front', image_url: 'https://ex.com/img.jpg' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'f1', name: 'Velours' }, error: null })
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const abortErr = new Error('aborted')
    abortErr.name = 'AbortError'
    mockGenerate.mockRejectedValueOnce(abortErr)

    const response = await POST(
      makeRequest({ model_id: 'm1', model_image_id: 'mi1', fabric_id: 'f1' }) as never
    )
    const json = await response.json()
    expect(response.status).toBe(504)
    expect(json.error).toContain('trop de temps')
  })
})
