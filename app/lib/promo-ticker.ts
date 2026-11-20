import type { CardPreview, CatalogItem } from '@/types/catalog'
import type { PromoTickerItem, PromoTickerKind, PromoTickerPart } from '@/components/layout/brands/header-nav.types'
import { publicContentPath } from '@/lib/content-display'
import { relativeAge } from '@/lib/statsdata-freshness'

/**
 * Construction des infos du bandeau « En continu » à partir du catalogue public.
 * Fonctions pures (testées) : aucune valeur n'est inventée — une info n'est émise
 * que si la donnée qui la porte existe.
 */

export const PROMO_TICKER_LABELS: Record<PromoTickerKind, string> = {
  une: 'À la une',
  actu: 'Actu',
  chiffre: 'Dernier chiffre',
  sondage: 'Sondage',
  maj: 'Mise à jour',
}

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

function item(kind: PromoTickerKind, parts: PromoTickerPart[], href: string): PromoTickerItem {
  return { kind, label: PROMO_TICKER_LABELS[kind], parts, href }
}

/**
 * « Dernier chiffre » d'un StatsData d'après son mini-graphe réel : dernière
 * valeur de la 1re série (+ son libellé d'abscisse) et l'évolution sur un pas.
 * `null` si le graphique est vide ou non numérique.
 */
export function latestFigureParts(title: string, preview: CardPreview | null | undefined): PromoTickerPart[] | null {
  if (!preview || preview.empty) return null
  const values = preview.series?.[0]?.values ?? []
  const last = values.at(-1)
  if (last == null || !Number.isFinite(last)) return null
  const lastLabel = preview.labels?.[values.length - 1]
  const unit = preview.unit ? ` ${preview.unit}` : ''
  const parts: PromoTickerPart[] = [
    { text: `${preview.title || title} : ` },
    { text: `${nf.format(last)}${unit}`, strong: true },
  ]
  if (lastLabel && (preview.kind ?? 'line') !== 'pie') parts.push({ text: ` en ${lastLabel}` })
  const prev = values.at(-2)
  if (prev != null && Number.isFinite(prev) && prev !== 0 && (preview.kind ?? 'line') !== 'pie') {
    const delta = ((last - prev) / Math.abs(prev)) * 100
    if (Number.isFinite(delta) && Math.abs(delta) >= 0.5) {
      parts.push({ text: ', soit ' }, { text: `${delta > 0 ? '+' : ''}${nf.format(delta)} %`, strong: true }, { text: ' sur un pas' })
    }
  }
  return parts
}

export type PromoTickerSource = {
  articles: CatalogItem[]
  /** StatsData tendance, avec leur mini-graphe s'il a été chargé */
  datasets: { item: CatalogItem; preview?: CardPreview | null }[]
  surveys: CatalogItem[]
}

export function buildPromoTicker(src: PromoTickerSource, basePath = '', now: Date = new Date()): PromoTickerItem[] {
  const out: PromoTickerItem[] = []

  const [lead, ...others] = src.articles
  if (lead) out.push(item('une', [{ text: lead.title }], publicContentPath('article', lead.slug, basePath)))

  const figures: PromoTickerItem[] = []
  const updates: PromoTickerItem[] = []
  for (const { item: ds, preview } of src.datasets) {
    const href = publicContentPath('statsdata', ds.slug, basePath)
    const fig = latestFigureParts(ds.title, preview)
    if (fig) figures.push(item('chiffre', fig, href))
    const refreshed = ds.freshness?.last_refreshed_at
    const age = refreshed ? relativeAge(refreshed, now) : ''
    if (ds.freshness?.is_live) updates.push(item('maj', [{ text: `${ds.title} : données en direct` }], href))
    else if (age) updates.push(item('maj', [{ text: `${ds.title} : source synchronisée ${age}` }], href))
  }

  const survey = src.surveys[0]
  const surveyItem = survey
    ? item(
        'sondage',
        survey.primary_options?.[0]
          ? [
              { text: `${survey.title} — en tête : ${survey.primary_options[0].label} ` },
              { text: `${Math.round(survey.primary_options[0].pct)} %`, strong: true },
            ]
          : [{ text: `${survey.title} : donnez votre avis` }],
        publicContentPath('survey', survey.slug, basePath),
      )
    : null

  // Ordre éditorial : une, chiffre, sondage, mise à jour, puis le reste en alternance.
  if (figures[0]) out.push(figures[0])
  if (surveyItem) out.push(surveyItem)
  if (updates[0]) out.push(updates[0])
  for (const a of others) out.push(item('actu', [{ text: a.title }], publicContentPath('article', a.slug, basePath)))
  out.push(...figures.slice(1), ...updates.slice(1))
  return out
}
