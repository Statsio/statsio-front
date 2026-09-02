<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type {
  BlockConfig,
  DatasetColumn,
  DatasetMeta,
  PageParam,
  SearchJoin,
  SearchSource,
  StudioBlock,
} from '@/types/studio'
import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'
import InspectorSection from '@/components/studio/fields/InspectorSection.vue'
import StudioField from '@/components/studio/fields/StudioField.vue'
import FieldText from '@/components/studio/fields/FieldText.vue'
import FieldTextarea from '@/components/studio/fields/FieldTextarea.vue'
import FieldToggle from '@/components/studio/fields/FieldToggle.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import DataSourceModal from '@/components/studio/ui/DataSourceModal.vue'
import SearchResultsDisplayModal from '@/components/studio/ui/SearchResultsDisplayModal.vue'
import URLParamPickerModal from '@/components/studio/ui/URLParamPickerModal.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

function set<K extends keyof BlockConfig>(key: K, value: BlockConfig[K]) {
  studio.updateBlockConfig(props.block.id, { [key]: value })
}

const searchSources = computed<SearchSource[]>(() => props.block.fieldMapping.searchSources ?? [])
const searchJoins = computed<SearchJoin[]>(() => props.block.fieldMapping.searchJoins ?? [])
const urlParams = computed<string[]>(() => props.block.fieldMapping.urlParams ?? [])
const resultTitleColumn = computed<string>(() => props.block.fieldMapping.resultTitleColumn ?? '')
const resultDescColumns = computed<string[]>(() => props.block.fieldMapping.resultDescColumns ?? [])

watch(
  [searchSources, searchJoins],
  () => {
    for (const s of searchSources.value) if (s.datasetId) datasets.loadSchema(s.datasetId)
    for (const j of searchJoins.value) if (j.datasetId) datasets.loadSchema(j.datasetId)
  },
  { immediate: true, deep: true },
)

const dsName = (id: string, fallback: string) =>
  datasets.readyDatasets.find((d: DatasetMeta) => d.id === id)?.name ?? fallback

const displayColumnGroups = computed<ColumnGroup[]>(() => {
  const groups: ColumnGroup[] = []
  searchSources.value.forEach((src, si) => {
    const schema = src.datasetId ? datasets.getSchema(src.datasetId) : null
    if (schema) groups.push({ label: dsName(src.datasetId, `Source ${si + 1}`), columns: schema.columns })
  })
  searchJoins.value.forEach((join, ji) => {
    const schema = join.datasetId ? datasets.getSchema(join.datasetId) : null
    if (!schema) return
    const cols = join.columns.length
      ? schema.columns.filter((c: DatasetColumn) => join.columns.includes(c.name))
      : schema.columns
    if (cols.length) groups.push({ label: `Jointure — ${dsName(join.datasetId, `Jointure ${ji + 1}`)}`, columns: cols })
  })
  return groups
})

const searchSourceColumnGroups = computed(() => {
  const groups: { label: string; datasetId: string; columns: string[] }[] = []
  searchSources.value.forEach((src, si) => {
    if (!src.columns.length || !src.datasetId) return
    const cols = datasets.getSchema(src.datasetId)?.columns.map((c: DatasetColumn) => c.name) ?? []
    if (cols.length) groups.push({ label: dsName(src.datasetId, `Source ${si + 1}`), datasetId: src.datasetId, columns: cols })
  })
  searchJoins.value.forEach((join, ji) => {
    if (!join.columns.length || !join.datasetId) return
    const cols = datasets.getSchema(join.datasetId)?.columns.map((c: DatasetColumn) => c.name) ?? []
    if (cols.length) groups.push({ label: `Jointure — ${dsName(join.datasetId, `Jointure ${ji + 1}`)}`, datasetId: join.datasetId, columns: cols })
  })
  return groups
})

const allSourceColumns = computed(() => {
  const cols = new Set<string>()
  searchSourceColumnGroups.value.forEach((g) => g.columns.forEach((c) => cols.add(c)))
  return [...cols]
})

// ─── Paramètre de page piloté par la recherche ───────────────────────────────
// Comme un bloc « Paramètre » : on déclare un `PageParam` sur la page ciblée
// (badge PARM, fan-out d'URL, ré-amorçage des blocs). Au runtime, `SearchBlock`
// pose déjà toutes les colonnes de la ligne choisie dans `pageParams` et gère la
// navigation fan-out — il ne manquait que la déclaration.

const searchAsParam = computed({
  get: () => props.block.config.searchAsParam === true,
  set: (v: boolean) => studio.updateBlockConfig(props.block.id, { searchAsParam: v }),
})
const paramColumn = computed(() => props.block.fieldMapping.paramColumn ?? '')
const paramFanOut = computed({
  get: () => props.block.config.paramFanOut === true,
  set: (v: boolean) => studio.updateBlockConfig(props.block.id, { paramFanOut: v }),
})

function setParamColumn(col: string) {
  studio.updateBlockFieldMapping(props.block.id, { paramColumn: col })
}

/** Dataset auquel appartient la colonne identifiante (parmi les sources/jointures). */
const paramDatasetId = computed(
  () =>
    searchSourceColumnGroups.value.find((g) => g.columns.includes(paramColumn.value))?.datasetId ??
    props.block.datasetId,
)

/** Page qui devient paramétrée : la page cible de la recherche, sinon celle du bloc. */
const blockPageId = computed(() => {
  const zid = props.block.zoneId ?? ''
  if (zid.startsWith('page:')) return zid.slice(5)
  const sectionId = zid.replace(/-\d+$/, '')
  return studio.sections.find((s) => s.id === sectionId)?.pageId ?? studio.currentPageId
})
const paramPageId = computed(() => props.block.fieldMapping.targetPageId || blockPageId.value)
const paramPageName = computed(
  () => studio.pages.find((p) => p.id === paramPageId.value)?.title ?? '',
)
const paramToken = computed(() => `{{ ${paramColumn.value} }}`)

watch(
  () => ({
    on: searchAsParam.value,
    col: paramColumn.value,
    ds: paramDatasetId.value,
    page: paramPageId.value,
    fan: paramFanOut.value,
  }),
  (cur, prev) => {
    // La cible a bougé (autre page / autre colonne) ou la fonction a été coupée :
    // on retire d'abord la déclaration devenue orpheline.
    if (prev && prev.col && prev.page && (prev.page !== cur.page || prev.col !== cur.col || (prev.on && !cur.on))) {
      studio.removePageParam(prev.page, prev.col)
    }
    if (!cur.on || !cur.col || !cur.page) return
    const decl: PageParam = {
      name: cur.col,
      column: cur.col,
      datasetId: cur.ds,
      defaultValue: undefined,
      fanOut: cur.fan || undefined,
      slugColumn: cur.fan ? cur.col : undefined,
    }
    const existing = studio.pages.find((p) => p.id === cur.page)?.params?.find((p) => p.name === decl.name)
    if (!existing) {
      studio.addPageParam(cur.page, decl)
    } else if (
      existing.column !== decl.column ||
      existing.datasetId !== decl.datasetId ||
      Boolean(existing.fanOut) !== Boolean(decl.fanOut) ||
      (existing.slugColumn ?? undefined) !== decl.slugColumn
    ) {
      studio.updatePageParam(cur.page, decl.name, decl)
    }
  },
  { immediate: true, deep: true },
)

// ─── Sub-modals ──────────────────────────────────────────────────────────────

const showSources = ref(false)
const showResults = ref(false)
const showUrl = ref(false)

const sourcesSummary = computed(() => {
  const n = searchSources.value.filter((s) => s.datasetId).length
  const base = n ? `${n} source${n > 1 ? 's' : ''} de recherche` : 'Aucune source configurée'
  return searchJoins.value.length ? `${base} · ${searchJoins.value.length} jointure${searchJoins.value.length > 1 ? 's' : ''}` : base
})

const resultsSummary = computed(() => {
  if (resultTitleColumn.value) return `Titre : ${resultTitleColumn.value}`
  if (resultDescColumns.value.length) return `${resultDescColumns.value.length} colonne(s) de description`
  return 'Affichage automatique'
})

const urlSummary = computed(() => {
  if (urlParams.value.length) return `?${urlParams.value.map((c) => c + '=…').join('&')}`
  if (!allSourceColumns.value.length) return 'Configurez d\'abord les sources'
  return 'Aucun paramètre propagé'
})
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-4">
    <InspectorSection label="Bloc de recherche">
      <FieldText
        :model-value="block.config.title ?? ''"
        label="Titre"
        placeholder="Ex : Trouver le prix près de chez vous"
        @update:model-value="set('title', $event)"
      />
      <FieldTextarea
        :model-value="block.config.description ?? ''"
        label="Description"
        :rows="2"
        placeholder="Ex : Cherchez une commune pour ouvrir sa page dédiée"
        @update:model-value="set('description', $event)"
      />
      <FieldText
        :model-value="block.config.searchPlaceholder ?? ''"
        label="Placeholder de la barre"
        placeholder="Commune, département…"
        @update:model-value="set('searchPlaceholder', $event)"
      />
    </InspectorSection>

    <InspectorSection label="Sources & résultats">
      <FieldPicker
        label="Sources et jointures"
        :value="sourcesSummary"
        action="Configurer"
        @open="showSources = true"
      />
      <DataSourceModal :show="showSources" :block="block" @close="showSources = false" />

      <FieldPicker
        v-if="displayColumnGroups.length"
        label="Affichage des résultats"
        :value="resultsSummary"
        action="Configurer"
        @open="showResults = true"
      />
      <SearchResultsDisplayModal
        :show="showResults"
        :block="block"
        :column-groups="displayColumnGroups"
        @close="showResults = false"
      />

      <FieldPicker
        label="Paramètres d'URL"
        :value="urlSummary"
        :action="allSourceColumns.length ? 'Configurer' : 'Sources requises'"
        @open="allSourceColumns.length && (showUrl = true)"
      />
      <URLParamPickerModal
        :show="showUrl"
        :block="block"
        :column-groups="searchSourceColumnGroups"
        @close="showUrl = false"
      />
    </InspectorSection>

    <InspectorSection v-if="allSourceColumns.length" label="Paramètre de page">
      <FieldToggle
        v-model="searchAsParam"
        label="Les résultats pilotent un paramètre de page"
        sub="Comme un bloc Paramètre : la page prend le badge PARM et les blocs qui filtrent sur ce paramètre se rechargent au choix d'un résultat."
      />
      <template v-if="searchAsParam">
        <StudioField label="Colonne identifiante">
          <select
            class="studio-input"
            :value="paramColumn"
            @change="setParamColumn(($event.target as HTMLSelectElement).value)"
          >
            <option value="">Choisir une colonne…</option>
            <option v-for="c in allSourceColumns" :key="c" :value="c">{{ c }}</option>
          </select>
        </StudioField>
        <FieldToggle
          v-model="paramFanOut"
          label="Générer une page indexable par valeur"
          sub="Publie une URL /statsdata/…/valeur pour chaque résultat (SEO)."
        />
        <FieldNote v-if="paramColumn && paramPageName">
          Paramètre <code class="font-mono">{{ paramToken }}</code> déclaré sur la page « {{ paramPageName }} ».
        </FieldNote>
        <FieldNote v-else>
          Choisissez la colonne qui identifie chaque résultat (souvent un code : UAI, code commune…).
        </FieldNote>
      </template>
    </InspectorSection>
  </div>
</template>
