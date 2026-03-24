import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { createFabricSchema } from '@/lib/schemas'
import { slugify } from '@/lib/utils'
import type { FabricInsert } from '@/types/database'

/**
 * GET /api/admin/fabrics
 * Liste tous les tissus (admin — pas de filtre is_active).
 */
export async function GET() {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { data, error } = await supabase!
    .from('fabrics')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/admin/fabrics]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tissus.' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

/**
 * POST /api/admin/fabrics
 * Crée un nouveau tissu. Gère l'upload swatch + photo ref via FormData.
 */
export async function POST(request: NextRequest) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const contentType = request.headers.get('content-type') ?? ''
  let body: Record<string, unknown>

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    body = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      category: formData.get('category') as string || null,
      is_premium: formData.get('is_premium') === 'true',
      is_active: formData.get('is_active') !== 'false',
    }

    // Upload swatch (max 2MB)
    const swatch = formData.get('swatch') as File | null
    if (swatch && swatch.size > 0) {
      if (swatch.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Le swatch ne doit pas dépasser 2 Mo.' },
          { status: 400 }
        )
      }
      const slug = (body.slug as string) || slugify(body.name as string)
      const ext = swatch.name.split('.').pop() || 'jpg'
      const path = `${slug}-swatch.${ext}`
      const { error: uploadError } = await supabase!.storage
        .from('fabric-swatches')
        .upload(path, swatch, { upsert: true, contentType: swatch.type })
      if (uploadError) {
        console.error('[POST /api/admin/fabrics] swatch upload:', uploadError.message)
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
      const slug = (body.slug as string) || slugify(body.name as string)
      const ext = reference.name.split('.').pop() || 'jpg'
      const path = `${slug}-reference.${ext}`
      const { error: uploadError } = await supabase!.storage
        .from('fabric-references')
        .upload(path, reference, { upsert: true, contentType: reference.type })
      if (uploadError) {
        console.error('[POST /api/admin/fabrics] reference upload:', uploadError.message)
        return NextResponse.json(
          { error: `Erreur upload photo référence : ${uploadError.message}` },
          { status: 500 }
        )
      }
      // Bucket privé → URL signée (1h)
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

  // Auto-générer le slug si vide
  if (!body.slug && body.name) {
    body.slug = slugify(body.name as string)
  }

  const parsed = createFabricSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const insertData: FabricInsert = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    category: parsed.data.category ?? null,
    is_premium: parsed.data.is_premium ?? false,
    is_active: parsed.data.is_active ?? true,
    swatch_url: (body.swatch_url as string) ?? null,
    reference_image_url: (body.reference_image_url as string) ?? null,
  }

  const { data, error } = await supabase!
    .from('fabrics')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Un tissu avec le slug "${insertData.slug}" existe déjà.` },
        { status: 409 }
      )
    }
    console.error('[POST /api/admin/fabrics]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la création du tissu.' },
      { status: 500 }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
