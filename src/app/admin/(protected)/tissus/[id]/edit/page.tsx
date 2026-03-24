import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FabricForm } from '../../FabricForm'
import type { Fabric } from '@/types/database'

export default async function EditFabricPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: fabric, error } = await supabase
    .from('fabrics')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !fabric) {
    notFound()
  }

  // Récupérer les catégories existantes pour le combobox
  const { data: catData } = await supabase
    .from('fabrics')
    .select('category')
    .not('category', 'is', null)
    .order('category')

  const categories = [...new Set(
    (catData ?? [])
      .map((row: { category: string | null }) => row.category)
      .filter((c): c is string => c !== null && c.trim() !== '')
  )]

  return <FabricForm fabric={fabric as Fabric} categories={categories} />
}
