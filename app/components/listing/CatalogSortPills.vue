<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T
  options: { value: T; label: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [T]
}>()
</script>

<template>
  <div class="flex shrink-0 items-center gap-0.5 rounded-full bg-[#f4f3f8] p-0.5" role="group" aria-label="Trier">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="rounded-full px-3.5 py-2 text-xs font-bold transition"
      :class="modelValue === option.value ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-slate-800'"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
