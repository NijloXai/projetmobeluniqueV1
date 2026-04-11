import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { bulkSchema } from '@/lib/schemas'

/**
 * PUT /api/admin/visuals/bulk-publish
 * Publie plusieurs visuels en une seule requête.
 * Seuls les visuels déjà validés sont publiés — les autres sont ignorés.
 * Body : { visual_ids: string[] }
 */
export async function PUT(request: NextRequest) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête JSON invalide.' },
      { status: 400 }
    )
  }

  const parseResult = bulkSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message ?? 'Donnees invalides' },
      { status: 400 }
    )
  }
  const { visual_ids } = parseResult.data

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

  console.info(
    `[PUT /api/admin/visuals/bulk-publish] ${data?.length ?? 0}/${visual_ids.length} visuels publiés (seuls les validés)`
  )

  return NextResponse.json({ published: data?.length ?? 0 })
}
