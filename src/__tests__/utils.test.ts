/**
 * Tests Phase 15 : fonctions utilitaires pures (D-03, D-04)
 *
 * Couvre : slugify (accents FR/DE, chiffres, tirets, vide),
 * calculatePrice (standard, premium, zero), extractStoragePath
 * (URL publique, signee, sous-dossier, malformee, non-URL).
 *
 * Aucun vi.mock() — fonctions pures, import direct.
 */

import { describe, it, expect } from 'vitest'
import { slugify, calculatePrice, extractStoragePath } from '@/lib/utils'

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('normalise les accents francais en slug ASCII', () => {
    expect(slugify('Véloürs Blëu')).toBe('velours-bleu')
  })

  it('normalise le trema allemand en slug ASCII', () => {
    expect(slugify('Möbel Unique')).toBe('mobel-unique')
  })

  it('conserve les chiffres dans le slug', () => {
    expect(slugify('Canapé Milano 3 Pl')).toBe('canape-milano-3-pl')
  })

  it('supprime les tirets en debut et fin de slug', () => {
    expect(slugify('  --test--  ')).toBe('test')
  })

  it('retourne une chaine vide pour une chaine vide', () => {
    expect(slugify('')).toBe('')
  })

  it('retourne le slug identique pour une chaine sans transformation necessaire', () => {
    expect(slugify('abc')).toBe('abc')
  })
})

// ---------------------------------------------------------------------------
// calculatePrice
// ---------------------------------------------------------------------------

describe('calculatePrice', () => {
  it('retourne le prix de base pour un tissu standard', () => {
    expect(calculatePrice(1000, false)).toBe(1000)
  })

  it('ajoute 80 euros pour un tissu premium', () => {
    expect(calculatePrice(1000, true)).toBe(1080)
  })

  it('retourne zero pour un prix zero standard', () => {
    expect(calculatePrice(0, false)).toBe(0)
  })

  it('retourne 80 euros pour un prix zero premium', () => {
    expect(calculatePrice(0, true)).toBe(80)
  })

  it('calcule le prix premium pour un prix typique du catalogue', () => {
    expect(calculatePrice(1200, true)).toBe(1280)
  })
})

// ---------------------------------------------------------------------------
// extractStoragePath
// ---------------------------------------------------------------------------

describe('extractStoragePath', () => {
  it('extrait le chemin depuis une URL publique Supabase Storage', () => {
    const url = 'https://xxx.supabase.co/storage/v1/object/public/fabric-swatches/velours-bleu.jpg'
    expect(extractStoragePath(url)).toBe('velours-bleu.jpg')
  })

  it('extrait le chemin depuis une URL signee Supabase Storage', () => {
    const url = 'https://xxx.supabase.co/storage/v1/object/sign/generated-visuals/img.jpg?token=abc'
    expect(extractStoragePath(url)).toBe('img.jpg')
  })

  it('extrait le chemin avec sous-dossier', () => {
    const url = 'https://xxx.supabase.co/storage/v1/object/public/model-photos/models/img.jpg'
    expect(extractStoragePath(url)).toBe('models/img.jpg')
  })

  it('retourne null pour une URL sans pattern storage Supabase', () => {
    expect(extractStoragePath('https://example.com/image.jpg')).toBeNull()
  })

  it('retourne null pour une chaine non-URL', () => {
    expect(extractStoragePath('not-a-url')).toBeNull()
  })
})
