import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import type { GeneratedVisualInsert } from '@/types/database'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 Mo

/**
 * GET /api/admin/models/[id]/visuals
 * Liste les visuels générés d'un modèle avec les données tissu jointes,
 * triés par date de création décroissante.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params

  // Vérifier que le modèle existe
  const { data: model, error: modelError } = await supabase!
    .from('models')
    .select('id, slug')
    .eq('id', id)
    .single()

  if (modelError || !model) {
    console.error('[GET /api/admin/models/:id/visuals] Modèle introuvable:', id)
    return NextResponse.json(
      { error: 'Modèle introuvable.' },
      { status: 404 }
    )
  }

  const { data, error } = await supabase!
    .from('generated_visuals')
    .select('*, fabric:fabrics(*)')
    .eq('model_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/admin/models/:id/visuals]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des visuels.' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

/**
 * POST /api/admin/models/[id]/visuals
 * Upload un rendu visuel (mode classique) vers le bucket generated-visuals.
 * Accepte FormData avec : image (File), fabric_id (string), model_image_id (string).
 * Insère avec is_validated=true et is_published=true (mode classique — pas de validation IA).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params

  // Vérifier que le modèle existe (besoin du slug pour le chemin storage)
  const { data: model, error: modelError } = await supabase!
    .from('models')
    .select('id, slug')
    .eq('id', id)
    .single()

  if (modelError || !model) {
    console.error('[POST /api/admin/models/:id/visuals] Modèle introuvable:', id)
    return NextResponse.json(
      { error: 'Modèle introuvable.' },
      { status: 404 }
    )
  }

  // Parser le FormData
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    console.error('[POST /api/admin/models/:id/visuals] FormData invalide')
    return NextResponse.json(
      { error: 'FormData invalide.' },
      { status: 400 }
    )
  }

  const image = formData.get('image') as File | null
  const fabricId = (formData.get('fabric_id') as string | null)?.trim()
  const modelImageId = (formData.get('model_image_id') as string | null)?.trim()

  // Validation : fichier requis
  if (!image || image.size === 0) {
    return NextResponse.json(
      { error: 'Le fichier image est requis.' },
      { status: 400 }
    )
  }

  // Validation : taille max 5 Mo
  if (image.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "L'image ne doit pas dépasser 5 Mo." },
      { status: 400 }
    )
  }

  // Validation : fabric_id requis
  if (!fabricId) {
    return NextResponse.json(
      { error: 'Le champ fabric_id est requis.' },
      { status: 400 }
    )
  }

  // Validation : model_image_id requis
  if (!modelImageId) {
    return NextResponse.json(
      { error: 'Le champ model_image_id est requis.' },
      { status: 400 }
    )
  }

  // Vérifier que le model_image_id appartient bien à ce modèle
  const { data: modelImage, error: imageError } = await supabase!
    .from('model_images')
    .select('id')
    .eq('id', modelImageId)
    .eq('model_id', id)
    .single()

  if (imageError || !modelImage) {
    console.error('[POST /api/admin/models/:id/visuals] model_image_id invalide:', modelImageId, 'pour modèle:', id)
    return NextResponse.json(
      { error: "L'angle sélectionné n'appartient pas à ce modèle." },
      { status: 400 }
    )
  }

  // Upload vers le bucket generated-visuals
  const ext = image.name.split('.').pop() || 'jpg'
  const storagePath = `${model.slug}/${fabricId}-${modelImageId}.${ext}`

  const { error: uploadError } = await supabase!.storage
    .from('generated-visuals')
    .upload(storagePath, image, { upsert: true, contentType: image.type })

  if (uploadError) {
    console.error('[POST /api/admin/models/:id/visuals] upload:', uploadError.message)
    return NextResponse.json(
      { error: `Erreur lors de l'upload du visuel : ${uploadError.message}` },
      { status: 500 }
    )
  }

  // Récupérer l'URL publique
  const { data: urlData } = supabase!.storage
    .from('generated-visuals')
    .getPublicUrl(storagePath)

  // Insérer en base de données — mode classique : validé et publié immédiatement
  const insertData: GeneratedVisualInsert = {
    model_id: id,
    fabric_id: fabricId,
    model_image_id: modelImageId,
    generated_image_url: urlData.publicUrl,
    is_validated: true,
    is_published: true,
  }

  const { data, error } = await supabase!
    .from('generated_visuals')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('[POST /api/admin/models/:id/visuals]', error.message)
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du visuel." },
      { status: 500 }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
