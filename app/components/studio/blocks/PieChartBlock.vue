<script setup lang="ts">
import { computed } from 'vue'
import { PALETTE } from '@/composables/useChart'
import { useBlockData, rowKey, resolveBlockFilters } from '@/composables/useBlockData'
import { useResolvedTokenList } from '@/composables/useResolvedTokens'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { columnRefLabel } from '@/lib/studio-columns'
import { markColor } from '@/lib/studio-chart'
import { formatDisplayValue, parseNumericValue } from '@/utils/statsDataFormat'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const { data, isLoading, error } = useBlockData(() => props.block, props.readonly, () => props.scope)

const segmentDefs = computed(() => props.block.fieldMapping.pieSegments ?? [])
const isSegments = computed(() => props.block.config.pieMode === 'segments')

const quoteCol = (c: string) => `"${c.replace(/"/g, '')}"`

/** Expression d'agrégat de chaque part (le `remainder` = total − somme des autres). */
const segmentExprs = computed<string[]>(() => {
  const segs = segmentDefs.value
  const normal = (s: { fn: string; column: string }) => `${s.fn.toUpperCase()}(${quoteCol(s.column)})`
  const othersSum = segs
    .filter((s) => s.fn !== 'remainder' && s.column)
    .map(normal)
    .join(' + ') || '0'
  return segs.map((s) => {
    if (!s.column) return '0'
    return s.fn === 'remainder' ? `SUM(${quoteCol(s.column)}) - (${othersSum})` : normal(s)
  })
})

// ─── Mode « segments calculés » : une part par expression d'agrégat ──────────
const { list: resolvedSegments, pending: segPending } = useResolvedTokenList({
  items: () => segmentExprs.value.map((e) => `{{ ${e} }}`),
  tokenMap: () => ({ ...studio.pageParams, ...props.scope }),
  block: () => props.block,
  datasetId: () => props.block.datasetId,
  readonly: () => props.readonly ?? false,
  docSlug: () => studio.content?.slug,
  extraFilters: () => resolveBlockFilters(props.block.filters ?? [], { ...studio.pageParams, ...props.scope }),
})

interface Segment {
  label: string
  percent: number
  color: string
}

const segments = computed<Segment[]>(() => {
  const colors = props.block.config.colors?.length ? props.block.config.colors : PALETTE
  const rules = props.block.config.markRules

  const raw = isSegments.value
    ? segmentDefs.value.map((s, i) => ({
        label: s.label
          || (s.fn === 'remainder' ? 'Reste' : (s.column ? columnRefLabel(s.column, props.block, datasets) : ''))
          || `Part ${i + 1}`,
        value: Math.max(0, parseNumericValue(resolvedSegments.value[i] ?? '0')),
      }))
    : (() => {
        const rows = (data.value?.rows ?? []) as Record<string, unknown>[]
        const labelKey = rowKey(data.value, props.block.fieldMapping.label ?? '')
        const valueKey = rowKey(data.value, props.block.fieldMapping.value ?? '')
        const limit = props.block.config.rowLimit ?? 12
        return rows.slice(0, limit).map((r) => ({
          label: formatDisplayValue(r[labelKey], ''),
          value: parseNumericValue(r[valueKey]),
        }))
      })()

  const total = raw.reduce((sum, s) => sum + s.value, 0)
  const values = raw.map((s) => s.value)
  const bounds = { min: Math.min(...values, 0), max: Math.max(...values, 0), ref: null }

  return raw.map((s, i) => {
    const fallback = colors[i % colors.length] ?? '#94a3b8'
    return {
      label: s.label,
      percent: total > 0 ? Math.round((s.value / total) * 1000) / 10 : 0,
      color: rules?.length ? markColor(rules, s.value, bounds, fallback) : fallback,
    }
  })
})

const loading = computed(() => (isSegments.value ? segPending.value : isLoading.value))
const configured = computed(() =>
  Boolean(props.block.datasetId)
  && (isSegments.value
    ? segmentDefs.value.some((s) => s.column)
    : Boolean(props.block.fieldMapping.label && props.block.fieldMapping.value)),
)

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
  <div class="relative w-full overflow-hidden">
    <div v-if="loading" class="flex items-center justify-center py-10">
      <span class="text-sm text-[var(--studio-faint)]">Chargement…</span>
    </div>

    <div v-else-if="error && !isSegments" class="flex items-center justify-center py-10">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!configured" class="flex flex-col items-center justify-center gap-2 py-10 text-[var(--studio-faint)]">
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
          <span class="min-w-0 flex-1 truncate text-[color:color-mix(in_srgb,var(--studio-ink)_80%,transparent)]">{{ s.label }}</span>
          <span class="mono shrink-0 text-[var(--studio-faint)]">{{ s.percent }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
