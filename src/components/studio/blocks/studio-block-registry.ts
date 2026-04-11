import type { Component } from 'vue'
import type { StudioBlockType } from '@/types/studio-document'
import StudioBlockChart from '@/components/studio/blocks/StudioBlockChart.vue'
import StudioBlockImage from '@/components/studio/blocks/StudioBlockImage.vue'
import StudioBlockTable from '@/components/studio/blocks/StudioBlockTable.vue'
import StudioBlockTextHeading from '@/components/studio/blocks/StudioBlockTextHeading.vue'
import StudioBlockTextParagraph from '@/components/studio/blocks/StudioBlockTextParagraph.vue'

export const studioBlockRegistry = {
  text_heading: StudioBlockTextHeading,
  text_paragraph: StudioBlockTextParagraph,
  chart: StudioBlockChart,
  table: StudioBlockTable,
  image: StudioBlockImage,
} satisfies Record<StudioBlockType, Component>

export function resolveStudioBlock(type: StudioBlockType): Component {
  return studioBlockRegistry[type]
}
