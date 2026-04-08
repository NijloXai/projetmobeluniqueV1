export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { getIAService } from '@/lib/ai'
import { ImageSafetyError } from '@/lib/ai/nano-banana'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 Mo (D-10)

// Rate-limit en memoire par IP — 5 appels/minute (D-04)
// Limitation connue : reset au cold start Vercel (Redis differe v12+)
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }
  entry.count++
  return { allowed: true, retryAfter: 0 }
}

/**
 * POST /api/simulate
 * Route publique — simule un canapé dans un tissu donné.
 * Accepte FormData : image (File), model_id (string), fabric_id (string, optionnel).
 * Retourne un JPEG binaire avec filigrane. Pas de ligne en base, résultat éphémère.
 */
export async function POST(request: NextRequest) {
  // Rate-limit par IP (per D-04, D-18 : pas de rate-limit sur admin)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  const { allowed, retryAfter } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: `Trop de demandes. Reessayez dans ${retryAfter} secondes.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

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

    // Resize systematique avant envoi Gemini — evite payload > 20 Mo (per IA-04)
    const rawImageBuffer = Buffer.from(await image.arrayBuffer())
    const resizedBuffer = await sharp(rawImageBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()
    const sourceImageUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`

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

      // Format HEIC non supporte
      if (
        genMessage.includes('compression format') ||
        genMessage.includes('unsupported image format')
      ) {
        return NextResponse.json(
          {
            error:
              'Ce format HEIC ne peut pas etre traite. Convertissez votre photo en JPEG et reessayez.',
          },
          { status: 422 }
        )
      }

      // IMAGE_SAFETY (per D-01)
      if (genErr instanceof ImageSafetyError) {
        return NextResponse.json(
          { error: genErr.message },
          { status: 422 }
        )
      }

      // Timeout (per D-05)
      if (
        (genErr instanceof Error && genErr.name === 'AbortError') ||
        genMessage.includes('trop de temps') ||
        genMessage.includes('aborted')
      ) {
        return NextResponse.json(
          { error: 'La generation a pris trop de temps. Veuillez reessayer.' },
          { status: 504 }
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
