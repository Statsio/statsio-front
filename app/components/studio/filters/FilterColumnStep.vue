<script setup lang="ts">
import { computed } from 'vue'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups, primarySourceId } from '@/lib/studio-columns'
import type { StudioBlock } from '@/types/studio'
import { useFilterDrillIn } from '@/composables/useFilterDrillIn'
import FieldColumns from '@/components/studio/fields/FieldColumns.vue'

const props = defineProps<{ block: StudioBlock }>()

const datasets = useStudioDatasetsStore()
const drillIn = useFilterDrillIn()

const primaryId = computed(() => primarySourceId(props.block))

const groups = computed(() => {
  const all = blockColumnGroups(props.block, datasets)
  const sourceId = drillIn.state.draft.sourceId
  if (!sourceId || all.length <= 1) return all
  return all.filter((g) => g.sourceId === sourceId)
})
</script>

<template>
  <FieldColumns
    :groups="groups"
    :primary-source-id="primaryId"
    :selected="drillIn.state.draft.column"
    @pick="drillIn.goToValues($event)"
  />
</template>
