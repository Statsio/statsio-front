<script setup lang="ts">
defineProps<{ modelValue: boolean; label?: string; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    class="relative h-6 w-[42px] shrink-0 rounded-full transition-colors disabled:opacity-50"
    :class="modelValue ? 'bg-primary' : 'bg-slate-200'"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span
      class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all motion-reduce:transition-none"
      :class="modelValue ? 'left-[18px]' : 'left-0.5'"
    />
  </button>
</template>
