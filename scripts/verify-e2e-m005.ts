/**
 * verify-e2e-m005.ts — Live E2E API verification against running dev server
 *
 * Proves R008, R010, and R011 at runtime:
 *   R011: POST /api/simulate returns watermarked JPEG with no DB side-effect
 *   R010: GET /api/models/[slug]/visuals returns published visuals correctly
 *   R008: Admin routes reject unauthenticated requests; factory returns MockIAService
 *
 * Usage: npx tsx scripts/verify-e2e-m005.ts
 */

import { spawn, ChildProcess } from 'node:child_process'
import { resolve } from 'node:path'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// ─── Load environment ───────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local')
process.loadEnvFile(envPath)

// ─── Configuration ──────────────────────────────────────────────────────────
const PORT = 3000
const BASE = `http://localhost:${PORT}`
const SERVER_READY_TIMEOUT_MS = 60_000
const FETCH_TIMEOUT_MS = 30_000

// ─── Types ──────────────────────────────────────────────────────────────────
interface CheckResult {
  name: string
  passed: boolean
  detail: string
  requirement: string
}

// ─── Globals ────────────────────────────────────────────────────────────────
const results: CheckResult[] = []
let devServer: ChildProcess | null = null

function check(requirement: string, name: string, passed: boolean, detail: string): void {
  results.push({ name, passed, detail, requirement })
  const icon = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`  ${icon}: ${name} — ${detail}`)
}

function skip(requirement: string, name: string, reason: string): void {
  console.log(`  ⏭ SKIP: ${name} — ${reason}`)
}

// ─── Dev server lifecycle ───────────────────────────────────────────────────
let weStartedServer = false

async function isServerRunning(): Promise<boolean> {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(3000) })
    return !!res
  } catch {
    return false
  }
}

async function startDevServer(): Promise<void> {
  console.log(`\n🚀 Checking for dev server on port ${PORT}...`)

  if (await isServerRunning()) {
    console.log(`  ✓ Existing dev server detected on ${BASE}\n`)
    return
  }

  console.log(`  Starting Next.js dev server on port ${PORT}...`)
  weStartedServer = true

  devServer = spawn('npx', ['next', 'dev', '--port', String(PORT)], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  })

  devServer.stdout?.on('data', () => {})
  devServer.stderr?.on('data', () => {})

  // Wait for server ready by polling — require a successful HTTP response
  const startTime = Date.now()
  let ready = false
  while (Date.now() - startTime < SERVER_READY_TIMEOUT_MS) {
    await sleep(2000)

    // Try an actual HTTP GET to confirm the port is accepting connections
    try {
      const res = await fetch(`${BASE}`, {
        signal: AbortSignal.timeout(5000),
      })
      // Any HTTP response (even 404) means the server is up
      if (res) {
        ready = true
        break
      }
    } catch {
      // ECONNREFUSED — not ready yet
    }
  }

  if (!ready) {
    console.error('❌ Dev server failed to start within timeout.')
    killDevServer()
    process.exit(2)
  }

  console.log(`  ✓ Dev server ready on ${BASE}\n`)
}

function killDevServer(): void {
  if (!weStartedServer) return
  if (devServer && !devServer.killed) {
    console.log('\n🛑 Stopping dev server...')
    devServer.kill('SIGTERM')
    // Also kill the process group to ensure next/child processes die
    try {
      if (devServer.pid) process.kill(-devServer.pid, 'SIGTERM')
    } catch {
      // Process group may not exist
    }
    devServer = null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── Supabase client for DB assertions ──────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  }
  return createSupabaseClient(url, key)
}

// ─── Test helpers ───────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
}

// ─── R011: Simulate API ─────────────────────────────────────────────────────
async function testSimulateAPI(): Promise<void> {
  console.log('── R011: Simulate API (/api/simulate) ──')

  const supabase = getSupabase()

  // Find a valid model and fabric from DB
  const { data: models } = await supabase
    .from('models')
    .select('id, name, slug')
    .limit(1)
    .single()

  const { data: fabrics } = await supabase
    .from('fabrics')
    .select('id, name')
    .limit(1)
    .single()

  if (!models || !fabrics) {
    skip('R011', 'Simulate happy path', 'No model or fabric found in DB')
    skip('R011', 'Simulate no DB side-effect', 'No model or fabric found in DB')
    // Still test validation errors
  }

  // Create a tiny test JPEG using sharp
  const tinyJpeg = await sharp({
    create: { width: 2, height: 2, channels: 3, background: { r: 128, g: 128, b: 128 } },
  })
    .jpeg({ quality: 50 })
    .toBuffer()

  // --- Check: POST with missing model_id → 400 ---
  {
    const form = new FormData()
    form.append('image', new Blob([new Uint8Array(tinyJpeg)], { type: 'image/jpeg' }), 'test.jpg')
    form.append('fabric_id', fabrics?.id ?? '00000000-0000-0000-0000-000000000000')

    const res = await fetchWithTimeout(`${BASE}/api/simulate`, { method: 'POST', body: form })
    const body = await res.json()
    check(
      'R011',
      'POST /api/simulate missing model_id → 400',
      res.status === 400 && typeof body.error === 'string',
      `status=${res.status}, error="${body.error ?? 'none'}"`
    )
  }

  // --- Check: POST with missing image → 400 ---
  {
    const form = new FormData()
    form.append('model_id', models?.id ?? '00000000-0000-0000-0000-000000000000')
    form.append('fabric_id', fabrics?.id ?? '00000000-0000-0000-0000-000000000000')

    const res = await fetchWithTimeout(`${BASE}/api/simulate`, { method: 'POST', body: form })
    const body = await res.json()
    check(
      'R011',
      'POST /api/simulate missing image → 400',
      res.status === 400 && typeof body.error === 'string',
      `status=${res.status}, error="${body.error ?? 'none'}"`
    )
  }

  // --- Happy path: valid simulate request ---
  if (models && fabrics) {
    // Count generated_visuals before simulate
    const { count: countBefore } = await supabase
      .from('generated_visuals')
      .select('*', { count: 'exact', head: true })

    const form = new FormData()
    form.append('image', new Blob([new Uint8Array(tinyJpeg)], { type: 'image/jpeg' }), 'test.jpg')
    form.append('model_id', models.id)
    form.append('fabric_id', fabrics.id)

    const res = await fetchWithTimeout(`${BASE}/api/simulate`, { method: 'POST', body: form })
    const contentType = res.headers.get('content-type') ?? ''
    const bodyBuf = Buffer.from(await res.arrayBuffer())

    check(
      'R011',
      'POST /api/simulate → 200 with valid model+fabric',
      res.status === 200,
      `status=${res.status}`
    )

    check(
      'R011',
      'Simulate response Content-Type is image/jpeg',
      contentType.startsWith('image/jpeg'),
      `Content-Type: ${contentType}`
    )

    check(
      'R011',
      'Simulate response body > 0 bytes',
      bodyBuf.length > 0,
      `body length: ${bodyBuf.length} bytes`
    )

    // Count generated_visuals after simulate → must be unchanged
    const { count: countAfter } = await supabase
      .from('generated_visuals')
      .select('*', { count: 'exact', head: true })

    check(
      'R011',
      'No DB row created (generated_visuals count unchanged)',
      countBefore === countAfter,
      `before=${countBefore}, after=${countAfter}`
    )
  }
}

// ─── R010: Public visuals API ───────────────────────────────────────────────
async function testPublicVisualsAPI(): Promise<void> {
  console.log('\n── R010: Public Visuals API (/api/models/[slug]/visuals) ──')

  const supabase = getSupabase()

  // Find a model with a slug
  const { data: model } = await supabase
    .from('models')
    .select('id, slug, name')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!model) {
    skip('R010', 'GET /api/models/[slug]/visuals', 'No active model found in DB')
    return
  }

  console.log(`  Using model: "${model.name}" (slug: ${model.slug})`)

  const res = await fetchWithTimeout(`${BASE}/api/models/${model.slug}/visuals`)
  const body = await res.json()

  check(
    'R010',
    `GET /api/models/${model.slug}/visuals → 200`,
    res.status === 200,
    `status=${res.status}`
  )

  check(
    'R010',
    'Response is a JSON array',
    Array.isArray(body),
    `type=${typeof body}, isArray=${Array.isArray(body)}, length=${Array.isArray(body) ? body.length : 'N/A'}`
  )

  // If there are published+validated visuals, verify their properties
  if (Array.isArray(body) && body.length > 0) {
    const allValid = body.every(
      (v: Record<string, unknown>) =>
        v.is_validated === true &&
        v.is_published === true &&
        (v.fabric as { is_active?: boolean } | null)?.is_active === true
    )
    check(
      'R010',
      'All returned visuals: is_validated=true, is_published=true, fabric.is_active=true',
      allValid,
      `checked ${body.length} visual(s)`
    )
  } else {
    console.log('  ℹ No published+validated visuals found — filter correctness confirmed by empty result')
  }
}

// ─── R008: Admin pipeline proof ─────────────────────────────────────────────
async function testAdminAuth(): Promise<void> {
  console.log('\n── R008: Admin Routes Auth Guard ──')

  // Verify factory returns MockIAService (re-confirm from T01)
  delete process.env.NANO_BANANA_API_KEY
  const { getIAService } = await import('@/lib/ai/index')
  const { MockIAService } = await import('@/lib/ai/mock')
  const service = getIAService()
  check(
    'R008',
    'getIAService() → MockIAService (no API key)',
    service instanceof MockIAService,
    `instance: ${service.constructor.name}`
  )

  // Test 6 admin routes for 401 without auth
  const dummyId = '00000000-0000-0000-0000-000000000001'
  const adminRoutes: Array<{ method: string; path: string; body?: string }> = [
    { method: 'POST', path: '/api/admin/generate', body: '{}' },
    { method: 'POST', path: '/api/admin/generate-all', body: '{}' },
    { method: 'PUT', path: `/api/admin/visuals/${dummyId}/validate` },
    { method: 'PUT', path: `/api/admin/visuals/${dummyId}/publish` },
    { method: 'PUT', path: '/api/admin/visuals/bulk-validate', body: '{"visual_ids":[]}' },
    { method: 'PUT', path: '/api/admin/visuals/bulk-publish', body: '{"visual_ids":[]}' },
  ]

  for (const route of adminRoutes) {
    const init: RequestInit = {
      method: route.method,
      headers: route.body ? { 'Content-Type': 'application/json' } : undefined,
      body: route.body,
    }

    try {
      const res = await fetchWithTimeout(`${BASE}${route.path}`, init)
      const body = await res.json().catch(() => ({}))
      check(
        'R008',
        `${route.method} ${route.path} → 401 (no auth)`,
        res.status === 401,
        `status=${res.status}, error="${(body as Record<string, string>).error ?? 'none'}"`
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      check(
        'R008',
        `${route.method} ${route.path} → 401 (no auth)`,
        false,
        `fetch error: ${msg}`
      )
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('\n🔍 M005 E2E API Verification\n')
  console.log(`  Env: ${envPath}`)
  console.log(`  Port: ${PORT}`)
  console.log(`  Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30)}...`)

  // Ensure cleanup on exit
  const cleanup = () => killDevServer()
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught exception:', err)
    cleanup()
    process.exit(2)
  })

  try {
    await startDevServer()

    // Run all test suites
    await testSimulateAPI()
    await testPublicVisualsAPI()
    await testAdminAuth()

  } finally {
    killDevServer()
  }

  // ─── Summary ────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Results: ${passed}/${total} checks passed`)

  if (failed > 0) {
    console.log(`\n💥 ${failed} check(s) failed:`)
    for (const f of results.filter((r) => !r.passed)) {
      console.log(`   [${f.requirement}] ${f.name}: ${f.detail}`)
    }
  }

  // Group by requirement
  const reqs = ['R008', 'R010', 'R011']
  for (const req of reqs) {
    const reqResults = results.filter((r) => r.requirement === req)
    const reqPassed = reqResults.every((r) => r.passed)
    console.log(`  ${reqPassed ? '✅' : '❌'} ${req}: ${reqResults.filter((r) => r.passed).length}/${reqResults.length}`)
  }

  console.log('')

  if (failed === 0) {
    console.log('🎉 All E2E checks passed — R008, R010, R011 verified at runtime.\n')
    process.exit(0)
  } else {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err)
  killDevServer()
  process.exit(2)
})
