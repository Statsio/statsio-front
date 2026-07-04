import { apiHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'

export interface SourceProvenance {
  id: number
  slug: string
  name: string
}

export async function fetchSourceProvenances(): Promise<SourceProvenance[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: SourceProvenance[] }>(
    STATSIO_API.sourceProvenances.collection,
  )
  return data.data
}
