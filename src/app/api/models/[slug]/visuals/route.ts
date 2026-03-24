import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/models/[slug]/visuals
 * Récupère les rendus visuels publiés pour un modèle donné.
 * Chaque rendu inclut les infos du tissu associé.
 * Filtré par is_validated + is_published + fabric.is_active.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // D'abord vérifier que le modèle existe et est actif
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (modelError || !model) {
      return NextResponse.json(
        {
          error: `Modèle "${slug}" introuvable.`,
          fallback: true,
          catalogue: '/api/models',
        },
        { status: 404 }
      )
    }

    // Récupérer les rendus validés + publiés avec tissu actif
    const { data: visuals, error: visualsError } = await supabase
      .from('generated_visuals')
      .select('*, fabric:fabrics(*), model_image:model_images(*)')
      .eq('model_id', model.id)
      .eq('is_validated', true)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (visualsError) {
      console.error('[GET /api/models/[slug]/visuals] Supabase error:', visualsError.message)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des rendus.' },
        { status: 500 }
      )
    }

    // Filtrer côté serveur : ne garder que les tissus actifs
    const filteredVisuals = (visuals ?? []).filter(
      (v: Record<string, unknown>) => {
        const fabric = v.fabric as { is_active: boolean } | null
        return fabric?.is_active === true
      }
    )

    return NextResponse.json(filteredVisuals)
  } catch (err) {
    console.error('[GET /api/models/[slug]/visuals] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
}
