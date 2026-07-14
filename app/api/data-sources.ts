import { apiHttp } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'
import type { AuthType, HttpMethod } from '@/composables/useAddSourceWizard'

export type RefreshFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export type PaginationStyle = 'none' | 'offset' | 'page' | 'cursor' | 'next_link'
export type Materialization = 'snapshot' | 'live'

/** Mapping colonne Studio → paramètre de requête upstream, pour une source "live". */
export interface QueryMappingFilter {
  /** Filtre simple (égalité) : un seul paramètre upstream. */
  param?: string
  /** Filtre de plage (bornes min/max) : deux paramètres upstream. */
  range?: { gteParam: string; lteParam: string }
  operators: Array<'eq' | 'in' | 'gte' | 'lte'>
}

export interface QueryMapping {
  countPath: string | null
  maxPageSize: number | null
  filters: Record<string, QueryMappingFilter>
  sortableColumns: string[]
  supportsDistinct: boolean
  supportsJoins: boolean
  supportsAggregate: boolean
}

export interface DataSourcePagination {
  style: PaginationStyle
  paramName?: string
  paramStart?: number
  sizeParam?: string
  pageSize?: number
  totalPath?: string
  totalMode?: 'items' | 'pages'
  cursorParam?: string
  cursorPath?: string
  nextLinkSource?: 'body' | 'header'
  nextLinkPath?: string
  maxPages?: number | null
}

export interface DataSourceApiConfig {
  url: string
  method: HttpMethod
  authType: AuthType
  headers: Record<string, string>
  dataPath: string | null
  pagination: DataSourcePagination
}

export interface DataSourceDetail {
  id: string
  name: string
  type: string
  sourceKind: 'upload' | 'api'
  /** Non pertinent pour source_kind !== 'api' — toujours 'snapshot' par défaut. */
  materialization: Materialization
  originalFilename: string | null
  fileSizeBytes: number | null
  status: string
  isPartial: boolean
  partialReason: string | null
  visibility: 'private' | 'public'
  categories: string[]
  provenance: { id: number; slug: string; name: string } | null
  provenanceOtherLabel: string | null
  apiConfig: DataSourceApiConfig | null
  /** Uniquement pour materialization === 'live'. */
  queryMapping: QueryMapping | null
  refreshFrequency: RefreshFrequency
  lastRefreshedAt: string | null
  nextRefreshAt: string | null
  isOwner: boolean
}

function mapQueryMappingFromApi(raw: Record<string, unknown> | null | undefined): QueryMapping | null {
  if (!raw) return null

  const rawFilters = (raw.filters as Record<string, Record<string, unknown>>) ?? {}
  const filters: Record<string, QueryMappingFilter> = {}
  for (const [column, f] of Object.entries(rawFilters)) {
    const range = f.range as Record<string, unknown> | undefined
    filters[column] = {
      param: f.param ? String(f.param) : undefined,
      range: range ? { gteParam: String(range.gte_param), lteParam: String(range.lte_param) } : undefined,
      operators: (f.operators as QueryMappingFilter['operators']) ?? [],
    }
  }

  return {
    countPath: raw.count_path ? String(raw.count_path) : null,
    maxPageSize: raw.max_page_size != null ? Number(raw.max_page_size) : null,
    filters,
    sortableColumns: (raw.sortable_columns as string[]) ?? [],
    supportsDistinct: raw.supports_distinct === true,
    supportsJoins: raw.supports_joins === true,
    supportsAggregate: raw.supports_aggregate === true,
  }
}

function mapPaginationFromApi(raw: Record<string, unknown> | undefined): DataSourcePagination {
  if (!raw) return { style: 'none' }

  return {
    style: (raw.style as PaginationStyle) ?? 'none',
    paramName: raw.param_name ? String(raw.param_name) : undefined,
    paramStart: raw.param_start != null ? Number(raw.param_start) : undefined,
    sizeParam: raw.size_param ? String(raw.size_param) : undefined,
    pageSize: raw.page_size != null ? Number(raw.page_size) : undefined,
    totalPath: raw.total_path ? String(raw.total_path) : undefined,
    totalMode: (raw.total_mode as DataSourcePagination['totalMode']) ?? undefined,
    cursorParam: raw.cursor_param ? String(raw.cursor_param) : undefined,
    cursorPath: raw.cursor_path ? String(raw.cursor_path) : undefined,
    nextLinkSource: (raw.next_link_source as DataSourcePagination['nextLinkSource']) ?? undefined,
    nextLinkPath: raw.next_link_path ? String(raw.next_link_path) : undefined,
    maxPages: raw.max_pages != null ? Number(raw.max_pages) : undefined,
  }
}

/** camelCase → snake_case, ne garde que les clés pertinentes pour le style choisi. */
export function mapPaginationToApi(pagination: DataSourcePagination): Record<string, unknown> {
  const { style } = pagination
  if (style === 'none') return { style: 'none' }

  const base: Record<string, unknown> = { style }
  if (style === 'offset' || style === 'page') {
    base.param_name = pagination.paramName || (style === 'page' ? 'page' : 'offset')
    base.param_start = pagination.paramStart ?? (style === 'page' ? 1 : 0)
    base.page_size = pagination.pageSize ?? 100
    if (pagination.sizeParam) base.size_param = pagination.sizeParam
    if (pagination.totalPath) {
      base.total_path = pagination.totalPath
      base.total_mode = pagination.totalMode ?? 'items'
    }
  } else if (style === 'cursor') {
    base.cursor_param = pagination.cursorParam || 'cursor'
    base.cursor_path = pagination.cursorPath || 'next_cursor'
    base.page_size = pagination.pageSize ?? 100
    if (pagination.sizeParam) base.size_param = pagination.sizeParam
  } else if (style === 'next_link') {
    base.next_link_source = pagination.nextLinkSource ?? 'body'
    if (base.next_link_source === 'body') {
      base.next_link_path = pagination.nextLinkPath || 'next_page_url'
    }
  }
  if (pagination.maxPages != null) base.max_pages = pagination.maxPages

  return base
}

function mapDataSource(raw: Record<string, unknown>): DataSourceDetail {
  const config = raw.api_config as Record<string, unknown> | undefined

  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    type: String(raw.type ?? ''),
    sourceKind: (raw.source_kind as DataSourceDetail['sourceKind']) ?? 'upload',
    materialization: (raw.materialization as Materialization) ?? 'snapshot',
    originalFilename: raw.original_filename ? String(raw.original_filename) : null,
    fileSizeBytes: raw.file_size_bytes != null ? Number(raw.file_size_bytes) : null,
    status: String(raw.status ?? ''),
    isPartial: raw.is_partial === true,
    partialReason: raw.partial_reason ? String(raw.partial_reason) : null,
    visibility: (raw.visibility as DataSourceDetail['visibility']) ?? 'private',
    categories: (raw.categories as string[]) ?? [],
    provenance: (raw.provenance as DataSourceDetail['provenance']) ?? null,
    provenanceOtherLabel: raw.provenance_other_label ? String(raw.provenance_other_label) : null,
    apiConfig: config ? {
      url: String(config.url ?? ''),
      method: (config.method as HttpMethod) ?? 'GET',
      authType: (config.auth_type as AuthType) ?? 'none',
      headers: (config.headers as Record<string, string>) ?? {},
      dataPath: config.data_path ? String(config.data_path) : null,
      pagination: mapPaginationFromApi(config.pagination as Record<string, unknown> | undefined),
    } : null,
    queryMapping: mapQueryMappingFromApi(raw.query_mapping as Record<string, unknown> | null | undefined),
    refreshFrequency: (raw.refresh_frequency as RefreshFrequency) ?? 'none',
    lastRefreshedAt: raw.last_refreshed_at ? String(raw.last_refreshed_at) : null,
    nextRefreshAt: raw.next_refresh_at ? String(raw.next_refresh_at) : null,
    isOwner: raw.is_owner !== false,
  }
}

export async function fetchDataSource(id: string): Promise<DataSourceDetail> {
  const { data } = await apiHttp.get(STATSIO_API.dataSources.one(id))
  return mapDataSource(data.data)
}

/** Crée une source API (snapshot ou live selon `payload.materialization`). */
export async function createApiDataSource(payload: Record<string, unknown>): Promise<DataSourceDetail> {
  const { data } = await apiHttp.post(STATSIO_API.apiSources.collection, payload)
  return mapDataSource(data.data)
}

export interface UpdateDataSourcePayload {
  name?: string
  visibility?: 'private' | 'public'
  categories?: string[]
  provenance_id?: number | null
  provenance_other_label?: string | null
  url?: string
  method?: HttpMethod
  auth_type?: AuthType
  headers?: Record<string, string>
  data_path?: string | null
  pagination?: Record<string, unknown>
  refresh_frequency?: RefreshFrequency
  /** Reconfiguration du mapping de filtres d'une source "live" (matérialization non modifiable après création). */
  query_mapping?: Record<string, unknown>
}

/** Relance immédiatement le fetch d'une source API, sans changer sa configuration. */
export async function refreshDataSource(id: string): Promise<DataSourceDetail> {
  const { data } = await apiHttp.post(STATSIO_API.dataSources.refresh(id))
  return mapDataSource(data.data)
}

/** PATCH via multipart quand `file` est fourni — Laravel lit `_method` pour router un POST vers `update()`. */
export async function updateDataSource(
  id: string,
  payload: UpdateDataSourcePayload,
  file?: File | null,
): Promise<DataSourceDetail> {
  if (file) {
    const form = new FormData()
    form.append('_method', 'PATCH')
    form.append('file', file)
    appendPayload(form, payload)

    const { data } = await apiHttp.post(STATSIO_API.dataSources.one(id), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return mapDataSource(data.data)
  }

  const { data } = await apiHttp.patch(STATSIO_API.dataSources.one(id), payload)
  return mapDataSource(data.data)
}

function appendPayload(form: FormData, payload: UpdateDataSourcePayload) {
  if (payload.name !== undefined) form.append('name', payload.name)
  if (payload.visibility !== undefined) form.append('visibility', payload.visibility)
  payload.categories?.forEach((c) => form.append('categories[]', c))
  if (payload.provenance_id != null) form.append('provenance_id', String(payload.provenance_id))
  if (payload.provenance_other_label) form.append('provenance_other_label', payload.provenance_other_label)
  if (payload.url !== undefined) form.append('url', payload.url)
  if (payload.method !== undefined) form.append('method', payload.method)
  if (payload.auth_type !== undefined) form.append('auth_type', payload.auth_type)
  if (payload.headers) {
    Object.entries(payload.headers).forEach(([k, v]) => form.append(`headers[${k}]`, v))
  }
  if (payload.refresh_frequency !== undefined) form.append('refresh_frequency', payload.refresh_frequency)
  if (payload.data_path) form.append('data_path', payload.data_path)
}
