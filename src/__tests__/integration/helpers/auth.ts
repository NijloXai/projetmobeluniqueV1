import { anonClient } from './supabase-admin'

export async function loginAsAdmin(): Promise<{ accessToken: string; cookieHeader: string }> {
  const { data, error } = await anonClient.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  if (error || !data.session) {
    throw new Error(`Auth failed: ${error?.message ?? 'no session'}`)
  }

  const accessToken = data.session.access_token
  const refreshToken = data.session.refresh_token

  // Format cookies attendu par @supabase/ssr createServerClient
  // Cookie name: sb-<project-ref>-auth-token (project ref = "127" pour localhost)
  // Valeur JSON brute via encodeURIComponent (pas base64)
  const cookieValue = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  })
  const cookieName = 'sb-127-auth-token'
  const cookieHeader = `${cookieName}=${encodeURIComponent(cookieValue)}`

  return { accessToken, cookieHeader }
}
