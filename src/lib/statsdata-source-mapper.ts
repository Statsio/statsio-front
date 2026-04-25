import type {
  StatsDataFieldMapping,
  StatsDataNormalizationMapping,
  StatsDataSourceLastSnapshot,
} from '@/types/statsdata-query'
import type {
  StudioDataSource,
  StudioDataSourceApi,
  StudioDataSourceFile,
  StudioDataSourceManual,
  StudioDataSourceRemoteFields,
} from '@/types/studio-data-source'

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
 * Entrées acceptées par élément : objet `{ name, from? }` (ou alias `path`),
 * ou **raccourci** chaîne / nombre → `{ name: String(item) }` (même nom source et cible).
 */
function asFieldMappingArray(v: unknown): StatsDataFieldMapping[] {
  if (!Array.isArray(v)) return []
  const out: StatsDataFieldMapping[] = []
  for (const item of v) {
    if (typeof item === 'string' || typeof item === 'number') {
      const name = String(item ?? '').trim()
      if (name) out.push({ name })
      continue
    }
    if (!isRecord(item)) continue
    const name = String(item.name ?? '').trim()
    if (!name) continue
    const fromRaw = item.from ?? item.path
    const from = fromRaw !== undefined && fromRaw !== null ? String(fromRaw).trim() : ''
    if (from) out.push({ name, from })
    else out.push({ name })
  }
  return out
}

/** Parse `normalizationMapping` tel que renvoyé par l’API StatsData. */
export function parseStatsDataNormalizationMapping(v: unknown): StatsDataNormalizationMapping | null {
  if (v === null || v === undefined) return null
  if (!isRecord(v)) return null
  const keyFields = asFieldMappingArray(v.keyFields ?? v.key_fields)
  const valueFields = asFieldMappingArray(v.valueFields ?? v.value_fields)
  if (keyFields.length === 0 && valueFields.length === 0) return null
  const rowPathRaw = v.rowPath ?? v.row_path
  const rowPath =
    rowPathRaw !== undefined && rowPathRaw !== null ? String(rowPathRaw).trim() : undefined
  const skRaw = v.staticKeys ?? v.static_keys
  const staticKeys = isRecord(skRaw)
    ? (skRaw as Record<string, string | number | boolean | null>)
    : undefined
  return {
    ...(rowPath ? { rowPath } : {}),
    keyFields,
    valueFields,
    ...(staticKeys && Object.keys(staticKeys).length ? { staticKeys } : {}),
  }
}

/** True si le JSON utilisateur déclare des entrées mais rien n’a été parsé (évite un PATCH `null` silencieux). */
export function normalizationMappingJsonLooksPopulatedButUnparsed(raw: unknown): boolean {
  if (!isRecord(raw)) return false
  const k = raw.keyFields ?? raw.key_fields
  const vf = raw.valueFields ?? raw.value_fields
  const kLen = Array.isArray(k) ? k.length : 0
  const vfLen = Array.isArray(vf) ? vf.length : 0
  return kLen > 0 || vfLen > 0
}

/** Parse `lastSnapshot` (liste / détail source). */
export function parseStatsDataLastSnapshot(v: unknown): StatsDataSourceLastSnapshot | null {
  if (v === null || v === undefined) return null
  if (!isRecord(v)) return null
  const status = v.status === 'failed' ? 'failed' : 'ok'
  return {
    status,
    rowCount: typeof v.rowCount === 'number' ? v.rowCount : undefined,
    schemaVersion: typeof v.schemaVersion === 'number' ? v.schemaVersion : undefined,
    refreshedAt: typeof v.refreshedAt === 'string' ? v.refreshedAt : undefined,
    id: typeof v.id === 'string' ? v.id : undefined,
    errorMessage: v.errorMessage == null ? null : String(v.errorMessage),
  }
}

/**
 * N’ajoute `normalizationMapping` / `lastSnapshot` que si la clé est présente dans le JSON API.
 * Sinon le spread n’écrase pas une valeur déjà en mémoire après un PATCH partiel.
 */
function readRemoteFields(raw: Record<string, unknown>): Partial<StudioDataSourceRemoteFields> {
  const out: Partial<StudioDataSourceRemoteFields> = {}
  if ('normalizationMapping' in raw || 'normalization_mapping' in raw) {
    const nmRaw = raw.normalizationMapping ?? raw.normalization_mapping
    out.normalizationMapping = parseStatsDataNormalizationMapping(nmRaw)
  }
  if ('lastSnapshot' in raw || 'last_snapshot' in raw) {
    const lsRaw = raw.lastSnapshot ?? raw.last_snapshot
    out.lastSnapshot = parseStatsDataLastSnapshot(lsRaw)
  }
  return out
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
  const remote = readRemoteFields(raw)

  if (type === 'manual') {
    const md = raw.manualData
    let rows: string[][] = []
    if (isRecord(md) && Array.isArray(md.rows)) {
      rows = asStringMatrix(md.rows)
    }
    if (rows.length === 0) rows = [['A', 'B', 'C'], ['', '', '']]
    const src: StudioDataSourceManual = { id, kind: 'manual', name, rows, ...remote }
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
        ...remote,
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

    const apiLimitRaw = api.limit ?? api.apiLimit ?? api.api_limit
    const apiLimit = typeof apiLimitRaw === 'number' ? apiLimitRaw : undefined
    const apiSearchTemplateRaw = api.searchTemplate ?? api.search_template
    const apiSearchTemplate = typeof apiSearchTemplateRaw === 'string' ? apiSearchTemplateRaw : undefined
    const src: StudioDataSourceApi = {
      id,
      kind: 'api',
      name,
      url,
      authHeaderName: String(api.authHeaderName ?? 'Authorization'),
      apiKeyPreview: keyFromApi,
      ...(apiLimit !== undefined ? { apiLimit } : {}),
      ...(apiSearchTemplate !== undefined ? { apiSearchTemplate } : {}),
      previewRecords,
      hasStoredApiKey,
      ...remote,
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
      ...remote,
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
