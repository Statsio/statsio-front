<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups, columnRefLabel, primarySourceId } from '@/lib/studio-columns'
import type { ArithOp, CalcColumn, CalcOperand, StudioBlock } from '@/types/studio'
import StudioField from './StudioField.vue'
import FieldColumns from './FieldColumns.vue'

const props = defineProps<{ block: StudioBlock; modelValue: CalcColumn }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: CalcColumn): void }>()

const datasets = useStudioDatasetsStore()

/** Colonnes réelles uniquement (pas de calc:<id> imbriquée). */
const columnGroups = computed(() => blockColumnGroups(props.block, datasets).filter((g) => g.sourceId))
const primaryId = computed(() => primarySourceId(props.block))
const draft = computed(() => props.modelValue)

const OPS: { value: ArithOp; label: string }[] = [
  { value: '+', label: '+' },
  { value: '-', label: '−' },
  { value: '*', label: '×' },
  { value: '/', label: '÷' },
]

/** Index de l'opérande dont le sélecteur de colonne est ouvert (-1 = aucun). */
const pickingIndex = ref(-1)

function patch(operands: CalcOperand[]) {
  emit('update:modelValue', { ...draft.value, operands })
}
function setLabel(v: string) {
  emit('update:modelValue', { ...draft.value, label: v })
}
function updateOperand(i: number, p: Partial<CalcOperand>) {
  patch(draft.value.operands.map((o, k) => (k === i ? { ...o, ...p } : o)))
}
function setColumn(i: number, ref: string) {
  updateOperand(i, { column: ref, value: undefined })
  pickingIndex.value = -1
}
function setValue(i: number, raw: string) {
  const n = Number(raw.replace(',', '.'))
  updateOperand(i, { value: Number.isFinite(n) ? n : 0, column: undefined })
}
function addOperand(kind: 'column' | 'value') {
  patch([...draft.value.operands, kind === 'column' ? { op: '+', column: '' } : { op: '+', value: 0 }])
}
function removeOperand(i: number) {
  patch(draft.value.operands.filter((_, k) => k !== i))
}

const operandLabel = (o: CalcOperand) =>
  o.column !== undefined && o.column !== '' ? columnRefLabel(o.column, props.block, datasets)
    : o.value !== undefined ? String(o.value)
      : 'choisir…'
</script>

<template>
  <div class="flex flex-col gap-3">
    <StudioField label="Libellé">
      <input
        :value="draft.label"
        type="text"
        class="studio-input w-full !py-2 !text-[12.5px]"
        placeholder="ex. Taux de réussite"
        @input="setLabel(($event.target as HTMLInputElement).value)"
      />
    </StudioField>

    <StudioField label="Formule">
      <div class="flex flex-col gap-2">
        <div v-for="(o, i) in draft.operands" :key="i" class="flex flex-col gap-1.5">
          <div class="flex items-center gap-1.5">
            <select
              v-if="i > 0"
              class="studio-input !w-[46px] shrink-0 !py-1.5 !text-center !text-[13px] font-bold"
              :value="o.op ?? '+'"
              @change="updateOperand(i, { op: ($event.target as HTMLSelectElement).value as ArithOp })"
            >
              <option v-for="op in OPS" :key="op.value" :value="op.value">{{ op.label }}</option>
            </select>
            <span v-else class="w-[46px] shrink-0" />

            <template v-if="o.value !== undefined && o.column === undefined">
              <input
                :value="o.value"
                type="number"
                step="any"
                class="studio-input min-w-0 flex-1 !py-1.5 !text-[12px]"
                @input="setValue(i, ($event.target as HTMLInputElement).value)"
              />
            </template>
            <button
              v-else
              type="button"
              class="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[10px] border-[1.5px] px-2.5 py-1.5 text-left transition-colors"
              :class="pickingIndex === i ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]' : 'border-[var(--studio-line-strong)] hover:border-[var(--color-primary)]'"
              @click="pickingIndex = pickingIndex === i ? -1 : i"
            >
              <span
                class="min-w-0 flex-1 truncate font-mono text-[11.5px]"
                :class="o.column ? 'font-semibold text-[var(--studio-ink)]' : 'text-[var(--studio-faint)]'"
              >{{ operandLabel(o) }}</span>
              <svg class="h-3.5 w-3.5 shrink-0 text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            <button
              v-if="draft.operands.length > 1"
              type="button"
              class="shrink-0 text-[13px] leading-none text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
              aria-label="Retirer l'opérande"
              @click="removeOperand(i)"
            >✕</button>
          </div>

          <div v-if="pickingIndex === i" class="pl-[52px]">
            <FieldColumns
              :groups="columnGroups"
              :primary-source-id="primaryId"
              :selected="o.column ?? null"
              @pick="setColumn(i, $event)"
            />
          </div>
        </div>

        <div class="flex gap-2 pt-0.5 pl-[52px]">
          <button
            type="button"
            class="rounded-lg border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--color-primary)]"
            @click="addOperand('column')"
          >+ colonne</button>
          <button
            type="button"
            class="rounded-lg border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--color-primary)]"
            @click="addOperand('value')"
          >+ valeur</button>
        </div>
      </div>
    </StudioField>
  </div>
</template>
