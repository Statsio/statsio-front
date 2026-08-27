<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups } from '@/lib/studio-columns'
import type { StudioBlock, DatasetColumn, BlockJoin, AggregateFunction } from '@/types/studio'
import StudioSubModal from './StudioSubModal.vue'
import FieldColumns from '@/components/studio/fields/FieldColumns.vue'

const props = defineProps<{ show: boolean; block: StudioBlock }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const needsXY = computed(() => props.block.type === 'bar' || props.block.type === 'line')
const needsLabelVal = computed(() => props.block.type === 'pie')
const needsValue = computed(() => props.block.type === 'kpi')
const isTable = computed(() => props.block.type === 'table')

const joins = computed<BlockJoin[]>(() => props.block.joins ?? [])
const fm = computed(() => props.block.fieldMapping)
const groups = computed(() => blockColumnGroups(props.block, datasets))
const columnNames = computed(() => datasets.getSchema(props.block.datasetId ?? '')?.columns.map((c: DatasetColumn) => c.name) ?? [])

const yAxes = computed<string[]>(() => {
  const axes = fm.value.yAxes
  if (axes?.length) return axes
  return fm.value.yAxis ? [fm.value.yAxis] : []
})

const AGGS: { value: AggregateFunction; label: string }[] = [
  { value: 'sum', label: 'Somme' },
  { value: 'avg', label: 'Moyenne' },
  { value: 'count', label: 'Nombre' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
]

function syncJoinColumn(value: string) {
  if (!value || columnNames.value.includes(value)) return
  joins.value.forEach((j, i) => {
    const jCols = datasets.getSchema(j.datasetId)?.columns.map((c: DatasetColumn) => c.name) ?? []
    if (jCols.includes(value) && !j.columns.includes(value)) {
      studio.updateBlockJoins(props.block.id, joins.value.map((jj, ii) => (ii === i ? { ...jj, columns: [...jj.columns, value] } : jj)))
    }
  })
}

function set(key: string, value: string | undefined) {
  studio.updateBlockFieldMapping(props.block.id, { [key]: value || undefined })
  if (value) syncJoinColumn(value)
}
function setAggregate(value: AggregateFunction) {
  studio.updateBlockFieldMapping(props.block.id, { aggregate: value })
}

function toggleYAxis(col: string) {
  const next = yAxes.value.includes(col) ? yAxes.value.filter((c) => c !== col) : [...yAxes.value, col]
  studio.updateBlockFieldMapping(props.block.id, { yAxes: next.length ? next : undefined, yAxis: next[0] ?? undefined })
  syncJoinColumn(col)
}

// ─── Tableau : colonnes affichées + libellés ────────────────────────────────

const tableColumns = computed<string[]>(() => (fm.value.columns?.length ? fm.value.columns : columnNames.value))
const columnLabels = computed<Record<string, string>>(() => fm.value.columnLabels ?? {})
const isCustomized = computed(() => (fm.value.columns?.length ?? 0) > 0)

function toggleTableColumn(col: string) {
  const cur = tableColumns.value
  if (cur.includes(col)) {
    if (cur.length <= 1) return
    const labels = { ...columnLabels.value }
    delete labels[col]
    studio.updateBlockFieldMapping(props.block.id, {
      columns: cur.filter((c) => c !== col),
      columnLabels: Object.keys(labels).length ? labels : undefined,
    })
  } else {
    studio.updateBlockFieldMapping(props.block.id, { columns: [...cur, col] })
    syncJoinColumn(col)
  }
}
function moveColumn(col: string, dir: -1 | 1) {
  const cur = [...tableColumns.value]
  const i = cur.indexOf(col)
  const j = i + dir
  if (i < 0 || j < 0 || j >= cur.length) return
  ;[cur[i], cur[j]] = [cur[j]!, cur[i]!]
  studio.updateBlockFieldMapping(props.block.id, { columns: cur })
}
function setColumnLabel(col: string, label: string) {
  const labels = { ...columnLabels.value }
  if (label && label !== col) labels[col] = label
  else delete labels[col]
  studio.updateBlockFieldMapping(props.block.id, { columnLabels: Object.keys(labels).length ? labels : undefined })
}
function resetTableColumns() {
  studio.updateBlockFieldMapping(props.block.id, { columns: undefined, columnLabels: undefined })
}

const FORMAT_OPTIONS = [
  { v: 'number', l: 'Nombre' },
  { v: 'percent', l: 'Pourcentage' },
  { v: 'currency', l: 'Devise' },
] as const
</script>

<template>
  <StudioSubModal
    v-if="show"
    title="Colonnes du bloc"
    subtitle="Reliez les colonnes de la source aux entrées du bloc. Une colonne issue d'une jointure est ajoutée automatiquement."
    :width="600"
    @close="emit('close')"
  >
    <p v-if="!block.datasetId" class="py-10 text-center text-[13px] text-[var(--studio-faint)]">
      Connectez d'abord une source dans l'onglet « Données ».
    </p>

    <template v-else>
      <!-- ── BAR / LINE ── -->
      <template v-if="needsXY">
        <FieldColumns
          label="Axe X — catégorie"
          :groups="groups"
          :selected="fm.xAxis ?? null"
          @pick="set('xAxis', $event)"
        />
        <div>
          <FieldColumns
            label="Axe Y — valeurs"
            hint="cliquez pour ajouter / retirer"
            :groups="groups"
            :selected="yAxes"
            @pick="toggleYAxis"
          />
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="a in AGGS"
              :key="a.value"
              type="button"
              class="rounded-lg border-[1.5px] px-2.5 py-1.5 text-[11.5px] font-bold transition-colors"
              :class="(fm.aggregate ?? 'sum') === a.value
                ? 'border-[var(--studio-ink)] bg-[var(--studio-ink)] text-white'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
              @click="setAggregate(a.value)"
            >{{ a.label }}</button>
          </div>
        </div>
        <FieldColumns
          label="Série de regroupement"
          :groups="groups"
          :selected="fm.series ?? null"
          none-label="Aucune"
          @pick="set('series', $event)"
          @none="set('series', undefined)"
        />
      </template>

      <!-- ── PIE ── -->
      <template v-else-if="needsLabelVal">
        <FieldColumns label="Étiquettes" :groups="groups" :selected="fm.label ?? null" @pick="set('label', $event)" />
        <div>
          <FieldColumns label="Valeurs" :groups="groups" :selected="fm.value ?? null" @pick="set('value', $event)" />
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="a in AGGS"
              :key="a.value"
              type="button"
              class="rounded-lg border-[1.5px] px-2.5 py-1.5 text-[11.5px] font-bold transition-colors"
              :class="(fm.aggregate ?? 'sum') === a.value
                ? 'border-[var(--studio-ink)] bg-[var(--studio-ink)] text-white'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
              @click="setAggregate(a.value)"
            >{{ a.label }}</button>
          </div>
        </div>
      </template>

      <!-- ── KPI ── -->
      <template v-else-if="needsValue">
        <div>
          <FieldColumns label="Valeur principale" :groups="groups" :selected="fm.valueColumn ?? null" @pick="set('valueColumn', $event)" />
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="a in AGGS"
              :key="a.value"
              type="button"
              class="rounded-lg border-[1.5px] px-2.5 py-1.5 text-[11.5px] font-bold transition-colors"
              :class="(fm.aggregate ?? 'sum') === a.value
                ? 'border-[var(--studio-ink)] bg-[var(--studio-ink)] text-white'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
              @click="setAggregate(a.value)"
            >{{ a.label }}</button>
          </div>
        </div>
        <div>
          <div class="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Format</div>
          <div class="flex gap-1.5">
            <button
              v-for="f in FORMAT_OPTIONS"
              :key="f.v"
              type="button"
              class="flex-1 rounded-[9px] border-[1.5px] py-2.5 text-center text-[12px] font-bold transition-colors"
              :class="(block.config.format ?? 'number') === f.v
                ? 'border-[var(--studio-ink)] bg-[var(--studio-ink)] text-white'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
              @click="studio.updateBlockConfig(block.id, { format: f.v })"
            >{{ f.l }}</button>
          </div>
        </div>
      </template>

      <!-- ── TABLE ── -->
      <template v-else-if="isTable">
        <div>
          <div class="mb-2.5 flex items-baseline justify-between gap-3">
            <span class="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Colonnes affichées &amp; ordre</span>
            <button v-if="isCustomized" type="button" class="text-[11px] font-bold text-[var(--color-primary)]" @click="resetTableColumns">Réinitialiser</button>
          </div>
          <div class="flex flex-col gap-2">
            <div v-for="(col, i) in tableColumns" :key="col" class="flex items-center gap-2">
              <span class="flex shrink-0 flex-col gap-0.5">
                <button type="button" class="flex h-[14px] w-[22px] items-center justify-center rounded-[5px] bg-[var(--studio-wash)] text-[9px] text-[var(--studio-muted)] disabled:opacity-30" :disabled="i === 0" @click="moveColumn(col, -1)">▲</button>
                <button type="button" class="flex h-[14px] w-[22px] items-center justify-center rounded-[5px] bg-[var(--studio-wash)] text-[9px] text-[var(--studio-muted)] disabled:opacity-30" :disabled="i === tableColumns.length - 1" @click="moveColumn(col, 1)">▼</button>
              </span>
              <span class="w-[110px] shrink-0 truncate rounded-md bg-[var(--studio-tag)] px-2 py-1.5 font-mono text-[10.5px] font-semibold text-[var(--studio-tag-ink)]" :title="col">{{ col }}</span>
              <input
                :value="columnLabels[col] ?? ''"
                type="text"
                class="studio-input min-w-0 flex-1 !py-2 !text-[12.5px]"
                :placeholder="col"
                @change="setColumnLabel(col, ($event.target as HTMLInputElement).value)"
              />
              <button type="button" class="shrink-0 text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)] disabled:opacity-30" :disabled="tableColumns.length <= 1" @click="toggleTableColumn(col)">✕</button>
            </div>
          </div>
        </div>
        <FieldColumns
          label="Ajouter / retirer une colonne"
          :groups="groups"
          :selected="tableColumns"
          @pick="toggleTableColumn"
        />
      </template>
    </template>
  </StudioSubModal>
</template>
