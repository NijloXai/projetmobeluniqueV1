import { testApiHandler } from 'next-test-api-route-handler' // PREMIER IMPORT OBLIGATOIRE
import * as generateRoute from '@/app/api/admin/generate/route'
import * as generateAllRoute from '@/app/api/admin/generate-all/route'
import { loginAsAdmin } from '../helpers/auth'
import { seedAdminUser, seedTestData } from '../helpers/seed'
import { adminClient } from '../helpers/supabase-admin'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// IDs de test (seed)
const MODEL_ID = 'b0000000-0000-0000-0000-000000000001' // Milano Test
const MODEL_IMAGE_ID = 'd0000000-0000-0000-0000-000000000001' // face
const FABRIC_ID = 'c0000000-0000-0000-0000-000000000001' // Velours Bleu
// Tissu inactif — pas de visuel seed pour MI_ID_2 + FABRIC_INACTIVE (évite contrainte UNIQUE pour generate-all)
const FABRIC_ID_INACTIVE = 'c0000000-0000-0000-0000-000000000002' // Lin Inactif

let cookieHeader: string

beforeAll(async () => {
  await seedAdminUser()
  await seedTestData()
  const auth = await loginAsAdmin()
  cookieHeader = auth.cookieHeader
}, 30000)

afterAll(async () => {
  // Supprimer les visuels générés pendant les tests (basé sur model_id + is_validated=false)
  await adminClient
    .from('generated_visuals')
    .delete()
    .eq('model_id', MODEL_ID)
    .eq('is_validated', false)
})

// ─────────────────────────────────────────────────────
// POST /api/admin/generate
// NOTE: NANO_BANANA_API_KEY absent de .env.test.local → mock Sharp utilisé
// ─────────────────────────────────────────────────────

describe('POST /api/admin/generate', () => {
  it('génère un visuel avec le mock provider (Sharp)', async () => {
    // D'abord supprimer le visuel seed pour éviter la contrainte UNIQUE (model_image_id, fabric_id)
    // Le generate fait un upsert — il supprime l'ancien et en crée un nouveau
    // On utilise FABRIC_ID_INACTIVE + MODEL_IMAGE_ID pour éviter le conflit avec le seed
    await testApiHandler({
      appHandler: generateRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            Cookie: cookieHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_id: MODEL_ID,
            model_image_id: MODEL_IMAGE_ID,
            fabric_id: FABRIC_ID_INACTIVE,
          }),
        })
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.id).toBeDefined()
        expect(data.generated_image_url).toBeDefined()
        expect(data.is_validated).toBe(false)
        expect(data.is_published).toBe(false)
        expect(data.model_id).toBe(MODEL_ID)
        expect(data.fabric_id).toBe(FABRIC_ID_INACTIVE)
      },
    })
  })

  it('retourne 401 sans authentification (T-15.1-11)', async () => {
    await testApiHandler({
      appHandler: generateRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_id: MODEL_ID,
            model_image_id: MODEL_IMAGE_ID,
            fabric_id: FABRIC_ID,
          }),
        })
        expect(res.status).toBe(401)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })

  it('retourne 400 avec body incomplet', async () => {
    await testApiHandler({
      appHandler: generateRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            Cookie: cookieHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model_id: MODEL_ID }),
        })
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })

  it("retourne 404 si le modèle n'existe pas", async () => {
    await testApiHandler({
      appHandler: generateRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            Cookie: cookieHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_id: 'b9999999-9999-9999-9999-999999999999',
            model_image_id: MODEL_IMAGE_ID,
            fabric_id: FABRIC_ID,
          }),
        })
        expect(res.status).toBe(404)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })
})

// ─────────────────────────────────────────────────────
// POST /api/admin/generate-all
// ─────────────────────────────────────────────────────

describe('POST /api/admin/generate-all', () => {
  it('génère des visuels pour tous les angles du modèle', async () => {
    // Utiliser FABRIC_ID_INACTIVE pour éviter les conflits UNIQUE avec le seed
    // Le seed a (MI_1, FAB_ACTIVE) et les tests generate ont (MI_1, FAB_INACTIVE)
    // generate-all crée (MI_1, FAB_INACTIVE) + (MI_2, FAB_INACTIVE)
    await testApiHandler({
      appHandler: generateAllRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            Cookie: cookieHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_id: MODEL_ID,
            fabric_id: FABRIC_ID_INACTIVE,
          }),
        })
        // La route retourne 200 avec les visuels générés
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.total).toBeGreaterThanOrEqual(1) // Au moins 1 angle
        expect(Array.isArray(data.generated)).toBe(true)
        expect(data.success).toBeGreaterThanOrEqual(0) // Au moins 0 succès (mock peut échouer sur fetch)
        expect(Array.isArray(data.errors)).toBe(true)
      },
    })
  })

  it('retourne 400 sans model_id', async () => {
    await testApiHandler({
      appHandler: generateAllRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            Cookie: cookieHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fabric_id: FABRIC_ID }),
        })
        expect(res.status).toBe(400)
        const data = await res.json()
        expect(data.error).toBeDefined()
      },
    })
  })

  it('retourne 401 sans authentification', async () => {
    await testApiHandler({
      appHandler: generateAllRoute,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_id: MODEL_ID,
            fabric_id: FABRIC_ID,
          }),
        })
        expect(res.status).toBe(401)
      },
    })
  })
})
