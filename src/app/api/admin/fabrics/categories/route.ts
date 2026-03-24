import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/admin/fabrics/categories
 * Retourne les catégories distinctes des tissus existants.
 * Utilisé pour le combobox dans le formulaire.
 */
export async function GET() {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { data, error } = await supabase!
    .from('fabrics')
    .select('category')
    .not('category', 'is', null)
    .order('category')

  if (error) {
    console.error('[GET /api/admin/fabrics/categories]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catégories.' },
      { status: 500 }
    )
  }

  // Dédupliquer côté serveur
  const categories = [...new Set(
    (data ?? [])
      .map((row: { category: string | null }) => row.category)
      .filter((c): c is string => c !== null && c.trim() !== '')
  )]

  return NextResponse.json(categories)
}
