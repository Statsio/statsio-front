<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type {
  BlockConfig,
  DatasetColumn,
  DatasetMeta,
  SearchJoin,
  SearchSource,
  StudioBlock,
} from '@/types/studio'
import type { ColumnGroup } from '@/components/studio/ui/ColumnPickerModal.vue'
import InspectorSection from '@/components/studio/fields/InspectorSection.vue'
import FieldText from '@/components/studio/fields/FieldText.vue'
import FieldTextarea from '@/components/studio/fields/FieldTextarea.vue'
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
  </div>
</template>
