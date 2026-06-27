import { apiHttp } from '@/lib/http'
import { STATSIO_API } from './statsio-endpoints'
import type { DatasetColumn, DatasetMeta, DatasetWithSchema, BlockQueryResult, StudioBlock } from '@/types/studio'

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

export async function fetchBlockData(
  datasetId: string,
  params: {
    columns?: string[]
    limit?: number
    distinctColumn?: string | null
    sortColumn?: string | null
    sortDirection?: 'asc' | 'desc' | null
    filters?: import('@/types/studio').BlockFilter[]
    joins?: import('@/types/studio').BlockJoin[]
  } = {},
): Promise<BlockQueryResult> {
  const { data } = await apiHttp.get(STATSIO_API.datasets.query(datasetId), {
    params,
    paramsSerializer: (p: typeof params) => {
      const parts: string[] = []
      if (p.columns?.length) {
        p.columns.forEach((c: string) => parts.push(`columns[]=${encodeURIComponent(c)}`))
      }
      if (p.limit !== undefined) parts.push(`limit=${p.limit}`)
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
      return parts.join('&')
    },
  })
  return {
    columns: data.data?.columns ?? [],
    rows: data.data?.rows ?? [],
    totalRows: data.data?.total_rows ?? 0,
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
    paramsSerializer: () => {
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
    },
  })
  return data.data?.rows ?? []
}

export async function fetchDistinctValues(datasetId: string, column: string, search: string): Promise<string[]> {
  const { data } = await apiHttp.get(STATSIO_API.datasets.query(datasetId), {
    params: {},
    paramsSerializer: () => {
      let qs = `columns[]=${encodeURIComponent(column)}&distinct=true&limit=100`
      if (search) qs += `&search=${encodeURIComponent(search)}`
      return qs
    },
  })
  const rows: Record<string, unknown>[] = data.data?.rows ?? []
  const seen = new Set<string>()
  for (const row of rows) {
    const val = row[column]
    if (val !== null && val !== undefined && val !== '') seen.add(String(val))
  }
  return Array.from(seen)
}

// ─── StatsData document (page) ───────────────────────────────────────────────

export interface StatsDataDocument {
  id: string
  title: string
  description?: string | null
  slug?: string
  status?: string
  author?: { name: string }
  datasets?: { id: string; name: string; row_count?: number }[]
  created_at?: string
  updated_at?: string
  pages?: import('@/types/studio').StudioDocumentPage[]
  sections?: import('@/types/studio').Section[]
  blocks?: StudioBlock[]
}

export async function fetchUserStatsDataDocuments(): Promise<StatsDataDocument[]> {
  const { data } = await apiHttp.get(STATSIO_API.studioContent.collection)
  return data.data ?? []
}

export async function createStatsDataDocument(title: string): Promise<StatsDataDocument> {
  const { data } = await apiHttp.post(STATSIO_API.studioContent.collection, { title })
  return data.data
}

export async function fetchPublicStatsDataCatalog(): Promise<StatsDataDocument[]> {
  const { data } = await apiHttp.get(STATSIO_API.studioContent.publicCollection)
  return data.data ?? []
}

export async function fetchStatsDataDocument(documentId: string): Promise<StatsDataDocument> {
  const { data } = await apiHttp.get(STATSIO_API.studioContent.one(documentId))
  return data.data
}

export async function fetchPublicStatsDataDocument(slug: string): Promise<StatsDataDocument> {
  const { data } = await apiHttp.get(STATSIO_API.studioContent.publicBySlug(slug))
  return data.data
}

export async function saveStatsDataDocument(
  documentId: string,
  payload: {
    title?: string
    description?: string | null
    status?: string
    pages?: import('@/types/studio').StudioDocumentPage[]
    sections?: import('@/types/studio').Section[]
    blocks?: StudioBlock[]
  },
): Promise<void> {
  await apiHttp.patch(STATSIO_API.studioContent.one(documentId), payload)
}

export async function deleteStatsDataDocument(documentId: string): Promise<void> {
  await apiHttp.delete(STATSIO_API.studioContent.one(documentId))
}

export async function publishStatsDataDocument(documentId: string): Promise<void> {
  await apiHttp.patch(STATSIO_API.studioContent.one(documentId), { status: 'published' })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapDatasetMeta(raw: Record<string, unknown>): DatasetMeta {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    description: raw.description ? String(raw.description) : null,
    rowCount: Number(raw.row_count ?? 0),
    status: (raw.status as DatasetMeta['status']) ?? 'pending',
    createdAt: raw.created_at ? String(raw.created_at) : undefined,
  }
}
