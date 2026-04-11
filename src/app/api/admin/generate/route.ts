export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import { getIAService } from '@/lib/ai'
import { ImageSafetyError } from '@/lib/ai/nano-banana'
import { generateSchema } from '@/lib/schemas'

/**
 * POST /api/admin/generate
 * Génère un visuel IA pour un (model_id, model_image_id, fabric_id).
 * Gère l'upsert : si un visuel existe déjà, supprime l'ancien + fichier storage, puis recrée.
 */
export async function POST(request: NextRequest) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête JSON invalide.' },
      { status: 400 }
    )
  }

  const parseResult = generateSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message ?? 'Donnees invalides' },
      { status: 400 }
    )
  }
  const { model_id, model_image_id, fabric_id } = parseResult.data

  try {
    // Récupérer le modèle (besoin du slug pour le chemin storage + nom pour le prompt)
    const { data: model, error: modelError } = await supabase!
      .from('models')
      .select('id, slug, name')
      .eq('id', model_id)
      .single()

    if (modelError || !model) {
      console.error('[POST /api/admin/generate] Modèle introuvable:', model_id)
      return NextResponse.json(
        { error: 'Modèle introuvable.' },
        { status: 404 }
      )
    }

    // Récupérer le model_image (besoin du view_type + image_url)
    const { data: modelImage, error: imageError } = await supabase!
      .from('model_images')
      .select('id, view_type, image_url')
      .eq('id', model_image_id)
      .eq('model_id', model_id)
      .single()

    if (imageError || !modelImage) {
      console.error('[POST /api/admin/generate] Image modèle introuvable:', model_image_id)
      return NextResponse.json(
        { error: "L'angle sélectionné n'appartient pas à ce modèle." },
        { status: 404 }
      )
    }

    // Récupérer le tissu (besoin du nom pour le prompt)
    const { data: fabric, error: fabricError } = await supabase!
      .from('fabrics')
      .select('id, name')
      .eq('id', fabric_id)
      .single()

    if (fabricError || !fabric) {
      console.error('[POST /api/admin/generate] Tissu introuvable:', fabric_id)
      return NextResponse.json(
        { error: 'Tissu introuvable.' },
        { status: 404 }
      )
    }

    // Upsert : supprimer l'ancien visuel si existant
    const { data: existing } = await supabase!
      .from('generated_visuals')
      .select('id, generated_image_url')
      .eq('model_image_id', model_image_id)
      .eq('fabric_id', fabric_id)
      .maybeSingle()

    if (existing) {
      // Supprimer le fichier storage (best effort)
      const { extractStoragePath } = await import('@/lib/utils')
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

    // Générer le visuel via le service IA
    const startTime = Date.now()
    const iaService = getIAService()
    const result = await iaService.generate({
      modelName: model.name,
      fabricName: fabric.name,
      viewType: modelImage.view_type,
      sourceImageUrl: modelImage.image_url,
    })
    const duration = Date.now() - startTime

    // Upload vers le bucket generated-visuals
    const storagePath = `${model.slug}/${fabric_id}-${model_image_id}.${result.extension}`

    const { error: uploadError } = await supabase!.storage
      .from('generated-visuals')
      .upload(storagePath, result.imageBuffer, {
        upsert: true,
        contentType: result.mimeType,
      })

    if (uploadError) {
      console.error('[POST /api/admin/generate] Upload:', uploadError.message)
      return NextResponse.json(
        { error: `Erreur lors de l'upload du visuel : ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase!.storage
      .from('generated-visuals')
      .getPublicUrl(storagePath)

    // Insérer en base — mode IA : non validé, non publié
    const { data: visual, error: insertError } = await supabase!
      .from('generated_visuals')
      .insert({
        model_id,
        fabric_id,
        model_image_id,
        generated_image_url: urlData.publicUrl,
        is_validated: false,
        is_published: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[POST /api/admin/generate]', insertError.message)
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement du visuel." },
        { status: 500 }
      )
    }

    console.info(
      `[POST /api/admin/generate] Généré en ${duration}ms, ${result.imageBuffer.length} octets — ${model.name} / ${fabric.name} / ${modelImage.view_type}`
    )

    return NextResponse.json(visual, { status: 201 })
  } catch (err) {
    // Erreurs specifiques IA
    if (err instanceof ImageSafetyError) {
      return NextResponse.json(
        { error: err.message },
        { status: 422 }
      )
    }

    const message = err instanceof Error ? err.message : 'Erreur inconnue'

    // Timeout (AbortError ou message explicite) (per D-05)
    if (
      (err instanceof Error && err.name === 'AbortError') ||
      message.includes('trop de temps') ||
      message.includes('aborted')
    ) {
      return NextResponse.json(
        { error: 'La generation a pris trop de temps. Veuillez reessayer.' },
        { status: 504 }
      )
    }

    console.error('[POST /api/admin/generate] Erreur:', message)
    return NextResponse.json(
      { error: `Erreur lors de la generation : ${message}` },
      { status: 500 }
    )
  }
}
