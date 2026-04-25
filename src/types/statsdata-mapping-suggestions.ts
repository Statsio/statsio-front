import type { StatsDataNormalizationMapping } from '@/types/statsdata-query'

export type StatsDataMappingSuggestionField = {
  path: string
  kind: 'number' | 'string' | 'boolean' | 'null' | 'mixed'
  examples: string[]
}

export type StatsDataNormalizationMappingSuggestions = {
  suggestedMapping: StatsDataNormalizationMapping
  detected: {
    rowPath: string | null
    rowCountSampled: number
    fieldCount: number
  }
  fields: StatsDataMappingSuggestionField[]
  rowPathOptions: string[]
}

