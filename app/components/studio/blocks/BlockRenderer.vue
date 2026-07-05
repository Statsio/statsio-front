<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock } from '@/types/studio'
import BarChartBlock from './BarChartBlock.vue'
import LineChartBlock from './LineChartBlock.vue'
import PieChartBlock from './PieChartBlock.vue'
import TableBlock from './TableBlock.vue'
import KpiBlock from './KpiBlock.vue'
import TextBlock from './TextBlock.vue'
import SearchBlock from './SearchBlock.vue'
import ImageBlock from './ImageBlock.vue'
import VideoBlock from './VideoBlock.vue'
import ButtonBlock from './ButtonBlock.vue'
import LinkCardBlock from './LinkCardBlock.vue'
import RetenirBlock from './RetenirBlock.vue'
import MultipleChoiceBlock from './MultipleChoiceBlock.vue'
import CheckboxesBlock from './CheckboxesBlock.vue'
import DropdownBlock from './DropdownBlock.vue'
import LinearScaleBlock from './LinearScaleBlock.vue'
import RatingBlock from './RatingBlock.vue'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const component = computed(() => {
  switch (props.block.type) {
    case 'bar':       return BarChartBlock
    case 'line':      return LineChartBlock
    case 'pie':       return PieChartBlock
    case 'table':     return TableBlock
    case 'kpi':       return KpiBlock
    case 'search':    return SearchBlock
    case 'image':     return ImageBlock
    case 'video':     return VideoBlock
    case 'button':    return ButtonBlock
    case 'link-card': return LinkCardBlock
    case 'retenir':   return RetenirBlock
    case 'choice':     return MultipleChoiceBlock
    case 'checkboxes': return CheckboxesBlock
    case 'dropdown':   return DropdownBlock
    case 'scale':      return LinearScaleBlock
    case 'rating':     return RatingBlock
    case 'heading':
    case 'paragraph':
    case 'quote':
    case 'callout': return TextBlock
    default: return null
  }
})
</script>

<template>
  <component :is="component" v-if="component" :block="block" :readonly="props.readonly" class="h-full w-full" />
  <div v-else class="flex items-center justify-center h-full text-slate-400 text-xs">
    Bloc inconnu : {{ block.type }}
  </div>
</template>
