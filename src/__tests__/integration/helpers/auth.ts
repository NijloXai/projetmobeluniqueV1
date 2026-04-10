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
  // Le cookie name est sb-<project-ref>-auth-token par defaut
  // Pour l'instance locale, le project ref est "agent-ab074def" dans config.toml
  const cookieValue = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  })
  // @supabase/ssr utilise un cookie chunke : sb-<ref>-auth-token.0, sb-<ref>-auth-token.1, etc.
  // Pour les tests, un seul cookie base64-encoded suffit si le chunk est < 3180 chars
  const cookieName = 'sb-127-auth-token'
  const encoded = Buffer.from(cookieValue).toString('base64')
  const cookieHeader = `${cookieName}=${encoded}`

  return { accessToken, cookieHeader }
}
