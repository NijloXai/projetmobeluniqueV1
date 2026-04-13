import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { generatePlacementMask, type PlacementRect } from '../masking'

describe('generatePlacementMask', () => {
  it('retourne un buffer PNG valide', async () => {
    const rect: PlacementRect = { x: 25, y: 40, width: 50, height: 30 }
    const buffer = await generatePlacementMask(1024, 768, rect)

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)

    // Verifier que c'est un PNG valide via Sharp
    const meta = await sharp(buffer).metadata()
    expect(meta.format).toBe('png')
    expect(meta.width).toBe(1024)
    expect(meta.height).toBe(768)
  })

  it('produit une image avec du noir et du blanc', async () => {
    const rect: PlacementRect = { x: 25, y: 25, width: 50, height: 50 }
    const buffer = await generatePlacementMask(100, 100, rect)

    // Extraire les stats de l'image (min/max pixels)
    const stats = await sharp(buffer).stats()
    const channel = stats.channels[0] // Premier canal (grayscale)

    // L'image doit avoir du noir (min ~0) et du blanc (max ~255)
    expect(channel.min).toBeLessThanOrEqual(10)
    expect(channel.max).toBeGreaterThanOrEqual(245)
  })

  it('respecte les dimensions de sortie', async () => {
    const rect: PlacementRect = { x: 10, y: 10, width: 80, height: 80 }
    const buffer = await generatePlacementMask(512, 384, rect)

    const meta = await sharp(buffer).metadata()
    expect(meta.width).toBe(512)
    expect(meta.height).toBe(384)
  })

  it('gere les coordonnees aux bords (x=0, y=0)', async () => {
    const rect: PlacementRect = { x: 0, y: 0, width: 50, height: 50 }
    const buffer = await generatePlacementMask(200, 200, rect)

    expect(buffer).toBeInstanceOf(Buffer)
    const meta = await sharp(buffer).metadata()
    expect(meta.width).toBe(200)
  })

  it('gere les coordonnees maximales (x+width~100)', async () => {
    const rect: PlacementRect = { x: 50, y: 50, width: 50, height: 50 }
    const buffer = await generatePlacementMask(200, 200, rect)

    expect(buffer).toBeInstanceOf(Buffer)
    const meta = await sharp(buffer).metadata()
    expect(meta.width).toBe(200)
  })
})
