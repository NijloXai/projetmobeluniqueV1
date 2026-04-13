/**
 * Couche d'abstraction service IA — types & interfaces.
 * Permet de basculer entre le mock (sharp) et le vrai provider (Nano Banana 2).
 */

export interface GenerateRequest {
  modelName: string
  fabricName: string
  viewType: string
  /** URL de l'image source model_image (la photo d'angle) */
  sourceImageUrl: string
  /** URL du swatch tissu (envoyé comme 2e image de référence pour Gemini) */
  fabricSwatchUrl?: string
  /** Dimensions du modèle, ex: "L 280 × P 180 × H 85 cm" */
  dimensions?: string
  /** Data URI du masque d'inpainting PNG (blanc = zone de placement) */
  maskDataUrl?: string
  /** Coordonnees du rectangle de placement (pourcentages 0-100) */
  placementRect?: { x: number; y: number; width: number; height: number }
}

export interface GenerateResult {
  imageBuffer: Buffer
  mimeType: 'image/jpeg' | 'image/png'
  extension: 'jpg' | 'png'
}

export interface IAService {
  /** Génère un visuel d'un modèle dans un tissu donné pour un angle donné */
  generate(request: GenerateRequest): Promise<GenerateResult>

  /** Ajoute un filigrane texte sur un buffer image */
  addWatermark(imageBuffer: Buffer, text?: string): Promise<Buffer>
}
