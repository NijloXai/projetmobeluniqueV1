import { describe, it, expect } from 'vitest'
import nextConfig from '../../next.config'

describe('next.config.ts', () => {
  it('contient remotePatterns pour Supabase Storage', () => {
    const patterns = nextConfig.images?.remotePatterns
    expect(patterns).toBeDefined()
    expect(patterns).toHaveLength(1)

    const supabasePattern = patterns![0]
    expect(supabasePattern.protocol).toBe('https')
    expect(supabasePattern.hostname).toBe('**.supabase.co')
    expect(supabasePattern.pathname).toBe('/storage/v1/object/public/**')
  })
})
