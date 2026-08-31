import { apiHttp, publicHttp } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'
import type { DatasetColumn, DatasetMeta, DatasetWithSchema, BlockQueryResult, StudioBlock, ContentVisibility } from '@/types/studio'
import type { ContentType } from '@/types/content-creation'

// ─── Datasets ─────────────────────────────────────────────────────────────────

export async function fetchDatasets(): Promise<DatasetMeta[]> {
  const { data } = await apiHttp.get(STATSIO_API.datasets.collection)
  return (data.data ?? []).map(mapDatasetMeta)
}

export async function fetchDatasetSchema(datasetId: string): Promise<DatasetWithSchema> {
  const { data } = await apiHttp.get(STATSIO_API.datasets.one(datasetId))
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
  const { data } = await apiHttp.get(STATSIO_API.datasets.preview(datasetId), { params: { limit } })
  return data.data
}

export async function updateDataset(datasetId: string, payload: { name?: string; description?: string }): Promise<DatasetMeta> {
  const { data } = await apiHttp.patch(STATSIO_API.datasets.one(datasetId), payload)
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
  filters?: import('@/types/studio').BlockFilter[]
  joins?: import('@/types/studio').BlockJoin[]
  aggregate?: import('@/types/studio').AggregateFunction
  aggregateColumns?: string[]
  groupBy?: string[]
}

function buildParamsSerializer(p: BlockQueryParams): string {
  const parts: string[] = []
  if (p.columns?.length) {
    p.columns.forEach((c: string) => parts.push(`columns[]=${encodeURIComponent(c)}`))
  }
  if (p.limit !== undefined) parts.push(`limit=${p.limit}`)
  if (p.offset) parts.push(`offset=${p.offset}`)
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
  if (p.joins?.length) {
    p.joins.forEach((j: import('@/types/studio').BlockJoin, i: number) => {
      parts.push(`joins[${i}][dataset_id]=${encodeURIComponent(j.datasetId)}`)
      parts.push(`joins[${i}][left_column]=${encodeURIComponent(j.leftColumn)}`)
      parts.push(`joins[${i}][right_column]=${encodeURIComponent(j.rightColumn)}`)
      parts.push(`joins[${i}][type]=${j.type}`)
      j.columns.forEach((c) => parts.push(`joins[${i}][columns][]=${encodeURIComponent(c)}`))
    })
  }
  if (p.aggregate && p.aggregateColumns?.length) {
    parts.push(`aggregate=${encodeURIComponent(p.aggregate)}`)
    p.aggregateColumns.forEach((c) => parts.push(`aggregate_columns[]=${encodeURIComponent(c)}`))
    p.groupBy?.forEach((c) => parts.push(`group_by[]=${encodeURIComponent(c)}`))
  }
  return parts.join('&')
}

export async function fetchBlockData(
  datasetId: string,
  params: BlockQueryParams = {},
): Promise<BlockQueryResult> {
  const { data } = await apiHttp.get(STATSIO_API.datasets.query(datasetId), {
    params,
    paramsSerializer: buildParamsSerializer,
  })
  return {
    columns: data.data?.columns ?? [],
    rows: data.data?.rows ?? [],
    totalRows: data.data?.total_rows ?? 0,
  }
}

export async function fetchPublicBlockData(
  docSlug: string,
  datasetId: string,
  params: BlockQueryParams = {},
): Promise<BlockQueryResult> {
  const { data } = await publicHttp.get(
    STATSIO_API.studioContent.publicDatasetQuery(docSlug, datasetId),
    { params, paramsSerializer: buildParamsSerializer },
  )
  return {
    columns: data.data?.columns ?? [],
    rows: data.data?.rows ?? [],
    totalRows: data.data?.total_rows ?? 0,
  }
}

function buildSearchParamsSerializer(columns: string[], searchQ: string, limit: number, joins: import('@/types/studio').BlockJoin[]): () => string {
  return () => {
    const parts = columns.map((c) => `search_columns[]=${encodeURIComponent(c)}`)
    parts.push(`search_q=${encodeURIComponent(searchQ)}`)
    parts.push(`limit=${limit}`)
    if (joins.length) {
      joins.forEach((j, i) => {
        parts.push(`joins[${i}][dataset_id]=${encodeURIComponent(j.datasetId)}`)
        parts.push(`joins[${i}][left_column]=${encodeURIComponent(j.leftColumn)}`)
        parts.push(`joins[${i}][right_column]=${encodeURIComponent(j.rightColumn)}`)
        parts.push(`joins[${i}][type]=${j.type}`)
        j.columns.forEach((c) => parts.push(`joins[${i}][columns][]=${encodeURIComponent(c)}`))
      })
    }
    return parts.join('&')
  }
}

export async function fetchSearchRows(
  datasetId: string,
  columns: string[],
  searchQ: string,
  limit = 50,
  joins: import('@/types/studio').BlockJoin[] = [],
): Promise<Record<string, unknown>[]> {
  const { data } = await apiHttp.get(STATSIO_API.datasets.query(datasetId), {
    params: {},
    paramsSerializer: buildSearchParamsSerializer(columns, searchQ, limit, joins),
  })
  return data.data?.rows ?? []
}

export async function fetchPublicSearchRows(
  docSlug: string,
  datasetId: string,
  columns: string[],
  searchQ: string,
  limit = 50,
  joins: import('@/types/studio').BlockJoin[] = [],
): Promise<Record<string, unknown>[]> {
  const { data } = await publicHttp.get(STATSIO_API.studioContent.publicDatasetQuery(docSlug, datasetId), {
    params: {},
    paramsSerializer: buildSearchParamsSerializer(columns, searchQ, limit, joins),
  })
  return data.data?.rows ?? []
}

function distinctParamsSerializer(
  column: string,
  search: string,
  filters: import('@/types/studio').BlockFilter[],
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
): Promise<string[]> {
  const { data } = await apiHttp.get(STATSIO_API.datasets.query(datasetId), {
    params: {},
    paramsSerializer: distinctParamsSerializer(column, search, filters),
  })
  return pluckDistinct(data.data?.rows ?? [], column)
}

export async function fetchPublicDistinctValues(
  docSlug: string,
  datasetId: string,
  column: string,
  search = '',
  filters: import('@/types/studio').BlockFilter[] = [],
): Promise<string[]> {
  const { data } = await publicHttp.get(
    STATSIO_API.studioContent.publicDatasetQuery(docSlug, datasetId),
    { params: {}, paramsSerializer: distinctParamsSerializer(column, search, filters) },
  )
  return pluckDistinct(data.data?.rows ?? [], column)
}

// ─── Scalar aggregate ────────────────────────────────────────────────────────
// Une seule valeur agrégée (MIN/MAX/AVG/COUNT/SUM) sur un dataset filtré —
// socle du moteur d'expressions `{{ AVG(prix | carburant=gazole) }}` (Brique 3
// du plan Statsdata v2). S'appuie sur l'endpoint `query` existant : une
// agrégation sans `group_by` renvoie déjà une ligne unique.

export interface ScalarAggregateParams {
  fn: import('@/types/studio').AggregateFunction
  column: string
  filters?: import('@/types/studio').BlockFilter[]
  joins?: import('@/types/studio').BlockJoin[]
}

function scalarAggregateQuery(p: ScalarAggregateParams): BlockQueryParams {
  return {
    columns: [p.column],
    limit: 1,
    filters: p.filters,
    joins: p.joins,
    aggregate: p.fn,
    aggregateColumns: [p.column],
    groupBy: [],
  }
}

function readScalar(result: BlockQueryResult, column: string): number | null {
  const raw = result.rows[0]?.[column]
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
  visibility?: ContentVisibility
  thumbnail_url?: string | null
  published_as?: 'user' | 'channel' | null
  channel_id?: number | null
  /** Only present when published_as === 'channel' — the channel's name + custom brand colors. */
  channel?: ContentChannel | null
  author?: { name: string }
  datasets?: ContentDataset[]
  created_at?: string
  updated_at?: string
  pages?: import('@/types/studio').StudioDocumentPage[]
  sections?: import('@/types/studio').Section[]
  blocks?: StudioBlock[]
  categories?: string[]
  coverage_type?: 'monde' | 'pays' | 'ville' | null
  emoji?: string | null
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
}

export async function fetchUserStudioContents(type?: ContentType, channelId?: number): Promise<StatsDataDocument[]> {
  const { data } = await apiHttp.get(STATSIO_API.studioContent.collection, {
    params: { ...(type ? { type } : {}), ...(channelId ? { channel_id: channelId } : {}) },
  })
  return data.data ?? []
}

export interface CreateStudioContentPayload {
  title: string
  type: ContentType
  categories?: string[]
  coverage_type?: string
  coverage_data?: string[]
  visibility?: ContentVisibility
  published_as?: 'user' | 'channel'
  channel_id?: number
  survey_kind?: import('@/types/content-creation').SurveyKind
  requires_identity_verification?: boolean
}

export async function createStudioContent(payload: CreateStudioContentPayload): Promise<StatsDataDocument> {
  const { data } = await apiHttp.post(STATSIO_API.studioContent.collection, payload)
  return data.data
}

export async function fetchPublicStatsDataCatalog(categories?: string[], channelId?: number): Promise<StatsDataDocument[]> {
  const { data } = await publicHttp.get(STATSIO_API.studioContent.publicCollection, {
    params: { type: 'statsdata', ...(categories?.length ? { categories } : {}), ...(channelId ? { channel_id: channelId } : {}) },
  })
  return data.data ?? []
}

export async function fetchPublicSurveys(categories?: string[], channelId?: number): Promise<StatsDataDocument[]> {
  const { data } = await publicHttp.get(STATSIO_API.studioContent.publicCollection, {
    params: { type: 'survey', ...(categories?.length ? { categories } : {}), ...(channelId ? { channel_id: channelId } : {}) },
  })
  return data.data ?? []
}

export async function fetchPublicArticles(categories?: string[], channelId?: number): Promise<StatsDataDocument[]> {
  const { data } = await publicHttp.get(STATSIO_API.studioContent.publicCollection, {
    params: { type: 'article', ...(categories?.length ? { categories } : {}), ...(channelId ? { channel_id: channelId } : {}) },
  })
  return data.data ?? []
}

export async function fetchPublicCatalog(query: import('@/types/catalog').CatalogQuery): Promise<import('@/types/catalog').CatalogResponse> {
  const { data } = await publicHttp.get(STATSIO_API.studioContent.publicCatalog, {
    params: {
      type: query.type,
      ...(query.q ? { q: query.q } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.format ? { format: query.format } : {}),
      ...(query.sort ? { sort: query.sort } : {}),
      ...(query.has_data ? { has_data: 1 } : {}),
      ...(query.per_page ? { per_page: query.per_page } : {}),
      ...(query.categories?.length ? { categories: query.categories } : {}),
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
  const { data } = await apiHttp.get(STATSIO_API.studioContent.one(documentId))
  return data.data
}

export async function fetchPublicStatsDataDocument(slug: string): Promise<StatsDataDocument> {
  const { data } = await publicHttp.get(STATSIO_API.studioContent.publicBySlug(slug))
  return data.data
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
  const { data } = await publicHttp.get(STATSIO_API.studioContent.publicMentions, {
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
  const { data } = await publicHttp.get(STATSIO_API.studioContent.publicBlocks(slug))
  return { doc: data.data?.doc, blocks: data.data?.blocks ?? [] }
}

/** Résout un bloc unique d'un Statsdata publié pour l'afficher dans un article. */
export async function fetchPublicStatsDataBlock(
  slug: string,
  blockId: string,
): Promise<ResolvedEmbeddedBlock> {
  const { data } = await publicHttp.get(STATSIO_API.studioContent.publicBlock(slug, blockId))
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
  status?: string
  visibility?: ContentVisibility
  categories?: string[]
  emoji?: string | null
  response_deadline?: string | null
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

/** PATCH via multipart quand `thumbnail`/`removeThumbnail` est fourni — Laravel lit `_method` pour router un POST vers `update()`. */
export async function saveStatsDataDocument(
  documentId: string,
  payload: SaveStatsDataDocumentPayload,
  thumbnail?: File | null,
  removeThumbnail?: boolean,
): Promise<StatsDataDocument> {
  if (thumbnail || removeThumbnail) {
    const form = new FormData()
    form.append('_method', 'PATCH')
    if (thumbnail) form.append('thumbnail', thumbnail)
    if (removeThumbnail) form.append('remove_thumbnail', '1')
    appendSavePayload(form, payload)

    const { data } = await apiHttp.post(STATSIO_API.studioContent.one(documentId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  }

  const { data } = await apiHttp.patch(STATSIO_API.studioContent.one(documentId), payload)
  return data.data
}

function appendSavePayload(form: FormData, payload: SaveStatsDataDocumentPayload): void {
  if (payload.title !== undefined) form.append('title', payload.title)
  if (payload.slug !== undefined) form.append('slug', payload.slug)
  if (payload.description !== undefined) form.append('description', payload.description ?? '')
  if (payload.status !== undefined) form.append('status', payload.status)
  if (payload.visibility !== undefined) form.append('visibility', payload.visibility)
  if (payload.categories !== undefined) payload.categories.forEach((c) => form.append('categories[]', c))
  if (payload.emoji !== undefined) form.append('emoji', payload.emoji ?? '')
  if (payload.response_deadline !== undefined) form.append('response_deadline', payload.response_deadline ?? '')
  if (payload.survey_kind !== undefined) form.append('survey_kind', payload.survey_kind)
  if (payload.requires_identity_verification !== undefined)
    form.append('requires_identity_verification', payload.requires_identity_verification ? '1' : '0')
  if (payload.published_as !== undefined) form.append('published_as', payload.published_as ?? '')
  if (payload.channel_id !== undefined && payload.channel_id != null) form.append('channel_id', String(payload.channel_id))
}

export async function deleteStatsDataDocument(documentId: string): Promise<void> {
  await apiHttp.delete(STATSIO_API.studioContent.one(documentId))
}

export async function publishStatsDataDocument(documentId: string): Promise<void> {
  await apiHttp.patch(STATSIO_API.studioContent.one(documentId), { status: 'published' })
}

export async function setStatsDataDocumentStatus(documentId: string, status: 'draft' | 'published'): Promise<StatsDataDocument> {
  const { data } = await apiHttp.patch(STATSIO_API.studioContent.one(documentId), { status })
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
