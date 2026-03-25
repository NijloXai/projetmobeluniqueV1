import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { extractStoragePath } from '@/lib/utils'

/**
 * DELETE /api/admin/models/[id]/visuals/[visualId]
 * Supprime un visuel généré (storage + base de données).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; visualId: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id, visualId } = await params

  // Récupérer le visuel pour obtenir l'URL storage
  const { data: visual, error: fetchError } = await supabase!
    .from('generated_visuals')
    .select('*')
    .eq('id', visualId)
    .eq('model_id', id)
    .single()

  if (fetchError || !visual) {
    console.error('[DELETE /api/admin/models/:id/visuals/:visualId] Visuel introuvable:', visualId, 'pour modèle:', id)
    return NextResponse.json(
      { error: 'Visuel introuvable pour ce modèle.' },
      { status: 404 }
    )
  }

  // Supprimer le fichier du storage (best effort)
  const storagePath = extractStoragePath(visual.generated_image_url)
  if (storagePath) {
    const { error: removeError } = await supabase!.storage
      .from('generated-visuals')
      .remove([storagePath])
    if (removeError) {
      console.error(
        '[DELETE /api/admin/models/:id/visuals/:visualId] generated-visuals cleanup:',
        removeError.message
      )
    }
  }

  // Supprimer la ligne en base de données
  const { error: deleteError } = await supabase!
    .from('generated_visuals')
    .delete()
    .eq('id', visualId)
    .eq('model_id', id)

  if (deleteError) {
    console.error('[DELETE /api/admin/models/:id/visuals/:visualId]', deleteError.message)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du visuel.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
