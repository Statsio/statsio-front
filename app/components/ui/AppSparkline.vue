<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatCompactNumber } from '@/utils/number'

const props = withDefaults(
  defineProps<{
    points: number[]
    labels?: (string | number)[]
    color?: string
    height?: number
    fill?: boolean
    showAxis?: boolean
    /** Unité affichée après chaque valeur (axe + infobulle), ex. " ans", "%". */
    unit?: string
  }>(),
  {
    color: 'var(--color-primary)',
    height: 40,
    fill: true,
    showAxis: false,
    unit: '',
  },
)

const viewBoxWidth = 100

const containerRef = ref<HTMLElement | null>(null)
const hoveredIndex = ref<number | null>(null)

const pointsData = computed(() => {
  const { points, height, labels } = props
  if (points.length < 2) return []
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const stepX = viewBoxWidth / (points.length - 1)
  return points.map((value, i) => ({
    x: i * stepX,
    y: height - ((value - min) / range) * height,
    value,
    label: String(labels?.[i] ?? i + 1),
  }))
})

const linePoints = computed(() =>
  pointsData.value.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '),
)

const areaPoints = computed(() => {
  if (!linePoints.value) return ''
  return `0,${props.height} ${linePoints.value} ${viewBoxWidth},${props.height}`
})

const yAxisTicks = computed(() => {
  if (!props.points.length) return { max: 0, min: 0 }
  return { max: Math.max(...props.points), min: Math.min(...props.points) }
})

/** Evenly-spaced subset of points (max 4) so x-axis labels never overlap. */
const xAxisTicks = computed(() => {
  const data = pointsData.value
  if (data.length <= 4) return data
  const lastIndex = data.length - 1
  const indices = new Set([0, Math.round(lastIndex / 3), Math.round((lastIndex * 2) / 3), lastIndex])
  return [...indices].sort((a, b) => a - b).map((i) => data[i]!)
})

function formatValue(value: number) {
  return formatCompactNumber(value)
}

const hoveredPoint = computed(() =>
  hoveredIndex.value !== null ? (pointsData.value[hoveredIndex.value] ?? null) : null,
)

const tooltipStyle = computed(() => {
  if (!hoveredPoint.value) return {}
  const leftPercent = (hoveredPoint.value.x / viewBoxWidth) * 100
  const topPercent = (hoveredPoint.value.y / props.height) * 100
  return {
    left: `${leftPercent}%`,
    top: `${topPercent}%`,
  }
})

function setHoveredFromClientX(clientX: number) {
  if (!containerRef.value || pointsData.value.length === 0) return
  const rect = containerRef.value.getBoundingClientRect()
  const ratio = (clientX - rect.left) / rect.width
  const target = ratio * (pointsData.value.length - 1)
  hoveredIndex.value = Math.round(Math.min(Math.max(target, 0), pointsData.value.length - 1))
}

function handleMouseMove(event: MouseEvent) {
  setHoveredFromClientX(event.clientX)
}

function handleMouseLeave() {
  hoveredIndex.value = null
}

function handleFocus() {
  if (pointsData.value.length) hoveredIndex.value = pointsData.value.length - 1
}

function handleBlur() {
  hoveredIndex.value = null
}

function handleKeydown(event: KeyboardEvent) {
  if (!pointsData.value.length) return
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    hoveredIndex.value = Math.max(0, (hoveredIndex.value ?? 0) - 1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    hoveredIndex.value = Math.min(pointsData.value.length - 1, (hoveredIndex.value ?? 0) + 1)
  }
}
</script>

<template>
  <div class="flex gap-2">
    <div v-if="showAxis" class="mono flex shrink-0 flex-col justify-between text-right text-[10px] leading-none text-slate-400" :style="{ height: `${height}px` }">
      <span>{{ formatValue(yAxisTicks.max) }}{{ unit }}</span>
      <span>{{ formatValue(yAxisTicks.min) }}{{ unit }}</span>
    </div>

    <div class="min-w-0 flex-1">
      <div
        ref="containerRef"
        class="relative"
        :tabindex="pointsData.length ? 0 : undefined"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      >
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
          <line
            v-if="hoveredPoint"
            :x1="hoveredPoint.x"
            :x2="hoveredPoint.x"
            y1="0"
            :y2="height"
            stroke="currentColor"
            stroke-width="1"
            stroke-dasharray="2,2"
            class="text-slate-300"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-if="hoveredPoint"
            :cx="hoveredPoint.x"
            :cy="hoveredPoint.y"
            r="3"
            :fill="color"
            stroke="white"
            stroke-width="1.5"
            vector-effect="non-scaling-stroke"
          />
        </svg>

        <div
          v-if="hoveredPoint"
          class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] shadow-lg"
          :style="tooltipStyle"
        >
          <p class="mono font-semibold text-slate-300">{{ hoveredPoint.label }}</p>
          <p class="mono text-[12.5px] font-bold text-white">{{ formatValue(hoveredPoint.value) }}{{ unit }}</p>
        </div>

        <span class="sr-only">
          <template v-for="p in pointsData" :key="p.label + '-' + p.value">{{ p.label }} : {{ p.value }}. </template>
        </span>
      </div>

      <div v-if="showAxis" class="relative mt-1 h-3.5">
        <span
          v-for="(t, i) in xAxisTicks"
          :key="t.label + '-' + t.value"
          class="mono absolute text-[10px] leading-none text-slate-400"
          :class="i === 0 ? 'left-0' : i === xAxisTicks.length - 1 ? 'right-0' : '-translate-x-1/2'"
          :style="i !== 0 && i !== xAxisTicks.length - 1 ? { left: `${(t.x / viewBoxWidth) * 100}%` } : undefined"
        >
          {{ t.label }}
        </span>
      </div>
    </div>
  </div>
</template>
