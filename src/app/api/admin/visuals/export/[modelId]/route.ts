import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/admin'
import archiver from 'archiver'
import { Readable } from 'node:stream'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const runtime = 'nodejs'

/**
 * GET /api/admin/visuals/export/[modelId]
 * Exporte un ZIP de tous les visuels validés d'un modèle.
 * Fichiers nommés {model.slug}-{fabric.slug}-{view_type}.jpg
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const { supabase, error: authError } = await requireAdmin()
  if (authError) return authError

  const { modelId } = await params

  if (!UUID_REGEX.test(modelId)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  // Fetch model for slug + name (used in filename)
  const { data: model, error: modelError } = await supabase!
    .from('models')
    .select('id, slug, name')
    .eq('id', modelId)
    .single()

  if (modelError || !model) {
    return NextResponse.json(
      { error: 'Modèle introuvable.' },
      { status: 404 }
    )
  }

  // Fetch validated visuals with fabric and model_image relations
  const { data: visuals, error: visualsError } = await supabase!
    .from('generated_visuals')
    .select('id, generated_image_url, fabrics:fabric_id(name, slug), model_images:model_image_id(view_type)')
    .eq('model_id', modelId)
    .eq('is_validated', true)

  if (visualsError) {
    console.error('[GET /api/admin/visuals/:modelId/export]', visualsError.message)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des visuels.' },
      { status: 500 }
    )
  }

  if (!visuals || visuals.length === 0) {
    return NextResponse.json(
      { error: 'Aucun rendu validé pour ce produit.' },
      { status: 404 }
    )
  }

  // Create zip archive with store mode (no compression — images are already compressed)
  const archive = archiver('zip', { store: true })

  // Track filenames to handle potential duplicates
  const usedNames = new Set<string>()

  for (const visual of visuals) {
    // Supabase returns relations as nested objects for many-to-one FKs
    const fabric = visual.fabrics as unknown as { name: string; slug: string } | null
    const modelImage = visual.model_images as unknown as { view_type: string } | null

    if (!fabric || !modelImage) {
      console.warn(
        `[GET /api/admin/visuals/:modelId/export] Missing relation data for visual ${visual.id}, skipping`
      )
      continue
    }

    // Build filename: {model.slug}-{fabric.slug}-{view_type}.jpg
    const baseName = `${model.slug}-${fabric.slug}-${modelImage.view_type}`
    let fileName = `${baseName}.jpg`

    // Handle duplicate filenames by appending counter
    let counter = 1
    while (usedNames.has(fileName)) {
      fileName = `${baseName}-${counter}.jpg`
      counter++
    }
    usedNames.add(fileName)

    try {
      const response = await fetch(visual.generated_image_url)
      if (!response.ok) {
        console.warn(
          `[GET /api/admin/visuals/:modelId/export] Failed to fetch image ${visual.generated_image_url} (HTTP ${response.status}), skipping`
        )
        continue
      }
      const buffer = Buffer.from(await response.arrayBuffer())
      archive.append(buffer, { name: fileName })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(
        `[GET /api/admin/visuals/:modelId/export] Error fetching image ${visual.generated_image_url}: ${msg}, skipping`
      )
      continue
    }
  }

  // Finalize the archive (signals no more files will be added)
  archive.finalize()

  // Convert Node Readable stream to Web ReadableStream for the Response
  const webStream = Readable.toWeb(archive as unknown as Readable) as ReadableStream

  return new Response(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${model.slug}-visuels.zip"`,
    },
  })
}
