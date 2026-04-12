/**
 * Templates de prompts pour la generation IA.
 *
 * Principes appliques :
 * - Anglais (performance Gemini optimale pour l'image generation)
 * - Roles d'images explicites ("first image", "second image")
 * - Vocabulaire photographique (objectif, eclairage, profondeur de champ)
 * - Micro-details texture et ombres de contact
 * - Pas de negative prompts (non supporte par Gemini — description positive)
 */

// ---------------------------------------------------------------------------
// Back-office : generation d'un visuel admin (canape + tissu)
// ---------------------------------------------------------------------------

/**
 * Prompt back-office — avec swatch tissu en 2e image de reference.
 * Utilise dans POST /api/admin/generate et POST /api/admin/generate-all.
 */
export function buildBackOfficePrompt(
  modelName: string,
  fabricName: string,
  viewType: string
): string {
  return [
    `The first image is a photograph of the "${modelName}" sofa, viewed from the ${viewType} angle.`,
    `The second image is a fabric swatch of "${fabricName}".`,
    ``,
    `Generate a photorealistic studio photograph of this exact sofa reupholstered in the fabric shown in the swatch.`,
    `The fabric texture, color, and weave pattern from the swatch must wrap naturally around all upholstered surfaces,`,
    `following the contours, seams, and cushion shapes of the sofa.`,
    ``,
    `Requirements:`,
    `- Maintain the exact sofa silhouette, proportions, legs, and structural details from the first image.`,
    `- Preserve the same camera angle and framing as the original photograph.`,
    `- Place the sofa in a neutral white cyclorama studio with soft three-point lighting`,
    `  (key light from upper left, fill light from right, subtle backlight for edge definition).`,
    `- Generate realistic contact shadows beneath the sofa where it meets the floor.`,
    `- The fabric should show natural micro-details: subtle wrinkles in seat cushions,`,
    `  slight tension on curved armrests, and visible texture grain consistent with the swatch.`,
    `- Professional product photography quality, sharp focus throughout, clean artifact-free render.`,
  ].join('\n')
}

/**
 * Prompt back-office fallback — sans swatch (si swatch_url absent).
 * Moins precis, s'appuie uniquement sur le nom du tissu.
 */
export function buildBackOfficePromptNoSwatch(
  modelName: string,
  fabricName: string,
  viewType: string
): string {
  return [
    `The provided image is a photograph of the "${modelName}" sofa, viewed from the ${viewType} angle.`,
    ``,
    `Generate a photorealistic studio photograph of this exact sofa reupholstered in "${fabricName}" fabric.`,
    `Maintain the exact sofa silhouette, proportions, and structural details.`,
    `Preserve the same camera angle and framing as the original photograph.`,
    `Place the sofa in a neutral white studio with soft three-point lighting.`,
    `Generate realistic contact shadows beneath the sofa.`,
    `Professional product photography quality, sharp focus, clean render.`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Simulation publique : placement dans une photo salon
// ---------------------------------------------------------------------------

/**
 * Prompt simulation — place le canape dans la photo du salon de l'utilisateur.
 * Utilise dans POST /api/simulate.
 */
export function buildSimulatePrompt(
  modelName: string,
  fabricName: string,
  dimensions?: string
): string {
  const dimensionLine = dimensions
    ? `The sofa measures ${dimensions}. Use standard architectural elements in the room as scale references (doors are approximately 200 cm tall, electrical outlets are approximately 30 cm from the floor).`
    : `Use standard architectural elements visible in the room as scale references (doors are approximately 200 cm tall, electrical outlets are approximately 30 cm from the floor) to determine the correct sofa size.`

  return [
    `The provided image is a photograph of a room taken by a customer.`,
    ``,
    `Place the "${modelName}" sofa, upholstered in "${fabricName}" fabric, into this room photograph.`,
    ``,
    `Scale and positioning:`,
    `- ${dimensionLine}`,
    `- Position the sofa on the visible floor area, in a natural location where a sofa would typically be placed.`,
    `- The sofa must rest firmly on the floor surface with realistic contact shadows where the legs meet the floor.`,
    `- The sofa must not overlap with any existing furniture or walls.`,
    ``,
    `Lighting and integration:`,
    `- Analyze the room's existing light sources, shadow directions, and color temperature before placing the sofa.`,
    `- Match the sofa's illumination to the room's ambient lighting (warm tungsten, cool daylight, or mixed).`,
    `- Generate shadows beneath and behind the sofa consistent with the existing shadow direction and softness in the room.`,
    `- Ensure specular highlights on the fabric are consistent with the room's light source position.`,
    ``,
    `Preservation:`,
    `- Preserve all architectural elements (doors, windows, walls, floor) exactly as they appear in the original photograph.`,
    `- Only add the sofa — do not modify, remove, or alter any existing elements in the room.`,
    `- The sofa should look naturally integrated, as if it was photographed in situ.`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Simulation avec masque d'inpainting
// ---------------------------------------------------------------------------

/**
 * Prompt simulation avec masque — guide Gemini via zone blanche + coordonnees.
 * Utilise dans POST /api/simulate quand l'utilisateur a place le rectangle.
 */
export function buildSimulateWithMaskPrompt(
  modelName: string,
  fabricName: string,
  rect: { x: number; y: number; width: number; height: number },
  dimensions?: string
): string {
  const dimLine = dimensions ? `The sofa measures ${dimensions}.` : ''

  return [
    `The first image is a photograph of a customer's room.`,
    `The second image is a binary mask: the white region indicates exactly where the sofa must be placed.`,
    `The black region must be preserved unchanged.`,
    ``,
    `Place the "${modelName}" sofa, upholstered in "${fabricName}" fabric, precisely within the white masked area.`,
    `${dimLine}`,
    `The sofa occupies approximately ${Math.round(rect.x)}%-${Math.round(rect.x + rect.width)}% horizontally`,
    `and ${Math.round(rect.y)}%-${Math.round(rect.y + rect.height)}% vertically in the image.`,
    ``,
    `Scale and positioning:`,
    `- The sofa must rest firmly on the floor with realistic contact shadows where the legs meet the floor.`,
    `- The sofa must not overlap with any existing furniture or walls.`,
    `- Respect the room's perspective — the sofa's vanishing lines must match the room's.`,
    ``,
    `Lighting and integration:`,
    `- Analyze the room's existing light sources, shadow directions, and color temperature.`,
    `- Match the sofa's illumination to the room's ambient lighting.`,
    `- Generate shadows beneath and behind the sofa consistent with the existing shadow direction.`,
    ``,
    `Preservation:`,
    `- Preserve all architectural elements exactly as in the original photograph.`,
    `- Only add the sofa — do not modify or remove any existing elements.`,
  ].join('\n')
}
