import { testApiHandler } from 'next-test-api-route-handler' // PREMIER IMPORT OBLIGATOIRE
import * as validateRoute from '@/app/api/admin/visuals/[id]/validate/route'
import * as publishRoute from '@/app/api/admin/visuals/[id]/publish/route'
import * as bulkValidateRoute from '@/app/api/admin/visuals/bulk-validate/route'
import * as bulkPublishRoute from '@/app/api/admin/visuals/bulk-publish/route'
import * as exportRoute from '@/app/api/admin/visuals/export/[modelId]/route'
import { loginAsAdmin } from '../helpers/auth'
import { seedAdminUser, seedTestData } from '../helpers/seed'
import { adminClient } from '../helpers/supabase-admin'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// IDs de test fixes
const VISUAL_ID_SEED = 'e0000000-0000-0000-0000-000000000001' // visuel seed (validé+publié)
const VISUAL_ID_TEST = 'e0000000-0000-0000-0000-000000000010' // visuel pour validate->publish
const VISUAL_ID_BULK1 = 'e0000000-0000-0000-0000-000000000011' // visuel bulk 1
const VISUAL_ID_BULK2 = 'e0000000-0000-0000-0000-000000000012' // visuel bulk 2
const MODEL_ID = 'b0000000-0000-0000-0000-000000000001'
const MODEL_IMAGE_ID_1 = 'd0000000-0000-0000-0000-000000000001'
const MODEL_IMAGE_ID_2 = 'd0000000-0000-0000-0000-000000000002'
const FABRIC_ID_ACTIVE = 'c0000000-0000-0000-0000-000000000001' // Velours Bleu
const FABRIC_ID_INACTIVE = 'c0000000-0000-0000-0000-000000000002' // Lin Inactif — pas de visuel seed

let cookieHeader: string

beforeAll(async () => {
  await seedAdminUser()
  await seedTestData()
  const auth = await loginAsAdmin()
  cookieHeader = auth.cookieHeader

  // VISUAL_ID_TEST : non validé pour le test validate->publish
  // Couple (MODEL_IMAGE_ID_2, FABRIC_ID_INACTIVE) — pas dans le seed
  await adminClient.from('generated_visuals').upsert({
    id: VISUAL_ID_TEST,
    model_id: MODEL_ID,
    model_image_id: MODEL_IMAGE_ID_2,
    fabric_id: FABRIC_ID_INACTIVE,
    generated_image_url:
      'http://127.0.0.1:54321/storage/v1/object/public/generated-visuals/test.jpg',
    is_validated: false,
    is_published: false,
  })

  // VISUAL_ID_BULK1 : couple (MODEL_IMAGE_ID_1, FABRIC_ID_INACTIVE) — pas de conflit
  // VISUAL_ID_BULK2 : couple (MODEL_IMAGE_ID_2, FABRIC_ID_ACTIVE) — pas de conflit
  // NOTE : le seed a (MODEL_IMAGE_ID_1, FABRIC_ID_ACTIVE) avec id VISUAL_ID_SEED
  //        VISUAL_ID_TEST est (MODEL_IMAGE_ID_2, FABRIC_ID_INACTIVE)
  //        donc BULK1=(MI_1, FAB_INACTIVE) et BULK2=(MI_2, FAB_ACTIVE) sont libres
  await adminClient.from('generated_visuals').upsert([
    {
      id: VISUAL_ID_BULK1,
      model_id: MODEL_ID,
      model_image_id: MODEL_IMAGE_ID_1,
      fabric_id: FABRIC_ID_INACTIVE,
      generated_image_url:
        'http://127.0.0.1:54321/storage/v1/object/public/generated-visuals/bulk1.jpg',
      is_validated: false,
      is_published: false,
    },
    {
      id: VISUAL_ID_BULK2,
      model_id: MODEL_ID,
      model_image_id: MODEL_IMAGE_ID_2,
      fabric_id: FABRIC_ID_ACTIVE,
      generated_image_url:
        'http://127.0.0.1:54321/storage/v1/object/public/generated-visuals/bulk2.jpg',
      is_validated: false,
      is_published: false,
    },
  ])
}, 30000)

afterAll(async () => {
  // Nettoyer les visuels de test créés dans cette suite
  await adminClient
    .from('generated_visuals')
    .delete()
    .in('id', [VISUAL_ID_TEST, VISUAL_ID_BULK1, VISUAL_ID_BULK2])
})

// ─────────────────────────────────────────────────────
// PUT /api/admin/visuals/[id]/validate
// ─────────────────────────────────────────────────────

describe('PUT /api/admin/visuals/[id]/validate', () => {
  it('valide un visuel non validé', async () => {
    await testApiHandler({
      appHandler: validateRoute,
      params: { id: VISUAL_ID_TEST },
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.is_validated).toBe(true)
        expect(data.id).toBe(VISUAL_ID_TEST)
      },
    })
  })

  it('retourne 404 pour un visuel inexistant', async () => {
    await testApiHandler({
      appHandler: validateRoute,
      params: { id: 'e9999999-9999-9999-9999-999999999999' },
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(404)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })

  it('retourne 401 sans authentification', async () => {
    await testApiHandler({
      appHandler: validateRoute,
      params: { id: VISUAL_ID_TEST },
      async test({ fetch }) {
        const res = await fetch({ method: 'PUT' })
        expect(res.status).toBe(401)
      },
    })
  })
})

// ─────────────────────────────────────────────────────
// PUT /api/admin/visuals/[id]/publish
// ─────────────────────────────────────────────────────

describe('PUT /api/admin/visuals/[id]/publish', () => {
  it('publie un visuel déjà validé', async () => {
    // VISUAL_ID_TEST a été validé dans le describe précédent
    // On s'assure qu'il est bien validé avant de publier
    await adminClient
      .from('generated_visuals')
      .update({ is_validated: true, is_published: false })
      .eq('id', VISUAL_ID_TEST)

    await testApiHandler({
      appHandler: publishRoute,
      params: { id: VISUAL_ID_TEST },
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.is_published).toBe(true)
        expect(data.id).toBe(VISUAL_ID_TEST)
      },
    })
  })

  it("retourne 403 si le visuel n'est pas validé (T-15.1-14)", async () => {
    // Réinitialiser VISUAL_ID_BULK1 à non-validé pour ce test
    await adminClient
      .from('generated_visuals')
      .update({ is_validated: false, is_published: false })
      .eq('id', VISUAL_ID_BULK1)

    await testApiHandler({
      appHandler: publishRoute,
      params: { id: VISUAL_ID_BULK1 },
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: { Cookie: cookieHeader },
        })
        // La route vérifie is_validated avant de publier (sinon 403)
        expect(res.status).toBe(403)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })

  it('retourne 404 pour un visuel inexistant', async () => {
    await testApiHandler({
      appHandler: publishRoute,
      params: { id: 'e9999999-9999-9999-9999-999999999998' },
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(404)
      },
    })
  })
})

// ─────────────────────────────────────────────────────
// PUT /api/admin/visuals/bulk-validate
// Note: la route utilise PUT, pas POST
// ─────────────────────────────────────────────────────

describe('PUT /api/admin/visuals/bulk-validate', () => {
  it('valide plusieurs visuels en une seule requête', async () => {
    // S'assurer que BULK1 et BULK2 sont non validés
    await adminClient
      .from('generated_visuals')
      .update({ is_validated: false, is_published: false })
      .in('id', [VISUAL_ID_BULK1, VISUAL_ID_BULK2])

    await testApiHandler({
      appHandler: bulkValidateRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: {
            Cookie: cookieHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ visual_ids: [VISUAL_ID_BULK1, VISUAL_ID_BULK2] }),
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.validated).toBe(2)
      },
    })

    // Vérifier en BDD que les 2 visuels sont bien validés
    const { data } = await adminClient
      .from('generated_visuals')
      .select('id, is_validated')
      .in('id', [VISUAL_ID_BULK1, VISUAL_ID_BULK2])

    expect(data?.every(v => v.is_validated)).toBe(true)
  })

  it('retourne 400 si visual_ids est vide', async () => {
    await testApiHandler({
      appHandler: bulkValidateRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: {
            Cookie: cookieHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ visual_ids: [] }),
        })
        expect(res.status).toBe(400)
      },
    })
  })
})

// ─────────────────────────────────────────────────────
// PUT /api/admin/visuals/bulk-publish
// ─────────────────────────────────────────────────────

describe('PUT /api/admin/visuals/bulk-publish', () => {
  it('publie plusieurs visuels validés', async () => {
    // S'assurer que BULK1 et BULK2 sont validés mais pas publiés
    await adminClient
      .from('generated_visuals')
      .update({ is_validated: true, is_published: false })
      .in('id', [VISUAL_ID_BULK1, VISUAL_ID_BULK2])

    await testApiHandler({
      appHandler: bulkPublishRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: {
            Cookie: cookieHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ visual_ids: [VISUAL_ID_BULK1, VISUAL_ID_BULK2] }),
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.published).toBe(2)
      },
    })

    // Vérifier en BDD que les 2 visuels sont publiés
    const { data } = await adminClient
      .from('generated_visuals')
      .select('id, is_published')
      .in('id', [VISUAL_ID_BULK1, VISUAL_ID_BULK2])

    expect(data?.every(v => v.is_published)).toBe(true)
  })

  it('ne publie pas les visuels non validés (filtre is_validated)', async () => {
    // Utiliser VISUAL_ID_SEED qui est déjà validé+publié mais on va créer un autre non validé
    // On utilise VISUAL_ID_BULK2 que l'on remet à non-validé
    await adminClient
      .from('generated_visuals')
      .update({ is_validated: false, is_published: false })
      .eq('id', VISUAL_ID_BULK2)

    await testApiHandler({
      appHandler: bulkPublishRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'PUT',
          headers: {
            Cookie: cookieHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ visual_ids: [VISUAL_ID_BULK2] }),
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        // Le visuel non validé ne doit pas être publié
        expect(data.published).toBe(0)
      },
    })
  })
})

// ─────────────────────────────────────────────────────
// GET /api/admin/visuals/export/[modelId]
// ─────────────────────────────────────────────────────

describe('GET /api/admin/visuals/export/[modelId]', () => {
  it('retourne un ZIP pour un modèle avec des visuels validés', async () => {
    // S'assurer que le visuel seed est validé
    await adminClient
      .from('generated_visuals')
      .update({ is_validated: true })
      .eq('id', VISUAL_ID_SEED)

    await testApiHandler({
      appHandler: exportRoute,
      params: { modelId: MODEL_ID },
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { Cookie: cookieHeader },
        })
        // Le modèle a des visuels validés donc le ZIP est retourné
        expect(res.status).toBe(200)
        const contentType = res.headers.get('Content-Type') ?? ''
        expect(
          contentType.includes('application/zip') ||
            contentType.includes('application/octet-stream')
        ).toBe(true)
        // Le body doit contenir des données
        const buffer = Buffer.from(await res.arrayBuffer())
        expect(buffer.length).toBeGreaterThan(0)
      },
    })
  })

  it('retourne 404 pour un modèle inexistant', async () => {
    await testApiHandler({
      appHandler: exportRoute,
      params: { modelId: 'b9999999-9999-9999-9999-999999999999' },
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { Cookie: cookieHeader },
        })
        expect(res.status).toBe(404)
      },
    })
  })

  it('retourne 401 sans authentification', async () => {
    await testApiHandler({
      appHandler: exportRoute,
      params: { modelId: MODEL_ID },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(401)
      },
    })
  })
})
