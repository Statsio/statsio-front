<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useActiveEditor } from '@/composables/useActiveEditor'
import type { BlockFilter, BlockJoin, DatasetColumn, DatasetMeta, StudioBlock } from '@/types/studio'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import FieldColumnChips from '@/components/studio/fields/FieldColumnChips.vue'
import DataSourcePickerModal from '@/components/studio/ui/DataSourcePickerModal.vue'
import FiltersModal from '@/components/studio/ui/FiltersModal.vue'
import ColumnsMappingModal from '@/components/studio/ui/ColumnsMappingModal.vue'

const props = defineProps<{ block: StudioBlock; activeTab: string }>()
const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const { setActiveInput } = useActiveEditor()

const block = computed(() => props.block)

// ─── Accordion state ─────────────────────────────────────────────────────────
const openSections = ref<Set<string>>(new Set<string>())
function toggle(id: string) {
  const s = new Set(openSections.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openSections.value = s
}
const open = (id: string) => openSections.value.has(id)
watch(() => props.block.id, () => { openSections.value = new Set<string>() })

// ─── Config / mapping ────────────────────────────────────────────────────────
function updateConfig(key: string, value: unknown) { studio.updateBlockConfig(props.block.id, { [key]: value }) }
function updateMapping(key: string, value: string) { studio.updateBlockFieldMapping(props.block.id, { [key]: value }) }

const schema = computed(() => props.block.datasetId ? (datasets.getSchema(props.block.datasetId) ?? null) : null)
const columnNames = computed(() => schema.value?.columns.map((c: DatasetColumn) => c.name) ?? [])

const joins = computed<BlockJoin[]>(() => props.block.joins ?? [])

/** Colonnes de la source principale + des jointures, à plat (pour les sélecteurs). */
const allColumnNames = computed<string[]>(() => {
  const names = new Set<string>(columnNames.value)
  joins.value.forEach((j: BlockJoin) => {
    datasets.getSchema(j.datasetId)?.columns.forEach((c: DatasetColumn) => names.add(c.name))
  })
  return [...names]
})
function joinSchema(joinIdx: number) {
  const id = joins.value[joinIdx]?.datasetId
  return id ? (datasets.getSchema(id) ?? null) : null
}
function updateJoin(i: number, patch: Partial<BlockJoin>) {
  const updated = joins.value.map((j: BlockJoin, idx: number) => idx === i ? { ...j, ...patch } : j)
  studio.updateBlockJoins(props.block.id, updated)
  if (patch.datasetId) datasets.loadSchema(patch.datasetId)
}
function updateMappingWithJoinSync(key: string, value: string) {
  updateMapping(key, value)
  if (!value || columnNames.value.includes(value)) return
  joins.value.forEach((j: BlockJoin, i: number) => {
    const jCols = joinSchema(i)?.columns.map((c: DatasetColumn) => c.name) ?? []
    if (jCols.includes(value) && !j.columns.includes(value)) updateJoin(i, { columns: [...j.columns, value] })
  })
}

watch(() => props.block.datasetId, (id) => { if (id) datasets.loadSchema(id) }, { immediate: true })
watch(() => props.block.id, () => {
  joins.value.forEach((j: BlockJoin) => { if (j.datasetId) datasets.loadSchema(j.datasetId) })
}, { immediate: true })

const needsXY = computed(() => props.block.type === 'bar' || props.block.type === 'line')
const needsLabelVal = computed(() => props.block.type === 'pie')
const needsValue = computed(() => props.block.type === 'kpi')
const isTable = computed(() => props.block.type === 'table')

const yAxes = computed<string[]>(() => {
  const axes = props.block.fieldMapping.yAxes
  if (axes?.length) return axes
  const single = props.block.fieldMapping.yAxis
  return single ? [single] : []
})

const CHART_COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316']

const filters = computed<BlockFilter[]>(() => props.block.filters ?? [])
const compFilters = computed<BlockFilter[]>(() => props.block.comparisonFilters ?? [])

// ─── Sub-modals ──────────────────────────────────────────────────────────────
const showDataSourceModal = ref(false)
const showFiltersModal = ref(false)
const showCompFiltersModal = ref(false)
const showColumnsMappingModal = ref(false)

// ─── FieldPicker summaries ───────────────────────────────────────────────────
const datasetName = computed(() =>
  props.block.datasetId
    ? (datasets.readyDatasets.find((d: DatasetMeta) => d.id === props.block.datasetId)?.name ?? 'Source sélectionnée')
    : 'Aucune source',
)
const sourceSummary = computed(() => {
  if (!props.block.datasetId) return 'Aucune source sélectionnée'
  return datasetName.value + (joins.value.length ? ` · ${joins.value.length} jointure${joins.value.length > 1 ? 's' : ''}` : '')
})
const columnsSummary = computed(() => {
  const fm = props.block.fieldMapping ?? {}
  if (needsXY.value) {
    const parts: string[] = []
    if (fm.xAxis) parts.push(`X : ${fm.xAxis}`)
    if (yAxes.value.length) parts.push(`Y : ${yAxes.value.slice(0, 2).join(', ')}${yAxes.value.length > 2 ? '…' : ''}`)
    return parts.join(' · ') || 'Configurer les axes'
  }
  if (needsLabelVal.value) return (fm.label || fm.value) ? `${fm.label ?? '?'} / ${fm.value ?? '?'}` : 'Configurer étiquettes et valeurs'
  if (needsValue.value) return fm.valueColumn ? `${(fm.aggregate ?? '').toUpperCase()} (${fm.valueColumn})` : 'Configurer la valeur'
  if (isTable.value) return fm.columns?.length ? `${fm.columns.length} colonne${fm.columns.length > 1 ? 's' : ''} affichée${fm.columns.length > 1 ? 's' : ''}` : 'Toutes les colonnes affichées'
  return 'Toutes les colonnes affichées'
})
const filtersSummary = computed(() =>
  filters.value.length ? `${filters.value.length} filtre${filters.value.length > 1 ? 's' : ''} appliqué${filters.value.length > 1 ? 's' : ''}` : 'Aucun filtre',
)
const compFiltersSummary = computed(() =>
  compFilters.value.length ? `${compFilters.value.length} règle${compFilters.value.length > 1 ? 's' : ''} de comparaison` : 'Aucune règle de comparaison',
)
</script>
<template>
  <div>

        <!-- ── Tab: Données ── -->
        <template v-if="activeTab === 'data'">

          <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
            <FieldPicker
              label="Source"
              :value="sourceSummary"
              action="Changer"
              @open="showDataSourceModal = true"
            />
            <DataSourcePickerModal :show="showDataSourceModal" :block="block" @close="showDataSourceModal = false" />

            <template v-if="block.datasetId">
              <FieldPicker
                label="Colonnes"
                :value="columnsSummary"
                action="Configurer"
                @open="showColumnsMappingModal = true"
              />
              <ColumnsMappingModal :show="showColumnsMappingModal" :block="block" @close="showColumnsMappingModal = false" />
            </template>
          </div>

        </template>

        <!-- ── Tab: Filtres ── -->
        <template v-if="activeTab === 'filters'">

          <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
            <FieldNote v-if="!block.datasetId">Connectez d'abord une source dans l'onglet Données.</FieldNote>
            <template v-else>
              <FieldPicker
                label="Filtres"
                :value="filtersSummary"
                :action="filters.length ? 'Modifier' : 'Ajouter'"
                @open="showFiltersModal = true"
              />
              <FiltersModal :show="showFiltersModal" :block="block" mode="primary" @close="showFiltersModal = false" />
              <FieldNote>Les filtres s'appliquent avant l'agrégation et se cumulent avec ceux de la source.</FieldNote>
            </template>
          </div>

          <!-- ── Limite ── -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('limit')">
              <span>Limite</span>
              <div class="flex items-center gap-2">
                <span v-if="block.config.rowLimit" class="text-xs font-bold text-[var(--color-primary)]">
                  {{ block.config.rowLimit }} lignes
                </span>
                <span v-else-if="block.config.distinctColumn" class="text-xs font-bold text-[var(--color-primary)]">
                  distinct
                </span>
                <svg class="chevron" :class="open('limit') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('limit')" class="accordion-body flex flex-col gap-1.5">
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100000"
                  placeholder="Illimité"
                  class="cfg-input flex-1 [appearance:textfield]"
                  :value="block.config.rowLimit ?? ''"
                  @input="updateConfig('rowLimit', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
                />
                <button
                  v-if="block.config.rowLimit"
                  class="text-[11px] text-[var(--studio-faint)] hover:text-red-400 transition-colors shrink-0"
                  @click="updateConfig('rowLimit', null)"
                >↺</button>
              </div>
              <p class="text-[11px] text-[var(--studio-faint)] leading-relaxed">Tronque les résultats au nombre de lignes souhaité.</p>
            </div>
          </div>

          <!-- ── Distinct ── -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('distinct')">
              <span>Distinct</span>
              <div class="flex items-center gap-2">
                <span v-if="block.config.distinctColumn" class="text-xs font-bold text-[var(--color-primary)] truncate max-w-[80px]">
                  {{ block.config.distinctColumn }}
                </span>
                <svg class="chevron" :class="open('distinct') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('distinct')" class="accordion-body flex flex-col gap-1.5">
              <FieldColumnChips
                :model-value="block.config.distinctColumn ?? null"
                :columns="allColumnNames"
                none-label="Aucun"
                @update:model-value="updateConfig('distinctColumn', $event || null)"
              />
              <p class="text-[11px] text-[var(--studio-faint)] leading-relaxed">Garde une seule ligne par valeur unique de la colonne sélectionnée.</p>
            </div>
          </div>

          <!-- ── Ordre d'affichage ── -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('sort')">
              <span>Ordre d'affichage</span>
              <div class="flex items-center gap-2">
                <span v-if="block.config.sortColumn" class="text-xs font-bold text-[var(--color-primary)] truncate max-w-[80px]">
                  {{ block.config.sortColumn }} {{ block.config.sortDirection === 'desc' ? '↓' : '↑' }}
                </span>
                <svg class="chevron" :class="open('sort') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('sort')" class="accordion-body flex flex-col gap-3">

              <!-- Colonne de tri -->
              <FieldColumnChips
                label="Colonne"
                :model-value="block.config.sortColumn ?? null"
                :columns="allColumnNames"
                none-label="Aucun tri"
                @update:model-value="updateConfig('sortColumn', $event || null); if (!$event) updateConfig('sortDirection', null)"
              />

              <!-- Direction -->
              <div v-if="block.config.sortColumn" class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-[var(--studio-muted)]">Direction</label>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    class="flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-colors"
                    :class="(block.config.sortDirection ?? 'asc') === 'asc' ? 'cfg-active' : 'cfg-inactive'"
                    @click="updateConfig('sortDirection', 'asc')"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                    </svg>
                    Croissant
                  </button>
                  <button
                    class="flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-colors"
                    :class="block.config.sortDirection === 'desc' ? 'cfg-active' : 'cfg-inactive'"
                    @click="updateConfig('sortDirection', 'desc')"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21l3.75-3.75" />
                    </svg>
                    Décroissant
                  </button>
                </div>
              </div>

            </div>
          </div>

        </template>

        <!-- ── Tab: Comparaison (KPI) ── -->
        <template v-if="activeTab === 'comparison'">

          <div v-if="!block.datasetId" class="p-4 text-xs text-[var(--studio-faint)] text-center">Connectez d'abord une source dans l'onglet Données.</div>
          <template v-else>

            <!-- Colonne de référence -->
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('comp-ref')">
                <span>Colonne de référence</span>
                <svg class="chevron" :class="open('comp-ref') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div v-show="open('comp-ref')" class="accordion-body">
                <p class="text-[11px] text-[var(--studio-faint)] mb-2 leading-relaxed">Par défaut, même colonne que la valeur principale.</p>
                <FieldColumnChips
                  :model-value="block.fieldMapping.comparisonColumn ?? null"
                  :columns="allColumnNames"
                  none-label="Même que la valeur"
                  @update:model-value="updateMappingWithJoinSync('comparisonColumn', ($event ?? '') as string)"
                />
              </div>
            </div>

            <!-- Filtres de comparaison → modal -->
            <div class="px-4 pb-1 pt-1">
              <FieldPicker
                label="Filtres de comparaison"
                :value="compFiltersSummary"
                :action="compFilters.length ? 'Modifier' : 'Configurer'"
                @open="showCompFiltersModal = true"
              />
              <FiltersModal :show="showCompFiltersModal" :block="block" mode="comparison" @close="showCompFiltersModal = false" />
            </div>

            <!-- Format d'écart -->
            <div class="accordion-item">
              <button class="accordion-header" @click="toggle('comp-format')">
                <span>Affichage de l'écart</span>
                <svg class="chevron" :class="open('comp-format') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <div v-show="open('comp-format')" class="accordion-body flex flex-col gap-1.5">
                <button v-for="opt in [
                  { v: 'percent',  l: 'Pourcentage', ex: '+12,5 %',  desc: 'Variation relative' },
                  { v: 'number',   l: 'Nombre',      ex: '+1 250',   desc: 'Différence absolue' },
                  { v: 'currency', l: 'Devise (€)',   ex: '+1 250 €', desc: 'Différence en euros' },
                ]" :key="opt.v"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left"
                  :class="(block.config.comparisonFormat ?? 'percent') === opt.v ? 'cfg-active border-2' : 'cfg-inactive'"
                  @click="updateConfig('comparisonFormat', opt.v)">
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold">{{ opt.l }}</p>
                    <p class="text-[10px] opacity-60">{{ opt.desc }}</p>
                  </div>
                  <code class="text-[11px] font-mono shrink-0 opacity-60">{{ opt.ex }}</code>
                </button>
              </div>
            </div>

          </template>

        </template>

        <!-- ── Tab: Style ── -->
        <template v-if="activeTab === 'style'">

          <!-- Titre -->
          <div class="accordion-item">
            <button class="accordion-header" @click="toggle('title')">
              <span>Titre du bloc</span>
              <svg class="chevron" :class="open('title') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('title')" class="accordion-body">
              <input
                type="text"
                class="cfg-input"
                placeholder="Ex : Évolution des ventes"
                :value="block.config.title ?? ''"
                @focus="setActiveInput($event.target as HTMLInputElement)"
                @input="updateConfig('title', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <!-- Orientation (bar) -->
          <div v-if="block.type === 'bar'" class="accordion-item">
            <button class="accordion-header" @click="toggle('orientation')">
              <span>Orientation</span>
              <svg class="chevron" :class="open('orientation') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('orientation')" class="accordion-body">
              <div class="grid grid-cols-2 gap-2">
                <button v-for="o in [
                  { v: 'vertical',   l: 'Vertical',   icon: 'M3 13.5V21h4.5v-7.5H3zm6.75-9V21H14.25V4.5H9.75zm6.75 4.5V21H21v-12h-4.5z' },
                  { v: 'horizontal', l: 'Horizontal',  icon: 'M4.5 3v4.5H21V3H4.5zm0 6.75v4.5H15v-4.5H4.5zm0 6.75V21H10.5v-4.5H4.5z' },
                ]" :key="o.v"
                  class="py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors"
                  :class="(block.config.orientation ?? 'vertical') === o.v ? 'cfg-active' : 'cfg-inactive'"
                  @click="updateConfig('orientation', o.v)">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" :d="o.icon" /></svg>
                  <span class="text-[11px] font-semibold">{{ o.l }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Options barre (bar) -->
          <div v-if="block.type === 'bar'" class="accordion-item">
            <button class="accordion-header" @click="toggle('bar-opts')">
              <span>Options</span>
              <svg class="chevron" :class="open('bar-opts') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('bar-opts')" class="accordion-body flex flex-col gap-3">
              <div class="toggle-row" @click="updateConfig('showValueLabels', !block.config.showValueLabels)">
                <span class="text-sm text-[var(--studio-ink)]">Afficher les valeurs sur les barres</span>
                <div class="toggle" :class="block.config.showValueLabels ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.showValueLabels ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div class="toggle-row" @click="updateConfig('logScale', !block.config.logScale)">
                <div>
                  <span class="text-sm text-[var(--studio-ink)]">Échelle logarithmique</span>
                  <p class="text-[11px] text-[var(--studio-faint)] mt-0.5">Garde les petites valeurs visibles quand l'écart avec les plus grandes est important</p>
                </div>
                <div class="toggle shrink-0" :class="block.config.logScale ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.logScale ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-[var(--studio-muted)] mb-1.5 block">Style d'affichage</label>
                <div class="grid grid-cols-2 gap-2">
                  <button v-for="o in [
                    { v: 'chart',    l: 'Graphique' },
                    { v: 'progress', l: 'Liste de progression' },
                  ]" :key="o.v"
                    class="py-2.5 rounded-xl border text-[11px] font-semibold transition-colors"
                    :class="(block.config.barStyle ?? 'chart') === o.v ? 'cfg-active' : 'cfg-inactive'"
                    @click="updateConfig('barStyle', o.v)">
                    {{ o.l }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Options ligne (line) -->
          <div v-if="block.type === 'line'" class="accordion-item">
            <button class="accordion-header" @click="toggle('line-opts')">
              <span>Options</span>
              <svg class="chevron" :class="open('line-opts') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('line-opts')" class="accordion-body flex flex-col gap-3">
              <div class="toggle-row" @click="updateConfig('smooth', !block.config.smooth)">
                <span class="text-sm text-[var(--studio-ink)]">Courbe lisse</span>
                <div class="toggle" :class="block.config.smooth ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.smooth ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-[var(--studio-muted)] mb-1.5 block">Pastille de tendance (optionnel)</label>
                <input
                  :value="block.config.trendLabel ?? ''"
                  type="text"
                  placeholder="Ex: +2.1 pts vs 2022 à 12h"
                  class="cfg-input"
                  @input="updateConfig('trendLabel', ($event.target as HTMLInputElement).value)"
                />
              </div>
              <div v-if="block.config.trendLabel" class="grid grid-cols-2 gap-2">
                <button v-for="o in [
                  { v: 'up',   l: '▲ Hausse' },
                  { v: 'down', l: '▼ Baisse' },
                ]" :key="o.v"
                  class="py-2.5 rounded-xl border text-[11px] font-semibold transition-colors"
                  :class="(block.config.trendDirection ?? 'up') === o.v ? 'cfg-active' : 'cfg-inactive'"
                  @click="updateConfig('trendDirection', o.v)">
                  {{ o.l }}
                </button>
              </div>
            </div>
          </div>

          <!-- Options tableau (table) -->
          <div v-if="isTable" class="accordion-item">
            <button class="accordion-header" @click="toggle('table-opts')">
              <span>Options</span>
              <svg class="chevron" :class="open('table-opts') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div v-show="open('table-opts')" class="accordion-body flex flex-col gap-2">
              <div class="toggle-row" @click="updateConfig('sortable', !block.config.sortable)">
                <span class="text-sm text-[var(--studio-ink)]">Colonnes triables</span>
                <div class="toggle" :class="block.config.sortable ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.sortable ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
              <div class="toggle-row" @click="updateConfig('showPagination', !block.config.showPagination)">
                <span class="text-sm text-[var(--studio-ink)]">Pagination</span>
                <div class="toggle" :class="block.config.showPagination ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.showPagination ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>
            </div>
          </div>

          <!-- Couleur principale (bar/line non multi-séries) -->
          <div v-if="(block.type === 'bar' || block.type === 'line') && !block.fieldMapping.series" class="accordion-item">
            <button class="accordion-header" @click="toggle('color')">
              <span>Couleur principale</span>
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full border border-white shadow-sm" :style="{ backgroundColor: block.config.colors?.[0] ?? '#8b5cf6' }" />
                <svg class="chevron" :class="open('color') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('color')" class="accordion-body">
              <div class="flex gap-2 flex-wrap">
                <button v-for="color in CHART_COLORS" :key="color"
                  class="w-7 h-7 rounded-full border-[3px] transition-all hover:scale-110"
                  :style="{ backgroundColor: color }"
                  :class="(block.config.colors?.[0] ?? '#8b5cf6') === color ? 'border-white outline outline-2 outline-slate-700 scale-110' : 'border-white shadow-sm'"
                  @click="updateConfig('colors', [color])" />
              </div>
            </div>
          </div>

        </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

/* ── Accordion ── */
.accordion-item {
  @apply border-b border-[var(--studio-line)] last:border-0;
}
.accordion-header {
  @apply w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors;
  @apply text-[10.5px] font-extrabold uppercase tracking-[0.07em];
  color: var(--studio-faint);
}
.accordion-header:hover {
  background: var(--studio-note);
}
.accordion-body {
  @apply px-4 pb-4;
}
.chevron {
  @apply w-3.5 h-3.5 transition-transform duration-150 shrink-0;
  color: var(--studio-faint);
}

/* ── Filter card ── */
.filter-card {
  @apply flex flex-col p-3;
  border-radius: 12px;
  border: 1px solid var(--studio-line);
  background: #fff;
}

/* ── Form controls ── */
.cfg-label {
  @apply flex items-center mb-[7px] text-[12.5px] font-bold;
  color: var(--studio-ink);
}
.cfg-select,
.cfg-input {
  @apply w-full;
  box-sizing: border-box;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid var(--studio-line-strong);
  font-size: 13px;
  color: var(--studio-ink);
  background: #fff;
}
.cfg-select-sm,
.cfg-input-sm {
  @apply w-full;
  box-sizing: border-box;
  padding: 9px 11px;
  border-radius: 9px;
  border: 1.5px solid var(--studio-line-strong);
  font-size: 12px;
  color: var(--studio-ink);
  background: #fff;
}
.cfg-select:focus,
.cfg-select-sm:focus,
.cfg-input:focus,
.cfg-input-sm:focus {
  outline: none;
  border-color: var(--color-primary);
}
.cfg-input::placeholder,
.cfg-input-sm::placeholder {
  color: var(--studio-faint);
}
.cfg-active {
  border-color: var(--studio-ink);
  background: var(--studio-ink);
  color: #fff;
}
.cfg-inactive {
  border-color: var(--studio-line-strong);
  color: color-mix(in srgb, var(--studio-ink) 70%, transparent);
}
.cfg-inactive:hover {
  border-color: var(--color-primary);
}

/* ── Toggle switch ── */
.toggle-row {
  @apply flex items-center justify-between px-3.5 py-3 cursor-pointer transition-colors;
  border-radius: 12px;
  border: 1px solid var(--studio-line);
}
.toggle      { @apply w-8 h-5 rounded-full relative shrink-0 transition-colors; }
.toggle-on   { background: var(--color-primary); }
.toggle-off  { background: color-mix(in srgb, var(--studio-ink) 16%, transparent); }
.toggle-knob { @apply absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform; }
</style>
