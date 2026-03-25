/**
 * Service IA Nano Banana 2 — implémentation stub.
 * Lance des erreurs descriptives tant que l'intégration réelle n'est pas faite.
 */
import type { IAService, GenerateRequest, GenerateResult } from './types'

const NOT_CONFIGURED_MSG =
  'Service Nano Banana 2 non configuré. Contactez l\'administrateur.'

export class NanoBananaService implements IAService {
  async generate(_request: GenerateRequest): Promise<GenerateResult> {
    throw new Error(NOT_CONFIGURED_MSG)
  }

  async addWatermark(_imageBuffer: Buffer, _text?: string): Promise<Buffer> {
    throw new Error(NOT_CONFIGURED_MSG)
  }
}
