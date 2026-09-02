<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups, columnRefLabel, primarySourceId } from '@/lib/studio-columns'
import { blockDatasetIds } from '@/lib/studio-block-sources'
import type { StudioBlock, AggregateFunction, TableColumnFormat, TableCellRule } from '@/types/studio'
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

const fm = computed(() => props.block.fieldMapping)
const primaryId = computed(() => primarySourceId(props.block))
const hasSource = computed(() => Boolean(primaryId.value))
const groups = computed(() => blockColumnGroups(props.block, datasets))
/** Toutes les références de colonnes disponibles (union de toutes les sources). */
const allRefs = computed<string[]>(() =>
  groups.value.flatMap((g) => g.columns.map((c) => (g.isPrimary ? c.name : `${c.name}@${g.sourceId}`))),
)
const refLabel = (ref: string) => columnRefLabel(ref, props.block, datasets)

watch(
  () => props.show,
  (open) => { if (open) blockDatasetIds(props.block).forEach((id) => datasets.loadSchema(id)) },
  { immediate: true },
)

const yAxes = computed<string[]>(() => {
  const axes = fm.value.yAxes
  if (axes?.length) return axes
  return fm.value.yAxis ? [fm.value.yAxis] : []
})

const AGG_OPTIONS: { value: AggregateFunction | ''; label: string }[] = [
  { value: '', label: 'Aucune' },
  { value: 'sum', label: 'Somme' },
  { value: 'avg', label: 'Moyenne' },
  { value: 'count', label: 'Nombre' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
]

/** Colonnes de valeur du bloc (celles auxquelles s'applique une fonction d'agrégation). */
const valueColumns = computed<string[]>(() => {
  if (needsXY.value) return yAxes.value
  if (needsLabelVal.value) return fm.value.value ? [fm.value.value] : []
  if (needsValue.value) return fm.value.valueColumn ? [fm.value.valueColumn] : []
  return []
})

function aggFor(col: string): AggregateFunction | undefined {
  return fm.value.aggregates?.find((a) => a.column === col)?.fn ?? fm.value.aggregate
}
/** Écrit la table `aggregates[]` (une entrée par colonne de valeur ayant une fonction). */
function setAggFor(col: string, fn: AggregateFunction | '') {
  const cur = new Map((fm.value.aggregates ?? []).map((a) => [a.column, a.fn as AggregateFunction | '']))
  cur.set(col, fn)
  const next = valueColumns.value
    .map((c) => ({ column: c, fn: (cur.get(c) ?? fm.value.aggregate ?? '') as AggregateFunction | '' }))
    .filter((e): e is { column: string; fn: AggregateFunction } => e.fn !== '')
  studio.updateBlockFieldMapping(props.block.id, { aggregates: next.length ? next : undefined, aggregate: undefined })
}

function set(key: string, value: string | undefined) {
  studio.updateBlockFieldMapping(props.block.id, { [key]: value || undefined })
}

function toggleYAxis(col: string) {
  const adding = !yAxes.value.includes(col)
  const next = adding ? [...yAxes.value, col] : yAxes.value.filter((c) => c !== col)
  studio.updateBlockFieldMapping(props.block.id, { yAxes: next.length ? next : undefined, yAxis: next[0] ?? undefined })
  // Nouvelle colonne de valeur : hérite de la fonction courante quand un agrégat par colonne existe déjà.
  const aggs = fm.value.aggregates
  if (adding && aggs?.length && !aggs.some((a) => a.column === col)) {
    setAggFor(col, aggs[0]!.fn)
  }
}

// ─── Tableau : colonnes affichées + libellés ────────────────────────────────

const tableColumns = computed<string[]>(() => (fm.value.columns?.length ? fm.value.columns : allRefs.value))
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

// ─── Tableau : format / alignement par colonne ──────────────────────────────

const COL_FORMATS = [
  { v: '', l: 'Auto' }, { v: 'number', l: '123' }, { v: 'percent', l: '%' },
  { v: 'currency', l: '€' }, { v: 'mono', l: 'Mono' }, { v: 'text', l: 'Aa' },
] as const
const ALIGN_ICON: Record<string, string> = { left: '⇤', center: '↔', right: '⇥' }

function colFmt(col: string): TableColumnFormat {
  return fm.value.columnFormats?.[col] ?? {}
}
function setColFmt(col: string, patch: Partial<TableColumnFormat>) {
  const all: Record<string, TableColumnFormat> = { ...fm.value.columnFormats }
  const next: TableColumnFormat = { ...all[col], ...patch }
  if (!next.format && !next.align) delete all[col]
  else all[col] = next
  studio.updateBlockFieldMapping(props.block.id, { columnFormats: Object.keys(all).length ? all : undefined })
}
function cycleAlign(col: string) {
  const order = [undefined, 'left', 'center', 'right'] as const
  const cur = colFmt(col).align
  setColFmt(col, { align: order[(order.indexOf(cur ?? undefined) + 1) % order.length] })
}

// ─── Tableau : colonnes calculées ──────────────────────────────────────────

const computedCols = computed(() => fm.value.computedColumns ?? [])
const allTableColumns = computed(() => [...tableColumns.value, ...computedCols.value.map((c) => c.name).filter(Boolean)])

function setComputed(next: { name: string; expression: string }[]) {
  studio.updateBlockFieldMapping(props.block.id, { computedColumns: next.length ? next : undefined })
}
function addComputed() { setComputed([...computedCols.value, { name: '', expression: '' }]) }
function updateComputed(i: number, patch: Partial<{ name: string; expression: string }>) {
  setComputed(computedCols.value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
}
function removeComputed(i: number) { setComputed(computedCols.value.filter((_, idx) => idx !== i)) }

// ─── Tableau : mise en forme conditionnelle ─────────────────────────────────

const cellRules = computed(() => fm.value.cellRules ?? [])
const RULE_WHENS = [
  { v: 'positive', l: 'positif' }, { v: 'negative', l: 'négatif' },
  { v: 'gt', l: '> seuil' }, { v: 'lt', l: '< seuil' },
  { v: 'top', l: 'max colonne' }, { v: 'bottom', l: 'min colonne' },
] as const
const RULE_COLORS = ['#059669', '#e11d48', '#7c3aed', '#2563eb', '#b45309']

function setRules(next: TableCellRule[]) {
  studio.updateBlockFieldMapping(props.block.id, { cellRules: next.length ? next : undefined })
}
function addRule() {
  setRules([...cellRules.value, { column: allTableColumns.value[0] ?? '', when: 'positive', color: '#059669' }])
}
function updateRule(i: number, patch: Partial<TableCellRule>) {
  setRules(cellRules.value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
}
function removeRule(i: number) { setRules(cellRules.value.filter((_, idx) => idx !== i)) }

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
    <p v-if="!hasSource" class="py-10 text-center text-[13px] text-[var(--studio-faint)]">
      Connectez d'abord une source dans l'onglet « Données ».
    </p>

    <template v-else>
      <!-- ── BAR / LINE ── -->
      <template v-if="needsXY">
        <FieldColumns
          label="Axe X — catégorie"
          :groups="groups"
          :primary-source-id="primaryId"
          :selected="fm.xAxis ?? null"
          @pick="set('xAxis', $event)"
        />
        <div>
          <FieldColumns
            label="Axe Y — valeurs"
            hint="cliquez pour ajouter / retirer"
            :groups="groups"
            :primary-source-id="primaryId"
            :selected="yAxes"
            @pick="toggleYAxis"
          />
          <div v-if="valueColumns.length" class="mt-2.5">
            <p class="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Agrégation par colonne</p>
            <div class="flex flex-col gap-1.5">
              <div v-for="col in valueColumns" :key="col" class="flex items-center gap-2">
                <span class="min-w-0 flex-1 truncate font-mono text-[11.5px] text-[var(--studio-muted)]">{{ refLabel(col) }}</span>
                <select
                  class="studio-input shrink-0 !w-[108px] !py-1.5 !text-[11px]"
                  :value="aggFor(col) ?? ''"
                  @change="setAggFor(col, ($event.target as HTMLSelectElement).value as AggregateFunction | '')"
                >
                  <option v-for="o in AGG_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <FieldColumns
          label="Série de regroupement"
          :groups="groups"
          :primary-source-id="primaryId"
          :selected="fm.series ?? null"
          none-label="Aucune"
          @pick="set('series', $event)"
          @none="set('series', undefined)"
        />
      </template>

      <!-- ── PIE ── -->
      <template v-else-if="needsLabelVal">
        <FieldColumns label="Étiquettes" :groups="groups" :primary-source-id="primaryId" :selected="fm.label ?? null" @pick="set('label', $event)" />
        <div>
          <FieldColumns label="Valeurs" :groups="groups" :primary-source-id="primaryId" :selected="fm.value ?? null" @pick="set('value', $event)" />
          <div v-if="valueColumns.length" class="mt-2.5">
            <p class="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Agrégation par colonne</p>
            <div class="flex flex-col gap-1.5">
              <div v-for="col in valueColumns" :key="col" class="flex items-center gap-2">
                <span class="min-w-0 flex-1 truncate font-mono text-[11.5px] text-[var(--studio-muted)]">{{ refLabel(col) }}</span>
                <select
                  class="studio-input shrink-0 !w-[108px] !py-1.5 !text-[11px]"
                  :value="aggFor(col) ?? ''"
                  @change="setAggFor(col, ($event.target as HTMLSelectElement).value as AggregateFunction | '')"
                >
                  <option v-for="o in AGG_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ── KPI ── -->
      <template v-else-if="needsValue">
        <div>
          <label class="mb-1.5 block text-[12.5px] font-bold text-[var(--studio-ink)]">Valeur calculée (avancé)</label>
          <input
            type="text"
            class="w-full rounded-[10px] border-[1.5px] border-[var(--studio-line-strong)] px-3 py-2.5 font-mono text-[12.5px] text-[var(--studio-ink)] focus:border-[var(--color-primary)] focus:outline-none"
            placeholder="ex. AVG(prix@7) * 50"
            :value="block.config.valueExpression ?? ''"
            @input="studio.updateBlockConfig(block.id, { valueExpression: ($event.target as HTMLInputElement).value })"
          />
          <p class="mt-1 text-[11px] leading-relaxed text-[var(--studio-faint)]">
            Agrégats <code class="font-mono">AVG/SUM/MIN/MAX/COUNT(colonne@id)</code>, arithmétique,
            filtres <code class="font-mono">| col = $param</code>. Prioritaire sur la colonne ci-dessous.
          </p>
        </div>
        <div v-if="!block.config.valueExpression">
          <FieldColumns label="Valeur principale" :groups="groups" :primary-source-id="primaryId" :selected="fm.valueColumn ?? null" @pick="set('valueColumn', $event)" />
          <div v-if="valueColumns.length" class="mt-2.5">
            <p class="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Agrégation par colonne</p>
            <div class="flex flex-col gap-1.5">
              <div v-for="col in valueColumns" :key="col" class="flex items-center gap-2">
                <span class="min-w-0 flex-1 truncate font-mono text-[11.5px] text-[var(--studio-muted)]">{{ refLabel(col) }}</span>
                <select
                  class="studio-input shrink-0 !w-[108px] !py-1.5 !text-[11px]"
                  :value="aggFor(col) ?? ''"
                  @change="setAggFor(col, ($event.target as HTMLSelectElement).value as AggregateFunction | '')"
                >
                  <option v-for="o in AGG_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </div>
            </div>
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
              <span class="w-[92px] shrink-0 truncate rounded-md bg-[var(--studio-tag)] px-2 py-1.5 font-mono text-[10.5px] font-semibold text-[var(--studio-tag-ink)]" :title="refLabel(col)">{{ refLabel(col) }}</span>
              <input
                :value="columnLabels[col] ?? ''"
                type="text"
                class="studio-input min-w-0 flex-1 !py-2 !text-[12.5px]"
                :placeholder="refLabel(col)"
                @change="setColumnLabel(col, ($event.target as HTMLInputElement).value)"
              />
              <select
                class="studio-input shrink-0 !w-[58px] !py-2 !text-[11px]"
                :value="colFmt(col).format ?? ''"
                @change="setColFmt(col, { format: (($event.target as HTMLSelectElement).value || undefined) as TableColumnFormat['format'] })"
              >
                <option v-for="o in COL_FORMATS" :key="o.v" :value="o.v">{{ o.l }}</option>
              </select>
              <button
                type="button"
                class="shrink-0 rounded-md border border-[var(--studio-line-strong)] px-1.5 py-1.5 text-[11px] text-[var(--studio-muted)]"
                :title="`Alignement : ${colFmt(col).align ?? 'auto'}`"
                @click="cycleAlign(col)"
              >{{ ALIGN_ICON[colFmt(col).align ?? ''] ?? 'A' }}</button>
              <button type="button" class="shrink-0 text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)] disabled:opacity-30" :disabled="tableColumns.length <= 1" @click="toggleTableColumn(col)">✕</button>
            </div>
          </div>
        </div>
        <FieldColumns
          label="Ajouter / retirer une colonne"
          :groups="groups"
          :primary-source-id="primaryId"
          :selected="tableColumns"
          @pick="toggleTableColumn"
        />

        <!-- Colonnes calculées -->
        <div>
          <div class="mb-2 flex items-baseline justify-between gap-3">
            <span class="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Colonnes calculées</span>
            <button type="button" class="text-[11px] font-bold text-[var(--color-primary)]" @click="addComputed">+ Ajouter</button>
          </div>
          <p v-if="!computedCols.length" class="text-[11.5px] text-[var(--studio-faint)]">
            Ex. <code class="font-mono">{prix} - AVG(prix)</code> — <code class="font-mono">{col}</code> = valeur de ligne, agrégats <code class="font-mono">FN(colonne)</code> (ajoutez <code class="font-mono">@source</code> pour une source jointe).
          </p>
          <div v-for="(c, i) in computedCols" :key="i" class="mb-2 flex items-center gap-2">
            <input
              :value="c.name"
              type="text"
              placeholder="Nom"
              class="studio-input !w-[110px] shrink-0 !py-2 !text-[12px]"
              @change="updateComputed(i, { name: ($event.target as HTMLInputElement).value })"
            />
            <input
              :value="c.expression"
              type="text"
              placeholder="{a} - {b}"
              class="studio-input min-w-0 flex-1 !py-2 font-mono !text-[11.5px]"
              @change="updateComputed(i, { expression: ($event.target as HTMLInputElement).value })"
            />
            <button type="button" class="shrink-0 text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)]" @click="removeComputed(i)">✕</button>
          </div>
        </div>

        <!-- Mise en forme conditionnelle -->
        <div>
          <div class="mb-2 flex items-baseline justify-between gap-3">
            <span class="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Mise en forme conditionnelle</span>
            <button type="button" class="text-[11px] font-bold text-[var(--color-primary)]" :disabled="!allTableColumns.length" @click="addRule">+ Ajouter</button>
          </div>
          <div v-for="(r, i) in cellRules" :key="i" class="mb-2 flex flex-wrap items-center gap-1.5">
            <select class="studio-input !w-[120px] !py-2 !text-[11px]" :value="r.column" @change="updateRule(i, { column: ($event.target as HTMLSelectElement).value })">
              <option v-for="c in allTableColumns" :key="c" :value="c">{{ refLabel(c) }}</option>
            </select>
            <select class="studio-input !w-[128px] !py-2 !text-[11px]" :value="r.when" @change="updateRule(i, { when: ($event.target as HTMLSelectElement).value as TableCellRule['when'] })">
              <option v-for="w in RULE_WHENS" :key="w.v" :value="w.v">{{ w.l }}</option>
            </select>
            <input
              v-if="r.when === 'gt' || r.when === 'lt'"
              type="number"
              class="studio-input !w-[64px] !py-2 !text-[11px]"
              :value="r.value ?? ''"
              @change="updateRule(i, { value: Number(($event.target as HTMLInputElement).value) })"
            />
            <span class="flex gap-1">
              <button
                v-for="hex in RULE_COLORS"
                :key="hex"
                type="button"
                class="h-5 w-5 rounded-full border-2"
                :class="r.color === hex ? 'border-[var(--studio-ink)]' : 'border-white'"
                :style="{ background: hex }"
                @click="updateRule(i, { color: hex })"
              />
            </span>
            <button type="button" class="rounded border border-[var(--studio-line-strong)] px-1.5 py-1 text-[10px] font-bold" :class="r.bold ? 'bg-[var(--studio-ink)] text-white' : 'text-[var(--studio-muted)]'" @click="updateRule(i, { bold: !r.bold })">G</button>
            <button type="button" class="text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)]" @click="removeRule(i)">✕</button>
          </div>
        </div>
      </template>
    </template>
  </StudioSubModal>
</template>
