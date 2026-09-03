<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { useActiveEditor } from '@/composables/useActiveEditor'
import type { ChartMarkRule, DatasetMeta, StudioBlock } from '@/types/studio'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import FieldColumns from '@/components/studio/fields/FieldColumns.vue'
import { blockColumnGroups, primarySourceId } from '@/lib/studio-columns'
import { blockDatasetIds } from '@/lib/studio-block-sources'
import { useSourceDrillIn } from '@/composables/useSourceDrillIn'
import BlockFiltersField from '@/components/studio/fields/BlockFiltersField.vue'
import ChartMappingField from '@/components/studio/fields/ChartMappingField.vue'
import TableColumnsField from '@/components/studio/fields/TableColumnsField.vue'

const props = defineProps<{ block: StudioBlock; activeTab: string }>()
const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const { setActiveInput } = useActiveEditor()

const block = computed(() => props.block)

// ─── Accordion state ─────────────────────────────────────────────────────────
const openSections = ref<Set<string>>(new Set<string>())
function toggle(id: string) {
  const s = new Set(openSections.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  openSections.value = s
}
const open = (id: string) => openSections.value.has(id)
watch(() => props.block.id, () => { openSections.value = new Set<string>() })

// ─── Config / mapping ────────────────────────────────────────────────────────
function updateConfig(key: string, value: unknown) { studio.updateBlockConfig(props.block.id, { [key]: value }) }
function updateMapping(key: string, value: string) { studio.updateBlockFieldMapping(props.block.id, { [key]: value }) }
function inputVal(e: Event) { return (e.target as HTMLInputElement).value }

// ─── Couleur de marque conditionnelle (bar / progress) — Phase 5 ─────────────
const markRules = computed<ChartMarkRule[]>(() => props.block.config.markRules ?? [])
const MARK_WHENS: { v: ChartMarkRule['when']; l: string }[] = [
  { v: 'above-ref', l: '> réf.' }, { v: 'below-ref', l: '< réf.' },
  { v: 'top', l: 'max' }, { v: 'bottom', l: 'min' },
  { v: 'positive', l: 'positif' }, { v: 'negative', l: 'négatif' },
  { v: 'gt', l: '> seuil' }, { v: 'lt', l: '< seuil' },
]
const MARK_COLORS = ['#8b5cf6', '#059669', '#e11d48', '#2563eb', '#b45309', '#c4b5fd']
function setMarkRules(next: ChartMarkRule[]) { updateConfig('markRules', next.length ? next : undefined) }
function addMarkRule() { setMarkRules([...markRules.value, { when: 'above-ref', color: '#8b5cf6' }]) }
function updateMarkRule(i: number, patch: Partial<ChartMarkRule>) {
  setMarkRules(markRules.value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
}
function removeMarkRule(i: number) { setMarkRules(markRules.value.filter((_, idx) => idx !== i)) }

const primaryId = computed(() => primarySourceId(props.block))
const hasSource = computed(() => Boolean(primaryId.value))

/** Colonnes disponibles groupées par source. */
const columnGroups = computed(() => blockColumnGroups(props.block, datasets))

watch(
  () => [props.block.id, JSON.stringify(props.block.sources ?? []), props.block.datasetId].join('|'),
  () => blockDatasetIds(props.block).forEach((id) => datasets.loadSchema(id)),
  { immediate: true },
)

const isTable = computed(() => props.block.type === 'table')

const CHART_COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316']


const sourceDrill = useSourceDrillIn()

// ─── FieldPicker summaries ───────────────────────────────────────────────────
const sources = computed(() => props.block.sources ?? [])
const primaryName = computed(() => {
  const src = sources.value.find((s) => s.id === primaryId.value) ?? sources.value[0]
  return src?.alias || datasets.readyDatasets.find((d: DatasetMeta) => d.id === src?.datasetId)?.name || 'Source sélectionnée'
})
const sourceSummary = computed(() => {
  if (!hasSource.value) return 'Aucune source sélectionnée'
  const extra = sources.value.length - 1
  return primaryName.value + (extra > 0 ? ` + ${extra} source${extra > 1 ? 's' : ''}` : '')
})
</script>
<template>
  <div>

        <!-- ── Tab: Données ── -->
        <template v-if="activeTab === 'data'">

          <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
            <FieldPicker
              label="Source"
              :value="sourceSummary"
              :action="hasSource ? 'Changer' : 'Choisir'"
              @open="sourceDrill.open({ block })"
            />

            <template v-if="hasSource">
              <ChartMappingField v-if="!isTable" :block="block" />
              <div v-else class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-[var(--studio-muted)]">Colonnes affichées</label>
                <TableColumnsField :block="block" section="columns" />
              </div>
            </template>
          </div>

        </template>

        <!-- ── Tab: Filtres ── -->
        <template v-if="activeTab === 'filters'">

          <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
            <FieldNote v-if="!block.datasetId">Connectez d'abord une source dans l'onglet Données.</FieldNote>
            <template v-else>
              <BlockFiltersField :block="block" mode="primary" />
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
              <FieldColumns
                :groups="columnGroups"
                :primary-source-id="primaryId"
                :selected="block.config.distinctColumn ?? null"
                none-label="Aucun"
                @pick="updateConfig('distinctColumn', $event)"
                @none="updateConfig('distinctColumn', null)"
              />
              <p class="text-[11px] text-[var(--studio-faint)] leading-relaxed">Garde une seule ligne par valeur unique de la colonne sélectionnée.</p>
            </div>
          </div>

          <!-- ── Ordre d'affichage (tableau — les graphiques l'ont dans « Données ») ── -->
          <div v-if="isTable" class="accordion-item">
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
              <FieldColumns
                label="Colonne"
                :groups="columnGroups"
                :selected="block.config.sortColumn ?? null"
                none-label="Aucun tri"
                @pick="updateConfig('sortColumn', $event)"
                @none="updateConfig('sortColumn', null); updateConfig('sortDirection', null)"
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
                <FieldColumns
                  :groups="columnGroups"
                  :primary-source-id="primaryId"
                  :selected="block.fieldMapping.comparisonColumn ?? null"
                  none-label="Même que la valeur"
                  @pick="updateMapping('comparisonColumn', $event)"
                  @none="updateMapping('comparisonColumn', '')"
                />
              </div>
            </div>

            <!-- Filtres de comparaison -->
            <div class="px-4 pb-1 pt-1">
              <BlockFiltersField
                :block="block"
                mode="comparison"
                label="Filtres de comparaison"
                empty-label="Aucune règle : la comparaison porte sur les mêmes lignes que la valeur."
                add-label="+ Ajouter une règle de comparaison"
              />
            </div>

            <!-- Libellé de la comparaison -->
            <div class="flex flex-col gap-1.5 px-4 pb-1 pt-2">
              <label class="text-xs font-semibold text-[var(--studio-muted)]">Libellé de la comparaison</label>
              <input
                :value="block.config.comparisonLabel ?? ''"
                type="text"
                class="cfg-input !text-[12.5px]"
                placeholder="ex. vs 2020"
                @focus="setActiveInput($event.target as HTMLInputElement)"
                @input="updateConfig('comparisonLabel', inputVal($event) || undefined)"
              />
              <p class="text-[11px] text-[var(--studio-faint)] leading-relaxed">Affiché après l'écart. Accepte les jetons <code class="font-mono">{{ '{' + '{colonne}' + '}' }}</code>.</p>
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

              <!-- Ligne de référence -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-[var(--studio-muted)]">Ligne de référence (expression)</label>
                <input
                  :value="block.config.referenceExpression ?? ''"
                  type="text" placeholder="ex. AVG(prix@7)"
                  class="cfg-input font-mono !text-[11.5px]"
                  @input="updateConfig('referenceExpression', inputVal($event) || undefined)"
                />
                <input
                  v-if="block.config.referenceExpression"
                  :value="block.config.referenceLabel ?? ''"
                  type="text" placeholder="Libellé (ex. moyenne nationale)"
                  class="cfg-input !text-[12px]"
                  @input="updateConfig('referenceLabel', inputVal($event) || undefined)"
                />
              </div>

              <!-- Couleur conditionnelle des barres -->
              <div class="flex flex-col gap-2" v-if="!block.fieldMapping.series">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-semibold text-[var(--studio-muted)]">Couleur conditionnelle</label>
                  <button type="button" class="text-[11px] font-bold text-[var(--color-primary)]" @click="addMarkRule">+ Règle</button>
                </div>
                <div v-for="(r, i) in markRules" :key="i" class="flex flex-wrap items-center gap-1.5">
                  <select class="cfg-input-sm !w-[92px]" :value="r.when" @change="updateMarkRule(i, { when: ($event.target as HTMLSelectElement).value as ChartMarkRule['when'] })">
                    <option v-for="w in MARK_WHENS" :key="w.v" :value="w.v">{{ w.l }}</option>
                  </select>
                  <input v-if="r.when === 'gt' || r.when === 'lt'" type="number" class="cfg-input-sm !w-[58px]" :value="r.value ?? ''" @change="updateMarkRule(i, { value: Number(inputVal($event)) })" />
                  <span class="flex gap-1">
                    <button v-for="hex in MARK_COLORS" :key="hex" type="button" class="h-5 w-5 rounded-full border-2" :class="r.color === hex ? 'border-[var(--studio-ink)]' : 'border-white'" :style="{ background: hex }" @click="updateMarkRule(i, { color: hex })" />
                  </span>
                  <button type="button" class="text-[12px] text-[var(--studio-faint)] hover:text-red-400" @click="removeMarkRule(i)">✕</button>
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
              <div class="toggle-row" @click="updateConfig('lineFill', block.config.lineFill === false ? undefined : false)">
                <span class="text-sm text-[var(--studio-ink)]">Remplissage sous la courbe</span>
                <div class="toggle" :class="block.config.lineFill !== false ? 'toggle-on' : 'toggle-off'">
                  <div class="toggle-knob" :class="block.config.lineFill !== false ? 'translate-x-3.5' : 'translate-x-0.5'" />
                </div>
              </div>

              <!-- Ligne de référence -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-[var(--studio-muted)]">Ligne de référence (expression)</label>
                <input
                  :value="block.config.referenceExpression ?? ''"
                  type="text" placeholder="ex. AVG(prix@7)"
                  class="cfg-input font-mono !text-[11.5px]"
                  @input="updateConfig('referenceExpression', inputVal($event) || undefined)"
                />
                <input
                  v-if="block.config.referenceExpression"
                  :value="block.config.referenceLabel ?? ''"
                  type="text" placeholder="Libellé"
                  class="cfg-input !text-[12px]"
                  @input="updateConfig('referenceLabel', inputVal($event) || undefined)"
                />
              </div>

              <!-- Pastille de tendance -->
              <div>
                <label class="text-xs font-semibold text-[var(--studio-muted)] mb-1.5 block">Pastille de tendance</label>
                <input
                  :value="block.config.trendExpression ?? ''"
                  type="text"
                  placeholder="Valeur calculée — ex. AVG(prix@7) - MIN(prix@7)"
                  class="cfg-input font-mono !text-[11.5px]"
                  @input="updateConfig('trendExpression', inputVal($event) || undefined)"
                />
                <input
                  v-if="!block.config.trendExpression"
                  :value="block.config.trendLabel ?? ''"
                  type="text"
                  placeholder="… ou texte libre : +2,1 pts vs 2022"
                  class="cfg-input mt-1.5 !text-[12px]"
                  @input="updateConfig('trendLabel', inputVal($event) || undefined)"
                />
              </div>
              <div v-if="block.config.trendLabel || block.config.trendExpression" class="grid grid-cols-3 gap-2">
                <button v-for="o in [
                  { v: undefined, l: 'Auto' },
                  { v: 'up',   l: '▲ Hausse' },
                  { v: 'down', l: '▼ Baisse' },
                ]" :key="o.l"
                  class="py-2.5 rounded-xl border text-[11px] font-semibold transition-colors"
                  :class="block.config.trendDirection === o.v ? 'cfg-active' : 'cfg-inactive'"
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
              <div v-if="block.config.showPagination" class="flex items-center justify-between gap-2 px-1">
                <label class="text-xs font-semibold text-[var(--studio-muted)]">Lignes par page</label>
                <input
                  type="number" min="1" max="200"
                  class="cfg-input-sm w-[80px] [appearance:textfield]"
                  :value="block.config.pageSize ?? 10"
                  @input="updateConfig('pageSize', Number(($event.target as HTMLInputElement).value) || 10)"
                />
              </div>
            </div>
          </div>

          <!-- Mise en forme conditionnelle (table) -->
          <div v-if="isTable" class="accordion-item">
            <button class="accordion-header" @click="toggle('table-cond')">
              <span>Mise en forme conditionnelle</span>
              <div class="flex items-center gap-2">
                <span v-if="(block.fieldMapping.cellRules?.length ?? 0) > 0" class="text-xs font-bold text-[var(--color-primary)]">
                  {{ block.fieldMapping.cellRules!.length }} règle{{ block.fieldMapping.cellRules!.length > 1 ? 's' : '' }}
                </span>
                <svg class="chevron" :class="open('table-cond') ? 'rotate-0' : '-rotate-90'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>
            <div v-show="open('table-cond')" class="accordion-body">
              <TableColumnsField :block="block" section="rules" />
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
