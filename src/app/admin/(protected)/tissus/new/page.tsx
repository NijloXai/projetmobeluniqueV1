import { createClient } from '@/lib/supabase/server'
import { FabricForm } from '../FabricForm'

export default async function NewFabricPage() {
  const supabase = await createClient()

  // Récupérer les catégories existantes pour le combobox
  const { data } = await supabase
    .from('fabrics')
    .select('category')
    .not('category', 'is', null)
    .order('category')

  const categories = [...new Set(
    (data ?? [])
      .map((row: { category: string | null }) => row.category)
      .filter((c): c is string => c !== null && c.trim() !== '')
  )]

  return <FabricForm categories={categories} />
}
