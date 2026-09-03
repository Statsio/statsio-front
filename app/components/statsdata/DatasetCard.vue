<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppSparkline from '@/components/ui/AppSparkline.vue'
import type { StatsDataDocument } from '@/api/studio'
import { getStatsDataVisual, seededSparklinePoints } from '@/utils/statsDataVisuals'
import { formatRowCount, relativeUpdate } from '@/utils/statsDataFormat'
import { statsDataDetailPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'

const props = withDefaults(
  defineProps<{
    document: StatsDataDocument
    featured?: boolean
  }>(),
  { featured: false },
)

const visual = computed(() => getStatsDataVisual(props.document.categories))

const rowCount = computed(() => props.document.datasets?.[0]?.row_count)

const sparklinePoints = computed(() => seededSparklinePoints(props.document.id))

const basePath = useContentBasePath()

const detailLink = computed(() => statsDataDetailPath(props.document, basePath.value))
</script>

<template>
  <RouterLink :to="detailLink" class="card group flex flex-col gap-3.5 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
    <div class="flex items-start justify-between gap-3">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl text-base" :class="visual.bg">{{ visual.emoji }}</div>
      <span
        v-if="featured"
        class="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.03em] text-[var(--color-primary)]"
      >
        Dataset live
      </span>
      <span v-else-if="document.categories?.[0]" class="mono text-[10px] text-slate-400">{{ document.categories[0] }}</span>
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
