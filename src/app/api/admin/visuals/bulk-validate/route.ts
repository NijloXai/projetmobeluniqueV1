import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'

/**
 * PUT /api/admin/visuals/bulk-validate
 * Valide plusieurs visuels en une seule requête.
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

  const { data, error } = await supabase!
    .from('generated_visuals')
    .update({ is_validated: true })
    .in('id', visual_ids)
    .select()

  if (error) {
    console.error('[PUT /api/admin/visuals/bulk-validate]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la validation en lot.' },
      { status: 500 }
    )
  }

  console.log(
    `[PUT /api/admin/visuals/bulk-validate] ${data?.length ?? 0}/${visual_ids.length} visuels validés`
  )

  return NextResponse.json({ validated: data?.length ?? 0 })
}
