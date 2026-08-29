<script setup lang="ts">
import { normalizeOptions, type SegOptionInput } from './options'

const props = defineProps<{ tabs: readonly SegOptionInput[] }>()
const model = defineModel<string | number>({ required: true })

const items = () => normalizeOptions(props.tabs)
</script>

<template>
  <div class="flex gap-1 rounded-full bg-[var(--studio-wash)] p-[5px]">
    <button
      v-for="tab in items()"
      :key="tab.value"
      type="button"
      class="flex-1 whitespace-nowrap rounded-full py-[9px] text-center text-[12.5px] font-bold transition-colors"
      :class="model === tab.value
        ? 'bg-white text-[var(--studio-ink)] shadow-[0_1px_2px_rgba(20,20,30,0.12)]'
        : 'text-[var(--studio-muted)] hover:text-[var(--studio-ink)]'"
      @click="model = tab.value"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
