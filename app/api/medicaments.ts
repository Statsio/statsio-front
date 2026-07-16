import { publicHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { GenericGroup, Medicament } from '@/types/medicaments'

export async function fetchMedicamentsSearch(query: string): Promise<Medicament[]> {
  const { data } = await publicHttp.get<Medicament[]>(STATSIO_API.medicaments.search(query))
  return data
}

export async function fetchMedicamentGeneriques(libelle: string): Promise<GenericGroup[]> {
  const { data } = await publicHttp.get<GenericGroup[]>(STATSIO_API.medicaments.generiques(libelle))
  return data
}

export async function fetchMedicamentDetail(cis: number | string): Promise<Medicament> {
  const { data } = await publicHttp.get<Medicament>(STATSIO_API.medicaments.one(cis))
  return data
}
