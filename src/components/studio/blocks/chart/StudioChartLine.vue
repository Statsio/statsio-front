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

const linePoints = computed(() => {
  const n = Math.min(props.labels.length, props.values.length)
  if (n <= 1) return ''
  const w = 640
  const h = 240
  const padX = 24
  const padY = 18
  const innerW = w - padX * 2
  const innerH = h - padY * 2
  const m = maxVal.value || 1
  const pts: string[] = []
  for (let i = 0; i < n; i++) {
    const x = padX + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1))
    const y = padY + innerH - (innerH * (props.values[i] ?? 0)) / m
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
})
</script>

<template>
  <div class="flex flex-1 flex-col items-center gap-3">
    <svg viewBox="0 0 640 240" class="h-full w-full max-w-[720px]">
      <polyline
        :points="linePoints"
        fill="none"
        stroke="rgb(37 99 235)"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <div class="grid w-full max-w-[720px] grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600 sm:grid-cols-3">
      <div v-for="(lab, i) in labels.slice(0, 6)" :key="`l-${i}`" class="flex items-center justify-between gap-2">
        <span class="truncate font-medium text-slate-700">{{ lab }}</span>
        <span class="shrink-0 tabular-nums text-slate-500">{{ values[i] }}</span>
      </div>
    </div>
  </div>
</template>

