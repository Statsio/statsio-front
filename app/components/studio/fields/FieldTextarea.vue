<script setup lang="ts">
import StudioField from './StudioField.vue'

withDefaults(
  defineProps<{ label?: string; hint?: string; placeholder?: string; rows?: number }>(),
  { label: '', hint: '', placeholder: '', rows: 4 },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <StudioField :label="label" :hint="hint">
    <textarea
      v-model="model"
      class="studio-input resize-y leading-[1.55]"
      :rows="rows"
      :placeholder="placeholder"
    />
  </StudioField>
</template>
