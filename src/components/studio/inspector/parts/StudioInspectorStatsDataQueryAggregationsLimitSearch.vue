<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlockPayload, StudioTableSearchConfig } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import StudioFormulaEditor from '@/components/studio/inspector/parts/StudioFormulaEditor.vue'
import type { StatsDataQueryRequestV2, StatsDataQueryWhereConditionV2 } from '@/types/statsdata-query-v2'

const props = defineProps<{
  idPrefix: string
  dataSources: StudioDataSource[]
  block: Extract<StudioBlockPayload, { type: 'table' | 'chart' | 'chart_line' | 'chart_pie' }>
  qDraft: StatsDataQueryRequestV2
  commitV2: (q: StatsDataQueryRequestV2) => void
  pushPayload: (b: StudioBlockPayload) => void
  refOptions: string[]
}>()

const filters = computed<StatsDataQueryWhereConditionV2[]>(() => props.qDraft.where ?? [])

const addFilter = () => {
  props.commitV2({
    ...props.qDraft,
    where: [
      ...(props.qDraft.where ?? []),
      {
        kind: 'eq',
        left: { kind: 'column', column: props.refOptions[0] ?? '' },
        right: { kind: 'literal', value: '' },
      },
    ],
  })
}

const removeFilter = (index: number) => {
  props.commitV2({ ...props.qDraft, where: (props.qDraft.where ?? []).filter((_, i) => i !== index) })
}

const patchFilter = (index: number, patch: Partial<StatsDataQueryWhereConditionV2>) => {
  const next = (props.qDraft.where ?? []).map((f, i) => (i === index ? { ...f, ...patch } : f))
  props.commitV2({ ...props.qDraft, where: next })
}

const searchMode = computed(() => props.block.search?.mode ?? 'page')
const setSearchMode = (mode: 'page' | 'api') => {
  const b = props.block
  const nextSearch: StudioTableSearchConfig = {
    enabled: true,
    columnLabels: b.search?.columnLabels?.length ? [...b.search.columnLabels] : [],
    mode,
  }
  props.pushPayload({ ...b, search: nextSearch } as unknown as StudioBlockPayload)
}
</script>

<template>
  <details class="group mt-3 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
    <summary class="flex cursor-pointer list-none select-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
      <span>Filtres</span>
      <svg viewBox="0 0 20 20" fill="currentColor" class="details-chevron ml-auto h-4 w-4 text-slate-400 transition" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
          clip-rule="evenodd"
        />
      </svg>
    </summary>

    <div class="mt-3 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <p class="text-[11px] font-medium text-slate-600">Conditions WHERE</p>
        <AppButton variant="ghost" size="sm" type="button" @click="addFilter">+ Filtre</AppButton>
      </div>

      <ul v-if="filters.length" class="space-y-3">
        <li v-for="(filter, i) in filters" :key="`filter-${i}`" class="rounded-xl border border-slate-200 bg-white p-3">
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Champ</label>
              <AppSelect
                :model-value="filter.left.column"
                :options="[{ value: '', label: '—' }, ...refOptions.map((r) => ({ value: r, label: r }))]"
                size="sm"
                button-class="w-full rounded-lg bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20"
                panel-class="mt-1"
                aria-label="Champ"
                @change="(v) => patchFilter(i, { left: { kind: 'column', column: String(v || '') } })"
              />
            </div>
            <div>
              <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Opérateur</label>
              <AppSelect
                :model-value="filter.kind"
                :options="[
                  { value: 'eq', label: '=' },
                  { value: 'ne', label: '≠' },
                  { value: 'gt', label: '>' },
                  { value: 'gte', label: '≥' },
                  { value: 'lt', label: '<' },
                  { value: 'lte', label: '≤' },
                ]"
                size="sm"
                button-class="w-full rounded-lg bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20"
                panel-class="mt-1"
                aria-label="Opérateur"
                @change="(v) => patchFilter(i, { kind: String(v) as any })"
              />
            </div>
          </div>

          <div class="mt-3">
            <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Valeur</label>
            <StudioFormulaEditor
              :model-value="filter.right.value"
              :field-buttons="refOptions.map((r) => ({ label: r, insert: r }))"
              placeholder="Valeur ou formule"
              :rows="3"
              @update:model-value="(v) => patchFilter(i, { right: { kind: 'literal', value: v } })"
            />
          </div>

          <div class="mt-2 flex justify-end">
            <AppButton variant="ghost" size="sm" type="button" class="text-rose-700" @click="removeFilter(i)">Retirer</AppButton>
          </div>
        </li>
      </ul>
    </div>
  </details>

  <details class="group mt-3 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-3">
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

    <div class="mt-3 flex flex-wrap gap-2">
      <div class="ml-auto flex flex-wrap gap-1">
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-[11px] font-semibold"
          :class="searchMode === 'page' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white/70'"
          @click="setSearchMode('page')"
        >
          Sur la page
        </button>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-[11px] font-semibold"
          :class="searchMode === 'api' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white/70'"
          @click="setSearchMode('api')"
        >
          Via l'API
        </button>
      </div>
    </div>
  </details>
</template>

<style scoped>
details > summary .details-chevron {
  transform: rotate(0deg);
}
details[open] > summary .details-chevron {
  transform: rotate(180deg);
}
</style>
