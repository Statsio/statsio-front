<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBlockData } from '@/composables/useBlockData'
import { fetchBlockData } from '@/api/studio'
import type { StudioBlock, BlockQueryResult, BlockFilter } from '@/types/studio'

const props = defineProps<{ block: StudioBlock }>()

// ─── Main value ───────────────────────────────────────────────────────────────

const { data, isLoading, error } = useBlockData(() => props.block)

const valueCol = computed(() => props.block.fieldMapping.valueColumn ?? props.block.fieldMapping.value)

const rawValue = computed(() => {
  const col = valueCol.value
  if (!col || !data.value?.rows?.length) return null
  return data.value.rows[0]?.[col] ?? null
})

const formattedValue = computed(() => {
  const v = rawValue.value
  if (v === null || v === undefined) return '—'
  const num = Number(v)
  if (isNaN(num)) return String(v)
  const fmt = props.block.config.format ?? 'number'
  if (fmt === 'percent') return `${num.toFixed(1)} %`
  if (fmt === 'currency') return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num)
  return new Intl.NumberFormat('fr-FR').format(num)
})

// ─── Comparison value (separate query with its own filters) ───────────────────

const compData  = ref<BlockQueryResult | null>(null)
const compError = ref<string | null>(null)
const compLoading = ref(false)

// || instead of ?? so that empty string ("same as main") falls back to valueCol
const compCol = computed(() => props.block.fieldMapping.comparisonColumn || valueCol.value)

const hasComparisonSetup = computed(() =>
  !!(props.block.fieldMapping.comparisonColumn) ||
  (props.block.comparisonFilters?.length ?? 0) > 0,
)

async function loadComparison() {
  if (!props.block.datasetId || !hasComparisonSetup.value) {
    compData.value  = null
    compError.value = null
    return
  }
  const col = compCol.value
  if (!col) {
    compData.value = null
    return
  }

  compLoading.value = true
  compError.value   = null
  try {
    const filters = (props.block.comparisonFilters ?? []).filter((f: BlockFilter) => f.column && f.value)
    compData.value = await fetchBlockData(props.block.datasetId, {
      columns: [col],
      limit: 500,
      filters,
    })
  } catch (e) {
    console.error('[KPI comparison] fetch error:', e)
    compError.value = 'Erreur de chargement de la comparaison'
    compData.value  = null
  } finally {
    compLoading.value = false
  }
}

// Use deep watch + array form so Vue reliably tracks nested comparisonFilters mutations
watch(
  [
    () => props.block.datasetId,
    () => props.block.fieldMapping.comparisonColumn,
    () => props.block.comparisonFilters,
  ],
  loadComparison,
  { immediate: true, deep: true },
)

const previousValue = computed(() => {
  if (!hasComparisonSetup.value) return null
  const col = compCol.value
  if (!col) return null
  const src = (props.block.comparisonFilters?.length ?? 0) > 0 ? compData.value : data.value
  if (!src?.rows?.length) return null
  return src.rows[0]?.[col] ?? null
})

// ─── Delta ────────────────────────────────────────────────────────────────────

const delta = computed(() => {
  const curr = rawValue.value !== null ? Number(rawValue.value) : NaN
  const prev = previousValue.value !== null ? Number(previousValue.value) : NaN
  if (isNaN(curr) || isNaN(prev)) return null
  return { curr, prev, diff: curr - prev }
})

const trendLabel = computed(() => {
  const d = delta.value
  if (!d) return null
  const fmt = props.block.config.comparisonFormat ?? 'percent'
  const sign = d.diff >= 0 ? '+' : ''

  if (fmt === 'percent') {
    if (d.prev === 0) return `${sign}${d.diff > 0 ? '∞' : '0'} %`
    const pct = (d.diff / Math.abs(d.prev)) * 100
    return `${sign}${pct.toFixed(1)} %`
  }
  if (fmt === 'currency') {
    return (d.diff >= 0 ? '+' : '') +
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(d.diff)
  }
  return sign + new Intl.NumberFormat('fr-FR').format(d.diff)
})

const isPositive = computed(() => (delta.value?.diff ?? 0) >= 0)
</script>

<template>
  <div class="h-full flex flex-col justify-center p-4">
    <div v-if="isLoading" class="flex items-center justify-center">
      <span class="text-sm text-slate-400">Chargement…</span>
    </div>

    <div v-else-if="error" class="flex items-center justify-center">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!block.datasetId || !valueCol" class="flex flex-col items-center justify-center gap-2 text-slate-400 h-full">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <template v-else>
      <p v-if="block.config.title" class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
        {{ block.config.title }}
      </p>

      <div class="flex items-end gap-3 flex-wrap">
        <span class="text-4xl font-bold text-slate-900 tabular-nums leading-none">
          {{ block.config.prefix }}{{ formattedValue }}{{ block.config.suffix }}
        </span>

        <template v-if="hasComparisonSetup">
          <span v-if="compLoading" class="mb-1 text-xs text-slate-400">…</span>
          <span v-else-if="compError" class="mb-1 text-xs text-red-400">!</span>
          <span
            v-else-if="trendLabel"
            class="mb-1 text-sm font-semibold flex items-center gap-1"
            :class="isPositive ? 'text-emerald-600' : 'text-red-500'"
          >
            <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path v-if="isPositive" d="M10.293 3.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1-1.414 1.414L11 5.414V17a1 1 0 1 1-2 0V5.414L4.707 10.707a1 1 0 0 1-1.414-1.414l6-6z" />
              <path v-else d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 1.414-1.414L9 14.586V3a1 1 0 0 1 2 0v11.586l4.293-4.293a1 1 0 0 1 1.414 1.414l-6 6z" />
            </svg>
            {{ trendLabel }}
          </span>
          <span v-else class="mb-1 text-xs text-slate-400">— %</span>
        </template>
      </div>
    </template>
  </div>
</template>
