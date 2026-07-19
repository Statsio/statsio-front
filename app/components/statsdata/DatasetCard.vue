<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppSparkline from '@/components/ui/AppSparkline.vue'
import type { StatsDataDocument } from '@/api/studio'
import { getStatsDataVisual } from '@/utils/statsDataVisuals'
import { formatRowCount, relativeUpdate } from '@/utils/statsDataFormat'
import { useContentBasePath } from '@/composables/useContentBasePath'

const props = defineProps<{
  document: StatsDataDocument
}>()

const visual = computed(() => getStatsDataVisual(props.document.categories, props.document.emoji))

const rowCount = computed(() => props.document.datasets?.[0]?.row_count)

// Decorative rhythm only — no per-dataset time series is exposed by the API yet, seeded
// from the document id so a given card always renders the same shape.
const sparklinePoints = computed(() => {
  let seed = 0
  for (const char of props.document.id) seed = (seed * 31 + char.charCodeAt(0)) % 9973
  const points: number[] = []
  for (let i = 0; i < 9; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    points.push(seed % 100)
  }
  return points
})

const basePath = useContentBasePath()

const detailLink = computed(() => {
  const doc = props.document
  if (!doc.slug) return `${basePath.value}/statsdata/${doc.id}`
  const first = doc.pages?.[0]
  return first
    ? `${basePath.value}/statsdata/${doc.slug}/${first.slug ?? first.id}`
    : `${basePath.value}/statsdata/${doc.slug}`
})
</script>

<template>
  <RouterLink :to="detailLink" class="card group flex flex-col gap-3.5 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
    <div class="flex items-start justify-between gap-3">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl text-base" :class="visual.bg">{{ visual.emoji }}</div>
      <span v-if="document.categories?.[0]" class="mono text-[10px] text-slate-400">{{ document.categories[0] }}</span>
    </div>

    <div>
      <h3 class="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-[var(--color-primary)]">
        {{ document.title }}
      </h3>
      <p v-if="document.author?.name" class="mt-1 text-xs text-slate-500">{{ document.author.name }}</p>
    </div>

    <AppSparkline :points="sparklinePoints" :color="visual.color" :height="32" />

    <div class="mono flex items-center justify-between text-[11px] text-slate-400">
      <span>{{ formatRowCount(rowCount) ?? '—' }}</span>
      <span>{{ relativeUpdate(document.updated_at) ?? '—' }}</span>
    </div>
  </RouterLink>
</template>
