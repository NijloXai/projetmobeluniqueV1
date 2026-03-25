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
