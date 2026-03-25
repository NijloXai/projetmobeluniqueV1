/**
 * Templates de prompts pour la génération IA.
 * Fonctions configurables avec interpolation — pas de chaînes en dur.
 */

/**
 * Prompt pour la génération back-office (l'admin génère un visuel).
 * Utilisé dans POST /api/admin/generate et POST /api/admin/generate-all.
 */
export function buildBackOfficePrompt(
  modelName: string,
  fabricName: string,
  viewType: string
): string {
  return [
    `Generate a photorealistic image of the "${modelName}" sofa`,
    `upholstered in "${fabricName}" fabric,`,
    `viewed from the ${viewType} angle.`,
    `The sofa should be placed in a neutral studio environment`,
    `with soft lighting. Maintain accurate proportions and fabric texture.`,
  ].join(' ')
}

/**
 * Prompt pour la simulation publique (l'utilisateur upload une photo salon).
 * Utilisé dans la future fonctionnalité F3 simulation.
 */
export function buildSimulatePrompt(
  modelName: string,
  fabricName: string
): string {
  return [
    `Place the "${modelName}" sofa upholstered in "${fabricName}" fabric`,
    `into the provided room photograph.`,
    `Use the A4 sheet visible in the photo as a size reference.`,
    `Match the lighting and perspective of the room. The sofa should look`,
    `naturally integrated into the space.`,
  ].join(' ')
}
