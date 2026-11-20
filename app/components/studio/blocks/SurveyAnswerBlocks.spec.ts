import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import NumberAnswerBlock from './NumberAnswerBlock.vue'
import TextAnswerBlock from './TextAnswerBlock.vue'
import type { StudioBlock } from '@/types/studio'

beforeEach(() => setActivePinia(createPinia()))

const block = (type: StudioBlock['type'], config: StudioBlock['config']): StudioBlock => ({
  id: 'b1', type, zoneId: 's-0', fieldMapping: {}, config,
})

describe('question blocks (Studio preview)', () => {
  it('Nombre shows its unit and the static stepper', () => {
    const w = mount(NumberAnswerBlock, { props: { block: block('number', { title: 'Combien de jours ?', formUnit: 'jours' }) } })
    expect(w.text()).toContain('Combien de jours ?')
    expect(w.text()).toContain('jours')
    expect(w.text()).toContain('Aperçu')
  })

  it('Réponse libre switches between long and short field', () => {
    const long = mount(TextAnswerBlock, { props: { block: block('text-answer', { title: 'Un mot ?' }) } })
    expect(long.find('.min-h-\\[96px\\]').exists()).toBe(true)
    const short = mount(TextAnswerBlock, { props: { block: block('text-answer', { title: 'Un mot ?', formLongAnswer: false }) } })
    expect(short.find('.h-\\[46px\\]').exists()).toBe(true)
  })
})
