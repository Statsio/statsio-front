import type { Component } from 'vue'
import type { StudioBlockType } from '@/types/studio-document'
import StudioBlockChart from '@/components/studio/blocks/StudioBlockChart.vue'
import StudioBlockCallout from '@/components/studio/blocks/StudioBlockCallout.vue'
import StudioBlockDivider from '@/components/studio/blocks/StudioBlockDivider.vue'
import StudioBlockImage from '@/components/studio/blocks/StudioBlockImage.vue'
import StudioBlockKpi from '@/components/studio/blocks/StudioBlockKpi.vue'
import StudioBlockLayoutColumns from '@/components/studio/blocks/StudioBlockLayoutColumns.vue'
import StudioBlockTable from '@/components/studio/blocks/StudioBlockTable.vue'
import StudioBlockTextHeading from '@/components/studio/blocks/StudioBlockTextHeading.vue'
import StudioBlockTextParagraph from '@/components/studio/blocks/StudioBlockTextParagraph.vue'
import StudioSearchBarBlock from '@/components/studio/blocks/StudioSearchBarBlock.vue'
import StudioBlockLink from '@/components/studio/blocks/StudioBlockLink.vue'
import StudioBlockLinkButton from '@/components/studio/blocks/StudioBlockLinkButton.vue'
import StudioBlockLinkBack from '@/components/studio/blocks/StudioBlockLinkBack.vue'

export const studioBlockRegistry = {
  text_heading: StudioBlockTextHeading,
  text_paragraph: StudioBlockTextParagraph,
  layout_2col: StudioBlockLayoutColumns,
  layout_3col: StudioBlockLayoutColumns,
  chart: StudioBlockChart,
  chart_line: StudioBlockChart,
  chart_pie: StudioBlockChart,
  chart_donut: StudioBlockChart,
  table: StudioBlockTable,
  kpi: StudioBlockKpi,
  callout: StudioBlockCallout,
  divider: StudioBlockDivider,
  image: StudioBlockImage,
  search_bar: StudioSearchBarBlock,
  link: StudioBlockLink,
  link_button: StudioBlockLinkButton,
  link_back: StudioBlockLinkBack,
} satisfies Record<StudioBlockType, Component>

export function resolveStudioBlock(type: StudioBlockType): Component {
  return studioBlockRegistry[type]
}
