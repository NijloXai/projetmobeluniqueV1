import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { getIAService } from '@/lib/ai'
import { extractStoragePath } from '@/lib/utils'

/**
 * POST /api/admin/generate-all
 * Génère les visuels IA pour tous les angles d'un modèle + un tissu donné.
 * Pour chaque model_image, upsert (supprime l'ancien si existant, puis génère).
 */
export async function POST(request: NextRequest) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  let body: { model_id?: string; fabric_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête JSON invalide.' },
      { status: 400 }
    )
  }

  const { model_id, fabric_id } = body

  if (!model_id || !fabric_id) {
    return NextResponse.json(
      { error: 'Les champs model_id et fabric_id sont requis.' },
      { status: 400 }
    )
  }

  try {
    // Récupérer le modèle
    const { data: model, error: modelError } = await supabase!
      .from('models')
      .select('id, slug, name')
      .eq('id', model_id)
      .single()

    if (modelError || !model) {
      console.error('[POST /api/admin/generate-all] Modèle introuvable:', model_id)
      return NextResponse.json(
        { error: 'Modèle introuvable.' },
        { status: 404 }
      )
    }

    // Récupérer le tissu
    const { data: fabric, error: fabricError } = await supabase!
      .from('fabrics')
      .select('id, name')
      .eq('id', fabric_id)
      .single()

    if (fabricError || !fabric) {
      console.error('[POST /api/admin/generate-all] Tissu introuvable:', fabric_id)
      return NextResponse.json(
        { error: 'Tissu introuvable.' },
        { status: 404 }
      )
    }

    // Récupérer tous les angles du modèle
    const { data: modelImages, error: imagesError } = await supabase!
      .from('model_images')
      .select('id, view_type, image_url')
      .eq('model_id', model_id)
      .order('sort_order', { ascending: true })

    if (imagesError || !modelImages?.length) {
      return NextResponse.json(
        { error: 'Aucune photo trouvée pour ce modèle.' },
        { status: 404 }
      )
    }

    const iaService = getIAService()
    const startTime = Date.now()
    const results = []

    for (const modelImage of modelImages) {
      // Upsert : supprimer l'ancien visuel si existant
      const { data: existing } = await supabase!
        .from('generated_visuals')
        .select('id, generated_image_url')
        .eq('model_image_id', modelImage.id)
        .eq('fabric_id', fabric_id)
        .maybeSingle()

      if (existing) {
        const oldPath = extractStoragePath(existing.generated_image_url)
        if (oldPath) {
          await supabase!.storage
            .from('generated-visuals')
            .remove([oldPath])
        }
        await supabase!
          .from('generated_visuals')
          .delete()
          .eq('id', existing.id)
      }

      // Générer le visuel
      const result = await iaService.generate({
        modelName: model.name,
        fabricName: fabric.name,
        viewType: modelImage.view_type,
        sourceImageUrl: modelImage.image_url,
      })

      // Upload
      const storagePath = `${model.slug}/${fabric_id}-${modelImage.id}.${result.extension}`

      const { error: uploadError } = await supabase!.storage
        .from('generated-visuals')
        .upload(storagePath, result.imageBuffer, {
          upsert: true,
          contentType: result.mimeType,
        })

      if (uploadError) {
        console.error(
          `[POST /api/admin/generate-all] Upload échoué pour ${modelImage.view_type}:`,
          uploadError.message
        )
        continue // On continue les autres angles
      }

      const { data: urlData } = supabase!.storage
        .from('generated-visuals')
        .getPublicUrl(storagePath)

      // Insérer en base — mode IA : non validé, non publié
      const { data: visual, error: insertError } = await supabase!
        .from('generated_visuals')
        .insert({
          model_id,
          fabric_id,
          model_image_id: modelImage.id,
          generated_image_url: urlData.publicUrl,
          is_validated: false,
          is_published: false,
        })
        .select()
        .single()

      if (insertError) {
        console.error(
          `[POST /api/admin/generate-all] Insert échoué pour ${modelImage.view_type}:`,
          insertError.message
        )
        continue
      }

      results.push(visual)
    }

    const duration = Date.now() - startTime
    console.log(
      `[POST /api/admin/generate-all] ${results.length}/${modelImages.length} visuels générés en ${duration}ms — ${model.name} / ${fabric.name}`
    )

    return NextResponse.json({
      generated: results,
      total: modelImages.length,
      success: results.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[POST /api/admin/generate-all] Erreur:', message)
    return NextResponse.json(
      { error: `Erreur lors de la génération : ${message}` },
      { status: 500 }
    )
  }
}
