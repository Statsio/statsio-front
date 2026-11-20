import type { CardPreview, CatalogItem } from '@/types/catalog'
import { formatRelativePublished } from '@/lib/catalog-format'
import { relativeAge } from '@/lib/statsdata-freshness'

/**
 * Logique pure du listing StatsData (charte « Tranches ») : filtres « Affiner »,
 * filtres actifs, badge de fraîcheur, et géométrie des graphiques d'aperçu tracés
 * à partir du `CardPreview` réel (premier bloc graphique du document).
 * Les rubriques et les tris sont partagés avec les articles (`lib/listing-rubrics`).
 */

/* ─── Filtres « Affiner » (appliqués aux résultats chargés) ─────────────────── */

export type StatsDataToggleKey = 'charts' | 'multi' | 'week'
export type StatsDataToggles = Record<StatsDataToggleKey, boolean>

const DAY_MS = 86_400_000

/** Date de dernière mise à jour des données : synchro de la source, sinon édition. */
function lastUpdateOf(item: CatalogItem): number {
  const iso = item.freshness?.last_refreshed_at ?? item.updated_at
  const t = iso ? new Date(iso).getTime() : Number.NaN
  return Number.isNaN(t) ? 0 : t
}

export const STATSDATA_TOGGLES: {
  key: StatsDataToggleKey
  label: string
  test: (item: CatalogItem, now: number) => boolean
}[] = [
  { key: 'charts', label: 'Avec graphiques', test: (item) => item.charts_count > 0 },
  { key: 'multi', label: 'Multi-sources', test: (item) => (item.linked_datasets_count ?? 0) > 1 },
  {
    key: 'week',
    label: 'Mis à jour cette semaine',
    test: (item, now) => now - lastUpdateOf(item) < 7 * DAY_MS,
  },
]

export const NO_TOGGLES: StatsDataToggles = { charts: false, multi: false, week: false }

export function hasToggle(toggles: StatsDataToggles): boolean {
  return Object.values(toggles).some(Boolean)
}

export function applyStatsDataToggles(
  items: CatalogItem[],
  toggles: StatsDataToggles,
  now: number = Date.now(),
): CatalogItem[] {
  const active = STATSDATA_TOGGLES.filter((t) => toggles[t.key])
  return active.length ? items.filter((item) => active.every((t) => t.test(item, now))) : items
}

export type StatsDataFilterKey = 'q' | 'category' | StatsDataToggleKey

/** Filtres en cours, dans l'ordre de la barre d'outils (pastilles retirables). */
export function statsDataActiveFilters(
  state: { q: string; category: string; toggles: StatsDataToggles },
  categoryLabel: (value: string) => string,
): { key: StatsDataFilterKey; label: string }[] {
  const out: { key: StatsDataFilterKey; label: string }[] = []
  const q = state.q.trim()
  if (q) out.push({ key: 'q', label: `« ${q} »` })
  if (state.category) out.push({ key: 'category', label: categoryLabel(state.category) })
  for (const t of STATSDATA_TOGGLES)
    if (state.toggles[t.key]) out.push({ key: t.key, label: t.label })
  return out
}

/* ─── Badge de fraîcheur ─────────────────────────────────────────────────────── */

const SYNC_LABEL: Record<string, string> = {
  hourly: 'Synchro horaire',
  daily: 'Synchro quotidienne',
  weekly: 'Synchro hebdomadaire',
  monthly: 'Synchro mensuelle',
  yearly: 'Synchro annuelle',
}

export type FreshBadge = {
  text: string
  /** infobulle : fréquence de synchronisation */
  title: string
  /** synchronisé depuis moins de 24 h (ou source en direct) → pastille verte animée */
  live: boolean
}

/**
 * « il y a 2 h » si la source se synchronise, « Publié 18 nov. » sinon
 * (source figée ou sans planification).
 */
export function freshBadge(item: CatalogItem, now: Date = new Date()): FreshBadge {
  const f = item.freshness
  if (f?.is_live) return { text: 'En direct', title: 'Données en direct', live: true }
  const age = f?.last_refreshed_at ? relativeAge(f.last_refreshed_at, now) : ''
  if (f && age) {
    const elapsed = now.getTime() - new Date(f.last_refreshed_at!).getTime()
    return {
      text: age,
      title: SYNC_LABEL[f.refresh_frequency ?? ''] ?? 'Source synchronisée',
      live: elapsed < DAY_MS,
    }
  }
  return {
    text: `Publié ${formatRelativePublished(item.created_at ?? item.updated_at)}`,
    title: 'Pas de synchronisation automatique',
    live: false,
  }
}

/* ─── Aperçu graphique (CardPreview réel) ───────────────────────────────────── */

/** La carte a un visuel : sa miniature, ou à défaut son graphique lié. */
export function hasStatsDataVisual(item: CatalogItem): boolean {
  return Boolean(item.thumbnail_url) || item.charts_count > 0
}

/** Aperçu exploitable : au moins une série et des libellés. */
export function isUsablePreview(preview: CardPreview | null | undefined): preview is CardPreview {
  return Boolean(preview && !preview.empty && preview.series?.length && preview.labels?.length)
}

const nbsp = ' '

/** 2 550 · 90,2 · 1,3 M — l'unité éventuelle est accolée (« 1,62 € »). */
export function formatPreviewValue(value: number, unit?: string): string {
  const abs = Math.abs(value)
  const text =
    abs >= 1e6
      ? `${(value / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}${nbsp}M`
      : value.toLocaleString('fr-FR', { maximumFractionDigits: abs < 100 ? 2 : 0 })
  const u = unit?.trim()
  return (u ? `${text}${nbsp}${u}` : text).replace(/\s/g, nbsp)
}

/**
 * Chiffre clé de l'aperçu : dernière valeur de la première série (ou premier
 * libellé d'un classement horizontal / d'un camembert), légendé par le titre du bloc.
 */
export function previewHeadline(preview: CardPreview): { value: string; label: string } | null {
  if (!isUsablePreview(preview)) return null
  const values = preview.series![0]!.values
  const labels = preview.labels!
  const label = preview.title?.trim() ?? ''
  if (preview.kind === 'pie' || preview.orientation === 'horizontal') {
    return labels[0] ? { value: labels[0], label } : null
  }
  const last = values[values.length - 1]
  return last == null || !Number.isFinite(last)
    ? null
    : { value: formatPreviewValue(last, preview.unit), label }
}

/** Couleurs des séries : la 1re prend l'accent de la charte (suit les sous-marques). */
export const SERIES_COLORS = ['var(--ds-accent)', 'var(--ds-t2)', 'var(--ds-t3)'] as const
const BAR_BASE = 'var(--ds-t3)'
const BAR_EMPH = 'var(--ds-accent)'

export type ChartBox = { width: number; height: number }
type Text = { x: number; y: number; text: string; anchor?: 'start' | 'end' }
type GridLine = { x1: number; x2: number; y: number }

export type PreviewChartModel =
  | {
      kind: 'bars'
      grid: GridLine[]
      bars: { x: number; y: number; w: number; h: number; color: string }[]
      value: Text | null
      axis: Text[]
    }
  | {
      kind: 'hbars'
      rows: {
        label: Text
        bar: { x: number; y: number; w: number; h: number; color: string }
        value: Text
      }[]
    }
  | {
      kind: 'line'
      grid: GridLine[]
      area: string
      lines: { points: string; color: string; end: { x: number; y: number }; value: Text }[]
      axis: Text[]
    }

const r1 = (n: number) => Math.round(n * 10) / 10
const finite = (v: number) => (Number.isFinite(v) ? v : 0)

/**
 * Géométrie SVG (repère `box`, origine en haut à gauche) d'un aperçu ligne / barres.
 * Barres : la dernière est mise en avant ; classement horizontal : la première.
 * Le camembert n'a pas de géométrie ici (tracé par DsPie).
 */
export function buildPreviewChart(preview: CardPreview, box: ChartBox): PreviewChartModel | null {
  if (!isUsablePreview(preview) || preview.kind === 'pie') return null
  const labels = preview.labels!
  const series = preview.series!
  const { width: W, height: H } = box
  const L = 4
  const R = 50
  const T = 10
  const B = 18
  const iw = W - L - R
  const ih = H - T - B
  const grid = [0, 1, 2, 3].map((k) => ({ x1: L, x2: W - R, y: r1(T + (ih * k) / 3) }))
  const axis: Text[] = [
    { x: L, y: H - 4, text: labels[0] ?? '' },
    { x: W - R, y: H - 4, text: labels[labels.length - 1] ?? '', anchor: 'end' },
  ]

  if (preview.kind === 'bar' && preview.orientation === 'horizontal') {
    const values = series[0]!.values.slice(0, 6).map(finite)
    const max = Math.max(...values.map(Math.abs), 1)
    const lw = 76
    const rh = (H - T - 6) / values.length
    return {
      kind: 'hbars',
      rows: values.map((v, i) => {
        const y = T + i * rh
        const w = r1(((W - R - lw - L) * Math.abs(v)) / max)
        return {
          label: { x: L, y: r1(y + rh * 0.62), text: truncate(labels[i] ?? '', 11) },
          bar: {
            x: lw,
            y: r1(y + rh * 0.18),
            w,
            h: r1(rh * 0.64),
            color: i === 0 ? BAR_EMPH : BAR_BASE,
          },
          value: { x: r1(lw + w + 5), y: r1(y + rh * 0.62), text: formatPreviewValue(v) },
        }
      }),
    }
  }

  const all = series.flatMap((s) => s.values.map(finite))
  if (preview.kind === 'bar') {
    const lo = Math.min(0, ...all)
    const hi = Math.max(0, ...all, lo + 1)
    const yOf = (v: number) => T + ih * (1 - (v - lo) / (hi - lo))
    const n = labels.length
    const slot = iw / n
    const single = series.length === 1
    const bw = (slot * 0.72) / series.length
    const bars = series.flatMap((s, si) =>
      labels.map((_, i) => {
        const v = finite(s.values[i] ?? 0)
        const y0 = yOf(Math.max(0, v))
        const h = Math.max(1.5, Math.abs(yOf(v) - yOf(0)))
        const color = single
          ? i === n - 1
            ? BAR_EMPH
            : BAR_BASE
          : SERIES_COLORS[si % SERIES_COLORS.length]!
        return {
          x: r1(L + i * slot + slot * 0.14 + si * bw),
          y: r1(y0),
          w: r1(bw),
          h: r1(h),
          color,
        }
      }),
    )
    const last = finite(series[0]!.values[n - 1] ?? 0)
    const value: Text | null = single
      ? {
          x: r1(L + n * slot + 4),
          y: r1(Math.max(T + 10, yOf(last) + 4)),
          text: formatPreviewValue(last, preview.unit),
        }
      : null
    return { kind: 'bars', grid, bars, value, axis }
  }

  // ligne (défaut)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const pad = (max - min) * 0.12 || 1
  const lo = min - pad
  const hi = max + pad
  const pts = (values: number[]) =>
    values.map(
      (v, i) =>
        [
          L + (iw * i) / Math.max(1, values.length - 1),
          T + ih * (1 - (finite(v) - lo) / (hi - lo)),
        ] as const,
    )
  const first = pts(series[0]!.values)
  const area = `M${first.map(([x, y]) => `${r1(x)} ${r1(y)}`).join(' L')} L${r1(first[first.length - 1]![0])} ${T + ih} L${L} ${T + ih} Z`
  const lines = series.slice(0, SERIES_COLORS.length).map((s, si) => {
    const p = pts(s.values)
    const [ex, ey] = p[p.length - 1]!
    const lastValue = finite(s.values[s.values.length - 1] ?? 0)
    return {
      points: p.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' '),
      color: SERIES_COLORS[si]!,
      end: { x: r1(ex), y: r1(ey) },
      value: { x: r1(ex + 7), y: r1(ey + 4), text: formatPreviewValue(lastValue, preview.unit) },
    }
  })
  return { kind: 'line', grid, area, lines, axis }
}

export type SparkModel =
  | { kind: 'line'; points: string; end: { x: number; y: number } }
  | { kind: 'bars'; bars: { x: number; y: number; w: number; h: number; emph: boolean }[] }

/** Tendance compacte de la vue liste : première série seulement, sans axe. */
export function buildSpark(preview: CardPreview, box: ChartBox): SparkModel | null {
  if (!isUsablePreview(preview) || preview.kind === 'pie') return null
  const values = preview.series![0]!.values.map(finite)
  const { width: W, height: H } = box
  if (preview.kind === 'bar') {
    const max = Math.max(...values.map(Math.abs), 1)
    const bw = W / values.length
    const emphIndex = preview.orientation === 'horizontal' ? 0 : values.length - 1
    return {
      kind: 'bars',
      bars: values.map((v, i) => {
        const h = Math.max(1.5, ((H - 2) * Math.abs(v)) / max)
        return { x: r1(i * bw + 1), y: r1(H - h), w: r1(bw * 0.7), h: r1(h), emph: i === emphIndex }
      }),
    }
  }
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const p = values.map((v, i) => [
    2 + ((W - 8) * i) / Math.max(1, values.length - 1),
    3 + (H - 6) * (1 - (v - min) / range),
  ])
  const [ex, ey] = p[p.length - 1]!
  return {
    kind: 'line',
    points: p.map(([x, y]) => `${r1(x!)},${r1(y!)}`).join(' '),
    end: { x: r1(ex!), y: r1(ey!) },
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
