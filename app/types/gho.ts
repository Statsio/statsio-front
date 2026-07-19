/** Formes GHO OData communes aux domaines pays et soins — évite de les redéfinir dans chacun. */
import type { TrendPoint } from '@/types/common'

export type { TrendPoint }

export interface GhoTrend {
  value: number
  year: number
  trend: TrendPoint[]
}

export interface CategoryMetric {
  key: string
  label: string
  unit: string
  value: number | null
  sub: string
}

export interface CategoryRankingItem {
  rank: number
  iso3: string
  name: string
  barWidth: string
  valueLabel: string
}

export interface HealthCategory {
  id: string
  label: string
  color: string
  tint: string
}

export interface HealthCategoryDetail {
  metrics: CategoryMetric[]
  ranking: CategoryRankingItem[]
  hasTrend: boolean
  trendTitle: string | null
  trend: GhoTrend | null
}

export interface CountrySoinsData {
  categories: HealthCategory[]
  byCategory: Record<string, HealthCategoryDetail>
}
