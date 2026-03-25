import { createClient } from '@/lib/supabase/server'
import { ModelList } from './ModelList'
import type { Model } from '@/types/database'

export default async function ProduitsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('models')
    .select('*, model_images(id)')
    .order('created_at', { ascending: false })

  const models = (data ?? []).map(({ model_images, ...model }) => ({
    ...(model as Model),
    image_count: Array.isArray(model_images) ? model_images.length : 0,
  }))

  return <ModelList initialModels={models} />
}
