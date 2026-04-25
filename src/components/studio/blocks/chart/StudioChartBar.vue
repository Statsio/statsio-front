<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

const maxVal = computed(() => {
  const v = props.values
  if (!v.length) return 1
  return Math.max(...v, 1)
})
</script>

<template>
  <div class="flex h-44 items-end gap-1 sm:h-48 sm:gap-2">
    <div v-for="(lab, i) in labels" :key="i" class="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
      <div
        class="w-full max-w-[3.25rem] rounded-t-md bg-[color-mix(in_srgb,var(--color-primary)_78%,white)] transition-[height] motion-reduce:transition-none"
        :style="{ height: `${Math.round(Math.max(6, ((values[i] ?? 0) / maxVal) * 168))}px` }"
        :title="`${lab}: ${values[i]}`"
      />
      <span class="max-w-full truncate text-center text-[10px] font-medium text-slate-500 sm:text-xs">{{ lab }}</span>
    </div>
  </div>
</template>

