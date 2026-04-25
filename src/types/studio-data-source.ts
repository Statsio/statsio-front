import type { StatsDataNormalizationMapping, StatsDataSourceLastSnapshot } from '@/types/statsdata-query'

export type StudioDataSourceKind = 'manual' | 'file' | 'api'

/** Champs optionnels renvoyés par l’API StatsData (liste / détail source). */
export type StudioDataSourceRemoteFields = {
  normalizationMapping?: StatsDataNormalizationMapping | null
  lastSnapshot?: StatsDataSourceLastSnapshot | null
}

/** Grille saisie à la main (ligne 0 = en-têtes). */
export type StudioDataSourceManual = {
  id: string
  kind: 'manual'
  name: string
  rows: string[][]
} & StudioDataSourceRemoteFields

/** Fichier importé — preview local jusqu’à l’API. */
export type StudioDataSourceFile = {
  id: string
  kind: 'file'
  name: string
  fileName: string
  format: 'csv' | 'xlsx'
  previewRows: string[][]
} & StudioDataSourceRemoteFields

/** API externe — aperçu JSON fictif jusqu’à l’implémentation réelle. */
export type StudioDataSourceApi = {
  id: string
  kind: 'api'
  name: string
  url: string
  /** Ex. Authorization, X-Api-Key — stockage réel côté API plus tard */
  authHeaderName: string
  apiKeyPreview: string
  /** Limite par page (ajouté automatiquement à l’URL si aucun `limit=` n’est présent). */
  apiLimit?: number | null
  /** Template URL de recherche externe. Utilise `{q}` (ex: `...?codePostal={q}` ou `...?where=dep_code%3D{q}`). */
  apiSearchTemplate?: string | null
  previewRecords: Record<string, string | number | boolean | null>[]
  /** Liste Statsio : `api.hasApiKey` — la clé n’est pas renvoyée, seul le booléen l’est. */
  hasStoredApiKey?: boolean
} & StudioDataSourceRemoteFields

export type StudioDataSource = StudioDataSourceManual | StudioDataSourceFile | StudioDataSourceApi

/** Liaison bloc graphique / tableau → source et champs affichés. */
export type StudioBlockDataBinding = {
  /** id de `StudioDataSource` ou chaîne vide */
  sourceId: string
  /** Colonnes affichées dans l’ordre (clés = en-têtes ou champs JSON). Vide = toutes. */
  visibleColumnKeys: string[]
  /** Graphique : champ des étiquettes (abscisse) */
  chartCategoryKey: string
  /** Graphique : champ des valeurs (ordonnée) */
  chartValueKey: string
}

export const defaultStudioBlockDataBinding = (): StudioBlockDataBinding => ({
  sourceId: '',
  visibleColumnKeys: [],
  chartCategoryKey: '',
  chartValueKey: '',
})

export function sourceToTabular(source: StudioDataSource): { headers: string[]; rows: string[][] } {
  switch (source.kind) {
    case 'manual': {
      const r = source.rows
      if (!r.length) return { headers: [], rows: [] }
      const headers = r[0]!.map((c) => String(c))
      const body = r.slice(1).map((row) => headers.map((_, i) => String(row[i] ?? '')))
      return { headers, rows: body }
    }
    case 'file': {
      const r = source.previewRows
      if (!r.length) return { headers: [], rows: [] }
      const headers = r[0]!.map((c) => String(c))
      const body = r.slice(1).map((row) => headers.map((_, i) => String(row[i] ?? '')))
      return { headers, rows: body }
    }
    case 'api': {
      const recs = source.previewRecords
      if (!recs.length) return { headers: [], rows: [] }
      const headers = [...new Set(recs.flatMap((row) => Object.keys(row)))]
      const body = recs.map((row) => headers.map((h) => String(row[h] ?? '')))
      return { headers, rows: body }
    }
  }
}

export function findDataSource(sources: StudioDataSource[], id: string): StudioDataSource | undefined {
  return sources.find((s) => s.id === id)
}

export function resolveTableFromBinding(
  binding: StudioBlockDataBinding,
  sources: StudioDataSource[],
): { headers: string[]; rows: string[][] } {
  const source = binding.sourceId ? findDataSource(sources, binding.sourceId) : undefined
  if (!source) return { headers: [], rows: [] }
  const { headers, rows } = sourceToTabular(source)
  if (!headers.length) return { headers: [], rows: [] }
  const keys =
    binding.visibleColumnKeys.length > 0
      ? binding.visibleColumnKeys.filter((k) => headers.includes(k))
      : headers
  if (!keys.length) return { headers: [], rows: [] }
  const idx = keys.map((k) => headers.indexOf(k))
  return {
    headers: keys,
    rows: rows.map((r) => idx.map((i) => r[i] ?? '')),
  }
}

export function resolveChartSeriesFromBinding(
  binding: StudioBlockDataBinding,
  sources: StudioDataSource[],
): { labels: string[]; values: number[] } {
  const source = binding.sourceId ? findDataSource(sources, binding.sourceId) : undefined
  if (!source) return { labels: [], values: [] }
  const { headers, rows } = sourceToTabular(source)
  if (!headers.length || !rows.length) return { labels: [], values: [] }

  let catKey = binding.chartCategoryKey
  let valKey = binding.chartValueKey
  if (!catKey || !headers.includes(catKey)) catKey = headers[0] ?? ''
  if (!valKey || !headers.includes(valKey)) valKey = headers[1] ?? headers[0] ?? ''
  if (!catKey || !valKey) return { labels: [], values: [] }

  const ci = headers.indexOf(catKey)
  const vi = headers.indexOf(valKey)
  const labels: string[] = []
  const values: number[] = []
  for (const row of rows) {
    const raw = row[vi] ?? ''
    const n = Number(String(raw).replace(/\s/g, '').replace(',', '.'))
    if (!Number.isFinite(n)) continue
    labels.push(String(row[ci] ?? ''))
    values.push(n)
  }
  return { labels, values }
}
