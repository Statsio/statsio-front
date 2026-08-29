<script setup lang="ts">
import { useStudioStore } from '@/stores/studio'
import type { BlockConfig, StudioBlock } from '@/types/studio'
import InspectorSection from '@/components/studio/fields/InspectorSection.vue'
import FieldSegmented from '@/components/studio/fields/FieldSegmented.vue'
import FieldColorSwatches from '@/components/studio/fields/FieldColorSwatches.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

function set<K extends keyof BlockConfig>(key: K, value: BlockConfig[K]) {
  studio.updateBlockConfig(props.block.id, { [key]: value })
}

const CALLOUT_COLORS = ['#eff6ff', '#f0fdf4', '#fef9c3', '#fff7ed', '#fdf2f8', '#f5f3ff', '#f1f5f9']
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-4">
    <InspectorSection label="Apparence">
      <FieldSegmented
        v-if="block.type === 'heading'"
        :model-value="block.config.headingLevel ?? 2"
        label="Niveau"
        :options="[{ label: 'H1', value: 1 }, { label: 'H2', value: 2 }, { label: 'H3', value: 3 }]"
        @update:model-value="set('headingLevel', Number($event) as BlockConfig['headingLevel'])"
      />
      <FieldColorSwatches
        v-if="block.type === 'callout'"
        :model-value="block.config.calloutColor ?? '#eff6ff'"
        label="Couleur de fond"
        :colors="CALLOUT_COLORS"
        @update:model-value="set('calloutColor', $event)"
      />
      <FieldNote>
        Le contenu, le gras, l'italique, les couleurs, l'alignement et les variables
        s'éditent directement sur le canevas via la barre d'outils flottante.
      </FieldNote>
    </InspectorSection>
  </div>
</template>
