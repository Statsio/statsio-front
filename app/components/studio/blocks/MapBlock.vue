<script setup lang="ts">
import { computed } from 'vue'
import { useBlockData, rowKey } from '@/composables/useBlockData'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { primarySourceId, columnRefLabel, valueLabel } from '@/lib/studio-columns'
import { formatNumber } from '@/lib/studio-expression'
import { formatDisplayValue, toNumericOrNull } from '@/utils/statsDataFormat'
import { parseLatLng } from '@/lib/geo-point'
import { basemapStyle } from '@/lib/map-basemaps'
import { cellRuleBounds, rowRuleColor } from '@/lib/studio-cell-rules'
import AppWorldScatterMap, { type WorldScatterPoint } from '@/components/ui/AppWorldScatterMap.vue'
import type { StudioBlock } from '@/types/studio'

/**
 * Carte MapLibre pilotée par les données : un point par ligne du dataset, depuis
 * une colonne latitude + une colonne longitude. Fiche au survol = colonne titre +
 * colonnes `libellé : valeur`. Couleur / taille des points optionnellement pilotées
 * par une colonne.
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const datasets = useStudioDatasetsStore()

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316']

const fm = computed(() => props.block.fieldMapping)
const cfg = computed(() => props.block.config)
const hasCoords = computed(() =>
  Boolean(fm.value.mapPointColumn || (fm.value.latColumn && fm.value.lngColumn)),
)
const ready = computed(() => Boolean(primarySourceId(props.block) && hasCoords.value))

const { data, isLoading, error } = useBlockData(
  () => (ready.value ? props.block : null),
  props.readonly,
  () => props.scope,
)

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Rendu d'une valeur de cellule — mêmes règles que TableBlock.formatCell. */
function formatValue(col: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const relabeled = valueLabel(col, value, props.block)
  if (relabeled !== null) return relabeled
  const fmt = fm.value.columnFormats?.[col]?.format
  const n = toNumericOrNull(value)
  if (fmt === 'percent' && n !== null) return `${formatNumber(n, 1)} %`
  if (fmt === 'currency' && n !== null) return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
  if (fmt === 'number' && n !== null) return formatNumber(n)
  return formatDisplayValue(value)
}

/** Résout une réf de colonne (nue ou `col@source`) en clé réelle de ligne. */
const keyFor = (ref?: string | null) => (ref ? rowKey(data.value, ref) : '')

/**
 * Réfs de colonnes affichées dans la fiche. Sans sélection explicite, on reprend
 * toutes les colonnes chargées (hors coordonnées / titre) — l'inspecteur liste de
 * même toutes les colonnes sous « Lignes de la fiche » tant que rien n'est
 * personnalisé, or `fm.columns` reste vide dans ce cas.
 */
const cardColumns = computed<string[]>(() => {
  if (fm.value.columns?.length) return fm.value.columns
  const geometry = new Set(
    [fm.value.mapPointColumn, fm.value.latColumn, fm.value.lngColumn, fm.value.mapTitleColumn].flatMap((ref) =>
      ref ? [ref, keyFor(ref)] : [],
    ),
  )
  return (data.value?.columns ?? []).filter((c) => !geometry.has(c))
})

const rows = computed<Record<string, unknown>[]>(() => data.value?.rows ?? [])

/** Bornes numériques de la colonne de taille, sur les lignes chargées. */
const sizeBounds = computed<{ min: number; max: number } | null>(() => {
  const ref = fm.value.mapSizeColumn
  if (!ref) return null
  const k = keyFor(ref)
  const vals = rows.value.map((r) => toNum(r[k])).filter((v): v is number => v !== null)
  if (!vals.length) return null
  return { min: Math.min(...vals), max: Math.max(...vals) }
})

/** Bornes des colonnes visées par une règle `top` / `bottom`, sur les lignes chargées. */
const ruleBounds = computed(() =>
  cellRuleBounds(fm.value.cellRules, rows.value, (row, col) => row[keyFor(col)]),
)

/** Couleur par valeur distincte de la colonne de couleur. */
const colorScale = computed<Map<string, string>>(() => {
  const out = new Map<string, string>()
  const ref = fm.value.mapColorColumn
  if (!ref) return out
  const k = keyFor(ref)
  let i = 0
  for (const r of rows.value) {
    const v = String(r[k] ?? '')
    if (!out.has(v)) out.set(v, CHART_COLORS[i++ % CHART_COLORS.length]!)
  }
  return out
})

const points = computed<WorldScatterPoint[]>(() => {
  const pointK = keyFor(fm.value.mapPointColumn)
  const latK = keyFor(fm.value.latColumn)
  const lngK = keyFor(fm.value.lngColumn)
  const titleK = keyFor(fm.value.mapTitleColumn)
  const colorK = keyFor(fm.value.mapColorColumn)
  const sizeK = keyFor(fm.value.mapSizeColumn)
  const baseColor = cfg.value.mapMarkerColor || 'var(--color-primary)'
  const bounds = sizeBounds.value
  const order = fm.value.mapPointOrder ?? 'latlng'

  return rows.value.flatMap((row) => {
    let lat: number | null
    let lon: number | null
    if (fm.value.mapPointColumn) {
      const parsed = parseLatLng(row[pointK], order)
      ;[lat, lon] = parsed ?? [null, null]
    } else {
      lat = toNum(row[latK])
      lon = toNum(row[lngK])
    }
    if (lat === null || lon === null) return []

    const title = fm.value.mapTitleColumn ? formatValue(fm.value.mapTitleColumn, row[titleK]) : ''

    let fill = baseColor
    if (fm.value.mapColorColumn) fill = colorScale.value.get(String(row[colorK] ?? '')) ?? baseColor
    // Les règles de mise en forme conditionnelle priment sur la couleur catégorielle.
    const ruleColor = rowRuleColor(fm.value.cellRules, (col) => row[keyFor(col)], ruleBounds.value)
    if (ruleColor) fill = ruleColor

    let r = 6
    if (sizeK && bounds && bounds.max > bounds.min) {
      const n = toNum(row[sizeK])
      if (n !== null) r = 5 + ((n - bounds.min) / (bounds.max - bounds.min)) * 11
    }

    return [{
      lat,
      lon,
      r,
      fill,
      stroke: '#ffffff',
      label: title || undefined,
      popupHtml: buildPopup(title, row),
    }]
  })
})

function buildPopup(title: string, row: Record<string, unknown>): string | undefined {
  const parts: string[] = []
  if (title && title !== '—') {
    parts.push(`<div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#111">${escapeHtml(title)}</div>`)
  }
  for (const col of cardColumns.value) {
    const k = keyFor(col)
    const label = escapeHtml(columnRefLabel(col, props.block, datasets))
    const value = escapeHtml(formatValue(col, row[k]))
    parts.push(
      `<div style="font-size:12px;line-height:1.5;color:#374151"><span style="color:#6b7280">${label} : </span>${value}</div>`,
    )
  }
  if (!parts.length) return undefined
  return `<div style="font-family:system-ui,sans-serif;padding:2px">${parts.join('')}</div>`
}

const mapHeight = computed(() => cfg.value.mapHeight ?? 360)
const autoFit = computed(() => cfg.value.mapAutoFit !== false)
const mapStyle = computed(() => basemapStyle(cfg.value.mapBasemap))
</script>

<template>
  <div class="w-full">
    <div v-if="!ready" class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--studio-line-strong)] py-14 text-[var(--studio-faint)]">
      <svg class="h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
      <span class="text-xs">Configurer la source et les colonnes latitude / longitude →</span>
    </div>

    <div v-else-if="isLoading" class="flex items-center justify-center py-10">
      <span class="text-sm text-[var(--studio-faint)]">Chargement…</span>
    </div>

    <div v-else-if="error" class="flex items-center justify-center py-10">
      <span class="text-sm text-red-500">{{ error }}</span>
    </div>

    <div v-else-if="!points.length" class="flex items-center justify-center py-10">
      <span class="text-sm text-[var(--studio-faint)]">Aucun point géolocalisé.</span>
    </div>

    <AppWorldScatterMap
      v-else
      :points="points"
      :height="mapHeight"
      :fit-bounds="autoFit"
      :map-style="mapStyle"
    />
  </div>
</template>
