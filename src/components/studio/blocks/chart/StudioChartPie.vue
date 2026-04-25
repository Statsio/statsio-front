<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  labels: string[]
  values: number[]
  kind: 'pie' | 'donut'
}>()

const pieSlices = computed(() => {
  const n = Math.min(props.labels.length, props.values.length)
  const cleaned: Array<{ label: string; value: number }> = []
  for (let i = 0; i < n; i++) {
    const v = Number(props.values[i] ?? 0)
    if (!Number.isFinite(v) || v <= 0) continue
    cleaned.push({ label: props.labels[i] ?? '', value: v })
  }
  const total = cleaned.reduce((s, x) => s + x.value, 0)
  if (total <= 0) return { total: 0, arcs: [] as Array<{ d: string; label: string; pct: number; color: string }> }

  const colors = ['#2563eb', '#06b6d4', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#64748b']
  const cx = 160
  const cy = 120
  const r = 86
  let angle = -Math.PI / 2
  const arcs: Array<{ d: string; label: string; pct: number; color: string }> = []
  cleaned.slice(0, 12).forEach((slice, idx) => {
    const a0 = angle
    const a1 = angle + (slice.value / total) * Math.PI * 2
    angle = a1
    const x0 = cx + r * Math.cos(a0)
    const y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    const large = a1 - a0 > Math.PI ? 1 : 0
    const d = `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
    arcs.push({
      d,
      label: slice.label,
      pct: slice.value / total,
      color: colors[idx % colors.length]!,
    })
  })
  return { total, arcs }
})
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-4">
    <div class="flex w-full items-center justify-center gap-6">
      <svg viewBox="0 0 320 240" class="h-44 w-44">
        <path
          v-for="(arc, i) in pieSlices.arcs"
          :key="`p-${i}`"
          :d="arc.d"
          :fill="arc.color"
          stroke="white"
          stroke-width="2"
        />
        <circle v-if="kind === 'donut'" cx="160" cy="120" r="56" fill="white" opacity="1" />
      </svg>
      <div class="min-w-0 space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Répartition</p>
        <div class="space-y-1.5">
          <div v-for="(arc, i) in pieSlices.arcs.slice(0, 6)" :key="`pl-${i}`" class="flex items-center gap-2 text-sm">
            <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: arc.color }" />
            <span class="truncate text-slate-700">{{ arc.label || '—' }}</span>
            <span class="shrink-0 text-xs tabular-nums text-slate-500">{{ Math.round(arc.pct * 100) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

