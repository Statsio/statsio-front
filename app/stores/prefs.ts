import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

type ColorScheme = 'light' | 'dark'

interface StoredPrefs {
  colorScheme: ColorScheme
  fontScale: number
  lineHeight: number
  dyslexicFont: boolean
  reducedMotion: boolean
  highContrast: boolean
}

const STORAGE_KEY = 'statsio-prefs'
const DEFAULT_FONT_SCALE = 100
const DEFAULT_LINE_HEIGHT = 1.6

const clampFontScale = (v: number) => Math.min(Math.max(Math.round(v), 100), 140)
const clampLineHeight = (v: number) => Math.min(Math.max(Number(v.toFixed(1)), 1.6), 2.2)

export const usePrefsStore = defineStore('prefs', () => {
  const colorScheme = ref<ColorScheme>('light')
  const fontScale = ref(DEFAULT_FONT_SCALE)
  const lineHeight = ref(DEFAULT_LINE_HEIGHT)
  const dyslexicFont = ref(false)
  const reducedMotion = ref(false)
  const highContrast = ref(false)

  function setColorScheme(v: ColorScheme) { colorScheme.value = v }
  function setFontScale(v: number) { fontScale.value = clampFontScale(v) }
  function setLineHeight(v: number) { lineHeight.value = clampLineHeight(v) }
  function toggleDyslexicFont() { dyslexicFont.value = !dyslexicFont.value }
  function toggleReducedMotion() { reducedMotion.value = !reducedMotion.value }
  function toggleHighContrast() { highContrast.value = !highContrast.value }

  function reset() {
    colorScheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    fontScale.value = DEFAULT_FONT_SCALE
    lineHeight.value = DEFAULT_LINE_HEIGHT
    dyslexicFont.value = false
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    highContrast.value = false
  }

  function applyToDOM() {
    const root = document.documentElement
    root.dataset.colorScheme = colorScheme.value
    root.dataset.motion = reducedMotion.value ? 'reduced' : 'full'
    root.dataset.contrast = highContrast.value ? 'high' : 'default'
    root.dataset.font = dyslexicFont.value ? 'dyslexic' : 'default'
    root.style.colorScheme = colorScheme.value
    root.style.setProperty('--app-font-scale', String(fontScale.value / 100))
    root.style.setProperty('--app-line-height', String(lineHeight.value))
  }

  function save() {
    const payload: StoredPrefs = {
      colorScheme: colorScheme.value,
      fontScale: fontScale.value,
      lineHeight: lineHeight.value,
      dyslexicFont: dyslexicFont.value,
      reducedMotion: reducedMotion.value,
      highContrast: highContrast.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  function init() {
    // System defaults
    colorScheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Restore saved prefs
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const p = JSON.parse(raw) as Partial<StoredPrefs>
        if (p.colorScheme === 'dark' || p.colorScheme === 'light') colorScheme.value = p.colorScheme
        if (typeof p.fontScale === 'number') fontScale.value = clampFontScale(p.fontScale)
        if (typeof p.lineHeight === 'number') lineHeight.value = clampLineHeight(p.lineHeight)
        if (typeof p.dyslexicFont === 'boolean') dyslexicFont.value = p.dyslexicFont
        if (typeof p.reducedMotion === 'boolean') reducedMotion.value = p.reducedMotion
        if (typeof p.highContrast === 'boolean') highContrast.value = p.highContrast
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }

    // Reactively apply to DOM + persist on every change
    watch(
      [colorScheme, fontScale, lineHeight, dyslexicFont, reducedMotion, highContrast],
      () => { applyToDOM(); save() },
      { immediate: true },
    )
  }

  return {
    colorScheme, fontScale, lineHeight, dyslexicFont, reducedMotion, highContrast,
    setColorScheme, setFontScale, setLineHeight,
    toggleDyslexicFont, toggleReducedMotion, toggleHighContrast,
    reset, init,
  }
})
