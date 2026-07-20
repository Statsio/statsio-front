<script setup lang="ts">
/**
 * Text input that also allows picking a column or building an expression.
 * Clicking the {} icon opens ColumnPickerModal in expression mode.
 *
 * Use for fields that accept both raw string values AND columns/expressions
 * (e.g. filter values, parameter defaults).
 */
import { ref } from 'vue'
import type { StudioBlock } from '@/types/studio'
import ColumnPickerModal from './ColumnPickerModal.vue'

defineProps<{
  modelValue: string
  block: StudioBlock
  placeholder?: string
  type?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const showModal = ref(false)

const hasVar = (v: string) => v.includes('{{')
</script>

<template>
  <div class="relative">
    <input
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      class="w-full rounded-xl border bg-white py-2 pl-3 pr-9 text-sm text-slate-800 placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25 focus:border-[var(--color-primary)]"
      :class="hasVar(modelValue) ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />

    <!-- {} trigger -->
    <button
      type="button"
      title="Insérer une colonne ou expression"
      class="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md font-mono text-[11px] font-bold text-slate-400 transition-colors hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
      @click="showModal = true"
    >{}</button>

    <ColumnPickerModal
      :show="showModal"
      :block="block"
      mode="expression"
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      @close="showModal = false"
    />
  </div>
</template>
