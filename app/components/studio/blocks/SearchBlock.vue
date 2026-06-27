<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchSearchRows, fetchPublicSearchRows } from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import type { StudioBlock, StudioDocumentPage, SearchSource, SearchJoin } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const studio = useStudioStore()
const route  = useRoute()
const router = useRouter()

// ─── Config ───────────────────────────────────────────────────────────────────

// Support both new multi-source and legacy single-column config
const searchSources = computed(() => {
  const sources = props.block.fieldMapping.searchSources ?? []
  if (sources.length > 0) return sources
  // Legacy fallback
  if (props.block.datasetId && props.block.fieldMapping.searchColumn) {
    return [{ datasetId: props.block.datasetId, columns: [props.block.fieldMapping.searchColumn] }]
  }
  return []
})

const targetPageId  = computed(() => props.block.fieldMapping.targetPageId)
const placeholder   = computed(() => props.block.config.searchPlaceholder || 'Rechercher…')
const isConfigured  = computed(() => searchSources.value.some((s: SearchSource) => s.datasetId && s.columns.length > 0))
const urlParamCols  = computed(() => props.block.fieldMapping.urlParams ?? [])

// For URL navigation: doc slug from route, target page slug from store
const docSlug = computed(() => String(route.params.slug ?? ''))
const targetPageSlug = computed(() => {
  const page = studio.pages.find((p: StudioDocumentPage) => p.id === targetPageId.value)
  return page?.slug ?? page?.id ?? ''
})

// ─── State ────────────────────────────────────────────────────────────────────

interface SearchResult {
  key: string
  displayValue: string
  subValues: { label: string; value: string }[]
  row: Record<string, unknown>
}

const query       = ref('')
const results     = ref<SearchResult[]>([])
const isLoading   = ref(false)
const isOpen      = ref(false)
const inputRef    = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// ─── Dropdown positioning ─────────────────────────────────────────────────────

const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })

function updateDropdownPosition() {
  const el = inputRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  dropdownStyle.value = {
    top:   `${rect.bottom + 4}px`,
    left:  `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

// ─── Search logic ─────────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSearch(q: string) {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (q.length < 2) {
    results.value = []
    isOpen.value = false
    isLoading.value = false
    return
  }
  isLoading.value = true
  isOpen.value = true
  debounceTimer = setTimeout(() => doSearch(q), 250)
}

async function doSearch(q: string) {
  try {
    const allRows: SearchResult[] = []
    const seen = new Set<string>()

    await Promise.all(
      searchSources.value
        .filter((s: SearchSource) => s.datasetId && s.columns.length > 0)
        .map(async (source: SearchSource) => {
          const sourceJoins = (props.block.fieldMapping.searchJoins ?? [])
            .filter((j: SearchJoin) => j.sourceDatasetId === source.datasetId)
            .map((j: SearchJoin) => ({ datasetId: j.datasetId, leftColumn: j.leftColumn, rightColumn: j.rightColumn, columns: j.columns, type: j.type }))
          const docSlug = studio.content?.slug
          const rows = (props.readonly && docSlug)
            ? await fetchPublicSearchRows(docSlug, source.datasetId, source.columns, q, 30, sourceJoins)
            : await fetchSearchRows(source.datasetId, source.columns, q, 30, sourceJoins)
          for (const row of rows) {
            // Use first matching column value as display value
            const primaryCol = source.columns.find(
              (c: string) => String(row[c] ?? '').toLowerCase().includes(q.toLowerCase()),
            ) ?? source.columns[0]!
            const displayValue = String(row[primaryCol] ?? '')
            if (!displayValue || seen.has(displayValue)) continue
            seen.add(displayValue)

            // Other column values shown as sub-info
            const subValues = source.columns
              .filter((c: string) => c !== primaryCol && row[c] != null && row[c] !== '')
              .map((c: string) => ({ label: c, value: String(row[c]) }))

            allRows.push({
              key: `${source.datasetId}:${displayValue}`,
              displayValue,
              subValues,
              row,
            })
          }
        }),
    )

    results.value = allRows
  } catch {
    results.value = []
  } finally {
    isLoading.value = false
  }
}

watch(query, (q: string) => {
  if (!isConfigured.value) return
  updateDropdownPosition()
  scheduleSearch(q)
})

watch(searchSources, () => {
  query.value = ''
  results.value = []
  isOpen.value = false
})

// ─── Select a result — set ALL row columns as page params ─────────────────────

function onSelect(result: SearchResult) {
  query.value = result.displayValue
  isOpen.value = false

  // Public view + urlParams configured → URL navigation for deep-linking
  if (props.readonly && urlParamCols.value.length > 0 && targetPageId.value && docSlug.value && targetPageSlug.value) {
    // Build allParams from ALL result row columns (used for in-memory variable substitution)
    const allParams: Record<string, string> = {}
    for (const [col, val] of Object.entries(result.row)) {
      if (val !== null && val !== undefined && val !== '') {
        allParams[col] = String(val)
      }
    }

    // Apply column aliasing: urlKey may be fed by a different source column
    // e.g. urlParams = ["CODGEO_2025"], urlParamMapping = { "CODGEO_2025": "com" }
    // → reads result.row["com"] and writes it as CODGEO_2025 in both URL and allParams
    const mapping = props.block.fieldMapping.urlParamMapping ?? {}
    const queryParams: Record<string, string> = {}
    for (const urlKey of urlParamCols.value) {
      const sourceCol = mapping[urlKey] ?? urlKey
      // Fall back to urlKey itself if mapped column doesn't exist in this result row
      const val = allParams[sourceCol] ?? allParams[urlKey]
      if (val) {
        queryParams[urlKey] = val
        allParams[urlKey] = val  // ensure canonical key is always in allParams
      }
    }

    studio.setPageParams(allParams)
    router.push({ path: `/statsdata/${docSlug.value}/${targetPageSlug.value}`, query: queryParams })
    return
  }

  // Studio or no urlParams → in-memory navigation (switch FIRST then set params)
  if (targetPageId.value) studio.switchPage(targetPageId.value)
  for (const [col, val] of Object.entries(result.row)) {
    if (val !== null && val !== undefined && val !== '') {
      studio.setPageParam(col, String(val))
    }
  }
}

function onFocus() {
  if (!isConfigured.value) return
  updateDropdownPosition()
  if (query.value.length >= 2) isOpen.value = true
}

function handleOutsideClick(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
  window.addEventListener('scroll', updateDropdownPosition, true)
  window.addEventListener('resize', updateDropdownPosition)
})
onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  document.removeEventListener('mousedown', handleOutsideClick)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})
</script>

<template>
  <div class="h-full flex flex-col justify-center p-4">
    <!-- Not configured -->
    <div v-if="!isConfigured" class="flex flex-col items-center justify-center gap-2 text-slate-400 h-full">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <span class="text-xs">Configurer les sources de recherche →</span>
    </div>

    <!-- Search UI -->
    <div v-else ref="containerRef" class="relative w-full">
      <div class="relative">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          :placeholder="placeholder"
          class="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
          @focus="onFocus"
        />
        <svg
          v-if="isLoading"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin"
          fill="none" viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <p v-if="query.length > 0 && query.length < 2" class="mt-1 text-[11px] text-slate-400 pl-1">
        Tapez au moins 2 caractères…
      </p>

      <!-- Dropdown via Teleport -->
      <Teleport to="body">
        <div
          v-if="isOpen && results.length > 0"
          class="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto"
          :style="dropdownStyle"
        >
          <button
            v-for="result in results"
            :key="result.key"
            type="button"
            class="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-slate-50 last:border-0"
            @mousedown.prevent="onSelect(result)"
          >
            <p class="text-sm font-medium text-slate-800">{{ result.displayValue }}</p>
            <div v-if="result.subValues.length > 0" class="flex flex-wrap gap-2 mt-0.5">
              <span
                v-for="sub in result.subValues"
                :key="sub.label"
                class="text-[11px] text-slate-400"
              >
                <span class="font-medium text-slate-500">{{ sub.label }}</span> {{ sub.value }}
              </span>
            </div>
          </button>
        </div>

        <div
          v-else-if="isOpen && !isLoading && query.length >= 2"
          class="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-sm px-4 py-3 text-sm text-slate-400"
          :style="dropdownStyle"
        >
          Aucun résultat pour « {{ query }} »
        </div>
      </Teleport>
    </div>
  </div>
</template>
