import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * PUT /api/admin/visuals/[id]/publish
 * Publie un visuel généré (is_published = true).
 * Le visuel doit être validé au préalable — sinon 403.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  // Vérifier que le visuel existe et récupérer son état
  const { data: visual, error: fetchError } = await supabase!
    .from('generated_visuals')
    .select('id, is_validated')
    .eq('id', id)
    .single()

  if (fetchError || !visual) {
    console.error('[PUT /api/admin/visuals/:id/publish] Visuel introuvable:', id)
    return NextResponse.json(
      { error: 'Visuel introuvable.' },
      { status: 404 }
    )
  }

  // Vérifier la validation préalable
  if (!visual.is_validated) {
    return NextResponse.json(
      { error: 'Le rendu doit être validé avant publication.' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase!
    .from('generated_visuals')
    .update({ is_published: true })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[PUT /api/admin/visuals/:id/publish]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la publication.' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
