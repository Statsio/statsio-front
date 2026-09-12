import { apiHttp, publicHttp, getApiBaseUrl } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'
import { slugify } from '@/lib/slug'
import type { DatasetColumn, DatasetMeta, DatasetWithSchema, BlockQueryResult, StudioBlock, FilterGroup } from '@/types/studio'
import type { ContentType, ContentCoverage } from '@/types/content-creation'

/**
 * Sérialise des groupes de conditions (`FilterGroup[]`) en `filter_groups[gi][match]` /
 * `filter_groups[gi][conditions][ci][column|operator|value]` + `filters_match` — le
 * combinateur ENTRE les groupes. Complète (ne remplace pas) l'ancien `filters[i][...]`
 * plat, qu'on continue d'accepter pour la compat descendante des appelants existants.
 */
function serializeFilterGroups(groups: FilterGroup[] | undefined, match: 'all' | 'any' | undefined): string[] {
  if (!groups?.length) return []
  const parts: string[] = []
  groups.forEach((g, gi) => {
    parts.push(`filter_groups[${gi}][match]=${g.match}`)
    g.conditions.forEach((f, ci) => {
      parts.push(`filter_groups[${gi}][conditions][${ci}][column]=${encodeURIComponent(f.column)}`)
      parts.push(`filter_groups[${gi}][conditions][${ci}][operator]=${encodeURIComponent(f.operator)}`)
      parts.push(`filter_groups[${gi}][conditions][${ci}][value]=${encodeURIComponent(f.value)}`)
    })
  })
  if (match) parts.push(`filters_match=${match}`)
  return parts
}

/** Enveloppe Laravel générique `{ data: T }` — pour typer les réponses `apiHttp`/`publicHttp`. */
interface Envelope<T> {
  data: T
}

/** Forme brute (snake_case) de `BlockQueryResult`, telle que renvoyée par `GET .../query`. */
interface RawBlockQueryResult {
  columns?: string[]
  rows?: Record<string, unknown>[]
  total_rows?: number
  column_map?: Record<string, string>
}

// ─── Datasets ─────────────────────────────────────────────────────────────────

export async function fetchDatasets(): Promise<DatasetMeta[]> {
  const { data } = await apiHttp.get<Envelope<Record<string, unknown>[]>>(STATSIO_API.datasets.collection)
  return (data.data ?? []).map(mapDatasetMeta)
}

export async function fetchDatasetSchema(datasetId: string): Promise<DatasetWithSchema> {
  const { data } = await apiHttp.get<Envelope<Record<string, unknown> & { columns?: Record<string, unknown>[] }>>(
    STATSIO_API.datasets.one(datasetId),
  )
  return {
    ...mapDatasetMeta(data.data),
    columns: (data.data.columns ?? []).map((col: Record<string, unknown>) => ({
      name: String(col.name ?? ''),
      type: (col.type as DatasetColumn['type']) ?? 'string',
      nullable: Boolean(col.nullable),
      sampleValues: col.sample_values as (string | null)[] | undefined,
      order: col.order as number | undefined,
    })),
  }
}

export interface DatasetPreview {
  columns: string[]
  rows: unknown[][]
  total: number
}

export async function fetchDatasetPreview(datasetId: string, limit = 5): Promise<DatasetPreview> {
  const { data } = await apiHttp.get<Envelope<DatasetPreview>>(STATSIO_API.datasets.preview(datasetId), { params: { limit } })
  return data.data
}

export async function updateDataset(datasetId: string, payload: { name?: string; description?: string }): Promise<DatasetMeta> {
  const { data } = await apiHttp.patch<Envelope<Record<string, unknown>>>(STATSIO_API.datasets.one(datasetId), payload)
  return mapDatasetMeta(data.data)
}

export async function deleteDataset(datasetId: string): Promise<void> {
  await apiHttp.delete(STATSIO_API.datasets.one(datasetId))
}

type BlockQueryParams = {
  columns?: string[]
  limit?: number
  offset?: number
  distinctColumn?: string | null
  sortColumn?: string | null
  sortDirection?: 'asc' | 'desc' | null
  /** Legacy : liste plate, ET implicite. Toujours accepté, mais `filterGroups` prime dès qu'il est fourni. */
  filters?: import('@/types/studio').BlockFilter[]
  /** Groupes de conditions du bloc (ET/OU par groupe + entre les groupes via `filtersMatch`). */
  filterGroups?: FilterGroup[]
  filtersMatch?: 'all' | 'any'
  sources?: import('@/types/studio').BlockSource[]
  primarySourceId?: string
  joins?: import('@/types/studio').BlockJoin[]
  aggregate?: import('@/types/studio').AggregateFunction
  aggregateColumns?: string[]
  aggregates?: import('@/types/studio').BlockAggregate[]
  groupBy?: string[]
  calcColumns?: import('@/types/studio').CalcColumn[]
  /** Bloc recherche : requête plein-texte multi-mots. */
  searchQ?: string
  /** Bloc recherche : colonnes d'identité sur lesquelles porte `searchQ`. */
  searchColumns?: string[]
  /** Bloc recherche : colonnes secondaires (« OU ») — match alternatif de toute la requête. */
  searchAltColumns?: string[]
  /**
   * Bloc recherche : groupes de sources additionnelles sans lien avec la source
   * principale (voir `SearchUnionGroup`). Chacun est interrogé séparément côté
   * API puis empilé sous les résultats de la source principale (UNION ALL
   * applicatif) — pas de jointure, pas de clé commune requise.
   */
  unionGroups?: import('@/types/studio').SearchUnionGroup[]
}

function buildParamsSerializer(p: BlockQueryParams): string {
  const parts: string[] = []
  if (p.columns?.length) {
    p.columns.forEach((c: string) => parts.push(`columns[]=${encodeURIComponent(c)}`))
  }
  if (p.limit !== undefined) parts.push(`limit=${p.limit}`)
  if (p.offset) parts.push(`offset=${p.offset}`)
  if (p.searchQ) {
    parts.push(`search_q=${encodeURIComponent(p.searchQ)}`)
    ;(p.searchColumns ?? []).forEach((c) => parts.push(`search_columns[]=${encodeURIComponent(c)}`))
    ;(p.searchAltColumns ?? []).forEach((c) => parts.push(`search_alt_columns[]=${encodeURIComponent(c)}`))
    ;(p.unionGroups ?? []).forEach((g, gi) => {
      if (!g.source.datasetId || !g.searchColumns.length) return
      parts.push(`union_groups[${gi}][sources][0][id]=${encodeURIComponent(g.source.id)}`)
      parts.push(`union_groups[${gi}][sources][0][dataset_id]=${encodeURIComponent(g.source.datasetId)}`)
      parts.push(`union_groups[${gi}][sources][0][primary]=1`)
      g.searchColumns.forEach((c) => parts.push(`union_groups[${gi}][search_columns][]=${encodeURIComponent(c)}`))
      ;(g.searchAltColumns ?? []).forEach((c) => parts.push(`union_groups[${gi}][search_alt_columns][]=${encodeURIComponent(c)}`))
    })
  }
  if (p.distinctColumn) parts.push(`distinct_column=${encodeURIComponent(p.distinctColumn)}`)
  if (p.sortColumn) parts.push(`sort_column=${encodeURIComponent(p.sortColumn)}`)
  if (p.sortDirection) parts.push(`sort_direction=${p.sortDirection}`)
  if (p.filters?.length) {
    p.filters.forEach((f: import('@/types/studio').BlockFilter, i: number) => {
      parts.push(`filters[${i}][column]=${encodeURIComponent(f.column)}`)
      parts.push(`filters[${i}][operator]=${encodeURIComponent(f.operator)}`)
      parts.push(`filters[${i}][value]=${encodeURIComponent(f.value)}`)
    })
  }
  parts.push(...serializeFilterGroups(p.filterGroups, p.filtersMatch))
  // Multi-sources : n'émettre `sources[]` que s'il y a > 1 source (une source unique
  // reste sur le chemin mono-source du back, identique à l'existant).
  if (p.sources && p.sources.length > 1) {
    p.sources.forEach((s, i) => {
      parts.push(`sources[${i}][id]=${encodeURIComponent(s.id)}`)
      parts.push(`sources[${i}][dataset_id]=${encodeURIComponent(s.datasetId)}`)
      if (s.id === p.primarySourceId) parts.push(`sources[${i}][primary]=1`)
    })
    ;(p.joins ?? []).forEach((j, i) => {
      parts.push(`joins[${i}][left_source]=${encodeURIComponent(j.leftSourceId)}`)
      parts.push(`joins[${i}][left_column]=${encodeURIComponent(j.leftColumn)}`)
      parts.push(`joins[${i}][right_source]=${encodeURIComponent(j.rightSourceId)}`)
      parts.push(`joins[${i}][right_column]=${encodeURIComponent(j.rightColumn)}`)
      parts.push(`joins[${i}][type]=${j.type}`)
    })
  }
  const aggs: import('@/types/studio').BlockAggregate[] = p.aggregates?.length
    ? p.aggregates
    : (p.aggregate && p.aggregateColumns?.length
        ? p.aggregateColumns.map((c) => ({ column: c, fn: p.aggregate! }))
        : [])
  if (aggs.length) {
    aggs.forEach((a, i) => {
      parts.push(`aggregates[${i}][column]=${encodeURIComponent(a.column)}`)
      parts.push(`aggregates[${i}][fn]=${encodeURIComponent(a.fn)}`)
    })
    p.groupBy?.forEach((c) => parts.push(`group_by[]=${encodeURIComponent(c)}`))
  }
  // Colonnes calculées du bloc (combinaisons arithmétiques) — le backend les injecte.
  p.calcColumns?.forEach((c, i) => {
    parts.push(`calc[${i}][id]=${encodeURIComponent(c.id)}`)
    c.operands.forEach((o, j) => {
      if (o.op) parts.push(`calc[${i}][operands][${j}][op]=${encodeURIComponent(o.op)}`)
      if (o.column !== undefined) parts.push(`calc[${i}][operands][${j}][column]=${encodeURIComponent(o.column)}`)
      if (o.value !== undefined) parts.push(`calc[${i}][operands][${j}][value]=${o.value}`)
    })
  })
  return parts.join('&')
}

export async function fetchBlockData(
  datasetId: string,
  params: BlockQueryParams = {},
): Promise<BlockQueryResult> {
  const { data } = await apiHttp.get<Envelope<RawBlockQueryResult>>(STATSIO_API.datasets.query(datasetId), {
    params,
    paramsSerializer: buildParamsSerializer,
  })
  return {
    columns: data.data?.columns ?? [],
    rows: data.data?.rows ?? [],
    totalRows: data.data?.total_rows ?? 0,
    columnMap: data.data?.column_map ?? undefined,
  }
}

export async function fetchPublicBlockData(
  docSlug: string,
  datasetId: string,
  params: BlockQueryParams = {},
): Promise<BlockQueryResult> {
  const { data } = await publicHttp.get<Envelope<RawBlockQueryResult>>(
    STATSIO_API.studioContent.publicDatasetQuery(docSlug, datasetId),
    { params, paramsSerializer: buildParamsSerializer },
  )
  return {
    columns: data.data?.columns ?? [],
    rows: data.data?.rows ?? [],
    totalRows: data.data?.total_rows ?? 0,
    columnMap: data.data?.column_map ?? undefined,
  }
}

/**
 * Télécharge le fichier parquet d'un dataset exposé sur une page StatsData publique.
 * Utilise `fetch` nu (binaire) plutôt que `publicHttp` (JSON).
 */
export async function downloadPublicDatasetParquet(
  docSlug: string,
  dataset: { id: string; name: string },
): Promise<void> {
  if (typeof document === 'undefined') return
  const path = STATSIO_API.studioContent.publicDatasetDownload(docSlug, dataset.id)
  const res = await fetch(`${getApiBaseUrl()}${path}`, { headers: { Accept: '*/*' } })
  if (!res.ok) {
    throw new Error(res.status === 404 ? 'Fichier parquet introuvable.' : 'Téléchargement impossible.')
  }
  const blob = await res.blob()
  const fileName = `${slugify(dataset.name) || 'dataset'}.parquet`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export interface DistinctSourceCtx {
  sources?: import('@/types/studio').BlockSource[]
  primarySourceId?: string
  joins?: import('@/types/studio').BlockJoin[]
  /** Groupes de conditions du bloc appelant (en plus de `filters`, le tableau plat legacy). */
  filterGroups?: FilterGroup[]
  filtersMatch?: 'all' | 'any'
}

function distinctParamsSerializer(
  column: string,
  search: string,
  filters: import('@/types/studio').BlockFilter[],
  ctx: DistinctSourceCtx = {},
): () => string {
  return () => {
    let qs = `columns[]=${encodeURIComponent(column)}&distinct=true&limit=100`
    if (search) qs += `&search=${encodeURIComponent(search)}`
    filters.forEach((f, i) => {
      if (!f.column || f.value === '') return
      qs += `&filters[${i}][column]=${encodeURIComponent(f.column)}`
      qs += `&filters[${i}][operator]=${encodeURIComponent(f.operator)}`
      qs += `&filters[${i}][value]=${encodeURIComponent(f.value)}`
    })
    serializeFilterGroups(ctx.filterGroups, ctx.filtersMatch).forEach((part) => { qs += `&${part}` })
    if (ctx.sources && ctx.sources.length > 1) {
      ctx.sources.forEach((s, i) => {
        qs += `&sources[${i}][id]=${encodeURIComponent(s.id)}`
        qs += `&sources[${i}][dataset_id]=${encodeURIComponent(s.datasetId)}`
        if (s.id === ctx.primarySourceId) qs += `&sources[${i}][primary]=1`
      })
      ;(ctx.joins ?? []).forEach((j, i) => {
        qs += `&joins[${i}][left_source]=${encodeURIComponent(j.leftSourceId)}`
        qs += `&joins[${i}][left_column]=${encodeURIComponent(j.leftColumn)}`
        qs += `&joins[${i}][right_source]=${encodeURIComponent(j.rightSourceId)}`
        qs += `&joins[${i}][right_column]=${encodeURIComponent(j.rightColumn)}`
        qs += `&joins[${i}][type]=${j.type}`
      })
    }
    return qs
  }
}

function pluckDistinct(rows: Record<string, unknown>[], column: string): string[] {
  const seen = new Set<string>()
  for (const row of rows) {
    const val = row[column]
    if (val !== null && val !== undefined && val !== '') seen.add(String(val))
  }
  return Array.from(seen)
}

export async function fetchDistinctValues(
  datasetId: string,
  column: string,
  search: string,
  filters: import('@/types/studio').BlockFilter[] = [],
  ctx: DistinctSourceCtx = {},
): Promise<string[]> {
  const { data } = await apiHttp.get<Envelope<RawBlockQueryResult>>(STATSIO_API.datasets.query(datasetId), {
    params: {},
    paramsSerializer: distinctParamsSerializer(column, search, filters, ctx),
  })
  return pluckDistinct(data.data?.rows ?? [], column)
}

export async function fetchPublicDistinctValues(
  docSlug: string,
  datasetId: string,
  column: string,
  search = '',
  filters: import('@/types/studio').BlockFilter[] = [],
  ctx: DistinctSourceCtx = {},
): Promise<string[]> {
  const { data } = await publicHttp.get<Envelope<RawBlockQueryResult>>(
    STATSIO_API.studioContent.publicDatasetQuery(docSlug, datasetId),
    { params: {}, paramsSerializer: distinctParamsSerializer(column, search, filters, ctx) },
  )
  return pluckDistinct(data.data?.rows ?? [], column)
}

// ─── Facettes d'une colonne (panneau de filtres du Studio) ───────────────────

interface FacetQueryOpts {
  search?: string
  offset?: number
  limit?: number
  filters?: import('@/types/studio').BlockFilter[]
  ctx?: DistinctSourceCtx
}

function facetParamsSerializer(column: string, opts: FacetQueryOpts): () => string {
  const { search = '', offset = 0, limit = 50, filters = [], ctx = {} } = opts
  return () => {
    let qs = `columns[]=${encodeURIComponent(column)}&facet=true&facet_offset=${offset}&facet_limit=${limit}`
    if (search) qs += `&search=${encodeURIComponent(search)}`
    filters.forEach((f, i) => {
      if (!f.column || f.value === '') return
      qs += `&filters[${i}][column]=${encodeURIComponent(f.column)}`
      qs += `&filters[${i}][operator]=${encodeURIComponent(f.operator)}`
      qs += `&filters[${i}][value]=${encodeURIComponent(f.value)}`
    })
    serializeFilterGroups(ctx.filterGroups, ctx.filtersMatch).forEach((part) => { qs += `&${part}` })
    if (ctx.sources && ctx.sources.length > 1) {
      ctx.sources.forEach((s, i) => {
        qs += `&sources[${i}][id]=${encodeURIComponent(s.id)}`
        qs += `&sources[${i}][dataset_id]=${encodeURIComponent(s.datasetId)}`
        if (s.id === ctx.primarySourceId) qs += `&sources[${i}][primary]=1`
      })
      ;(ctx.joins ?? []).forEach((j, i) => {
        qs += `&joins[${i}][left_source]=${encodeURIComponent(j.leftSourceId)}`
        qs += `&joins[${i}][left_column]=${encodeURIComponent(j.leftColumn)}`
        qs += `&joins[${i}][right_source]=${encodeURIComponent(j.rightSourceId)}`
        qs += `&joins[${i}][right_column]=${encodeURIComponent(j.rightColumn)}`
        qs += `&joins[${i}][type]=${j.type}`
      })
    }
    return qs
  }
}

function unwrapFacetResult(payload: unknown, column: string): import('@/types/studio').ColumnFacetResult {
  const p = (payload ?? {}) as { data?: Record<string, unknown>; meta?: Record<string, unknown> }
  const data = p.data ?? {}
  const meta = p.meta ?? {}
  const rawValues = Array.isArray(data.values) ? (data.values as Record<string, unknown>[]) : []
  return {
    column: typeof data.column === 'string' ? data.column : column,
    values: rawValues.map((v) => ({
      value: String(v.value ?? ''),
      count: v.count === null || v.count === undefined ? null : Number(v.count),
    })),
    total: Number(data.total ?? rawValues.length),
    offset: Number(data.offset ?? 0),
    limit: Number(data.limit ?? 50),
    hasCounts: meta.has_counts !== false,
    partial: meta.partial === true,
  }
}

export async function fetchColumnFacets(
  datasetId: string,
  column: string,
  opts: FacetQueryOpts = {},
): Promise<import('@/types/studio').ColumnFacetResult> {
  const { data } = await apiHttp.get(STATSIO_API.datasets.query(datasetId), {
    params: {},
    paramsSerializer: facetParamsSerializer(column, opts),
  })
  return unwrapFacetResult(data, column)
}

export async function fetchPublicColumnFacets(
  docSlug: string,
  datasetId: string,
  column: string,
  opts: FacetQueryOpts = {},
): Promise<import('@/types/studio').ColumnFacetResult> {
  const { data } = await publicHttp.get(
    STATSIO_API.studioContent.publicDatasetQuery(docSlug, datasetId),
    { params: {}, paramsSerializer: facetParamsSerializer(column, opts) },
  )
  return unwrapFacetResult(data, column)
}

// ─── Scalar aggregate ────────────────────────────────────────────────────────
// Une seule valeur agrégée (MIN/MAX/AVG/COUNT/SUM) sur un dataset filtré —
// socle du moteur d'expressions `{{ AVG(prix | carburant=gazole) }}` (Brique 3
// du plan Statsdata v2). S'appuie sur l'endpoint `query` existant : une
// agrégation sans `group_by` renvoie déjà une ligne unique.

export interface ScalarAggregateParams {
  fn: import('@/types/studio').AggregateFunction
  /** Référence de colonne : nue (source primaire), `col@<sourceId>`, ou `calc:<id>`. */
  column: string
  filters?: import('@/types/studio').BlockFilter[]
  filterGroups?: FilterGroup[]
  filtersMatch?: 'all' | 'any'
  /** Contexte multi-sources du bloc appelant (nécessaire quand la ref/les filtres visent une source jointe). */
  sources?: import('@/types/studio').BlockSource[]
  primarySourceId?: string
  joins?: import('@/types/studio').BlockJoin[]
  /** Colonnes calculées du bloc (si `column` est une réf `calc:<id>`). */
  calcColumns?: import('@/types/studio').CalcColumn[]
}

function scalarAggregateQuery(p: ScalarAggregateParams): BlockQueryParams {
  return {
    columns: [p.column],
    limit: 1,
    filters: p.filters,
    filterGroups: p.filterGroups,
    filtersMatch: p.filtersMatch,
    sources: p.sources,
    primarySourceId: p.primarySourceId,
    joins: p.joins,
    calcColumns: p.calcColumns,
    aggregates: [{ column: p.column, fn: p.fn }],
    groupBy: [],
  }
}

function readScalar(result: BlockQueryResult, column: string): number | null {
  const raw = result.rows[0]?.[result.columnMap?.[column] ?? column]
  if (raw === null || raw === undefined || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : null
}

export async function fetchScalarAggregate(datasetId: string, params: ScalarAggregateParams): Promise<number | null> {
  return readScalar(await fetchBlockData(datasetId, scalarAggregateQuery(params)), params.column)
}

export async function fetchPublicScalarAggregate(
  docSlug: string,
  datasetId: string,
  params: ScalarAggregateParams,
): Promise<number | null> {
  return readScalar(await fetchPublicBlockData(docSlug, datasetId, scalarAggregateQuery(params)), params.column)
}

// ─── StatsData document (page) ───────────────────────────────────────────────

export interface ContentChannel {
  id: number
  name?: string | null
  handle?: string | null
  logo_url?: string | null
  custom_color_primary?: string | null
  custom_color_secondary?: string | null
  /** Only present on `fetchPublicStatsDataDocument` — true if the current viewer follows this channel. */
  is_following?: boolean
}

/** Un jeu de données rattaché à un contenu, avec sa fraîcheur (page publique). */
export interface ContentDataset {
  id: string
  name: string
  row_count?: number
  /** Libellé de provenance (ex. « data.gouv.fr ») — null si non renseigné. */
  provenance?: string | null
  /** True si un fichier parquet snapshot est téléchargeable (sources live exclues). */
  downloadable?: boolean
  is_live?: boolean
  last_refreshed_at?: string | null
  next_refresh_at?: string | null
  refresh_frequency?: string | null
}

export interface StatsDataDocument {
  id: string
  title: string
  type?: ContentType
  description?: string | null
  slug?: string
  status?: string
  views_count?: number
  thumbnail_url?: string | null
  published_as?: 'user' | 'channel' | null
  channel_id?: number | null
  /** Numéro de la version actuellement en ligne (v1, v2…). Null tant que non publié. */
  published_version?: number | null
  /** ISO — 1re publication. Présent ⇒ l'auteur (profil/chaîne) est verrouillé. */
  first_published_at?: string | null
  last_published_at?: string | null
  /** ISO — mise en ligne programmée. Null = publier immédiatement au prochain « Publier ». */
  scheduled_publish_at?: string | null
  /** Les lecteurs peuvent commenter sous le contenu publié. Défaut true. */
  comments_enabled?: boolean
  /** Les lecteurs peuvent télécharger les données (parquet / CSV). Défaut true. */
  download_enabled?: boolean
  /** Autoriser l’intégration iframe du contenu / des blocs. Défaut true. */
  embed_enabled?: boolean
  /** Only present when published_as === 'channel' — the channel's name + custom brand colors. */
  channel?: ContentChannel | null
  author?: { name: string }
  /** Dossiers éditoriaux dans lesquels ce contenu est rangé (placement vivant). */
  dossiers?: { id: number; slug: string; name: string; image_url?: string | null }[]
  datasets?: ContentDataset[]
  created_at?: string
  updated_at?: string
  pages?: import('@/types/studio').StudioDocumentPage[]
  sections?: import('@/types/studio').Section[]
  blocks?: StudioBlock[]
  categories?: string[]
  coverage?: ContentCoverage | null
  /** Sous-marque de publication (« domaine »). Défaut `statsio`. */
  sub_brand?: import('@/types/sub-brand').SubBrand
  /** Bloc graphique choisi pour le mini-graphe de la carte de catalogue. Null = automatique. */
  card_block_id?: string | null
  /** Only meaningful for `type === 'survey'`. Null/undefined = ouvert indéfiniment. */
  response_deadline?: string | null
  /** `type === 'survey'` only — format de la consultation. */
  survey_kind?: import('@/types/content-creation').SurveyKind | null
  /** `type === 'survey'` only — le sondage exige une vérification d'identité (à venir). */
  requires_identity_verification?: boolean
  /** `type === 'survey'` + `survey_kind === 'petition'` — objectif de signatures. */
  petition_goal?: number | null
  /** `type === 'survey'` + `survey_kind === 'petition'` — destinataire de la pétition. */
  petition_target?: string | null
  /** Only present on `fetchPublicStatsDataDocument` — true if the current viewer may edit this content. */
  can_edit?: boolean
  /** Only present on `fetchPublicStatsDataDocument` — true if the current viewer favorited this content. */
  is_favorited?: boolean
  /** Présent sur les endpoints privés (show / index) — droits du viewer courant. */
  access?: ContentAccessPayload
  /** True si le viewer est collaborateur (pas propriétaire). */
  is_shared?: boolean
}

export type ContentAccessResource = 'contenu' | 'publication' | 'sources' | 'historique' | 'studio'
export type ContentAccessLevel = 'none' | 'read' | 'write'

export interface ContentAccessPayload {
  is_owner: boolean
  permissions: Record<ContentAccessResource, ContentAccessLevel>
}

export interface ContentCollaborator {
  id: number
  user_id: number
  email: string
  name: string
  avatar?: string | null
  permissions: Record<ContentAccessResource, ContentAccessLevel>
  created_at?: string
}

export interface ContentInvitation {
  id: number
  email: string
  permissions: Record<ContentAccessResource, ContentAccessLevel>
  invited_by_name?: string | null
  expires_at?: string
  created_at: string
}

export interface ContentAccessCatalog {
  resources: { key: ContentAccessResource; label: string; description: string }[]
  levels: { key: ContentAccessLevel; label: string }[]
}

export interface InviteContentCollaboratorsResult {
  created: string[]
  resent: string[]
  skipped: { email: string; reason: string }[]
}

export async function getContentAccessCatalog(): Promise<ContentAccessCatalog> {
  const { data } = await apiHttp.get<{ success: boolean; data: ContentAccessCatalog }>(
    STATSIO_API.studioContent.accessPermissions,
  )
  return data.data
}

export async function getContentCollaborators(slug: string): Promise<ContentCollaborator[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: ContentCollaborator[] }>(
    STATSIO_API.studioContent.collaborators(slug),
  )
  return data.data ?? []
}

export async function updateContentCollaborator(
  slug: string,
  userId: number,
  permissions: Record<ContentAccessResource, ContentAccessLevel>,
): Promise<ContentCollaborator> {
  const { data } = await apiHttp.patch<{ success: boolean; data: ContentCollaborator }>(
    STATSIO_API.studioContent.collaborator(slug, userId),
    { permissions },
  )
  return data.data
}

export async function removeContentCollaborator(slug: string, userId: number): Promise<void> {
  await apiHttp.delete(STATSIO_API.studioContent.collaborator(slug, userId))
}

export async function getContentInvitations(slug: string): Promise<ContentInvitation[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: ContentInvitation[] }>(
    STATSIO_API.studioContent.invitations(slug),
  )
  return data.data ?? []
}

export async function inviteContentCollaborators(
  slug: string,
  payload: { emails: string[]; permissions: Record<ContentAccessResource, ContentAccessLevel> },
): Promise<InviteContentCollaboratorsResult> {
  const { data } = await apiHttp.post<{ success: boolean; data: InviteContentCollaboratorsResult }>(
    STATSIO_API.studioContent.invitations(slug),
    payload,
  )
  return data.data
}

export async function revokeContentInvitation(slug: string, invitationId: number): Promise<void> {
  await apiHttp.delete(STATSIO_API.studioContent.invitation(slug, invitationId))
}

export interface ContentInvitationDetails {
  email: string
  status: string
  expired: boolean
  expires_at?: string
  content_title?: string
  content_slug?: string
  content_type?: string
  permissions: Record<ContentAccessResource, ContentAccessLevel>
  inviter_name: string
}

export async function getContentInvitationByToken(token: string): Promise<ContentInvitationDetails> {
  const { data } = await publicHttp.get<{ success: boolean; data: ContentInvitationDetails }>(
    STATSIO_API.studioContent.invitationByToken(token),
  )
  return data.data
}

export async function acceptContentInvitation(token: string): Promise<{ slug: string; content_id: number }> {
  const { data } = await apiHttp.post<{ success: boolean; data: { slug: string; content_id: number } }>(
    STATSIO_API.studioContent.acceptInvitation(token),
  )
  return data.data
}

export function emptyContentPermissions(): Record<ContentAccessResource, ContentAccessLevel> {
  return {
    contenu: 'none',
    publication: 'none',
    sources: 'none',
    historique: 'none',
    studio: 'none',
  }
}

export function canAccessResource(
  access: ContentAccessPayload | undefined | null,
  resource: ContentAccessResource,
  level: 'read' | 'write' = 'read',
): boolean {
  if (!access) return false
  if (access.is_owner) return true
  const current = access.permissions?.[resource] ?? 'none'
  if (level === 'read') return current === 'read' || current === 'write'
  return current === 'write'
}

export async function fetchUserStudioContents(type?: ContentType, channelId?: number): Promise<StatsDataDocument[]> {
  const { data } = await apiHttp.get<Envelope<StatsDataDocument[]>>(STATSIO_API.studioContent.collection, {
    params: { ...(type ? { type } : {}), ...(channelId ? { channel_id: channelId } : {}) },
  })
  return data.data ?? []
}

export interface CreateStudioContentPayload {
  title: string
  type: ContentType
  categories?: string[]
  sub_brand?: import('@/types/sub-brand').SubBrand
  coverage?: ContentCoverage
  survey_kind?: import('@/types/content-creation').SurveyKind
  requires_identity_verification?: boolean
}

export async function createStudioContent(payload: CreateStudioContentPayload): Promise<StatsDataDocument> {
  const { data } = await apiHttp.post<Envelope<StatsDataDocument>>(STATSIO_API.studioContent.collection, payload)
  return data.data
}

/** Cadrage d'une collection publique : par domaine (sous-marque) et/ou par chaîne. */
export interface PublicCollectionScope {
  sub_brand?: import('@/types/sub-brand').SubBrand
  channel_id?: number
}

async function fetchPublicCollection(type: ContentType, scope: PublicCollectionScope): Promise<StatsDataDocument[]> {
  const { data } = await publicHttp.get<Envelope<StatsDataDocument[]>>(STATSIO_API.studioContent.publicCollection, {
    params: {
      type,
      ...(scope.sub_brand ? { sub_brand: scope.sub_brand } : {}),
      ...(scope.channel_id ? { channel_id: scope.channel_id } : {}),
    },
  })
  return data.data ?? []
}

export function fetchPublicStatsDataCatalog(scope: PublicCollectionScope = {}): Promise<StatsDataDocument[]> {
  return fetchPublicCollection('statsdata', scope)
}

export function fetchPublicSurveys(scope: PublicCollectionScope = {}): Promise<StatsDataDocument[]> {
  return fetchPublicCollection('survey', scope)
}

export function fetchPublicArticles(scope: PublicCollectionScope = {}): Promise<StatsDataDocument[]> {
  return fetchPublicCollection('article', scope)
}

export async function fetchPublicCatalog(query: import('@/types/catalog').CatalogQuery): Promise<import('@/types/catalog').CatalogResponse> {
  const { data } = await publicHttp.get<Partial<import('@/types/catalog').CatalogResponse>>(STATSIO_API.studioContent.publicCatalog, {
    params: {
      type: query.type,
      ...(query.q ? { q: query.q } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.format ? { format: query.format } : {}),
      ...(query.sort ? { sort: query.sort } : {}),
      ...(query.has_data ? { has_data: 1 } : {}),
      ...(query.per_page ? { per_page: query.per_page } : {}),
      ...(query.categories?.length ? { categories: query.categories } : {}),
      ...(query.sub_brand ? { sub_brand: query.sub_brand } : {}),
      ...(query.channel_id ? { channel_id: query.channel_id } : {}),
      ...(query.survey_kind ? { survey_kind: query.survey_kind } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.not_participated ? { not_participated: 1 } : {}),
      ...(query.respondent_token ? { respondent_token: query.respondent_token } : {}),
    },
  })
  return {
    data: data.data ?? [],
    meta: data.meta ?? { total: 0, shown: 0, per_page: query.per_page ?? 9, has_more: false },
    facets: data.facets ?? { categories: [], formats: [], survey_kinds: [] },
    stats: data.stats ?? { published: 0, channels: 0, charts: 0, last_published_at: null },
    featured: data.featured ?? null,
  }
}

export async function fetchStatsDataDocument(documentId: string): Promise<StatsDataDocument> {
  const { data } = await apiHttp.get<Envelope<StatsDataDocument>>(STATSIO_API.studioContent.one(documentId))
  return data.data
}

export async function fetchPublicStatsDataDocument(slug: string): Promise<StatsDataDocument> {
  const { data } = await publicHttp.get<Envelope<StatsDataDocument>>(STATSIO_API.studioContent.publicBySlug(slug))
  return data.data
}

// ─── Recherche globale (modale du header) ────────────────────────────────────

const EMPTY_SEARCH: import('@/types/search').GlobalSearchResponse = { query: '', total: 0, groups: [] }

/** Recherche globale : contenus publiés (article/statsdata/sondage) + chaînes, groupés par type. */
export async function fetchGlobalSearch(q: string): Promise<import('@/types/search').GlobalSearchResponse> {
  const query = q.trim()
  if (query.length < 2) return { ...EMPTY_SEARCH, query }

  const { data } = await publicHttp.get<Partial<import('@/types/search').GlobalSearchResponse>>(
    STATSIO_API.studioContent.publicSearch,
    { params: { q: query } },
  )
  return {
    query: data.query ?? query,
    total: data.total ?? 0,
    groups: data.groups ?? [],
  }
}

// ─── Mention `@` de l'assistant du Studio ────────────────────────────────────

export interface ContentMention {
  id: string
  type: ContentType
  slug: string
  title: string
  publisher: { name: string; is_channel: boolean }
}

/** Recherche de contenus publiés (article / statsdata / sondage) pour la mention `@`. */
export async function fetchContentMentions(
  q: string,
  type?: ContentType,
): Promise<ContentMention[]> {
  const { data } = await publicHttp.get<Envelope<ContentMention[]>>(STATSIO_API.studioContent.publicMentions, {
    params: { q, ...(type ? { type } : {}) },
  })
  return data.data ?? []
}

// ─── Bloc Statsdata réutilisé dans un article (bloc `sd-embed`) ───────────────

/** Métadonnées légères du Statsdata source d'un bloc embarqué. */
export interface EmbeddedBlockDoc {
  id: string
  slug: string
  title: string
  type?: ContentType
  status?: string
  published_as?: 'user' | 'channel' | null
  channel?: ContentChannel | null
  author?: { name: string }
}

export interface EmbeddableBlockSummary {
  id: string
  type: import('@/types/studio').BlockType
  title: string
  datasetName?: string | null
}

export interface ResolvedEmbeddedBlock {
  block: StudioBlock
  doc: EmbeddedBlockDoc
  pages: import('@/types/studio').StudioDocumentPage[]
  datasets: ContentDataset[]
  /** Paramètres déclarés sur la page source du bloc (pour résoudre ses jetons `{{param}}`). */
  params: import('@/types/studio').PageParam[]
}

/** Liste les blocs embarquables d'un Statsdata publié (étape 2 du sélecteur). */
export async function fetchStatsDataEmbeddableBlocks(
  slug: string,
): Promise<{ doc: EmbeddedBlockDoc; blocks: EmbeddableBlockSummary[] }> {
  const { data } = await publicHttp.get<Envelope<{ doc: EmbeddedBlockDoc; blocks?: EmbeddableBlockSummary[] }>>(
    STATSIO_API.studioContent.publicBlocks(slug),
  )
  return { doc: data.data.doc, blocks: data.data.blocks ?? [] }
}

/**
 * Aperçu du mini-graphe réel de la carte de catalogue d'un Statsdata : le backend
 * reprend le premier bloc graphique (ou `card_block_id`), exécute sa requête et
 * renvoie des séries compactes. `blockId` force un bloc (aperçu live des réglages).
 */
export async function fetchStatsDataCardPreview(
  slug: string,
  blockId?: string,
): Promise<import('@/types/catalog').CardPreview> {
  const { data } = await publicHttp.get<Partial<Envelope<import('@/types/catalog').CardPreview>>>(
    STATSIO_API.studioContent.cardPreview(slug),
    { params: blockId ? { block_id: blockId } : undefined },
  )
  return (data?.data ?? { empty: true }) as import('@/types/catalog').CardPreview
}

/** Résout un bloc unique d'un Statsdata publié pour l'afficher dans un article. */
export async function fetchPublicStatsDataBlock(
  slug: string,
  blockId: string,
): Promise<ResolvedEmbeddedBlock> {
  const { data } = await publicHttp.get<
    Envelope<{
      block: StudioBlock
      doc: EmbeddedBlockDoc
      pages?: import('@/types/studio').StudioDocumentPage[]
      datasets?: ContentDataset[]
      params?: import('@/types/studio').PageParam[]
    }>
  >(STATSIO_API.studioContent.publicBlock(slug, blockId))
  return {
    block: data.data.block,
    doc: data.data.doc,
    pages: data.data.pages ?? [],
    datasets: data.data.datasets ?? [],
    params: data.data.params ?? [],
  }
}

export interface SaveStatsDataDocumentPayload {
  title?: string
  slug?: string
  description?: string | null
  categories?: string[]
  coverage?: ContentCoverage | null
  /** Sous-marque de publication (« domaine »). */
  sub_brand?: import('@/types/sub-brand').SubBrand
  /** Bloc graphique du mini-graphe de la carte. Null = automatique (premier graphique). */
  card_block_id?: string | null
  response_deadline?: string | null
  /** Date (YYYY-MM-DD) ou null pour publier immédiatement. */
  scheduled_publish_at?: string | null
  /** Activer / désactiver les commentaires lecteurs. */
  comments_enabled?: boolean
  /** Activer / désactiver le téléchargement des données. */
  download_enabled?: boolean
  /** Activer / désactiver l’intégration iframe. */
  embed_enabled?: boolean
  /** `type === 'survey'` uniquement — format de la consultation. */
  survey_kind?: import('@/types/content-creation').SurveyKind
  /** `type === 'survey'` uniquement — exiger la vérification d'identité des répondants. */
  requires_identity_verification?: boolean
  published_as?: 'user' | 'channel' | null
  channel_id?: number | null
  pages?: import('@/types/studio').StudioDocumentPage[]
  sections?: import('@/types/studio').Section[]
  blocks?: StudioBlock[]
}

/**
 * PATCH JSON du document. La miniature est une image de la bibliothèque de médias
 * (`thumbnailMediaId`) — plus d'upload de fichier ici.
 */
export async function saveStatsDataDocument(
  documentId: string,
  payload: SaveStatsDataDocumentPayload,
  thumbnailMediaId?: number | null,
  removeThumbnail?: boolean,
): Promise<StatsDataDocument> {
  const body: Record<string, unknown> = { ...payload }
  if (thumbnailMediaId != null) body.thumbnail_media_id = thumbnailMediaId
  if (removeThumbnail) body.remove_thumbnail = true

  const { data } = await apiHttp.patch<Envelope<StatsDataDocument>>(STATSIO_API.studioContent.one(documentId), body)
  return data.data
}

export async function deleteStatsDataDocument(documentId: string): Promise<void> {
  await apiHttp.delete(STATSIO_API.studioContent.one(documentId))
}

/**
 * Publie le contenu (fige une nouvelle version, met la page publique à jour).
 * `publishedAs` / `channelId` ne sont pris en compte qu'à la 1re publication.
 */
export async function publishStudioContent(
  documentId: string,
  opts: {
    publishedAs?: 'user' | 'channel'
    channelId?: number | null
    /** Ranger le contenu dans ces dossiers éditoriaux (omis = placement inchangé). */
    dossierIds?: number[]
    /** Ignore `scheduled_publish_at` et met en ligne tout de suite. */
    immediate?: boolean
  } = {},
): Promise<StatsDataDocument> {
  const { data } = await apiHttp.post<Envelope<StatsDataDocument>>(STATSIO_API.studioContent.publish(documentId), {
    ...(opts.publishedAs ? { published_as: opts.publishedAs } : {}),
    ...(opts.channelId != null ? { channel_id: opts.channelId } : {}),
    ...(opts.dossierIds ? { dossier_ids: opts.dossierIds } : {}),
    ...(opts.immediate ? { immediate: true } : {}),
  })
  return data.data
}

export async function unpublishStudioContent(documentId: string): Promise<StatsDataDocument> {
  const { data } = await apiHttp.post<Envelope<StatsDataDocument>>(STATSIO_API.studioContent.unpublish(documentId))
  return data.data
}

export interface StudioContentVersionRow {
  version: number
  title: string
  created_at: string | null
  published_as: 'user' | 'channel' | null
  author_name: string
  is_current: boolean
}

export async function fetchContentVersions(documentId: string): Promise<StudioContentVersionRow[]> {
  const { data } = await apiHttp.get<Envelope<StudioContentVersionRow[]>>(STATSIO_API.studioContent.versions(documentId))
  return data.data ?? []
}

/** Recharge une version antérieure dans le brouillon de travail (public inchangé). */
export async function restoreContentVersion(documentId: string, version: number): Promise<StatsDataDocument> {
  const { data } = await apiHttp.post<Envelope<StatsDataDocument>>(STATSIO_API.studioContent.restoreVersion(documentId, version))
  return data.data
}

export async function fetchContentDataSources(documentId: string): Promise<import('@/api/channels').ChannelDataSource[]> {
  const { data } = await apiHttp.get<{ success: boolean; data: RawContentDataSource[] }>(
    STATSIO_API.studioContent.dataSources(documentId),
  )
  return (data.data ?? []).map((raw) => ({
    id: raw.id,
    name: raw.name,
    type: raw.type,
    sourceKind: raw.source_kind,
    origin: raw.origin,
    rowCount: raw.row_count,
    status: raw.status,
    lastRefreshedAt: raw.last_refreshed_at,
    nextRefreshAt: raw.next_refresh_at,
    refreshFrequency: raw.refresh_frequency,
    usedByCount: raw.used_by_count,
    usedBy: raw.used_by,
  }))
}

type RawContentDataSource = {
  id: string
  name: string
  type: string | null
  source_kind: string | null
  origin: string | null
  row_count: number
  status: import('@/api/channels').ChannelDataSource['status']
  last_refreshed_at: string | null
  next_refresh_at: string | null
  refresh_frequency: string | null
  used_by_count: number
  used_by: import('@/api/channels').ChannelDataSourceUsage[]
}

// ─── Commentaires lecteurs ────────────────────────────────────────────────────

export interface ContentComment {
  id: number
  body: string
  created_at: string | null
  author: { id: number; name: string; initials: string }
  can_delete: boolean
}

export async function fetchContentComments(slug: string): Promise<ContentComment[]> {
  const { data } = await publicHttp.get<Envelope<ContentComment[]>>(
    STATSIO_API.studioContent.publicComments(slug),
  )
  return data.data ?? []
}

export async function postContentComment(slug: string, body: string): Promise<ContentComment> {
  const { data } = await apiHttp.post<Envelope<ContentComment>>(
    STATSIO_API.studioContent.publicComments(slug),
    { body },
  )
  return data.data
}

export async function deleteContentComment(slug: string, commentId: number): Promise<void> {
  await apiHttp.delete(STATSIO_API.studioContent.publicComment(slug, commentId))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapDatasetMeta(raw: Record<string, unknown>): DatasetMeta {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    description: raw.description ? String(raw.description) : null,
    rowCount: Number(raw.row_count ?? 0),
    status: (raw.status as DatasetMeta['status']) ?? 'pending',
    progress: raw.progress != null ? Number(raw.progress) : undefined,
    createdAt: raw.created_at ? String(raw.created_at) : undefined,
    isOwner: raw.is_owner !== false,
    dataSourceId: raw.data_source_id != null ? String(raw.data_source_id) : undefined,
    sourceKind: raw.source_kind === 'api' ? 'api' : undefined,
    materialization: raw.materialization as DatasetMeta['materialization'],
    refreshFrequency: raw.refresh_frequency as DatasetMeta['refreshFrequency'],
    lastRefreshedAt: raw.last_refreshed_at ? String(raw.last_refreshed_at) : null,
    nextRefreshAt: raw.next_refresh_at ? String(raw.next_refresh_at) : null,
  }
}
