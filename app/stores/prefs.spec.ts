import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePrefsStore } from './prefs'

const stubMatchMedia = (matches: Record<string, boolean> = {}) => {
  window.matchMedia = vi.fn<(query: string) => unknown>().mockImplementation((query: string) => ({
    matches: matches[query] ?? false,
    media: query,
    addEventListener: vi.fn<(...args: unknown[]) => void>(),
    removeEventListener: vi.fn<(...args: unknown[]) => void>(),
  })) as unknown as typeof window.matchMedia
}

describe('usePrefsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
    stubMatchMedia()
    document.documentElement.removeAttribute('data-color-scheme')
  })

  it('has sane defaults before init', () => {
    const store = usePrefsStore()

    expect(store.colorScheme).toBe('light')
    expect(store.fontScale).toBe(100)
    expect(store.lineHeight).toBe(1.6)
    expect(store.dyslexicFont).toBe(false)
  })

  describe('setFontScale', () => {
    it('clamps to the 100-140 range and rounds', () => {
      const store = usePrefsStore()

      store.setFontScale(50)
      expect(store.fontScale).toBe(100)

      store.setFontScale(200)
      expect(store.fontScale).toBe(140)

      store.setFontScale(112.6)
      expect(store.fontScale).toBe(113)
    })
  })

  describe('setLineHeight', () => {
    it('clamps to the 1.6-2.2 range and rounds to one decimal', () => {
      const store = usePrefsStore()

      store.setLineHeight(1)
      expect(store.lineHeight).toBe(1.6)

      store.setLineHeight(3)
      expect(store.lineHeight).toBe(2.2)

      store.setLineHeight(1.876)
      expect(store.lineHeight).toBe(1.9)
    })
  })

  describe('toggles', () => {
    it('flip their respective boolean', () => {
      const store = usePrefsStore()

      store.toggleDyslexicFont()
      expect(store.dyslexicFont).toBe(true)

      store.toggleReducedMotion()
      expect(store.reducedMotion).toBe(true)

      store.toggleHighContrast()
      expect(store.highContrast).toBe(true)
    })
  })

  describe('init', () => {
    it('adopts the system color scheme and reduced-motion preference', () => {
      stubMatchMedia({ '(prefers-color-scheme: dark)': true, '(prefers-reduced-motion: reduce)': true })
      const store = usePrefsStore()

      store.init()

      expect(store.colorScheme).toBe('dark')
      expect(store.reducedMotion).toBe(true)
    })

    it('restores valid preferences saved in a previous session', () => {
      window.localStorage.setItem(
        'statsio-prefs',
        JSON.stringify({ colorScheme: 'dark', fontScale: 120, dyslexicFont: true }),
      )
      const store = usePrefsStore()

      store.init()

      expect(store.colorScheme).toBe('dark')
      expect(store.fontScale).toBe(120)
      expect(store.dyslexicFont).toBe(true)
    })

    it('ignores corrupted saved preferences and falls back to defaults', async () => {
      window.localStorage.setItem('statsio-prefs', '{not-json')
      const store = usePrefsStore()

      store.init()
      await nextTick()

      expect(store.colorScheme).toBe('light')
      // The immediate watcher re-persists the (now default) state, overwriting the corrupted entry.
      const saved = JSON.parse(window.localStorage.getItem('statsio-prefs') ?? '{}')
      expect(saved.fontScale).toBe(100)
    })

    it('applies the current preferences to the document root', async () => {
      const store = usePrefsStore()

      store.init()
      store.toggleHighContrast()
      await nextTick()

      expect(document.documentElement.dataset.contrast).toBe('high')
      expect(document.documentElement.style.getPropertyValue('--app-font-scale')).toBe('1')
    })

    it('persists every change back to localStorage', async () => {
      const store = usePrefsStore()

      store.init()
      store.setFontScale(130)
      await nextTick()

      const saved = JSON.parse(window.localStorage.getItem('statsio-prefs') ?? '{}')
      expect(saved.fontScale).toBe(130)
    })
  })

  describe('reset', () => {
    it('restores every preference to its system/default value', () => {
      const store = usePrefsStore()
      store.init()
      store.setFontScale(140)
      store.toggleDyslexicFont()
      store.toggleHighContrast()

      store.reset()

      expect(store.fontScale).toBe(100)
      expect(store.lineHeight).toBe(1.6)
      expect(store.dyslexicFont).toBe(false)
      expect(store.highContrast).toBe(false)
    })
  })
})
