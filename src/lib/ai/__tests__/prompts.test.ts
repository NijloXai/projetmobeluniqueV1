import { describe, it, expect } from 'vitest'
import {
  buildBackOfficePrompt,
  buildBackOfficePromptNoSwatch,
  buildSimulatePrompt,
  buildSimulateWithMaskPrompt,
} from '../prompts'

describe('buildBackOfficePrompt', () => {
  it('inclut le nom du modele, du tissu et le view type', () => {
    const result = buildBackOfficePrompt('Molde', 'Soro 21', '3/4')
    expect(result).toContain('Molde')
    expect(result).toContain('Soro 21')
    expect(result).toContain('3/4')
  })

  it('reference les deux images (first image, second image)', () => {
    const result = buildBackOfficePrompt('Yuki', 'Lars 07', 'face')
    expect(result).toContain('first image')
    expect(result).toContain('second image')
  })

  it('demande un environnement studio', () => {
    const result = buildBackOfficePrompt('Molde', 'Soro 21', 'profil')
    expect(result).toContain('studio')
    expect(result).toContain('lighting')
  })
})

describe('buildBackOfficePromptNoSwatch', () => {
  it('ne reference pas de deuxieme image', () => {
    const result = buildBackOfficePromptNoSwatch('Molde', 'Soro 21', 'face')
    expect(result).not.toContain('second image')
    expect(result).toContain('Molde')
    expect(result).toContain('Soro 21')
  })
})

describe('buildSimulatePrompt', () => {
  it('inclut les dimensions quand fournies', () => {
    const result = buildSimulatePrompt('Molde', 'Soro 21', 'L 280 × P 180 × H 85 cm')
    expect(result).toContain('L 280 × P 180 × H 85 cm')
  })

  it('utilise les references architecturales sans dimensions', () => {
    const result = buildSimulatePrompt('Molde', 'Soro 21')
    expect(result).toContain('200 cm')
    expect(result).toContain('30 cm')
  })

  it('demande la preservation des elements existants', () => {
    const result = buildSimulatePrompt('Molde', 'Soro 21')
    expect(result).toContain('Preserve')
    expect(result).toContain('do not modify')
  })
})

describe('buildSimulateWithMaskPrompt', () => {
  it('reference le masque binaire', () => {
    const rect = { x: 20, y: 40, width: 60, height: 35 }
    const result = buildSimulateWithMaskPrompt('Molde', 'Soro 21', rect)
    expect(result).toContain('binary mask')
    expect(result).toContain('white region')
    expect(result).toContain('black region')
  })

  it('inclut les coordonnees du rectangle en pourcentages', () => {
    const rect = { x: 20, y: 40, width: 60, height: 35 }
    const result = buildSimulateWithMaskPrompt('Molde', 'Soro 21', rect)
    expect(result).toContain('20%')
    expect(result).toContain('80%') // x + width = 20 + 60
    expect(result).toContain('40%')
    expect(result).toContain('75%') // y + height = 40 + 35
  })

  it('inclut les dimensions quand fournies', () => {
    const rect = { x: 10, y: 50, width: 50, height: 30 }
    const result = buildSimulateWithMaskPrompt('Molde', 'Soro 21', rect, 'L 280 × P 180 × H 85 cm')
    expect(result).toContain('L 280 × P 180 × H 85 cm')
  })

  it('fonctionne sans dimensions', () => {
    const rect = { x: 10, y: 50, width: 50, height: 30 }
    const result = buildSimulateWithMaskPrompt('Molde', 'Soro 21', rect)
    expect(result).toContain('Molde')
    expect(result).not.toContain('undefined')
  })

  it('demande la preservation des elements', () => {
    const rect = { x: 10, y: 50, width: 50, height: 30 }
    const result = buildSimulateWithMaskPrompt('Molde', 'Soro 21', rect)
    expect(result).toContain('Preserve')
    expect(result).toContain('do not modify')
  })
})
