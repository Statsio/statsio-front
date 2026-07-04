<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBlockData, resolveAggregationParams } from '@/composables/useBlockData'
import { fetchBlockData } from '@/api/studio'
import type { StudioBlock, BlockQueryResult, BlockFilter } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

// ─── Main value ───────────────────────────────────────────────────────────────

const { data, isLoading, error } = useBlockData(() => props.block, props.readonly)

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

// ─── Comparison value ─────────────────────────────────────────────────────────

const compData    = ref<BlockQueryResult | null>(null)
const compError   = ref<string | null>(null)
const compLoading = ref(false)

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
  if (!col) { compData.value = null; return }

  compLoading.value = true
  compError.value   = null
  try {
    const filters = (props.block.comparisonFilters ?? []).filter((f: BlockFilter) => f.column && f.value)
    // Reuse the same aggregation as the main value (resolveAggregationParams), just
    // pointed at the comparison column instead of valueColumn.
    const agg = resolveAggregationParams(props.block)
    const params = agg.aggregate ? { ...agg, aggregateColumns: [col] } : {}
    compData.value = await fetchBlockData(props.block.datasetId, { columns: [col], limit: 500, filters, ...params })
  } catch {
    compError.value = 'Erreur de chargement'
    compData.value  = null
  } finally {
    compLoading.value = false
  }
}

watch(
  [() => props.block.datasetId, () => props.block.fieldMapping.comparisonColumn, () => props.block.fieldMapping.aggregate, () => props.block.comparisonFilters],
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
  const fmt  = props.block.config.comparisonFormat ?? 'percent'
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
  <div class="relative h-full flex flex-col justify-between overflow-hidden p-5 sm:p-6">
    <!-- Accent bar top (trend indicator) -->
    <div
      v-if="hasComparisonSetup && trendLabel"
      class="absolute inset-x-0 top-0 h-0.5 rounded-t"
      :class="isPositive ? 'bg-emerald-400' : 'bg-red-400'"
    />

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-full py-6">
      <span class="text-sm text-slate-400">Chargement…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center h-full py-6">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="!block.datasetId || !valueCol" class="flex flex-col items-center justify-center gap-2 h-full py-6 text-slate-400">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <template v-else>
      <!-- Label -->
      <p v-if="block.config.title" class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
        {{ block.config.title }}
      </p>

      <!-- Main value -->
      <div class="flex items-end gap-3 flex-wrap">
        <span class="mono text-4xl font-bold text-slate-900 tabular-nums leading-none sm:text-5xl">
          {{ block.config.prefix }}{{ formattedValue }}{{ block.config.suffix }}
        </span>

        <template v-if="hasComparisonSetup">
          <span v-if="compLoading" class="mb-1 text-xs text-slate-400 animate-pulse">…</span>
          <span v-else-if="compError" class="mb-1 text-xs text-red-400">!</span>
          <span
            v-else-if="trendLabel"
            class="mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold"
            :class="isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path v-if="isPositive" d="M10.293 3.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1-1.414 1.414L11 5.414V17a1 1 0 1 1-2 0V5.414L4.707 10.707a1 1 0 0 1-1.414-1.414l6-6z" />
              <path v-else d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 1.414-1.414L9 14.586V3a1 1 0 0 1 2 0v11.586l4.293-4.293a1 1 0 0 1 1.414 1.414l-6 6z" />
            </svg>
            {{ trendLabel }}
          </span>
          <span v-else class="mb-1 text-xs text-slate-400">— %</span>
        </template>
      </div>

      <!-- Bottom gradient rule -->
      <div class="mt-4 h-px bg-gradient-to-r from-slate-100 to-transparent" />
    </template>
  </div>
</template>
