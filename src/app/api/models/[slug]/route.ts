import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/models/[slug]
 * Récupère un modèle actif par son slug, avec ses images.
 * Fallback : si le slug n'existe pas, retourne 404 + lien vers le catalogue.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('models')
      .select('*, model_images(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error: `Modèle "${slug}" introuvable.`,
          fallback: true,
          catalogue: '/api/models',
        },
        { status: 404 }
      )
    }

    // Trier les images par sort_order
    const model = {
      ...data,
      model_images: (data.model_images ?? []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ),
    }

    return NextResponse.json(model)
  } catch (err) {
    console.error('[GET /api/models/[slug]] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
}
