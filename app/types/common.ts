/** Une statistique avec sa provenance — convention MédiStats pour toute donnée chiffrée externe
 * (ICD-11, WHO GHO, UMLS...), pour que la source et l'année restent visibles jusqu'à l'UI. */
export interface Sourced<T> {
  value: T
  source: string
  indicatorCode?: string
  year?: number
}

export interface TrendPoint {
  year: number
  value: number
}

/** Symptôme ou facteur de risque enrichi via UMLS, avec la terminologie source (SNOMED CT, MeSH...). */
export interface SourcedLabel {
  label: string
  source: string
}
