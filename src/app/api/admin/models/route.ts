import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { createModelSchema } from '@/lib/schemas'
import { slugify } from '@/lib/utils'
import type { ModelInsert } from '@/types/database'

/**
 * GET /api/admin/models
 * Liste tous les modèles avec le nombre d'images (admin — pas de filtre is_active).
 */
export async function GET() {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { data, error } = await supabase!
    .from('models')
    .select('*, model_images(count)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/admin/models]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des modèles.' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

/**
 * POST /api/admin/models
 * Crée un nouveau modèle (canapé).
 */
export async function POST(request: NextRequest) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête JSON invalide.' },
      { status: 400 }
    )
  }

  // Auto-générer le slug si vide
  if (!body.slug && body.name) {
    body.slug = slugify(body.name as string)
  }

  const parsed = createModelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const insertData: ModelInsert = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description ?? null,
    price: parsed.data.price,
    dimensions: parsed.data.dimensions ?? null,
    shopify_url: parsed.data.shopify_url || null,
    is_active: parsed.data.is_active ?? true,
  }

  const { data, error } = await supabase!
    .from('models')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Un modèle avec le slug "${insertData.slug}" existe déjà.` },
        { status: 409 }
      )
    }
    console.error('[POST /api/admin/models]', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de la création du modèle.' },
      { status: 500 }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
