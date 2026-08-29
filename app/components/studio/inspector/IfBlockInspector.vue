<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { FILTER_OPERATORS } from '@/types/studio'
import type { FilterOperator, StudioBlock } from '@/types/studio'
import FieldNote from '@/components/studio/fields/FieldNote.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

function updateConfig(key: string, value: unknown) {
  studio.updateBlockConfig(props.block.id, { [key]: value })
}

const ifParam = computed(() => props.block.config.ifParam ?? '')
const ifOperator = computed<FilterOperator>(() => props.block.config.ifOperator ?? '=')
const ifValue = computed(() => props.block.config.ifValue ?? '')

/** Paramètres proposés : ceux déclarés sur la page + les clés déjà présentes dans pageParams. */
const paramNames = computed(() => {
  const names = new Set<string>(studio.currentPageParamDefs.map((p) => p.name))
  Object.keys(studio.pageParams).forEach((k) => names.add(k))
  if (ifParam.value) names.add(ifParam.value)
  return [...names].filter(Boolean).sort()
})

const currentValue = computed(() => (ifParam.value ? studio.pageParams[ifParam.value] ?? '' : ''))

function compare(left: string, op: FilterOperator, right: string): boolean {
  const ln = Number(left)
  const rn = Number(right)
  const numeric = left !== '' && right !== '' && !Number.isNaN(ln) && !Number.isNaN(rn)
  switch (op) {
    case '=': return left === right
    case '!=': return left !== right
    case '>': return numeric ? ln > rn : left > right
    case '>=': return numeric ? ln >= rn : left >= right
    case '<': return numeric ? ln < rn : left < right
    case '<=': return numeric ? ln <= rn : left <= right
    case 'contains': return left.toLowerCase().includes(right.toLowerCase())
    case 'not_contains': return !left.toLowerCase().includes(right.toLowerCase())
    default: return false
  }
}
const passes = computed(() => Boolean(ifParam.value) && compare(String(currentValue.value), ifOperator.value, ifValue.value))
</script>

<template>
  <div class="flex flex-col gap-[13px] px-4 pb-2 pt-3">
    <FieldNote v-if="!paramNames.length">
      Ajoutez d'abord un bloc <b>Paramètre</b> sur la page (ou une barre de recherche), puis revenez
      définir la condition.
    </FieldNote>

    <div class="flex flex-col gap-1.5">
      <label class="text-xs font-semibold text-[var(--studio-muted)]">Paramètre</label>
      <select class="cfg-input" :value="ifParam" @change="updateConfig('ifParam', ($event.target as HTMLSelectElement).value)">
        <option value="">Choisir un paramètre…</option>
        <option v-for="n in paramNames" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>

    <template v-if="ifParam">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Opérateur</label>
        <select class="cfg-input" :value="ifOperator" @change="updateConfig('ifOperator', ($event.target as HTMLSelectElement).value)">
          <option v-for="op in FILTER_OPERATORS" :key="op.value" :value="op.value">{{ op.label }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Valeur</label>
        <input
          type="text"
          class="cfg-input"
          :value="ifValue"
          placeholder="ex. gazole — ou {{ '{' + '{autre_param}' + '}' }}"
          @input="updateConfig('ifValue', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div
        class="rounded-xl px-3 py-2.5 text-[12px] font-semibold"
        :class="passes ? 'bg-emerald-50 text-emerald-700' : 'bg-[var(--studio-note)] text-[var(--studio-muted)]'"
      >
        Actuellement : <span class="font-mono">{{ ifParam }} = «&nbsp;{{ currentValue || '∅' }}&nbsp;»</span>
        → condition <b>{{ passes ? 'vraie' : 'fausse' }}</b> · les blocs {{ passes ? 's\'affichent' : 'sont masqués' }} sur la page publiée.
      </div>

      <FieldNote>En mode édition, les blocs restent visibles pour que vous puissiez les configurer.</FieldNote>
    </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.cfg-input {
  @apply w-full;
  box-sizing: border-box;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid var(--studio-line-strong);
  font-size: 13px;
  color: var(--studio-ink);
  background: #fff;
}
.cfg-input:focus { outline: none; border-color: var(--color-primary); }
</style>
