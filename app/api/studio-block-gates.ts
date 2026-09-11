import { publicHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { BlockType } from '@/types/studio'

export interface RequiredOffer {
  id: number
  key: string
  name: string
}

interface RawBlockGates {
  premium_block_types: string[]
  premium_block_offers: Record<string, RequiredOffer>
}

export interface BlockGates {
  types: BlockType[]
  offerByType: Partial<Record<BlockType, RequiredOffer>>
}

/**
 * Types de blocs réservés à une offre payante + l'offre réelle (CRUD Offres) qui
 * débloque chacun — classification gérée en back-office. Endpoint public.
 */
export async function fetchBlockGates(): Promise<BlockGates> {
  const { data } = await publicHttp.get<{ success: boolean; data: RawBlockGates }>(
    STATSIO_API.studioContent.blockGates,
  )

  return {
    types: (data.data?.premium_block_types ?? []) as BlockType[],
    offerByType: (data.data?.premium_block_offers ?? {}) as Partial<Record<BlockType, RequiredOffer>>,
  }
}
