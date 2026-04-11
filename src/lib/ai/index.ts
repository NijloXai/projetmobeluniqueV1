/**
 * Factory du service IA.
 * Retourne le provider approprié selon la configuration d'environnement.
 *
 * - Pas de NANO_BANANA_API_KEY → MockIAService (placeholders sharp)
 * - NANO_BANANA_API_KEY présente → NanoBananaService (stub — erreur tant que non intégré)
 */
import type { IAService } from './types'
import { MockIAService } from './mock'
import { NanoBananaService } from './nano-banana'

export function getIAService(): IAService {
  if (process.env.NANO_BANANA_API_KEY) {
    console.info('[IA] Using NanoBanana provider')
    return new NanoBananaService()
  }

  console.info('[IA] Using mock provider')
  return new MockIAService()
}

// Ré-export des types pour les consommateurs
export type { IAService, GenerateRequest, GenerateResult } from './types'
export { buildBackOfficePrompt, buildSimulatePrompt } from './prompts'
