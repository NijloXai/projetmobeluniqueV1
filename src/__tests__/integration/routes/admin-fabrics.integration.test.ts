import { testApiHandler } from 'next-test-api-route-handler' // PREMIER IMPORT OBLIGATOIRE
import * as adminFabricsRoute from '@/app/api/admin/fabrics/route'
import * as adminFabricByIdRoute from '@/app/api/admin/fabrics/[id]/route'
import * as fabricCategoriesRoute from '@/app/api/admin/fabrics/categories/route'
import { loginAsAdmin } from '../helpers/auth'
import { seedAdminUser, seedTestData } from '../helpers/seed'
import { adminClient } from '../helpers/supabase-admin'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

let cookieHeader: string
let createdFabricId: string

beforeAll(async () => {
  await seedAdminUser()
  await seedTestData()
  const auth = await loginAsAdmin()
  cookieHeader = auth.cookieHeader
}, 30000)

afterAll(async () => {
  // Nettoyer les tissus de test crees (slug commencant par test-int-)
  await adminClient
    .from('fabrics')
    .delete()
    .like('slug', 'test-int-%')
}, 10000)

describe('GET /api/admin/fabrics', () => {
  it('retourne tous les tissus (actifs et inactifs)', async () => {
    await testApiHandler({
      appHandler: adminFabricsRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
        const names = data.map((f: { name: string }) => f.name)
        expect(names).toContain('Velours Bleu')
        expect(names).toContain('Lin Inactif')
      },
    })
  })
})

describe('POST /api/admin/fabrics', () => {
  it('cree un tissu avec slug auto-genere', async () => {
    await testApiHandler({
      appHandler: adminFabricsRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
          },
          body: JSON.stringify({
            name: 'Test Int Coton Beige',
            category: 'coton',
            is_premium: false,
          }),
        })
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.name).toBe('Test Int Coton Beige')
        expect(data.slug).toBe('test-int-coton-beige')
        expect(data.category).toBe('coton')
        expect(data.is_premium).toBe(false)
        expect(data.id).toBeDefined()
        createdFabricId = data.id
      },
    })
  })

  it('cree un tissu avec upload swatch via FormData (D-10)', async () => {
    const jpegBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
      0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xFF, 0xD9,
    ])
    const file = new File([jpegBuffer], 'swatch.jpg', { type: 'image/jpeg' })

    await testApiHandler({
      appHandler: adminFabricsRoute,
      async test({ fetch }) {
        const formData = new FormData()
        formData.append('name', 'Test Int Soie Rose')
        formData.append('category', 'soie')
        formData.append('is_premium', 'true')
        formData.append('swatch', file)

        const res = await fetch({
          method: 'POST',
          headers: { Cookie: cookieHeader },
          body: formData,
        })
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.name).toBe('Test Int Soie Rose')
        expect(data.slug).toBe('test-int-soie-rose')
        expect(data.swatch_url).toBeDefined()
        expect(data.swatch_url).toContain('fabric-swatches')
      },
    })
  })

  it('retourne 400 si le name est absent', async () => {
    await testApiHandler({
      appHandler: adminFabricsRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
          },
          body: JSON.stringify({ category: 'lin' }),
        })
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })
})

describe('GET /api/admin/fabrics/[id]', () => {
  it('retourne le tissu par id', async () => {
    await testApiHandler({
      appHandler: adminFabricByIdRoute,
      params: { id: createdFabricId },
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.name).toBe('Test Int Coton Beige')
        expect(data.category).toBe('coton')
      },
    })
  })

  it('retourne 404 pour un id inexistant', async () => {
    await testApiHandler({
      appHandler: adminFabricByIdRoute,
      params: { id: '00000000-0000-0000-0000-000000000000' },
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(404)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })
})

describe('PUT /api/admin/fabrics/[id]', () => {
  it('met a jour le nom et la categorie', async () => {
    await testApiHandler({
      appHandler: adminFabricByIdRoute,
      params: { id: createdFabricId },
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
          },
          body: JSON.stringify({
            name: 'Test Int Coton Ivoire',
            category: 'coton',
          }),
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.name).toBe('Test Int Coton Ivoire')
        expect(data.category).toBe('coton')
      },
    })
  })

  it('met a jour is_premium', async () => {
    await testApiHandler({
      appHandler: adminFabricByIdRoute,
      params: { id: createdFabricId },
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
          },
          body: JSON.stringify({ is_premium: true }),
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.is_premium).toBe(true)
      },
    })
  })
})

describe('DELETE /api/admin/fabrics/[id]', () => {
  it('supprime le tissu', async () => {
    await testApiHandler({
      appHandler: adminFabricByIdRoute,
      params: { id: createdFabricId },
      async test({ fetch }) {
        const res = await fetch({
          method: 'DELETE',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)

        // Verifier que le tissu n'existe plus en BDD
        const { data: fabricRow } = await adminClient
          .from('fabrics')
          .select('id')
          .eq('id', createdFabricId)
          .maybeSingle()
        expect(fabricRow).toBeNull()
      },
    })
  })

  it('retourne 404 pour un id deja supprime', async () => {
    await testApiHandler({
      appHandler: adminFabricByIdRoute,
      params: { id: createdFabricId },
      async test({ fetch }) {
        const res = await fetch({
          method: 'DELETE',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(404)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })
})

describe('GET /api/admin/fabrics/categories', () => {
  it('retourne les categories distinctes', async () => {
    await testApiHandler({
      appHandler: fabricCategoriesRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
        // 'velours' vient du seed (Velours Bleu)
        expect(data).toContain('velours')
      },
    })
  })
})
