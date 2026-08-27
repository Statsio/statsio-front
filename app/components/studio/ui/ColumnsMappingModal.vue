<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { StudioBlock, DatasetColumn, BlockJoin, AggregateFunction } from '@/types/studio'
import StudioSubModal from './StudioSubModal.vue'

const props = defineProps<{ show: boolean; block: StudioBlock }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const needsXY = computed(() => props.block.type === 'bar' || props.block.type === 'line')
const needsLabelVal = computed(() => props.block.type === 'pie')
const needsValue = computed(() => props.block.type === 'kpi')
const isTable = computed(() => props.block.type === 'table')

const schema = computed(() => datasets.getSchema(props.block.datasetId ?? ''))
const joins = computed<BlockJoin[]>(() => props.block.joins ?? [])
const fm = computed(() => props.block.fieldMapping)

const yAxes = computed<string[]>(() => {
  const axes = fm.value.yAxes
  if (axes?.length) return axes
  return fm.value.yAxis ? [fm.value.yAxis] : []
})

// ─── Colonnes disponibles (source principale + jointures), à plat ────────────

interface Col { name: string; type: DatasetColumn['type']; group: string }

const allColumns = computed<Col[]>(() => {
  const out: Col[] = []
  const seen = new Set<string>()
  const push = (cols: DatasetColumn[] | undefined, group: string) => {
    cols?.forEach((c) => {
      if (seen.has(c.name)) return
      seen.add(c.name)
      out.push({ name: c.name, type: c.type, group })
    })
  }
  push(schema.value?.columns, schema.value?.name ?? 'Source principale')
  joins.value.forEach((j, i) => {
    const name = datasets.readyDatasets.find((d) => d.id === j.datasetId)?.name ?? `Jointure ${i + 1}`
    push(datasets.getSchema(j.datasetId)?.columns, `Jointure — ${name}`)
  })
  return out
})

const columnNames = computed(() => schema.value?.columns.map((c: DatasetColumn) => c.name) ?? [])

const TYPE_BADGE: Record<string, string> = {
  integer: '#', float: '~', string: 'T', date: 'd', datetime: 'dt', boolean: '?',
}

const AGGS: { value: AggregateFunction; label: string }[] = [
  { value: 'sum', label: 'Somme' },
  { value: 'avg', label: 'Moyenne' },
  { value: 'count', label: 'Nombre' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
]

// ─── Mapping (avec auto-ajout aux colonnes de jointure) ──────────────────────

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

// ─── Axe Y (multi) ──────────────────────────────────────────────────────────

function addYAxis(col: string) {
  if (!col || yAxes.value.includes(col)) return
  const next = [...yAxes.value, col]
  studio.updateBlockFieldMapping(props.block.id, { yAxes: next, yAxis: next[0] })
  syncJoinColumn(col)
}
function removeYAxis(col: string) {
  const next = yAxes.value.filter((c) => c !== col)
  studio.updateBlockFieldMapping(props.block.id, { yAxes: next.length ? next : undefined, yAxis: next[0] ?? undefined })
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

const availableTableColumns = computed(() => allColumns.value.filter((c) => !tableColumns.value.includes(c.name)))
const availableYColumns = computed(() => allColumns.value.filter((c) => !yAxes.value.includes(c.name)))

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
        <div>
          <div class="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Axe X — catégorie</div>
          <div class="flex flex-wrap gap-[7px]">
            <button
              v-for="c in allColumns"
              :key="c.name"
              type="button"
              class="flex items-center gap-[7px] rounded-[20px] border-[1.5px] px-[13px] py-[9px] transition-colors"
              :class="fm.xAxis === c.name
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
                : 'border-[var(--studio-line-strong)] bg-white hover:border-[var(--color-primary)]'"
              @click="set('xAxis', c.name)"
            >
              <span class="font-mono text-[11.5px] font-semibold" :class="fm.xAxis === c.name ? 'text-[var(--studio-tag-ink)]' : 'text-[var(--studio-muted)]'">{{ c.name }}</span>
              <span class="text-[10px] text-[var(--studio-faint)]">{{ TYPE_BADGE[c.type] ?? '?' }}</span>
            </button>
          </div>
        </div>

        <div>
          <div class="mb-2.5 flex items-baseline justify-between gap-3">
            <span class="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Axe Y — valeurs</span>
            <span class="font-mono text-[11px] text-[var(--studio-faint)]">{{ yAxes.length }}</span>
          </div>
          <div class="flex flex-col gap-[9px]">
            <div v-for="col in yAxes" :key="col" class="rounded-xl border border-[var(--studio-line)] px-3.5 py-3">
              <div class="mb-2.5 flex items-center justify-between gap-3">
                <span class="font-mono text-[12px] font-semibold text-[var(--studio-tag-ink)]">{{ col }}</span>
                <button type="button" class="text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)]" @click="removeYAxis(col)">✕</button>
              </div>
              <div class="flex flex-wrap gap-1.5">
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
            <div v-if="availableYColumns.length" class="rounded-xl border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-3.5 py-3">
              <div class="mb-2 text-[11.5px] font-bold text-[var(--studio-faint)]">Ajouter une colonne Y</div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="c in availableYColumns"
                  :key="c.name"
                  type="button"
                  class="rounded-[16px] bg-[var(--studio-tag)] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[var(--studio-tag-ink)]"
                  @click="addYAxis(c.name)"
                >+ {{ c.name }}</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Série de regroupement</div>
          <div class="flex flex-wrap gap-[7px]">
            <button
              type="button"
              class="rounded-[20px] border-[1.5px] px-[13px] py-[9px] font-mono text-[11.5px] font-semibold transition-colors"
              :class="!fm.series
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)]'"
              @click="set('series', undefined)"
            >Aucune</button>
            <button
              v-for="c in allColumns"
              :key="c.name"
              type="button"
              class="rounded-[20px] border-[1.5px] px-[13px] py-[9px] font-mono text-[11.5px] font-semibold transition-colors"
              :class="fm.series === c.name
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
              @click="set('series', c.name)"
            >{{ c.name }}</button>
          </div>
        </div>
      </template>

      <!-- ── PIE ── -->
      <template v-else-if="needsLabelVal">
        <div>
          <div class="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Étiquettes</div>
          <div class="flex flex-wrap gap-[7px]">
            <button
              v-for="c in allColumns"
              :key="c.name"
              type="button"
              class="rounded-[20px] border-[1.5px] px-[13px] py-[9px] font-mono text-[11.5px] font-semibold transition-colors"
              :class="fm.label === c.name
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
              @click="set('label', c.name)"
            >{{ c.name }}</button>
          </div>
        </div>
        <div>
          <div class="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Valeurs</div>
          <div class="mb-2.5 flex flex-wrap gap-[7px]">
            <button
              v-for="c in allColumns"
              :key="c.name"
              type="button"
              class="rounded-[20px] border-[1.5px] px-[13px] py-[9px] font-mono text-[11.5px] font-semibold transition-colors"
              :class="fm.value === c.name
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
              @click="set('value', c.name)"
            >{{ c.name }}</button>
          </div>
          <div class="flex flex-wrap gap-1.5">
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
          <div class="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Valeur principale</div>
          <div class="mb-2.5 flex flex-wrap gap-[7px]">
            <button
              v-for="c in allColumns"
              :key="c.name"
              type="button"
              class="rounded-[20px] border-[1.5px] px-[13px] py-[9px] font-mono text-[11.5px] font-semibold transition-colors"
              :class="fm.valueColumn === c.name
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
              @click="set('valueColumn', c.name)"
            >{{ c.name }}</button>
          </div>
          <div class="flex flex-wrap gap-1.5">
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
            <span class="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Colonnes affichées</span>
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
            <div v-if="availableTableColumns.length" class="rounded-xl border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-3.5 py-3">
              <div class="mb-2 text-[11.5px] font-bold text-[var(--studio-faint)]">Ajouter une colonne</div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="c in availableTableColumns"
                  :key="c.name"
                  type="button"
                  class="rounded-[16px] bg-[var(--studio-tag)] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[var(--studio-tag-ink)]"
                  @click="toggleTableColumn(c.name)"
                >+ {{ c.name }}</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </StudioSubModal>
</template>
