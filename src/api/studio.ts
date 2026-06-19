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
    filters?: import('@/types/studio').BlockFilter[]
  } = {},
): Promise<BlockQueryResult> {
  const { data } = await apiHttp.get(STATSIO_API.datasets.query(datasetId), {
    params,
    paramsSerializer: (p) => {
      const parts: string[] = []
      if (p.columns?.length) {
        p.columns.forEach((c: string) => parts.push(`columns[]=${encodeURIComponent(c)}`))
      }
      if (p.limit !== undefined) parts.push(`limit=${p.limit}`)
      if (p.filters?.length) {
        p.filters.forEach((f: import('@/types/studio').BlockFilter, i: number) => {
          parts.push(`filters[${i}][column]=${encodeURIComponent(f.column)}`)
          parts.push(`filters[${i}][operator]=${encodeURIComponent(f.operator)}`)
          parts.push(`filters[${i}][value]=${encodeURIComponent(f.value)}`)
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

// ─── StatsData document (page) ───────────────────────────────────────────────

export interface StatsDataDocument {
  id: string
  title: string
  slug?: string
  status?: string
  sections?: import('@/types/studio').Section[]
  blocks?: StudioBlock[]
}

export async function fetchStatsDataDocument(documentId: string): Promise<StatsDataDocument> {
  const { data } = await apiHttp.get(STATSIO_API.studioContent.one(documentId))
  return data.data
}

export async function saveStatsDataDocument(
  documentId: string,
  payload: { title?: string; sections?: import('@/types/studio').Section[]; blocks?: StudioBlock[] },
): Promise<void> {
  await apiHttp.patch(STATSIO_API.studioContent.one(documentId), payload)
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
