<script setup lang="ts">
import type { StudioBlock } from '@/types/studio'
import { useFilterDrillIn } from '@/composables/useFilterDrillIn'
import ColumnSourcePickStep from './ColumnSourcePickStep.vue'

defineProps<{ block: StudioBlock }>()

const drillIn = useFilterDrillIn()
</script>

<template>
  <ColumnSourcePickStep
    :block="block"
    :selected-source-id="drillIn.state.draft.sourceId"
    hint="Le bloc lit plusieurs sources. Choisissez celle qui contient la colonne à filtrer."
    @pick="drillIn.goToColumn($event)"
  />
</template>
