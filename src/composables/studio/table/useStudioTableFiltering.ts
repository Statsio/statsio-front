import { computed, type ComputedRef, type Ref } from 'vue'
import type { StudioTableFilterConfig, StudioTableSearchConfig } from '@/types/studio-document'

export type StudioTabularData = { headers: string[]; rows: string[][] }

/** Indices de colonnes interrogées par la recherche (libellés = en-têtes affichés). */
function searchableColumnIndices(headers: string[], cfg: StudioTableSearchConfig | undefined): number[] | null {
  if (!cfg?.enabled) return null
  if (!cfg.columnLabels.length) return headers.map((_, i) => i)
  const wanted = new Set(cfg.columnLabels)
  const idxs = headers.map((h, i) => (wanted.has(h) ? i : -1)).filter((i) => i >= 0)
  if (cfg.columnLabels.length > 0 && idxs.length === 0) return []
  return idxs
}

export function useStudioTableFiltering(opts: {
  table: ComputedRef<StudioTabularData>
  widgetEnabled: ComputedRef<boolean>
  searchMode: Ref<'page' | 'api'>
  searchDraft: Ref<string>
  filterDrafts: Ref<Record<string, string>>
  searchCfg: ComputedRef<StudioTableSearchConfig | undefined>
  filterCfg: ComputedRef<StudioTableFilterConfig | undefined>
  visibleColumnKeys: ComputedRef<string[]>
}) {
  const filteredTable = computed<StudioTabularData>(() => {
    const { headers, rows } = opts.table.value
    const searched = (() => {
      if (opts.widgetEnabled.value && opts.searchMode.value === 'api') return { headers, rows }
      const cfg = opts.searchCfg.value
      const idxs = searchableColumnIndices(headers, cfg)
      if (idxs === null) return { headers, rows }
      const q = opts.searchDraft.value.trim().toLowerCase()
      if (!q) return { headers, rows }
      if (idxs.length === 0) return { headers, rows: [] as string[][] }
      return {
        headers,
        rows: rows.filter((row) => idxs.some((i) => String(row[i] ?? '').toLowerCase().includes(q))),
      }
    })()

    const fcfg = opts.filterCfg.value
    if (!fcfg?.enabled) return searched
    const selected = fcfg.columnLabels?.length ? new Set(fcfg.columnLabels) : null
    const active = Object.entries(opts.filterDrafts.value)
      .map(([k, v]) => [k, v.trim().toLowerCase()] as const)
      .filter(([, v]) => v.length > 0)
    if (active.length === 0) return searched

    const headerToIndex = new Map(searched.headers.map((h, i) => [h, i] as const))
    return {
      headers: searched.headers,
      rows: searched.rows.filter((row) => {
        for (const [label, needle] of active) {
          if (selected && !selected.has(label)) continue
          const idx =
            headerToIndex.get(label) ??
            (label.includes('.') ? headerToIndex.get(label.split('.').slice(1).join('.')) : undefined)
          if (idx == null) continue
          const cell = String(row[idx] ?? '').toLowerCase()
          if (!cell.includes(needle)) return false
        }
        return true
      }),
    }
  })

  const displayedTable = computed<StudioTabularData>(() => {
    const { headers, rows } = filteredTable.value
    const keys = opts.visibleColumnKeys.value ?? []
    if (!keys.length) return { headers, rows }
    const wanted = new Set(keys)
    const idxs = headers
      .map((h, i) => (wanted.has(h) ? i : -1))
      .filter((i) => i >= 0)
    if (!idxs.length) return { headers: [] as string[], rows: [] as string[][] }
    return {
      headers: idxs.map((i) => headers[i]!),
      rows: rows.map((r) => idxs.map((i) => String(r[i] ?? ''))),
    }
  })

  const showSearchBar = computed(() => opts.searchCfg.value?.enabled === true && opts.table.value.headers.length > 0)
  const showFiltersRow = computed(() => opts.filterCfg.value?.enabled === true && opts.table.value.headers.length > 0)

  const isFilterColumnEnabled = (label: string) => {
    const cfg = opts.filterCfg.value
    if (!cfg?.enabled) return false
    if (!cfg.columnLabels?.length) return true
    return cfg.columnLabels.includes(label)
  }

  const enabledFilterLabels = computed(() => {
    const cfg = opts.filterCfg.value
    if (!cfg?.enabled) return [] as string[]
    if (cfg.columnLabels?.length) return [...cfg.columnLabels]
    return [...opts.table.value.headers]
  })

  const filterBadgeValuesByLabel = computed(() => {
    const { headers, rows } = opts.table.value
    const headerToIndex = new Map(headers.map((h, i) => [h, i] as const))
    const out: Record<string, string[]> = {}
    for (const label of enabledFilterLabels.value) {
      const idx =
        headerToIndex.get(label) ?? (label.includes('.') ? headerToIndex.get(label.split('.').slice(1).join('.')) : undefined)
      if (idx == null) continue
      const set = new Set<string>()
      for (const row of rows) {
        const v = String(row[idx] ?? '').trim()
        if (!v) continue
        set.add(v)
        if (set.size >= 24) break
      }
      out[label] = [...set].sort((a, b) => a.localeCompare(b)).slice(0, 12)
    }
    return out
  })

  return {
    filteredTable,
    displayedTable,
    showSearchBar,
    showFiltersRow,
    isFilterColumnEnabled,
    enabledFilterLabels,
    filterBadgeValuesByLabel,
  }
}

