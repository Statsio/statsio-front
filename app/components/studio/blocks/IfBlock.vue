<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { interpolateTokens } from '@/lib/studio-tokens'
import { scriptZoneId } from '@/types/studio'
import type { StudioBlock, FilterOperator } from '@/types/studio'
import { FILTER_OPERATORS } from '@/types/studio'
import BlockRenderer from './BlockRenderer.vue'
import BlockCard from './BlockCard.vue'
import CanvasZone from '@/components/studio/canvas/CanvasZone.vue'

/**
 * Bloc « Condition » : n'affiche les blocs qu'il contient que si un paramètre de
 * page remplit une condition. Pendant du bloc `loop` dans la catégorie « Script ».
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()

const zoneId = computed(() => scriptZoneId(props.block.id))
const children = computed<StudioBlock[]>(() => studio.blocksByZone[zoneId.value] ?? [])

const paramName = computed(() => props.block.config.ifParam ?? '')
const operator = computed<FilterOperator>(() => props.block.config.ifOperator ?? '=')
const rawValue = computed(() => props.block.config.ifValue ?? '')

const tokenMap = computed(() => ({ ...studio.pageParams, ...props.scope }))
const leftValue = computed(() => (paramName.value ? tokenMap.value[paramName.value] ?? '' : ''))
const rightValue = computed(() => interpolateTokens(rawValue.value, tokenMap.value))

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

const isConfigured = computed(() => Boolean(paramName.value))
const passes = computed(() => isConfigured.value && compare(String(leftValue.value), operator.value, String(rightValue.value)))

const opLabel = computed(() => FILTER_OPERATORS.find((o) => o.value === operator.value)?.short ?? operator.value)
const summary = computed(() => {
  if (!isConfigured.value) return 'Choisir un paramètre et une condition'
  return `si {{${paramName.value}}} ${opLabel.value} ${rawValue.value || '∅'}`
})
</script>

<template>
  <!-- ══════════ ÉDITEUR ══════════ -->
  <div v-if="!readonly" class="flex flex-col gap-3">
    <div class="flex items-center gap-2 rounded-xl bg-[var(--studio-wash)] px-3 py-2">
      <svg class="h-4 w-4 shrink-0 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
      <span class="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--studio-muted)]">
        Condition · <span class="font-mono">{{ summary }}</span>
        <span v-if="isConfigured" class="ml-1 font-semibold" :class="passes ? 'text-emerald-600' : 'text-[var(--studio-faint)]'">
          — {{ passes ? 'vraie' : 'fausse' }} actuellement
        </span>
      </span>
    </div>

    <div class="rounded-2xl bg-[var(--studio-wash)]/40 p-1" @click.stop>
      <CanvasZone :zone-id="zoneId" :col-index="0" nested />
    </div>
  </div>

  <!-- ══════════ LECTURE SEULE ══════════ -->
  <template v-else>
    <div v-if="passes && children.length" class="flex flex-col gap-3 sm:gap-4">
      <BlockCard v-for="child in children" :key="child.id" :block="child" :scope="scope">
        <BlockRenderer :block="child" :readonly="true" :scope="scope" />
      </BlockCard>
    </div>
  </template>
</template>
