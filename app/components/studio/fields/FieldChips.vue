<script setup lang="ts">
import StudioField from './StudioField.vue'
import { normalizeOptions, type SegOptionInput } from './options'

const props = withDefaults(
  defineProps<{ label?: string; hint?: string; options: readonly SegOptionInput[] }>(),
  { label: '', hint: '' },
)

/** Multi-select: the model is the array of selected values. */
const model = defineModel<(string | number)[]>({ default: () => [] })

const items = () => normalizeOptions(props.options)

function toggle(value: string | number) {
  model.value = model.value.includes(value)
    ? model.value.filter((v) => v !== value)
    : [...model.value, value]
}
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <div class="flex flex-wrap gap-[7px]">
      <button
        v-for="opt in items()"
        :key="opt.value"
        type="button"
        class="rounded-full border-2 px-3 py-1.5 font-mono text-[11.5px] font-medium transition-colors"
        :aria-pressed="model.includes(opt.value)"
        :class="model.includes(opt.value)
          ? 'border-[var(--ds-ol)] bg-[var(--ds-action)] text-[var(--ds-action-ink)]'
          : 'border-[var(--ds-divide)] bg-[var(--ds-surface)] text-[var(--ds-muted)] hover:border-[var(--ds-ol)]'"
        @click="toggle(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </StudioField>
</template>
