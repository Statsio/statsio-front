<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups, columnRefLabel, primarySourceId } from '@/lib/studio-columns'
import { blockDatasetIds } from '@/lib/studio-block-sources'
import type { StudioBlock, TableColumnFormat, TableCellRule, MapSizeRule, RuleCondition } from '@/types/studio'
import { ruleConditions } from '@/lib/studio-cell-rules'
import FieldColumns from '@/components/studio/fields/FieldColumns.vue'
import FieldValueLabels from '@/components/studio/fields/FieldValueLabels.vue'
import FieldColumnStyle from '@/components/studio/fields/FieldColumnStyle.vue'
import RuleConditionFields from '@/components/studio/fields/RuleConditionFields.vue'

const props = withDefaults(
  defineProps<{ block: StudioBlock; section?: 'columns' | 'rules' | 'sizeRules'; columnsHeading?: string }>(),
  { section: 'columns', columnsHeading: 'Colonnes affichées & ordre' },
)

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const fm = computed(() => props.block.fieldMapping)
const primaryId = computed(() => primarySourceId(props.block))
const hasSource = computed(() => Boolean(primaryId.value))
const groups = computed(() => blockColumnGroups(props.block, datasets))
/** Toutes les références de colonnes disponibles (union de toutes les sources). */
const allRefs = computed<string[]>(() =>
  groups.value.flatMap((g) => g.columns.map((c) => (g.isPrimary || !g.sourceId ? c.name : `${c.name}@${g.sourceId}`))),
)
const refLabel = (ref: string) => columnRefLabel(ref, props.block, datasets)

watch(
  () => blockDatasetIds(props.block).join('|'),
  () => blockDatasetIds(props.block).forEach((id) => datasets.loadSchema(id)),
  { immediate: true },
)

// ─── Colonnes affichées + libellés ─────────────────────────────────────────

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

// ─── Format / alignement par colonne ───────────────────────────────────────

const COL_FORMATS = [
  { v: '', l: 'Auto' }, { v: 'number', l: '123' }, { v: 'percent', l: '%' },
  { v: 'currency', l: '€' }, { v: 'mono', l: 'Mono' }, { v: 'text', l: 'Aa' },
] as const

function colFmt(col: string): TableColumnFormat {
  return fm.value.columnFormats?.[col] ?? {}
}
function setColFmt(col: string, patch: Partial<TableColumnFormat>) {
  const all: Record<string, TableColumnFormat> = { ...fm.value.columnFormats }
  const next: TableColumnFormat = { ...all[col], ...patch }
  const empty = !next.format && !next.align && !next.bold && !next.italic && !next.underline && next.showOnHover !== false
  if (empty) delete all[col]
  else all[col] = next
  studio.updateBlockFieldMapping(props.block.id, { columnFormats: Object.keys(all).length ? all : undefined })
}

// ─── Colonnes calculées ────────────────────────────────────────────────────

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

// ─── Mise en forme conditionnelle ──────────────────────────────────────────
// Une règle = une ou plusieurs conditions combinées en ET (`ruleConditions()` replie
// l'ancien schéma à plat sur ce tableau). Toute édition réécrit la règle au nouveau
// format `{ conditions, ... }`.

const RULE_COLORS = ['#059669', '#e11d48', '#7c3aed', '#2563eb', '#b45309']
function firstCondition(): RuleCondition {
  return { column: allTableColumns.value[0] ?? '', when: 'positive' }
}

const cellRules = computed(() => fm.value.cellRules ?? [])

function setRules(next: TableCellRule[]) {
  studio.updateBlockFieldMapping(props.block.id, { cellRules: next.length ? next : undefined })
}
function addRule() {
  setRules([...cellRules.value, { conditions: [firstCondition()], color: '#059669' }])
}
function updateRule(i: number, patch: Partial<TableCellRule>) {
  setRules(cellRules.value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
}
function removeRule(i: number) { setRules(cellRules.value.filter((_, idx) => idx !== i)) }

function addRuleCondition(i: number) {
  const r = cellRules.value[i]
  if (!r) return
  updateRule(i, { conditions: [...ruleConditions(r), firstCondition()] })
}
function updateRuleCondition(i: number, ci: number, patch: Partial<RuleCondition>) {
  const r = cellRules.value[i]
  if (!r) return
  updateRule(i, { conditions: ruleConditions(r).map((c, idx) => (idx === ci ? { ...c, ...patch } : c)) })
}
function removeRuleCondition(i: number, ci: number) {
  const r = cellRules.value[i]
  if (!r) return
  const conds = ruleConditions(r).filter((_, idx) => idx !== ci)
  if (conds.length) updateRule(i, { conditions: conds })
}

// ─── Carte : taille conditionnelle des marqueurs (même logique, conditions en ET) ──

const sizeRules = computed(() => fm.value.mapSizeRules ?? [])

function setSizeRules(next: MapSizeRule[]) {
  studio.updateBlockFieldMapping(props.block.id, { mapSizeRules: next.length ? next : undefined })
}
function addSizeRule() {
  setSizeRules([...sizeRules.value, { conditions: [firstCondition()], size: 14 }])
}
function updateSizeRule(i: number, patch: Partial<MapSizeRule>) {
  setSizeRules(sizeRules.value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
}
function removeSizeRule(i: number) { setSizeRules(sizeRules.value.filter((_, idx) => idx !== i)) }

function addSizeRuleCondition(i: number) {
  const r = sizeRules.value[i]
  if (!r) return
  updateSizeRule(i, { conditions: [...ruleConditions(r), firstCondition()] })
}
function updateSizeRuleCondition(i: number, ci: number, patch: Partial<RuleCondition>) {
  const r = sizeRules.value[i]
  if (!r) return
  updateSizeRule(i, { conditions: ruleConditions(r).map((c, idx) => (idx === ci ? { ...c, ...patch } : c)) })
}
function removeSizeRuleCondition(i: number, ci: number) {
  const r = sizeRules.value[i]
  if (!r) return
  const conds = ruleConditions(r).filter((_, idx) => idx !== ci)
  if (conds.length) updateSizeRule(i, { conditions: conds })
}
</script>

<template>
  <p v-if="!hasSource" class="py-4 text-center text-[12.5px] text-[var(--studio-faint)]">
    Connectez d'abord une source dans l'onglet « Données ».
  </p>

  <div v-else class="flex flex-col gap-4">
    <!-- ══ COLONNES AFFICHÉES + ORDRE + FORMAT ══ -->
    <template v-if="section === 'columns'">
      <div>
        <div class="mb-2.5 flex items-baseline justify-between gap-3">
          <span class="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">{{ props.columnsHeading }}</span>
          <button v-if="isCustomized" type="button" class="text-[11px] font-bold text-[var(--color-primary)]" @click="resetTableColumns">Réinitialiser</button>
        </div>
        <div class="flex flex-col gap-2">
          <div v-for="(col, i) in tableColumns" :key="col" class="flex flex-col gap-1.5">
            <div class="flex items-center gap-2">
            <span class="flex shrink-0 flex-col gap-0.5">
              <button type="button" class="flex h-[14px] w-[22px] items-center justify-center rounded-[5px] bg-[var(--studio-wash)] text-[9px] text-[var(--studio-muted)] disabled:opacity-30" :disabled="i === 0" @click="moveColumn(col, -1)">▲</button>
              <button type="button" class="flex h-[14px] w-[22px] items-center justify-center rounded-[5px] bg-[var(--studio-wash)] text-[9px] text-[var(--studio-muted)] disabled:opacity-30" :disabled="i === tableColumns.length - 1" @click="moveColumn(col, 1)">▼</button>
            </span>
            <span class="w-[80px] shrink-0 truncate rounded-md bg-[var(--studio-tag)] px-2 py-1.5 font-mono text-[10.5px] font-semibold text-[var(--studio-tag-ink)]" :title="refLabel(col)">{{ refLabel(col) }}</span>
            <input
              :value="columnLabels[col] ?? ''"
              type="text"
              class="studio-input min-w-0 flex-1 !py-2 !text-[12.5px]"
              :placeholder="refLabel(col)"
              @change="setColumnLabel(col, ($event.target as HTMLInputElement).value)"
            />
            <select
              class="studio-input shrink-0 !w-[56px] !py-2 !text-[11px]"
              :value="colFmt(col).format ?? ''"
              @change="setColFmt(col, { format: (($event.target as HTMLSelectElement).value || undefined) as TableColumnFormat['format'] })"
            >
              <option v-for="o in COL_FORMATS" :key="o.v" :value="o.v">{{ o.l }}</option>
            </select>
            <button type="button" class="shrink-0 text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)] disabled:opacity-30" :disabled="tableColumns.length <= 1" @click="toggleTableColumn(col)">✕</button>
            </div>
            <FieldValueLabels :block="block" :column-ref="col" />
            <FieldColumnStyle :block="block" :column-ref="col" />
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
          Ex. <code class="font-mono">{prix} - AVG(prix)</code> — <code class="font-mono">{col}</code> = valeur de ligne, agrégats <code class="font-mono">FN(colonne)</code>.
        </p>
        <div v-for="(c, i) in computedCols" :key="i" class="mb-2 flex items-center gap-2">
          <input
            :value="c.name"
            type="text"
            placeholder="Nom"
            class="studio-input !w-[100px] shrink-0 !py-2 !text-[12px]"
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
    </template>

    <!-- ══ MISE EN FORME CONDITIONNELLE (couleur) ══ -->
    <template v-else-if="section === 'rules'">
      <div>
        <div class="mb-2 flex items-baseline justify-between gap-3">
          <span class="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Règles</span>
          <button type="button" class="text-[11px] font-bold text-[var(--color-primary)]" :disabled="!allTableColumns.length" @click="addRule">+ Ajouter</button>
        </div>
        <p v-if="!cellRules.length" class="text-[11.5px] text-[var(--studio-faint)]">
          Colore une cellule selon la valeur d'une ou plusieurs colonnes (ET) : signe,
          min / max, seuil, comparaison texte, ou vs un agrégat (ex. <code class="font-mono">prix &gt; AVG(prix)</code>).
        </p>
        <div v-for="(r, i) in cellRules" :key="i" class="mb-2 flex flex-col gap-1.5 rounded-lg border border-[var(--studio-line)] p-2">
          <div v-for="(c, ci) in ruleConditions(r)" :key="ci" class="flex flex-wrap items-center gap-1.5">
            <span v-if="ci > 0" class="text-[10px] font-extrabold text-[var(--studio-faint)]">ET</span>
            <RuleConditionFields
              :condition="c"
              :columns="allTableColumns"
              :ref-label="refLabel"
              @update="(patch) => updateRuleCondition(i, ci, patch)"
            />
            <button
              v-if="ruleConditions(r).length > 1"
              type="button"
              class="text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)]"
              title="Retirer cette condition"
              @click="removeRuleCondition(i, ci)"
            >✕</button>
          </div>
          <button type="button" class="self-start text-[10.5px] font-bold text-[var(--color-primary)]" @click="addRuleCondition(i)">+ ET une condition</button>
          <div class="flex flex-wrap items-center gap-1.5 border-t border-[var(--studio-line)] pt-1.5">
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
            <button type="button" class="ml-auto text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)]" @click="removeRule(i)">Supprimer la règle</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ══ MISE EN FORME CONDITIONNELLE (taille, carte) ══ -->
    <template v-else>
      <div>
        <div class="mb-2 flex items-baseline justify-between gap-3">
          <span class="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[var(--studio-faint)]">Règles</span>
          <button type="button" class="text-[11px] font-bold text-[var(--color-primary)]" :disabled="!allTableColumns.length" @click="addSizeRule">+ Ajouter</button>
        </div>
        <p v-if="!sizeRules.length" class="text-[11.5px] text-[var(--studio-faint)]">
          Change le rayon d'un marqueur selon la valeur d'une ou plusieurs colonnes (ET) :
          signe, min / max, seuil, comparaison texte, ou vs un agrégat (ex. <code class="font-mono">prix &gt; AVG(prix)</code>).
        </p>
        <div v-for="(r, i) in sizeRules" :key="i" class="mb-2 flex flex-col gap-1.5 rounded-lg border border-[var(--studio-line)] p-2">
          <div v-for="(c, ci) in ruleConditions(r)" :key="ci" class="flex flex-wrap items-center gap-1.5">
            <span v-if="ci > 0" class="text-[10px] font-extrabold text-[var(--studio-faint)]">ET</span>
            <RuleConditionFields
              :condition="c"
              :columns="allTableColumns"
              :ref-label="refLabel"
              @update="(patch) => updateSizeRuleCondition(i, ci, patch)"
            />
            <button
              v-if="ruleConditions(r).length > 1"
              type="button"
              class="text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)]"
              title="Retirer cette condition"
              @click="removeSizeRuleCondition(i, ci)"
            >✕</button>
          </div>
          <button type="button" class="self-start text-[10.5px] font-bold text-[var(--color-primary)]" @click="addSizeRuleCondition(i)">+ ET une condition</button>
          <div class="flex flex-wrap items-center gap-1.5 border-t border-[var(--studio-line)] pt-1.5">
            <input
              type="number"
              min="2"
              max="60"
              placeholder="rayon"
              class="studio-input !w-[64px] !py-2 !text-[11px] [appearance:textfield]"
              :value="r.size"
              @change="updateSizeRule(i, { size: Number(($event.target as HTMLInputElement).value) || 0 })"
            />
            <button type="button" class="ml-auto text-[12px] text-[var(--studio-faint)] hover:text-[var(--color-error)]" @click="removeSizeRule(i)">Supprimer la règle</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
