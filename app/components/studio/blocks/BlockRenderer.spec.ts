import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BlockRenderer from './BlockRenderer.vue'
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
import type { BlockType, StudioBlock } from '@/types/studio'

const stubs = {
  LoopBlock: true,
  IfBlock: true,
  SdEmbedBlock: true,
  ParamBlock: true,
  BarChartBlock: true,
  LineChartBlock: true,
  PieChartBlock: true,
  TableBlock: true,
  KpiBlock: true,
  RecordBlock: true,
  RelatedBlock: true,
  MapBlock: true,
  FieldGridBlock: true,
  TextBlock: true,
  SearchBlock: true,
  ImageBlock: true,
  VideoBlock: true,
  ButtonBlock: true,
  LinkCardBlock: true,
  RetenirBlock: true,
  MultipleChoiceBlock: true,
  CheckboxesBlock: true,
  DropdownBlock: true,
  LinearScaleBlock: true,
  RatingBlock: true,
}

function makeBlock(type: BlockType): StudioBlock {
  return {
    id: 'block-1',
    type,
    zoneId: 'section-1-0',
    fieldMapping: {},
    config: {},
  }
}

function mountBlock(type: BlockType, readonly?: boolean) {
  return mount(BlockRenderer, {
    props: { block: makeBlock(type), readonly },
    global: { stubs },
  })
}

describe('BlockRenderer', () => {
  it.each<[BlockType, unknown]>([
    ['bar', BarChartBlock],
    ['line', LineChartBlock],
    ['pie', PieChartBlock],
    ['table', TableBlock],
    ['kpi', KpiBlock],
    ['record', RecordBlock],
    ['related', RelatedBlock],
    ['map', MapBlock],
    ['field-grid', FieldGridBlock],
    ['search', SearchBlock],
    ['param', ParamBlock],
    ['image', ImageBlock],
    ['video', VideoBlock],
    ['button', ButtonBlock],
    ['link-card', LinkCardBlock],
    ['retenir', RetenirBlock],
    ['choice', MultipleChoiceBlock],
    ['checkboxes', CheckboxesBlock],
    ['dropdown', DropdownBlock],
    ['scale', LinearScaleBlock],
    ['rating', RatingBlock],
  ])('resolves block.type "%s" to the matching component', (type, component) => {
    const wrapper = mountBlock(type)
    expect(wrapper.findComponent(component as never).exists()).toBe(true)
  })

  it.each<BlockType>(['heading', 'paragraph', 'quote', 'callout'])(
    'resolves text block.type "%s" to TextBlock',
    (type) => {
      const wrapper = mountBlock(type)
      expect(wrapper.findComponent(TextBlock).exists()).toBe(true)
    },
  )

  it('resolves block.type "loop" to the auto-imported LoopBlock component', () => {
    const wrapper = mountBlock('loop')
    expect(wrapper.findComponent({ name: 'LoopBlock' }).exists()).toBe(true)
  })

  it('resolves block.type "if" to the auto-imported IfBlock component', () => {
    const wrapper = mountBlock('if')
    expect(wrapper.findComponent({ name: 'IfBlock' }).exists()).toBe(true)
  })

  it('resolves block.type "sd-embed" to the auto-imported SdEmbedBlock component', () => {
    const wrapper = mountBlock('sd-embed')
    expect(wrapper.findComponent({ name: 'SdEmbedBlock' }).exists()).toBe(true)
  })

  it('passes scope through to the resolved child component', () => {
    const wrapper = mount(BlockRenderer, {
      props: { block: makeBlock('kpi'), scope: { item: 'Gazole' } },
      global: { stubs },
    })
    expect(wrapper.findComponent(KpiBlock).props('scope')).toEqual({ item: 'Gazole' })
  })

  it('renders the "Bloc inconnu" fallback and no component for an unrecognized block.type', () => {
    const wrapper = mount(BlockRenderer, {
      props: { block: makeBlock('unknown-type' as BlockType) },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('Bloc inconnu : unknown-type')
    expect(wrapper.findComponent(TextBlock).exists()).toBe(false)
    expect(wrapper.findComponent(BarChartBlock).exists()).toBe(false)
  })

  it('passes readonly=true through to the resolved child component', () => {
    const wrapper = mountBlock('table', true)
    expect(wrapper.findComponent(TableBlock).props('readonly')).toBe(true)
  })

  it('defaults readonly to undefined when the prop is omitted', () => {
    const wrapper = mountBlock('table')
    expect(wrapper.findComponent(TableBlock).props('readonly')).toBeUndefined()
  })
})
