<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { usePrefsStore } from '@/stores/prefs'
import { useClickOutside } from '@/composables/useClickOutside'
import DsButton from '@/components/ds/DsButton.vue'
import DsHeading from '@/components/ds/DsHeading.vue'
import DsLabel from '@/components/ds/DsLabel.vue'

/**
 * Préférences d'accessibilité (charte « Tranches », Bold Outline).
 * Tout passe par les tokens `--ds-*` : le panneau bascule de lui-même en mode
 * sombre (`data-color-scheme`) et prend les couleurs de TVStats / Medistats.
 * Réglages persistés par `usePrefsStore` (thème, taille, interligne, dyslexie,
 * animations, contraste) ; la lecture vocale reste un état d'interface.
 */
const prefs = usePrefsStore()

const isOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)

function togglePanel() {
  isOpen.value = !isOpen.value
}
function closePanel() {
  isOpen.value = false
}

defineExpose({ open: () => (isOpen.value = true) })

useClickOutside(panelRef, closePanel)

const SCHEMES = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
] as const

const FONT_STEPS = [100, 110, 120, 130, 140]

function onFontScaleInput(e: Event) {
  prefs.setFontScale(Number((e.target as HTMLInputElement).value))
}
function onLineHeightInput(e: Event) {
  prefs.setLineHeight(Number((e.target as HTMLInputElement).value))
}

const fontScaleLabel = computed(() => `${prefs.fontScale} %`)
const lineHeightLabel = computed(() => prefs.lineHeight.toFixed(1).replace('.', ','))
/** Remplissage des curseurs (0 → 100 %) pour la piste colorée. */
const fontFill = computed(() => `${((prefs.fontScale - 100) / 40) * 100}%`)
const lineFill = computed(() => `${((prefs.lineHeight - 1.6) / 0.6) * 100}%`)

const toggles = computed(() => [
  {
    key: 'dyslexicFont',
    label: 'Police adaptée à la dyslexie',
    hint: 'Lettres plus distinctes, espacement élargi.',
    active: prefs.dyslexicFont,
    toggle: prefs.toggleDyslexicFont,
  },
  {
    key: 'reducedMotion',
    label: 'Désactiver les animations',
    hint: 'Camemberts, bandeau et transitions restent figés.',
    active: prefs.reducedMotion,
    toggle: prefs.toggleReducedMotion,
  },
  {
    key: 'highContrast',
    label: 'Contraste renforcé',
    hint: 'Textes et contours plus marqués.',
    active: prefs.highContrast,
    toggle: prefs.toggleHighContrast,
  },
])

// ─── Lecture vocale (état d'interface, non persisté) ─────────────────────
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
    speechError.value = "La lecture vocale n'est pas disponible dans ce navigateur."
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
    speechError.value = "Aucun contenu lisible n'a été trouvé sur cette page."
    return
  }
  speechError.value = ''
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
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

onBeforeUnmount(() => {
  if (isReading.value) window.speechSynthesis.cancel()
})
</script>

<template>
  <div ref="panelRef" class="ds-a11y relative">
    <!-- Déclencheur -->
    <button
      type="button"
      :aria-expanded="isOpen"
      aria-controls="accessibility-panel"
      aria-label="Préférences d'accessibilité"
      class="ds-a11y__trigger hidden sm:inline-flex"
      :class="{ 'is-open': isOpen }"
      @click="togglePanel"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <circle cx="12" cy="5" r="2.25" stroke="currentColor" stroke-width="1.9" />
        <path
          d="M12 8.75V13.5M9 10.5L12 13.5L15 10.5M8 20L10.6 15.25M16 20L13.4 15.25"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <Transition name="ds-a11y">
      <div
        v-if="isOpen"
        id="accessibility-panel"
        class="ds-scope ds-a11y__panel"
        role="dialog"
        aria-labelledby="ds-a11y-title"
      >
        <!-- En-tête -->
        <div class="ds-a11y__head">
          <div>
            <DsLabel>Accessibilité</DsLabel>
            <DsHeading id="ds-a11y-title" :level="2" size="md" class="mt-1.5">Lecture et <em>confort</em></DsHeading>
          </div>
          <button type="button" class="ds-a11y__close" aria-label="Fermer" @click="closePanel">×</button>
        </div>

        <!-- Thème -->
        <section class="ds-a11y__sec" aria-labelledby="pref-theme">
          <DsLabel id="pref-theme" as="h3">Thème</DsLabel>
          <div class="ds-a11y__schemes" role="group" aria-labelledby="pref-theme">
            <button
              v-for="option in SCHEMES"
              :key="option.value"
              type="button"
              class="ds-a11y__scheme"
              :class="[`is-${option.value}`, { 'is-on': prefs.colorScheme === option.value }]"
              :aria-pressed="prefs.colorScheme === option.value"
              @click="prefs.setColorScheme(option.value)"
            >
              <!-- Aperçu de la charte dans ce thème -->
              <span class="ds-a11y__preview" aria-hidden="true">
                <span class="ds-a11y__preview-line is-title" />
                <span class="ds-a11y__preview-line" />
                <span class="ds-a11y__preview-row">
                  <svg viewBox="0 0 20 20" width="18" height="18">
                    <path d="M10 10 L10 1.5 A8.5 8.5 0 0 1 17.4 14.2 Z" class="ds-a11y__p1" />
                    <path d="M10 10 L17.4 14.2 A8.5 8.5 0 0 1 2.6 14.2 Z" class="ds-a11y__p2" />
                    <path d="M10 10 L2.6 14.2 A8.5 8.5 0 0 1 10 1.5 Z" class="ds-a11y__p3" />
                  </svg>
                  <span class="ds-a11y__preview-btn" />
                </span>
              </span>
              <span class="ds-a11y__scheme-label">
                <svg v-if="option.value === 'light'" viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.7" />
                  <path
                    d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06M14.72 14.72l1.06 1.06M15.78 4.22l-1.06 1.06M5.28 14.72l-1.06 1.06"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  />
                </svg>
                <svg v-else viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
                  <path
                    d="M17 11.5A7 7 0 0 1 8.5 3a7 7 0 1 0 8.5 8.5z"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ option.label }}
              </span>
            </button>
          </div>
        </section>

        <!-- Taille du texte -->
        <section class="ds-a11y__sec" aria-labelledby="pref-font-scale">
          <div class="ds-a11y__row">
            <DsLabel id="pref-font-scale" as="h3">Taille du texte</DsLabel>
            <span class="ds-a11y__value">{{ fontScaleLabel }}</span>
          </div>
          <input
            :value="prefs.fontScale"
            type="range"
            min="100"
            max="140"
            step="10"
            class="ds-a11y__range"
            :style="{ '--fill': fontFill }"
            aria-labelledby="pref-font-scale"
            :aria-valuetext="fontScaleLabel"
            @input="onFontScaleInput"
          />
          <div class="ds-a11y__ticks" aria-hidden="true">
            <span v-for="step in FONT_STEPS" :key="step" :class="{ 'is-on': prefs.fontScale === step }">
              {{ step === 100 ? 'Normal' : `+${step - 100} %` }}
            </span>
          </div>
        </section>

        <!-- Interligne -->
        <section class="ds-a11y__sec" aria-labelledby="pref-line-height">
          <div class="ds-a11y__row">
            <DsLabel id="pref-line-height" as="h3">Interligne</DsLabel>
            <span class="ds-a11y__value">{{ lineHeightLabel }}</span>
          </div>
          <input
            :value="prefs.lineHeight"
            type="range"
            min="1.6"
            max="2.2"
            step="0.1"
            class="ds-a11y__range"
            :style="{ '--fill': lineFill }"
            aria-labelledby="pref-line-height"
            :aria-valuetext="lineHeightLabel"
            @input="onLineHeightInput"
          />
        </section>

        <!-- Outils de lecture -->
        <section class="ds-a11y__sec" aria-labelledby="pref-reading">
          <DsLabel id="pref-reading" as="h3">Outils de lecture</DsLabel>
          <div class="ds-a11y__toggles">
            <button
              v-for="option in toggles"
              :key="option.key"
              type="button"
              role="switch"
              class="ds-a11y__toggle"
              :class="{ 'is-on': option.active }"
              :aria-checked="option.active"
              @click="option.toggle()"
            >
              <span class="min-w-0">
                <span class="ds-a11y__toggle-label">{{ option.label }}</span>
                <span class="ds-a11y__toggle-hint">{{ option.hint }}</span>
              </span>
              <span class="ds-a11y__switch" aria-hidden="true"><i /></span>
            </button>
          </div>
        </section>

        <!-- Lecture vocale -->
        <section class="ds-a11y__sec" aria-labelledby="pref-speech">
          <div class="ds-a11y__row">
            <DsLabel id="pref-speech" as="h3">Lecture vocale</DsLabel>
            <span class="ds-a11y__hint">{{ speechSupported ? 'Compatible' : 'Non disponible' }}</span>
          </div>
          <DsButton
            :variant="isReading ? 'primary' : 'secondary'"
            block
            :disabled="!speechSupported"
            :aria-pressed="isReading"
            @click="toggleReading"
          >
            <svg v-if="isReading" viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
              <rect x="5" y="4" width="3" height="12" fill="currentColor" />
              <rect x="12" y="4" width="3" height="12" fill="currentColor" />
            </svg>
            <svg v-else viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
              <path d="M6 4l10 6-10 6V4z" fill="currentColor" />
            </svg>
            {{ isReading ? 'Arrêter la lecture' : 'Lire la page à voix haute' }}
          </DsButton>
          <p v-if="speechError || isReading" aria-live="polite" class="ds-a11y__note">
            {{ speechError || 'Lecture en cours du contenu principal.' }}
          </p>
        </section>

        <button type="button" class="ds-a11y__reset" @click="prefs.reset()">Réinitialiser les réglages</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── déclencheur (aligné sur les boutons carrés du header) ── */
.ds-a11y__trigger {
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid var(--ds-divide);
  border-radius: 3px;
  background: var(--ds-surface);
  color: var(--ds-link);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.ds-a11y__trigger:hover,
.ds-a11y__trigger.is-open {
  border-color: var(--ds-ol);
  background: var(--ds-tint);
}
.ds-a11y__trigger:focus-visible,
.ds-a11y__panel :focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 3px;
}

/* ── panneau ── */
.ds-a11y__panel {
  position: absolute;
  top: calc(100% + 14px);
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: min(23rem, calc(100vw - 1rem));
  max-height: calc(100vh - 8rem);
  padding: 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-surface);
  color: var(--ds-text);
  box-shadow: 5px 5px 0 var(--ds-sh);
  font-family: var(--ds-ui);
}
@media (max-width: 639px) {
  .ds-a11y__panel {
    position: fixed;
    top: 7.5rem;
    right: 0.5rem;
    left: 0.5rem;
    width: auto;
  }
}
.ds-a11y-enter-active,
.ds-a11y-leave-active {
  transition:
    opacity 0.18s var(--ds-e-glisse),
    transform 0.18s var(--ds-e-glisse);
}
.ds-a11y-enter-from,
.ds-a11y-leave-to {
  opacity: 0;
  transform: translate(4px, -4px);
}

.ds-a11y__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--ds-divide);
}
.ds-a11y__close {
  flex: none;
  width: 32px;
  height: 32px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
  color: var(--ds-ol);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.ds-a11y__close:hover {
  background: var(--ds-tint);
}

.ds-a11y__sec {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ds-a11y__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ds-a11y__value {
  color: var(--ds-link);
  font: 500 13px var(--ds-num);
  font-variant-numeric: tabular-nums;
}
.ds-a11y__hint {
  color: var(--ds-faint);
  font: 400 11px var(--ds-num);
}

/* ── thème : deux aperçus de la charte ── */
.ds-a11y__schemes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.ds-a11y__scheme {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border: 2px solid var(--ds-divide);
  border-radius: 4px;
  background: var(--ds-surface);
  color: var(--ds-text);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}
.ds-a11y__scheme:hover {
  border-color: var(--ds-ol);
}
.ds-a11y__scheme.is-on {
  border-color: var(--ds-ol);
  background: var(--ds-tint);
  box-shadow: 3px 3px 0 var(--ds-sh);
  transform: translate(-1px, -1px);
}
/* Les aperçus portent des couleurs fixes : ils montrent le thème cible,
   quel que soit le thème actif. */
.ds-a11y__preview {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px;
  border: 2px solid;
  border-radius: 3px;
}
.is-light .ds-a11y__preview {
  --pv-bg: #ffffff;
  --pv-ink: #0e0d13;
  --pv-muted: #ddd6fe;
  --pv-ol: #6d28d9;
  --pv-sh: #a78bfa;
  --pv-btn: #6d28d9;
}
.is-dark .ds-a11y__preview {
  --pv-bg: #0f0e14;
  --pv-ink: #f1f0f6;
  --pv-muted: #3b2f5e;
  --pv-ol: #c4b5fd;
  --pv-sh: #6d28d9;
  --pv-btn: #c4b5fd;
}
.ds-a11y__preview {
  border-color: var(--pv-ol);
  background: var(--pv-bg);
  box-shadow: 2px 2px 0 var(--pv-sh);
}
.ds-a11y__preview-line {
  display: block;
  width: 70%;
  height: 5px;
  border-radius: 1px;
  background: var(--pv-muted);
}
.ds-a11y__preview-line.is-title {
  width: 85%;
  height: 8px;
  background: var(--pv-ink);
}
.ds-a11y__preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 3px;
}
.ds-a11y__p1 {
  fill: #8b5cf6;
}
.ds-a11y__p2 {
  fill: #3b82f6;
}
.ds-a11y__p3 {
  fill: #a78bfa;
}
.ds-a11y__preview-btn {
  width: 34px;
  height: 12px;
  border-radius: 2px;
  background: var(--pv-btn);
  box-shadow: 2px 2px 0 #3b82f6;
}
.ds-a11y__scheme-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 2px;
  font-size: 14px;
  font-weight: 700;
}
.ds-a11y__scheme.is-on .ds-a11y__scheme-label {
  color: var(--ds-link);
}

/* ── curseurs ── */
.ds-a11y__range {
  --fill: 0%;
  width: 100%;
  height: 22px;
  margin: 0;
  background: transparent;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}
.ds-a11y__range::-webkit-slider-runnable-track {
  height: 8px;
  border: 2px solid var(--ds-ol);
  border-radius: 0 2px 2px 0;
  background: linear-gradient(90deg, var(--ds-t1) var(--fill), var(--ds-tint) var(--fill));
}
.ds-a11y__range::-moz-range-track {
  height: 4px;
  border: 2px solid var(--ds-ol);
  border-radius: 0 2px 2px 0;
  background: var(--ds-tint);
}
.ds-a11y__range::-moz-range-progress {
  height: 4px;
  background: var(--ds-t1);
}
.ds-a11y__range::-webkit-slider-thumb {
  width: 18px;
  height: 18px;
  margin-top: -7px;
  border: 2px solid var(--ds-ol);
  border-radius: 2px;
  background: var(--ds-surface);
  box-shadow: 2px 2px 0 var(--ds-sh2);
  appearance: none;
  -webkit-appearance: none;
}
.ds-a11y__range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 2px solid var(--ds-ol);
  border-radius: 2px;
  background: var(--ds-surface);
  box-shadow: 2px 2px 0 var(--ds-sh2);
}
.ds-a11y__range:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 4px;
}
.ds-a11y__ticks {
  display: flex;
  justify-content: space-between;
  color: var(--ds-faint);
  font: 400 10.5px var(--ds-num);
}
.ds-a11y__ticks .is-on {
  color: var(--ds-link);
  font-weight: 500;
}

/* ── interrupteurs ── */
.ds-a11y__toggles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ds-a11y__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 12px;
  border: 2px solid var(--ds-divide);
  border-radius: 4px;
  background: var(--ds-surface);
  color: var(--ds-text);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.ds-a11y__toggle:hover {
  border-color: var(--ds-ol);
}
.ds-a11y__toggle.is-on {
  border-color: var(--ds-ol);
  background: var(--ds-tint);
}
.ds-a11y__toggle-label {
  display: block;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.3;
}
.ds-a11y__toggle-hint {
  display: block;
  margin-top: 2px;
  color: var(--ds-muted);
  font-size: 12.5px;
  line-height: 1.35;
}
.ds-a11y__switch {
  position: relative;
  flex: none;
  width: 40px;
  height: 22px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-tint);
  transition: background 0.2s;
}
.ds-a11y__switch i {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 2px;
  background: var(--ds-ol);
  transition:
    transform 0.2s var(--ds-e-glisse),
    background 0.2s;
}
.is-on .ds-a11y__switch {
  background: var(--ds-action);
}
.is-on .ds-a11y__switch i {
  background: var(--ds-action-ink);
  transform: translateX(18px);
}

.ds-a11y__note {
  margin: 0;
  color: var(--ds-muted);
  font: 400 12px/1.5 var(--ds-num);
}
.ds-a11y__reset {
  align-self: center;
  padding: 4px 0;
  border: 0;
  background: none;
  color: var(--ds-link);
  font: 700 13.5px var(--ds-ui);
  cursor: pointer;
}
.ds-a11y__reset:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
