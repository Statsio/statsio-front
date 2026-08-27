<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { StudioBlock, DatasetColumn, BlockJoin, AggregateFunction } from '@/types/studio'
import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'
import StudioSubModal from './StudioSubModal.vue'

const props = defineProps<{
  show: boolean
  block: StudioBlock
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const studio   = useStudioStore()
const datasets = useStudioDatasetsStore()

const needsXY       = computed(() => props.block.type === 'bar' || props.block.type === 'line')
const needsLabelVal = computed(() => props.block.type === 'pie')
const needsValue    = computed(() => props.block.type === 'kpi')
const isTable       = computed(() => props.block.type === 'table')

const schema = computed(() => datasets.getSchema(props.block.datasetId ?? ''))
const joins  = computed<BlockJoin[]>(() => props.block.joins ?? [])

const yAxes = computed<string[]>(() => {
  const axes = props.block.fieldMapping.yAxes
  if (axes?.length) return axes
  const single = props.block.fieldMapping.yAxis
  return single ? [single] : []
})

// All column groups combined
const allColumnGroups = computed<ColumnGroup[]>(() => {
  const groups: ColumnGroup[] = []
  if (schema.value) groups.push({ label: schema.value.name ?? 'Source principale', columns: schema.value.columns })
  joins.value.forEach((j, i) => {
    const jSchema = datasets.getSchema(j.datasetId)
    if (jSchema) groups.push({ label: `Jointure ${i + 1}`, columns: jSchema.columns })
  })
  return groups
})

const columnNames = computed(() => schema.value?.columns.map((c: DatasetColumn) => c.name) ?? [])

// Auto-add column to join.columns if it belongs to a join
function updateMapping(key: string, value: string) {
  studio.updateBlockFieldMapping(props.block.id, { [key]: value || undefined })
  if (!value) return
  if (columnNames.value.includes(value)) return
  joins.value.forEach((j, i) => {
    const jCols = datasets.getSchema(j.datasetId)?.columns.map((c: DatasetColumn) => c.name) ?? []
    if (jCols.includes(value) && !j.columns.includes(value)) {
      studio.updateBlockJoins(props.block.id, joins.value.map((jj, ii) => ii === i ? { ...jj, columns: [...jj.columns, value] } : jj))
    }
  })
}

function updateAggregate(value: AggregateFunction | undefined) {
  studio.updateBlockFieldMapping(props.block.id, { aggregate: value })
}

// ─── Table: column selection + labels ──────────────────────────────────────

const showTableColumnPicker = ref(false)

const isColumnsCustomized = computed(() => (props.block.fieldMapping.columns?.length ?? 0) > 0)

const tableColumns = computed<string[]>(() => {
  const cols = props.block.fieldMapping.columns
  if (cols && cols.length > 0) return cols
  return columnNames.value
})

const columnLabels = computed<Record<string, string>>(() => props.block.fieldMapping.columnLabels ?? {})

function toggleTableColumn(col: string) {
  const current = tableColumns.value
  if (current.includes(col)) {
    if (current.length <= 1) return
    const next = current.filter(c => c !== col)
    const labels = { ...columnLabels.value }
    delete labels[col]
    studio.updateBlockFieldMapping(props.block.id, {
      columns: next,
      columnLabels: Object.keys(labels).length ? labels : undefined,
    })
  } else {
    studio.updateBlockFieldMapping(props.block.id, { columns: [...current, col] })
  }
}

function moveColumn(col: string, dir: -1 | 1) {
  const current = [...tableColumns.value]
  const i = current.indexOf(col)
  const j = i + dir
  if (i < 0 || j < 0 || j >= current.length) return
  const tmp = current[i]!
  current[i] = current[j]!
  current[j] = tmp
  studio.updateBlockFieldMapping(props.block.id, { columns: current })
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

function addYAxis(col: string) {
  if (!col || yAxes.value.includes(col)) return
  const next = [...yAxes.value, col]
  studio.updateBlockFieldMapping(props.block.id, { yAxes: next, yAxis: next[0] })
  if (!columnNames.value.includes(col)) {
    joins.value.forEach((j, i) => {
      const jCols = datasets.getSchema(j.datasetId)?.columns.map((c: DatasetColumn) => c.name) ?? []
      if (jCols.includes(col) && !j.columns.includes(col)) {
        studio.updateBlockJoins(props.block.id, joins.value.map((jj, ii) => ii === i ? { ...jj, columns: [...jj.columns, col] } : jj))
      }
    })
  }
}

function removeYAxis(col: string) {
  const next = yAxes.value.filter(c => c !== col)
  studio.updateBlockFieldMapping(props.block.id, { yAxes: next.length ? next : undefined, yAxis: next[0] ?? undefined })
}

const FORMAT_OPTIONS = [
  { v: 'number',   l: '123',  desc: 'Nombre brut' },
  { v: 'percent',  l: '%',    desc: 'Pourcentage' },
  { v: 'currency', l: '€',   desc: 'Devise' },
] as const

</script>

<template>
  <StudioSubModal
    v-if="show"
    title="Colonnes du bloc"
    subtitle="Reliez les colonnes de la source aux axes du bloc. Une colonne issue d'une jointure est ajoutée automatiquement."
    :width="580"
    @close="emit('close')"
  >
        <!-- Body (no data) -->
        <div v-if="!block.datasetId" class="flex flex-col items-center justify-center gap-3 py-16 text-center px-8">
          <svg class="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
          </svg>
          <p class="text-sm font-medium text-[var(--studio-muted)]">Aucun dataset sélectionné</p>
          <p class="text-xs text-[var(--studio-faint)]">Configurez d'abord la source de données dans l'onglet Données</p>
        </div>

        <!-- Body: bar/line -->
        <div v-else-if="needsXY" class="flex flex-col gap-6">

          <!-- Axe X -->
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Axe X <span class="font-normal normal-case tracking-normal">— catégories</span></p>
            <p class="mb-2 text-[10px] text-[var(--studio-faint)]">Colonne affichée sur l'axe horizontal</p>
            <ColumnButton
              :model-value="block.fieldMapping.xAxis ?? null"
              :block="block"
              placeholder="— Choisir une colonne —"
              @update:model-value="updateMapping('xAxis', $event as string)"
            />
          </div>

          <div class="border-t border-[var(--studio-line)]" />

          <!-- Axe Y -->
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">
              Axe Y <span class="font-normal normal-case tracking-normal">— valeurs</span>
              <span v-if="yAxes.length >= 2" class="ml-2 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-white text-[9px] font-bold">{{ yAxes.length }}</span>
            </p>
            <p class="mb-2 text-[10px] text-[var(--studio-faint)]">
              {{ yAxes.length >= 2 ? 'Chaque colonne devient une ligne / série distincte' : 'Colonne(s) numériques à visualiser' }}
            </p>

            <!-- Selected Y axes as chip grid -->
            <div v-if="yAxes.length > 0" class="flex flex-wrap gap-1.5 mb-3">
              <span
                v-for="col in yAxes" :key="col"
                class="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-medium text-blue-700"
              >
                <span class="font-mono">{{ col }}</span>
                <button class="flex items-center justify-center w-3.5 h-3.5 rounded hover:bg-blue-200 transition-colors" @click="removeYAxis(col)">
                  <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </span>
            </div>

            <!-- Add another column -->
            <ColumnButton
              :model-value="null"
              :block="block"
              :placeholder="yAxes.length === 0 ? '— Choisir une colonne —' : '+ Ajouter une colonne Y…'"
              show-aggregation
              :aggregate-value="block.fieldMapping.aggregate"
              @update:model-value="addYAxis($event as string)"
              @update:aggregate="updateAggregate"
            />
          </div>

          <div class="border-t border-[var(--studio-line)]" />

          <!-- Série (only if single Y) -->
          <div v-if="!block.fieldMapping.yAxes?.length || block.fieldMapping.yAxes.length < 2">
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Série <span class="font-normal normal-case tracking-normal">— groupement</span></p>
            <p class="mb-2 text-[10px] text-[var(--studio-faint)]">Chaque valeur unique de cette colonne devient une série sur le graphique</p>
            <ColumnButton
              :model-value="block.fieldMapping.series ?? null"
              :block="block"
              placeholder="— Série unique —"
              clearable
              @update:model-value="updateMapping('series', ($event ?? '') as string)"
            />
            <p v-if="block.fieldMapping.series" class="mt-1.5 text-[10px] text-[var(--studio-faint)]">Actif — groupement par <strong class="font-mono">{{ block.fieldMapping.series }}</strong></p>
          </div>
        </div>

        <!-- Body: pie -->
        <div v-else-if="needsLabelVal" class="flex flex-col gap-6">
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Étiquettes</p>
            <p class="mb-2 text-[10px] text-[var(--studio-faint)]">Noms des segments (généralement une colonne texte)</p>
            <ColumnButton :model-value="block.fieldMapping.label ?? null" :block="block" @update:model-value="updateMapping('label', $event as string)" />
          </div>
          <div class="border-t border-[var(--studio-line)]" />
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Valeurs</p>
            <p class="mb-2 text-[10px] text-[var(--studio-faint)]">Taille des segments (colonne numérique)</p>
            <ColumnButton
              :model-value="block.fieldMapping.value ?? null"
              :block="block"
              show-aggregation
              :aggregate-value="block.fieldMapping.aggregate"
              @update:model-value="updateMapping('value', $event as string)"
              @update:aggregate="updateAggregate"
            />
          </div>
        </div>

        <!-- Body: kpi -->
        <div v-else-if="needsValue" class="flex flex-col gap-6">
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Valeur principale</p>
            <p class="mb-2 text-[10px] text-[var(--studio-faint)]">Colonne numérique affichée en grand</p>
            <ColumnButton
              :model-value="block.fieldMapping.valueColumn ?? null"
              :block="block"
              show-aggregation
              :aggregate-value="block.fieldMapping.aggregate"
              @update:model-value="updateMapping('valueColumn', $event as string)"
              @update:aggregate="updateAggregate"
            />
          </div>

          <div class="border-t border-[var(--studio-line)]" />

          <div>
            <p class="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Format</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="f in FORMAT_OPTIONS" :key="f.v"
                class="flex flex-col items-center rounded-xl border px-3 py-3 transition-all"
                :class="(block.config.format ?? 'number') === f.v
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                  : 'border-[var(--studio-line-strong)] bg-white text-[var(--studio-muted)] hover:border-slate-300'"
                @click="studio.updateBlockConfig(block.id, { format: f.v })"
              >
                <span class="text-xl font-bold">{{ f.l }}</span>
                <span class="mt-1 text-[10px] opacity-70">{{ f.desc }}</span>
              </button>
            </div>
          </div>

          <div class="rounded-xl border border-rose-100 bg-rose-50 p-3 flex items-center gap-2">
            <svg class="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
            <p class="text-[11px] text-rose-500">Valeur de comparaison → onglet <strong>Comparaison</strong></p>
          </div>
        </div>

        <!-- Body: table -->
        <div v-else-if="isTable">
          <div class="flex items-center justify-between mb-1">
            <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--studio-faint)]">Colonnes affichées</p>
            <button
              v-if="isColumnsCustomized"
              class="text-[11px] text-[var(--studio-faint)] hover:text-red-500 transition-colors"
              @click="resetTableColumns"
            >Réinitialiser</button>
          </div>
          <p class="mb-3 text-[10px] text-[var(--studio-faint)]">Choisissez les colonnes à afficher, leur ordre et leur label</p>

          <!-- Rows -->
          <div class="flex flex-col gap-2 mb-3">
            <div
              v-for="(col, i) in tableColumns" :key="col"
              class="flex items-center gap-2 rounded-xl border border-[var(--studio-line-strong)] bg-[var(--studio-panel)] px-3 py-2"
            >
              <div class="flex flex-col shrink-0 -my-1">
                <button
                  class="flex items-center justify-center w-4 h-4 text-[var(--studio-faint)] hover:text-[var(--studio-muted)] disabled:opacity-20 disabled:hover:text-[var(--studio-faint)] transition-colors"
                  :disabled="i === 0"
                  @click="moveColumn(col, -1)"
                ><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg></button>
                <button
                  class="flex items-center justify-center w-4 h-4 text-[var(--studio-faint)] hover:text-[var(--studio-muted)] disabled:opacity-20 disabled:hover:text-[var(--studio-faint)] transition-colors"
                  :disabled="i === tableColumns.length - 1"
                  @click="moveColumn(col, 1)"
                ><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg></button>
              </div>
              <span class="shrink-0 font-mono text-[10px] bg-white border border-[var(--studio-line-strong)] rounded px-1.5 py-0.5 text-[var(--studio-muted)] max-w-[100px] truncate" :title="col">{{ col }}</span>
              <svg class="shrink-0 w-3 h-3 text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              <input
                type="text"
                class="flex-1 min-w-0 rounded-lg border border-[var(--studio-line)] bg-white px-2 py-1 text-[11px] text-[var(--studio-ink)] placeholder-slate-300 focus:border-[var(--color-primary)] focus:outline-none  transition-colors"
                :placeholder="col"
                :value="columnLabels[col] ?? ''"
                @change="setColumnLabel(col, ($event.target as HTMLInputElement).value)"
              />
              <button
                class="shrink-0 flex items-center justify-center w-5 h-5 rounded hover:bg-red-50 text-[var(--studio-faint)] hover:text-red-400 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[var(--studio-faint)] transition-colors"
                :disabled="tableColumns.length <= 1"
                @click="toggleTableColumn(col)"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <!-- Open column picker -->
          <button
            class="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 text-[var(--studio-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 bg-white px-3 py-1.5 text-[11px] font-medium transition-colors"
            @click="showTableColumnPicker = true"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Ajouter / retirer des colonnes…
          </button>

          <ColumnPickerModal
            :show="showTableColumnPicker"
            :block="block"
            mode="multi"
            :custom-groups="allColumnGroups"
            :selected-values="tableColumns"
            @toggle="toggleTableColumn"
            @close="showTableColumnPicker = false"
          />
        </div>

  </StudioSubModal>
</template>
