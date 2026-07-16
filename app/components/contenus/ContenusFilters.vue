<script setup lang="ts">
import type { OwnerFilter } from '@/composables/useMyStudioContents'

defineProps<{
  modelValue: OwnerFilter
  options: { value: OwnerFilter; label: string }[]
}>()

const emit = defineEmits<{ 'update:modelValue': [OwnerFilter] }>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="rounded-full px-4 py-[9px] text-[13px] font-semibold transition-colors"
      :class="modelValue === opt.value ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
