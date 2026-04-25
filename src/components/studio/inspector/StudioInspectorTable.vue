<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload, StudioTableFilterConfig, StudioTableSearchConfig } from '@/types/studio-document'
import type { StudioBlockDataBinding, StudioDataSource } from '@/types/studio-data-source'
import { sourceToTabular } from '@/types/studio-data-source'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'
import { normalizedFieldOptionsForSource } from '@/components/studio/inspector/statsdata-query-editor'
import StudioInspectorStatsDataQuery from '@/components/studio/inspector/StudioInspectorStatsDataQuery.vue'

const props = defineProps<{
  block: Extract<StudioBlock, { type: 'table' }>
  idPrefix: string
  dataSources: StudioDataSource[]
  statsDataQueryMode: boolean
}>()

const emit = defineEmits<{
  'push-payload': [StudioBlockPayload]
}>()

const caption = computed({
  get: () => props.block.caption,
  set: (v) => {
    const b = props.block
    emit('push-payload', {
      type: 'table',
      caption: v,
      dataBinding: { ...b.dataBinding },
      ...(b.query ? { query: b.query } : {}),
      ...(b.search ? { search: b.search } : {}),
      ...(b.filters ? { filters: b.filters } : {}),
    })
  },
})

const bindingSourceHeaders = computed(() => {
  const src = props.dataSources.find((s) => s.id === props.block.dataBinding.sourceId)
  if (!src) return []
  return sourceToTabular(src).headers
})

const isTableColumnVisible = (header: string) => {
  const keys = props.block.dataBinding.visibleColumnKeys
  if (keys.length === 0) return true
  return keys.includes(header)
}

const patchDataBinding = (partial: Partial<StudioBlockDataBinding>) => {
  const b = props.block
  const nextBinding: StudioBlockDataBinding = { ...b.dataBinding, ...partial }
  emit('push-payload', {
    type: 'table',
    caption: b.caption,
    dataBinding: nextBinding,
    ...(b.query ? { query: b.query } : {}),
    ...(b.search ? { search: b.search } : {}),
    ...(b.filters ? { filters: b.filters } : {}),
  })
}

const toggleTableColumn = (header: string, checked: boolean) => {
  const b = props.block
  const headers = bindingSourceHeaders.value
  let keys = [...b.dataBinding.visibleColumnKeys]
  if (keys.length === 0) keys = [...headers]
  if (checked) {
    if (!keys.includes(header)) keys.push(header)
  } else {
    keys = keys.filter((k) => k !== header)
  }
  const allIncluded = headers.length > 0 && headers.every((h: string) => keys.includes(h))
  if (allIncluded || keys.length === 0) keys = []
  patchDataBinding({ visibleColumnKeys: keys })
}

const tableSearchSelectableLabels = computed(() => {
  if (props.statsDataQueryMode) {
    const q = props.block.query as any
    const selectLabels = (() => {
      if (q?.specVersion === 2) {
        const sel = Array.isArray(q.select) ? q.select : []
        return sel.map((c: any) => String(c?.label ?? '').trim()).filter(Boolean)
      }
      const cols = q?.columns?.length ? q.columns : []
      return cols.map((c: any) => String(c?.label ?? '').trim()).filter(Boolean)
    })()

    // Also allow selecting any field from the selected sources (alias.field),
    // so filters can be applied on non-visible columns.
    const sourceFieldRefs = (() => {
      if (q?.specVersion !== 2) return [] as string[]
      const v2 = q as StatsDataQueryRequestV2
      const out: string[] = []
      for (const srcEntry of v2.sources ?? []) {
        const alias = String(srcEntry?.alias ?? '').trim()
        const sourceId = String(srcEntry?.sourceId ?? '').trim()
        if (!alias || !sourceId) continue
        const src = props.dataSources.find((s) => s.id === sourceId)
        if (!src) continue
        const fields = normalizedFieldOptionsForSource(src)
        for (const f of fields) out.push(`${alias}.${f}`)
      }
      return out
    })()

    return [...new Set([...selectLabels, ...sourceFieldRefs])].sort((a: string, b: string) => a.localeCompare(b))
  }
  // For filters/search, allow picking any field from the selected source,
  // not only currently visible columns in the block.
  return bindingSourceHeaders.value
})

const querySelectLabels = computed(() => {
  if (!props.statsDataQueryMode) return [] as string[]
  const q = props.block.query as any
  if (q?.specVersion === 2) {
    const sel = Array.isArray(q.select) ? q.select : []
    return sel.map((c: any) => String(c?.label ?? '').trim()).filter(Boolean)
  }
  const cols = q?.columns?.length ? q.columns : []
  return cols.map((c: any) => String(c?.label ?? '').trim()).filter(Boolean)
})

const isQueryColumnVisible = (label: string) => {
  const keys = props.block.dataBinding.visibleColumnKeys
  if (keys.length === 0) return true
  return keys.includes(label)
}

const toggleQueryColumnVisible = (label: string, checked: boolean) => {
  const b = props.block
  const headers = querySelectLabels.value
  let keys = [...b.dataBinding.visibleColumnKeys]
  if (keys.length === 0) keys = [...headers]
  if (checked) {
    if (!keys.includes(label)) keys.push(label)
  } else {
    keys = keys.filter((k) => k !== label)
  }
  const allIncluded = headers.length > 0 && headers.every((h: string) => keys.includes(h))
  if (allIncluded || keys.length === 0) keys = []
  patchDataBinding({ visibleColumnKeys: keys })
}

const tableSearchEnabled = computed({
  get: () => props.block.search?.enabled === true,
  set: (on: boolean) => {
    const b = props.block
    if (!on) {
      emit('push-payload', {
        type: 'table',
        caption: b.caption,
        dataBinding: { ...b.dataBinding },
        ...(b.query ? { query: b.query } : {}),
        ...(b.filters ? { filters: b.filters } : {}),
      })
      return
    }
    const prev = b.search?.columnLabels?.length ? [...b.search.columnLabels] : []
    emit('push-payload', {
      type: 'table',
      caption: b.caption,
      dataBinding: { ...b.dataBinding },
      ...(b.query ? { query: b.query } : {}),
      search: { enabled: true, columnLabels: prev, mode: b.search?.mode ?? 'page' },
      ...(b.filters ? { filters: b.filters } : {}),
    })
  },
})

const isSearchColumnChecked = (label: string) => {
  const b = props.block
  if (!b.search?.enabled) return false
  const sel = b.search.columnLabels
  if (!sel.length) return true
  return sel.includes(label)
}

const toggleSearchColumn = (label: string, checked: boolean) => {
  const b = props.block
  if (!b.search?.enabled) return
  const opts = tableSearchSelectableLabels.value
  let cur = b.search.columnLabels.length ? [...b.search.columnLabels] : [...opts]
  if (checked) {
    if (!cur.includes(label)) cur.push(label)
  } else {
    cur = cur.filter((x) => x !== label)
  }
  if (opts.length > 0 && cur.length >= opts.length) cur = []
  const nextSearch: StudioTableSearchConfig = { enabled: true, columnLabels: cur, mode: b.search.mode ?? 'page' }
  emit('push-payload', {
    type: 'table',
    caption: b.caption,
    dataBinding: { ...b.dataBinding },
    ...(b.query ? { query: b.query } : {}),
    search: nextSearch,
    ...(b.filters ? { filters: b.filters } : {}),
  })
}

const tableFiltersEnabled = computed({
  get: () => props.block.filters?.enabled === true,
  set: (on: boolean) => {
    const b = props.block
    if (!on) {
      emit('push-payload', {
        type: 'table',
        caption: b.caption,
        dataBinding: { ...b.dataBinding },
        ...(b.query ? { query: b.query } : {}),
        ...(b.search ? { search: b.search } : {}),
      })
      return
    }
    const prev = b.filters?.columnLabels?.length ? [...b.filters.columnLabels] : []
    const nextFilters: StudioTableFilterConfig = { enabled: true, columnLabels: prev }
    emit('push-payload', {
      type: 'table',
      caption: b.caption,
      dataBinding: { ...b.dataBinding },
      ...(b.query ? { query: b.query } : {}),
      ...(b.search ? { search: b.search } : {}),
      filters: nextFilters,
    })
  },
})

const isFilterColumnChecked = (label: string) => {
  const b = props.block
  if (!b.filters?.enabled) return false
  const sel = b.filters.columnLabels
  if (!sel.length) return true
  return sel.includes(label)
}

const toggleFilterColumn = (label: string, checked: boolean) => {
  const b = props.block
  if (!b.filters?.enabled) return
  const opts = tableSearchSelectableLabels.value
  let cur = b.filters.columnLabels.length ? [...b.filters.columnLabels] : [...opts]
  if (checked) {
    if (!cur.includes(label)) cur.push(label)
  } else {
    cur = cur.filter((x) => x !== label)
  }
  if (opts.length > 0 && cur.length >= opts.length) cur = []
  const nextFilters: StudioTableFilterConfig = { enabled: true, columnLabels: cur }

  // If user enables filtering on a source field (alias.field) in v2 mode,
  // ensure it is part of the query select so the table can actually filter on it.
  const ensureV2SelectField = (): StatsDataQueryRequestV2 | null => {
    const q = b.query as any
    if (q?.specVersion !== 2) return null
    if (!label.includes('.')) return null
    const [alias, ...rest] = String(label).split('.')
    const field = rest.join('.')
    if (!alias || !field) return null
    const v2 = q as StatsDataQueryRequestV2
    const sel = Array.isArray((v2 as any).select) ? [...(v2 as any).select] : []
    if (sel.some((c: any) => String(c?.label ?? '').trim() === label)) return v2
    return { ...v2, select: [...sel, { kind: 'from', label, from: label }] as any }
  }

  const maybeNextQuery = checked ? ensureV2SelectField() : null
  emit('push-payload', {
    type: 'table',
    caption: b.caption,
    dataBinding: { ...b.dataBinding },
    ...(b.query ? { query: (maybeNextQuery ?? b.query) as any } : {}),
    ...(b.search ? { search: b.search } : {}),
    filters: nextFilters,
  })
}
</script>

<template>
  <details class="group rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
    <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
      <span>Options du panneau</span>
      <svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
          clip-rule="evenodd"
        />
      </svg>
    </summary>
    <div class="mt-3">
      <label class="mb-1 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-tbl-cap`">Titre</label>
      <input
        :id="`${idPrefix}-tbl-cap`"
        v-model="caption"
        type="text"
        class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
        autocomplete="off"
      />
    </div>
  </details>

  <details v-if="block.dataBinding.sourceId && tableSearchSelectableLabels.length" class="group rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
    <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
      <span>Recherche</span>
      <svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
          clip-rule="evenodd"
        />
      </svg>
    </summary>
    <div class="mt-3 space-y-2">
      <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
          :checked="tableSearchEnabled"
          @change="tableSearchEnabled = ($event.target as HTMLInputElement).checked"
        />
        Afficher la barre de recherche
      </label>
      <template v-if="tableSearchEnabled">
        <p class="text-[11px] font-medium text-slate-600">Champs interrogés</p>
        <ul class="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
          <li v-for="lab in tableSearchSelectableLabels" :key="`${idPrefix}-search-${lab}`" class="flex items-center gap-2">
            <input
              :id="`${idPrefix}-search-col-${lab}`"
              type="checkbox"
              class="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/30"
              :checked="isSearchColumnChecked(lab)"
              @change="toggleSearchColumn(lab, ($event.target as HTMLInputElement).checked)"
            />
            <label :for="`${idPrefix}-search-col-${lab}`" class="text-sm text-slate-800">{{ lab }}</label>
          </li>
        </ul>
      </template>
    </div>
  </details>

  <details v-if="block.dataBinding.sourceId && tableSearchSelectableLabels.length" class="group rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
    <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
      <span>Filtres</span>
      <svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
          clip-rule="evenodd"
        />
      </svg>
    </summary>
    <div class="mt-3 space-y-2">
      <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
          :checked="tableFiltersEnabled"
          @change="tableFiltersEnabled = ($event.target as HTMLInputElement).checked"
        />
        Afficher les filtres
      </label>
      <template v-if="tableFiltersEnabled">
        <p class="text-[11px] font-medium text-slate-600">Colonnes filtrables</p>
        <ul class="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
          <li v-for="lab in tableSearchSelectableLabels" :key="`${idPrefix}-filter-${lab}`" class="flex items-center gap-2">
            <input
              :id="`${idPrefix}-filter-col-${lab}`"
              type="checkbox"
              class="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/30"
              :checked="isFilterColumnChecked(lab)"
              @change="toggleFilterColumn(lab, ($event.target as HTMLInputElement).checked)"
            />
            <label :for="`${idPrefix}-filter-col-${lab}`" class="text-sm text-slate-800">{{ lab }}</label>
          </li>
        </ul>
      </template>
    </div>
  </details>

  <StudioInspectorStatsDataQuery
    v-if="statsDataQueryMode"
    :id-prefix="idPrefix"
    :data-sources="dataSources"
    :block="{ type: 'table', caption: block.caption, dataBinding: block.dataBinding, ...(block.query ? { query: block.query } : {}), ...(block.search ? { search: block.search } : {}), ...(block.filters ? { filters: block.filters } : {}) }"
    @push-payload="emit('push-payload', $event)"
  />

  <details v-if="statsDataQueryMode && querySelectLabels.length" class="group rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
    <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
      <span>Colonnes visibles</span>
      <svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
          clip-rule="evenodd"
        />
      </svg>
    </summary>
    <div class="mt-3">
      <p class="mb-2 text-[11px] font-medium text-slate-600">Décoche une colonne “cachée” (utile pour filtrer sans afficher).</p>
      <ul class="flex max-h-52 flex-col gap-1.5 overflow-y-auto">
        <li v-for="lab in querySelectLabels" :key="`${idPrefix}-qvis-${lab}`" class="flex items-center gap-2">
          <input
            :id="`${idPrefix}-qvis-col-${lab}`"
            type="checkbox"
            class="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/30"
            :checked="isQueryColumnVisible(lab)"
            @change="toggleQueryColumnVisible(lab, ($event.target as HTMLInputElement).checked)"
          />
          <label :for="`${idPrefix}-qvis-col-${lab}`" class="text-sm text-slate-800">{{ lab }}</label>
        </li>
      </ul>
    </div>
  </details>

  <div v-else-if="bindingSourceHeaders.length">
    <p class="mb-2 text-xs font-semibold text-slate-600">Colonnes visibles</p>
    <p class="mb-2 text-[11px] leading-snug text-slate-500">Tout cocher = toutes les colonnes.</p>
    <ul class="flex flex-col gap-2">
      <li v-for="h in bindingSourceHeaders" :key="h" class="flex items-center gap-2">
        <input
          :id="`${idPrefix}-col-${h}`"
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
          :checked="isTableColumnVisible(h)"
          @change="toggleTableColumn(h, ($event.target as HTMLInputElement).checked)"
        />
        <label :for="`${idPrefix}-col-${h}`" class="text-sm text-slate-800">{{ h }}</label>
      </li>
    </ul>
  </div>
  <p v-else-if="block.dataBinding.sourceId" class="text-xs text-amber-700">
    Cette source ne contient pas encore de colonnes.
  </p>
</template>

