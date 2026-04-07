import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIAService } from '@/lib/ai'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 Mo (D-10)

/**
 * POST /api/simulate
 * Route publique — simule un canapé dans un tissu donné.
 * Accepte FormData : image (File), model_id (string), fabric_id (string, optionnel).
 * Retourne un JPEG binaire avec filigrane. Pas de ligne en base, résultat éphémère.
 */
export async function POST(request: NextRequest) {
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
  const modelId = (formData.get('model_id') as string | null)?.trim()
  const fabricId = (formData.get('fabric_id') as string | null)?.trim()

  // Validation des champs requis
  if (!image || image.size === 0) {
    return NextResponse.json(
      { error: "L'image du salon est requise." },
      { status: 400 }
    )
  }

  if (image.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "L'image ne doit pas dépasser 15 Mo." },
      { status: 400 }
    )
  }

  if (!modelId) {
    return NextResponse.json(
      { error: 'Le champ model_id est requis.' },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()

    // Récupérer le modèle (nom pour le prompt)
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('id, name')
      .eq('id', modelId)
      .single()

    if (modelError || !model) {
      return NextResponse.json(
        { error: 'Modèle introuvable.' },
        { status: 404 }
      )
    }

    // Récupérer le tissu conditionnellement (D-16 : tissu optionnel)
    let fabricName = 'tissu original'
    if (fabricId) {
      const { data: fabric, error: fabricError } = await supabase
        .from('fabrics')
        .select('id, name')
        .eq('id', fabricId)
        .single()

      if (fabricError || !fabric) {
        return NextResponse.json(
          { error: 'Tissu introuvable.' },
          { status: 404 }
        )
      }
      fabricName = fabric.name
    }

    // Convertir l'image uploadée en URL data pour le service IA
    const imageBuffer = Buffer.from(await image.arrayBuffer())
    const sourceImageUrl = `data:${image.type};base64,${imageBuffer.toString('base64')}`

    // Générer le visuel via le service IA
    const iaService = getIAService()
    let resultBuffer: Buffer
    try {
      const result = await iaService.generate({
        modelName: model.name,
        fabricName,
        viewType: 'simulation',
        sourceImageUrl,
      })
      resultBuffer = await iaService.addWatermark(
        result.imageBuffer,
        'MÖBEL UNIQUE — Aperçu'
      )
    } catch (genErr) {
      const genMessage = genErr instanceof Error ? genErr.message : ''
      if (
        genMessage.includes('compression format') ||
        genMessage.includes('unsupported image format')
      ) {
        return NextResponse.json(
          {
            error:
              'Ce format HEIC ne peut pas être traité. Convertissez votre photo en JPEG et réessayez.',
          },
          { status: 422 }
        )
      }
      throw genErr // Re-throw pour le catch externe
    }

    // Retourner l'image binaire — pas de JSON, pas de ligne en base
    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(resultBuffer.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[POST /api/simulate] Erreur:', message)
    return NextResponse.json(
      { error: `Erreur lors de la simulation : ${message}` },
      { status: 500 }
    )
  }
}
