<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { columnRefLabel } from '@/lib/studio-columns'
import { blockDatasetIds } from '@/lib/studio-block-sources'
import { BLOCK_FILTER_OPERATORS, type BlockFilter, type FilterGroup, type StudioBlock } from '@/types/studio'
import { useFilterDrillIn, parseListValue, type FilterDrillInMode } from '@/composables/useFilterDrillIn'
import { readFilterGroups, readFiltersMatch, withGroupMatch, withRemovedGroup, withRemovedCondition } from '@/lib/studio-filter-groups'
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
    addLabel: '+ Ajouter un groupe',
  },
)

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const drillIn = useFilterDrillIn()

const groups = computed<FilterGroup[]>(() => readFilterGroups(props.block, props.mode))
const topMatch = computed(() => readFiltersMatch(props.block, props.mode))

const MATCH_OPTIONS: { v: 'all' | 'any'; l: string }[] = [
  { v: 'all', l: 'ET' },
  { v: 'any', l: 'OU' },
]

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

function writeGroups(next: FilterGroup[]) {
  if (props.mode === 'comparison') studio.updateBlockComparisonFilterGroups(props.block.id, next)
  else studio.updateBlockFilterGroups(props.block.id, next)
}

function writeTopMatch(m: 'all' | 'any') {
  if (props.mode === 'comparison') studio.updateBlockComparisonFiltersMatch(props.block.id, m)
  else studio.updateBlockFiltersMatch(props.block.id, m)
}

function setGroupMatch(groupIndex: number, m: 'all' | 'any') {
  writeGroups(withGroupMatch(groups.value, groupIndex, m))
}

function edit(groupIndex: number, conditionIndex: number) {
  drillIn.openEdit(props.block, props.mode, groupIndex, conditionIndex)
}

function removeCondition(groupIndex: number, conditionIndex: number) {
  writeGroups(withRemovedCondition(groups.value, groupIndex, conditionIndex))
}

function removeGroup(groupIndex: number) {
  writeGroups(withRemovedGroup(groups.value, groupIndex))
}

function addCondition(groupIndex: number) {
  drillIn.openAdd(props.block, props.mode, groupIndex)
}

function addGroup() {
  drillIn.openAdd(props.block, props.mode, null)
}
</script>

<template>
  <StudioField :label="label">
    <div class="flex flex-col gap-2">
      <template v-for="(group, gi) in groups" :key="gi">
        <!-- Séparateur ET/OU entre deux groupes — un seul combinateur partagé, cliquable. -->
        <button
          v-if="gi > 0"
          type="button"
          class="self-center rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-[var(--studio-faint)] transition-colors hover:text-[var(--studio-ink)]"
          @click="writeTopMatch(topMatch === 'any' ? 'all' : 'any')"
        >— {{ topMatch === 'any' ? 'OU' : 'ET' }} —</button>

        <div class="flex flex-col gap-2 rounded-xl border border-[var(--studio-line)] bg-white p-2.5">
          <div v-if="group.conditions.length > 1 || groups.length > 1" class="flex items-center justify-between gap-2">
            <div v-if="group.conditions.length > 1" class="flex gap-1 rounded-full bg-[var(--studio-wash)] p-[3px]">
              <button
                v-for="o in MATCH_OPTIONS"
                :key="o.v"
                type="button"
                class="rounded-full px-2.5 py-0.5 text-[10.5px] font-bold transition-colors"
                :class="group.match === o.v ? 'bg-white text-[var(--studio-ink)] shadow-[0_1px_2px_rgba(20,20,30,0.12)]' : 'text-[var(--studio-muted)] hover:text-[var(--studio-ink)]'"
                @click="setGroupMatch(gi, o.v)"
              >{{ o.l }}</button>
            </div>
            <span v-else />
            <button
              v-if="groups.length > 1"
              type="button"
              class="text-[10.5px] font-bold text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
              @click="removeGroup(gi)"
            >Supprimer le groupe</button>
          </div>

          <div
            v-for="(f, ci) in group.conditions"
            :key="ci"
            class="group flex items-center gap-2 rounded-xl border border-[var(--studio-line)] bg-[var(--studio-note)] px-3 py-2.5"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 text-left"
              @click="edit(gi, ci)"
            >
              <span class="truncate font-mono text-[11.5px] font-semibold text-[var(--studio-ink)]">{{ filterLabel(f) }}</span>
              <span class="shrink-0 font-mono text-[11px] text-[var(--studio-faint)]">{{ operatorShort(f.operator) }}</span>
              <span class="truncate font-mono text-[11.5px] text-[var(--studio-tag-ink)]">{{ valueSummary(f) || '—' }}</span>
            </button>
            <button
              type="button"
              class="shrink-0 text-[13px] leading-none text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
              aria-label="Retirer le filtre"
              @click="removeCondition(gi, ci)"
            >✕</button>
          </div>

          <button type="button" class="studio-add-btn" @click="addCondition(gi)">+ Ajouter une condition</button>
        </div>
      </template>

      <p
        v-if="!groups.length"
        class="rounded-xl bg-[var(--studio-note)] px-3.5 py-3 text-[12.5px] leading-[1.5] text-[var(--studio-faint)]"
      >
        {{ emptyLabel }}
      </p>

      <button type="button" class="studio-add-btn" @click="addGroup">{{ addLabel }}</button>
    </div>
  </StudioField>
</template>
