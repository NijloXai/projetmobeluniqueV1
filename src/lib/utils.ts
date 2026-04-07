import type { ModelImage } from '@/types/database'

/**
 * Retourne l'URL de l'image principale (3/4 prioritaire, sinon première)
 */
export function getPrimaryImage(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const image34 = model_images.find((img) => img.view_type === '3/4')
  if (image34) return image34.image_url
  return model_images[0].image_url
}

/**
 * Retourne l'ID de l'image principale (3/4 prioritaire, sinon première)
 */
export function getPrimaryImageId(model_images: ModelImage[]): string | null {
  if (model_images.length === 0) return null
  const image34 = model_images.find((img) => img.view_type === '3/4')
  if (image34) return image34.id
  return model_images[0]?.id ?? null
}

/**
 * Formate un prix avec préfixe "a partir de" (ex: "a partir de 1 290 €")
 */
export function formatStartingPrice(price: number): string {
  return 'a partir de ' + new Intl.NumberFormat('fr-FR').format(price) + ' \u20ac'
}

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

/**
 * Extrait le chemin du fichier depuis une URL Supabase Storage.
 * Ex: "https://xxx.supabase.co/storage/v1/object/public/fabric-swatches/velours-bleu-swatch.jpg"
 * → "velours-bleu-swatch.jpg"
 */
export function extractStoragePath(url: string): string | null {
  try {
    const u = new URL(url)
    // Pattern: /storage/v1/object/public/{bucket}/{path}
    // or: /storage/v1/object/sign/{bucket}/{path}?token=...
    const match = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}
