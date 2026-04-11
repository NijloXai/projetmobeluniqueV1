import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { bulkSchema } from '@/lib/schemas'

/**
 * PUT /api/admin/visuals/bulk-validate
 * Valide plusieurs visuels en une seule requête.
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

  console.info(
    `[PUT /api/admin/visuals/bulk-validate] ${data?.length ?? 0}/${visual_ids.length} visuels validés`
  )

  return NextResponse.json({ validated: data?.length ?? 0 })
}
