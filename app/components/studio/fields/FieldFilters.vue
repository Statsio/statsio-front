<script setup lang="ts">
import StudioField from './StudioField.vue'
import { FILTER_OPERATORS, type BlockFilter } from '@/types/studio'

withDefaults(
  defineProps<{
    label?: string
    hint?: string
    columns: readonly string[]
    addLabel?: string
    emptyLabel?: string
  }>(),
  {
    label: '',
    hint: '',
    addLabel: '+ Ajouter un filtre',
    emptyLabel: 'Aucun filtre : le bloc affiche toutes les lignes de la source.',
  },
)

const model = defineModel<BlockFilter[]>({ default: () => [] })

function patch(i: number, p: Partial<BlockFilter>) {
  model.value = model.value.map((f, k) => (k === i ? { ...f, ...p } : f))
}
function remove(i: number) {
  model.value = model.value.filter((_, k) => k !== i)
}
function add() {
  model.value = [...model.value, { column: '', operator: '=', value: '' }]
}
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <div class="flex flex-col gap-[9px]">
      <div
        v-for="(filter, i) in model"
        :key="i"
        class="rounded-xl border border-[var(--studio-line)] px-3.5 py-3"
      >
        <div class="mb-[9px] flex items-center justify-between gap-2.5">
          <select
            :value="filter.column"
            class="studio-input studio-input--mono min-w-0 flex-1 !py-2 !text-[11.5px] !text-[var(--studio-tag-ink)]"
            @change="patch(i, { column: ($event.target as HTMLSelectElement).value })"
          >
            <option value="" disabled>colonne…</option>
            <option v-for="c in columns" :key="c" :value="c">{{ c }}</option>
          </select>
          <button
            type="button"
            class="shrink-0 text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)]"
            aria-label="Retirer"
            @click="remove(i)"
          >✕</button>
        </div>
        <div class="flex items-center gap-[7px]">
          <select
            :value="filter.operator"
            class="studio-input w-[118px] shrink-0 !py-2 !text-[11.5px]"
            @change="patch(i, { operator: ($event.target as HTMLSelectElement).value as BlockFilter['operator'] })"
          >
            <option v-for="op in FILTER_OPERATORS" :key="op.value" :value="op.value">{{ op.label }}</option>
          </select>
          <input
            :value="filter.value"
            type="text"
            class="studio-input studio-input--mono min-w-0 flex-1 !py-[9px]"
            @input="patch(i, { value: ($event.target as HTMLInputElement).value })"
          />
        </div>
      </div>
      <p v-if="!model.length" class="text-[12.5px] leading-[1.5] text-[var(--studio-faint)]">{{ emptyLabel }}</p>
      <button type="button" class="studio-add-btn" @click="add">{{ addLabel }}</button>
    </div>
  </StudioField>
</template>
