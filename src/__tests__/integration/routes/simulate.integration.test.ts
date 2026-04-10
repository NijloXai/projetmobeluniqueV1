import { testApiHandler } from 'next-test-api-route-handler' // PREMIER IMPORT OBLIGATOIRE
import * as simulateRoute from '@/app/api/simulate/route'
import { updateSession } from '@/lib/supabase/middleware'
import { seedAdminUser, seedTestData } from '../helpers/seed'
import { describe, it, expect, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'

// ID de test (seed)
const MODEL_ID = 'b0000000-0000-0000-0000-000000000001' // Milano Test

/**
 * Crée un mini fichier JPEG 1x1 pixel (données binaires minimales valides).
 * Le mock Sharp accepte n'importe quel buffer — pas besoin d'un JPEG parfait.
 */
function createTestJpegBlob(): Blob {
  // Séquence binaire d'un JPEG 1x1 pixel valide (minimale)
  const jpegBytes = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
    0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
    0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
    0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
    0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
    0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
    0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3f, 0x00, 0xfb, 0x26, 0xa0, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x3f, 0xff, 0xd9,
  ])
  return new Blob([jpegBytes], { type: 'image/jpeg' })
}

beforeAll(async () => {
  await seedAdminUser()
  await seedTestData()
}, 30000)

// ─────────────────────────────────────────────────────
// POST /api/simulate
// NOTE: NANO_BANANA_API_KEY absent de .env.test.local → mock Sharp utilisé
// Pitfall 6: rate-limit en mémoire → utiliser x-forwarded-for différents pour isoler les tests
// ─────────────────────────────────────────────────────

describe('POST /api/simulate', () => {
  it('retourne un JPEG binaire avec le mock provider', async () => {
    const blob = createTestJpegBlob()
    const formData = new FormData()
    formData.append('image', blob, 'salon-test.jpg')
    formData.append('model_id', MODEL_ID)

    await testApiHandler({
      appHandler: simulateRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            // IP unique pour éviter le rate-limit des autres tests
            'x-forwarded-for': '10.0.0.1',
          },
          body: formData,
        })
        expect(res.status).toBe(200)
        const contentType = res.headers.get('Content-Type') ?? ''
        expect(contentType).toContain('image/jpeg')
        const buffer = Buffer.from(await res.arrayBuffer())
        expect(buffer.length).toBeGreaterThan(0)
      },
    })
  })

  it("retourne 400 sans image", async () => {
    const formData = new FormData()
    formData.append('model_id', MODEL_ID)
    // Pas de fichier image

    await testApiHandler({
      appHandler: simulateRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'x-forwarded-for': '10.0.0.3' },
          body: formData,
        })
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })

  it('retourne 400 sans model_id', async () => {
    const blob = createTestJpegBlob()
    const formData = new FormData()
    formData.append('image', blob, 'salon-test.jpg')
    // Pas de model_id

    await testApiHandler({
      appHandler: simulateRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'x-forwarded-for': '10.0.0.4' },
          body: formData,
        })
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })

  it("retourne 404 pour un modèle inexistant", async () => {
    const blob = createTestJpegBlob()
    const formData = new FormData()
    formData.append('image', blob, 'salon-test.jpg')
    formData.append('model_id', 'b9999999-9999-9999-9999-999999999999')

    await testApiHandler({
      appHandler: simulateRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'x-forwarded-for': '10.0.0.2' },
          body: formData,
        })
        expect(res.status).toBe(404)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })
})

// ─────────────────────────────────────────────────────
// Rate-limit POST /api/simulate (T-15.1-10, Pitfall 6)
// ─────────────────────────────────────────────────────

describe('Rate-limit /api/simulate (Pitfall 6)', () => {
  it('retourne 429 après 5 appels rapides depuis la même IP', async () => {
    // IP dédiée au test rate-limit pour éviter les interférences
    const rateLimitIp = '10.0.0.99'

    const makeRequest = () => {
      const blob = createTestJpegBlob()
      const formData = new FormData()
      formData.append('image', blob, 'salon-test.jpg')
      formData.append('model_id', MODEL_ID)
      return formData
    }

    await testApiHandler({
      appHandler: simulateRoute,
      async test({ fetch }) {
        const statuses: number[] = []

        // Faire 6 appels consécutifs depuis la même IP
        for (let i = 0; i < 6; i++) {
          const res = await fetch({
            method: 'POST',
            headers: { 'x-forwarded-for': rateLimitIp },
            body: makeRequest(),
          })
          statuses.push(res.status)
        }

        // Les 5 premiers doivent retourner 200 (valides)
        const first5 = statuses.slice(0, 5)
        expect(first5.every(s => s === 200)).toBe(true)

        // Le 6ème doit retourner 429 (rate-limit dépassé)
        expect(statuses[5]).toBe(429)
      },
    })
  }, 60000) // Timeout augmenté car 6 appels IA (mock rapide ~5ms chacun)
})

// ─────────────────────────────────────────────────────
// Middleware updateSession (D-09)
// Testé directement (pas via NTARH — les middlewares ne sont pas des routes API)
// ─────────────────────────────────────────────────────

describe('Middleware updateSession (D-09)', () => {
  it('ne redirige pas sur les routes publiques', async () => {
    const request = new NextRequest('http://localhost:3000/')
    const response = await updateSession(request)

    // Les routes publiques ne doivent pas être redirigées
    // updateSession retourne NextResponse.next() pour les routes non-admin
    expect(response.status).not.toBe(302)
    expect(response.status).not.toBe(307)
    // Pas de Location header (null pour NextResponse.next())
    const location = response.headers.get('Location')
    expect(location).toBeNull()
  })

  it('redirige vers /admin/login sans auth sur /admin/dashboard', async () => {
    // Requête sans cookies d'authentification
    const request = new NextRequest('http://localhost:3000/admin/dashboard')
    const response = await updateSession(request)

    // Doit rediriger vers /admin/login
    expect(response.status).toBe(307)
    const location = response.headers.get('Location')
    expect(location).toBeDefined()
    expect(location).toContain('/admin/login')
  })

  it('ne redirige pas sur /admin/login (éviter la boucle de redirect)', async () => {
    // La page /admin/login est exclue du redirect
    const request = new NextRequest('http://localhost:3000/admin/login')
    const response = await updateSession(request)

    // /admin/login ne doit pas être redirigé (status != 307, pas de Location)
    expect(response.status).not.toBe(307)
    const location = response.headers.get('Location')
    // Soit pas de Location header, soit il ne pointe pas vers /admin/login
    if (location !== null) {
      expect(location).not.toContain('/admin/login')
    }
  })
})
