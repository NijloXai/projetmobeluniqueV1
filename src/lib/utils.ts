/**
 * Génère un slug à partir d'un texte (ex: "Velours Bleu" → "velours-bleu")
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .replace(/[^a-z0-9]+/g, '-')    // remplace les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, '')         // supprime les tirets en début/fin
}

/**
 * Calcule le prix total avec le supplément premium
 */
export function calculatePrice(basePrice: number, isPremium: boolean): number {
  const PREMIUM_SUPPLEMENT = 80
  return isPremium ? basePrice + PREMIUM_SUPPLEMENT : basePrice
}

/**
 * Formate un prix en euros
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}
