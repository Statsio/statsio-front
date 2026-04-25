<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload } from '@/types/studio-document'
import { mergeBlockWithPayload } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import AppButton from '@/components/ui/AppButton.vue'
import StudioInspectorText from '@/components/studio/inspector/StudioInspectorText.vue'
import StudioInspectorImage from '@/components/studio/inspector/StudioInspectorImage.vue'
import StudioInspectorTable from '@/components/studio/inspector/StudioInspectorTable.vue'
import StudioInspectorChart from '@/components/studio/inspector/StudioInspectorChart.vue'

const props = withDefaults(
  defineProps<{
    selectedBlock: StudioBlock
    dataSources: StudioDataSource[]
    /** StatsData API : persiste une spec `query` sur les blocs tableau / graphique. */
    statsDataQueryMode?: boolean
    /** Préfixe pour éviter les doublons d’id accessibilité */
    idPrefix?: string
    /** Panneau intégré (pas de bordure haute : le parent encadre la zone) */
    embedded?: boolean
  }>(),
  { statsDataQueryMode: false },
)

const emit = defineEmits<{
  'update-block': [StudioBlock]
  'remove-block': [id: string]
  'duplicate-block': [id: string]
}>()

const p = computed(() => props.idPrefix ?? 'studio-inspector')

const typeLabel: Record<StudioBlock['type'], string> = {
  text_heading: 'Titre',
  text_paragraph: 'Paragraphe',
  layout_2col: 'Layout (2 colonnes)',
  layout_3col: 'Layout (3 colonnes)',
  chart: 'Graphique',
  chart_line: 'Graphique (ligne)',
  chart_pie: 'Graphique (camembert)',
  chart_donut: 'Graphique (donut)',
  table: 'Tableau',
  kpi: 'KPI',
  callout: 'Encadré',
  divider: 'Séparateur',
  image: 'Image',
}

const pushPayload = (payload: StudioBlockPayload) => {
  emit('update-block', mergeBlockWithPayload(props.selectedBlock.id, payload))
}
</script>

<template>
  <section
    class="rounded-2xl"
    :class="embedded ? 'pt-0' : 'border-t border-slate-100 pt-4'"
    :aria-labelledby="`${p}-block-h`"
  >
    <h2 :id="`${p}-block-h`" class="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
      Propriétés du bloc
    </h2>
    <p class="mb-4 text-sm font-semibold text-slate-900">{{ typeLabel[selectedBlock.type] }}</p>

    <div class="flex flex-col gap-4">
      <StudioInspectorText
        v-if="selectedBlock.type === 'text_heading' || selectedBlock.type === 'text_paragraph'"
        :block="selectedBlock"
        :id-prefix="p"
        @push-payload="pushPayload"
      />

      <StudioInspectorChart
        v-else-if="
          selectedBlock.type === 'chart' ||
          selectedBlock.type === 'chart_line' ||
          selectedBlock.type === 'chart_pie' ||
          selectedBlock.type === 'chart_donut'
        "
        :block="selectedBlock"
        :id-prefix="p"
        :data-sources="dataSources"
        :stats-data-query-mode="statsDataQueryMode"
        @push-payload="pushPayload"
      />

      <StudioInspectorTable
        v-else-if="selectedBlock.type === 'table'"
        :block="selectedBlock"
        :id-prefix="p"
        :data-sources="dataSources"
        :stats-data-query-mode="statsDataQueryMode"
        @push-payload="pushPayload"
      />

      <StudioInspectorImage v-else-if="selectedBlock.type === 'image'" :block="selectedBlock" :id-prefix="p" @push-payload="pushPayload" />

      <div class="flex flex-wrap gap-2 pt-1">
        <AppButton variant="secondary" size="md" type="button" @click="emit('duplicate-block', selectedBlock.id)">
          Dupliquer
        </AppButton>
        <AppButton
          variant="outline"
          size="md"
          type="button"
          class="text-rose-700 hover:border-rose-200 hover:bg-rose-50"
          @click="emit('remove-block', selectedBlock.id)"
        >
          Supprimer
        </AppButton>
      </div>
    </div>
  </section>
</template>
