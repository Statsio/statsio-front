<script setup lang="ts">
import type { ContentTypeFilter } from '@/composables/useChannelContents'

defineProps<{
  modelValue: ContentTypeFilter
  options: { value: ContentTypeFilter; label: string }[]
}>()

const emit = defineEmits<{ 'update:modelValue': [ContentTypeFilter] }>()
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
