<script setup lang="ts">
/**
 * Displays a button showing the selected column name.
 * Clicking it opens ColumnPickerModal in single-column mode.
 *
 * Use for any field that maps to a column (axis, sort, series, etc.)
 * and does NOT allow arbitrary raw values.
 */
import { ref } from 'vue'
import type { StudioBlock, AggregateFunction } from '@/types/studio'
import type { ColumnGroup } from './ColumnPickerModal.vue'
import ColumnPickerModal from './ColumnPickerModal.vue'

defineProps<{
  modelValue?: string | null
  block: StudioBlock
  placeholder?: string
  clearable?: boolean
  /** Override column groups shown in the picker (e.g. primary-only for join keys). */
  customGroups?: ColumnGroup[]
  /** Show the "Agrégation" tab in the picker (for value columns that support sum/avg/count/min/max). */
  showAggregation?: boolean
  aggregateValue?: AggregateFunction
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'update:aggregate', value: AggregateFunction | undefined): void
}>()

const showModal = ref(false)

function clear(e: MouseEvent) {
  e.stopPropagation()
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="flex items-center gap-1">
    <button
      type="button"
      class="flex flex-1 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition-all hover:border-slate-300 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25"
      :class="modelValue ? 'text-slate-800' : 'text-slate-400'"
      @click="showModal = true"
    >
      <span class="truncate font-mono text-xs">
        {{ modelValue ?? (placeholder ?? '— Choisir une colonne —') }}
      </span>
      <!-- Column icon -->
      <svg class="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375" />
      </svg>
    </button>

    <!-- Clear button -->
    <button
      v-if="clearable && modelValue"
      type="button"
      class="flex h-[38px] w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
      @click="clear"
    >×</button>

    <ColumnPickerModal
      :show="showModal"
      :block="block"
      mode="single"
      :model-value="modelValue ?? null"
      :custom-groups="customGroups"
      :show-aggregation="showAggregation"
      :aggregate-value="aggregateValue"
      @update:model-value="emit('update:modelValue', $event)"
      @update:aggregate="emit('update:aggregate', $event)"
      @close="showModal = false"
    />
  </div>
</template>
