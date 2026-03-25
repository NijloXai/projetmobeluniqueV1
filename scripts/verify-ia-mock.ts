/**
 * verify-ia-mock.ts — Standalone IA mock runtime proof
 *
 * Validates that MockIAService produces real image buffers,
 * the factory returns the correct provider, and prompt templates
 * return non-empty strings. Exits 0 only if all checks pass.
 *
 * Usage: npx tsx scripts/verify-ia-mock.ts
 */

import { MockIAService } from '@/lib/ai/mock'
import { getIAService } from '@/lib/ai/index'
import { buildBackOfficePrompt, buildSimulatePrompt } from '@/lib/ai/prompts'

interface CheckResult {
  name: string
  passed: boolean
  detail: string
}

const results: CheckResult[] = []

function check(name: string, passed: boolean, detail: string): void {
  results.push({ name, passed, detail })
  const icon = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`  ${icon}: ${name} — ${detail}`)
}

async function main(): Promise<void> {
  console.log('\n🔍 IA Mock Runtime Verification\n')

  // --- Check 1: MockIAService.generate() produces valid JPEG ---
  console.log('Phase 1: MockIAService.generate()')
  const mock = new MockIAService()
  const result = await mock.generate({
    modelName: 'Canapé Oslo',
    fabricName: 'Velours Bleu',
    viewType: 'face',
    sourceImageUrl: 'https://example.com/placeholder.jpg',
  })

  const jpegMagic = result.imageBuffer[0] === 0xff && result.imageBuffer[1] === 0xd8
  check(
    'generate() → valid JPEG magic bytes (FF D8)',
    jpegMagic,
    `first bytes: ${result.imageBuffer[0]?.toString(16).toUpperCase()} ${result.imageBuffer[1]?.toString(16).toUpperCase()}`
  )

  check(
    'generate() → buffer size > 1000 bytes',
    result.imageBuffer.length > 1000,
    `size: ${result.imageBuffer.length} bytes`
  )

  check(
    'generate() → mimeType is image/jpeg',
    result.mimeType === 'image/jpeg',
    `mimeType: ${result.mimeType}`
  )

  // --- Check 2: addWatermark() produces a distinct, larger buffer ---
  console.log('\nPhase 2: MockIAService.addWatermark()')
  const watermarked = await mock.addWatermark(result.imageBuffer)

  const buffersDiffer = !result.imageBuffer.equals(watermarked)
  check(
    'addWatermark() → output differs from input',
    buffersDiffer,
    `input: ${result.imageBuffer.length}B, output: ${watermarked.length}B`
  )

  check(
    'addWatermark() → output size > input size',
    watermarked.length > result.imageBuffer.length,
    `${watermarked.length} > ${result.imageBuffer.length}`
  )

  // --- Check 3: Factory returns MockIAService when no API key ---
  console.log('\nPhase 3: getIAService() factory')
  // Ensure the env var is unset for this test
  delete process.env.NANO_BANANA_API_KEY
  const service = getIAService()
  const isMock = service instanceof MockIAService
  check(
    'getIAService() → returns MockIAService (no API key)',
    isMock,
    `instance: ${service.constructor.name}`
  )

  // --- Check 4: Prompt templates return non-empty strings ---
  console.log('\nPhase 4: Prompt templates (R016)')
  const backOffice = buildBackOfficePrompt('Oslo', 'Velours Bleu', 'face')
  check(
    'buildBackOfficePrompt() → non-empty string',
    typeof backOffice === 'string' && backOffice.length > 0,
    `length: ${backOffice.length} chars`
  )

  const simulate = buildSimulatePrompt('Oslo', 'Velours Bleu')
  check(
    'buildSimulatePrompt() → non-empty string',
    typeof simulate === 'string' && simulate.length > 0,
    `length: ${simulate.length} chars`
  )

  // --- Summary ---
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Results: ${passed}/${total} checks passed`)

  if (passed === total) {
    console.log('🎉 All checks passed — IA mock service is fully operational.\n')
    process.exit(0)
  } else {
    const failed = results.filter((r) => !r.passed)
    console.log(`\n💥 ${failed.length} check(s) failed:`)
    for (const f of failed) {
      console.log(`   - ${f.name}: ${f.detail}`)
    }
    console.log('')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err)
  process.exit(2)
})
