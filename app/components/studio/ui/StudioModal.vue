<script setup lang="ts">
import { ref } from 'vue'
import { useModalA11y } from '@/composables/useModalA11y'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Card width in px (max 100%). */
    width?: number
    /** Fixed card height in px — otherwise the card hugs its content. */
    height?: number
    /** Hide the default close (✕) button. */
    hideClose?: boolean
    /** Sous-marque (`tvstats`, `medistats`) — retinte la coque téléportée hors du layout. */
    theme?: string
  }>(),
  { subtitle: '', width: 680, hideClose: false, theme: undefined },
)

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
useModalA11y(panel, () => emit('close'))
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[150] flex items-center justify-center bg-[color-mix(in_srgb,var(--ds-text)_35%,transparent)] p-4 sm:p-10"
      @click.self="emit('close')"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        class="flex max-h-full w-full flex-col st-modal overflow-hidden rounded-[6px] border-2 border-[var(--ds-ol)] bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-[6px_6px_0_var(--ds-sh)]"
        :data-theme="theme || undefined"
        :style="{ width: props.width + 'px', height: props.height ? props.height + 'px' : undefined }"
      >
        <div class="flex shrink-0 items-start justify-between gap-4 border-b-2 border-[var(--ds-divide)] px-[26px] pb-[15px] pt-[22px]">
          <div class="min-w-0">
            <div class="st-h2 !text-[26px]">{{ title }}</div>
            <div
              v-if="subtitle"
              class="mt-[3px] text-[12.5px] leading-[1.5] text-[var(--studio-muted)] [text-wrap:pretty]"
            >
              {{ subtitle }}
            </div>
          </div>
          <button
            v-if="!hideClose"
            type="button"
            class="shrink-0 text-[16px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
            aria-label="Fermer"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-auto px-[26px] py-[22px]">
          <slot />
        </div>

        <div
          v-if="$slots.footer"
          class="flex shrink-0 items-center justify-between gap-3.5 border-t-2 border-[var(--ds-divide)] px-[26px] py-[15px]"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
