import type { StudioDataSource, StudioDataSourceApi, StudioDataSourceFile, StudioDataSourceManual } from '@/types/studio-data-source'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asStringMatrix(rows: unknown): string[][] {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => {
    if (!Array.isArray(row)) return []
    return row.map((c) => String(c ?? ''))
  })
}

function asPreviewRecords(v: unknown): Record<string, string | number | boolean | null>[] {
  if (!Array.isArray(v)) return []
  return v.filter(isRecord) as Record<string, string | number | boolean | null>[]
}

/**
 * Tableau de sources tel que renvoyé par `GET .../sources` après déballage `{ success, data }`.
 * (`data` peut être directement le tableau, ou encore `{ data: [...] }` selon l’enveloppe.)
 */
export function normalizeSourcesListPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (isRecord(raw) && Array.isArray(raw.data)) return raw.data
  return []
}

/**
 * Objet source Statsio (`type` + `manualData` | `api` | `file`), aligné sur la réponse API.
 */
export function studioDataSourceFromApi(raw: unknown): StudioDataSource | null {
  if (!isRecord(raw)) return null
  const id = String(raw.id ?? '')
  if (!id) return null

  const type = String(raw.type ?? '').toLowerCase()
  const name = String(raw.name ?? 'Source')

  if (type === 'manual') {
    const md = raw.manualData
    let rows: string[][] = []
    if (isRecord(md) && Array.isArray(md.rows)) {
      rows = asStringMatrix(md.rows)
    }
    if (rows.length === 0) rows = [['A', 'B', 'C'], ['', '', '']]
    const src: StudioDataSourceManual = { id, kind: 'manual', name, rows }
    return src
  }

  if (type === 'api') {
    const api = isRecord(raw.api) ? raw.api : null
    if (!api) {
      const empty: StudioDataSourceApi = {
        id,
        kind: 'api',
        name,
        url: '',
        authHeaderName: 'Authorization',
        apiKeyPreview: '',
        previewRecords: [],
        hasStoredApiKey: false,
      }
      return empty
    }

    const url = String(api.url ?? '')
    const keyFromApi =
      api.apiKey !== undefined && api.apiKey !== null
        ? String(api.apiKey)
        : api.api_key !== undefined && api.api_key !== null
          ? String(api.api_key)
          : ''
    const hasFlag = typeof api.hasApiKey === 'boolean'
    const hasStoredApiKey = hasFlag ? Boolean(api.hasApiKey) : keyFromApi.length > 0

    const previewRecords = asPreviewRecords(api.previewRecords ?? api.records)

    const src: StudioDataSourceApi = {
      id,
      kind: 'api',
      name,
      url,
      authHeaderName: String(api.authHeaderName ?? 'Authorization'),
      apiKeyPreview: keyFromApi,
      previewRecords,
      hasStoredApiKey,
    }
    return src
  }

  if (type === 'file') {
    const file = isRecord(raw.file) ? raw.file : null
    const previewRows = file
      ? asStringMatrix(file.previewRows ?? file.rows)
      : asStringMatrix(raw.previewRows ?? raw.rows)
    const fmt =
      String(file?.format ?? raw.format ?? 'csv').toLowerCase() === 'xlsx' ? 'xlsx' : 'csv'
    const src: StudioDataSourceFile = {
      id,
      kind: 'file',
      name,
      fileName: String(file?.fileName ?? raw.fileName ?? name),
      format: fmt,
      previewRows: previewRows.length ? previewRows : [['', ''], ['', '']],
    }
    return src
  }

  return null
}

export function studioDataSourcesFromApiList(raw: unknown): StudioDataSource[] {
  return normalizeSourcesListPayload(raw)
    .map(studioDataSourceFromApi)
    .filter((s): s is StudioDataSource => s !== null)
}
