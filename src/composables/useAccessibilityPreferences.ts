import { computed, ref, watch } from 'vue'

type ThemeMode = 'light' | 'dark'

type StoredAccessibilityPreferences = {
  theme: ThemeMode
  fontScale: number
  lineHeight: number
  dyslexicFont: boolean
  reducedMotion: boolean
  highContrast: boolean
}

const STORAGE_KEY = 'statsio-accessibility-preferences'
const DEFAULT_FONT_SCALE = 100
const DEFAULT_LINE_HEIGHT = 1.6
const THEME_VARIABLES = {
  light: {
    '--color-background': '#ffffff',
    '--color-background-soft': '#f8f8f8',
    '--color-background-mute': '#f2f2f2',
    '--color-border': 'rgba(60, 60, 60, 0.12)',
    '--color-border-hover': 'rgba(60, 60, 60, 0.29)',
    '--color-heading': '#2c3e50',
    '--color-text': '#2c3e50',
    '--color-primary': '#8b5cf6',
    '--color-secondary': '#dccaf8',
    '--color-accent': '#3b82f6',
    '--app-surface': '#ffffff',
    '--app-surface-muted': '#f8fafc',
    '--app-surface-soft': 'rgba(255, 255, 255, 0.8)',
    '--app-border': '#e2e8f0',
    '--app-text-strong': '#0f172a',
    '--app-text-default': '#1e293b',
    '--app-text-muted': '#475569',
    '--app-body-background':
      'linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(180deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px), radial-gradient(900px 480px at 15% -10%, rgba(139, 92, 246, 0.12), transparent 70%), #f8fafc',
    '--app-badge-border': 'rgba(139, 92, 246, 0.3)',
    '--app-badge-surface': 'rgba(139, 92, 246, 0.08)',
    '--app-badge-text': '#4c1d95',
  },
  dark: {
    '--color-background': '#181818',
    '--color-background-soft': '#222222',
    '--color-background-mute': '#282828',
    '--color-border': 'rgba(84, 84, 84, 0.48)',
    '--color-border-hover': 'rgba(84, 84, 84, 0.65)',
    '--color-heading': '#ffffff',
    '--color-text': 'rgba(235, 235, 235, 0.64)',
    '--color-primary': '#a78bfa',
    '--color-secondary': '#312e81',
    '--color-accent': '#60a5fa',
    '--app-surface': '#0f172a',
    '--app-surface-muted': '#162033',
    '--app-surface-soft': 'rgba(15, 23, 42, 0.84)',
    '--app-border': '#334155',
    '--app-text-strong': '#f8fafc',
    '--app-text-default': '#e2e8f0',
    '--app-text-muted': '#cbd5e1',
    '--app-body-background':
      'linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px), radial-gradient(900px 480px at 15% -10%, rgba(96, 165, 250, 0.14), transparent 70%), #020617',
    '--app-badge-border': 'rgba(167, 139, 250, 0.42)',
    '--app-badge-surface': 'rgba(167, 139, 250, 0.18)',
    '--app-badge-text': '#ddd6fe',
  },
} as const

const theme = ref<ThemeMode>('light')
const fontScale = ref(DEFAULT_FONT_SCALE)
const lineHeight = ref(DEFAULT_LINE_HEIGHT)
const dyslexicFont = ref(false)
const reducedMotion = ref(false)
const highContrast = ref(false)
const isReading = ref(false)
const speechError = ref('')

let isInitialized = false
let activeUtterance: SpeechSynthesisUtterance | null = null

const speechSupported = computed(
  () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
)

const clampFontScale = (value: number) => Math.min(Math.max(Math.round(value), 100), 140)
const clampLineHeight = (value: number) => Math.min(Math.max(Number(value.toFixed(1)), 1.6), 2.2)

const savePreferences = () => {
  if (typeof window === 'undefined') return

  const payload: StoredAccessibilityPreferences = {
    theme: theme.value,
    fontScale: fontScale.value,
    lineHeight: lineHeight.value,
    dyslexicFont: dyslexicFont.value,
    reducedMotion: reducedMotion.value,
    highContrast: highContrast.value,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const applyPreferences = () => {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const activeThemeVariables = THEME_VARIABLES[theme.value]

  root.dataset.theme = theme.value
  root.dataset.motion = reducedMotion.value ? 'reduced' : 'full'
  root.dataset.contrast = highContrast.value ? 'high' : 'default'
  root.dataset.font = dyslexicFont.value ? 'dyslexic' : 'default'
  root.style.colorScheme = theme.value

  Object.entries(activeThemeVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value)
  })

  root.style.setProperty('--app-font-scale', String(fontScale.value / 100))
  root.style.setProperty('--app-line-height', String(lineHeight.value))
}

const loadPreferences = () => {
  if (typeof window === 'undefined') return

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  theme.value = prefersDark ? 'dark' : 'light'
  reducedMotion.value = prefersReducedMotion

  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) return

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredAccessibilityPreferences>
    theme.value = parsed.theme === 'dark' ? 'dark' : 'light'
    fontScale.value = clampFontScale(parsed.fontScale ?? DEFAULT_FONT_SCALE)
    lineHeight.value = clampLineHeight(parsed.lineHeight ?? DEFAULT_LINE_HEIGHT)
    dyslexicFont.value = Boolean(parsed.dyslexicFont)
    reducedMotion.value = Boolean(parsed.reducedMotion ?? prefersReducedMotion)
    highContrast.value = Boolean(parsed.highContrast)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

const stopReading = () => {
  if (typeof window === 'undefined' || !speechSupported.value) return

  window.speechSynthesis.cancel()
  isReading.value = false
  activeUtterance = null
}

const toggleReading = (targetId = 'main-content') => {
  if (!speechSupported.value || typeof document === 'undefined') {
    speechError.value = 'La lecture vocale n’est pas disponible dans ce navigateur.'
    return
  }

  if (isReading.value) {
    stopReading()
    speechError.value = ''
    return
  }

  const target = document.getElementById(targetId)
  const text = target?.innerText?.trim()

  if (!text) {
    speechError.value = 'Aucun contenu lisible n’a été trouvé sur cette page.'
    return
  }

  speechError.value = ''
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
  utterance.rate = 1
  utterance.pitch = 1
  utterance.onend = () => {
    isReading.value = false
    activeUtterance = null
  }
  utterance.onerror = () => {
    speechError.value = 'La lecture vocale a rencontré un problème.'
    isReading.value = false
    activeUtterance = null
  }

  activeUtterance = utterance
  isReading.value = true
  window.speechSynthesis.speak(utterance)
}

const resetPreferences = () => {
  if (typeof window === 'undefined') return

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  theme.value = prefersDark ? 'dark' : 'light'
  fontScale.value = DEFAULT_FONT_SCALE
  lineHeight.value = DEFAULT_LINE_HEIGHT
  dyslexicFont.value = false
  reducedMotion.value = prefersReducedMotion
  highContrast.value = false
  speechError.value = ''
  stopReading()
}

const initialize = () => {
  if (isInitialized || typeof window === 'undefined') return

  isInitialized = true
  loadPreferences()

  watch([theme, fontScale, lineHeight, dyslexicFont, reducedMotion, highContrast], () => {
    applyPreferences()
    savePreferences()
  }, { immediate: true })
}

export const useAccessibilityPreferences = () => {
  initialize()

  return {
    theme,
    fontScale,
    lineHeight,
    dyslexicFont,
    reducedMotion,
    highContrast,
    isReading,
    speechSupported,
    speechError,
    setTheme: (value: ThemeMode) => {
      theme.value = value
    },
    setFontScale: (value: number) => {
      fontScale.value = clampFontScale(value)
    },
    setLineHeight: (value: number) => {
      lineHeight.value = clampLineHeight(value)
    },
    toggleDyslexicFont: () => {
      dyslexicFont.value = !dyslexicFont.value
    },
    toggleReducedMotion: () => {
      reducedMotion.value = !reducedMotion.value
    },
    toggleHighContrast: () => {
      highContrast.value = !highContrast.value
    },
    toggleReading,
    stopReading,
    resetPreferences,
  }
}
