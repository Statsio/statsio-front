<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBlockData, resolveAggregationParams } from '@/composables/useBlockData'
import { fetchBlockData } from '@/api/studio'
import { interpolateTokens } from '@/lib/studio-tokens'
import { useResolvedTokens } from '@/composables/useResolvedTokens'
import { useStudioStore } from '@/stores/studio'
import { formatDisplayValue, parseNumericValue } from '@/utils/statsDataFormat'
import type { StudioBlock, BlockQueryResult, BlockFilter } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()

// ─── Main value ───────────────────────────────────────────────────────────────

const { data, isLoading, error } = useBlockData(() => props.block, props.readonly, () => props.scope)

const valueCol = computed(() => props.block.fieldMapping.valueColumn ?? props.block.fieldMapping.value)
const expr = computed(() => props.block.config.valueExpression?.trim() || '')

// Valeur par expression calculée (ex. `AVG(prix@7) * 50`) — prioritaire sur la colonne.
const { text: exprValue, pending: exprPending } = useResolvedTokens({
  raw: () => (expr.value ? `{{ ${expr.value} }}` : ''),
  tokenMap: () => ({ ...studio.pageParams, ...props.scope }),
  datasetId: () => props.block.datasetId,
  readonly: () => props.readonly ?? false,
  docSlug: () => studio.content?.slug,
})

const rawValue = computed(() => {
  const col = valueCol.value
  if (!col || !data.value?.rows?.length) return null
  return data.value.rows[0]?.[col] ?? null
})

const formattedValue = computed(() => {
  if (expr.value) return exprPending.value ? '…' : (exprValue.value || '—')
  const v = rawValue.value
  if (v === null || v === undefined) return '—'
  const num = Number(v)
  if (isNaN(num)) return formatDisplayValue(v)
  const fmt = props.block.config.format ?? 'number'
  if (fmt === 'percent') return `${num.toFixed(1)} %`
  if (fmt === 'currency') return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num)
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(num)
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
    const resolve = (list: BlockFilter[]) => list
      .filter((f) => f.column && f.value)
      .map((f) => ({ ...f, value: interpolateTokens(f.value, { ...studio.pageParams, ...props.scope }) }))
    // `comparisonFilters` → autres lignes, même métrique (ex. l'an dernier).
    // Sinon `comparisonColumn` → mêmes lignes (donc mêmes filtres que la valeur
    // principale), colonne différente.
    const filters = (props.block.comparisonFilters?.length ?? 0) > 0
      ? resolve(props.block.comparisonFilters ?? [])
      : resolve(props.block.filters ?? [])
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
  [
    () => props.block.datasetId,
    () => props.block.fieldMapping.comparisonColumn,
    () => props.block.fieldMapping.aggregate,
    () => JSON.stringify(props.block.comparisonFilters ?? []),
    () => JSON.stringify(props.block.filters ?? []),
    () => JSON.stringify(studio.pageParams),
    () => props.scope,
  ],
  loadComparison,
  { immediate: true, deep: true },
)

const previousValue = computed(() => {
  if (!hasComparisonSetup.value) return null
  const col = compCol.value
  if (!col) return null
  // `compData` porte la valeur de comparaison (colonne dédiée OU même métrique filtrée
  // différemment) — agrégée par `loadComparison`. On retombe sur `data` seulement s'il
  // n'a pas encore répondu.
  const src = compData.value ?? data.value
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

// {{item}} & co. dans les libellés quand le bloc est dans une boucle
const tk = (s?: string) => interpolateTokens(s ?? '', props.scope)
const resolvedTitle = computed(() => tk(props.block.config.title))
const resolvedDescription = computed(() => tk(props.block.config.description))
</script>

<template>
  <div class="border-l-2 border-[var(--studio-line)] pl-4">
    <!-- Loading -->
    <div v-if="isLoading" class="py-3">
      <span class="text-sm text-[var(--studio-faint)]">Chargement…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-3">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="!expr && (!block.datasetId || !valueCol)" class="py-3 text-xs text-[var(--studio-faint)]">
      Configurer les données →
    </div>

    <template v-else>
      <p v-if="resolvedTitle" class="min-h-[30px] text-[11px] font-bold leading-[1.35] text-[var(--studio-muted)]">
        {{ resolvedTitle }}
      </p>
      <div class="mono mt-1.5 text-[27px] font-semibold leading-none tracking-[-0.02em] text-[var(--studio-ink)] tabular-nums">
        {{ block.config.prefix }}{{ formattedValue }}{{ block.config.suffix }}
      </div>

      <div
        v-if="hasComparisonSetup && trendLabel"
        class="mt-[7px] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] font-bold"
        :class="isPositive ? 'text-emerald-600' : 'text-red-500'"
      >
        <span>{{ isPositive ? '↑' : '↓' }} {{ trendLabel }}</span>
        <span v-if="resolvedDescription" class="font-medium text-[var(--studio-muted)]">· {{ resolvedDescription }}</span>
      </div>
      <div v-else-if="hasComparisonSetup && compLoading" class="mt-[7px] animate-pulse text-[11.5px] text-[var(--studio-faint)]">…</div>
      <div v-else-if="hasComparisonSetup && compError" class="mt-[7px] text-[11.5px] text-red-400">Comparaison indisponible</div>
      <div v-else-if="resolvedDescription" class="mt-[7px] text-[11.5px] text-[var(--studio-muted)]">{{ resolvedDescription }}</div>
    </template>
  </div>
</template>
