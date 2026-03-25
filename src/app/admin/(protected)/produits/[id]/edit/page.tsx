import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ModelForm } from '../../ModelForm'
import type { ModelWithImages } from '@/types/database'

export default async function EditModelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('models')
    .select('*, model_images(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  // Sort images by sort_order ascending
  const model: ModelWithImages = {
    ...data,
    model_images: [...(data.model_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }

  return <ModelForm model={model} />
}
