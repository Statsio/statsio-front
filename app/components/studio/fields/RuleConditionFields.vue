<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RuleCondition } from '@/types/studio'

/**
 * Une condition de règle (couleur / taille conditionnelle) : colonne + opérateur +
 * valeur. La valeur est soit littérale (saisie libre), soit un agrégat — construit
 * via deux menus (fonction + colonne, ex. « Moyenne » + « prix » → `AVG(prix)`), avec
 * un lien vers une expression libre pour les cas que le sélecteur ne couvre pas
 * (ex. `AVG(prix) * 1.1`). Partagée par les sections « rules » et « sizeRules » de
 * `TableColumnsField.vue`.
 */
const props = defineProps<{
  condition: RuleCondition
  columns: string[]
  refLabel: (c: string) => string
}>()
const emit = defineEmits<{ update: [patch: Partial<RuleCondition>] }>()

const WHENS = [
  { v: 'positive', l: 'positif' }, { v: 'negative', l: 'négatif' },
  { v: 'top', l: 'max colonne' }, { v: 'bottom', l: 'min colonne' },
  { v: '=', l: 'égal à' }, { v: '!=', l: 'différent de' },
  { v: 'contains', l: 'contient' }, { v: 'not_contains', l: 'ne contient pas' },
  { v: '>', l: '> à' }, { v: '>=', l: '≥ à' },
  { v: '<', l: '< à' }, { v: '<=', l: '≤ à' },
] as const
const WHENS_NO_VALUE: RuleCondition['when'][] = ['positive', 'negative', 'top', 'bottom']
const needsValue = computed(() => !WHENS_NO_VALUE.includes(props.condition.when))

const AGG_FNS = [
  { v: 'avg', l: 'Moyenne' }, { v: 'sum', l: 'Somme' },
  { v: 'min', l: 'Min' }, { v: 'max', l: 'Max' }, { v: 'count', l: 'Nombre' },
] as const

/** `AVG(prix)`, `AVG("prix moyen")`, `AVG(prix@2)` → `{ fn: 'avg', column: 'prix' | 'prix@2' }`. */
const GUIDED_RE = /^(AVG|SUM|MIN|MAX|COUNT)\(\s*(?:"([^"]+)"|([^@()\s]+))?(?:@([A-Za-z0-9_]+))?\s*\)$/i

function parseGuided(expr: string): { fn: string; column: string } | null {
  const m = GUIDED_RE.exec(expr.trim())
  if (!m) return null
  const fn = m[1]!.toLowerCase()
  const col = m[2] ?? m[3] ?? ''
  if (fn !== 'count' && !col) return null
  // `COUNT(*)` : pas une vraie colonne — ne pas la réutiliser si on change de fonction ensuite.
  if (fn === 'count' && col === '*') return { fn, column: '' }
  return { fn, column: m[4] ? `${col}@${m[4]}` : col }
}
function buildExpr(fn: string, columnRef: string): string {
  if (fn === 'count' && !columnRef) return 'COUNT(*)'
  const [name, source] = columnRef.split('@')
  const col = /^[A-Za-z0-9_]+$/.test(name ?? '') ? name : `"${name}"`
  return `${fn.toUpperCase()}(${col}${source ? `@${source}` : ''})`
}

const guided = computed(() => (typeof props.condition.value === 'string' ? parseGuided(props.condition.value) : null))
const forcedAdvanced = ref(false)
const showAdvanced = computed(
  () => forcedAdvanced.value || (Boolean(props.condition.value) && !guided.value),
)

function setExpressionMode(isExpr: boolean) {
  if (isExpr) {
    forcedAdvanced.value = false
    emit('update', { valueIsExpression: true, value: buildExpr('avg', props.condition.column) })
  } else {
    emit('update', { valueIsExpression: false, value: '' })
  }
}
function setAggFn(fn: string) {
  emit('update', { value: buildExpr(fn, guided.value?.column || props.condition.column) })
}
function setAggColumn(col: string) {
  emit('update', { value: buildExpr(guided.value?.fn ?? 'avg', col) })
}
</script>

<template>
  <select
    class="studio-input !w-[112px] !py-2 !text-[11px]"
    :value="condition.column"
    @change="emit('update', { column: ($event.target as HTMLSelectElement).value })"
  >
    <option v-for="c in columns" :key="c" :value="c">{{ refLabel(c) }}</option>
  </select>
  <select
    class="studio-input !w-[120px] !py-2 !text-[11px]"
    :value="condition.when"
    @change="emit('update', { when: ($event.target as HTMLSelectElement).value as RuleCondition['when'] })"
  >
    <option v-for="w in WHENS" :key="w.v" :value="w.v">{{ w.l }}</option>
  </select>

  <template v-if="needsValue">
    <span class="flex shrink-0 overflow-hidden rounded-md border border-[var(--studio-line-strong)]">
      <button
        type="button"
        class="px-1.5 py-1.5 text-[10px] font-bold"
        :class="!condition.valueIsExpression ? 'bg-[var(--studio-ink)] text-white' : 'text-[var(--studio-muted)]'"
        title="Valeur fixe"
        @click="setExpressionMode(false)"
      >#</button>
      <button
        type="button"
        class="px-1.5 py-1.5 text-[10px] font-bold"
        :class="condition.valueIsExpression ? 'bg-[var(--studio-ink)] text-white' : 'text-[var(--studio-muted)]'"
        title="Agrégat (ex. moyenne de la colonne)"
        @click="setExpressionMode(true)"
      >∑</button>
    </span>

    <input
      v-if="!condition.valueIsExpression"
      type="text"
      placeholder="valeur"
      class="studio-input !w-[84px] !py-2 !text-[11px]"
      :value="condition.value ?? ''"
      @change="emit('update', { value: ($event.target as HTMLInputElement).value })"
    />

    <template v-else-if="!showAdvanced">
      <select
        class="studio-input !w-[92px] !py-2 !text-[11px]"
        :value="guided?.fn ?? 'avg'"
        @change="setAggFn(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="f in AGG_FNS" :key="f.v" :value="f.v">{{ f.l }}</option>
      </select>
      <select
        v-if="(guided?.fn ?? 'avg') !== 'count'"
        class="studio-input !w-[100px] !py-2 !text-[11px]"
        :value="guided?.column ?? condition.column"
        @change="setAggColumn(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="c in columns" :key="c" :value="c">{{ refLabel(c) }}</option>
      </select>
      <button type="button" class="text-[10px] text-[var(--studio-faint)] underline" @click="forcedAdvanced = true">avancé</button>
    </template>

    <template v-else>
      <input
        type="text"
        placeholder="AVG(prix) * 1.1"
        class="studio-input min-w-[120px] flex-1 !py-2 font-mono !text-[11px]"
        :value="condition.value ?? ''"
        @change="emit('update', { value: ($event.target as HTMLInputElement).value })"
      />
      <button v-if="guided" type="button" class="text-[10px] text-[var(--studio-faint)] underline" @click="forcedAdvanced = false">guidé</button>
    </template>
  </template>
</template>
