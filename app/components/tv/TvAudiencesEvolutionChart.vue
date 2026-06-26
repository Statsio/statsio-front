<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChart } from '@/composables/useChart'
import type { ChartData, ChartOptions } from 'chart.js'

const props = defineProps<{
  datasets: object[]
  years: number[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const chartData = computed<ChartData>(() => ({
  labels: props.years.map(String),
  datasets: props.datasets as ChartData['datasets'],
}))

const chartOptions = computed<ChartOptions>(() => ({
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (v: number | string) => `${v}%`,
        font: { size: 11 },
        color: '#94a3b8',
      },
      grid: { color: '#f1f5f9' },
    },
    x: {
      ticks: { font: { size: 11 }, color: '#94a3b8' },
      grid: { display: false },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (ctx: import('chart.js').TooltipItem<'line'>) => ` ${ctx.dataset.label} : ${ctx.parsed.y}%`,
      },
    },
  },
}))

useChart(canvasRef, 'line', () => chartData.value, () => chartOptions.value)
</script>

<template>
  <div class="h-72 w-full lg:h-80">
    <canvas ref="canvasRef" />
  </div>
</template>
