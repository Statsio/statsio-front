<script setup lang="ts">
import { computed, resolveComponent } from 'vue'
import type { StudioBlock } from '@/types/studio'
import BarChartBlock from './BarChartBlock.vue'
import LineChartBlock from './LineChartBlock.vue'
import PieChartBlock from './PieChartBlock.vue'
import TableBlock from './TableBlock.vue'
import KpiBlock from './KpiBlock.vue'
import RecordBlock from './RecordBlock.vue'
import RelatedBlock from './RelatedBlock.vue'
import MapBlock from './MapBlock.vue'
import FieldGridBlock from './FieldGridBlock.vue'
import TextBlock from './TextBlock.vue'
import SearchBlock from './SearchBlock.vue'
import ParamBlock from './ParamBlock.vue'
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

const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()

// Résolus via l'auto-import Nuxt pour éviter le cycle d'import
// BlockRenderer → LoopBlock/IfBlock → CanvasZone → BlockWrapper → BlockRenderer,
// et BlockRenderer → SdEmbedBlock → BlockRenderer.
const LoopBlock = resolveComponent('LoopBlock')
const IfBlock = resolveComponent('IfBlock')
const SdEmbedBlock = resolveComponent('SdEmbedBlock')

const component = computed(() => {
  switch (props.block.type) {
    case 'loop':      return LoopBlock
    case 'if':        return IfBlock
    case 'sd-embed':  return SdEmbedBlock
    case 'param':     return ParamBlock
    case 'bar':       return BarChartBlock
    case 'line':      return LineChartBlock
    case 'pie':       return PieChartBlock
    case 'table':     return TableBlock
    case 'kpi':       return KpiBlock
    case 'record':     return RecordBlock
    case 'related':    return RelatedBlock
    case 'map':        return MapBlock
    case 'field-grid': return FieldGridBlock
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
  <component :is="component" v-if="component" :block="block" :readonly="props.readonly" :scope="props.scope" class="h-full w-full" />
  <div v-else class="flex items-center justify-center h-full text-[var(--studio-faint)] text-xs">
    Bloc inconnu : {{ block.type }}
  </div>
</template>
