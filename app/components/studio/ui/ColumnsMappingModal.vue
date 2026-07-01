<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { StudioBlock, DatasetColumn, BlockJoin } from '@/types/studio'
import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'

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

// ColumnGroup helpers for ColumnButton
function primaryColumnGroup(): ColumnGroup[] {
  if (!schema.value) return []
  return [{ label: schema.value.name ?? 'Source principale', columns: schema.value.columns }]
}

function joinColumnGroup(joinIdx: number): ColumnGroup[] {
  const j = joins.value[joinIdx]
  const jSchema = datasets.getSchema(j?.datasetId ?? '')
  if (!jSchema) return []
  return [{ label: `Jointure — ${j?.datasetId ?? ''}`, columns: jSchema.columns }]
}

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
]

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  integer:  { label: '#',  cls: 'bg-amber-100 text-amber-700' },
  float:    { label: '~',  cls: 'bg-amber-100 text-amber-700' },
  string:   { label: 'T',  cls: 'bg-blue-100 text-blue-600' },
  date:     { label: 'd',  cls: 'bg-emerald-100 text-emerald-700' },
  datetime: { label: 'dt', cls: 'bg-emerald-100 text-emerald-700' },
  boolean:  { label: '?',  cls: 'bg-violet-100 text-violet-700' },
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />

      <div class="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" style="max-height: min(85vh, 620px);">

        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5">
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </span>
            <h3 class="text-[13px] font-semibold text-slate-800">Colonnes</h3>
          </div>
          <button class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" @click="emit('close')">×</button>
        </div>

        <!-- Body (no data) -->
        <div v-if="!block.datasetId" class="flex flex-col items-center justify-center gap-3 py-16 text-center px-8">
          <svg class="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
          </svg>
          <p class="text-sm font-medium text-slate-500">Aucun dataset sélectionné</p>
          <p class="text-xs text-slate-400">Configurez d'abord la source de données dans l'onglet Données</p>
        </div>

        <!-- Body: bar/line -->
        <div v-else-if="needsXY" class="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-6">

          <!-- Axe X -->
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Axe X <span class="font-normal normal-case tracking-normal">— catégories</span></p>
            <p class="mb-2 text-[10px] text-slate-400">Colonne affichée sur l'axe horizontal</p>
            <ColumnButton
              :model-value="block.fieldMapping.xAxis ?? null"
              :block="block"
              placeholder="— Choisir une colonne —"
              @update:model-value="updateMapping('xAxis', $event as string)"
            />
          </div>

          <div class="border-t border-slate-100" />

          <!-- Axe Y -->
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Axe Y <span class="font-normal normal-case tracking-normal">— valeurs</span>
              <span v-if="yAxes.length >= 2" class="ml-2 min-w-4 h-4 px-1 rounded-full bg-blue-500 text-white text-[9px] font-bold">{{ yAxes.length }}</span>
            </p>
            <p class="mb-2 text-[10px] text-slate-400">
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
              @update:model-value="addYAxis($event as string)"
            />
          </div>

          <div class="border-t border-slate-100" />

          <!-- Série (only if single Y) -->
          <div v-if="!block.fieldMapping.yAxes?.length || block.fieldMapping.yAxes.length < 2">
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Série <span class="font-normal normal-case tracking-normal">— groupement</span></p>
            <p class="mb-2 text-[10px] text-slate-400">Chaque valeur unique de cette colonne devient une série sur le graphique</p>
            <ColumnButton
              :model-value="block.fieldMapping.series ?? null"
              :block="block"
              placeholder="— Série unique —"
              clearable
              @update:model-value="updateMapping('series', ($event ?? '') as string)"
            />
            <p v-if="block.fieldMapping.series" class="mt-1.5 text-[10px] text-slate-400">Actif — groupement par <strong class="font-mono">{{ block.fieldMapping.series }}</strong></p>
          </div>
        </div>

        <!-- Body: pie -->
        <div v-else-if="needsLabelVal" class="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Étiquettes</p>
            <p class="mb-2 text-[10px] text-slate-400">Noms des segments (généralement une colonne texte)</p>
            <ColumnButton :model-value="block.fieldMapping.label ?? null" :block="block" @update:model-value="updateMapping('label', $event as string)" />
          </div>
          <div class="border-t border-slate-100" />
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Valeurs</p>
            <p class="mb-2 text-[10px] text-slate-400">Taille des segments (colonne numérique)</p>
            <ColumnButton :model-value="block.fieldMapping.value ?? null" :block="block" @update:model-value="updateMapping('value', $event as string)" />
          </div>
        </div>

        <!-- Body: kpi -->
        <div v-else-if="needsValue" class="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          <div>
            <p class="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Valeur principale</p>
            <p class="mb-2 text-[10px] text-slate-400">Colonne numérique affichée en grand</p>
            <ColumnButton :model-value="block.fieldMapping.valueColumn ?? null" :block="block" @update:model-value="updateMapping('valueColumn', $event as string)" />
          </div>

          <div class="border-t border-slate-100" />

          <div>
            <p class="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Format</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="f in FORMAT_OPTIONS" :key="f.v"
                class="flex flex-col items-center rounded-xl border px-3 py-3 transition-all"
                :class="(block.config.format ?? 'number') === f.v
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'"
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

        <!-- Body: table info -->
        <div v-else-if="isTable" class="flex-1 overflow-y-auto px-5 py-5">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 leading-relaxed">
            Toutes les colonnes du dataset sont affichées dans le tableau. Pour personnaliser l'ordre, la largeur ou le format de chaque colonne, utilisez l'onglet <strong>Style</strong>.
          </div>
          <div v-if="schema" class="mt-4">
            <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Colonnes disponibles ({{ schema.columns.length }})</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="col in schema.columns.slice(0, 30)" :key="col.name" class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
                <span class="min-w-[18px] shrink-0 rounded px-1 text-center text-[9px] font-bold uppercase leading-[16px]" :class="TYPE_BADGE[col.type]?.cls ?? 'bg-slate-100 text-slate-500'">{{ TYPE_BADGE[col.type]?.label ?? '?' }}</span>
                <span class="font-mono text-[11px] text-slate-600">{{ col.name }}</span>
              </span>
              <span v-if="schema.columns.length > 30" class="flex items-center rounded-lg border border-dashed border-slate-200 px-2 py-1 text-[11px] text-slate-400">+{{ schema.columns.length - 30 }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex shrink-0 items-center justify-end border-t border-slate-100 px-5 py-3">
          <button class="rounded-xl bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity" @click="emit('close')">Terminé</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
