import type { CatalogFacet, CatalogItem, SurveyKind, SurveyStatusFilter } from '@/types/catalog'
import type { DsPieSegment } from '@/lib/ds/pie'
import { formatShortDate } from '@/lib/format'

/**
 * Logique pure du listing des sondages (charte « Tranches ») : types de
 * consultation, état (ouvert / clos, clôture), « cadran » de la carte (camembert
 * des réponses, anneau des questions, jauge de signatures), appel à l'action et
 * filtres actifs. Les rubriques et les tris sont partagés (`lib/listing-rubrics`).
 */

export const SURVEY_KINDS: {
  value: SurveyKind
  label: string
  /** pluriel en minuscules, pour les phrases (« 3 sondages rapides ») */
  many: string
  cta: string
  unit: { one: string; many: string }
}[] = [
  {
    value: 'single_question',
    label: 'Sondage rapide',
    many: 'sondages rapides',
    cta: 'Voter',
    unit: { one: 'réponse', many: 'réponses' },
  },
  {
    value: 'long',
    label: 'Questionnaire',
    many: 'questionnaires',
    cta: 'Répondre',
    unit: { one: 'participant', many: 'participants' },
  },
  {
    value: 'petition',
    label: 'Pétition',
    many: 'pétitions',
    cta: 'Signer',
    unit: { one: 'signature', many: 'signatures' },
  },
]

export function surveyKindOf(item: Pick<CatalogItem, 'survey_kind'>) {
  return SURVEY_KINDS.find((k) => k.value === item.survey_kind) ?? SURVEY_KINDS[0]!
}

const KIND_COLORS: Record<SurveyKind, string> = {
  single_question: 'var(--ds-t1)',
  long: 'var(--ds-t2)',
  petition: 'var(--ds-t3)',
}

/**
 * Types proposés en filtre (« Tous » en tête) avec leurs effectifs, d'après les
 * facettes du catalogue ; effectifs à 0 si l'API n'en renvoie pas.
 */
export function surveyKindOptions(
  facets: CatalogFacet[] | undefined,
): { value: SurveyKind | ''; label: string; count: number }[] {
  const countOf = (value: string) => facets?.find((f) => f.value === value)?.count ?? 0
  const kinds = SURVEY_KINDS.map((k) => ({
    value: k.value,
    label: k.label,
    count: countOf(k.value),
  }))
  const all = facets?.find((f) => !f.value)?.count ?? kinds.reduce((sum, k) => sum + k.count, 0)
  return [{ value: '', label: 'Tous', count: all }, ...kinds]
}

/** Camembert du hero : répartition des consultations par type. */
export function surveyKindPie(
  options: { value: SurveyKind | ''; label: string; count: number }[],
): DsPieSegment[] {
  return options
    .filter(
      (o): o is { value: SurveyKind; label: string; count: number } =>
        Boolean(o.value) && o.count > 0,
    )
    .map((o) => ({ value: o.count, color: KIND_COLORS[o.value], label: o.label }))
}

/** Légende du camembert : « 3 sondages rapides, 2 questionnaires et 1 pétition. » */
export function surveyKindCaption(
  options: { value: SurveyKind | ''; label: string; count: number }[],
): string | null {
  const parts = options
    .filter((o) => o.value && o.count > 0)
    .map(
      (o) =>
        `${o.count} ${o.count > 1 ? surveyKindOf({ survey_kind: o.value as SurveyKind }).many : o.label.toLowerCase()}`,
    )
  if (!parts.length) return null
  const last = parts.pop()!
  return `${parts.length ? `${parts.join(', ')} et ${last}` : last}.`
}

export const SURVEY_STATUSES: { value: SurveyStatusFilter | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'ouvert', label: 'Ouverts' },
  { value: 'clos', label: 'Clos' },
]

/** Couleurs des options (5 tranches max, la dernière = « Autres »). */
export const OPTION_COLORS = [
  'var(--ds-t1)',
  'var(--ds-t2)',
  'var(--ds-t3)',
  'var(--ds-t4)',
  'var(--ds-context)',
] as const

const DAY_MS = 86_400_000
const nf = (n: number) => n.toLocaleString('fr-FR').replace(/\s/g, '\u00a0')
export const plural = (n: number, unit: { one: string; many: string }) =>
  `${nf(n)} ${n > 1 ? unit.many : unit.one}`

/* ─── État de la consultation ─────────────────────────────────────────────── */

export type SurveyState = {
  open: boolean
  /** libellé complet (cartes) */
  closing: string
  /** libellé court (colonne « Clôture » de la liste) */
  short: string
}

/**
 * Ouverte tant que l'échéance n'est pas passée (une pétition qui atteint son
 * objectif reste ouverte). Libellé : « clôture dans 12 j », « sans date de
 * clôture », « clos le 20 oct. ».
 */
export function surveyState(item: CatalogItem, now: Date = new Date()): SurveyState {
  const deadline = item.response_deadline ? new Date(item.response_deadline) : null
  const valid = deadline && !Number.isNaN(deadline.getTime()) ? deadline : null
  const closed = Boolean(item.is_closed) || (valid !== null && valid.getTime() <= now.getTime())
  if (closed) {
    const reached =
      item.survey_kind === 'petition' &&
      item.petition_goal &&
      (item.responses_count ?? 0) >= item.petition_goal
    const when = valid ? ` le ${formatShortDate(valid.toISOString())}` : ''
    return {
      open: false,
      closing: reached ? `objectif atteint, clos${when}` : `clos${when}`,
      short: 'clos',
    }
  }
  if (!valid) return { open: true, closing: 'sans date de clôture', short: '—' }
  const days = Math.max(1, Math.ceil((valid.getTime() - now.getTime()) / DAY_MS))
  const short = days === 1 ? 'demain' : `dans ${days} j`
  return { open: true, closing: `clôture ${short}`, short }
}

/** Appel à l'action de la carte. */
export function surveyCta(
  item: CatalogItem,
  state: SurveyState,
): { kind: 'done' | 'results' | 'act'; label: string } {
  if (item.has_participated) return { kind: 'done', label: 'Vous avez participé' }
  if (!state.open) return { kind: 'results', label: 'Voir les résultats' }
  return { kind: 'act', label: surveyKindOf(item).cta }
}

/* ─── Cadran ──────────────────────────────────────────────────────────────── */

export type SurveyDial =
  | {
      kind: 'results'
      /** toutes les options (camembert), dans l'ordre du formulaire */
      options: { label: string; pct: number; color: string }[]
      /** options triées, pour la légende */
      ranked: { label: string; pct: number; color: string }[]
      responses: number
    }
  | { kind: 'questions'; questions: number; minutes: number; participants: number }
  | { kind: 'signatures'; signatures: number; goal: number | null; progress: number }

/** En dessous de ce nombre de réponses, les résultats sont signalés comme indicatifs. */
export const SMALL_SAMPLE = 30

export function surveyDial(item: CatalogItem): SurveyDial {
  const responses = item.responses_count ?? 0
  if (item.survey_kind === 'petition') {
    const goal = item.petition_goal ?? null
    return {
      kind: 'signatures',
      signatures: responses,
      goal,
      progress: goal ? Math.min(1, responses / goal) : 0,
    }
  }
  if (item.survey_kind === 'long') {
    return {
      kind: 'questions',
      questions: item.questions_count ?? 0,
      minutes: item.estimated_minutes ?? 1,
      participants: responses,
    }
  }
  const rows = item.question_previews?.[0]?.rows ?? item.primary_options ?? []
  const kept = rows.slice(0, OPTION_COLORS.length - 1)
  const rest = rows.slice(kept.length).reduce((sum, r) => sum + r.pct, 0)
  const options = kept.map((r, i) => ({ label: r.label, pct: r.pct, color: OPTION_COLORS[i]! }))
  if (rest > 0)
    options.push({ label: 'Autres', pct: rest, color: OPTION_COLORS[OPTION_COLORS.length - 1]! })
  const ranked = [...options].sort((a, b) => b.pct - a.pct)
  return { kind: 'results', options, ranked, responses }
}

/** Texte alternatif du cadran. */
export function surveyDialLabel(dial: SurveyDial): string {
  if (dial.kind === 'results') {
    return dial.responses
      ? `Résultats : ${dial.options.map((o) => `${o.label} ${o.pct} %`).join(', ')}`
      : 'Aucune réponse pour le moment'
  }
  if (dial.kind === 'questions') return `${dial.questions} question${dial.questions > 1 ? 's' : ''}`
  return dial.goal
    ? `${nf(dial.signatures)} signatures sur ${nf(dial.goal)}`
    : `${nf(dial.signatures)} signatures`
}

/* ─── Filtres actifs ──────────────────────────────────────────────────────── */

export type SurveyFilterKey = 'q' | 'kind' | 'category' | 'status' | 'notParticipated'

export function surveyActiveFilters(
  state: {
    q: string
    kind: SurveyKind | ''
    category: string
    status: SurveyStatusFilter | ''
    notParticipated: boolean
  },
  categoryLabel: (value: string) => string,
): { key: SurveyFilterKey; label: string }[] {
  const out: { key: SurveyFilterKey; label: string }[] = []
  const q = state.q.trim()
  if (q) out.push({ key: 'q', label: `« ${q} »` })
  if (state.kind) out.push({ key: 'kind', label: surveyKindOf({ survey_kind: state.kind }).label })
  if (state.category) out.push({ key: 'category', label: categoryLabel(state.category) })
  if (state.status)
    out.push({ key: 'status', label: state.status === 'ouvert' ? 'Ouverts' : 'Clos' })
  if (state.notParticipated) out.push({ key: 'notParticipated', label: 'Pas encore participé' })
  return out
}

/** Contexte du tri (accordé au féminin : « consultations »). */
export function surveySortContext(sort: string): string {
  if (sort === 'created') return 'Classées par date de création'
  if (sort === 'recent') return 'Classées par date de modification'
  return 'Classées par popularité'
}
