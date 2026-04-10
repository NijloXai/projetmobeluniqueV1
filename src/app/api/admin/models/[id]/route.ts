import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { updateModelSchema } from '@/lib/schemas'
import { slugify, extractStoragePath } from '@/lib/utils'
import type { ModelUpdate } from '@/types/database'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * GET /api/admin/models/[id]
 * Détail d'un modèle avec ses images (triées par sort_order).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  const { data, error } = await supabase!
    .from('models')
    .select('*, model_images(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Modèle introuvable.' },
      { status: 404 }
    )
  }

  // Trier les images par sort_order en JS
  if (data.model_images && Array.isArray(data.model_images)) {
    data.model_images.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
  }

  return NextResponse.json(data)
}

/**
 * PUT /api/admin/models/[id]
 * Met à jour un modèle.
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

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête JSON invalide.' },
      { status: 400 }
    )
  }

  // Auto-générer le slug si le nom change et pas de slug explicite
  if (body.name && !body.slug) {
    body.slug = slugify(body.name as string)
  }

  const parsed = updateModelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const updateData: ModelUpdate = { ...parsed.data }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: 'Aucune donnée à mettre à jour.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase!
    .from('models')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Un modèle avec ce slug existe déjà.' },
        { status: 409 }
      )
    }
    console.error('[PUT /api/admin/models]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du modèle.' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Modèle introuvable.' },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

/**
 * DELETE /api/admin/models/[id]
 * Supprime un modèle et nettoie les fichiers du storage (model_images + generated_visuals).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  // Vérifier que le modèle existe
  const { data: model, error: fetchError } = await supabase!
    .from('models')
    .select('id, slug')
    .eq('id', id)
    .single()

  if (fetchError || !model) {
    return NextResponse.json(
      { error: 'Modèle introuvable.' },
      { status: 404 }
    )
  }

  // Récupérer les images du modèle pour nettoyage storage
  const { data: modelImages } = await supabase!
    .from('model_images')
    .select('image_url')
    .eq('model_id', id)

  // Récupérer les visuels générés pour nettoyage storage
  const { data: generatedVisuals } = await supabase!
    .from('generated_visuals')
    .select('generated_image_url')
    .eq('model_id', id)

  // Supprimer les fichiers du bucket model-photos (best effort)
  if (modelImages && modelImages.length > 0) {
    const paths = modelImages
      .map((img) => extractStoragePath(img.image_url))
      .filter((p): p is string => p !== null)

    if (paths.length > 0) {
      const { error: removeError } = await supabase!.storage
        .from('model-photos')
        .remove(paths)
      if (removeError) {
        console.error('[DELETE /api/admin/models/:id] model-photos cleanup:', removeError.message)
      }
    }
  }

  // Supprimer les fichiers du bucket generated-visuals (best effort)
  if (generatedVisuals && generatedVisuals.length > 0) {
    const paths = generatedVisuals
      .map((v) => extractStoragePath(v.generated_image_url))
      .filter((p): p is string => p !== null)

    if (paths.length > 0) {
      const { error: removeError } = await supabase!.storage
        .from('generated-visuals')
        .remove(paths)
      if (removeError) {
        console.error('[DELETE /api/admin/models/:id] generated-visuals cleanup:', removeError.message)
      }
    }
  }

  // Supprimer le modèle (FK cascade supprime model_images et generated_visuals en DB)
  const { error: deleteError } = await supabase!
    .from('models')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('[DELETE /api/admin/models/:id]', deleteError.message)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du modèle.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
