<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAccessibilityPreferences } from '@/composables/useAccessibilityPreferences'

const isOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)

const {
  theme,
  fontScale,
  lineHeight,
  dyslexicFont,
  reducedMotion,
  highContrast,
  isReading,
  speechSupported,
  speechError,
  setTheme,
  setFontScale,
  setLineHeight,
  toggleDyslexicFont,
  toggleReducedMotion,
  toggleHighContrast,
  toggleReading,
  resetPreferences,
} = useAccessibilityPreferences()

const fontScaleLabel = computed(() => `${fontScale.value}%`)
const lineHeightLabel = computed(() => lineHeight.value.toFixed(1).replace('.', ','))

const handleFontScaleInput = (event: Event) => {
  setFontScale(Number((event.target as HTMLInputElement).value))
}

const handleLineHeightInput = (event: Event) => {
  setLineHeight(Number((event.target as HTMLInputElement).value))
}

const closePanel = () => {
  isOpen.value = false
}

const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target

  if (!(target instanceof Node) || !panelRef.value?.contains(target)) {
    closePanel()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closePanel()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="panelRef" class="relative">
    <button type="button" :aria-expanded="isOpen" aria-controls="accessibility-panel"
      class="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
      @click="togglePanel">
      <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="5" r="2.25" stroke="currentColor" stroke-width="1.8" />
        <path d="M12 8.75V13.5M9 10.5L12 13.5L15 10.5M8 20L10.6 15.25M16 20L13.4 15.25" stroke="currentColor"
          stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div v-if="isOpen" id="accessibility-panel"
      class="accessibility-panel absolute right-0 top-[calc(100%+0.75rem)] z-50 max-h-[calc(100vh-8rem)] w-[min(24rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 text-slate-900 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="eyebrow">Accessibilité</p>
          <h2 class="text-xl font-semibold text-slate-900">Lecture et confort</h2>
        </div>
        <button type="button"
          class="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          @click="closePanel">
          Fermer
        </button>
      </div>

      <div class="mt-5 grid gap-5">
        <section class="grid gap-3" aria-labelledby="theme-heading">
          <div class="flex items-center justify-between gap-3">
            <h3 id="theme-heading" class="text-sm font-semibold text-slate-900">Thème</h3>
            <span class="text-xs text-slate-500">Choix enregistré automatiquement</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" :aria-pressed="theme === 'light'" :class="[
              'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
              theme === 'light'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
            ]" @click="setTheme('light')">
              Clair
            </button>
            <button type="button" :aria-pressed="theme === 'dark'" :class="[
              'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
              theme === 'dark'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
            ]" @click="setTheme('dark')">
              Sombre
            </button>
          </div>
        </section>

        <section class="grid gap-3" aria-labelledby="font-scale-heading">
          <div class="flex items-center justify-between gap-3">
            <h3 id="font-scale-heading" class="text-sm font-semibold text-slate-900">Taille du texte</h3>
            <span class="text-sm font-semibold text-slate-600">{{ fontScaleLabel }}</span>
          </div>
          <input :value="fontScale" type="range" min="100" max="140" step="10"
            class="w-full accent-[var(--color-primary)]" @input="handleFontScaleInput" />
        </section>

        <section class="grid gap-3" aria-labelledby="line-height-heading">
          <div class="flex items-center justify-between gap-3">
            <h3 id="line-height-heading" class="text-sm font-semibold text-slate-900">Interligne</h3>
            <span class="text-sm font-semibold text-slate-600">{{ lineHeightLabel }}</span>
          </div>
          <input :value="lineHeight" type="range" min="1.6" max="2.2" step="0.1"
            class="w-full accent-[var(--color-primary)]" @input="handleLineHeightInput" />
        </section>

        <section class="grid gap-2" aria-labelledby="reading-tools-heading">
          <h3 id="reading-tools-heading" class="text-sm font-semibold text-slate-900">Outils de lecture</h3>
          <button type="button" :aria-pressed="dyslexicFont"
            class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            @click="toggleDyslexicFont()">
            <span>Police adaptée à la dyslexie</span>
            <span class="text-xs font-semibold text-slate-500">{{ dyslexicFont ? 'Activée' : 'Désactivée' }}</span>
          </button>
          <button type="button" :aria-pressed="reducedMotion"
            class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            @click="toggleReducedMotion()">
            <span>Désactiver les animations</span>
            <span class="text-xs font-semibold text-slate-500">{{ reducedMotion ? 'Activée' : 'Désactivée' }}</span>
          </button>
          <button type="button" :aria-pressed="highContrast"
            class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            @click="toggleHighContrast()">
            <span>Contraste renforcé</span>
            <span class="text-xs font-semibold text-slate-500">{{ highContrast ? 'Activé' : 'Désactivé' }}</span>
          </button>
        </section>

        <section class="grid gap-3" aria-labelledby="speech-heading">
          <div class="flex items-center justify-between gap-3">
            <h3 id="speech-heading" class="text-sm font-semibold text-slate-900">Lecture vocale</h3>
            <span class="text-xs text-slate-500">
              {{ speechSupported ? 'Navigateur compatible' : 'Non disponible ici' }}
            </span>
          </div>
          <AppButton variant="secondary" size="md" :disabled="!speechSupported" class="w-full justify-center"
            @click="toggleReading()">
            {{ isReading ? 'Arrêter la lecture' : 'Lire la page à voix haute' }}
          </AppButton>
          <p aria-live="polite" class="min-h-5 text-sm text-slate-500">
            {{ speechError || (isReading ? 'Lecture en cours du contenu principal.' : '') }}
          </p>
        </section>

        <AppButton variant="outline" size="md" class="w-full justify-center" @click="resetPreferences()">
          Réinitialiser les réglages
        </AppButton>
      </div>
    </div>
  </div>
</template>
