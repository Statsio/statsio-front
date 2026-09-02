<script setup lang="ts">
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { columnRefLabel } from '@/lib/studio-columns'
import { useColumnDrillIn } from '@/composables/useColumnDrillIn'
import type { AggregateFunction, AggTerm, ArithOp, StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; modelValue: AggTerm[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: AggTerm[]): void }>()

const datasets = useStudioDatasetsStore()
const drillIn = useColumnDrillIn()

const FN_OPTS: { value: AggregateFunction; label: string }[] = [
  { value: 'sum', label: 'Somme' },
  { value: 'avg', label: 'Moyenne' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Nombre' },
]
const OPS: { value: ArithOp; label: string }[] = [
  { value: '+', label: '+' },
  { value: '-', label: '−' },
  { value: '*', label: '×' },
  { value: '/', label: '÷' },
]

const terms = () => (props.modelValue.length ? props.modelValue : [{ fn: 'sum' as AggregateFunction, column: '' }])

function write(next: AggTerm[]) {
  emit('update:modelValue', next)
}
function update(i: number, patch: Partial<AggTerm>) {
  write(terms().map((t, k) => (k === i ? { ...t, ...patch } : t)))
}
function addTerm() {
  write([...terms(), { op: '+', fn: 'sum', column: '' }])
}
function removeTerm(i: number) {
  write(terms().filter((_, k) => k !== i))
}
function pickColumn(i: number) {
  drillIn.open({
    block: props.block,
    title: 'Colonne de la mesure',
    selected: terms()[i]?.column ? [terms()[i]!.column] : [],
    onCommit: (refs) => update(i, { column: refs[0] ?? '' }),
  })
}
const label = (ref: string) => (ref ? columnRefLabel(ref, props.block, datasets) : '')
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-for="(t, i) in terms()" :key="i" class="flex items-center gap-1.5">
      <select
        v-if="i > 0"
        class="studio-input !w-[46px] shrink-0 !py-1.5 !text-center !text-[13px] font-bold"
        :value="t.op ?? '+'"
        @change="update(i, { op: ($event.target as HTMLSelectElement).value as ArithOp })"
      >
        <option v-for="o in OPS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <span v-else class="w-[46px] shrink-0" />

      <select
        class="studio-input !w-[92px] shrink-0 !py-1.5 !text-[12px]"
        :value="t.fn"
        @change="update(i, { fn: ($event.target as HTMLSelectElement).value as AggregateFunction })"
      >
        <option v-for="o in FN_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <button
        type="button"
        class="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[10px] border-[1.5px] border-[var(--studio-line-strong)] bg-white px-2.5 py-2 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)]"
        @click="pickColumn(i)"
      >
        <span
          class="min-w-0 flex-1 truncate font-mono text-[11.5px]"
          :class="t.column ? 'font-semibold text-[var(--studio-ink)]' : 'text-[var(--studio-faint)]'"
        >{{ label(t.column) || 'colonne' }}</span>
        <svg class="h-3.5 w-3.5 shrink-0 text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <button
        v-if="terms().length > 1"
        type="button"
        class="shrink-0 text-[13px] leading-none text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
        aria-label="Retirer la mesure"
        @click="removeTerm(i)"
      >✕</button>
    </div>

    <button
      type="button"
      class="self-start rounded-lg border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--color-primary)]"
      @click="addTerm"
    >+ combiner un agrégat</button>
  </div>
</template>
