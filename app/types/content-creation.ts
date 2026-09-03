import type { CategorySubBrand, SubBrand } from '@/types/sub-brand'

export type ContentCategory = {
  id: number
  slug: string
  name: string
  /** Sous-marque de rattachement (`all` = disponible partout). */
  sub_brand?: CategorySubBrand
}

/**
 * Échelle de couverture géographique d'un contenu — une portée unique, du mondial
 * au local. Remplace l'ancien couple type (monde/pays/ville) + liste de codes.
 * Miroir de `App\Domain\Content\Enums\ContentCoverageEnum`.
 */
export type ContentCoverage =
  | 'mondiale'
  | 'continentale'
  | 'nationale'
  | 'regionale'
  | 'locale'

export const CONTENT_COVERAGE_OPTIONS: { value: ContentCoverage; label: string }[] = [
  { value: 'mondiale', label: 'Mondiale' },
  { value: 'continentale', label: 'Continentale' },
  { value: 'nationale', label: 'Nationale' },
  { value: 'regionale', label: 'Régionale' },
  { value: 'locale', label: 'Locale' },
]

export type ContentPublishedAs = 'user' | 'channel'

export type ContentType = 'statsdata' | 'article' | 'survey'

/** Format d'un sondage — repris de la maquette « Sondages Listing v2 ». */
export type SurveyKind = 'single_question' | 'long' | 'petition'

export const SURVEY_KIND_OPTIONS: {
  value: SurveyKind
  label: string
  description: string
  icon: string
}[] = [
  {
    value: 'single_question',
    label: 'Sondage rapide',
    description: 'Une seule question, un vote en un clic, résultats en direct.',
    icon: '⚡',
  },
  {
    value: 'long',
    label: 'Questionnaire',
    description: 'Plusieurs questions (choix multiple, échelle, réponse libre).',
    icon: '☰',
  },
  {
    value: 'petition',
    label: 'Pétition',
    description: 'Un texte à signer, un objectif de signatures, un destinataire.',
    icon: '✍',
  },
]

export type CreateContentPayload = {
  title: string
  type: ContentType
  categories: string[]
  sub_brand: SubBrand
  coverage?: ContentCoverage
  survey_kind?: SurveyKind
  requires_identity_verification?: boolean
}
