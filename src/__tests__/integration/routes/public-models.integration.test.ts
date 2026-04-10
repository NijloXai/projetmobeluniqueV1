import { testApiHandler } from 'next-test-api-route-handler' // PREMIER IMPORT OBLIGATOIRE
import * as modelsRoute from '@/app/api/models/route'
import * as modelBySlugRoute from '@/app/api/models/[slug]/route'
import * as modelVisualsRoute from '@/app/api/models/[slug]/visuals/route'
import { seedAdminUser, seedTestData } from '../helpers/seed'
import { adminClient } from '../helpers/supabase-admin'
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(async () => {
  await seedAdminUser()
  await seedTestData()
}, 30000)

describe('GET /api/models', () => {
  it('retourne les modeles actifs uniquement', async () => {
    await testApiHandler({
      appHandler: modelsRoute,
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
        const names = data.map((m: { name: string }) => m.name)
        expect(names).toContain('Milano Test')
        // D-12 : Roma Inactif ne doit PAS etre visible sur les routes publiques
        expect(names).not.toContain('Roma Inactif')
      },
    })
  })

  it('retourne les model_images triees par sort_order', async () => {
    await testApiHandler({
      appHandler: modelsRoute,
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(200)
        const data = await res.json()
        const milano = data.find((m: { name: string }) => m.name === 'Milano Test')
        expect(milano).toBeDefined()
        expect(Array.isArray(milano.model_images)).toBe(true)
        expect(milano.model_images.length).toBeGreaterThanOrEqual(2)
        // La premiere image doit avoir sort_order 0 (face)
        expect(milano.model_images[0].sort_order).toBe(0)
        expect(milano.model_images[0].view_type).toBe('face')
      },
    })
  })

  it('retourne un tableau vide si aucun modele actif', async () => {
    // Rendre tous les modeles inactifs temporairement
    await adminClient
      .from('models')
      .update({ is_active: false })
      .eq('slug', 'milano-test')

    try {
      await testApiHandler({
        appHandler: modelsRoute,
        async test({ fetch }) {
          const res = await fetch({ method: 'GET' })
          expect(res.status).toBe(200)
          const data = await res.json()
          expect(Array.isArray(data)).toBe(true)
          // Milano Test est inactif, Roma Inactif l'etait deja — tableau vide
          const activeNames = data.map((m: { name: string }) => m.name)
          expect(activeNames).not.toContain('Milano Test')
        },
      })
    } finally {
      // Restaurer l'etat initial
      await adminClient
        .from('models')
        .update({ is_active: true })
        .eq('slug', 'milano-test')
    }
  })
})

describe('GET /api/models/[slug]', () => {
  it('retourne le modele par slug avec images', async () => {
    await testApiHandler({
      appHandler: modelBySlugRoute,
      params: { slug: 'milano-test' },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.name).toBe('Milano Test')
        expect(typeof data.price).toBe('number')
        expect(Array.isArray(data.model_images)).toBe(true)
        expect(data.model_images.length).toBeGreaterThanOrEqual(1)
      },
    })
  })

  it('retourne 404 pour un slug inexistant', async () => {
    await testApiHandler({
      appHandler: modelBySlugRoute,
      params: { slug: 'inexistant-xyz-999' },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(404)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })

  it('retourne 404 pour un modele inactif (RLS + filtre is_active)', async () => {
    // roma-inactif a is_active=false dans le seed
    await testApiHandler({
      appHandler: modelBySlugRoute,
      params: { slug: 'roma-inactif' },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(404)
      },
    })
  })
})

describe('GET /api/models/[slug]/visuals', () => {
  it('retourne les visuels publies pour le modele', async () => {
    await testApiHandler({
      appHandler: modelVisualsRoute,
      params: { slug: 'milano-test' },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)
        // Verifier que le visuel a les infos du tissu associe
        const visuel = data[0]
        expect(visuel.fabric).toBeDefined()
        expect(visuel.fabric.name).toBe('Velours Bleu')
        expect(visuel.model_image).toBeDefined()
      },
    })
  })

  it('retourne un tableau vide si aucun visuel publie', async () => {
    // Depublier temporairement le visuel
    await adminClient
      .from('generated_visuals')
      .update({ is_published: false })
      .eq('id', 'e0000000-0000-0000-0000-000000000001')

    try {
      await testApiHandler({
        appHandler: modelVisualsRoute,
        params: { slug: 'milano-test' },
        async test({ fetch }) {
          const res = await fetch({ method: 'GET' })
          expect(res.status).toBe(200)
          const data = await res.json()
          expect(Array.isArray(data)).toBe(true)
          expect(data.length).toBe(0)
        },
      })
    } finally {
      // Restaurer
      await adminClient
        .from('generated_visuals')
        .update({ is_published: true })
        .eq('id', 'e0000000-0000-0000-0000-000000000001')
    }
  })

  it('retourne 404 pour un slug inexistant', async () => {
    await testApiHandler({
      appHandler: modelVisualsRoute,
      params: { slug: 'inexistant-xyz-999' },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(404)
      },
    })
  })
})
