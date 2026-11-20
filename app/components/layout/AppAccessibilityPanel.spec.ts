import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AppAccessibilityPanel from './AppAccessibilityPanel.vue'
import { usePrefsStore } from '@/stores/prefs'

function mountOpen() {
  const w = mount(AppAccessibilityPanel, { attachTo: document.body })
  ;(w.vm as unknown as { open: () => void }).open()
  return w
}

describe('AppAccessibilityPanel', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('switches the colour scheme from the previews', async () => {
    const w = mountOpen()
    await w.vm.$nextTick()
    const dark = w.findAll('.ds-a11y__scheme').find((b) => b.text().includes('Sombre'))!
    await dark.trigger('click')
    expect(usePrefsStore().colorScheme).toBe('dark')
    expect(dark.attributes('aria-pressed')).toBe('true')
    w.unmount()
  })

  it('exposes reading tools as switches', async () => {
    const w = mountOpen()
    await w.vm.$nextTick()
    const switches = w.findAll('[role="switch"]')
    expect(switches).toHaveLength(3)
    await switches[1]!.trigger('click')
    expect(usePrefsStore().reducedMotion).toBe(true)
    expect(switches[1]!.attributes('aria-checked')).toBe('true')
    w.unmount()
  })

  it('updates the text size from the slider', async () => {
    const w = mountOpen()
    await w.vm.$nextTick()
    const range = w.find('input[aria-labelledby="pref-font-scale"]')
    await range.setValue('120')
    expect(usePrefsStore().fontScale).toBe(120)
    expect(w.find('.ds-a11y__value').text()).toBe('120 %')
    w.unmount()
  })
})
