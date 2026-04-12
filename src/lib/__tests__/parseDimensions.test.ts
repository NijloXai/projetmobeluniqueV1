import { describe, it, expect } from 'vitest'
import { parseDimensions } from '../utils'

describe('parseDimensions', () => {
  it('parse le format standard "L 280 × P 180 × H 85 cm"', () => {
    const result = parseDimensions('L 280 × P 180 × H 85 cm')
    expect(result).toEqual({ width: 280, depth: 180 })
  })

  it('parse sans espaces "L280×P180×H85cm"', () => {
    const result = parseDimensions('L280×P180×H85cm')
    expect(result).toEqual({ width: 280, depth: 180 })
  })

  it('parse avec x minuscule "L 300 x P 200 x H 90 cm"', () => {
    const result = parseDimensions('L 300 x P 200 x H 90 cm')
    expect(result).toEqual({ width: 300, depth: 200 })
  })

  it('retourne null pour une chaine vide', () => {
    expect(parseDimensions('')).toBeNull()
  })

  it('retourne null pour un format inconnu', () => {
    expect(parseDimensions('280x180x85')).toBeNull()
  })

  it('retourne null pour des dimensions negatives', () => {
    expect(parseDimensions('L -10 × P 180 × H 85 cm')).toBeNull()
  })

  it('retourne null pour des dimensions zero', () => {
    expect(parseDimensions('L 0 × P 180 × H 85 cm')).toBeNull()
  })
})
