/**
 * Tests Phase 13 : NanoBananaService
 *
 * Couvre : isRetryableError, escapeXml, ImageSafetyError,
 * constructeur, generate() (OK, IMAGE_SAFETY, retry, echecs),
 * resolveImagePart (data URI, URL fetch), addWatermark.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock @google/genai
// ---------------------------------------------------------------------------

const mockGenerateContent = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}))

// Mock sharp — retourne un chainable
const mockJpeg = vi.fn(() => ({ toBuffer: vi.fn().mockResolvedValue(Buffer.from('jpeg-data')) }))
const mockComposite = vi.fn(() => ({ toBuffer: vi.fn().mockResolvedValue(Buffer.from('watermarked')) }))
const mockMetadata = vi.fn().mockResolvedValue({ width: 800, height: 600 })
const mockSharp = vi.fn(() => ({
  jpeg: mockJpeg,
  composite: mockComposite,
  metadata: mockMetadata,
}))

vi.mock('sharp', () => ({ default: mockSharp }))

// Mock prompts
vi.mock('@/lib/ai/prompts', () => ({
  buildBackOfficePrompt: vi.fn(() => 'prompt-backoffice'),
  buildSimulatePrompt: vi.fn(() => 'prompt-simulate'),
}))

// ---------------------------------------------------------------------------
// Import apres mocks
// ---------------------------------------------------------------------------

const {
  NanoBananaService,
  ImageSafetyError,
} = await import('@/lib/ai/nano-banana')

// Acces aux fonctions module-level via le module (non exportees, testees indirectement)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ImageSafetyError', () => {
  it('a le nom et message corrects', () => {
    const err = new ImageSafetyError()
    expect(err.name).toBe('ImageSafetyError')
    expect(err.message).toContain('contenu non autorise')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('NanoBananaService', () => {
  const originalEnv = process.env.NANO_BANANA_API_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NANO_BANANA_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NANO_BANANA_API_KEY
    } else {
      process.env.NANO_BANANA_API_KEY = originalEnv
    }
  })

  // -------------------------------------------------------------------------
  // Constructeur
  // -------------------------------------------------------------------------

  describe('constructor', () => {
    it('throw si NANO_BANANA_API_KEY absente', () => {
      delete process.env.NANO_BANANA_API_KEY
      expect(() => new NanoBananaService()).toThrow('NANO_BANANA_API_KEY')
    })

    it('initialise sans erreur si cle presente', () => {
      expect(() => new NanoBananaService()).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // generate()
  // -------------------------------------------------------------------------

  describe('generate()', () => {
    const baseRequest = {
      modelName: 'Milano',
      fabricName: 'Velours Bleu',
      viewType: 'front',
      sourceImageUrl: 'https://example.com/image.jpg',
    }

    function mockGeminiOK() {
      // Mock fetch pour resolveImagePart (URL path)
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }))

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          finishReason: 'STOP',
          content: {
            parts: [{
              inlineData: {
                data: Buffer.from('fake-png-data').toString('base64'),
                mimeType: 'image/png',
              },
            }],
          },
        }],
      })
    }

    it('retourne un JPEG sur reponse Gemini OK', async () => {
      mockGeminiOK()
      const service = new NanoBananaService()
      const result = await service.generate(baseRequest)

      expect(result.mimeType).toBe('image/jpeg')
      expect(result.extension).toBe('jpg')
      expect(result.imageBuffer).toBeDefined()
      expect(mockGenerateContent).toHaveBeenCalledTimes(1)
    })

    it('utilise buildSimulatePrompt pour viewType simulation', async () => {
      mockGeminiOK()
      const { buildSimulatePrompt } = await import('@/lib/ai/prompts')
      const service = new NanoBananaService()
      await service.generate({ ...baseRequest, viewType: 'simulation' })

      expect(buildSimulatePrompt).toHaveBeenCalledWith('Milano', 'Velours Bleu')
    })

    it('throw ImageSafetyError sur finishReason IMAGE_SAFETY', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }))

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          finishReason: 'IMAGE_SAFETY',
          content: { parts: [] },
        }],
      })

      const service = new NanoBananaService()
      await expect(service.generate(baseRequest)).rejects.toThrow(ImageSafetyError)
    })

    it('retry sur erreur 429 puis reussit', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }))

      // Premier appel : erreur 429, deuxieme : OK
      mockGenerateContent
        .mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'))
        .mockResolvedValueOnce({
          candidates: [{
            finishReason: 'STOP',
            content: {
              parts: [{
                inlineData: {
                  data: Buffer.from('ok').toString('base64'),
                  mimeType: 'image/png',
                },
              }],
            },
          }],
        })

      const service = new NanoBananaService()
      const result = await service.generate(baseRequest)

      expect(result.mimeType).toBe('image/jpeg')
      expect(mockGenerateContent).toHaveBeenCalledTimes(2)
    })

    it('throw apres 3 echecs consecutifs retryables', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }))

      mockGenerateContent.mockRejectedValue(new Error('503 Service Unavailable'))

      const service = new NanoBananaService()
      await expect(service.generate(baseRequest)).rejects.toThrow('503')
      expect(mockGenerateContent).toHaveBeenCalledTimes(3)
    })

    it('throw immediatement sur erreur non-retryable (404)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }))

      mockGenerateContent.mockRejectedValueOnce(new Error('404 Not Found'))

      const service = new NanoBananaService()
      await expect(service.generate(baseRequest)).rejects.toThrow('404')
      expect(mockGenerateContent).toHaveBeenCalledTimes(1)
    })

    it('throw sur cle API invalide avec message masque', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }))

      mockGenerateContent.mockRejectedValueOnce(new Error('401 UNAUTHENTICATED'))

      const service = new NanoBananaService()
      await expect(service.generate(baseRequest)).rejects.toThrow('Configuration IA invalide')
    })
  })

  // -------------------------------------------------------------------------
  // resolveImagePart() — teste indirectement via generate()
  // -------------------------------------------------------------------------

  describe('resolveImagePart (via generate)', () => {
    it('split data URI correctement', async () => {
      const dataUri = 'data:image/jpeg;base64,dGVzdA=='
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          finishReason: 'STOP',
          content: {
            parts: [{
              inlineData: {
                data: Buffer.from('ok').toString('base64'),
                mimeType: 'image/png',
              },
            }],
          },
        }],
      })

      const service = new NanoBananaService()
      await service.generate({
        modelName: 'Test',
        fabricName: 'Tissu',
        viewType: 'front',
        sourceImageUrl: dataUri,
      })

      // Verify generate was called (data URI path, no fetch)
      expect(mockGenerateContent).toHaveBeenCalledTimes(1)
    })

    it('throw sur data URI malformee (sans virgule)', async () => {
      const badUri = 'data:image/jpegbase64dGVzdA=='

      const service = new NanoBananaService()
      await expect(
        service.generate({
          modelName: 'Test',
          fabricName: 'Tissu',
          viewType: 'front',
          sourceImageUrl: badUri,
        })
      ).rejects.toThrow('virgule')
    })

    it('throw si fetch URL echoue', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }))

      const service = new NanoBananaService()
      await expect(
        service.generate({
          modelName: 'Test',
          fabricName: 'Tissu',
          viewType: 'front',
          sourceImageUrl: 'https://example.com/missing.jpg',
        })
      ).rejects.toThrow('404')
    })
  })

  // -------------------------------------------------------------------------
  // addWatermark()
  // -------------------------------------------------------------------------

  describe('addWatermark()', () => {
    it('retourne un buffer avec watermark', async () => {
      const service = new NanoBananaService()
      const result = await service.addWatermark(Buffer.from('image'))
      expect(result).toBeInstanceOf(Buffer)
      expect(mockSharp).toHaveBeenCalled()
      expect(mockComposite).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // timeout (D-07)
  // -------------------------------------------------------------------------

  describe('timeout (D-07)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('produit une erreur apres 3 retries sur AbortError (timeout 30s)', async () => {
      // Mock fetch pour resolveImagePart (URL path)
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }))

      // AbortError est retryable dans isRetryableError() — 3 echecs attendus
      const abortErr = new Error('The operation was aborted')
      abortErr.name = 'AbortError'
      mockGenerateContent.mockRejectedValue(abortErr)

      const service = new NanoBananaService()
      const generatePromise = service.generate({
        modelName: 'Milano',
        fabricName: 'Velours Bleu',
        viewType: 'front',
        sourceImageUrl: 'https://example.com/image.jpg',
      })
      // Attacher un handler vide immediatement pour eviter l'unhandled rejection
      // pendant l'avance des timers
      generatePromise.catch(() => undefined)

      // Avancer tous les timers pour bypasser sleep() dans le retry loop
      await vi.runAllTimersAsync()

      await expect(generatePromise).rejects.toThrow()
      expect(mockGenerateContent).toHaveBeenCalledTimes(3)
    })
  })
})
