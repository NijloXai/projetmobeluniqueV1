import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { updateFabricSchema } from '@/lib/schemas'
import { slugify, extractStoragePath } from '@/lib/utils'
import type { FabricUpdate } from '@/types/database'

/**
 * GET /api/admin/fabrics/[id]
 * Détail d'un tissu (admin).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params

  const { data, error } = await supabase!
    .from('fabrics')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Tissu introuvable.' },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

/**
 * PUT /api/admin/fabrics/[id]
 * Met à jour un tissu. Gère l'upload swatch + photo ref via FormData.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const contentType = request.headers.get('content-type') ?? ''
  let body: Record<string, unknown>

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    body = {}

    const name = formData.get('name') as string | null
    const slug = formData.get('slug') as string | null
    const category = formData.get('category') as string | null
    const isPremium = formData.get('is_premium') as string | null
    const isActive = formData.get('is_active') as string | null

    if (name !== null) body.name = name
    if (slug !== null) body.slug = slug
    if (category !== null) body.category = category || null
    if (isPremium !== null) body.is_premium = isPremium === 'true'
    if (isActive !== null) body.is_active = isActive === 'true'

    // Upload swatch (max 2MB)
    const swatch = formData.get('swatch') as File | null
    if (swatch && swatch.size > 0) {
      if (swatch.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Le swatch ne doit pas dépasser 2 Mo.' },
          { status: 400 }
        )
      }
      const fileSlug = (slug || name) ? slugify((slug || name) as string) : id
      const ext = swatch.name.split('.').pop() || 'jpg'
      const path = `${fileSlug}-swatch.${ext}`
      const { error: uploadError } = await supabase!.storage
        .from('fabric-swatches')
        .upload(path, swatch, { upsert: true, contentType: swatch.type })
      if (uploadError) {
        console.error('[PUT /api/admin/fabrics] swatch upload:', uploadError.message)
        return NextResponse.json(
          { error: `Erreur upload swatch : ${uploadError.message}` },
          { status: 500 }
        )
      }
      const { data: urlData } = supabase!.storage
        .from('fabric-swatches')
        .getPublicUrl(path)
      body.swatch_url = urlData.publicUrl
    }

    // Upload photo référence (max 5MB)
    const reference = formData.get('reference_image') as File | null
    if (reference && reference.size > 0) {
      if (reference.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'La photo de référence ne doit pas dépasser 5 Mo.' },
          { status: 400 }
        )
      }
      const fileSlug = (slug || name) ? slugify((slug || name) as string) : id
      const ext = reference.name.split('.').pop() || 'jpg'
      const path = `${fileSlug}-reference.${ext}`
      const { error: uploadError } = await supabase!.storage
        .from('fabric-references')
        .upload(path, reference, { upsert: true, contentType: reference.type })
      if (uploadError) {
        console.error('[PUT /api/admin/fabrics] reference upload:', uploadError.message)
        return NextResponse.json(
          { error: `Erreur upload photo référence : ${uploadError.message}` },
          { status: 500 }
        )
      }
      const { data: signedData, error: signError } = await supabase!.storage
        .from('fabric-references')
        .createSignedUrl(path, 3600)
      if (!signError && signedData) {
        body.reference_image_url = signedData.signedUrl
      }
    }
  } else {
    body = await request.json()
  }

  // Auto-générer le slug si le nom change et pas de slug explicite
  if (body.name && !body.slug) {
    body.slug = slugify(body.name as string)
  }

  const parsed = updateFabricSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const updateData: FabricUpdate = { ...parsed.data }
  if (body.swatch_url) updateData.swatch_url = body.swatch_url as string
  if (body.reference_image_url) updateData.reference_image_url = body.reference_image_url as string

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: 'Aucune donnée à mettre à jour.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase!
    .from('fabrics')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Un tissu avec ce slug existe déjà.` },
        { status: 409 }
      )
    }
    console.error('[PUT /api/admin/fabrics]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du tissu.' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Tissu introuvable.' },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

/**
 * DELETE /api/admin/fabrics/[id]
 * Supprime un tissu et ses images du storage.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params

  // Récupérer le tissu pour connaître les URLs des images à supprimer
  const { data: fabric, error: fetchError } = await supabase!
    .from('fabrics')
    .select('slug, swatch_url, reference_image_url')
    .eq('id', id)
    .single()

  if (fetchError || !fabric) {
    return NextResponse.json(
      { error: 'Tissu introuvable.' },
      { status: 404 }
    )
  }

  // Supprimer les images du storage (best effort)
  if (fabric.swatch_url) {
    const path = extractStoragePath(fabric.swatch_url)
    if (path) {
      await supabase!.storage.from('fabric-swatches').remove([path])
    }
  }
  if (fabric.reference_image_url) {
    const path = extractStoragePath(fabric.reference_image_url)
    if (path) {
      await supabase!.storage.from('fabric-references').remove([path])
    }
  }

  // Supprimer le tissu
  const { error: deleteError } = await supabase!
    .from('fabrics')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('[DELETE /api/admin/fabrics]', deleteError.message)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du tissu.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
