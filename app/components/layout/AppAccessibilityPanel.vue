<script setup lang="ts">
import { usePrefsStore } from '@/stores/prefs'
import { useClickOutside } from '@/composables/useClickOutside'

const prefs = usePrefsStore()

const isOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)

function togglePanel() { isOpen.value = !isOpen.value }
function closePanel() { isOpen.value = false }

defineExpose({ open: () => { isOpen.value = true } })

useClickOutside(panelRef, closePanel)

function onFontScaleInput(e: Event) {
  prefs.setFontScale(Number((e.target as HTMLInputElement).value))
}
function onLineHeightInput(e: Event) {
  prefs.setLineHeight(Number((e.target as HTMLInputElement).value))
}

const fontScaleLabel = computed(() => `${prefs.fontScale}%`)
const lineHeightLabel = computed(() => prefs.lineHeight.toFixed(1).replace('.', ','))

// ─── Speech synthesis (runtime UI, not persisted) ────────────────────────
const isReading = ref(false)
const speechError = ref('')
const speechSupported = computed(
  () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
)
// Référence forte conservée : certains navigateurs (Chrome) interrompent un SpeechSynthesisUtterance
// en cours si aucune référence externe n'est gardée en vie (bug connu du moteur de synthèse vocale).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let activeUtterance: SpeechSynthesisUtterance | null = null

function toggleReading() {
  if (!speechSupported.value) {
    speechError.value = 'La lecture vocale n\'est pas disponible dans ce navigateur.'
    return
  }
  if (isReading.value) {
    window.speechSynthesis.cancel()
    isReading.value = false
    speechError.value = ''
    return
  }
  const text = document.getElementById('main-content')?.innerText?.trim()
  if (!text) {
    speechError.value = 'Aucun contenu lisible n\'a été trouvé sur cette page.'
    return
  }
  speechError.value = ''
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
  utterance.onend = () => { isReading.value = false; activeUtterance = null }
  utterance.onerror = () => { speechError.value = 'La lecture vocale a rencontré un problème.'; isReading.value = false; activeUtterance = null }
  activeUtterance = utterance
  isReading.value = true
  window.speechSynthesis.speak(utterance)
}

onBeforeUnmount(() => {
  if (isReading.value) window.speechSynthesis.cancel()
})
</script>

<template>
  <div ref="panelRef" class="relative">
    <!-- Trigger -->
    <button
      type="button"
      :aria-expanded="isOpen"
      aria-controls="accessibility-panel"
      aria-label="Préférences d'accessibilité"
      class="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
      @click="togglePanel"
    >
      <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="5" r="2.25" stroke="currentColor" stroke-width="1.8" />
        <path d="M12 8.75V13.5M9 10.5L12 13.5L15 10.5M8 20L10.6 15.25M16 20L13.4 15.25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <!-- Panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-1"
    >
      <div
        v-if="isOpen"
        id="accessibility-panel"
        class="absolute right-0 top-[calc(100%+0.75rem)] z-50 max-h-[calc(100vh-8rem)] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur max-sm:fixed max-sm:inset-x-2 max-sm:top-[7.5rem] max-sm:w-auto"
        role="dialog"
        aria-label="Préférences d'accessibilité"
      >
        <!-- Header -->
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Accessibilité</p>
            <h2 class="text-lg font-semibold text-slate-900">Lecture et confort</h2>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Fermer"
            @click="closePanel"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="grid gap-4">
          <!-- Colour scheme -->
          <section aria-labelledby="pref-theme">
            <h3 id="pref-theme" class="mb-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Thème</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="option in [{ value: 'light', label: 'Clair' }, { value: 'dark', label: 'Sombre' }] as const"
                :key="option.value"
                type="button"
                :aria-pressed="prefs.colorScheme === option.value"
                :class="[
                  'flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
                  prefs.colorScheme === option.value
                    ? 'border-primary/30 bg-primary/8 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
                ]"
                @click="prefs.setColorScheme(option.value)"
              >
                <svg v-if="option.value === 'light'" viewBox="0 0 20 20" class="h-4 w-4" fill="none">
                  <circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.6" />
                  <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06M14.72 14.72l1.06 1.06M15.78 4.22l-1.06 1.06M5.28 14.72l-1.06 1.06" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <svg v-else viewBox="0 0 20 20" class="h-4 w-4" fill="none">
                  <path d="M17 11.5A7 7 0 0 1 8.5 3a7 7 0 1 0 8.5 8.5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ option.label }}
              </button>
            </div>
          </section>

          <!-- Font scale -->
          <section aria-labelledby="pref-font-scale">
            <div class="mb-2.5 flex items-center justify-between">
              <h3 id="pref-font-scale" class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Taille du texte</h3>
              <span class="text-sm font-semibold tabular-nums text-slate-700">{{ fontScaleLabel }}</span>
            </div>
            <input
              :value="prefs.fontScale"
              type="range"
              min="100"
              max="140"
              step="10"
              class="w-full accent-primary"
              aria-labelledby="pref-font-scale"
              @input="onFontScaleInput"
            />
            <div class="mt-1.5 flex justify-between text-[10px] font-medium text-slate-400">
              <span>Normal</span><span>+10%</span><span>+20%</span><span>+30%</span><span>+40%</span>
            </div>
          </section>

          <!-- Line height -->
          <section aria-labelledby="pref-line-height">
            <div class="mb-2.5 flex items-center justify-between">
              <h3 id="pref-line-height" class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Interligne</h3>
              <span class="text-sm font-semibold tabular-nums text-slate-700">{{ lineHeightLabel }}</span>
            </div>
            <input
              :value="prefs.lineHeight"
              type="range"
              min="1.6"
              max="2.2"
              step="0.1"
              class="w-full accent-primary"
              aria-labelledby="pref-line-height"
              @input="onLineHeightInput"
            />
          </section>

          <!-- Toggle options -->
          <section aria-labelledby="pref-reading">
            <h3 id="pref-reading" class="mb-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Outils de lecture</h3>
            <div class="grid gap-2">
              <button
                v-for="option in [
                  { key: 'dyslexicFont', label: 'Police adaptée à la dyslexie', active: prefs.dyslexicFont, toggle: prefs.toggleDyslexicFont },
                  { key: 'reducedMotion', label: 'Désactiver les animations', active: prefs.reducedMotion, toggle: prefs.toggleReducedMotion },
                  { key: 'highContrast', label: 'Contraste renforcé', active: prefs.highContrast, toggle: prefs.toggleHighContrast },
                ]"
                :key="option.key"
                type="button"
                :aria-pressed="option.active"
                class="flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition"
                :class="option.active
                  ? 'border-primary/25 bg-primary/6 text-slate-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'"
                @click="option.toggle()"
              >
                <span>{{ option.label }}</span>
                <!-- Toggle pill -->
                <span
                  class="ml-3 flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200"
                  :class="option.active ? 'bg-primary' : 'bg-slate-200'"
                >
                  <span
                    class="h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                    :class="option.active ? 'translate-x-4.5' : 'translate-x-0.5'"
                  />
                </span>
              </button>
            </div>
          </section>

          <!-- Speech -->
          <section aria-labelledby="pref-speech">
            <div class="mb-2.5 flex items-center justify-between">
              <h3 id="pref-speech" class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Lecture vocale</h3>
              <span class="text-[10px] font-medium text-slate-400">
                {{ speechSupported ? 'Compatible' : 'Non disponible' }}
              </span>
            </div>
            <button
              type="button"
              :disabled="!speechSupported"
              class="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              @click="toggleReading"
            >
              <svg v-if="isReading" viewBox="0 0 20 20" class="h-4 w-4" fill="none">
                <rect x="5" y="4" width="3" height="12" rx="1" fill="currentColor" />
                <rect x="12" y="4" width="3" height="12" rx="1" fill="currentColor" />
              </svg>
              <svg v-else viewBox="0 0 20 20" class="h-4 w-4" fill="none">
                <path d="M6 4l10 6-10 6V4z" fill="currentColor" />
              </svg>
              {{ isReading ? 'Arrêter la lecture' : 'Lire la page à voix haute' }}
            </button>
            <p v-if="speechError || isReading" aria-live="polite" class="mt-2 text-xs text-slate-500">
              {{ speechError || 'Lecture en cours du contenu principal.' }}
            </p>
          </section>

          <!-- Reset -->
          <button
            type="button"
            class="flex w-full items-center justify-center rounded-2xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            @click="prefs.reset()"
          >
            Réinitialiser les réglages
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
