<script setup lang="ts">
import type { StudioBlockPayload } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import StudioInspectorStatsDataQueryV2 from '@/components/studio/inspector/StudioInspectorStatsDataQueryV2.vue'

const props = defineProps<{
  idPrefix: string
  dataSources: StudioDataSource[]
  block: Extract<StudioBlockPayload, { type: 'table' | 'chart' | 'chart_line' | 'chart_pie' }>
}>()

const emit = defineEmits<{
  'push-payload': [StudioBlockPayload]
}>()

</script>

<template>
  <StudioInspectorStatsDataQueryV2
    :id-prefix="idPrefix"
    :data-sources="dataSources"
    :block="block"
    @push-payload="emit('push-payload', $event)"
  />
</template>

