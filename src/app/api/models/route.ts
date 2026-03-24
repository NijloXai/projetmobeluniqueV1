import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/models
 * Liste tous les modèles actifs avec leurs images, triés par date de création.
 * Route publique — filtrée par is_active via RLS + WHERE.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('models')
      .select('*, model_images(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/models] Supabase error:', error.message)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des modèles.' },
        { status: 500 }
      )
    }

    // Trier les images par sort_order dans chaque modèle
    const models = (data ?? []).map((model) => ({
      ...model,
      model_images: (model.model_images ?? []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ),
    }))

    return NextResponse.json(models)
  } catch (err) {
    console.error('[GET /api/models] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
}
