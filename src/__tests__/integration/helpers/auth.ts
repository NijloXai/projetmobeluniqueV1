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

  // Format cookies attendu par @supabase/ssr@0.6.1 createServerClient
  // Le cookie name est sb-<project-ref>-auth-token (project ref = premier segment hostname)
  // Pour http://127.0.0.1:54321, hostname = "127.0.0.1", premier segment = "127"
  // La valeur peut etre passee en JSON brut (< 3180 chars = pas de chunking)
  // OU prefixee "base64-" + base64url — on choisit le JSON brut (plus simple)
  const cookieValue = JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  })
  const cookieName = 'sb-127-auth-token'
  // Passer le JSON directement sans encodage supplementaire
  // @supabase/ssr lit la valeur brute si elle ne commence pas par "base64-"
  const cookieHeader = `${cookieName}=${encodeURIComponent(cookieValue)}`

  return { accessToken, cookieHeader }
}
