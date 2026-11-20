import { FORM_BLOCK_TYPES, type ContentType, type StudioBlock } from '@/types/studio'
import type { SurveyKind } from '@/types/content-creation'

/**
 * Liste « Avant de publier » de l'inspecteur Propriétés (et notice de la modale
 * Publier). Chaque point est soit validé, soit à revoir — avec, si possible, le
 * bloc à montrer (`blockId`, bouton « Voir »). Jamais bloquant.
 */
export interface StudioCheck {
  id: string
  ok: boolean
  label: string
  blockId?: string
}

export interface StudioCheckInput {
  type: ContentType
  title?: string | null
  description?: string | null
  hasCover: boolean
  surveyKind?: SurveyKind | null
  blocks: StudioBlock[]
}

const DATA_TYPES = new Set(['bar', 'line', 'pie', 'table', 'kpi', 'record', 'related', 'map', 'loop'])
const OPTION_TYPES = new Set(['choice', 'checkboxes', 'dropdown'])

function hasSource(b: StudioBlock): boolean {
  return !!(b.datasetId || b.sources?.length)
}

export function studioChecks(input: StudioCheckInput): StudioCheck[] {
  const { type, blocks } = input
  const out: StudioCheck[] = [
    { id: 'title', ok: (input.title ?? '').trim().length > 8, label: 'Titre renseigné' },
    { id: 'chapo', ok: (input.description ?? '').trim().length > 20, label: 'Chapô renseigné' },
  ]

  if (type !== 'survey') out.push({ id: 'cover', ok: input.hasCover, label: 'Image de couverture' })

  const noAlt = blocks.find((b) => b.type === 'image' && b.config.imageUrl && !b.config.imageAlt?.trim())
  out.push({
    id: 'alt',
    ok: !noAlt,
    label: noAlt ? 'Une image n’a pas de texte alternatif' : 'Textes alternatifs des images',
    blockId: noAlt?.id,
  })

  if (type === 'article') {
    const embeds = blocks.filter((b) => b.type === 'sd-embed')
    const unset = embeds.find((b) => !b.config.sourceSlug || !b.config.sourceBlockId)
    const n = embeds.length
    out.push(
      unset
        ? { id: 'embeds', ok: false, label: 'Un bloc StatsData n’est pas relié', blockId: unset.id }
        : { id: 'embeds', ok: n > 0, label: n ? `${n} bloc${n > 1 ? 's' : ''} StatsData lié${n > 1 ? 's' : ''}` : 'Aucun bloc StatsData lié' },
    )
  }

  if (type === 'survey') {
    const questions = blocks.filter((b) => FORM_BLOCK_TYPES.includes(b.type))
    const kind = input.surveyKind ?? 'single_question'
    let offFormat: StudioBlock | undefined
    if (kind === 'petition') offFormat = questions[0]
    else if (kind === 'single_question') offFormat = questions[1]
    out.push({
      id: 'format',
      ok: !offFormat,
      label: offFormat ? 'Des questions ne respectent pas le format' : 'Questions conformes au format',
      blockId: offFormat?.id,
    })
    if (kind !== 'petition') {
      const fewOptions = questions.find(
        (b) => OPTION_TYPES.has(b.type) && (b.config.formOptions ?? []).filter((o) => String(o).trim()).length < 2,
      )
      out.push({
        id: 'options',
        ok: !fewOptions && questions.length > 0,
        label: fewOptions
          ? 'Une question a moins de 2 options'
          : questions.length
            ? 'Chaque question a ses options'
            : 'Aucune question',
        blockId: fewOptions?.id,
      })
    }
  }

  if (type === 'statsdata') {
    const noSource = blocks.find((b) => DATA_TYPES.has(b.type) && !hasSource(b))
    out.push({
      id: 'sources',
      ok: !noSource,
      label: noSource ? 'Un bloc de données n’a pas de source' : 'Chaque bloc de données a sa source',
      blockId: noSource?.id,
    })
  }

  return out
}
