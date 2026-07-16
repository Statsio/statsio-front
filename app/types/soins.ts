/** Reflète la réponse de SoinsController (relais WHO GHO + référentiel géographique statique). */

export type SoinsIndicatorKey = 'physicians' | 'bedsPer1000' | 'uhcIndex' | 'healthExpGDP'

export interface SoinsIndicatorOption {
  key: SoinsIndicatorKey
  label: string
}

export interface ActiveSoinsIndicator {
  key: SoinsIndicatorKey
  label: string
  unit: string
  source: string
  indicatorCode: string
}

export interface SoinsCountryStat {
  label: string
  unit: string
  value: number | null
  year: number | null
}

export interface SoinsCountryPoint {
  iso3: string
  iso2: string
  name: string
  region: string
  lat: number
  lon: number
  population: number
  value: number | null
  year: number | null
  stats: Record<SoinsIndicatorKey, SoinsCountryStat>
}

export interface SoinsListResponse {
  indicator: ActiveSoinsIndicator
  options: SoinsIndicatorOption[]
  countries: SoinsCountryPoint[]
}
