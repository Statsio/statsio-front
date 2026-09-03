<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import type { BlockConfig, DatasetMeta, StudioBlock } from '@/types/studio'
import { primarySourceId } from '@/lib/studio-columns'
import InspectorSection from '@/components/studio/fields/InspectorSection.vue'
import FieldText from '@/components/studio/fields/FieldText.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import { useSourceDrillIn } from '@/composables/useSourceDrillIn'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import SearchMappingField from '@/components/studio/fields/SearchMappingField.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()
const datasets = useStudioDatasetsStore()

function set<K extends keyof BlockConfig>(key: K, value: BlockConfig[K]) {
  studio.updateBlockConfig(props.block.id, { [key]: value })
}

const sourceDrill = useSourceDrillIn()

const sources = computed(() => props.block.sources ?? [])
const hasSource = computed(() => Boolean(primarySourceId(props.block)))
const primaryName = computed(() => {
  const src = sources.value.find((s) => s.id === primarySourceId(props.block)) ?? sources.value[0]
  return src?.alias || datasets.readyDatasets.find((d: DatasetMeta) => d.id === src?.datasetId)?.name || 'Source sélectionnée'
})
const sourceSummary = computed(() => {
  if (!hasSource.value) return 'Aucune source sélectionnée'
  const extra = sources.value.length - 1
  return primaryName.value + (extra > 0 ? ` + ${extra} jointure${extra > 1 ? 's' : ''}` : '')
})
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-4">
    <InspectorSection label="Bloc de recherche">
      <FieldText
        :model-value="block.config.searchPlaceholder ?? ''"
        label="Placeholder de la barre"
        placeholder="Commune, département…"
        @update:model-value="set('searchPlaceholder', $event)"
      />
    </InspectorSection>

    <InspectorSection label="Source & résultats">
      <FieldPicker
        label="Source de données"
        :value="sourceSummary"
        :action="hasSource ? 'Changer' : 'Choisir'"
        @open="sourceDrill.open({ block })"
      />

      <SearchMappingField :block="block" />

      <FieldNote>
        Une page indexable est générée automatiquement pour chaque résultat
        (<code class="font-mono">/statsdata/…/valeur</code>).
      </FieldNote>
    </InspectorSection>
  </div>
</template>
