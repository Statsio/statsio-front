<script setup lang="ts">
import StudioField from './StudioField.vue'

withDefaults(
  defineProps<{ label?: string; hint?: string; placeholder?: string; mono?: boolean }>(),
  { label: '', hint: '', placeholder: '', mono: false },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <input
      v-model="model"
      type="text"
      class="studio-input"
      :class="{ 'studio-input--mono': mono }"
      :placeholder="placeholder"
    />
  </StudioField>
</template>
