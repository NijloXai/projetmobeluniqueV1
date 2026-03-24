import { createClient } from '@/lib/supabase/server'
import { FabricList } from './FabricList'
import type { Fabric } from '@/types/database'

export default async function TissusPage() {
  const supabase = await createClient()
  const { data: fabrics } = await supabase
    .from('fabrics')
    .select('*')
    .order('created_at', { ascending: false })

  return <FabricList initialFabrics={(fabrics ?? []) as Fabric[]} />
}
