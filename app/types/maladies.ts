/** Reflète la réponse de MaladiesController (relais ICD-11 + WHO GHO + UMLS optionnel). */
import type { SourcedLabel, TrendPoint } from '@/types/common'

export interface MaladieSuggestion {
  id: string
  name: string
}

export interface MaladiePopulaire {
  id: string
  code: string | null
  name: string
  category: string | null
  value: number | null
  year: number | null
  evolutionPercent: number | null
  trend: TrendPoint[]
}

export interface MaladieStats {
  value: number
  year: number
  trend: TrendPoint[]
  source: string
  indicatorCode: string
}

export interface MaladieTopCountry {
  iso3: string
  iso2: string
  name: string
  lat: number
  lon: number
  value: number
  year: number
}

export interface ClassificationSource {
  source: string
  releaseId: string
}

export interface Maladie {
  id: string
  code: string | null
  name: string
  definition: string | null
  synonyms: string[]
  inclusions: string[]
  classKind: string | null
  chapter: string | null
  block: string | null
  childIds: string[]
  classificationSource: ClassificationSource
  stats: MaladieStats | null
  indicatorUnit: string | null
  topCountries: MaladieTopCountry[]
  symptoms: SourcedLabel[] | null
  riskFactors: SourcedLabel[] | null
}
