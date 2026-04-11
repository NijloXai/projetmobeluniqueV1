import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'

/**
 * PUT /api/admin/visuals/bulk-publish
 * Publie plusieurs visuels en une seule requête.
 * Seuls les visuels déjà validés sont publiés — les autres sont ignorés.
 * Body : { visual_ids: string[] }
 */
export async function PUT(request: NextRequest) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  let body: { visual_ids?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête JSON invalide.' },
      { status: 400 }
    )
  }

  const { visual_ids } = body

  if (!visual_ids || !Array.isArray(visual_ids) || visual_ids.length === 0) {
    return NextResponse.json(
      { error: 'Le champ visual_ids (tableau non vide) est requis.' },
      { status: 400 }
    )
  }

  // Publier uniquement les visuels déjà validés
  const { data, error } = await supabase!
    .from('generated_visuals')
    .update({ is_published: true })
    .in('id', visual_ids)
    .eq('is_validated', true)
    .select()

  if (error) {
    console.error('[PUT /api/admin/visuals/bulk-publish]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la publication en lot.' },
      { status: 500 }
    )
  }

  console.log(
    `[PUT /api/admin/visuals/bulk-publish] ${data?.length ?? 0}/${visual_ids.length} visuels publiés (seuls les validés)`
  )

  return NextResponse.json({ published: data?.length ?? 0 })
}
