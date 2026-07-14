<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    points: number[]
    color?: string
    height?: number
    fill?: boolean
  }>(),
  {
    color: 'var(--color-primary)',
    height: 40,
    fill: true,
  },
)

const viewBoxWidth = 100

const linePoints = computed(() => {
  const { points, height } = props
  if (points.length < 2) return ''
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const stepX = viewBoxWidth / (points.length - 1)
  return points
    .map((value, i) => {
      const x = i * stepX
      const y = height - ((value - min) / range) * height
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
})

const areaPoints = computed(() => {
  if (!linePoints.value) return ''
  return `0,${props.height} ${linePoints.value} ${viewBoxWidth},${props.height}`
})
</script>

<template>
  <svg
    width="100%"
    :height="height"
    :viewBox="`0 0 ${viewBoxWidth} ${height}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <polyline v-if="fill" :points="areaPoints" :fill="color" fill-opacity="0.12" stroke="none" />
    <polyline
      :points="linePoints"
      fill="none"
      :stroke="color"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
