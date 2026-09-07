<script setup lang="ts">
import type { ChannelProfileTab } from '@/composables/useChannelProfile'

defineProps<{
  tabs: { key: ChannelProfileTab; label: string }[]
  modelValue: ChannelProfileTab
}>()

const emit = defineEmits<{ 'update:modelValue': [ChannelProfileTab] }>()
</script>

<template>
  <div class="sticky top-40 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur lg:top-28">
    <div class="mx-auto flex max-w-[1240px] gap-1.5 overflow-x-auto px-4 sm:px-6 lg:px-8">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="shrink-0 whitespace-nowrap border-b-[2.5px] px-3.5 pb-3 pt-4 text-[13.5px] font-bold transition-colors"
        :class="
          modelValue === tab.key
            ? 'border-primary text-slate-950'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        "
        :aria-current="modelValue === tab.key ? 'page' : undefined"
        @click="emit('update:modelValue', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>
