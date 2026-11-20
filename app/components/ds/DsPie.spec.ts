import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DsPie from './DsPie.vue'

const segments = [
  { value: 3, color: 'red', label: 'A' },
  { value: 1, color: 'blue', label: 'B' },
]

describe('DsPie', () => {
  it('draws one slice per segment (no animation)', () => {
    const w = mount(DsPie, { props: { segments, animate: false } })
    const paths = w.findAll('path.ds-pie__slice')
    expect(paths).toHaveLength(2)
    expect(paths.every((p) => (p.attributes('d') ?? '').startsWith('M60 60'))).toBe(true)
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('A : 3, B : 1')
  })

  it('marks a « votre part » slice with the dedicated colour', () => {
    const w = mount(DsPie, { props: { segments: [{ value: 1, color: 'red', you: true }], animate: false } })
    expect(w.find('path.ds-pie__slice').attributes('style')).toContain('var(--ds-vous)')
  })

  it('exposes keyboard-selectable slices when interactive', async () => {
    const w = mount(DsPie, { props: { segments, animate: false, interactive: true, selected: 0 } })
    const [first, second] = w.findAll('path.ds-pie__slice')
    expect(first!.attributes('role')).toBe('button')
    expect(first!.attributes('aria-pressed')).toBe('true')
    expect(first!.attributes('style')).toContain('translate(')
    expect(second!.classes()).toContain('is-dimmed')

    await second!.trigger('keydown', { key: 'Enter' })
    await second!.trigger('click')
    expect(w.emitted('select')).toEqual([[1], [1]])
  })
})
