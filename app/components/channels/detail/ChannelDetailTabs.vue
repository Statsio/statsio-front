<script setup lang="ts">
import type { ChannelProfileTab } from '@/composables/useChannelProfile'

defineProps<{
  tabs: { key: ChannelProfileTab; label: string }[]
  modelValue: ChannelProfileTab
  accentColor: string
}>()

const emit = defineEmits<{ 'update:modelValue': [ChannelProfileTab] }>()
</script>

<template>
  <div class="flex gap-7 overflow-x-auto pt-6">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3.5 text-sm leading-none transition-colors"
      :class="
        modelValue === tab.key
          ? 'font-bold text-[#18181f]'
          : 'border-transparent font-semibold text-[#18181f]/50 hover:text-[#18181f]/75'
      "
      :style="modelValue === tab.key ? { borderColor: accentColor } : undefined"
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
