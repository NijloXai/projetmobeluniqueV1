import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Vérifie que l'utilisateur est authentifié (admin).
 * Retourne le client Supabase si OK, ou une NextResponse 401 si non authentifié.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      supabase: null,
      user: null,
      error: NextResponse.json(
        { error: 'Non authentifié. Connectez-vous pour accéder à cette ressource.' },
        { status: 401 }
      ),
    }
  }

  return { supabase, user, error: null }
}
