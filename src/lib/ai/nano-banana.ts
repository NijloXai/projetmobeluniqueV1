/**
 * Service IA Nano Banana 2 — implementation Gemini via @google/genai.
 * Remplace le stub par un appel reel a gemini-3.1-flash-image-preview.
 *
 * Features:
 * - generate() avec retry exponentiel (1s/2s/4s + jitter)
 * - Timeout 30s par tentative via AbortSignal.timeout()
 * - Gestion IMAGE_SAFETY → ImageSafetyError explicite
 * - Deux chemins d'image : URL fetch→base64 (admin) / data URI split (simulate)
 * - Conversion PNG→JPEG via Sharp
 * - addWatermark() identique au pattern MockIAService
 */
import { GoogleGenAI, type Part } from '@google/genai'
import sharp from 'sharp'
import type { IAService, GenerateRequest, GenerateResult } from './types'
import { buildBackOfficePrompt, buildSimulatePrompt } from './prompts'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const MODEL = 'gemini-3.1-flash-image-preview'
const TIMEOUT_MS = 30_000
const MAX_RETRIES = 3
const BASE_DELAY_MS = 1_000

// ---------------------------------------------------------------------------
// Erreur specifique IMAGE_SAFETY
// ---------------------------------------------------------------------------

export class ImageSafetyError extends Error {
  constructor() {
    super(
      "Cette image n'a pas pu etre traitee (contenu non autorise). Essayez une autre photo."
    )
    this.name = 'ImageSafetyError'
  }
}

// ---------------------------------------------------------------------------
// Utilitaires module-level
// ---------------------------------------------------------------------------

function isRetryableError(err: Error): boolean {
  const msg = err.message
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    err.name === 'AbortError'
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ---------------------------------------------------------------------------
// NanoBananaService
// ---------------------------------------------------------------------------

export class NanoBananaService implements IAService {
  private readonly ai: GoogleGenAI

  constructor() {
    const apiKey = process.env.NANO_BANANA_API_KEY
    if (!apiKey) {
      throw new Error(
        'NANO_BANANA_API_KEY manquante -- service IA non configure.'
      )
    }
    this.ai = new GoogleGenAI({ apiKey })
    console.log(`[IA] NanoBananaService initialise (modele: ${MODEL})`)
  }

  // -------------------------------------------------------------------------
  // generate()
  // -------------------------------------------------------------------------

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const { modelName, fabricName, viewType, sourceImageUrl } = request

    // Determiner le prompt selon le type de vue
    const prompt =
      viewType === 'simulation'
        ? buildSimulatePrompt(modelName, fabricName)
        : buildBackOfficePrompt(modelName, fabricName, viewType)

    // Resoudre l'image source en part SDK
    const imagePart = await this.resolveImagePart(sourceImageUrl)

    let lastError: Error | undefined

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const startTime = Date.now()

        // AbortSignal.timeout() cree DANS chaque tentative
        const response = await this.ai.models.generateContent({
          model: MODEL,
          contents: [prompt, imagePart],
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
            abortSignal: AbortSignal.timeout(TIMEOUT_MS),
          },
        })

        const candidate = response.candidates?.[0]
        if (!candidate) {
          throw new Error('Aucune reponse du modele IA.')
        }

        // Verifier finishReason AVANT d'acceder aux parts (IA-03)
        if (candidate.finishReason !== 'STOP') {
          if (candidate.finishReason === 'IMAGE_SAFETY') {
            throw new ImageSafetyError()
          }
          throw new Error(
            `Generation refusee (${candidate.finishReason}).`
          )
        }

        // Extraire l'image depuis les parts
        const imgPart = candidate.content?.parts?.find(
          (p: Part) => p.inlineData?.data
        )
        if (!imgPart?.inlineData?.data) {
          throw new Error('Reponse Gemini sans donnees image.')
        }

        const rawBuffer = Buffer.from(imgPart.inlineData.data, 'base64')

        // Validation stricte (D-03)
        if (rawBuffer.length === 0) {
          throw new Error('Buffer image vide retourne par le modele.')
        }

        // Conversion PNG vers JPEG (IA-05) — Gemini retourne PNG
        const imageBuffer = await sharp(rawBuffer)
          .jpeg({ quality: 85 })
          .toBuffer()

        const duration = Date.now() - startTime
        console.log(
          `[IA] generate OK -- model=${MODEL} attempt=${attempt + 1} duration=${duration}ms size=${imageBuffer.length}b viewType=${viewType}`
        )

        return { imageBuffer, mimeType: 'image/jpeg', extension: 'jpg' }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        // ImageSafetyError non-retryable — re-throw immediatement
        if (err instanceof ImageSafetyError) {
          throw err
        }

        // Cle API invalide — non-retryable (D-15)
        if (
          lastError.message.includes('API_KEY_INVALID') ||
          lastError.message.includes('401') ||
          lastError.message.includes('UNAUTHENTICATED')
        ) {
          throw new Error(
            'Configuration IA invalide. Verifiez la cle API.'
          )
        }

        const isLastAttempt = attempt === MAX_RETRIES - 1

        if (!isRetryableError(lastError) || isLastAttempt) {
          throw lastError
        }

        // Backoff exponentiel avec jitter (D-06) : 1s / 2s / 4s +-20%
        const delay =
          BASE_DELAY_MS * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4)
        console.warn(
          `[IA] Retry ${attempt + 1}/${MAX_RETRIES} dans ${Math.round(delay)}ms -- ${lastError.message}`
        )
        await sleep(delay)
      }
    }

    throw lastError!
  }

  // -------------------------------------------------------------------------
  // resolveImagePart() — deux chemins d'entree (IA-07)
  // -------------------------------------------------------------------------

  private async resolveImagePart(sourceImageUrl: string): Promise<Part> {
    if (sourceImageUrl.startsWith('data:')) {
      // Chemin simulate : data URI deja base64 — split sur la virgule
      const [meta, data] = sourceImageUrl.split(',')
      const mimeType = meta.split(':')[1].split(';')[0]
      return { inlineData: { mimeType, data } }
    }

    // Chemin admin : URL Supabase publique → fetch + base64
    const res = await fetch(sourceImageUrl)
    if (!res.ok) {
      throw new Error(
        `Impossible de recuperer l'image source (${res.status}).`
      )
    }
    const buffer = await res.arrayBuffer()
    const data = Buffer.from(buffer).toString('base64')
    const mimeType = res.headers.get('content-type') || 'image/jpeg'
    return { inlineData: { mimeType, data } }
  }

  // -------------------------------------------------------------------------
  // addWatermark() — pattern identique MockIAService
  // -------------------------------------------------------------------------

  async addWatermark(
    imageBuffer: Buffer,
    text = 'MOBEL UNIQUE -- Apercu'
  ): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 800
    const height = metadata.height || 600

    const watermarkSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text
          x="50%" y="50%"
          text-anchor="middle" dominant-baseline="middle"
          font-family="Arial, sans-serif" font-size="36" font-weight="bold"
          fill="rgba(255,255,255,0.35)"
          transform="rotate(-30, ${width / 2}, ${height / 2})"
        >
          ${escapeXml(text)}
        </text>
      </svg>
    `

    return sharp(imageBuffer)
      .composite([{ input: Buffer.from(watermarkSvg), gravity: 'centre' }])
      .toBuffer()
  }
}
