<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { fetchDistinctValues } from '@/api/studio'
import { blockColumnGroups } from '@/lib/studio-columns'
import type { StudioBlock, BlockFilter } from '@/types/studio'
import StudioSubModal from './StudioSubModal.vue'
import FieldFilters from '@/components/studio/fields/FieldFilters.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'

const props = defineProps<{
  show: boolean
  block: StudioBlock
  mode?: 'primary' | 'comparison'
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

const isComparison = computed(() => props.mode === 'comparison')

const filters = computed<BlockFilter[]>(
  () => (isComparison.value ? props.block.comparisonFilters : props.block.filters) ?? [],
)

const groups = computed(() => blockColumnGroups(props.block, datasets))

watch(
  () => props.show,
  (open) => {
    if (!open) return
    if (props.block.datasetId) datasets.loadSchema(props.block.datasetId)
    ;(props.block.joins ?? []).forEach((j) => j.datasetId && datasets.loadSchema(j.datasetId))
  },
  { immediate: true },
)

function write(updated: BlockFilter[]) {
  if (isComparison.value) studio.updateBlockComparisonFilters(props.block.id, updated)
  else studio.updateBlockFilters(props.block.id, updated)
}

const activeCount = computed(() => filters.value.filter((f) => f.column).length)

// ─── Valeurs distinctes proposées (par colonne, chargées à la demande) ───────

const suggestions = ref<Record<string, string[]>>({})

watch(
  [filters, () => props.show],
  async () => {
    const dsId = props.block.datasetId
    if (!props.show || !dsId) return
    for (const f of filters.value) {
      if (!f.column || f.column in suggestions.value) continue
      suggestions.value = { ...suggestions.value, [f.column]: [] }
      try {
        const values = await fetchDistinctValues(dsId, f.column, '')
        suggestions.value = { ...suggestions.value, [f.column]: values.slice(0, 8) }
      } catch {
        /* pas de suggestions pour cette colonne */
      }
    }
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <StudioSubModal
    v-if="show"
    :title="isComparison ? 'Filtres de comparaison' : 'Règles de filtrage'"
    :subtitle="isComparison
      ? 'Définissez le sous-ensemble de lignes servant de référence à la comparaison.'
      : 'Le bloc ne lit que les lignes qui satisfont toutes les règles ci-dessous.'"
    :footer-note="activeCount ? `${activeCount} règle${activeCount > 1 ? 's' : ''} active${activeCount > 1 ? 's' : ''}` : ''"
    @close="emit('close')"
  >
    <FieldFilters
      :model-value="filters"
      :groups="groups"
      :block-id="block.id"
      :suggestions="suggestions"
      :add-label="isComparison ? '+ Ajouter une règle de comparaison' : '+ Ajouter un filtre'"
      :empty-label="isComparison
        ? 'Aucune règle : la comparaison porte sur les mêmes lignes que la valeur.'
        : 'Aucun filtre : le bloc lit toutes les lignes de la source.'"
      @update:model-value="write"
    />
    <FieldNote>
      Utilisez <code class="font-mono">{{ '{' + '{' }}nom{{ '}' + '}' }}</code> comme valeur pour injecter un paramètre de page dynamique.
      Les filtres s'appliquent avant l'agrégation.
    </FieldNote>
  </StudioSubModal>
</template>
