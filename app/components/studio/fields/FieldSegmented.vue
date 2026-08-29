<script setup lang="ts">
import StudioField from './StudioField.vue'
import { normalizeOptions, type SegOptionInput } from './options'

const props = withDefaults(
  defineProps<{ label?: string; hint?: string; options: readonly SegOptionInput[] }>(),
  { label: '', hint: '' },
)

const model = defineModel<string | number>({ required: true })

const items = () => normalizeOptions(props.options)
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="opt in items()"
        :key="opt.value"
        type="button"
        class="whitespace-nowrap rounded-[9px] border-[1.5px] px-3 py-[9px] text-center text-[12px] font-bold transition-colors"
        :style="{ flex: String(opt.flex ?? 1) }"
        :class="model === opt.value
          ? 'border-[var(--studio-ink)] bg-[var(--studio-ink)] text-white'
          : 'border-[var(--studio-line-strong)] bg-white text-[color:color-mix(in_srgb,var(--studio-ink)_70%,transparent)] hover:border-[var(--color-primary)]'"
        @click="model = opt.value"
      >
        {{ opt.label }}
      </button>
    </div>
  </StudioField>
</template>
