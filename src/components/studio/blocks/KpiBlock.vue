<script setup lang="ts">
import { computed } from 'vue'
import { useBlockData } from '@/composables/useBlockData'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock }>()

const { data, isLoading, error } = useBlockData(() => props.block)

const rawValue = computed(() => {
  const col = props.block.fieldMapping.valueColumn ?? props.block.fieldMapping.value
  if (!col || !data.value?.rows?.length) return null
  return data.value.rows[0]?.[col] ?? null
})

const formattedValue = computed(() => {
  const v = rawValue.value
  if (v === null || v === undefined) return '—'
  const num = Number(v)
  if (isNaN(num)) return String(v)

  const fmt = props.block.config.format ?? 'number'
  if (fmt === 'percent') return `${num.toFixed(1)}%`
  if (fmt === 'currency') return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num)
  return new Intl.NumberFormat('fr-FR').format(num)
})

const previousValue = computed(() => {
  const col = props.block.fieldMapping.comparisonColumn
  if (!col || !data.value?.rows?.length) return null
  return data.value.rows[0]?.[col] ?? null
})

const trend = computed(() => {
  if (rawValue.value === null || previousValue.value === null) return null
  const curr = Number(rawValue.value)
  const prev = Number(previousValue.value)
  if (isNaN(curr) || isNaN(prev) || prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
})
</script>

<template>
  <div class="h-full flex flex-col justify-center p-4">
    <div v-if="isLoading" class="flex items-center justify-center">
      <span class="text-sm text-slate-400">Chargement…</span>
    </div>

    <div v-else-if="error" class="flex items-center justify-center">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!block.datasetId || !block.fieldMapping.valueColumn" class="flex flex-col items-center justify-center gap-2 text-slate-400 h-full">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <template v-else>
      <p v-if="block.config.title" class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
        {{ block.config.title }}
      </p>

      <div class="flex items-end gap-3">
        <span class="text-4xl font-bold text-slate-900 tabular-nums leading-none">
          {{ block.config.prefix }}{{ formattedValue }}{{ block.config.suffix }}
        </span>

        <span
          v-if="trend !== null"
          :class="[
            'mb-1 text-sm font-semibold',
            trend >= 0 ? 'text-emerald-600' : 'text-red-500',
          ]"
        >
          {{ trend >= 0 ? '▲' : '▼' }} {{ Math.abs(trend).toFixed(1) }}%
        </span>
      </div>
    </template>
  </div>
</template>
