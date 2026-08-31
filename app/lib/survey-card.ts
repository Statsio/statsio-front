import type { CatalogItem } from '@/types/catalog'
import { getPollStatus, type PollStatus } from '@/lib/poll-status'
import { getSurveyKindMeta, type SurveyKindMeta, QUESTION_TYPE_ICONS } from '@/lib/poll-visuals'
import { getOptionColor } from '@/lib/poll-visuals'
import type { BlockType } from '@/types/studio'
import { formatCompactNumber } from '@/lib/format'

export interface SurveyCardMeta {
  kind: SurveyKindMeta
  status: PollStatus
  /** Libellé compact du statut, façon maquette. */
  statusLabel: string
  statusFg: string
  statusDot: string
  participationLabel: string
  timeLabel: string
  timeFg: string
  /** Barres d'options (sondage rapide) — lecture seule. */
  options: { label: string; pct: number; color: string; lead: boolean }[]
  hasMoreOptions: boolean
  moreOptionsLabel: string
  questionTypeIcons: { icon: string; label: string }[]
  /** Progression d'une pétition vers son objectif (0–100), ou null. */
  goalPct: number | null
  goalLabel: string
}

const QTYPE_LABEL: Partial<Record<BlockType, string>> = {
  choice: 'Choix unique',
  checkboxes: 'Choix multiple',
  dropdown: 'Liste déroulante',
  scale: 'Échelle linéaire',
  rating: 'Avis',
}

function fmt(n: number): string {
  return formatCompactNumber(n).replace(/\s/g, ' ')
}

export function surveyCardMeta(item: CatalogItem): SurveyCardMeta {
  const kind = getSurveyKindMeta(item.survey_kind)
  const status = getPollStatus({ response_deadline: item.response_deadline, created_at: item.created_at ?? undefined })
  const closed = item.is_closed || status.closed

  const rawOptions = item.primary_options ?? []
  const lead = rawOptions.reduce((m, o) => Math.max(m, o.pct), 0)
  const options = rawOptions.slice(0, 3).map((o, i) => ({
    label: o.label,
    pct: o.pct,
    color: getOptionColor(i),
    lead: o.pct === lead && lead > 0,
  }))

  const responses = item.responses_count ?? 0
  const isPetition = item.survey_kind === 'petition'
  const goalPct = isPetition && item.petition_goal
    ? Math.min(100, Math.round((responses / item.petition_goal) * 100))
    : null

  return {
    kind,
    status,
    statusLabel: closed ? 'CLOS' : 'OUVERT',
    statusFg: closed ? 'rgba(24,24,31,0.5)' : '#047857',
    statusDot: closed ? 'rgba(24,24,31,0.3)' : '#059669',
    participationLabel: isPetition
      ? `${fmt(responses)} signature${responses > 1 ? 's' : ''}`
      : `${fmt(responses)} réponse${responses > 1 ? 's' : ''}`,
    timeLabel: closed ? 'Clôturé' : status.label,
    timeFg: closed ? 'rgba(24,24,31,0.5)' : 'var(--color-primary)',
    options,
    hasMoreOptions: rawOptions.length > 3,
    moreOptionsLabel: `+ ${rawOptions.length - 3} autres réponses`,
    questionTypeIcons: (item.question_types ?? []).slice(0, 4).map((t) => ({
      icon: QUESTION_TYPE_ICONS[t as BlockType] ?? '•',
      label: QTYPE_LABEL[t as BlockType] ?? t,
    })),
    goalPct,
    goalLabel: item.petition_goal ? `objectif ${fmt(item.petition_goal)}` : '',
  }
}
