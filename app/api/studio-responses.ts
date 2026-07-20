import { apiHttp } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'

export type FormAnswerValue = string | string[] | number

export interface BlockResponseOption {
  value: string
  count: number
  percent: number
}

/** Répartition des répondants pour une dimension démographique donnée (voir StudioBlockResponseController::bucketBy). */
export interface DemographicBucket {
  key: string
  label: string
  count: number
  percent: number
}

/**
 * Chaque dimension est indépendamment absente tant que le visiteur consultant la page n'a
 * pas renseigné le champ correspondant sur son propre profil (pas besoin d'un profil 100%
 * complet) — c'est un verrou décidé côté back (voir aggregateWithDemographics), pas
 * seulement un flou cosmétique côté front.
 */
export interface ResponseDemographics {
  age?: DemographicBucket[]
  gender?: DemographicBucket[]
  profession?: DemographicBucket[]
  region?: DemographicBucket[]
}

export interface BlockResponseAggregate {
  totalResponses: number
  options?: BlockResponseOption[]
  average?: number
  distribution?: Record<string, number>
  demographics?: ResponseDemographics
}

export interface BlockResponseState {
  answered: boolean
  myAnswer: FormAnswerValue | null
  aggregate: BlockResponseAggregate
}

export async function fetchBlockResponse(
  slug: string,
  blockId: string,
  respondentToken: string,
): Promise<BlockResponseState> {
  const { data } = await apiHttp.get(STATSIO_API.studioContent.blockResponse(slug, blockId), {
    params: { respondent_token: respondentToken },
  })
  return mapResponseState(data.data)
}

export async function submitBlockResponse(
  slug: string,
  blockId: string,
  payload: { value: FormAnswerValue; respondent_token: string },
): Promise<BlockResponseState> {
  const { data } = await apiHttp.post(STATSIO_API.studioContent.blockResponse(slug, blockId), payload)
  return mapResponseState(data.data)
}

function mapResponseState(raw: Record<string, unknown>): BlockResponseState {
  const aggregate = (raw.aggregate ?? {}) as Record<string, unknown>
  return {
    answered: Boolean(raw.answered),
    myAnswer: (raw.my_answer as FormAnswerValue | null) ?? null,
    aggregate: {
      totalResponses: Number(aggregate.total_responses ?? 0),
      options: (aggregate.options as BlockResponseOption[] | undefined) ?? undefined,
      average: aggregate.average !== undefined && aggregate.average !== null ? Number(aggregate.average) : undefined,
      distribution: (aggregate.distribution as Record<string, number> | undefined) ?? undefined,
      demographics: (aggregate.demographics as ResponseDemographics | undefined) ?? undefined,
    },
  }
}
