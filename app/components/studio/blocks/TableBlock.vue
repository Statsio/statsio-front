<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBlockData, rowKey } from '@/composables/useBlockData'
import { useAggregateValues } from '@/composables/useResolvedTokens'
import { useStudioStore } from '@/stores/studio'
import { formatDisplayValue } from '@/utils/statsDataFormat'
import { parseExpression, evaluate, formatNumber, type AggregateRef } from '@/lib/studio-expression'
import { rowsToCsv, downloadCsv, csvFileName } from '@/lib/csv'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { columnRefLabel } from '@/lib/studio-columns'
import type { StudioBlock, TableCellRule, TableColumnFormat } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const showPagination = computed(() => props.block.config.showPagination === true)
const pageSize = computed(() => Math.max(1, props.block.config.pageSize ?? 10))
const page = ref(0)

// ─── Tri interactif (clic sur un en-tête) + pagination serveur ────────────────

const sort = ref<{ col: string; dir: 'asc' | 'desc' } | null>(null)

const overrides = () => ({
  sortColumn: sort.value?.col ?? null,
  sortDirection: sort.value?.dir ?? null,
  offset: showPagination.value ? page.value * pageSize.value : 0,
  limit: showPagination.value ? pageSize.value : (props.block.config.rowLimit ?? 500),
})

const { data, isLoading, error } = useBlockData(() => props.block, props.readonly, () => props.scope, overrides)

function toggleSort(col: string) {
  if (!props.block.config.sortable) return
  if (sort.value?.col !== col) sort.value = { col, dir: 'asc' }
  else if (sort.value.dir === 'asc') sort.value = { col, dir: 'desc' }
  else sort.value = null
  page.value = 0
}

watch([() => props.block.datasetId, () => JSON.stringify(props.block.filters), () => JSON.stringify(studio.pageParams)], () => {
  page.value = 0
})

// ─── Colonnes calculées ──────────────────────────────────────────────────────

const computedDefs = computed(() =>
  (props.block.fieldMapping.computedColumns ?? [])
    .filter((c) => c.name && c.expression)
    .map((c) => ({ name: c.name, parsed: parseExpression(c.expression, (n) => studio.pageParams[n]) })),
)

const aggRefs = computed<AggregateRef[]>(() => {
  const map = new Map<string, AggregateRef>()
  for (const d of computedDefs.value) for (const r of d.parsed?.aggregates ?? []) map.set(r.key, r)
  return [...map.values()]
})

const { values: aggValues } = useAggregateValues({
  refs: () => aggRefs.value,
  block: () => props.block,
  datasetId: () => props.block.datasetId,
  readonly: () => props.readonly ?? false,
  docSlug: () => studio.content?.slug,
})

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.').replace(/\s/g, ''))
  return Number.isFinite(n) ? n : null
}

const rows = computed<Record<string, unknown>[]>(() => {
  const base = data.value?.rows ?? []
  if (!computedDefs.value.length) return base
  const colMapRefs = data.value?.columnMap ?? {}
  return base.map((row) => {
    const colMap = new Map<string, number | null>()
    for (const k of Object.keys(row)) colMap.set(k, num(row[k]))
    // Rend `{colonne@source}` utilisable dans les expressions de colonnes calculées.
    for (const [ref, key] of Object.entries(colMapRefs)) {
      if (!colMap.has(ref) && key in row) colMap.set(ref, num(row[key]))
    }
    const out: Record<string, unknown> = { ...row }
    for (const d of computedDefs.value) {
      out[d.name] = d.parsed ? evaluate(d.parsed.node, aggValues.value, colMap) : null
    }
    return out
  })
})

// ─── Colonnes visibles ───────────────────────────────────────────────────────

const visibleColumns = computed(() => {
  const explicit = props.block.fieldMapping.columns
  const base = explicit?.length ? [...explicit] : (data.value?.columns ?? [])
  for (const d of computedDefs.value) if (!base.includes(d.name)) base.push(d.name)
  return base
})

function columnLabel(col: string) {
  return props.block.fieldMapping.columnLabels?.[col] ?? columnRefLabel(col, props.block, datasets)
}
function columnFormat(col: string): TableColumnFormat {
  return props.block.fieldMapping.columnFormats?.[col] ?? {}
}
/** Valeur de cellule pour une ref de colonne (nue, `col@<sourceId>`, ou colonne calculée). */
function cellVal(row: Record<string, unknown>, col: string): unknown {
  const k = rowKey(data.value, col)
  return k in row ? row[k] : row[col]
}

// ─── Rendu de cellule ────────────────────────────────────────────────────────

function formatCell(col: string, value: unknown): string {
  const fmt = columnFormat(col).format
  if (value === null || value === undefined || value === '') return '—'
  const n = num(value)
  if (fmt === 'percent' && n !== null) return `${formatNumber(n, 1)} %`
  if (fmt === 'currency' && n !== null) return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
  if (fmt === 'number' && n !== null) return formatNumber(n)
  if (fmt === 'mono' || fmt === 'text') return String(value)
  return formatDisplayValue(value)
}

/** Bornes des colonnes visibles pour les règles top/bottom (sur la page courante). */
const colBounds = computed<Record<string, { min: number; max: number }>>(() => {
  const out: Record<string, { min: number; max: number }> = {}
  for (const rule of props.block.fieldMapping.cellRules ?? []) {
    if (rule.when !== 'top' && rule.when !== 'bottom') continue
    const vals = rows.value.map((r) => num(cellVal(r, rule.column))).filter((v): v is number => v !== null)
    if (vals.length) out[rule.column] = { min: Math.min(...vals), max: Math.max(...vals) }
  }
  return out
})

function matchesRule(rule: TableCellRule, n: number): boolean {
  switch (rule.when) {
    case 'positive': return n > 0
    case 'negative': return n < 0
    case 'gt': return rule.value !== undefined && n > rule.value
    case 'lt': return rule.value !== undefined && n < rule.value
    case 'top': return colBounds.value[rule.column]?.max === n
    case 'bottom': return colBounds.value[rule.column]?.min === n
    default: return false
  }
}

function cellStyle(col: string, value: unknown): Record<string, string> {
  const n = num(value)
  const style: Record<string, string> = { textAlign: columnFormat(col).align ?? (n !== null ? 'right' : 'left') }
  if (n === null) return style
  for (const rule of props.block.fieldMapping.cellRules ?? []) {
    if (rule.column === col && matchesRule(rule, n)) {
      style.color = rule.color
      if (rule.bold) style.fontWeight = '700'
    }
  }
  return style
}

function isMono(col: string) {
  const f = columnFormat(col).format
  return f === 'mono' || f === 'currency' || f === 'percent' || f === 'number' || typeof (rows.value[0] ? cellVal(rows.value[0], col) : undefined) === 'number'
}

const totalRows = computed(() => data.value?.totalRows ?? rows.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / pageSize.value)))
const pageInfo = computed(() => `Page ${page.value + 1} / ${totalPages.value} · ${totalRows.value} ligne${totalRows.value > 1 ? 's' : ''}`)

// ─── Export CSV (lignes chargées) ────────────────────────────────────────────

const canExport = computed(() => props.readonly && rows.value.length > 0)

function exportCsv() {
  const cols = visibleColumns.value
  const labelled = rows.value.map((row) => {
    const out: Record<string, unknown> = {}
    for (const col of cols) out[columnLabel(col)] = cellVal(row, col)
    return out
  })
  const csv = rowsToCsv(cols.map(columnLabel), labelled)
  downloadCsv(csvFileName(props.block.config.title || studio.content?.title || 'statsio-tableau'), csv)
}
</script>

<template>
  <div class="w-full">
    <div v-if="isLoading" class="flex items-center justify-center py-10">
      <span class="text-sm text-[var(--studio-faint)]">Chargement…</span>
    </div>

    <div v-else-if="error" class="flex items-center justify-center py-10">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!block.datasetId" class="flex flex-col items-center justify-center gap-2 py-10 text-[var(--studio-faint)]">
      <svg class="h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8.25h18M3 15.75h18M3 12h18M4.5 4.5h15A1.5 1.5 0 0 1 21 6v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      </svg>
      <span class="text-xs">Configurer les données →</span>
    </div>

    <template v-else>
      <div class="overflow-hidden rounded-[13px] border border-[var(--studio-line)]">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[480px] border-collapse">
            <thead>
              <tr class="border-b border-[var(--studio-line)] bg-[var(--studio-panel)]">
                <th
                  v-for="col in visibleColumns"
                  :key="col"
                  class="select-none whitespace-nowrap px-3.5 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-[var(--studio-muted)]"
                  :style="{ textAlign: columnFormat(col).align ?? 'left' }"
                  :class="block.config.sortable ? 'cursor-pointer transition-colors hover:text-[var(--studio-ink)]' : ''"
                  @click="toggleSort(col)"
                >
                  <span class="inline-flex items-center gap-1.5">
                    {{ columnLabel(col) }}
                    <span v-if="block.config.sortable" class="text-[9px]" :class="sort?.col === col ? 'text-[var(--color-primary)]' : 'opacity-30'">
                      {{ sort?.col === col ? (sort.dir === 'asc' ? '▲' : '▼') : '↕' }}
                    </span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in rows"
                :key="i"
                class="border-b border-[var(--studio-line)] transition-colors last:border-0 hover:bg-[var(--color-primary)]/[0.025]"
              >
                <td
                  v-for="col in visibleColumns"
                  :key="col"
                  class="whitespace-nowrap px-3.5 py-3 text-[12px]"
                  :class="isMono(col) ? 'mono' : ''"
                  :style="cellStyle(col, cellVal(row, col))"
                >
                  {{ formatCell(col, cellVal(row, col)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="canExport || (showPagination && totalPages > 1)"
        class="mt-3 flex items-center justify-between gap-3"
      >
        <span class="mono text-[11px] text-[var(--studio-faint)]">{{ showPagination && totalPages > 1 ? pageInfo : '' }}</span>
        <div class="flex items-center gap-1.5">
          <button
            v-if="canExport"
            type="button"
            class="mr-1 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[var(--studio-line-strong)] px-3.5 py-2 text-[12px] font-bold text-[var(--studio-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--studio-tag-ink)]"
            @click="exportCsv"
          >
            ↓ Exporter
          </button>
          <template v-if="showPagination && totalPages > 1">
            <button
              class="rounded-[9px] border-[1.5px] border-[var(--studio-line-strong)] px-3 py-1.5 text-[12px] font-bold text-[var(--studio-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--studio-tag-ink)] disabled:opacity-30"
              :disabled="page === 0"
              @click="page--"
            >← Précédent</button>
            <button
              class="rounded-[9px] border-[1.5px] border-[var(--studio-line-strong)] px-3 py-1.5 text-[12px] font-bold text-[var(--studio-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--studio-tag-ink)] disabled:opacity-30"
              :disabled="page >= totalPages - 1"
              @click="page++"
            >Suivant →</button>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
