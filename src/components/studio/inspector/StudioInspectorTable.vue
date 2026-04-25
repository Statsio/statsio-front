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
      ...(b.rowsPerPage ? { rowsPerPage: b.rowsPerPage } : {}),
    })
  },
})

const rowsPerPage = computed({
  get: () => props.block.rowsPerPage ?? 500,
  set: (v) => {
    const b = props.block
    emit('push-payload', {
      type: 'table',
      caption: b.caption,
      dataBinding: { ...b.dataBinding },
      ...(b.query ? { query: b.query } : {}),
      ...(b.search ? { search: b.search } : {}),
      ...(b.filters ? { filters: b.filters } : {}),
      rowsPerPage: v,
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
        ...(b.rowsPerPage ? { rowsPerPage: b.rowsPerPage } : {}),
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
      ...(b.rowsPerPage ? { rowsPerPage: b.rowsPerPage } : {}),
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
    ...(b.rowsPerPage ? { rowsPerPage: b.rowsPerPage } : {}),
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
        ...(b.rowsPerPage ? { rowsPerPage: b.rowsPerPage } : {}),
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
      ...(b.rowsPerPage ? { rowsPerPage: b.rowsPerPage } : {}),
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
    ...(b.rowsPerPage ? { rowsPerPage: b.rowsPerPage } : {}),
  })
}
</script>

<template>
  <div class="space-y-8">
    <!-- Section Contenu -->
    <section class="space-y-4">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Contenu du tableau
        </label>
        <div class="h-px bg-slate-100 mb-2" />
        
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-tbl-cap`">
            Titre du tableau
          </label>
          <input
            :id="`${idPrefix}-tbl-cap`"
            v-model="caption"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20"
            placeholder="Ex: Résultats annuels 2024"
            autocomplete="off"
          />
        </div>
      </div>
    </section>

    <!-- Section Affichage -->
    <section class="space-y-4">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Affichage du tableau
        </label>
        <div class="h-px bg-slate-100 mb-2" />
        
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-600" :for="`${idPrefix}-rows-per-page`">
            Nombre de lignes par page
          </label>
          <input
            :id="`${idPrefix}-rows-per-page`"
            v-model.number="rowsPerPage"
            type="number"
            min="10"
            max="10000"
            step="10"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20"
            placeholder="500"
          />
          <p class="mt-1.5 text-[10px] text-slate-500">
            Nombre de lignes à afficher à chaque page (min: 10, max: 10 000)
          </p>
        </div>
      </div>
    </section>
    <section v-if="block.dataBinding.sourceId || statsDataQueryMode" class="space-y-4">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Colonnes visibles
        </label>
        <div class="h-px bg-slate-100 mb-2" />
        
        <div class="rounded-xl border border-slate-100 bg-slate-50/30 p-3">
          <ul v-if="statsDataQueryMode" class="flex flex-col gap-2">
            <li v-for="lab in querySelectLabels" :key="`${idPrefix}-col-${lab}`" class="flex items-center gap-3">
              <input
                :id="`${idPrefix}-col-${lab}`"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                :checked="isQueryColumnVisible(lab)"
                @change="toggleQueryColumnVisible(lab, ($event.target as HTMLInputElement).checked)"
              />
              <label :for="`${idPrefix}-col-${lab}`" class="text-sm font-medium text-slate-700 cursor-pointer select-none">
                {{ lab }}
              </label>
            </li>
          </ul>
          <ul v-else class="flex flex-col gap-2">
            <li v-for="header in bindingSourceHeaders" :key="`${idPrefix}-col-${header}`" class="flex items-center gap-3">
              <input
                :id="`${idPrefix}-col-${header}`"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                :checked="isTableColumnVisible(header)"
                @change="toggleTableColumn(header, ($event.target as HTMLInputElement).checked)"
              />
              <label :for="`${idPrefix}-col-${header}`" class="text-sm font-medium text-slate-700 cursor-pointer select-none">
                {{ header }}
              </label>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Section Recherche & Filtres -->
    <section v-if="block.dataBinding.sourceId && tableSearchSelectableLabels.length" class="space-y-6">
      <!-- Recherche -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Recherche & Filtres
        </label>
        <div class="h-px bg-slate-100 mb-3" />
        
        <div class="space-y-4">
          <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50">
            <input
              type="checkbox"
              class="h-5 w-5 rounded-lg border-slate-300 text-primary focus:ring-primary/30"
              :checked="tableSearchEnabled"
              @change="tableSearchEnabled = ($event.target as HTMLInputElement).checked"
            />
            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-900">Activer la recherche</span>
              <span class="text-[10px] text-slate-500">Permet aux lecteurs de filtrer les lignes</span>
            </div>
          </label>

          <div v-if="tableSearchEnabled" class="pl-2 space-y-2">
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Champs indexés</p>
            <ul class="flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-2 custom-scrollbar">
              <li v-for="lab in tableSearchSelectableLabels" :key="`${idPrefix}-search-${lab}`" class="flex items-center gap-2.5 p-1 hover:bg-slate-50 rounded-lg">
                <input
                  :id="`${idPrefix}-search-col-${lab}`"
                  type="checkbox"
                  class="h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/30"
                  :checked="isSearchColumnChecked(lab)"
                  @change="toggleSearchColumn(lab, ($event.target as HTMLInputElement).checked)"
                />
                <label :for="`${idPrefix}-search-col-${lab}`" class="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  {{ lab }}
                </label>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Requête avancée -->
    <section v-if="statsDataQueryMode" class="space-y-3">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Requête de données
        </label>
        <div class="h-px bg-slate-100 mb-2" />
        
        <StudioInspectorStatsDataQuery
          :id-prefix="idPrefix"
          :data-sources="dataSources"
          :block="{ type: 'table', caption: block.caption, dataBinding: block.dataBinding, ...(block.query ? { query: block.query } : {}), ...(block.search ? { search: block.search } : {}), ...(block.filters ? { filters: block.filters } : {}) }"
          @push-payload="emit('push-payload', $event)"
        />
      </div>
    </section>
  </div>

</template>
