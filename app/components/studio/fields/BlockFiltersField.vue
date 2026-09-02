<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { columnRefLabel } from '@/lib/studio-columns'
import { blockDatasetIds } from '@/lib/studio-block-sources'
import { BLOCK_FILTER_OPERATORS, type BlockFilter, type StudioBlock } from '@/types/studio'
import { useFilterDrillIn, parseListValue, type FilterDrillInMode } from '@/composables/useFilterDrillIn'
import { useStudioStore } from '@/stores/studio'
import StudioField from './StudioField.vue'

const props = withDefaults(
  defineProps<{
    block: StudioBlock
    mode?: FilterDrillInMode
    label?: string
    emptyLabel?: string
    addLabel?: string
  }>(),
  {
    mode: 'primary',
    label: 'Filtres',
    emptyLabel: 'Aucun filtre : le bloc lit toutes les lignes de la source.',
    addLabel: '+ Ajouter un filtre',
  },
)

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const drillIn = useFilterDrillIn()

const filters = computed<BlockFilter[]>(
  () => (props.mode === 'comparison' ? props.block.comparisonFilters : props.block.filters) ?? [],
)

// Précharge les schémas des sources du bloc (repris de l'ancienne FiltersModal).
watch(
  () => blockDatasetIds(props.block),
  (ids) => ids.forEach((id) => datasets.loadSchema(id)),
  { immediate: true, deep: true },
)

function operatorShort(op: BlockFilter['operator']): string {
  return BLOCK_FILTER_OPERATORS.find((o) => o.value === op)?.short ?? op
}

function valueSummary(f: BlockFilter): string {
  if (f.operator === 'in' || f.operator === 'not_in') {
    const list = parseListValue(f.value)
    if (list.length <= 2) return list.join(', ')
    return `${list.slice(0, 2).join(', ')} +${list.length - 2}`
  }
  return f.value
}

function filterLabel(f: BlockFilter): string {
  return columnRefLabel(f.column, props.block, datasets)
}

function edit(i: number) {
  drillIn.openEdit(props.block, props.mode, i)
}

function remove(i: number) {
  const next = filters.value.filter((_, k) => k !== i)
  if (props.mode === 'comparison') studio.updateBlockComparisonFilters(props.block.id, next)
  else studio.updateBlockFilters(props.block.id, next)
}

function add() {
  drillIn.openAdd(props.block, props.mode)
}
</script>

<template>
  <StudioField :label="label">
    <div class="flex flex-col gap-2">
      <div
        v-for="(f, i) in filters"
        :key="i"
        class="group flex items-center gap-2 rounded-xl border border-[var(--studio-line)] bg-white px-3 py-2.5"
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 text-left"
          @click="edit(i)"
        >
          <span class="truncate font-mono text-[11.5px] font-semibold text-[var(--studio-ink)]">{{ filterLabel(f) }}</span>
          <span class="shrink-0 font-mono text-[11px] text-[var(--studio-faint)]">{{ operatorShort(f.operator) }}</span>
          <span class="truncate font-mono text-[11.5px] text-[var(--studio-tag-ink)]">{{ valueSummary(f) || '—' }}</span>
        </button>
        <button
          type="button"
          class="shrink-0 text-[13px] leading-none text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
          aria-label="Retirer le filtre"
          @click="remove(i)"
        >✕</button>
      </div>

      <p
        v-if="!filters.length"
        class="rounded-xl bg-[var(--studio-note)] px-3.5 py-3 text-[12.5px] leading-[1.5] text-[var(--studio-faint)]"
      >
        {{ emptyLabel }}
      </p>

      <button type="button" class="studio-add-btn" @click="add">{{ addLabel }}</button>
    </div>
  </StudioField>
</template>
