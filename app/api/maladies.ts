import { publicHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { Maladie, MaladiePopulaire, MaladieSuggestion } from '@/types/maladies'

export async function fetchMaladiesSearch(query: string): Promise<MaladieSuggestion[]> {
  const { data } = await publicHttp.get<MaladieSuggestion[]>(STATSIO_API.maladies.search(query))
  return data
}

export async function fetchMaladiesPopulaires(): Promise<MaladiePopulaire[]> {
  const { data } = await publicHttp.get<MaladiePopulaire[]>(STATSIO_API.maladies.populaires)
  return data
}

export async function fetchMaladieDetail(id: string): Promise<Maladie> {
  const { data } = await publicHttp.get<Maladie>(STATSIO_API.maladies.one(id))
  return data
}
