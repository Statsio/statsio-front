<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload } from '@/types/studio-document'
import { mergeBlockWithPayload } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import StudioInspectorText from '@/components/studio/inspector/StudioInspectorText.vue'
import StudioInspectorImage from '@/components/studio/inspector/StudioInspectorImage.vue'
import StudioInspectorTable from '@/components/studio/inspector/StudioInspectorTable.vue'
import StudioInspectorChart from '@/components/studio/inspector/StudioInspectorChart.vue'
import StudioInspectorSearchBar from '@/components/studio/inspector/StudioInspectorSearchBar.vue'
import StudioInspectorLink from '@/components/studio/inspector/StudioInspectorLink.vue'

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
    /** Pages disponibles pour la navigation */
    pages?: Array<{ id: string; name: string }>
  }>(),
  { statsDataQueryMode: false, pages: () => [] },
)

const emit = defineEmits<{
  'update-block': [StudioBlock]
  'remove-block': [id: string]
  'duplicate-block': [id: string]
}>()

const p = computed(() => props.idPrefix ?? 'studio-inspector')
const isLayoutBlock = computed(() => props.selectedBlock.type === 'layout_2col' || props.selectedBlock.type === 'layout_3col')
const layoutGap = computed(() => {
  if (props.selectedBlock.type === 'layout_2col' || props.selectedBlock.type === 'layout_3col') {
    return props.selectedBlock.gap ?? 'md'
  }
  return 'md'
})
const layoutGapOptions = [
  { value: 'sm', label: 'Compact' },
  { value: 'md', label: 'Normal' },
  { value: 'lg', label: 'Large' },
]

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
  search_bar: 'Barre de recherche',
  link: 'Lien',
  link_button: 'Bouton',
  link_back: 'Flèche retour',
}

const pushPayload = (payload: StudioBlockPayload) => {
  emit('update-block', mergeBlockWithPayload(props.selectedBlock.id, payload))
}

const patchLayoutGap = (gap: string) => {
  const b = props.selectedBlock
  if (b.type === 'layout_2col' || b.type === 'layout_3col') {
    const value = gap === 'sm' || gap === 'lg' ? gap : 'md'
    pushPayload({
      type: b.type,
      columns: b.columns,
      gap: value,
    })
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-6"
    :class="embedded ? 'pt-0' : 'border-t border-slate-100 pt-6'"
  >
    <!-- Header du Bloc -->
    <header class="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-slate-200/50">
        <span class="text-xl font-bold">
          {{ selectedBlock.type === 'text_heading' ? 'H' : selectedBlock.type === 'text_paragraph' ? 'P' : '▣' }}
        </span>
      </div>
      <div class="flex flex-col">
        <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Type de bloc
        </span>
        <h2 class="text-sm font-bold text-slate-900">
          {{ typeLabel[selectedBlock.type] }}
        </h2>
      </div>
    </header>

    <div class="flex flex-col gap-8">
      <!-- Champs spécifiques au type de bloc -->
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

      <StudioInspectorSearchBar
        v-else-if="selectedBlock.type === 'search_bar'"
        :block="selectedBlock"
        :id-prefix="p"
        :data-sources="dataSources"
        :pages="pages"
        :stats-data-query-mode="statsDataQueryMode"
        @push-payload="pushPayload"
      />

      <StudioInspectorLink
        v-else-if="selectedBlock.type === 'link' || selectedBlock.type === 'link_button' || selectedBlock.type === 'link_back'"
        :block="selectedBlock"
        :id-prefix="p"
        :pages="pages"
        @push-payload="pushPayload"
      />

      <div v-else-if="isLayoutBlock" class="space-y-3">
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400" :for="`${p}-layout-gap`">
            Configuration du Layout
          </label>
          <div class="h-px bg-slate-100 mb-2" />
          <label class="text-xs font-semibold text-slate-600" :for="`${p}-layout-gap`">Espacement</label>
          <AppSelect
            :model-value="layoutGap"
            :options="layoutGapOptions"
            size="md"
            button-class="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary/20"
            panel-class="mt-1"
            aria-label="Espacement"
            @change="(v) => patchLayoutGap(String(v))"
          />
        </div>
      </div>

      <!-- Actions de bloc -->
      <section class="space-y-4 pt-4 border-t border-slate-100">
        <h3 class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Actions
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <AppButton 
            variant="secondary" 
            size="md" 
            type="button" 
            class="rounded-xl font-bold text-xs"
            @click="emit('duplicate-block', selectedBlock.id)"
          >
            Dupliquer
          </AppButton>
          <AppButton
            variant="outline"
            size="md"
            type="button"
            class="rounded-xl font-bold text-xs text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            @click="emit('remove-block', selectedBlock.id)"
          >
            Supprimer
          </AppButton>
        </div>
      </section>
    </div>
  </div>
</template>
