<script setup lang="ts">
import { normalizeOptions, type SegOptionInput } from './options'

const props = defineProps<{ tabs: readonly SegOptionInput[] }>()
const model = defineModel<string | number>({ required: true })

const items = () => normalizeOptions(props.tabs)
</script>

<template>
  <div class="flex gap-1 border-b-2 border-[var(--ds-divide)]" role="tablist">
    <button
      v-for="tab in items()"
      :key="tab.value"
      type="button"
      role="tab"
      :aria-selected="model === tab.value"
      class="-mb-[2px] whitespace-nowrap border-b-[3px] px-2.5 py-2 text-center text-[13px] font-bold transition-colors"
      :class="model === tab.value
        ? 'border-[var(--ds-ol)] text-[var(--ds-accent)]'
        : 'border-transparent text-[var(--ds-muted)] hover:text-[var(--ds-accent)]'"
      @click="model = tab.value"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
