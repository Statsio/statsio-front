<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { BlockFilter, FilterOperator } from '@/types/studio'

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const block = computed(() => studio.selectedBlock)

const schema = computed(() => {
  if (!block.value?.datasetId) return null
  return datasets.getSchema(block.value.datasetId) ?? null
})

const columnNames = computed(() => schema.value?.columns.map((c) => c.name) ?? [])

// Load schema when dataset is selected
watch(() => block.value?.datasetId, async (id) => {
  if (id) await datasets.loadSchema(id)
}, { immediate: true })

function updateConfig(key: string, value: unknown) {
  if (!block.value) return
  studio.updateBlockConfig(block.value.id, { [key]: value })
}

function updateMapping(key: string, value: string) {
  if (!block.value) return
  studio.updateBlockFieldMapping(block.value.id, { [key]: value })
}

function updateDataset(datasetId: string) {
  if (!block.value) return
  studio.updateBlockDataset(block.value.id, datasetId)
}

const needsXY = computed(() => block.value?.type === 'bar' || block.value?.type === 'line')
const needsLabelValue = computed(() => block.value?.type === 'pie')
const needsValue = computed(() => block.value?.type === 'kpi')
const isTable = computed(() => block.value?.type === 'table')

// ─── Filters ─────────────────────────────────────────────────────────────────

const filters = computed<BlockFilter[]>(() => block.value?.filters ?? [])

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: '=',           label: 'égal à' },
  { value: '!=',          label: 'différent de' },
  { value: '>',           label: 'supérieur à' },
  { value: '>=',          label: 'supérieur ou égal' },
  { value: '<',           label: 'inférieur à' },
  { value: '<=',          label: 'inférieur ou égal' },
  { value: 'contains',    label: 'contient' },
  { value: 'not_contains',label: 'ne contient pas' },
]

function addFilter() {
  if (!block.value) return
  studio.updateBlockFilters(block.value.id, [
    ...filters.value,
    { column: columnNames.value[0] ?? '', operator: '=', value: '' },
  ])
}

function removeFilter(index: number) {
  if (!block.value) return
  const updated = filters.value.filter((_, i) => i !== index)
  studio.updateBlockFilters(block.value.id, updated)
}

function updateFilter(index: number, patch: Partial<BlockFilter>) {
  if (!block.value) return
  const updated = filters.value.map((f, i) => i === index ? { ...f, ...patch } : f)
  studio.updateBlockFilters(block.value.id, updated)
}
</script>

<template>
  <div v-if="block" class="flex flex-col h-full overflow-hidden">
    <!-- Panel header -->
    <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
      <p class="text-sm font-bold text-slate-800">Configurer le bloc</p>
      <button class="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" @click="studio.selectBlock(null)">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Scrollable body -->
    <div class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">

      <!-- Title -->
      <section>
        <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Titre</label>
        <input
          type="text"
          class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
          placeholder="Titre du bloc"
          :value="block.config.title ?? ''"
          @input="updateConfig('title', ($event.target as HTMLInputElement).value)"
        />
      </section>

      <!-- Dataset selection -->
      <section>
        <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Source de données</label>
        <select
          class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
          :value="block.datasetId ?? ''"
          @change="updateDataset(($event.target as HTMLSelectElement).value)"
        >
          <option value="">— Choisir un dataset —</option>
          <option v-for="ds in datasets.readyDatasets" :key="ds.id" :value="ds.id">
            {{ ds.name }} ({{ ds.rowCount.toLocaleString('fr-FR') }} lignes)
          </option>
        </select>
      </section>

      <!-- Field mappings — XY charts -->
      <section v-if="needsXY && block.datasetId">
        <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Axe X (catégories)</label>
        <select class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all" :value="block.fieldMapping.xAxis ?? ''" @change="updateMapping('xAxis', ($event.target as HTMLSelectElement).value)">
          <option value="">— Choisir une colonne —</option>
          <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
        </select>

        <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider mt-3">Axe Y (valeurs)</label>
        <select class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all" :value="block.fieldMapping.yAxis ?? ''" @change="updateMapping('yAxis', ($event.target as HTMLSelectElement).value)">
          <option value="">— Choisir une colonne —</option>
          <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
        </select>
      </section>

      <!-- Field mappings — KPI -->
      <section v-if="needsValue && block.datasetId">
        <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Colonne valeur</label>
        <select class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all" :value="block.fieldMapping.valueColumn ?? ''" @change="updateMapping('valueColumn', ($event.target as HTMLSelectElement).value)">
          <option value="">— Choisir une colonne —</option>
          <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
        </select>

        <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider mt-3">Colonne comparaison (optionnel)</label>
        <select class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all" :value="block.fieldMapping.comparisonColumn ?? ''" @change="updateMapping('comparisonColumn', ($event.target as HTMLSelectElement).value)">
          <option value="">— Aucune —</option>
          <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
        </select>

        <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider mt-3">Format</label>
        <select class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all" :value="block.config.format ?? 'number'" @change="updateConfig('format', ($event.target as HTMLSelectElement).value)">
          <option value="number">Nombre</option>
          <option value="percent">Pourcentage</option>
          <option value="currency">Devise (€)</option>
        </select>
      </section>

      <!-- Visual options — bar chart -->
      <section v-if="block.type === 'bar'">
        <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Orientation</label>
        <select class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all" :value="block.config.orientation ?? 'vertical'" @change="updateConfig('orientation', ($event.target as HTMLSelectElement).value)">
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
        </select>
      </section>

      <!-- Visual options — line chart -->
      <section v-if="block.type === 'line'">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            class="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            :checked="block.config.smooth ?? false"
            @change="updateConfig('smooth', ($event.target as HTMLInputElement).checked)"
          />
          <span class="text-sm text-slate-700">Courbe lisse</span>
        </label>
      </section>

      <!-- Visual options — table -->
      <section v-if="isTable">
        <label class="flex items-center gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            class="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            :checked="block.config.sortable ?? false"
            @change="updateConfig('sortable', ($event.target as HTMLInputElement).checked)"
          />
          <span class="text-sm text-slate-700">Colonnes triables</span>
        </label>

        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            class="rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            :checked="block.config.showPagination ?? false"
            @change="updateConfig('showPagination', ($event.target as HTMLInputElement).checked)"
          />
          <span class="text-sm text-slate-700">Pagination</span>
        </label>
      </section>

      <!-- Filters -->
      <section v-if="block.datasetId">
        <div class="flex items-center justify-between mb-2">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtres</label>
          <button
            class="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:opacity-75 transition-opacity"
            @click="addFilter"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter
          </button>
        </div>

        <div v-if="!filters.length" class="text-xs text-slate-400 py-1">
          Aucun filtre — toutes les lignes sont affichées.
        </div>

        <div v-else class="flex flex-col gap-2">
          <div
            v-for="(filter, i) in filters"
            :key="i"
            class="rounded-lg border border-slate-200 bg-slate-50 p-2.5 flex flex-col gap-2 relative"
          >
            <!-- Remove button -->
            <button
              class="absolute top-2 right-2 p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              @click="removeFilter(i)"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Column -->
            <select
              class="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/40 pr-6"
              :value="filter.column"
              @change="updateFilter(i, { column: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="col in columnNames" :key="col" :value="col">{{ col }}</option>
            </select>

            <!-- Operator -->
            <select
              class="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/40"
              :value="filter.operator"
              @change="updateFilter(i, { operator: ($event.target as HTMLSelectElement).value as FilterOperator })"
            >
              <option v-for="op in OPERATORS" :key="op.value" :value="op.value">{{ op.label }}</option>
            </select>

            <!-- Value -->
            <input
              type="text"
              class="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/40"
              placeholder="Valeur…"
              :value="filter.value"
              @input="updateFilter(i, { value: ($event.target as HTMLInputElement).value })"
            />
          </div>
        </div>
      </section>

      <!-- Color -->
      <section v-if="block.type !== 'table'">
        <label class="config-label">Couleur principale</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="color in ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']"
            :key="color"
            class="w-6 h-6 rounded-full border-2 transition-all"
            :style="{ backgroundColor: color }"
            :class="(block.config.colors?.[0] ?? '#8b5cf6') === color ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'"
            @click="updateConfig('colors', [color])"
          />
        </div>
      </section>

    </div>

    <!-- Delete block footer -->
    <div class="px-4 py-3 border-t border-slate-200 shrink-0">
      <button
        class="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        @click="studio.removeBlock(block.id)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
        Supprimer le bloc
      </button>
    </div>
  </div>

  <div v-else class="flex flex-col items-center justify-center h-full text-center px-4 text-slate-400">
    <svg class="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
    </svg>
    <p class="text-sm font-medium text-slate-500">Sélectionnez un bloc</p>
    <p class="text-xs mt-1 text-slate-400">Cliquez sur un bloc du canvas pour le configurer</p>
  </div>
</template>

