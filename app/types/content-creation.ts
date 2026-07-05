export type ContentCategory = {
  id: number
  slug: string
  name: string
}

export type CoverageType = 'monde' | 'pays' | 'ville'

export type ContentCoverage = {
  type: CoverageType
  values: string[]
}

export type ContentVisibility = 'private' | 'public'
export type ContentPublishedAs = 'user' | 'channel'

export type ContentType = 'statsdata' | 'article' | 'survey'

export type CreateContentPayload = {
  title: string
  type: ContentType
  categories: string[]
  coverage_type?: CoverageType
  coverage_data?: string[]
  visibility: ContentVisibility
  published_as?: ContentPublishedAs
  channel_id?: number
}

export const CONTINENTS = [
  { value: 'europe',          label: 'Europe' },
  { value: 'amerique-nord',   label: 'Amérique du Nord' },
  { value: 'amerique-sud',    label: 'Amérique du Sud' },
  { value: 'afrique',         label: 'Afrique' },
  { value: 'asie',            label: 'Asie' },
  { value: 'oceanie',         label: 'Océanie' },
  { value: 'antarctique',     label: 'Antarctique' },
] as const

export const ALL_CONTINENT_VALUES = CONTINENTS.map((c) => c.value)

export const MAJOR_FRENCH_CITIES = [
  { value: 'paris',          label: 'Paris' },
  { value: 'marseille',      label: 'Marseille' },
  { value: 'lyon',           label: 'Lyon' },
  { value: 'toulouse',       label: 'Toulouse' },
  { value: 'nice',           label: 'Nice' },
  { value: 'nantes',         label: 'Nantes' },
  { value: 'montpellier',    label: 'Montpellier' },
  { value: 'strasbourg',     label: 'Strasbourg' },
  { value: 'bordeaux',       label: 'Bordeaux' },
  { value: 'lille',          label: 'Lille' },
  { value: 'rennes',         label: 'Rennes' },
  { value: 'reims',          label: 'Reims' },
  { value: 'le-havre',       label: 'Le Havre' },
  { value: 'saint-etienne',  label: 'Saint-Étienne' },
  { value: 'toulon',         label: 'Toulon' },
  { value: 'grenoble',       label: 'Grenoble' },
  { value: 'dijon',          label: 'Dijon' },
  { value: 'angers',         label: 'Angers' },
  { value: 'nimes',          label: 'Nîmes' },
  { value: 'aix-en-provence', label: 'Aix-en-Provence' },
] as const

export const WORLD_COUNTRIES = [
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Allemagne' },
  { value: 'es', label: 'Espagne' },
  { value: 'it', label: 'Italie' },
  { value: 'gb', label: 'Royaume-Uni' },
  { value: 'us', label: 'États-Unis' },
  { value: 'ca', label: 'Canada' },
  { value: 'br', label: 'Brésil' },
  { value: 'cn', label: 'Chine' },
  { value: 'jp', label: 'Japon' },
  { value: 'in', label: 'Inde' },
  { value: 'ru', label: 'Russie' },
  { value: 'au', label: 'Australie' },
  { value: 'mx', label: 'Mexique' },
  { value: 'za', label: 'Afrique du Sud' },
  { value: 'ng', label: 'Nigéria' },
  { value: 'eg', label: 'Égypte' },
  { value: 'ar', label: 'Argentine' },
  { value: 'pl', label: 'Pologne' },
  { value: 'nl', label: 'Pays-Bas' },
  { value: 'be', label: 'Belgique' },
  { value: 'ch', label: 'Suisse' },
  { value: 'pt', label: 'Portugal' },
  { value: 'se', label: 'Suède' },
  { value: 'no', label: 'Norvège' },
  { value: 'dk', label: 'Danemark' },
  { value: 'fi', label: 'Finlande' },
  { value: 'tr', label: 'Turquie' },
  { value: 'sa', label: 'Arabie Saoudite' },
  { value: 'kr', label: 'Corée du Sud' },
] as const
