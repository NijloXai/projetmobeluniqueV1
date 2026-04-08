/**
 * Tests Phase 11 : route POST /api/simulate
 *
 * Couvre : validation FormData, limite 15 Mo, fabric_id optionnel,
 * gestion HEIC (422), et generation avec/sans tissu.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase — retourne un client avec chaining .from().select().eq().single()
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}))

// Mock IA service
const mockGenerate = vi.fn()
const mockAddWatermark = vi.fn()

vi.mock('@/lib/ai', () => ({
  getIAService: vi.fn(() => ({
    generate: mockGenerate,
    addWatermark: mockAddWatermark,
  })),
}))

// Mock sharp pour le resize (phase 13)
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn(() => ({
      jpeg: vi.fn(() => ({
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('resized')),
      })),
    })),
  })),
}))

// Mock ImageSafetyError
class MockImageSafetyError extends Error {
  constructor() {
    super("Cette image n'a pas pu etre traitee (contenu non autorise). Essayez une autre photo.")
    this.name = 'ImageSafetyError'
  }
}

vi.mock('@/lib/ai/nano-banana', () => ({
  ImageSafetyError: MockImageSafetyError,
}))

// Import dynamique apres les mocks
const { POST } = await import('@/app/api/simulate/route')

function createFormData(fields: Record<string, string | File>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

function makeRequest(formData: FormData, ip?: string): Request {
  const headers: Record<string, string> = {}
  if (ip) headers['x-forwarded-for'] = ip
  return new Request('http://localhost:3000/api/simulate', {
    method: 'POST',
    headers,
    body: formData,
  })
}

function createFakeImage(sizeBytes: number, type = 'image/jpeg', name = 'salon.jpg'): File {
  const buffer = new Uint8Array(sizeBytes)
  return new File([buffer], name, { type })
}

describe('POST /api/simulate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne 400 si image manquante', async () => {
    const fd = createFormData({ model_id: 'test-model-id' })
    const response = await POST(makeRequest(fd) as never)
    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.error).toContain('requise')
  })

  it('retourne 400 si image depasse 15 Mo', async () => {
    const bigImage = createFakeImage(16 * 1024 * 1024) // 16 Mo
    const fd = createFormData({ image: bigImage, model_id: 'test-model-id' })
    const response = await POST(makeRequest(fd) as never)
    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.error).toContain('15 Mo')
  })

  it('retourne 400 si model_id manquant', async () => {
    const image = createFakeImage(1024)
    const fd = createFormData({ image })
    const response = await POST(makeRequest(fd) as never)
    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.error).toContain('model_id')
  })

  it('retourne 404 si modele introuvable en BDD', async () => {
    const image = createFakeImage(1024)
    const fd = createFormData({ image, model_id: 'unknown-id' })

    // Premier .eq() pour models
    mockEq.mockReturnValueOnce({ single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'not found' } }) })

    const response = await POST(makeRequest(fd) as never)
    const json = await response.json()
    expect(response.status).toBe(404)
    expect(json.error).toContain('introuvable')
  })

  it('retourne 200 JPEG sans fabric_id (tissu optionnel, D-16)', async () => {
    const image = createFakeImage(1024)
    const fd = createFormData({ image, model_id: 'model-001' })

    // Mock model lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 'model-001', name: 'Milano' }, error: null })

    // Mock IA generate + watermark
    const fakeBuffer = Buffer.from('fake-jpeg-data')
    mockGenerate.mockResolvedValueOnce({ imageBuffer: fakeBuffer })
    mockAddWatermark.mockResolvedValueOnce(fakeBuffer)

    const response = await POST(makeRequest(fd) as never)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')

    // Verifie que generate a ete appele avec 'tissu original'
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ fabricName: 'tissu original', viewType: 'simulation' })
    )
  })

  it('retourne 200 JPEG avec fabric_id valide', async () => {
    const image = createFakeImage(1024)
    const fd = createFormData({ image, model_id: 'model-001', fabric_id: 'fabric-001' })

    // Mock model lookup (premier appel .from('models'))
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'model-001', name: 'Milano' }, error: null })
      // Mock fabric lookup (deuxieme appel .from('fabrics'))
      .mockResolvedValueOnce({ data: { id: 'fabric-001', name: 'Velours Bleu' }, error: null })

    const fakeBuffer = Buffer.from('fake-jpeg-data')
    mockGenerate.mockResolvedValueOnce({ imageBuffer: fakeBuffer })
    mockAddWatermark.mockResolvedValueOnce(fakeBuffer)

    const response = await POST(makeRequest(fd) as never)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')

    // Verifie que generate utilise le nom du tissu
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ fabricName: 'Velours Bleu' })
    )
  })

  it('retourne 422 pour erreur HEIC non supportee', async () => {
    const image = createFakeImage(1024, 'image/heic', 'photo.heic')
    const fd = createFormData({ image, model_id: 'model-001' })

    // Mock model lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 'model-001', name: 'Milano' }, error: null })

    // Mock IA generate qui echoue avec erreur HEIC
    mockGenerate.mockRejectedValueOnce(new Error('unsupported image format: heic compression format'))

    const response = await POST(makeRequest(fd) as never)
    const json = await response.json()
    expect(response.status).toBe(422)
    expect(json.error).toContain('HEIC')
    expect(json.error).toContain('JPEG')
  })

  // -----------------------------------------------------------------------
  // Tests Phase 13 : rate-limit, IMAGE_SAFETY, timeout
  // -----------------------------------------------------------------------

  it('retourne 429 apres 5 appels rate-limit (phase 13)', async () => {
    // IP unique pour isoler ce test du rate-limit des autres
    const testIp = '10.0.0.99'

    for (let i = 0; i < 6; i++) {
      const image = createFakeImage(1024)
      const fd = createFormData({ image, model_id: `model-rl-${i}` })

      // Mock model lookup pour chaque appel
      mockSingle.mockResolvedValueOnce({ data: { id: `model-rl-${i}`, name: 'Milano' }, error: null })

      // Mock IA generate + watermark pour les 5 premiers
      if (i < 5) {
        const fakeBuffer = Buffer.from('fake-jpeg')
        mockGenerate.mockResolvedValueOnce({ imageBuffer: fakeBuffer })
        mockAddWatermark.mockResolvedValueOnce(fakeBuffer)
      }

      const response = await POST(makeRequest(fd, testIp) as never)

      if (i === 5) {
        // 6eme appel : rate-limited
        const json = await response.json()
        expect(response.status).toBe(429)
        expect(json.error).toContain('Trop de demandes')
        expect(response.headers.get('Retry-After')).toBeTruthy()
      }
    }
  })

  it('retourne 422 sur ImageSafetyError (phase 13)', async () => {
    const image = createFakeImage(1024)
    const fd = createFormData({ image, model_id: 'model-safety' })

    // Mock model lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 'model-safety', name: 'Milano' }, error: null })

    // Mock IA generate qui throw ImageSafetyError
    mockGenerate.mockRejectedValueOnce(new MockImageSafetyError())

    // IP unique pour eviter la pollution du rate-limit
    const response = await POST(makeRequest(fd, '10.0.1.1') as never)
    const json = await response.json()
    expect(response.status).toBe(422)
    expect(json.error).toContain('contenu non autorise')
  })

  it('retourne 504 sur timeout AbortError (phase 13)', async () => {
    const image = createFakeImage(1024)
    const fd = createFormData({ image, model_id: 'model-timeout' })

    // Mock model lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 'model-timeout', name: 'Milano' }, error: null })

    // Mock IA generate qui throw AbortError
    const abortErr = new Error('The operation was aborted')
    abortErr.name = 'AbortError'
    mockGenerate.mockRejectedValueOnce(abortErr)

    // IP unique pour eviter la pollution du rate-limit
    const response = await POST(makeRequest(fd, '10.0.1.2') as never)
    const json = await response.json()
    expect(response.status).toBe(504)
    expect(json.error).toContain('trop de temps')
  })
})
