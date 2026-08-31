<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()
</script>

<template>
  <button
    type="button"
    class="flex shrink-0 items-center gap-2 rounded-full border-[1.5px] px-3.5 py-[7px] text-xs font-bold transition"
    :class="modelValue ? 'border-[#c4b5fd] bg-[#f2ecfd] text-primary' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
    :aria-pressed="modelValue"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span
      class="h-1.5 w-1.5 rounded-full"
      :class="modelValue ? 'bg-primary' : 'bg-slate-300'"
      aria-hidden="true"
    />
    {{ label }}
  </button>
</template>
