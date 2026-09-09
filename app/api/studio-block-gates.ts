import { publicHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { BlockType } from '@/types/studio'

interface RawBlockGates {
  premium_block_types: string[]
}

/** Types de blocs réservés à l'offre Premium (classification gérée en back-office). Endpoint public. */
export async function fetchPremiumBlockTypes(): Promise<BlockType[]> {
  const { data } = await publicHttp.get<{ success: boolean; data: RawBlockGates }>(
    STATSIO_API.studioContent.blockGates,
  )

  return (data.data?.premium_block_types ?? []) as BlockType[]
}
