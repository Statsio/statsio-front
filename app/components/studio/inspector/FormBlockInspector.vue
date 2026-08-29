<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import type { BlockConfig, StudioBlock } from '@/types/studio'
import InspectorSection from '@/components/studio/fields/InspectorSection.vue'
import FieldTextarea from '@/components/studio/fields/FieldTextarea.vue'
import FieldToggle from '@/components/studio/fields/FieldToggle.vue'
import FieldList from '@/components/studio/fields/FieldList.vue'
import FieldText from '@/components/studio/fields/FieldText.vue'
import FieldSegmented from '@/components/studio/fields/FieldSegmented.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

function set<K extends keyof BlockConfig>(key: K, value: BlockConfig[K]) {
  studio.updateBlockConfig(props.block.id, { [key]: value })
}

const hasOptions = computed(() =>
  ['choice', 'checkboxes', 'dropdown'].includes(props.block.type),
)

const options = computed({
  get: () => props.block.config.formOptions ?? [],
  set: (v: string[]) => set('formOptions', v),
})

const optionsHint = computed(() => {
  if (props.block.type === 'checkboxes') return 'Réponses multiples autorisées'
  if (props.block.type === 'dropdown') return 'Affichées dans une liste déroulante'
  return 'Une seule réponse possible'
})
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-4">
    <InspectorSection label="Question">
      <FieldTextarea
        :model-value="block.config.title ?? ''"
        label="Intitulé"
        placeholder="Ex : Que pensez-vous de…"
        :rows="2"
        @update:model-value="set('title', $event)"
      />
      <FieldToggle
        :model-value="block.config.formRequired ?? false"
        label="Question obligatoire"
        @update:model-value="set('formRequired', $event)"
      />
    </InspectorSection>

    <InspectorSection v-if="hasOptions" label="Réponses">
      <FieldList v-model="options" :hint="optionsHint" add-label="+ Ajouter une option" placeholder="Option" />
    </InspectorSection>

    <InspectorSection v-if="block.type === 'scale'" label="Échelle">
      <FieldSegmented
        :model-value="String(block.config.scaleMin ?? 1)"
        label="Minimum"
        :options="['0', '1']"
        @update:model-value="set('scaleMin', Number($event))"
      />
      <FieldSegmented
        :model-value="String(block.config.scaleMax ?? 5)"
        label="Maximum"
        :options="['5', '7', '10']"
        @update:model-value="set('scaleMax', Number($event))"
      />
      <FieldText
        :model-value="block.config.scaleMinLabel ?? ''"
        label="Libellé bas"
        placeholder="Aucun impact"
        @update:model-value="set('scaleMinLabel', $event)"
      />
      <FieldText
        :model-value="block.config.scaleMaxLabel ?? ''"
        label="Libellé haut"
        placeholder="Impact fort"
        @update:model-value="set('scaleMaxLabel', $event)"
      />
    </InspectorSection>

    <InspectorSection v-if="block.type === 'rating'" label="Notation">
      <FieldSegmented
        :model-value="String(block.config.ratingMax ?? 5)"
        label="Nombre d'étoiles"
        :options="['3', '5', '10']"
        @update:model-value="set('ratingMax', Number($event))"
      />
    </InspectorSection>

    <FieldNote>
      Dans le Studio le bloc reste statique. En mode public, chaque visiteur répond une fois puis voit
      les résultats agrégés (pourcentages, moyenne, distribution), avec un lien pour modifier sa réponse.
    </FieldNote>
  </div>
</template>
