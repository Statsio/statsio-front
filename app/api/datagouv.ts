import { apiHttp } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'

/** Organisation propriétaire d'un jeu de données data.gouv.fr. */
export interface DataGouvOrganization {
  name: string | null
  page_url: string | null
}

/** Résumé d'un jeu de données renvoyé par la recherche. */
export interface DataGouvDatasetSummary {
  id: string | null
  slug: string
  title: string
  page_url: string
  organization: DataGouvOrganization
  last_update: string | null
  resources_count: number
}

/** Une ressource (fichier) d'un jeu de données. */
export interface DataGouvResource {
  id: string
  title: string
  format: string
  filesize: number | null
  /** true si la ressource est exposée par l'API tabulaire et donc importable. */
  tabular_available: boolean
  /** URL tabular-api à ingérer, présente uniquement si `tabular_available`. */
  tabular_url: string | null
}

/** Détail complet d'un jeu de données + ses ressources. */
export interface DataGouvDatasetDetail {
  id: string | null
  slug: string
  title: string
  description: string | null
  page_url: string
  organization: DataGouvOrganization
  last_update: string | null
  resources: DataGouvResource[]
  /** Ressource à pré-sélectionner quand la référence pointait vers `#/resources/{id}`. */
  preselect_resource_id: string | null
}

export interface DataGouvSearchResult {
  total: number
  page: number
  page_size: number
  datasets: DataGouvDatasetSummary[]
}

/** Recherche de jeux de données dans le catalogue data.gouv.fr (via le proxy backend). */
export async function searchDataGouvDatasets(q: string, page = 1): Promise<DataGouvSearchResult> {
  const { data } = await apiHttp.get<{ success: boolean; data: DataGouvSearchResult }>(
    STATSIO_API.dataSources.datagouvSearch,
    { params: { q, page } },
  )
  return data.data
}

/** Détail d'un jeu de données data.gouv.fr à partir d'un id, d'un slug ou d'une URL collée. */
export async function fetchDataGouvDataset(ref: string): Promise<DataGouvDatasetDetail> {
  const { data } = await apiHttp.get<{ success: boolean; data: DataGouvDatasetDetail }>(
    STATSIO_API.dataSources.datagouvDataset,
    { params: { ref } },
  )
  return data.data
}
