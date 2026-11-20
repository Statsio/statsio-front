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
    <div class="st-seg" role="group" :aria-label="label">
      <button
        v-for="opt in items()"
        :key="opt.value"
        type="button"
        :style="{ flex: String(opt.flex ?? 1) }"
        :aria-pressed="model === opt.value"
        @click="model = opt.value"
      >
        {{ opt.label }}
      </button>
    </div>
  </StudioField>
</template>
