import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { extractStoragePath } from '@/lib/utils'
import type { ModelImageUpdate } from '@/types/database'

/**
 * PUT /api/admin/models/[id]/images/[imageId]
 * Met à jour les métadonnées d'une image (view_type, sort_order).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id, imageId } = await params

  // Parser le body JSON
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête JSON invalide.' },
      { status: 400 }
    )
  }

  // Construire les données de mise à jour
  const updateData: ModelImageUpdate = {}

  if (typeof body.view_type === 'string') {
    const viewType = body.view_type.trim()
    if (!viewType) {
      return NextResponse.json(
        { error: 'Le champ view_type ne peut pas être vide.' },
        { status: 400 }
      )
    }
    updateData.view_type = viewType
  }

  if (body.sort_order !== undefined) {
    const sortOrder = typeof body.sort_order === 'string'
      ? parseInt(body.sort_order, 10)
      : body.sort_order
    if (typeof sortOrder !== 'number' || isNaN(sortOrder) || sortOrder < 0 || !Number.isInteger(sortOrder)) {
      return NextResponse.json(
        { error: 'Le champ sort_order doit être un entier positif ou nul.' },
        { status: 400 }
      )
    }
    updateData.sort_order = sortOrder
  }

  // Vérifier qu'au moins un champ est fourni
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: 'Aucune donnée à mettre à jour. Fournissez view_type ou sort_order.' },
      { status: 400 }
    )
  }

  // Mettre à jour l'image (filtrée par model_id pour sécurité)
  const { data, error } = await supabase!
    .from('model_images')
    .update(updateData)
    .eq('id', imageId)
    .eq('model_id', id)
    .select()
    .single()

  if (error) {
    // Aucune ligne trouvée = 404
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Image introuvable pour ce modèle.' },
        { status: 404 }
      )
    }
    console.error('[PUT /api/admin/models/:id/images/:imageId]', error.message)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'image." },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Image introuvable pour ce modèle.' },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

/**
 * DELETE /api/admin/models/[id]/images/[imageId]
 * Supprime une image du modèle (DB + storage).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id, imageId } = await params

  // Récupérer l'image pour obtenir l'URL storage
  const { data: image, error: fetchError } = await supabase!
    .from('model_images')
    .select('*')
    .eq('id', imageId)
    .eq('model_id', id)
    .single()

  if (fetchError || !image) {
    return NextResponse.json(
      { error: 'Image introuvable pour ce modèle.' },
      { status: 404 }
    )
  }

  // Supprimer le fichier du storage (best effort)
  const storagePath = extractStoragePath(image.image_url)
  if (storagePath) {
    const { error: removeError } = await supabase!.storage
      .from('model-photos')
      .remove([storagePath])
    if (removeError) {
      console.error(
        '[DELETE /api/admin/models/:id/images/:imageId] model-photos cleanup:',
        removeError.message
      )
    }
  }

  // Supprimer la ligne en base de données
  const { error: deleteError } = await supabase!
    .from('model_images')
    .delete()
    .eq('id', imageId)
    .eq('model_id', id)

  if (deleteError) {
    console.error('[DELETE /api/admin/models/:id/images/:imageId]', deleteError.message)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'image." },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
