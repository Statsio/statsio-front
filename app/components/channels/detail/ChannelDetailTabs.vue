<script setup lang="ts">
import type { ChannelProfileTab } from '@/composables/useChannelProfile'

defineProps<{
  tabs: { key: ChannelProfileTab; label: string }[]
  modelValue: ChannelProfileTab
}>()

const emit = defineEmits<{ 'update:modelValue': [ChannelProfileTab] }>()
</script>

<template>
  <div class="mt-7 flex gap-1.5 overflow-x-auto">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="shrink-0 whitespace-nowrap rounded-t-xl px-5 py-3 text-sm transition-colors"
      :class="
        modelValue === tab.key
          ? 'bg-[var(--color-auth-wash)] font-bold text-[#18181f]'
          : 'font-semibold text-[#18181f]/50 hover:text-[#18181f]/75'
      "
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
