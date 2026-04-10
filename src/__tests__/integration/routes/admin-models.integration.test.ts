import { testApiHandler } from 'next-test-api-route-handler' // PREMIER IMPORT OBLIGATOIRE
import * as adminModelsRoute from '@/app/api/admin/models/route'
import * as adminModelByIdRoute from '@/app/api/admin/models/[id]/route'
import * as adminModelImagesRoute from '@/app/api/admin/models/[id]/images/route'
import * as adminModelImageByIdRoute from '@/app/api/admin/models/[id]/images/[imageId]/route'
import * as adminModelVisualsRoute from '@/app/api/admin/models/[id]/visuals/route'
import * as adminModelVisualByIdRoute from '@/app/api/admin/models/[id]/visuals/[visualId]/route'
import { loginAsAdmin } from '../helpers/auth'
import { seedAdminUser, seedTestData } from '../helpers/seed'
import { adminClient } from '../helpers/supabase-admin'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

let cookieHeader: string
let createdModelId: string
let createdImageId: string

beforeAll(async () => {
  await seedAdminUser()
  await seedTestData()
  const auth = await loginAsAdmin()
  cookieHeader = auth.cookieHeader
}, 30000)

afterAll(async () => {
  // Nettoyer les modeles de test crees (slug commencant par test-int-)
  await adminClient
    .from('models')
    .delete()
    .like('slug', 'test-int-%')
}, 10000)

describe('GET /api/admin/models', () => {
  it('retourne TOUS les modeles (actifs et inactifs)', async () => {
    await testApiHandler({
      appHandler: adminModelsRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
        const names = data.map((m: { name: string }) => m.name)
        expect(names).toContain('Milano Test')
        expect(names).toContain('Roma Inactif')
      },
    })
  })
})

describe('POST /api/admin/models', () => {
  it('cree un modele avec slug auto-genere', async () => {
    await testApiHandler({
      appHandler: adminModelsRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
          },
          body: JSON.stringify({ name: 'Test Int Firenze', price: 1500 }),
        })
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.name).toBe('Test Int Firenze')
        expect(data.slug).toBe('test-int-firenze')
        expect(data.price).toBe(1500)
        expect(data.id).toBeDefined()
        createdModelId = data.id
      },
    })
  })

  it('retourne 400 si le name est absent', async () => {
    await testApiHandler({
      appHandler: adminModelsRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
          },
          body: JSON.stringify({ price: 1000 }),
        })
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })

  it('retourne 400 si le price est negatif', async () => {
    await testApiHandler({
      appHandler: adminModelsRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
          },
          body: JSON.stringify({ name: 'Bad Model', price: -100 }),
        })
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })
})

describe('GET /api/admin/models/[id]', () => {
  it('retourne le modele par id', async () => {
    await testApiHandler({
      appHandler: adminModelByIdRoute,
      params: { id: createdModelId },
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.name).toBe('Test Int Firenze')
        expect(data.slug).toBe('test-int-firenze')
      },
    })
  })

  it('retourne 404 pour un id inexistant', async () => {
    await testApiHandler({
      appHandler: adminModelByIdRoute,
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

describe('PUT /api/admin/models/[id]', () => {
  it('met a jour le nom et le prix', async () => {
    await testApiHandler({
      appHandler: adminModelByIdRoute,
      params: { id: createdModelId },
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
          },
          body: JSON.stringify({ name: 'Test Int Firenze Updated', price: 1600 }),
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.name).toBe('Test Int Firenze Updated')
        expect(data.price).toBe(1600)
      },
    })
  })
})

describe('POST /api/admin/models/[id]/images — Storage upload (D-10)', () => {
  it('upload une image dans le bucket model-photos', async () => {
    // Buffer JPEG minimal valide (1x1 pixel)
    const jpegBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
      0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xFF, 0xD9,
    ])
    const file = new File([jpegBuffer], 'test.jpg', { type: 'image/jpeg' })

    await testApiHandler({
      appHandler: adminModelImagesRoute,
      params: { id: createdModelId },
      async test({ fetch }) {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('view_type', 'face')
        formData.append('sort_order', '0')

        const res = await fetch({
          method: 'POST',
          headers: { Cookie: cookieHeader },
          body: formData,
        })
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.id).toBeDefined()
        expect(data.image_url).toContain('model-photos')
        expect(data.view_type).toBe('face')
        createdImageId = data.id
      },
    })
  })

  it('retourne 400 sans fichier image', async () => {
    await testApiHandler({
      appHandler: adminModelImagesRoute,
      params: { id: createdModelId },
      async test({ fetch }) {
        const formData = new FormData()
        formData.append('view_type', 'face')
        formData.append('sort_order', '0')

        const res = await fetch({
          method: 'POST',
          headers: { Cookie: cookieHeader },
          body: formData,
        })
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })

  it("retourne 404 si le modele n'existe pas", async () => {
    const jpegBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
      0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xFF, 0xD9,
    ])
    const file = new File([jpegBuffer], 'test.jpg', { type: 'image/jpeg' })

    await testApiHandler({
      appHandler: adminModelImagesRoute,
      params: { id: '00000000-0000-0000-0000-000000000000' },
      async test({ fetch }) {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('view_type', 'face')
        formData.append('sort_order', '0')

        const res = await fetch({
          method: 'POST',
          headers: { Cookie: cookieHeader },
          body: formData,
        })
        expect(res.status).toBe(404)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })
})

describe('DELETE /api/admin/models/[id]/images/[imageId] — Storage suppression (D-11)', () => {
  it("supprime l'image du Storage et de la BDD", async () => {
    await testApiHandler({
      appHandler: adminModelImageByIdRoute,
      params: { id: createdModelId, imageId: createdImageId },
      async test({ fetch }) {
        const res = await fetch({
          method: 'DELETE',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)

        // Verifier que l'image n'existe plus en BDD
        const { data: imageRow } = await adminClient
          .from('model_images')
          .select('id')
          .eq('id', createdImageId)
          .maybeSingle()
        expect(imageRow).toBeNull()
      },
    })
  })
})

describe('GET /api/admin/models/[id]/visuals', () => {
  it('retourne les visuels du modele', async () => {
    // Utiliser le modele seed Milano Test qui a un visuel seed
    await testApiHandler({
      appHandler: adminModelVisualsRoute,
      params: { id: 'b0000000-0000-0000-0000-000000000001' },
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThanOrEqual(1)
      },
    })
  })
})

describe('DELETE /api/admin/models/[id]/visuals/[visualId]', () => {
  it('supprime un visuel genere de la BDD', async () => {
    // Creer un visuel temporaire via adminClient pour pouvoir le supprimer
    // Utiliser model_image d0...02 + fabric c0...02 (Lin Inactif) pour eviter la contrainte UNIQUE
    // avec le visuel seed (d0...01, c0...01)
    const { data: visual } = await adminClient
      .from('generated_visuals')
      .insert({
        model_id: 'b0000000-0000-0000-0000-000000000001',
        model_image_id: 'd0000000-0000-0000-0000-000000000002',
        fabric_id: 'c0000000-0000-0000-0000-000000000002',
        generated_image_url: 'http://127.0.0.1:54321/storage/v1/object/public/generated-visuals/test-delete.jpg',
        is_validated: false,
        is_published: false,
      })
      .select('id')
      .single()

    expect(visual).toBeTruthy()

    await testApiHandler({
      appHandler: adminModelVisualByIdRoute,
      params: { id: 'b0000000-0000-0000-0000-000000000001', visualId: visual!.id },
      async test({ fetch }) {
        const res = await fetch({
          method: 'DELETE',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)

        // Verifier suppression en BDD
        const { data: row } = await adminClient
          .from('generated_visuals')
          .select('id')
          .eq('id', visual!.id)
          .maybeSingle()
        expect(row).toBeNull()
      },
    })
  })

  it('retourne 404 pour un visuel inexistant', async () => {
    await testApiHandler({
      appHandler: adminModelVisualByIdRoute,
      params: { id: 'b0000000-0000-0000-0000-000000000001', visualId: 'e9999999-9999-9999-9999-999999999999' },
      async test({ fetch }) {
        const res = await fetch({
          method: 'DELETE',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(404)
      },
    })
  })
})

describe('DELETE /api/admin/models/[id]', () => {
  it('supprime le modele et cascade ses images', async () => {
    // Inserer une image de test pour verifier la cascade
    await adminClient.from('model_images').insert({
      model_id: createdModelId,
      image_url: 'http://127.0.0.1:54321/storage/v1/object/public/model-photos/test-int-firenze-updated/face-0.jpg',
      view_type: 'face',
      sort_order: 0,
    })

    await testApiHandler({
      appHandler: adminModelByIdRoute,
      params: { id: createdModelId },
      async test({ fetch }) {
        const res = await fetch({
          method: 'DELETE',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)

        // Verifier que le modele n'existe plus en BDD
        const { data: modelRow } = await adminClient
          .from('models')
          .select('id')
          .eq('id', createdModelId)
          .maybeSingle()
        expect(modelRow).toBeNull()

        // Verifier que les images en cascade ont ete supprimees
        const { data: images } = await adminClient
          .from('model_images')
          .select('id')
          .eq('model_id', createdModelId)
        expect(images).toHaveLength(0)
      },
    })
  })
})
