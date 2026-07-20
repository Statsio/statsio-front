import { publicHttp } from '@/lib/http'
import { STATSIO_API } from '@/api/statsio-endpoints'
import type { GenericGroup, Medicament, MedicamentVentesTrend, TopVenteMedicament } from '@/types/medicaments'

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

/** Rejette (404) si Open Medic n'a aucune donnée de ventes pour ce médicament — cas normal (non remboursé). */
export async function fetchMedicamentVentes(cis: number | string): Promise<MedicamentVentesTrend> {
  const { data } = await publicHttp.get<MedicamentVentesTrend>(STATSIO_API.medicaments.ventes(cis))
  return data
}

export async function fetchMedicamentsTopVentes(): Promise<TopVenteMedicament[]> {
  const { data } = await publicHttp.get<{ results: TopVenteMedicament[] }>(STATSIO_API.medicaments.topVentes)
  return data.results
}

/** null si aucune image trouvée (médicament sans article Wikipédia) — pas une erreur. */
export async function fetchMedicamentImage(nom: string): Promise<string | null> {
  const { data } = await publicHttp.get<{ url: string | null }>(STATSIO_API.medicaments.image(nom))
  return data.url
}
