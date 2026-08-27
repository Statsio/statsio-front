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
        class="rounded-[20px] border-[1.5px] px-[13px] py-2 font-mono text-[11.5px] font-semibold transition-colors"
        :class="model.includes(opt.value)
          ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
          : 'border-[var(--studio-line-strong)] bg-white text-[color:color-mix(in_srgb,var(--studio-ink)_65%,transparent)]'"
        @click="toggle(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </StudioField>
</template>
