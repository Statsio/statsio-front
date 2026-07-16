/** Reflète la réponse de PaysController (relais WHO GHO + référentiel géographique statique). */
import type { TrendPoint } from '@/types/common'

export type IndicatorKey = 'lifeExp' | 'healthExp' | 'physicians' | 'u5mort'

export interface IndicatorOption {
  key: IndicatorKey
  label: string
}

export interface ActiveIndicator {
  key: IndicatorKey
  label: string
  unit: string
  source: string
  indicatorCode: string
}

export interface CountryStat {
  label: string
  unit: string
  value: number | null
  year: number | null
}

export interface CountryCardTopDisease {
  id: string
  code: string | null
  name: string | null
  /** Centile de rang mondial (parmi les pays reportant l'indicateur) — plus bas = plus touché. */
  percentile: number
}

export interface CountryMapPoint {
  iso3: string
  iso2: string
  name: string
  region: string
  lat: number
  lon: number
  population: number
  value: number | null
  year: number | null
  stats: Record<IndicatorKey, CountryStat>
  topDisease: CountryCardTopDisease | null
}

export interface PaysListResponse {
  indicator: ActiveIndicator
  options: IndicatorOption[]
  countries: CountryMapPoint[]
}

export interface CountryTile {
  key: IndicatorKey
  label: string
  unit: string
  value: number | null
  year: number | null
  source: string
  indicatorCode: string
}

export interface CountryTopDisease {
  id: string
  code: string | null
  name: string
  rank: number
  total: number
  percentile: number
  source: string
  indicatorCode: string
}

export interface CountryTrend {
  value: number
  year: number
  trend: TrendPoint[]
}

export interface PaysDetail {
  iso3: string
  name: string
  region: string
  tiles: CountryTile[]
  lifeExpectancyTrend: CountryTrend | null
  topDiseases: CountryTopDisease[]
}
