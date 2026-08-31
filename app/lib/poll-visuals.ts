import type { BlockType, StudioBlock } from '@/types/studio'
import type { BlockResponseAggregate } from '@/api/studio-responses'

export const QUESTION_TYPE_LABELS: Partial<Record<BlockType, string>> = {
  choice: 'Choix unique',
  checkboxes: 'Choix multiple',
  dropdown: 'Liste déroulante',
  scale: 'Échelle linéaire',
  rating: 'Avis',
}

export function getQuestionTypeLabel(type?: BlockType): string {
  return (type && QUESTION_TYPE_LABELS[type]) || 'Sondage'
}

/** Icônes compactes par type de question, pour les cartes de questionnaire. */
export const QUESTION_TYPE_ICONS: Partial<Record<BlockType, string>> = {
  choice: '◉',
  checkboxes: '☑',
  dropdown: '▾',
  scale: '▤',
  rating: '★',
}

export type SurveyKind = 'single_question' | 'long' | 'petition'

export interface SurveyKindMeta {
  label: string
  icon: string
  /** Texte sur pastille */
  fg: string
  bg: string
  /** Liseré / accent de carte */
  accent: string
}

/** Repris de `KIND_STYLE` de la maquette « Sondages Listing v2 ». */
export const SURVEY_KIND_META: Record<SurveyKind, SurveyKindMeta> = {
  single_question: { label: 'Sondage rapide', icon: '⚡', fg: '#2563eb', bg: '#eaf1fe', accent: '#3b82f6' },
  long: { label: 'Questionnaire', icon: '☰', fg: '#7c3aed', bg: '#f2ecfd', accent: '#8b5cf6' },
  petition: { label: 'Pétition', icon: '✍', fg: '#be123c', bg: '#fdeef1', accent: '#e11d48' },
}

export function getSurveyKindMeta(kind?: string | null): SurveyKindMeta {
  return SURVEY_KIND_META[(kind ?? 'single_question') as SurveyKind] ?? SURVEY_KIND_META.single_question
}

interface CategoryPalette {
  solid: string
  stripeLight: string
  stripeDark: string
}

/** Couples clair/foncé repris du design (stripes diagonales par carte) — cyclés par hash, pas liés à un nom de catégorie précis. */
const PALETTE: CategoryPalette[] = [
  { solid: '#8b5cf6', stripeLight: '#f2ecfd', stripeDark: '#ece4fb' },
  { solid: '#3b82f6', stripeLight: '#eaf1fe', stripeDark: '#dceafd' },
  { solid: '#10b981', stripeLight: '#f0fbf3', stripeDark: '#e0f7e6' },
  { solid: '#f59e0b', stripeLight: '#fff6e0', stripeDark: '#ffedc2' },
  { solid: '#e11d48', stripeLight: '#fdeef1', stripeDark: '#fbe0e0' },
]

function hash(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

export function getCategoryPalette(category: string): CategoryPalette {
  return PALETTE[hash(category || 'Sondage') % PALETTE.length] ?? PALETTE[0]!
}

export function getCategoryStripeBackground(category: string, spacing = 14): string {
  const { stripeLight, stripeDark } = getCategoryPalette(category)
  return `repeating-linear-gradient(45deg, ${stripeLight}, ${stripeLight} ${spacing}px, ${stripeDark} ${spacing}px, ${stripeDark} ${spacing * 2}px)`
}

/** Couleur d'une option dans une barre segmentée multi-options, cyclée sur la même palette. */
export function getOptionColor(index: number): string {
  return (PALETTE[index % PALETTE.length] ?? PALETTE[0]!).solid
}

/** Normalise l'agrégat d'un bloc de formulaire (options nommées, distribution numérique, ou config brute) en paires label/pourcentage. */
export function buildPollOptions(aggregate: BlockResponseAggregate, block: StudioBlock): { label: string; pct: number }[] {
  if (aggregate.options?.length) {
    return aggregate.options.map((o) => ({ label: o.value, pct: o.percent }))
  }
  if (aggregate.distribution) {
    const total = aggregate.totalResponses || Object.values(aggregate.distribution).reduce((a, b) => a + b, 0)
    return Object.entries(aggregate.distribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([key, count]) => ({
        label: block.type === 'rating' ? `${key} ★` : key,
        pct: total ? Math.round((count / total) * 100) : 0,
      }))
  }
  return (block.config.formOptions ?? []).map((label) => ({ label, pct: 0 }))
}
