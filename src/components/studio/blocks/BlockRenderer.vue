<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock } from '@/types/studio'
import BarChartBlock from './BarChartBlock.vue'
import LineChartBlock from './LineChartBlock.vue'
import TableBlock from './TableBlock.vue'
import KpiBlock from './KpiBlock.vue'

const props = defineProps<{ block: StudioBlock }>()

const component = computed(() => {
  switch (props.block.type) {
    case 'bar': return BarChartBlock
    case 'line': return LineChartBlock
    case 'table': return TableBlock
    case 'kpi': return KpiBlock
    default: return null
  }
})
</script>

<template>
  <component :is="component" v-if="component" :block="block" class="h-full w-full" />
  <div v-else class="flex items-center justify-center h-full text-slate-400 text-xs">
    Bloc inconnu : {{ block.type }}
  </div>
</template>
