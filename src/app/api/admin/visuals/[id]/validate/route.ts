import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'

/**
 * PUT /api/admin/visuals/[id]/validate
 * Valide un visuel généré (is_validated = true).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params

  const { data, error } = await supabase!
    .from('generated_visuals')
    .update({ is_validated: true })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[PUT /api/admin/visuals/:id/validate]', error.message)
    return NextResponse.json(
      { error: 'Visuel introuvable ou erreur lors de la validation.' },
      { status: error.code === 'PGRST116' ? 404 : 500 }
    )
  }

  return NextResponse.json(data)
}
