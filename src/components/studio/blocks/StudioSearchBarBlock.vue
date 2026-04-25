<template>
  <div class="studio-search-bar-block">
    <div class="search-input-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="payload.config.placeholder || 'Rechercher...'"
        class="search-input"
        @input="onSearchInput"
      />
      <div v-if="searching" class="search-spinner">
        <span class="spinner"></span>
      </div>
    </div>

    <div v-if="showResults && results.length > 0" class="search-results">
      <div
        v-for="(result, index) in results"
        :key="index"
        class="search-result-item"
        @click="onResultClick(result)"
      >
        <div v-if="displayColumnsComputed.length > 0">
          <div v-for="col in displayColumnsComputed" :key="col.key" class="result-column">
            <span v-if="col.showLabel" class="result-label">{{ col.label }}:</span>
            <span class="result-value">{{ col.value(result) }}</span>
          </div>
        </div>
        <div v-else class="result-column">
          <span class="result-value">{{ JSON.stringify(result) }}</span>
        </div>
      </div>
    </div>

    <div v-if="showResults && results.length === 0 && searchQuery" class="no-results">
      Aucun résultat trouvé
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, inject, computed, onMounted } from 'vue'
import type { StudioSearchBarConfig, StudioBlockAction } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import { findDataSource, sourceToTabular } from '@/types/studio-data-source'
import { studioDataSourcesKey, studioStatsDataWidgetKey } from '@/lib/studio-inject-keys'
import type { StatsDataAnyQueryRequest } from '@/types/statsdata-query'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'

const props = defineProps<{
  payload: { type: 'search_bar'; config: StudioSearchBarConfig }
  editable: boolean
  dataSources?: StudioDataSource[]
}>()

const emit = defineEmits<{
  'update:payload': [payload: { type: 'search_bar'; config: StudioSearchBarConfig }]
  action: [action: StudioBlockAction, context: Record<string, unknown>]
}>()

// Migration automatique de displayColumns vers displayFormulas
onMounted(() => {
  const config = props.payload.config
  if (!config.displayFormulas && config.displayColumns && config.displayColumns.length > 0) {
    const formulas = config.displayColumns.map(col => ({
      label: col,
      formula: col
    }))
    emit('update:payload', {
      type: 'search_bar',
      config: {
        ...config,
        displayFormulas: formulas
      }
    })
  }
})

const statsDataWidget = inject(studioStatsDataWidgetKey, null)
const injectedSources = inject(studioDataSourcesKey, ref<StudioDataSource[]>([]))

const availableSources = computed(() => {
  if (Array.isArray(props.dataSources) && props.dataSources.length > 0) {
    return props.dataSources
  }
  return injectedSources.value
})

const searchQuery = ref('')
const results = ref<Record<string, unknown>[]>([])
const searching = ref(false)
const showResults = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const displayColumnsComputed = computed(() => {
  const formulas = props.payload.config.displayFormulas || []

  // Si des formules sont définies, on les utilise
  if (formulas.length > 0) {
    return formulas.map(formula => ({
      key: `${formula.label}-${formula.formula}`,
      label: formula.label,
      showLabel: !!String(formula.label ?? '').trim() && String(formula.label ?? '').trim() !== 'Nouveau champ',
      value: (result: Record<string, unknown>) => evaluateFormula(formula.formula, result)
    }))
  }

  // Fallback sur displayColumns (deprecated) si défini
  const columns = props.payload.config.displayColumns || []
  if (columns.length > 0) {
    return columns.map(col => ({
      key: col,
      label: col,
      showLabel: true,
      value: (result: Record<string, unknown>) => String(result[col] || '')
    }))
  }

  // Si rien n'est défini, afficher toutes les colonnes disponibles
  return []
})

const asQueryRows = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null && !Array.isArray(row))
  }
  if (typeof value === 'object' && value !== null && 'rows' in value) {
    const rows = (value as { rows?: unknown }).rows
    if (Array.isArray(rows)) {
      return rows.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null && !Array.isArray(row))
    }
  }
  return []
}

const asSearchFieldRef = (column: string, sourceId: string): string => {
  const raw = String(column ?? '').trim()
  if (!raw) return ''
  if (raw.includes('.')) return raw
  const sameSource = findDataSource(availableSources.value, sourceId)
  return sameSource ? `s.${raw}` : raw
}

const extractFormulaFields = (formula: string): string[] => {
  const matches = String(formula ?? '').match(/[A-Za-z_][A-Za-z0-9_.]*/g) ?? []
  const reserved = new Set(['concat', 'upper', 'lower', 'upperFirst', 'upperLast', 'first', 'last'])
  const out: string[] = []
  for (const match of matches) {
    if (reserved.has(match)) continue
    out.push(match)
  }
  return [...new Set(out)]
}

const buildSelectEntries = (sourceId: string) => {
  const fields = new Set<string>(props.payload.config.searchColumns)
  for (const formula of props.payload.config.displayFormulas ?? []) {
    for (const field of extractFormulaFields(formula.formula)) {
      fields.add(field)
    }
  }

  return [...fields]
    .map((col) => {
      const from = asSearchFieldRef(col, sourceId)
      if (!from) return null
      return {
        kind: 'from' as const,
        from,
        label: col,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
}

const buildRemoteSearchQuery = (sourceId: string, queryText: string): StatsDataAnyQueryRequest | null => {
  const configured = props.payload.config.query as StatsDataAnyQueryRequest | undefined

  if (configured) {
    const extraFields = buildSelectEntries(sourceId)
    if ((configured as any)?.specVersion === 2) {
      const existingSelect = Array.isArray((configured as any).select) ? (configured as any).select : []
      const existingLabels = new Set(existingSelect.map((entry: any) => String(entry?.label ?? '').trim()).filter(Boolean))
      const mergedSelect = [
        ...existingSelect,
        ...extraFields.filter((entry) => !existingLabels.has(entry.label)),
      ]
      return {
        ...(configured as any),
        select: mergedSelect,
        search: { q: queryText },
        limit: 10,
        offset: 0,
      } as StatsDataAnyQueryRequest
    }

    return {
      ...(configured as any),
      search: { q: queryText },
      limit: 10,
      offset: 0,
    } as StatsDataAnyQueryRequest
  }

  const select = buildSelectEntries(sourceId)

  if (select.length === 0) return null

  const query: StatsDataQueryRequestV2 = {
    specVersion: 2,
    sources: [{ sourceId, alias: 's' }],
    select,
    search: { q: queryText },
    limit: 10,
    offset: 0,
  }

  return query
}

const evaluateFormula = (formula: string, result: Record<string, unknown>): string => {
  try {
    const entries = Object.entries(result).sort((a, b) => b[0].length - a[0].length)
    if (formula.includes('+')) {
      let evaluated = formula
      for (const [key, value] of entries) {
        const regex = new RegExp(`\\b${key}\\b`, 'g')
        evaluated = evaluated.replace(regex, `"${String(value ?? '')}"`)
      }
      const parts = evaluated
        .split('+')
        .map(p => p.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
      return parts.join('')
    }

    let interpolated = formula
    for (const [key, value] of entries) {
      const regex = new RegExp(`\\b${key}\\b`, 'g')
      interpolated = interpolated.replace(regex, String(value ?? ''))
    }
    return interpolated.trim()
  } catch (e) {
    return formula
  }
}

const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (!searchQuery.value.trim()) {
    results.value = []
    showResults.value = false
    return
  }

  searchTimeout = setTimeout(async () => {
    await performSearch()
  }, 300)
}

const performSearch = async () => {
  if (!props.payload.config.sourceId || props.payload.config.searchColumns.length === 0) {
    results.value = []
    showResults.value = false
    return
  }

  searching.value = true
  showResults.value = true

  try {
    const source = findDataSource(availableSources.value, props.payload.config.sourceId)

    if (!source) {
      results.value = []
      return
    }

    const query = searchQuery.value.toLowerCase().trim()

    // Mode StatsData remote : utiliser l'API de requêtes quel que soit le type de source
    if (statsDataWidget?.value?.enabled) {
      const remoteQuery = buildRemoteSearchQuery(source.id, query)
      if (!remoteQuery) {
        results.value = []
        return
      }

      const response = await statsDataWidget.value.executeQuery(remoteQuery)
      results.value = asQueryRows(response)
    }
    // Mode local (manual, file, api preview hors StatsData remote)
    else {
      const tabular = sourceToTabular(source) ?? { headers: [], rows: [] }
      const headers = Array.isArray(tabular.headers) ? tabular.headers : []
      const rows = Array.isArray(tabular.rows) ? tabular.rows : []

      // Recherche dans les colonnes spécifiées
      const searchColumnIndices = props.payload.config.searchColumns
        .map((col) => headers.indexOf(col))
        .filter((idx) => idx >= 0)

      if (searchColumnIndices.length === 0) {
        results.value = []
        return
      }

      // Filtrer les lignes qui correspondent à la recherche
      const matchingRows = rows.filter((row) => {
        return searchColumnIndices.some((idx) => {
          const value = row[idx]?.toLowerCase() || ''
          return value.includes(query)
        })
      })

      // Convertir en objets avec les colonnes à afficher
      results.value = matchingRows.slice(0, 10).map((row) => {
        const obj: Record<string, unknown> = {}
        headers.forEach((header, idx) => {
          obj[header] = row[idx] || ''
        })
        return obj
      })
    }
  } catch (error) {
    console.error('Search error:', error)
    results.value = []
  } finally {
    searching.value = false
  }
}

const onResultClick = (result: Record<string, unknown>) => {
  console.log('onResultClick called', { config: props.payload.config.onResultClick, result })
  if (props.payload.config.onResultClick) {
    console.log('Emitting action event', props.payload.config.onResultClick, result)
    emit('action', props.payload.config.onResultClick, result)
  }
  searchQuery.value = ''
  results.value = []
  showResults.value = false
}

watch(() => props.payload.config.sourceId, () => {
  searchQuery.value = ''
  results.value = []
  showResults.value = false
})
</script>

<style scoped>
.studio-search-bar-block {
  position: relative;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
}

.search-spinner {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.search-results {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 20rem;
  overflow-y: auto;
  z-index: 10;
}

.search-result-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background-color: #f9fafb;
}

.result-column {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.result-column:last-child {
  margin-bottom: 0;
}

.result-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
}

.result-value {
  color: #111827;
  font-size: 0.875rem;
}

.no-results {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  z-index: 10;
}
</style>
