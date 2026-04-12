/**
 * Generation de masques d'inpainting pour le placement guide.
 * Produit un PNG noir/blanc : blanc = zone de placement, noir = preserver.
 */
import sharp from 'sharp'

export interface PlacementRect {
  x: number      // pourcentage 0-100
  y: number
  width: number
  height: number
}

/**
 * Genere un masque PNG noir/blanc pour l'inpainting Gemini.
 * Le rectangle blanc est dilate de 10px pour un blend naturel.
 */
export async function generatePlacementMask(
  imageWidth: number,
  imageHeight: number,
  rect: PlacementRect
): Promise<Buffer> {
  const dilate = 10

  // Convertir pourcentages en pixels avec dilatation
  const px = {
    x: Math.max(0, Math.round((rect.x / 100) * imageWidth) - dilate),
    y: Math.max(0, Math.round((rect.y / 100) * imageHeight) - dilate),
    w: Math.min(imageWidth, Math.round((rect.width / 100) * imageWidth) + dilate * 2),
    h: Math.min(imageHeight, Math.round((rect.height / 100) * imageHeight) + dilate * 2),
  }

  // Clamp pour ne pas deborder
  if (px.x + px.w > imageWidth) px.w = imageWidth - px.x
  if (px.y + px.h > imageHeight) px.h = imageHeight - px.y

  const svg = `
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="black" />
      <rect x="${px.x}" y="${px.y}" width="${px.w}" height="${px.h}" fill="white" />
    </svg>
  `

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer()
}
