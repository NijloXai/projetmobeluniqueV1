import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { imagesUploadBodySchema } from '@/lib/schemas'
import type { ModelImageInsert } from '@/types/database'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 Mo

/**
 * GET /api/admin/models/[id]/images
 * Liste les images d'un modèle, triées par sort_order.
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
    return NextResponse.json(
      { error: 'Modèle introuvable.' },
      { status: 404 }
    )
  }

  const { data, error } = await supabase!
    .from('model_images')
    .select('*')
    .eq('model_id', id)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[GET /api/admin/models/:id/images]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des images.' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

/**
 * POST /api/admin/models/[id]/images
 * Upload une image de modèle vers le bucket model-photos.
 * Accepte FormData avec : image (File), view_type (string), sort_order (integer).
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
    return NextResponse.json(
      { error: 'FormData invalide.' },
      { status: 400 }
    )
  }

  const image = formData.get('image') as File | null
  const viewTypeRaw = (formData.get('view_type') as string | null)?.trim()
  const sortOrderRaw = formData.get('sort_order') as string | null

  // Validation : fichier requis
  if (!image || image.size === 0) {
    return NextResponse.json(
      { error: "Le fichier image est requis." },
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

  // Validation view_type et sort_order via Zod
  const bodyParse = imagesUploadBodySchema.safeParse({
    view_type: viewTypeRaw,
    sort_order: sortOrderRaw ? parseInt(sortOrderRaw, 10) : undefined,
  })
  if (!bodyParse.success) {
    return NextResponse.json(
      { error: bodyParse.error.issues[0]?.message ?? 'Donnees invalides' },
      { status: 400 }
    )
  }
  const viewType = bodyParse.data.view_type
  const sortOrder = bodyParse.data.sort_order ?? 0

  // Upload vers le bucket model-photos
  const ext = image.name.split('.').pop() || 'jpg'
  const storagePath = `${model.slug}/${viewType}-${sortOrder}.${ext}`

  const { error: uploadError } = await supabase!.storage
    .from('model-photos')
    .upload(storagePath, image, { upsert: true, contentType: image.type })

  if (uploadError) {
    console.error('[POST /api/admin/models/:id/images] upload:', uploadError.message)
    return NextResponse.json(
      { error: `Erreur upload image : ${uploadError.message}` },
      { status: 500 }
    )
  }

  // Récupérer l'URL publique
  const { data: urlData } = supabase!.storage
    .from('model-photos')
    .getPublicUrl(storagePath)

  // Insérer en base de données
  const insertData: ModelImageInsert = {
    model_id: id,
    image_url: urlData.publicUrl,
    view_type: viewType,
    sort_order: sortOrder,
  }

  const { data, error } = await supabase!
    .from('model_images')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('[POST /api/admin/models/:id/images]', error.message)
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de l'image." },
      { status: 500 }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
