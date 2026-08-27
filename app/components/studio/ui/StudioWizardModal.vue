<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModalA11y } from '@/composables/useModalA11y'

export interface WizardStep {
  key: string
  label: string
  hint?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    steps: WizardStep[]
    current: string
    /** Sidebar heading + blurb. */
    railTitle?: string
    railBlurb?: string
    summary?: string
    nextLabel?: string
    nextDisabled?: boolean
  }>(),
  { subtitle: '', railTitle: '', railBlurb: '', summary: '', nextLabel: 'Suivant', nextDisabled: false },
)

const emit = defineEmits<{ close: []; back: []; next: []; go: [key: string] }>()

const panel = ref<HTMLElement | null>(null)
useModalA11y(panel, () => emit('close'))

const currentIndex = computed(() => props.steps.findIndex((s) => s.key === props.current))
const canGoBack = computed(() => currentIndex.value > 0)

function stepState(i: number): 'done' | 'current' | 'todo' {
  if (i < currentIndex.value) return 'done'
  if (i === currentIndex.value) return 'current'
  return 'todo'
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[150] flex items-center justify-center bg-[rgba(18,18,26,0.5)] p-10 backdrop-blur-[3px]"
      @click.self="emit('close')"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        class="flex h-[640px] max-h-full w-[940px] max-w-full overflow-hidden rounded-[20px] bg-white font-sans shadow-[var(--studio-shadow-modal)]"
      >
        <!-- Step rail -->
        <div class="flex w-[246px] shrink-0 flex-col border-r border-[var(--studio-line)] bg-[var(--studio-panel)] px-5 py-6">
          <div class="text-[16.5px] font-extrabold leading-[1.3] text-[var(--studio-ink)]">{{ railTitle || title }}</div>
          <div v-if="railBlurb" class="mt-[5px] text-[12px] leading-[1.5] text-[var(--studio-muted)]">{{ railBlurb }}</div>

          <div class="mt-[22px] flex flex-col gap-0.5">
            <button
              v-for="(step, i) in steps"
              :key="step.key"
              type="button"
              class="grid grid-cols-[26px_1fr] items-center gap-[11px] rounded-[10px] px-2 py-[9px] text-left transition-colors"
              :class="stepState(i) === 'current' ? 'bg-white' : 'hover:bg-white/60'"
              :disabled="stepState(i) === 'todo'"
              @click="emit('go', step.key)"
            >
              <span
                class="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] font-mono text-[11.5px] font-semibold"
                :class="{
                  'border-transparent bg-[var(--color-primary)] text-white': stepState(i) === 'done',
                  'border-[var(--color-primary)] text-[var(--color-primary)]': stepState(i) === 'current',
                  'border-[var(--studio-line-strong)] text-[var(--studio-faint)]': stepState(i) === 'todo',
                }"
              >{{ stepState(i) === 'done' ? '✓' : i + 1 }}</span>
              <span class="min-w-0">
                <span
                  class="block text-[12.5px] font-bold leading-[1.3]"
                  :class="stepState(i) === 'todo' ? 'text-[var(--studio-faint)]' : 'text-[var(--studio-ink)]'"
                >{{ step.label }}</span>
                <span
                  v-if="step.hint"
                  class="mt-px block truncate text-[11px] text-[var(--studio-faint)]"
                >{{ step.hint }}</span>
              </span>
            </button>
          </div>

          <div class="flex-1" />
          <div v-if="summary" class="rounded-[11px] border border-[var(--studio-line)] bg-white px-[13px] py-3">
            <div class="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-[var(--studio-faint)]">Résumé</div>
            <div class="text-[12px] leading-[1.55] text-[color:color-mix(in_srgb,var(--studio-ink)_62%,transparent)]">{{ summary }}</div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--studio-line)] px-[26px] pb-3.5 pt-[22px]">
            <div class="min-w-0">
              <div class="text-[17px] font-extrabold text-[var(--studio-ink)]">{{ title }}</div>
              <div v-if="subtitle" class="mt-[3px] text-[12.5px] leading-[1.5] text-[var(--studio-muted)] [text-wrap:pretty]">{{ subtitle }}</div>
            </div>
            <button
              type="button"
              class="shrink-0 text-[16px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
              aria-label="Fermer"
              @click="emit('close')"
            >✕</button>
          </div>

          <div class="min-h-0 flex-1 overflow-auto px-[26px] pb-[26px] pt-5">
            <slot />
          </div>

          <div class="flex shrink-0 items-center justify-between gap-3.5 border-t border-[var(--studio-line)] px-[26px] py-[15px]">
            <button type="button" class="text-[13px] font-bold text-[var(--studio-faint)] hover:text-[var(--studio-ink)]" @click="emit('close')">Annuler</button>
            <div class="flex items-center gap-2.5">
              <button
                v-if="canGoBack"
                type="button"
                class="rounded-[10px] border-[1.5px] border-[var(--studio-line-strong)] px-[18px] py-[11px] text-[13px] font-bold text-[var(--studio-ink)]"
                @click="emit('back')"
              >Retour</button>
              <button
                type="button"
                class="studio-gradient rounded-[10px] px-[22px] py-3 text-[13.5px] font-bold text-white disabled:opacity-40"
                :disabled="nextDisabled"
                @click="emit('next')"
              >{{ nextLabel }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
