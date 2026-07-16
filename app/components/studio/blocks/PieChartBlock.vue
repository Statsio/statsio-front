<script setup lang="ts">
import { computed } from 'vue'
import { PALETTE } from '@/composables/useChart'
import { useBlockData } from '@/composables/useBlockData'
import { formatDisplayValue } from '@/utils/statsDataFormat'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const { data, isLoading, error } = useBlockData(() => props.block, props.readonly)

interface Segment {
  label: string
  percent: number
  color: string
}

const segments = computed<Segment[]>(() => {
  const rows = data.value?.rows ?? []
  const labelKey = props.block.fieldMapping.label ?? ''
  const valueKey = props.block.fieldMapping.value ?? ''
  const limit = props.block.config.rowLimit ?? 12
  const colors = props.block.config.colors?.length ? props.block.config.colors : PALETTE

  const sliced = rows.slice(0, limit) as Record<string, unknown>[]
  const values = sliced.map((r) => Number(r[valueKey] ?? 0))
  const total = values.reduce((sum, v) => sum + v, 0)

  return sliced.map((r, i) => {
    const value = values[i] ?? 0
    return {
      label: formatDisplayValue(r[labelKey], ''),
      percent: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
      color: colors[i % colors.length] ?? '#94a3b8',
    }
  })
})

// Cumulative conic-gradient stops built from each segment's share of the total.
const conicGradient = computed(() => {
  if (segments.value.length === 0) return 'none'
  let cursor = 0
  const stops = segments.value.map((s) => {
    const start = cursor
    cursor += s.percent
    return `${s.color} ${start}% ${cursor}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})
</script>

<template>
  <div class="relative w-full overflow-hidden p-5">
    <div v-if="isLoading" class="flex items-center justify-center py-10">
      <span class="text-sm text-slate-400">Chargement…</span>
    </div>

    <div v-else-if="error" class="flex items-center justify-center py-10">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!block.datasetId || !block.fieldMapping.label || !block.fieldMapping.value" class="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <div v-else class="flex items-center gap-8">
      <div class="h-[150px] w-[150px] shrink-0 rounded-full" :style="{ background: conicGradient }" />
      <div class="flex min-w-0 flex-1 flex-col gap-2.5 text-sm">
        <div v-for="s in segments" :key="s.label" class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ backgroundColor: s.color }" />
          <span class="min-w-0 flex-1 truncate text-[#18181f]/80">{{ s.label }}</span>
          <span class="mono shrink-0 text-[#18181f]/50">{{ s.percent }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
