<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBlockData, resolveAggregationParams } from '@/composables/useBlockData'
import { fetchBlockData } from '@/api/studio'
import { formatDisplayValue, parseNumericValue } from '@/utils/statsDataFormat'
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
  if (isNaN(num)) return formatDisplayValue(v)
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
  const curr = rawValue.value !== null ? parseNumericValue(rawValue.value) : NaN
  const prev = previousValue.value !== null ? parseNumericValue(previousValue.value) : NaN
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
  <div class="relative flex flex-col justify-between gap-3 overflow-hidden">
    <!-- Accent bar top (trend indicator) -->
    <div
      v-if="hasComparisonSetup && trendLabel"
      class="absolute inset-x-0 top-0 h-0.5 rounded-t"
      :class="isPositive ? 'bg-emerald-400' : 'bg-red-400'"
    />

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-full py-6">
      <span class="text-sm text-[var(--studio-faint)]">Chargement…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center h-full py-6">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="!block.datasetId || !valueCol" class="flex flex-col items-center justify-center gap-2 h-full py-6 text-[var(--studio-faint)]">
      <svg class="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <template v-else>
      <div class="flex flex-wrap items-end gap-5">
        <div>
          <p v-if="block.config.title" class="mb-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[var(--studio-faint)]">
            {{ block.config.title }}
          </p>
          <span class="block font-mono text-[40px] font-semibold leading-none text-[var(--studio-ink)] tabular-nums">
            {{ block.config.prefix }}{{ formattedValue }}{{ block.config.suffix }}
          </span>
        </div>

        <template v-if="hasComparisonSetup">
          <span v-if="compLoading" class="pb-1 text-xs text-[var(--studio-faint)] animate-pulse">…</span>
          <span v-else-if="compError" class="pb-1 text-xs text-red-400">!</span>
          <div v-else-if="trendLabel" class="flex flex-col gap-1 pb-1">
            <span class="text-[15px] font-extrabold" :class="isPositive ? 'text-emerald-600' : 'text-red-500'">
              {{ isPositive ? '↑' : '↓' }} {{ trendLabel }}
            </span>
            <span v-if="block.config.description" class="text-xs text-[var(--studio-muted)]">{{ block.config.description }}</span>
          </div>
          <span v-else class="pb-1 text-xs text-[var(--studio-faint)]">— %</span>
        </template>
      </div>
    </template>
  </div>
</template>
