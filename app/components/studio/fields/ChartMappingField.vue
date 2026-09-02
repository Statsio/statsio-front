<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { columnRefLabel } from '@/lib/studio-columns'
import { AGG_OPTIONS, aggregateFor, expressionToAggTerms, withAggregate } from '@/lib/studio-aggregates'
import { useColumnDrillIn } from '@/composables/useColumnDrillIn'
import type { AggregateFunction, AggTerm, PieSegment, StudioBlock } from '@/types/studio'
import StudioField from './StudioField.vue'
import FieldSegmented from './FieldSegmented.vue'
import AxisFieldRow from './AxisFieldRow.vue'
import AggValueField from './AggValueField.vue'

const props = defineProps<{ block: StudioBlock }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const drillIn = useColumnDrillIn()

const fm = computed(() => props.block.fieldMapping)
const cfg = computed(() => props.block.config)
const isBar = computed(() => props.block.type === 'bar')
const isLine = computed(() => props.block.type === 'line')
const isXY = computed(() => isBar.value || isLine.value)
const isPie = computed(() => props.block.type === 'pie')
const isKpi = computed(() => props.block.type === 'kpi')

const refLabel = (ref?: string | null) => (ref ? columnRefLabel(ref, props.block, datasets) : '')

function setMapping(patch: Record<string, unknown>) {
  studio.updateBlockFieldMapping(props.block.id, patch)
}
function setConfig(patch: Record<string, unknown>) {
  studio.updateBlockConfig(props.block.id, patch)
}

function pickColumn(title: string, current: string | null, onPick: (ref: string) => void, allowNone = false) {
  drillIn.open({
    block: props.block,
    title,
    allowNone,
    selected: current ? [current] : [],
    onCommit: (refs) => onPick(refs[0] ?? ''),
  })
}

// ─── Axe X ──────────────────────────────────────────────────────────────────
function setXAxis(ref: string) {
  setMapping({ xAxis: ref || undefined })
}

// Tri (déplacé depuis l'onglet Filtres)
const sortColumn = computed(() => cfg.value.sortColumn ?? null)
const sortDir = computed(() => cfg.value.sortDirection ?? 'asc')
function setSortColumn(ref: string) {
  setConfig({ sortColumn: ref || null, sortDirection: ref ? sortDir.value : null })
}

// ─── Axe Y : séries (une par entrée yAxes) ──────────────────────────────────
const yAxes = computed<string[]>(() => (fm.value.yAxes?.length ? fm.value.yAxes : fm.value.yAxis ? [fm.value.yAxis] : []))
const activeSeries = ref(0)
watch(yAxes, (list) => { if (activeSeries.value >= list.length) activeSeries.value = Math.max(0, list.length - 1) })

function writeYAxes(next: string[]) {
  setMapping({ yAxes: next.length ? next : undefined, yAxis: next[0] ?? undefined })
}
function addSeries() {
  drillIn.open({
    block: props.block,
    title: 'Ajouter une série',
    selected: [],
    onCommit: (refs) => {
      const ref = refs[0]
      if (!ref || yAxes.value.includes(ref)) return
      const next = [...yAxes.value, ref]
      writeYAxes(next)
      activeSeries.value = next.length - 1
      const inherited = yAxes.value.length ? aggregateFor(fm.value, yAxes.value[0]!) : undefined
      if (inherited) setMapping(withAggregate({ ...props.block, fieldMapping: { ...fm.value, yAxes: next } }, ref, inherited))
    },
  })
}
function removeSeries(i: number) {
  if (yAxes.value.length <= 1) return
  writeYAxes(yAxes.value.filter((_, k) => k !== i))
}
function replaceSeries(i: number, ref: string) {
  if (!ref) return
  const prev = yAxes.value[i]
  const fn = prev ? aggregateFor(fm.value, prev) : undefined
  const next = yAxes.value.map((c, k) => (k === i ? ref : c))
  writeYAxes(next)
  if (fn) setMapping(withAggregate({ ...props.block, fieldMapping: { ...fm.value, yAxes: next } }, ref, fn))
}
function setSeriesFn(col: string, fn: AggregateFunction | '') {
  setMapping(withAggregate(props.block, col, fn))
}

// ─── Pie / KPI ─────────────────────────────────────────────────────────────
const FORMAT_OPTIONS = [
  { value: 'number', label: 'Nombre' },
  { value: 'percent', label: 'Pourcentage' },
  { value: 'currency', label: 'Devise' },
]

// KPI : valeur = combinaison d'agrégats (AggTerm[]). Dérivée du legacy tant que non éditée.
const kpiValue = computed<AggTerm[]>(() => {
  if (fm.value.kpiValue?.length) return fm.value.kpiValue
  if (fm.value.valueColumn) {
    return [{ fn: aggregateFor(fm.value, fm.value.valueColumn) ?? 'sum', column: fm.value.valueColumn }]
  }
  if (cfg.value.valueExpression) return expressionToAggTerms(cfg.value.valueExpression) ?? []
  return []
})
/** L'expression legacy ne se laisse pas convertir en constructeur visuel. */
const kpiLegacyExpr = computed(() =>
  !fm.value.kpiValue?.length && !fm.value.valueColumn && cfg.value.valueExpression
  && expressionToAggTerms(cfg.value.valueExpression) === null
    ? cfg.value.valueExpression
    : '',
)
function setKpiValue(next: AggTerm[]) {
  studio.updateBlockFieldMapping(props.block.id, {
    kpiValue: next.length ? next : undefined,
    valueColumn: undefined,
    aggregate: undefined,
    aggregates: undefined,
  })
  setConfig({ valueExpression: undefined })
}

const ORIENTATION_OPTS = [
  { value: 'vertical', label: 'Colonnes' },
  { value: 'horizontal', label: 'Barres' },
]

// ─── Camembert : mode « parts calculées » ──────────────────────────────────
const PIE_MODE_OPTS = [
  { value: 'column', label: 'Par colonne' },
  { value: 'segments', label: 'Parts calculées' },
]
const PIE_FN_OPTS: { value: PieSegment['fn']; label: string }[] = [
  { value: 'sum', label: 'Somme' },
  { value: 'avg', label: 'Moyenne' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Nombre' },
  { value: 'remainder', label: 'Reste (− autres parts)' },
]
const pieMode = computed(() => cfg.value.pieMode ?? 'column')
const pieSegments = computed<PieSegment[]>(() => fm.value.pieSegments ?? [])

function writeSegments(next: PieSegment[]) {
  setMapping({ pieSegments: next.length ? next : undefined })
}
function addSegment() {
  writeSegments([...pieSegments.value, { fn: 'sum', column: '' }])
}
function updateSegment(i: number, patch: Partial<PieSegment>) {
  writeSegments(pieSegments.value.map((s, k) => (k === i ? { ...s, ...patch } : s)))
}
function removeSegment(i: number) {
  writeSegments(pieSegments.value.filter((_, k) => k !== i))
}
function moveSegment(i: number, dir: -1 | 1) {
  const next = [...pieSegments.value]
  const j = i + dir
  if (j < 0 || j >= next.length) return
  ;[next[i], next[j]] = [next[j]!, next[i]!]
  writeSegments(next)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- ═══ BAR / LINE ═══ -->
    <template v-if="isXY">
      <FieldSegmented
        v-if="isBar"
        label="Sous-type"
        :options="ORIENTATION_OPTS"
        :model-value="cfg.orientation ?? 'vertical'"
        @update:model-value="setConfig({ orientation: $event })"
      />

      <StudioField label="Axe X (horizontal)">
        <div class="flex flex-col gap-2">
          <AxisFieldRow
            label="Champ"
            :value="refLabel(fm.xAxis)"
            clearable
            @open="pickColumn('Colonne de l’axe X', fm.xAxis ?? null, setXAxis)"
            @clear="setXAxis('')"
          />
          <div class="flex items-center gap-2">
            <AxisFieldRow
              label="Tri"
              class="min-w-0 flex-1"
              :value="refLabel(sortColumn)"
              placeholder="Ordre de la source"
              clearable
              @open="pickColumn('Trier selon', sortColumn, setSortColumn, true)"
              @clear="setSortColumn('')"
            />
            <div v-if="sortColumn" class="flex shrink-0 overflow-hidden rounded-[9px] border-[1.5px] border-[var(--studio-line-strong)]">
              <button
                type="button"
                class="px-2 py-1.5 text-[12px] font-bold transition-colors"
                :class="sortDir === 'asc' ? 'bg-[var(--studio-ink)] text-white' : 'text-[var(--studio-muted)]'"
                title="Croissant"
                @click="setConfig({ sortDirection: 'asc' })"
              >↑</button>
              <button
                type="button"
                class="px-2 py-1.5 text-[12px] font-bold transition-colors"
                :class="sortDir === 'desc' ? 'bg-[var(--studio-ink)] text-white' : 'text-[var(--studio-muted)]'"
                title="Décroissant"
                @click="setConfig({ sortDirection: 'desc' })"
              >↓</button>
            </div>
          </div>
        </div>
      </StudioField>

      <StudioField label="Axe Y (vertical)">
        <div class="flex flex-col gap-2.5">
          <!-- Onglets de séries -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="(col, i) in yAxes"
              :key="i"
              type="button"
              class="flex items-center gap-1.5 rounded-[8px] border-[1.5px] px-2 py-1 text-[11px] font-bold transition-colors"
              :class="activeSeries === i
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
              @click="activeSeries = i"
            >
              Série {{ i + 1 }}
              <span
                v-if="yAxes.length > 1"
                class="text-[var(--studio-faint)] hover:text-[var(--color-error)]"
                role="button"
                aria-label="Retirer la série"
                @click.stop="removeSeries(i)"
              >✕</span>
            </button>
            <button
              type="button"
              class="rounded-[8px] border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-2 py-1 text-[12px] font-bold text-[var(--color-primary)]"
              aria-label="Ajouter une série"
              @click="addSeries"
            >+</button>
          </div>

          <template v-if="yAxes.length">
            <div class="flex items-center gap-2">
              <span class="w-[78px] shrink-0 text-[12px] font-semibold text-[var(--studio-muted)]">Fonction</span>
              <select
                class="studio-input min-w-0 flex-1 !py-2 !text-[12px]"
                :value="aggregateFor(fm, yAxes[activeSeries] ?? '') ?? ''"
                @change="setSeriesFn(yAxes[activeSeries] ?? '', ($event.target as HTMLSelectElement).value as AggregateFunction | '')"
              >
                <option v-for="o in AGG_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
            <AxisFieldRow
              label="Champ"
              :value="refLabel(yAxes[activeSeries])"
              @open="pickColumn('Colonne de la série', yAxes[activeSeries] ?? null, (r) => replaceSeries(activeSeries, r))"
            />
          </template>
          <p v-else class="text-[11.5px] text-[var(--studio-faint)]">Ajoutez une série avec « + ».</p>
        </div>
      </StudioField>

      <StudioField label="Grouper par">
        <AxisFieldRow
          label="Série"
          :value="refLabel(fm.series)"
          placeholder="Aucun regroupement"
          clearable
          @open="pickColumn('Colonne de regroupement', fm.series ?? null, (r) => setMapping({ series: r || undefined }), true)"
          @clear="setMapping({ series: undefined })"
        />
      </StudioField>
    </template>

    <!-- ═══ PIE ═══ -->
    <template v-else-if="isPie">
      <FieldSegmented
        label="Mode"
        :options="PIE_MODE_OPTS"
        :model-value="pieMode"
        @update:model-value="setConfig({ pieMode: $event === 'column' ? undefined : $event })"
      />

      <template v-if="pieMode === 'column'">
        <StudioField label="Étiquettes">
          <AxisFieldRow
            label="Champ"
            :value="refLabel(fm.label)"
            clearable
            @open="pickColumn('Colonne des étiquettes', fm.label ?? null, (r) => setMapping({ label: r || undefined }))"
            @clear="setMapping({ label: undefined })"
          />
        </StudioField>
        <StudioField label="Valeurs">
          <div class="flex flex-col gap-2">
            <AxisFieldRow
              label="Champ"
              :value="refLabel(fm.value)"
              clearable
              @open="pickColumn('Colonne des valeurs', fm.value ?? null, (r) => setMapping({ value: r || undefined }))"
              @clear="setMapping({ value: undefined })"
            />
            <div v-if="fm.value" class="flex items-center gap-2">
              <span class="w-[78px] shrink-0 text-[12px] font-semibold text-[var(--studio-muted)]">Fonction</span>
              <select
                class="studio-input min-w-0 flex-1 !py-2 !text-[12px]"
                :value="aggregateFor(fm, fm.value) ?? ''"
                @change="setSeriesFn(fm.value ?? '', ($event.target as HTMLSelectElement).value as AggregateFunction | '')"
              >
                <option v-for="o in AGG_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
          </div>
        </StudioField>
      </template>

      <StudioField v-else label="Parts">
        <div class="flex flex-col gap-3">
          <div
            v-for="(seg, i) in pieSegments"
            :key="i"
            class="flex flex-col gap-2 rounded-xl border border-[var(--studio-line)] bg-white p-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[var(--studio-faint)]">Part {{ i + 1 }}</span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="flex h-5 w-5 items-center justify-center rounded-md text-[10px] text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)] disabled:opacity-30"
                  aria-label="Monter"
                  :disabled="i === 0"
                  @click="moveSegment(i, -1)"
                >▲</button>
                <button
                  type="button"
                  class="flex h-5 w-5 items-center justify-center rounded-md text-[10px] text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)] disabled:opacity-30"
                  aria-label="Descendre"
                  :disabled="i === pieSegments.length - 1"
                  @click="moveSegment(i, 1)"
                >▼</button>
                <button
                  type="button"
                  class="ml-1 text-[11px] font-bold text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
                  @click="removeSegment(i)"
                >Retirer</button>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-[78px] shrink-0 text-[12px] font-semibold text-[var(--studio-muted)]">Libellé</span>
              <input
                :value="seg.label ?? ''"
                type="text"
                class="studio-input min-w-0 flex-1 !py-2 !text-[12px]"
                :placeholder="seg.fn === 'remainder' ? 'Reste' : (refLabel(seg.column) || 'auto')"
                @input="updateSegment(i, { label: ($event.target as HTMLInputElement).value || undefined })"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-[78px] shrink-0 text-[12px] font-semibold text-[var(--studio-muted)]">Fonction</span>
              <select
                class="studio-input min-w-0 flex-1 !py-2 !text-[12px]"
                :value="seg.fn"
                @change="updateSegment(i, { fn: ($event.target as HTMLSelectElement).value as PieSegment['fn'] })"
              >
                <option v-for="o in PIE_FN_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
            <AxisFieldRow
              label="Champ"
              :value="refLabel(seg.column)"
              :placeholder="seg.fn === 'remainder' ? 'colonne du total' : 'colonne'"
              @open="pickColumn('Colonne de la part', seg.column || null, (r) => updateSegment(i, { column: r }))"
            />
          </div>

          <p v-if="!pieSegments.length" class="rounded-xl bg-[var(--studio-note)] px-3.5 py-3 text-[12.5px] leading-[1.5] text-[var(--studio-faint)]">
            Une part par fonction + colonne (ex. Somme d'« Admis »). Ajoutez une part
            « Reste » sur la colonne du total pour le complément.
          </p>
          <button type="button" class="studio-add-btn" @click="addSegment">+ Ajouter une part</button>
        </div>
      </StudioField>
    </template>

    <!-- ═══ KPI ═══ -->
    <template v-else-if="isKpi">
      <StudioField label="Valeur" hint="Fonction × colonne, combinables">
        <template v-if="kpiLegacyExpr">
          <div class="flex items-center gap-2 rounded-xl border border-[var(--studio-line)] bg-white px-3 py-2.5">
            <span class="min-w-0 flex-1 truncate font-mono text-[11.5px] text-[var(--studio-ink)]">{{ kpiLegacyExpr }}</span>
            <button
              type="button"
              class="shrink-0 text-[11px] font-bold text-[var(--color-primary)]"
              @click="setKpiValue([{ fn: 'sum', column: '' }])"
            >Repartir de zéro</button>
          </div>
          <p class="mt-1.5 text-[11px] leading-relaxed text-[var(--studio-faint)]">
            Expression avancée (parenthèses / filtres / constantes) — non éditable visuellement.
          </p>
        </template>
        <AggValueField
          v-else
          :block="block"
          :model-value="kpiValue"
          @update:model-value="setKpiValue"
        />
      </StudioField>
      <FieldSegmented
        label="Format"
        :options="FORMAT_OPTIONS"
        :model-value="cfg.format ?? 'number'"
        @update:model-value="setConfig({ format: $event })"
      />
    </template>
  </div>
</template>
