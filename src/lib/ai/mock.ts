/**
 * Service IA mock — génère des visuels placeholder avec sharp.
 * Produit de vrais JPEG avec fond coloré et texte superposé.
 * Utilisé quand NANO_BANANA_API_KEY n'est pas configurée.
 */
import sharp from 'sharp'
import type { IAService, GenerateRequest, GenerateResult } from './types'

/**
 * Dérive une teinte HSL déterministe à partir d'une chaîne,
 * pour que chaque nom de tissu produise une couleur de fond distincte.
 */
function hashToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

export class MockIAService implements IAService {
  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const { modelName, fabricName, viewType } = request
    const width = 800
    const height = 600

    const hue = hashToHue(fabricName)
    const bgColor = `hsl(${hue}, 40%, 70%)`

    // SVG superposé avec les infos du modèle
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}" />
        <rect x="40" y="200" width="720" height="200" rx="16" fill="rgba(0,0,0,0.45)" />
        <text x="400" y="260" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">
          ${escapeXml(modelName)}
        </text>
        <text x="400" y="310" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="22" fill="white">
          ${escapeXml(fabricName)}
        </text>
        <text x="400" y="355" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">
          Angle : ${escapeXml(viewType)}
        </text>
        <text x="400" y="580" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.5)">
          MOCK — Aperçu généré automatiquement
        </text>
      </svg>
    `

    const imageBuffer = await sharp(Buffer.from(svg))
      .jpeg({ quality: 85 })
      .toBuffer()

    return {
      imageBuffer,
      mimeType: 'image/jpeg',
      extension: 'jpg',
    }
  }

  async addWatermark(imageBuffer: Buffer, text = 'MÖBEL UNIQUE — Aperçu'): Promise<Buffer> {
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

/** Échappe le texte pour l'intégrer dans du SVG */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
