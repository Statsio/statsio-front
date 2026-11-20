<script setup lang="ts">
import StudioField from './StudioField.vue'

export interface PickerChip {
  text: string
  /** muted = grey tag, otherwise violet tag */
  muted?: boolean
}

withDefaults(
  defineProps<{
    label?: string
    hint?: string
    /** Main line describing the current value. */
    value: string
    /** Right-aligned call to action, e.g. "Configurer" / "Changer". */
    action?: string
    chips?: PickerChip[]
    sub?: string
  }>(),
  { label: '', hint: '', action: 'Modifier', chips: () => [], sub: '' },
)

const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 rounded-[4px] border-2 border-[var(--ds-ol)] bg-[var(--ds-surface)] px-3 py-2.5 text-left shadow-[3px_3px_0_var(--ds-sh)] transition-transform hover:-translate-x-px hover:-translate-y-px"
      @click="emit('open')"
    >
      <span class="flex min-w-0 flex-col gap-1.5">
        <span class="text-[13px] font-bold leading-[1.35] text-[var(--studio-ink)] [text-wrap:pretty]">{{ value }}</span>
        <span v-if="chips.length" class="flex flex-wrap gap-1.5">
          <span
            v-for="(chip, i) in chips"
            :key="i"
            class="st-col"
            :class="chip.muted
              ? 'bg-[var(--studio-wash)] text-[color:color-mix(in_srgb,var(--studio-ink)_60%,transparent)]'
              : 'bg-[var(--studio-tag)] text-[var(--studio-tag-ink)]'"
          >{{ chip.text }}</span>
        </span>
        <span v-if="sub" class="text-[11.5px] leading-[1.45] text-[var(--studio-faint)]">{{ sub }}</span>
      </span>
      <span class="shrink-0 whitespace-nowrap text-[11.5px] font-bold text-[var(--color-primary)]">{{ action }}</span>
    </button>
  </StudioField>
</template>
