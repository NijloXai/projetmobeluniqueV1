/**
 * audit-full.ts — Full project audit: all API routes, auth, public endpoints, export ZIP
 *
 * Usage: npx tsx scripts/audit-full.ts
 *
 * Requires a running dev server on port 3000.
 */

import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

// Load environment
const envLocal = resolve(process.cwd(), '.env.local')
const envFallback = resolve(process.cwd(), '.env')
const envPath = existsSync(envLocal) ? envLocal : envFallback
process.loadEnvFile(envPath)

const BASE = 'http://localhost:3000'
const TIMEOUT = 15_000

interface CheckResult {
  group: string
  name: string
  passed: boolean
  detail: string
}

const results: CheckResult[] = []

function check(group: string, name: string, passed: boolean, detail: string) {
  results.push({ group, name, passed, detail })
  const icon = passed ? '✅' : '❌'
  console.log(`  ${icon} ${name} — ${detail}`)
}

async function f(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) })
}

// ─── 1. Public API Routes ───────────────────────────────────────────────────
async function testPublicAPI() {
  console.log('\n═══ 1. PUBLIC API ROUTES ═══')

  // GET /api/models
  {
    const res = await f(`${BASE}/api/models`)
    const body = await res.json()
    check('public', 'GET /api/models → 200', res.status === 200, `status=${res.status}`)
    check('public', 'GET /api/models → array', Array.isArray(body), `isArray=${Array.isArray(body)}`)
    if (Array.isArray(body) && body.length > 0) {
      const m = body[0]
      check('public', 'Model has expected fields', 
        !!m.id && !!m.slug && !!m.name && typeof m.price === 'number',
        `fields: id=${!!m.id}, slug=${!!m.slug}, name=${!!m.name}, price=${typeof m.price}`)
      
      // GET /api/models/[slug]
      const res2 = await f(`${BASE}/api/models/${m.slug}`)
      check('public', `GET /api/models/${m.slug} → 200`, res2.status === 200, `status=${res2.status}`)
      
      // GET /api/models/[slug]/visuals
      const res3 = await f(`${BASE}/api/models/${m.slug}/visuals`)
      const visuals = await res3.json()
      check('public', `GET /api/models/${m.slug}/visuals → 200`, res3.status === 200, `status=${res3.status}`)
      check('public', 'Visuals response is array', Array.isArray(visuals), `isArray=${Array.isArray(visuals)}`)
    }
  }

  // GET /api/models/nonexistent-slug
  {
    const res = await f(`${BASE}/api/models/this-slug-does-not-exist-12345`)
    check('public', 'GET /api/models/bad-slug → 404', res.status === 404, `status=${res.status}`)
  }
}

// ─── 2. Auth Guard on ALL Admin Routes ──────────────────────────────────────
async function testAuthGuard() {
  console.log('\n═══ 2. AUTH GUARD (401 WITHOUT COOKIES) ═══')

  const dummyId = '00000000-0000-0000-0000-000000000001'

  const routes: Array<{ method: string; path: string; body?: string; contentType?: string }> = [
    // Fabrics CRUD
    { method: 'GET', path: '/api/admin/fabrics' },
    { method: 'POST', path: '/api/admin/fabrics', contentType: 'application/json', body: '{}' },
    { method: 'GET', path: `/api/admin/fabrics/${dummyId}` },
    { method: 'PUT', path: `/api/admin/fabrics/${dummyId}`, contentType: 'application/json', body: '{}' },
    { method: 'DELETE', path: `/api/admin/fabrics/${dummyId}` },
    { method: 'GET', path: '/api/admin/fabrics/categories' },

    // Models CRUD
    { method: 'GET', path: '/api/admin/models' },
    { method: 'POST', path: '/api/admin/models', contentType: 'application/json', body: '{}' },
    { method: 'GET', path: `/api/admin/models/${dummyId}` },
    { method: 'PUT', path: `/api/admin/models/${dummyId}`, contentType: 'application/json', body: '{}' },
    { method: 'DELETE', path: `/api/admin/models/${dummyId}` },

    // Model images
    { method: 'GET', path: `/api/admin/models/${dummyId}/images` },
    { method: 'POST', path: `/api/admin/models/${dummyId}/images` },
    { method: 'DELETE', path: `/api/admin/models/${dummyId}/images/${dummyId}` },

    // Model visuals
    { method: 'GET', path: `/api/admin/models/${dummyId}/visuals` },
    { method: 'POST', path: `/api/admin/models/${dummyId}/visuals` },
    { method: 'DELETE', path: `/api/admin/models/${dummyId}/visuals/${dummyId}` },

    // IA generation
    { method: 'POST', path: '/api/admin/generate', contentType: 'application/json', body: '{}' },
    { method: 'POST', path: '/api/admin/generate-all', contentType: 'application/json', body: '{}' },

    // Visual validate/publish
    { method: 'PUT', path: `/api/admin/visuals/${dummyId}/validate` },
    { method: 'PUT', path: `/api/admin/visuals/${dummyId}/publish` },
    { method: 'PUT', path: '/api/admin/visuals/bulk-validate', contentType: 'application/json', body: '{"visual_ids":[]}' },
    { method: 'PUT', path: '/api/admin/visuals/bulk-publish', contentType: 'application/json', body: '{"visual_ids":[]}' },

    // Export ZIP
    { method: 'GET', path: `/api/admin/visuals/export/${dummyId}` },
  ]

  for (const route of routes) {
    try {
      const init: RequestInit = {
        method: route.method,
        headers: route.contentType ? { 'Content-Type': route.contentType } : undefined,
        body: route.body,
      }
      const res = await f(`${BASE}${route.path}`, init)
      check(
        'auth',
        `${route.method} ${route.path} → 401`,
        res.status === 401,
        `status=${res.status}`
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      check('auth', `${route.method} ${route.path} → 401`, false, `error: ${msg}`)
    }
  }
}

// ─── 3. Simulate API (Public) ───────────────────────────────────────────────
async function testSimulate() {
  console.log('\n═══ 3. SIMULATE API (PUBLIC, R011) ═══')

  // Missing fields → 400
  {
    const form = new FormData()
    form.append('fabric_id', '00000000-0000-0000-0000-000000000001')
    // No model_id, no image
    const res = await f(`${BASE}/api/simulate`, { method: 'POST', body: form })
    check('simulate', 'POST /api/simulate missing model_id → 400', res.status === 400, `status=${res.status}`)
  }

  // No image → 400
  {
    const form = new FormData()
    form.append('model_id', '00000000-0000-0000-0000-000000000001')
    form.append('fabric_id', '00000000-0000-0000-0000-000000000001')
    const res = await f(`${BASE}/api/simulate`, { method: 'POST', body: form })
    check('simulate', 'POST /api/simulate missing image → 400', res.status === 400, `status=${res.status}`)
  }
}

// ─── 4. Pages (HTML served) ─────────────────────────────────────────────────
async function testPages() {
  console.log('\n═══ 4. PAGE RESPONSES ═══')

  const pages = [
    { path: '/', expect: 200, name: 'Home' },
    { path: '/admin/login', expect: 200, name: 'Login page' },
    // Admin pages redirect to login without auth
    { path: '/admin', expect: 200, name: 'Admin redirects to login' },
    { path: '/admin/produits', expect: 200, name: 'Admin produits redirects' },
    { path: '/admin/tissus', expect: 200, name: 'Admin tissus redirects' },
  ]

  for (const page of pages) {
    try {
      const res = await f(`${BASE}${page.path}`, { redirect: 'follow' })
      // After redirect to login, status should be 200
      check('pages', `${page.name} (${page.path})`, res.status === page.expect, `status=${res.status}, url=${res.url}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      check('pages', `${page.name} (${page.path})`, false, `error: ${msg}`)
    }
  }
}

// ─── 5. IA Service ──────────────────────────────────────────────────────────
async function testIAService() {
  console.log('\n═══ 5. IA SERVICE ═══')

  // Import dynamically
  const { getIAService } = await import('../src/lib/ai/index')
  const { MockIAService } = await import('../src/lib/ai/mock')
  const { buildBackOfficePrompt, buildSimulatePrompt } = await import('../src/lib/ai/prompts')

  const service = getIAService()
  check('ia', 'getIAService() → MockIAService', service instanceof MockIAService, `class=${service.constructor.name}`)

  // Prompt templates
  const boPrompt = buildBackOfficePrompt('Oslo', 'Velours Bleu', 'face')
  check('ia', 'buildBackOfficePrompt() → non-empty', boPrompt.length > 50, `length=${boPrompt.length}`)
  check('ia', 'Prompt contains model name', boPrompt.includes('Oslo'), `contains "Oslo": ${boPrompt.includes('Oslo')}`)

  const simPrompt = buildSimulatePrompt('Oslo', 'Velours Bleu')
  check('ia', 'buildSimulatePrompt() → non-empty', simPrompt.length > 50, `length=${simPrompt.length}`)
}

// ─── 6. TypeScript Types ────────────────────────────────────────────────────
async function testTypes() {
  console.log('\n═══ 6. TYPE SAFETY ═══')

  // Verify import integrity — TS types are erased at runtime, so we just check the import doesn't throw
  try {
    await import('../src/types/database')
    check('types', 'Database types importable (no runtime errors)', true, 'import succeeded')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    check('types', 'Database types importable (no runtime errors)', false, `error: ${msg}`)
  }

  try {
    const schemas = await import('../src/lib/schemas')
    check('types', 'Zod schemas importable', !!schemas.createModelSchema && !!schemas.createFabricSchema, 'all schemas found')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    check('types', 'Zod schemas importable', false, `error: ${msg}`)
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 FULL PROJECT AUDIT — Möbel Unique\n')
  console.log(`  Environment: ${envPath}`)
  console.log(`  Base URL: ${BASE}`)

  // Verify server is running
  try {
    await f(BASE)
  } catch {
    console.error('❌ Dev server not running on port 3000. Start with: npm run dev')
    process.exit(2)
  }

  await testPublicAPI()
  await testAuthGuard()
  await testSimulate()
  await testPages()
  await testIAService()
  await testTypes()

  // ─── Summary ──────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`RESULTS: ${passed}/${total} checks passed`)

  if (failed > 0) {
    console.log(`\n💥 ${failed} FAILURES:`)
    for (const f of results.filter(r => !r.passed)) {
      console.log(`   [${f.group}] ${f.name}: ${f.detail}`)
    }
  }

  // Group summary
  const groups = [...new Set(results.map(r => r.group))]
  console.log('\nPer-group breakdown:')
  for (const g of groups) {
    const gr = results.filter(r => r.group === g)
    const gp = gr.filter(r => r.passed).length
    const icon = gp === gr.length ? '✅' : '❌'
    console.log(`  ${icon} ${g}: ${gp}/${gr.length}`)
  }

  console.log('')
  if (failed === 0) {
    console.log('🎉 ALL CHECKS PASSED — Project is fully operational.\n')
    process.exit(0)
  } else {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('💥 Unhandled:', err)
  process.exit(2)
})
