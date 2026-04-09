/**
 * Tests Phase 15 : requireAdmin() unitaire (D-01)
 *
 * Mock @/lib/supabase/server pour controler auth.getUser().
 * Verifie 3 cas : token absent, token expire, user authentifie.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock du client server — controle ce que auth.getUser() retourne
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    // Stub from() pour que le client Supabase retourne soit complet
    from: vi.fn(),
  })),
}))

// Import APRES les mocks (pattern etabli)
const { requireAdmin } = await import('@/lib/supabase/admin')

describe('requireAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne error 401 si token absent (user null)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const result = await requireAdmin()
    expect(result.error).not.toBeNull()
    expect(result.supabase).toBeNull()
    expect(result.user).toBeNull()
    expect((result.error as Response).status).toBe(401)
    // Verifier le message francais
    const json = await (result.error as Response).json()
    expect(json.error).toContain('authentifi')
  })

  it('retourne error 401 si getUser retourne une erreur (token expire)', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired' },
    })
    const result = await requireAdmin()
    expect(result.error).not.toBeNull()
    expect(result.supabase).toBeNull()
    expect(result.user).toBeNull()
    expect((result.error as Response).status).toBe(401)
  })

  it('retourne supabase valide si user authentifie', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-user-id', email: 'admin@example.com' } },
      error: null,
    })
    const result = await requireAdmin()
    expect(result.error).toBeNull()
    expect(result.supabase).not.toBeNull()
    expect(result.user).toBeDefined()
    expect(result.user?.id).toBe('admin-user-id')
  })
})
